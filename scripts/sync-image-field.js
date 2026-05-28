/**
 * 仅同步 characters.json 里的 image 字段与磁盘真实文件一致，
 * 不做任何文件删除，保证不会再造成损失。
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets/images');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');

const existing = new Set(
  fs.readdirSync(IMAGES_DIR).filter((n) => n.toLowerCase().endsWith('.png')),
);
console.log('磁盘上现有图片:', [...existing]);

const ds = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
let cleared = 0;
let kept = 0;
for (const c of ds.characters) {
  if (c.image) {
    if (existing.has(c.image)) {
      kept += 1;
    } else {
      delete c.image;
      cleared += 1;
    }
  }
}
fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');
console.log(`保留 image 字段: ${kept}`);
console.log(`清空 image 字段: ${cleared}`);
