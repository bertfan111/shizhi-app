/**
 * assets/images 去重脚本
 *
 * 背景：早期 build-images.ts 在 GPT-image 调用失败时会落到同一张占位图，
 *      最终 695 张 PNG 里只有十几张是真正不同的插画，其余全是占位副本。
 *
 * 策略：
 *   1. 对 assets/images/*.png 逐个计算 MD5。
 *   2. hash 唯一出现 → 保留（真正的有效插画）。
 *   3. hash 出现 ≥ 2 次 → 全部删除（视为失败占位图）。
 *   4. 同步重写 src/data/imageMap.ts，只保留仍存在文件的条目。
 *   5. 同步修改 assets/data/characters.json：把已删除字符的 image 字段置空。
 *
 * 用法：
 *   node scripts/dedupe-images.js            # dry-run，仅打印计划
 *   node scripts/dedupe-images.js --apply    # 真正执行
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets/images');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');
const IMAGE_MAP_PATH = path.join(ROOT, 'src/data/imageMap.ts');

const APPLY = process.argv.includes('--apply');

function md5(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(buf).digest('hex');
}

function fmtMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function scan() {
  const files = fs.readdirSync(IMAGES_DIR).filter((n) => n.toLowerCase().endsWith('.png'));
  const byHash = new Map(); // hash -> [{name, size}]
  let totalBytes = 0;

  for (const name of files) {
    const full = path.join(IMAGES_DIR, name);
    const stat = fs.statSync(full);
    totalBytes += stat.size;
    const h = md5(full);
    const arr = byHash.get(h) || [];
    arr.push({ name, size: stat.size, full });
    byHash.set(h, arr);
  }

  const keep = []; // {name, size}
  const drop = []; // {name, size}
  for (const arr of byHash.values()) {
    if (arr.length === 1) {
      keep.push(arr[0]);
    } else {
      for (const f of arr) drop.push(f);
    }
  }

  return { files, byHash, keep, drop, totalBytes };
}

function rewriteImageMap(keptCharsSet) {
  const original = fs.readFileSync(IMAGE_MAP_PATH, 'utf8');

  // 解析现有 require 行，过滤出仍保留的
  const lineRe = /^\s*'([^']+)':\s*require\('\.\.\/\.\.\/assets\/images\/([^']+)'\),\s*$/;
  const keptLines = [];
  for (const line of original.split('\n')) {
    const m = line.match(lineRe);
    if (m) {
      const char = m[1];
      const file = m[2];
      if (keptCharsSet.has(file)) {
        keptLines.push(`  '${char}': require('../../assets/images/${file}'),`);
      }
    }
  }

  const out =
    [
      '/**',
      ' * 字符 → 图片资源映射表',
      ' * ⚠️ 此文件由 scripts/build-images.ts / scripts/dedupe-images.js 自动维护。',
      ' */',
      '',
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
      'const map: Record<string, any> = {',
      ...keptLines,
      '};',
      '',
      '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
      'export function getImageFor(char: string): any | null {',
      '  return map[char] ?? null;',
      '}',
      '',
      'export function hasImageFor(char: string): boolean {',
      '  return Boolean(map[char]);',
      '}',
      '',
    ].join('\n');

  return { out, keptCount: keptLines.length };
}

function rewriteCharactersJson(keptFilesSet) {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const ds = JSON.parse(raw);
  let cleared = 0;
  for (const c of ds.characters) {
    if (c.image && !keptFilesSet.has(c.image)) {
      delete c.image;
      cleared += 1;
    }
  }
  return { json: JSON.stringify(ds, null, 2), cleared };
}

function main() {
  console.log('===== assets/images 去重 =====');
  console.log('扫描中…');
  const { files, byHash, keep, drop, totalBytes } = scan();

  const droppedBytes = drop.reduce((s, f) => s + f.size, 0);
  const keptBytes = keep.reduce((s, f) => s + f.size, 0);

  console.log(`总文件数      : ${files.length}`);
  console.log(`唯一 hash 组数: ${byHash.size}`);
  console.log(`保留（有效）  : ${keep.length} 个，合计 ${fmtMB(keptBytes)}`);
  console.log(`删除（占位）  : ${drop.length} 个，合计 ${fmtMB(droppedBytes)}`);
  console.log(`当前总占用    : ${fmtMB(totalBytes)}`);
  console.log('');
  console.log('—— 保留下来的有效插画 ——');
  for (const f of keep.sort((a, b) => a.name.localeCompare(b.name, 'zh'))) {
    console.log(`  ${f.name}  (${f.size} 字节)`);
  }
  console.log('');

  const keptFilesSet = new Set(keep.map((f) => f.name));

  const { out: newMap, keptCount } = rewriteImageMap(keptFilesSet);
  const { json: newJson, cleared } = rewriteCharactersJson(keptFilesSet);

  console.log(`imageMap.ts 将保留 ${keptCount} 条 require`);
  console.log(`characters.json 将清空 ${cleared} 个 image 字段`);
  console.log('');

  if (!APPLY) {
    console.log('🟡 dry-run 模式（未做任何修改）。确认无误后请执行：');
    console.log('   node scripts/dedupe-images.js --apply');
    return;
  }

  console.log('🟢 开始写入…');
  let removed = 0;
  for (const f of drop) {
    fs.unlinkSync(f.full);
    removed += 1;
  }
  fs.writeFileSync(IMAGE_MAP_PATH, newMap, 'utf8');
  fs.writeFileSync(DATA_PATH, newJson, 'utf8');

  const afterBytes = keep.reduce((s, f) => s + f.size, 0);
  console.log(`✅ 已删除 ${removed} 个占位图`);
  console.log(`✅ 已重写 src/data/imageMap.ts（${keptCount} 条 require）`);
  console.log(`✅ 已重写 assets/data/characters.json（清空 ${cleared} 个 image 字段）`);
  console.log(`💾 images 目录占用：${fmtMB(totalBytes)} → ${fmtMB(afterBytes)}（节省 ${fmtMB(totalBytes - afterBytes)}）`);
}

main();
