/**
 * 一键构建数据集：
 *   字表 → 拼音 → 故事 → 插图 → characters.json + imageMap.ts
 *
 * 设计要点：
 *  - 断点续跑：每完成一个字立即落盘；已生成过的字（且图片存在）默认跳过。
 *  - 失败不中断：单字失败会记录到日志，最后汇总，继续处理后面的字。
 *  - 限流：可通过 CONCURRENCY 环境变量控制并发，默认 2。
 *  - 价格友好：可通过 LIMIT 限制处理的字数，先小范围试跑。
 *
 * 用法：
 *   1. npm install
 *   2. 在开发者本机 / CI 临时设置 OPENAI_API_KEY 环境变量
 *   3. npm run build:dataset
 *
 *   PowerShell 示例：
 *   只跑前 10 个字：        $env:LIMIT="10"; npm run build:dataset; Remove-Item Env:LIMIT
 *   只跑指定字：            $env:ONLY="天,地,人"; npm run build:dataset; Remove-Item Env:ONLY
 *   重写所有故事（保留图）： $env:FORCE_STORIES="1"; npm run build:dataset; Remove-Item Env:FORCE_STORIES
 *   重写所有图（保留故事）： $env:FORCE_IMAGES="1"; npm run build:dataset; Remove-Item Env:FORCE_IMAGES
 *   全部重写：             $env:FORCE_ALL="1"; npm run build:dataset; Remove-Item Env:FORCE_ALL
 */
import * as fs from 'fs';
import * as path from 'path';
import { allChars, getVolumeOf } from './wordlist';
import { annotateText, getCharPinyin } from './generate-pinyin';
import { StoryGenerator } from './generate-stories';
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
const DATA_PATH = path.join(ROOT, 'assets', 'data', 'characters.json');
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');
const IMAGE_MAP_PATH = path.join(ROOT, 'src', 'data', 'imageMap.ts');

function loadExisting(): Map<string, Character> {
  if (!fs.existsSync(DATA_PATH)) return new Map();
  try {
    const raw = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const list: Character[] = Array.isArray(raw) ? raw : raw.characters || [];
    return new Map(list.map((c) => [c.char, c]));
  } catch (e) {
    console.warn('读取已有 characters.json 失败，将从头开始:', e);
    return new Map();
  }
}

function writeDataset(map: Map<string, Character>): void {
  const characters = Array.from(map.values());
  const dataset: Dataset = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    characters,
  };
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(dataset, null, 2), 'utf8');
}

function writeImageMap(map: Map<string, Character>): void {
  const lines: string[] = [
    '/**',
    ' * 字符 → 图片资源映射表',
    ' * ⚠️ 此文件由 scripts/build-dataset.ts 自动生成，请勿手动修改。',
    ' */',
    '',
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
    'const map: Record<string, any> = {',
  ];
  for (const c of map.values()) {
    if (fs.existsSync(path.join(IMAGES_DIR, c.image))) {
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
  fs.writeFileSync(IMAGE_MAP_PATH, lines.join('\n'), 'utf8');
}

function getTargetChars(): string[] {
  if (process.env.ONLY) {
    return process.env.ONLY.split(/[,，\s]+/).filter(Boolean);
  }
  const all = allChars.slice();
  const limit = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : NaN;
  return Number.isFinite(limit) && limit > 0 ? all.slice(0, limit) : all;
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('缺少环境变量 OPENAI_API_KEY。请只在开发者本机 / CI 临时设置它；不要把 Key 写入 App 或仓库文件。');
    process.exit(1);
  }
  const baseURL = process.env.OPENAI_BASE_URL || undefined;

  // 重写开关
  const forceAll = ['1', 'true', 'yes'].includes(String(process.env.FORCE_ALL || '').toLowerCase());
  const forceStories =
    forceAll || ['1', 'true', 'yes'].includes(String(process.env.FORCE_STORIES || '').toLowerCase());
  const forceImages =
    forceAll || ['1', 'true', 'yes'].includes(String(process.env.FORCE_IMAGES || '').toLowerCase());

  if (forceStories || forceImages) {
    console.log(
      `🔁 重写模式：${[
        forceStories ? '故事' : null,
        forceImages ? '插图' : null,
      ]
        .filter(Boolean)
        .join(' + ')}`,
    );
  }

  const targets = getTargetChars();
  console.log(`目标字数: ${targets.length}`);

  const existing = loadExisting();
  const storyGen = new StoryGenerator({ apiKey, baseURL });
  const imgGen = new ImageGenerator({ apiKey, baseURL, outputDir: IMAGES_DIR });

  let done = 0;
  let skipped = 0;
  const failed: { char: string; reason: string }[] = [];

  for (const char of targets) {
    const stage = `[${++done}/${targets.length}] ${char}`;
    try {
      const prev = existing.get(char);
      const hasStory = Boolean(prev?.story?.text);
      const hasImage = imgGen.exists(char);
      const needStory = forceStories || !hasStory;
      const needImage = forceImages || !hasImage;

      // 全都不需要做就跳过
      if (!needStory && !needImage) {
        skipped++;
        if (done % 50 === 0) console.log(`${stage} 已存在，跳过`);
        continue;
      }

      // 1) 拼音
      const charPinyin = getCharPinyin(char);

      // 2) 故事
      let storyText = prev?.story?.text || '';
      if (needStory) {
        console.log(`${stage} 生成故事...`);
        storyText = await storyGen.generate(char);
      }
      const annotated = annotateText(storyText);

      // 3) 图片
      if (needImage) {
        console.log(`${stage} 生成插图...`);
        await imgGen.generate(char, storyText);
      }

      // 4) 落盘
      existing.set(char, {
        char,
        pinyin: charPinyin,
        volume: getVolumeOf(char),
        story: { text: storyText, annotated },
        image: `${char}.png`,
      });

      // 每完成一个字就写一次，保证断点续跑
      writeDataset(existing);
      writeImageMap(existing);
    } catch (e: unknown) {
      const reason = e instanceof Error ? e.message : String(e);
      console.error(`${stage} 失败: ${reason}`);
      failed.push({ char, reason });
    }
  }

  // 最终再写一次
  writeDataset(existing);
  writeImageMap(existing);

  console.log('========== 完成 ==========');
  console.log(`成功: ${existing.size}    跳过: ${skipped}    失败: ${failed.length}`);
  if (failed.length > 0) {
    console.log('失败列表：');
    for (const f of failed) console.log(` - ${f.char}: ${f.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
