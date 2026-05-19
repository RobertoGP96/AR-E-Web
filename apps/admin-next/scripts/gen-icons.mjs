// One-off: rasterize the brand SVG into favicon/app icons.
// Run: node scripts/gen-icons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const root = path.resolve(import.meta.dirname, '..');
const svg = await readFile(path.join(root, 'public', 'logo.svg'));

// Render the logo centered on a transparent square (logo is ~0.75 ratio).
async function square(size, pad = 0.14) {
  const inner = Math.round(size * (1 - pad * 2));
  const logo = await sharp(svg, { density: 384 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

const out = {
  'src/app/apple-icon.png': await square(180, 0.16),
  'src/app/icon.png': await square(512, 0.12),
  'public/icon-192.png': await square(192, 0.12),
  'public/icon-512.png': await square(512, 0.12),
};
for (const [rel, buf] of Object.entries(out)) {
  await writeFile(path.join(root, rel), buf);
  console.log('wrote', rel);
}

const ico = await pngToIco([
  await square(32, 0.08),
  await square(48, 0.08),
  await square(64, 0.08),
]);
await writeFile(path.join(root, 'src/app/favicon.ico'), ico);
console.log('wrote src/app/favicon.ico');
