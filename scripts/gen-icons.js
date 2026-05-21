const sharp = require('sharp');
const fs = require('fs');

const svgPath = `${__dirname}/../assets/ohaj.svg`;
const svgBuf = fs.readFileSync(svgPath);
const ASSETS = `${__dirname}/../assets`;

async function makePNG(file, size, bg, padPct) {
  const pad = Math.round(size * padPct);
  const logoW = size - pad * 2;
  const logoH = Math.round(logoW * (266.667 / 400));
  const top = Math.round((size - logoH) / 2);
  const left = pad;

  const logoBuf = await sharp(svgBuf)
    .resize(logoW, logoH, { fit: 'fill' })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logoBuf, top, left }])
    .png()
    .toFile(`${ASSETS}/${file}`);

  console.log('✓', file);
}

(async () => {
  // iOS/main icon — dark navy background matching the app
  await makePNG('icon.png', 1024, { r: 13, g: 27, b: 42, alpha: 1 }, 0.18);

  // Splash icon — transparent (splash backgroundColor is #0d1b2a in app.json)
  await makePNG('splash-icon.png', 1024, { r: 0, g: 0, b: 0, alpha: 0 }, 0.15);

  // Android adaptive foreground — transparent (background layer stays navy #0d1b2a)
  await makePNG('android-icon-foreground.png', 1024, { r: 0, g: 0, b: 0, alpha: 0 }, 0.25);

  console.log('All icons generated.');
})().catch(e => { console.error(e); process.exit(1); });
