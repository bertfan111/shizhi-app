const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'assets', 'data', 'characters.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const chars = data.characters || [];

const emptyAnno = [];      // 有 text 但 annotated 为空
const mismatch = [];       // annotated 拼接后与 text 不一致（去掉标点）

for (const c of chars) {
  const text = (c.story && c.story.text) ? String(c.story.text) : '';
  const anno = (c.story && Array.isArray(c.story.annotated)) ? c.story.annotated : [];
  if (text.trim() && anno.length === 0) {
    emptyAnno.push(c.char);
    continue;
  }
  if (text.trim() && anno.length > 0) {
    const joined = anno.map((a) => a.char).join('');
    if (joined.replace(/\s/g, '') !== text.replace(/\s/g, '')) {
      mismatch.push(c.char);
    }
  }
}

console.log('总字数:', chars.length);
console.log('有 text 但 annotated 为空 (' + emptyAnno.length + '):');
console.log(emptyAnno.join(' '));
console.log('\nannotated 与 text 不一致 (' + mismatch.length + '):');
console.log(mismatch.join(' '));
