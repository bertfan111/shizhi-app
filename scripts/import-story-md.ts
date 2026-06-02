import * as fs from 'node:fs';
import * as path from 'node:path';
import { annotateText, getCharPinyin } from './generate-pinyin';
import { getVolumeOf } from './wordlist';

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
const BACKUP_PATH = path.join(ROOT, 'assets/data/characters.before-story-md.json');
const DEFAULT_SOURCE =
  'c:\\N-21AJPF4BD0J5-Data\\yiqzhou\\Documents\\WeChat Files\\zyq1990zhou\\FileStorage\\File\\2026-05\\故事.md';

const SOURCE_PATH = process.argv[2] || DEFAULT_SOURCE;

function normalizeStory(text: string): string {
  return text
    .replace(/\r/g, '')
    .replace(/\s+/g, '')
    .replace(/^[:：]/, '')
    .trim();
}

function parseStories(markdown: string): Map<string, string> {
  const stories = new Map<string, string>();
  const re = /【([^】]+)】/g;
  const matches = Array.from(markdown.matchAll(re));

  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1].trim();
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? markdown.length : markdown.length;
    const body = normalizeStory(markdown.slice(start, end));

    // 只导入单字故事；组合故事用于阅读素材，不适合挂到单个字卡。
    if (Array.from(key).length !== 1 || key.includes('、')) continue;
    if (!body) continue;
    stories.set(key, body);
  }

  return stories;
}

function main() {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error(`找不到故事文件：${SOURCE_PATH}`);
  }
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error(`找不到数据文件：${DATA_PATH}`);
  }

  const markdown = fs.readFileSync(SOURCE_PATH, 'utf8');
  const stories = parseStories(markdown);
  const ds = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as Dataset;

  if (!fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(DATA_PATH, BACKUP_PATH);
  }

  let replaced = 0;
  let added = 0;

  for (const [char, text] of stories) {
    let item = ds.characters.find((c) => c.char === char);
    if (!item) {
      item = {
        char,
        pinyin: getCharPinyin(char),
        volume: getVolumeOf(char),
        story: { text: '', annotated: [] },
        image: '',
      };
      ds.characters.push(item);
      added++;
    } else {
      replaced++;
    }

    item.story = {
      text,
      annotated: annotateText(text),
    };
  }

  ds.generatedAt = new Date().toISOString();
  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');

  console.log(`读取故事条目：${stories.size}`);
  console.log(`替换已有字：${replaced}`);
  console.log(`新增字：${added}`);
  console.log(`备份文件：${path.relative(ROOT, BACKUP_PATH)}`);
  console.log(`输出文件：${path.relative(ROOT, DATA_PATH)}`);
}

main();
