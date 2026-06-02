/**
 * 只根据现有 stories 生成插画：
 * - 读取 assets/data/characters.json
 * - 用 GPT-image 2.0 为每个字的故事生成 PNG
 * - 保存到 assets/images/<汉字>.png
 * - 自动重写 src/data/imageMap.ts，保证 App 打包时包含这些静态图片
 *
 * 注意：这个脚本只在开发者机器 / CI 跑，生成结果会被打进 App。
 * App 运行时不会调用任何图像 API。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ImageGenerator } from './generate-images';

interface Character {
  char: string;
  pinyin: string;
  volume: 'upper' | 'lower' | 'unknown';
  story: {
    text: string;
    annotated: { char: string; pinyin: string | null }[];
  };
  image: string;
}

interface Dataset {
  version: string;
  generatedAt: string;
  characters: Character[];
}

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');
const IMAGES_DIR = path.join(ROOT, 'assets/images');
const IMAGE_MAP_PATH = path.join(ROOT, 'src/data/imageMap.ts');

function truthyEnv(name: string): boolean {
  return ['1', 'true', 'yes'].includes(String(process.env[name] || '').toLowerCase());
}

function loadDataset(): Dataset {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`找不到 ${path.relative(ROOT, DATA_PATH)}，请先运行 npm run build:stories:local`);
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as Dataset;
}

function writeDataset(ds: Dataset) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');
}

function writeImageMap(characters: Character[]) {
  const lines: string[] = [
    '/**',
    ' * 字符 → 图片资源映射表',
    ' * ⚠️ 此文件由 scripts/build-images.ts 自动生成，请勿手动修改。',
    ' */',
    '',
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
    'const map: Record<string, any> = {',
  ];

  for (const c of characters) {
    if (c.image && fs.existsSync(path.join(IMAGES_DIR, c.image))) {
      lines.push(`  '${c.char}': require('../../assets/images/${c.image}'),`);
    }
  }

  lines.push('};');
  lines.push('');
  lines.push('// eslint-disable-next-line @typescript-eslint/no-explicit-any');
  lines.push('export function getImageFor(char: string): any | null {');
  lines.push('  return map[char] ?? null;');
  lines.push('}');
  lines.push('');
  lines.push('export function hasImageFor(char: string): boolean {');
  lines.push('  return Boolean(map[char]);');
  lines.push('}');
  lines.push('');

  fs.writeFileSync(IMAGE_MAP_PATH, lines.join('\n'), 'utf8');
}

function getTargets(characters: Character[]): Character[] {
  let targets = characters;
  if (process.env.ONLY) {
    const only = new Set(process.env.ONLY.split(/[,，\s]+/).filter(Boolean));
    targets = targets.filter((c) => only.has(c.char));
  }
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : NaN;
  if (Number.isFinite(limit) && limit > 0) targets = targets.slice(0, limit);
  return targets;
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      '缺少 OPENAI_API_KEY。GPT-image 2.0 生成必须调用图像模型服务；Key 只用于本地一次性生成，不会写入 App。',
    );
  }

  const ds = loadDataset();
  const baseURL = process.env.OPENAI_BASE_URL || undefined;
  const force = truthyEnv('FORCE_IMAGES') || truthyEnv('FORCE_ALL');
  const targets = getTargets(ds.characters);
  const gen = new ImageGenerator({ apiKey, baseURL, outputDir: IMAGES_DIR });
  const failed: { char: string; reason: string }[] = [];

  console.log(`图像模型: ${process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.0'}`);
  console.log(`目标插画: ${targets.length} 张`);

  let done = 0;
  for (const item of targets) {
    const stage = `[${++done}/${targets.length}] ${item.char}`;
    try {
      if (!item.story?.text) {
        throw new Error('缺少故事文本，无法按故事生成插画');
      }
      const file = path.join(IMAGES_DIR, `${item.char}.png`);
      if (!force && fs.existsSync(file)) {
        item.image = `${item.char}.png`;
        if (done % 50 === 0) console.log(`${stage} 已存在，跳过`);
        continue;
      }
      if (force && fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
      console.log(`${stage} 生成插画...`);
      await gen.generate(item.char, item.story.text);
      item.image = `${item.char}.png`;
      writeDataset(ds);
      writeImageMap(ds.characters);
    } catch (e: unknown) {
      const reason = e instanceof Error ? e.message : String(e);
      console.error(`${stage} 失败: ${reason}`);
      failed.push({ char: item.char, reason });
      writeDataset(ds);
      writeImageMap(ds.characters);
    }
  }

  writeDataset(ds);
  writeImageMap(ds.characters);
  console.log('========== 插画生成完成 ==========');
  console.log(`成功/已有: ${ds.characters.filter((c) => c.image).length}    失败: ${failed.length}`);
  if (failed.length) {
    console.log('失败列表：');
    for (const f of failed) console.log(` - ${f.char}: ${f.reason}`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
