const fs = require('fs');
const path = require('path');
const ds = JSON.parse(fs.readFileSync('assets/data/characters.json','utf8'));
const lines = [
  '/** * 自动生成映射表 */',
  '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
  'const map: Record<string, any> = {',
];
ds.characters.forEach(c => {
  if (c.image) {
    const imagePath = path.join('assets/images', c.image);
    if (fs.existsSync(imagePath) && fs.statSync(imagePath).size > 1000) {
      lines.push(`  '${c.char}': require('../../assets/images/${c.image}'),`);
    }
  }
});
lines.push('};');
lines.push('export function getImageFor(char: string): any | null { return map[char] ?? null; }');
lines.push('export function hasImageFor(char: string): boolean { return Boolean(map[char]); }');
fs.writeFileSync('src/data/imageMap.ts', lines.join('\n'), 'utf8');
