import * as fs from 'fs';
import * as path from 'path';
import { annotateText } from './generate-pinyin';

interface PinyinChar {
  char: string;
  pinyin: string | null;
}

interface Story {
  text: string;
  annotated: PinyinChar[];
}

interface Character {
  char: string;
  pinyin: string;
  volume: 'upper' | 'lower' | 'unknown';
  story: Story;
  image: string;
}

interface Dataset {
  version: string;
  generatedAt: string;
  characters: Character[];
}

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');
const STORIES_PATH = path.join(__dirname, 'user-stories.txt');

function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error(`未找到 ${DATA_PATH}`);
    process.exit(1);
  }

  const ds: Dataset = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const content = fs.readFileSync(STORIES_PATH, 'utf8');

  // Regex to match "### 1. 明（日+月）\n\n太阳和月亮..."
  const blocks = content.split(/^### \d+\.\s+/m).filter(Boolean);

  let updatedCount = 0;
  let notFound = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const titleLine = lines[0]; // e.g. "明（日+月）"
    const charMatch = titleLine.match(/^([^\s（(]+)/);
    if (!charMatch) continue;

    const char = charMatch[1];
    
    // Join the rest as story text
    const textLines = lines.slice(1).map(l => l.trim()).filter(Boolean);
    if (textLines.length === 0) continue;
    
    const text = textLines.join('\n');

    const cObj = ds.characters.find(c => c.char === char);
    const storyObj = {
      text: text,
      annotated: annotateText(text)
    };
    if (cObj) {
      cObj.story = storyObj;
      updatedCount++;
    } else {
      // Add missing characters
      const pinyinStr = annotateText(char)[0].pinyin || '';
      ds.characters.push({
        char: char,
        pinyin: pinyinStr,
        volume: 'unknown',
        story: storyObj,
        image: ''
      });
      updatedCount++;
      notFound.push(char);
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');
  console.log(`成功更新了 ${updatedCount} 个字的故事！`);
  if (notFound.length > 0) {
    console.log(`未找到以下字（字库中没有）：${notFound.join(', ')}`);
  }
}

main();