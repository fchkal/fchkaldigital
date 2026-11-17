import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');
const sandbox = { window: {}, console, module: { exports: {} } };
for (const file of ['data/store-config.js', 'data/games.js']) {
  const filePath = path.join(root, file);
  vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), sandbox, { filename: filePath });
}

const config = sandbox.window.STORE_CONFIG;
const catalog = sandbox.window.GAME_CATALOG;
if (!config || !Array.isArray(catalog)) throw new Error('Store configuration or catalog is missing.');
const supportedPlatforms = new Set(['PS4', 'PS5']);
const gtaCatalogIds = new Set(['g-gta-vi', 'g-gta-vi-ultimate-edition']);
const publicCatalog = catalog
  .filter((game) => game.status !== 'draft' && !gtaCatalogIds.has(game.id))
  .map((game) => ({
    ...game,
    platforms: (game.platforms || []).filter((platform) => supportedPlatforms.has(platform)),
    variants: (game.variants || []).filter((variant) => supportedPlatforms.has(variant.platform))
  }))
  .filter((game) => game.platforms.length);
const products = [...publicCatalog, config.GTA6_PRODUCT];
const failures = [];
const hasExactPath = (base, relativePath) => {
  let current = base;
  for (const segment of String(relativePath).replace(/\\/g, '/').split('/').filter(Boolean)) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) return false;
    const actual = fs.readdirSync(current).find((entry) => entry === segment);
    if (!actual) return false;
    current = path.join(current, actual);
  }
  return fs.existsSync(current);
};

const tradeIn = config.TRADE_IN;
if (!tradeIn || typeof tradeIn.enabled !== 'boolean') failures.push('Trade-in configuration is missing or invalid.');
if (tradeIn?.enabled && !(tradeIn.acceptedPlatforms || []).some((platform) => supportedPlatforms.has(platform))) {
  failures.push('Enabled trade-in must accept at least one supported platform.');
}
const gtaSource = catalog.find((game) => game.id === 'g-gta-vi');
const gtaUltimateSource = catalog.find((game) => game.id === 'g-gta-vi-ultimate-edition');
const gtaStandardVariant = config.GTA6_PRODUCT.variants.find((variant) => variant.edition === 'Standard');
const gtaUltimateVariant = config.GTA6_PRODUCT.variants.find((variant) => variant.edition === 'Ultimate Edition');
if (!gtaSource || !gtaStandardVariant || gtaStandardVariant.price !== gtaSource.price) {
  failures.push('GTA VI Standard must retain its catalog price.');
}
if (!gtaUltimateSource || !gtaUltimateVariant || gtaUltimateVariant.price !== gtaUltimateSource.price || gtaUltimateSource.image !== gtaUltimateVariant.image) {
  failures.push('GTA VI Ultimate must retain its catalog price and synchronized high-resolution artwork.');
}

for (const game of products) {
  const sourceGame = catalog.find((entry) => entry.id === game.id);
  if (sourceGame && (game.title !== sourceGame.title || game.price !== sourceGame.price || game.image !== sourceGame.image)) {
    failures.push(`Product source values changed for ${game.title}.`);
  }
  if (sourceGame && !gtaCatalogIds.has(game.id)) {
    for (const variant of game.variants || []) {
      const sourceVariant = (sourceGame.variants || []).find((entry) => entry.id === variant.id);
      if (!sourceVariant || sourceVariant.price !== variant.price) failures.push(`Source variant price changed for ${game.title}: ${variant.id}`);
    }
  }
  if ((game.platforms || []).some((platform) => !supportedPlatforms.has(platform))) {
    failures.push(`${game.title} lists an unsupported platform.`);
  }
  if ((game.variants || []).some((variant) => !supportedPlatforms.has(variant.platform))) {
    failures.push(`${game.title} has an unsupported platform variant.`);
  }
  if (!game.slug || !fs.existsSync(path.join(root, 'games', game.slug, 'index.html'))) {
    failures.push(`Generated game page is missing for ${game.title}.`);
  }
  for (const image of [game.image, ...(game.variants || []).map((variant) => variant.image)].filter(Boolean)) {
    if (!hasExactPath(root, image)) failures.push(`Product image is missing or case-mismatched for ${game.title}: ${image}`);
  }
}

const productSlugs = new Set(products.map((game) => game.slug));
const gameDirectories = fs.readdirSync(path.join(root, 'games'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
for (const slug of gameDirectories) {
  if (!productSlugs.has(slug) && fs.existsSync(path.join(root, 'games', slug, 'index.html'))) {
    failures.push(`Unexpected public game page exists for unpublished product ${slug}.`);
  }
}

for (const file of ['index.html', 'reviews/index.html']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (/\b(?:Steam|Xbox)\b|\bPC(?:\s+games?)?\b/i.test(source)) failures.push(`${file} contains a non-PlayStation platform claim.`);
  if (source.includes('@fchkal___keys.ma')) failures.push(`${file} contains the old Instagram handle.`);
}
const reviewData = JSON.parse(fs.readFileSync(path.join(root, 'reviews', 'reviews.json'), 'utf8'));
for (const review of reviewData) {
  if (!review?.image || !hasExactPath(root, path.join('reviews', review.image))) {
    failures.push(`Review image is missing or case-mismatched: ${review?.image || '(no image path)'}`);
  }
}

const homePage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (tradeIn?.enabled && !homePage.includes('id="tradeInForm"')) failures.push('Enabled trade-in form is missing from the homepage.');
const appSource = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
if ((appSource.match(/tradeWhatsApp:/g) || []).length !== 4) failures.push('Trade-in WhatsApp messaging must be translated in all four languages.');
for (const file of ['data/games.js', 'data/store-config.js', 'games/gta-vi/index.html']) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  if (source.includes('Grand Theft Auto VI Ultimate Edition (GTA 6 UE).jpg')) {
    failures.push(`${file} still references the superseded low-resolution GTA VI Ultimate cover.`);
  }
}

const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${config.SITE_URL}/sitemap.xml`)) failures.push('robots.txt has an incorrect sitemap URL.');
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
for (const game of products) {
  if (!sitemap.includes(`${config.SITE_URL}/game/${game.slug}`)) failures.push(`sitemap.xml is missing ${game.slug}.`);
}

const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
if (!redirects.includes('/game/:slug /games/:slug/index.html 200')) failures.push('Netlify game-page rewrite is missing.');

const deployRoot = path.join(root, 'dist');
for (const file of ['index.html', '_redirects', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml', 'css/styles.css', 'js/app.js', 'data/games.js', 'data/store-config.js']) {
  if (!fs.existsSync(path.join(deployRoot, file))) failures.push(`Production output is missing ${file}.`);
}
for (const game of products) {
  if (!fs.existsSync(path.join(deployRoot, 'games', game.slug, 'index.html'))) {
    failures.push(`Production output is missing the ${game.slug} product page.`);
  }
  for (const image of [game.image, ...(game.variants || []).map((variant) => variant.image)].filter(Boolean)) {
    if (!hasExactPath(deployRoot, image)) {
      failures.push(`Production output is missing or case-mismatched for ${game.title}: ${image}`);
    }
  }
}

const decodeHtml = (value) => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, '\'')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>');
const checkLocalPath = (sourceFile, rawPath) => {
  if (!rawPath || /^(?:[a-z][a-z\d+.-]*:|\/\/|#|data:)/i.test(rawPath)) return;
  let pathname;
  try {
    pathname = decodeURIComponent(decodeHtml(rawPath).split(/[?#]/, 1)[0]);
  } catch {
    failures.push(`Malformed local URL in ${path.relative(deployRoot, sourceFile)}: ${rawPath}`);
    return;
  }
  const sourceRelative = path.relative(deployRoot, sourceFile).replace(/\\/g, '/');
  let outputPath = pathname.startsWith('/')
    ? path.posix.normalize(pathname.slice(1))
    : path.posix.normalize(path.posix.join(path.posix.dirname(sourceRelative), pathname));
  if (outputPath === '.') outputPath = sourceRelative;
  if (outputPath === '..' || outputPath.startsWith('../')) {
    failures.push(`Local URL escapes dist in ${sourceRelative}: ${rawPath}`);
    return;
  }
  let target = path.join(deployRoot, ...outputPath.split('/'));
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    outputPath = path.posix.join(outputPath, 'index.html');
  } else if (!path.posix.extname(outputPath) && fs.existsSync(path.join(target, 'index.html'))) {
    outputPath = path.posix.join(outputPath, 'index.html');
  } else if (!path.posix.extname(outputPath) && outputPath.startsWith('game/')) {
    outputPath = path.posix.join('games', outputPath.slice('game/'.length), 'index.html');
  }
  if (!hasExactPath(deployRoot, outputPath)) {
    failures.push(`Missing or case-mismatched local URL in ${sourceRelative}: ${rawPath}`);
  }
};

const outputFiles = [];
const collectOutputFiles = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collectOutputFiles(file);
    else outputFiles.push(file);
  }
};
if (fs.existsSync(deployRoot)) {
  collectOutputFiles(deployRoot);
  for (const file of outputFiles.filter((entry) => entry.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/\b(?:href|src|poster|srcset|data-image-fallback)\s*=\s*(["'])(.*?)\1/gi)) {
      const value = decodeHtml(match[2]).trim();
      if (match[0].toLowerCase().includes('srcset=')) {
        for (const candidate of value.split(',')) checkLocalPath(file, candidate.trim().split(/\s+/, 1)[0]);
      } else {
        checkLocalPath(file, value);
      }
    }
  }
  for (const file of outputFiles.filter((entry) => entry.endsWith('.css'))) {
    const css = fs.readFileSync(file, 'utf8');
    for (const match of css.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
      checkLocalPath(file, match[2].trim());
    }
  }
  const homeOutput = path.join(deployRoot, 'index.html');
  const homeHtml = fs.existsSync(homeOutput) ? fs.readFileSync(homeOutput, 'utf8') : '';
  const imageVariantsMatch = homeHtml.match(/<script type="application\/json" id="imageVariants">([\s\S]*?)<\/script>/);
  if (!imageVariantsMatch) {
    failures.push('Production homepage is missing generated responsive image paths.');
  } else {
    try {
      const imageVariants = JSON.parse(imageVariantsMatch[1]);
      const validateImageVariant = (name, variant) => {
        if (variant && typeof variant === 'object' && !Array.isArray(variant)
          && !variant.srcset && !variant.src) {
          for (const [childName, childVariant] of Object.entries(variant)) {
            validateImageVariant(`${name}.${childName}`, childVariant);
          }
          return;
        }
        for (const candidate of (variant.srcset || '').split(',')) {
          const imagePath = candidate.trim().split(/\s+/, 1)[0];
          if (imagePath) checkLocalPath(homeOutput, imagePath);
        }
        if (variant.src) checkLocalPath(homeOutput, variant.src);
        if (!variant.srcset && !variant.src) failures.push(`Responsive image paths are empty for ${name}.`);
      };
      for (const [name, variant] of Object.entries(imageVariants)) validateImageVariant(name, variant);
    } catch (error) {
      failures.push(`Production responsive image data is invalid: ${error.message}`);
    }
  }
}

if (failures.length) {
  failures.forEach((failure) => console.error(`QA: ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`QA passed for ${products.length} PS4/PS5 product pages and all local deployment paths.`);
}
