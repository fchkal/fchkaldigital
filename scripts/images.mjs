import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');
const sandbox = { window: {}, console, module: { exports: {} } };
vm.runInNewContext(await fs.readFile(path.join(root, 'data', 'store-config.js'), 'utf8'), sandbox);
vm.runInNewContext(await fs.readFile(path.join(root, 'data', 'games.js'), 'utf8'), sandbox);
const config = sandbox.window.STORE_CONFIG;
const supportedPlatforms = new Set(['PS4', 'PS5']);
const gtaCatalogIds = new Set(['g-gta-vi', 'g-gta-vi-ultimate-edition']);
const catalogProducts = sandbox.window.GAME_CATALOG
  .filter((game) => game.status !== 'draft' && !gtaCatalogIds.has(game.id))
  .map((game) => ({
    ...game,
    platforms: (game.platforms || []).filter((platform) => supportedPlatforms.has(platform)),
    variants: (game.variants || []).filter((variant) => supportedPlatforms.has(variant.platform))
  }))
  .filter((game) => game.platforms.length);
const products = [...catalogProducts, config.GTA6_PRODUCT];
const reviews = JSON.parse(await fs.readFile(path.join(root, 'reviews', 'reviews.json'), 'utf8'));
const widths = [480, 720, 900];

async function createWebpVariants(sourceRelative, outputRelative, options = {}) {
  const source = path.join(root, sourceRelative);
  const metadata = await sharp(source).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Could not read image dimensions: ${sourceRelative}`);
  const sourceWidths = [...new Set([...widths.map((width) => Math.min(width, metadata.width)), metadata.width])];
  const output = [];
  const fullSizeDestination = path.join(root, outputRelative);
  await fs.mkdir(path.dirname(fullSizeDestination), { recursive: true });
  await sharp(source).rotate().webp({ quality: 84, effort: 4 }).toFile(fullSizeDestination);
  for (const width of sourceWidths) {
    const target = outputRelative.replace(/\.webp$/i, `-${width}.webp`);
    const destination = path.join(root, target);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 84, effort: 4 })
      .toFile(destination);
    output.push({ src: target.replace(/\\/g, '/'), width });
  }
  return { srcset: output.map((item) => `${item.src} ${item.width}w`).join(', '), width: metadata.width, height: metadata.height };
}

export async function generateImageVariants() {
  const variants = {};
  const destination = path.join(root, 'images', 'covers');
  await fs.mkdir(destination, { recursive: true });
  for (const game of products) {
    if (!game.image || path.extname(game.image).toLowerCase() === '.svg') continue;
    variants[game.slug] = await createWebpVariants(game.image, `images/covers/${game.slug}.webp`);
    for (const variant of game.variants || []) {
      if (!variant.image || variant.image === game.image || path.extname(variant.image).toLowerCase() === '.svg') continue;
      variants[`${game.slug}-${variant.id}`] = await createWebpVariants(
        variant.image,
        `images/covers/${game.slug}-${variant.id}.webp`
      );
    }
  }
  variants.gta6Hero = await createWebpVariants(config.GTA6_HERO_IMAGE || config.GTA6_PRODUCT.image, 'images/gta6/hero.webp');
  if (config.GTA6_PRODUCT.mobileImage && fs.existsSync(path.join(root, config.GTA6_PRODUCT.mobileImage))) {
    variants.gta6HeroMobile = await createWebpVariants(config.GTA6_PRODUCT.mobileImage, 'images/gta6/hero-mobile.webp');
  }
  variants.reviews = {};
  for (const review of reviews) {
    if (!review || !review.image) continue;
    const name = path.parse(review.image).name;
    variants.reviews[review.image] = await createWebpVariants(`reviews/${review.image}`, `reviews/optimized/${name}.webp`);
  }
  return variants;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const variants = await generateImageVariants();
  console.log(`Generated responsive WebP covers for ${products.length} PS4/PS5 products and ${reviews.length} customer photos.`);
  console.log(`Hero source: ${variants.gta6Hero.width}x${variants.gta6Hero.height}; originals were not enlarged.`);
}
