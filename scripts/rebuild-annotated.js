/**
 * 根据每个字的 story.text 重新生成 story.annotated（逐字拼音）。
 * 修复之前润色/改写只更新 text、未同步 annotated 导致故事空白或拼音错位的问题。
 */
const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

const file = path.join(__dirname, '..', 'assets', 'data', 'characters.json');

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

const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);
const chars = data.characters || [];

// 备份
const backup = file.replace(/\.json$/, '.before-annotate-rebuild.json');
if (!fs.existsSync(backup)) {
  fs.writeFileSync(backup, raw, 'utf8');
  console.log('已备份 ->', path.basename(backup));
}

let rebuilt = 0;
for (const c of chars) {
  if (!c.story) continue;
  const text = c.story.text ? String(c.story.text) : '';
  if (!text.trim()) {
    c.story.annotated = [];
    continue;
  }
  c.story.annotated = annotateText(text);
  rebuilt++;
}

if (!String(data.version || '').includes('+anno')) {
  data.version = (data.version || '') + '+anno';
}
data.generatedAt = new Date().toISOString();

const out = JSON.stringify(data, null, 2);

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {}
}

const tmp = file + '.tmp';
fs.writeFileSync(tmp, out, 'utf8');

let ok = false;
for (let attempt = 1; attempt <= 8; attempt++) {
  try {
    fs.renameSync(tmp, file);
    ok = true;
    break;
  } catch (e1) {
    try {
      fs.writeFileSync(file, out, 'utf8');
      ok = true;
      break;
    } catch (e2) {
      if (e2.code === 'EPERM' || e2.code === 'EBUSY') {
        console.log(`写入被占用，重试 ${attempt}/8 ...`);
        sleep(1500);
      } else {
        throw e2;
      }
    }
  }
}
try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}

if (!ok) {
  console.error('写入失败：文件仍被占用。请关闭编辑器里打开的 characters.json 后重试。');
  process.exit(1);
}

console.log(`重新生成 annotated 的字数: ${rebuilt} / ${chars.length}`);
console.log('完成。');
