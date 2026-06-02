/**
 * 补齐 characters.json 里"有 story.text 但 annotated 为空"的逐字拼音。
 * 上册/下册故事文本被重写后没有重新注音，导致故事页（依赖 annotated 渲染）显示空白。
 * 本脚本只填充 annotated 为空数组的条目，已有注音的条目保持不变。
 */
const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

const DATA_PATH = path.join(__dirname, '..', 'assets', 'data', 'characters.json');

function annotateText(text) {
  const arr = pinyin(text, {
    toneType: 'symbol',
    type: 'array',
    nonZh: 'consecutive',
  });
  const chars = Array.from(text);
  const result = [];
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    const isHanzi = /[\u4e00-\u9fff]/.test(c);
    result.push({ char: c, pinyin: isHanzi ? arr[i] : null });
  }
  return result;
}

function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);
  const list = data.characters || [];

  let filled = 0;
  const touched = [];
  for (const item of list) {
    const story = item.story;
    if (!story || !story.text) continue;
    if (Array.isArray(story.annotated) && story.annotated.length === 0) {
      story.annotated = annotateText(story.text);
      filled++;
      touched.push(item.char);
    }
  }

  if (filled === 0) {
    console.log('没有需要补齐的条目（annotated 都已存在）。');
    return;
  }

  // 备份
  const backup = DATA_PATH.replace(/\.json$/, '.before-fill-annotated.json');
  fs.writeFileSync(backup, raw, 'utf8');

  data.version = (data.version || '1.0.0') + '+annotated-fill';
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');

  console.log(`已补齐 ${filled} 个字的逐字拼音：`);
  console.log(touched.join(' '));
  console.log(`备份已写入：${path.basename(backup)}`);
}

main();
