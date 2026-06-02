const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const src = String.raw`C:\Users\yiqzhou\.cursor\projects\c-N-21AJPF4BD0J5-Data-yiqzhou-Documents-td-td\assets\c__Users_yiqzhou_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_003968a4660aa739ded3ad82681f8b7-13f57643-4975-4cd2-aa9d-5e93055682f9.png`;
const outDir = path.resolve(__dirname, '..', 'assets');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const meta = await sharp(src).metadata();
  console.log('source', meta.width, meta.height);

  // 1290x2796 approximates modern iPhone portrait aspect.
  // Combined with resizeMode=contain and white background, it adapts to notched phones,
  // small iPhones, Android tall screens and tablets without cropping.
  await sharp({
    create: {
      width: 1290,
      height: 2796,
      channels: 4,
      background: '#FFFFFF',
    },
  })
    .composite([
      {
        input: await sharp(src)
          .resize({ width: 980, height: 1920, fit: 'contain' })
          .png()
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(outDir, 'splash.png'));

  // Icon source: crop central rabbit/book area, then place on a square white canvas.
  const cropWidth = Math.min(442, meta.width - 40);
  const cropHeight = Math.min(430, meta.height - 300);
  const iconSource = await sharp(src)
    .extract({ left: 40, top: 300, width: cropWidth, height: cropHeight })
    .resize({ width: 820, height: 820, fit: 'contain', background: '#FFFFFF' })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: '#FFFFFF',
    },
  })
    .composite([{ input: iconSource, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, 'icon.png'));

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: '#FFFFFF',
    },
  })
    .composite([{ input: iconSource, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, 'adaptive-icon.png'));

  await sharp(path.join(outDir, 'icon.png'))
    .resize(48, 48)
    .png()
    .toFile(path.join(outDir, 'favicon.png'));

  for (const f of ['splash.png', 'icon.png', 'adaptive-icon.png', 'favicon.png']) {
    const p = path.join(outDir, f);
    const m = await sharp(p).metadata();
    console.log(f, m.width, m.height, fs.statSync(p).size);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
