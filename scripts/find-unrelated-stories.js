const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'assets', 'data', 'characters.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const chars = data.characters || [];

const missing = []; // 正文里没有出现该字
const empty = [];    // 没有故事
const tooShort = []; // 故事过短

for (const c of chars) {
  const text = (c.story && c.story.text) ? String(c.story.text) : '';
  if (!text.trim()) {
    empty.push(c.char);
    continue;
  }
  if (!text.includes(c.char)) {
    missing.push({ char: c.char, volume: c.volume, text });
  }
  if (text.trim().length < 30) {
    tooShort.push({ char: c.char, len: text.trim().length });
  }
}

console.log('总字数:', chars.length);
console.log('\n=== 正文未出现该字 (' + missing.length + ') ===');
for (const m of missing) {
  console.log(`[${m.char}] (${m.volume}) ${m.text.slice(0, 80)}`);
}
console.log('\n=== 没有故事 (' + empty.length + ') ===');
console.log(empty.join(' '));
console.log('\n=== 故事过短 (' + tooShort.length + ') ===');
for (const t of tooShort) console.log(`[${t.char}] len=${t.len}`);
