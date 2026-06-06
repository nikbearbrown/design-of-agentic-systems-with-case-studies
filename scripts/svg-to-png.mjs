import sharp from 'sharp';
import { glob } from 'glob';
import { statSync } from 'fs';

const files = await glob('images/**/*.svg');

for (const file of files) {
  const out = file.replace('.svg', '.png');

  // Skip if PNG is newer than SVG
  try {
    const svgMtime = statSync(file).mtimeMs;
    const pngMtime = statSync(out).mtimeMs;
    if (pngMtime > svgMtime) {
      console.log(`skipped (up to date): ${out}`);
      continue;
    }
  } catch {
    // PNG doesn't exist yet — proceed
  }

  await sharp(file, { density: 300 }).png().toFile(out);
  console.log(`${file} → ${out}`);
}
