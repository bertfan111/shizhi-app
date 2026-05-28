const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets/images');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');
const IMAGE_MAP_PATH = path.join(ROOT, 'src/data/imageMap.ts');

const chars = ['天', '地', '人', '你', '我', '他', '一', '二', '三', '四'];

async function downloadImage(char, text) {
  // Use pollinations text to image with sci-fi context
  const prompt = `Children book illustration, 2026 sci-fi style, bright colors, NO TEXT, NO LETTERS. Story scene: ${text}`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${Math.floor(Math.random()*1000)}`;
  const dest = path.join(IMAGES_DIR, `${char}.png`);
  
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.headers['content-type'] && !response.headers['content-type'].includes('image')) {
        file.close();
        fs.unlink(dest, () => {});
        console.error(`❌ Error downloading ${char}: Not an image.`);
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
  
  console.log('🚀 开始获取这 10 个新故事的完美匹配真实插画...');
  
  for (const char of chars) {
    const charData = ds.characters.find(c => c.char === char);
    if (charData && charData.story?.text) {
      let success = false;
      while(!success) {
        success = await downloadImage(char, charData.story.text);
        if(!success) {
            console.log('Sleeping 3 seconds...');
            await sleep(3000);
        }
      }
      charData.image = `${char}.png`;
      await sleep(1500); 
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');

  // We don't really need to update imageMap because it's the same filename
  console.log('🎉 新插画已生成并集成进 App！');
}

main();