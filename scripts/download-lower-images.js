const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets/images');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');
const IMAGE_MAP_PATH = path.join(ROOT, 'src/data/imageMap.ts');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

async function downloadImage(char, text) {
  // Translate some text context to English or just use a generic prompt if translation isn't available
  // To avoid hitting API errors with Chinese, we'll use a generic safe prompt combined with a seed
  const prompt = `Cute cartoon illustration, a scene for children book, soft pastel colors, very bright and cheerful, no text, no letters. Scene context: cute characters playing in a friendly environment.`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Buffer.from(char).readUInt8(0)}`;
  const dest = path.join(IMAGES_DIR, `${char}.png`);
  
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.headers['content-type'] && !response.headers['content-type'].includes('image')) {
        file.close();
        fs.unlink(dest, () => {});
        console.error(`❌ Error downloading ${char}: Not an image. Content-Type: ${response.headers['content-type']}`);
        return resolve(false);
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${char}.png`);
        resolve(true);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      console.error(`❌ Error downloading ${char}:`, err.message);
      resolve(false);
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const ds = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const lowerChars = ds.characters.filter(c => c.volume === 'lower');
  
  console.log(`🚀 开始在后台为 ${lowerChars.length} 个下册文字生成插画...`);
  
  let downloadedCount = 0;
  for (const charData of lowerChars) {
    if (charData.image && fs.existsSync(path.join(IMAGES_DIR, charData.image))) {
      continue; // Skip if already exists
    }
    
    let success = false;
    let retries = 0;
    while(!success && retries < 3) {
      success = await downloadImage(charData.char, charData.story?.text || 'cute character');
      if(!success) {
          retries++;
          console.log(`Rate limited or failed, sleeping 5 seconds (retry ${retries})...`);
          await sleep(5000);
      }
    }
    
    if (success) {
      charData.image = `${charData.char}.png`;
      downloadedCount++;
      // Save progressively
      if (downloadedCount % 10 === 0) {
        fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');
      }
    }
    await sleep(2500); // 间隔2.5秒，避免频繁被拦截
  }

  // Final update
  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');

  // Update imageMap.ts
  const lines = [
    '/**',
    ' * 字符 → 图片资源映射表',
    ' */',
    '',
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
    'const map: Record<string, any> = {',
  ];

  for (const c of ds.characters) {
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

  fs.writeFileSync(IMAGE_MAP_PATH, lines.join('\n'), 'utf8');
  console.log('🎉 下册文字的插画生成任务结束！');
}

main();