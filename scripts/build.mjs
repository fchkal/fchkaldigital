import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { generateImageVariants } from './images.mjs';

const root = path.join(fileURLToPath(new URL('.', import.meta.url)), '..');
const imageVariants = await generateImageVariants();
const configPath = path.join(root, 'data', 'store-config.js');
const catalogPath = path.join(root, 'data', 'games.js');
const reviewsPath = path.join(root, 'reviews', 'reviews.json');
const sandbox = { window: {}, console, module: { exports: {} } };

vm.runInNewContext(fs.readFileSync(configPath, 'utf8'), sandbox, { filename: configPath });
vm.runInNewContext(fs.readFileSync(catalogPath, 'utf8'), sandbox, { filename: catalogPath });

const config = sandbox.window.STORE_CONFIG;
const catalog = sandbox.window.GAME_CATALOG;
if (!config || !Array.isArray(catalog)) throw new Error('Store configuration or game catalog could not be loaded.');
if (config.TRADE_IN && typeof config.TRADE_IN !== 'object') throw new Error('TRADE_IN configuration must be an object.');
if (config.TRADE_IN?.enabled && !(config.TRADE_IN.acceptedPlatforms || []).some((platform) => ['PS4', 'PS5'].includes(platform))) {
  throw new Error('Enabled trade-in must accept at least one supported platform.');
}

const supportedPlatforms = new Set(['PS4', 'PS5']);
const gtaCatalogIds = new Set(['g-gta-vi', 'g-gta-vi-ultimate-edition']);
const publicCatalog = catalog
  .filter((game) => game && game.status !== 'draft' && !gtaCatalogIds.has(game.id))
  .map((game) => ({
    ...game,
    platforms: (game.platforms || []).filter((platform) => supportedPlatforms.has(platform)),
    variants: (game.variants || []).filter((variant) => supportedPlatforms.has(variant.platform))
  }))
  .filter((game) => game.platforms.length);
const publicProducts = [...publicCatalog, config.GTA6_PRODUCT];
const slugs = new Set();
for (const game of publicProducts) {
  if (!game.slug || slugs.has(game.slug)) throw new Error(`Missing or duplicate product slug: ${game.slug || game.title}`);
  slugs.add(game.slug);
  if ((game.platforms || []).some((platform) => !supportedPlatforms.has(platform))) {
    throw new Error(`Unsupported platform listed for ${game.title}.`);
  }
  for (const variant of game.variants || []) {
    if (!supportedPlatforms.has(variant.platform)) throw new Error(`Unsupported variant platform for ${game.title}.`);
  }
  for (const variant of game.variants || []) {
    if (variant.image && !fs.existsSync(path.join(root, variant.image))) {
      throw new Error(`Product image is missing for ${game.title}: ${variant.image}`);
    }
  }
  if (game.image && !fs.existsSync(path.join(root, game.image))) {
    throw new Error(`Product image is missing for ${game.title}: ${game.image}`);
  }
}

const reviewData = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));
if (!Array.isArray(reviewData)) throw new Error('reviews/reviews.json must contain a JSON array.');
for (const review of reviewData) {
  if (!review || typeof review.image !== 'string' || path.basename(review.image) !== review.image) {
    throw new Error('Each review must reference an image file directly inside reviews/.');
  }
  if (!fs.existsSync(path.join(root, 'reviews', review.image))) {
    throw new Error(`Review image is missing: ${review.image}`);
  }
}

const escapeHtml = (value) => String(value == null ? '' : value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const safeJson = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const prefixedSrcset = (variant, prefix) => variant.srcset.split(',').map((entry) => {
  const [file, width] = entry.trim().split(/\s+/);
  return `${prefix}${file} ${width}`;
}).join(', ');
const priceText = (value) => value === null || value === undefined ? 'Ask on WhatsApp' : `${Number(value)} DH`;
const variantEdition = (game, variant) => variant?.edition || (variant?.label && !supportedPlatforms.has(variant.label) ? variant.label : game.edition || 'Standard');
const whatsappUrl = (game, variant) => {
  const platform = variant?.platform || game.platforms.join(' / ');
  const edition = variantEdition(game, variant);
  const price = priceText(variant && Object.hasOwn(variant, 'price') ? variant.price : game.price);
  const text = `Hello FCHKAL Store! I am interested in ${game.title} (${edition}) for ${platform}. Price: ${price}. Language: en. Please confirm availability and order details.`;
  return `https://wa.me/${config.WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
};
const platformBadges = (game) => (game.platforms || []).filter((platform) => supportedPlatforms.has(platform))
  .map((platform) => `<span class="platform-pill">${escapeHtml(platform)}</span>`).join('');
const reviewMarkup = (review, index, prefix) => {
  const alt = [review.name, review.game, review.platform].filter(Boolean).join(' — ') || `Customer photo ${index + 1}`;
  const caption = [review.name, review.game, review.platform, review.date, review.caption].filter(Boolean).join(' · ');
  const optimized = imageVariants.reviews[review.image];
  return `<button type="button" class="review-item" data-review-index="${index}" aria-label="${escapeHtml(alt)}"><picture>${optimized ? `<source type="image/webp" srcset="${escapeHtml(prefixedSrcset(optimized, prefix))}" sizes="(max-width: 700px) 90vw, 25vw">` : ''}<img src="${prefix}reviews/${escapeHtml(review.image)}" data-image-fallback="${prefix}reviews/${escapeHtml(review.image)}" alt="${escapeHtml(alt)}" loading="lazy"></picture><span class="review-caption">${escapeHtml(caption)}</span>${review.verified === true ? '<span class="verified-label" data-i18n="verifiedPurchase">Verified purchase via WhatsApp</span>' : ''}</button>`;
};

function gamePage(game) {
  const variant = game.variants?.[0] || { platform: game.platforms[0], edition: game.edition, price: game.price };
  const description = `${game.title} for ${(game.platforms || []).join(' and ')}. Contact FCHKAL Store to confirm current availability and ordering details.`;
  const image = `../../${variant.image || game.image || 'images/placeholder.svg'}`;
  const coverVariant = variant.image && variant.image !== game.image
    ? imageVariants[`${game.slug}-${variant.id}`]
    : imageVariants[game.slug];
  const selectedPrice = variant.price === null || variant.price === undefined ? null : Number(variant.price);
  const productJson = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.title,
    image: `${config.SITE_URL}/${variant.image || game.image || 'images/placeholder.svg'}`,
    description,
    brand: { '@type': 'Brand', name: 'FCHKAL DIGITAL' },
    category: game.category,
    url: `${config.SITE_URL}/game/${game.slug}`
  };
  if ((game.variants || []).length === 1 && selectedPrice !== null) {
    productJson.offers = {
      '@type': 'Offer',
      priceCurrency: 'MAD',
      price: selectedPrice,
      availability: game.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
      url: `${config.SITE_URL}/game/${game.slug}`
    };
  }
  const variants = (game.variants || []).map((item) =>
    `<option value="${escapeHtml(item.id)}">${escapeHtml(variantEdition(game, item))}${(game.variants || []).length > 1 ? ` · ${escapeHtml(item.platform)}` : ''} — ${escapeHtml(priceText(item.price))}</option>`
  ).join('');
  const notes = game.reviewNotes ? `<p class="game-notes" data-game-notes>${escapeHtml(game.reviewNotes)}</p>` : '<p class="game-notes" data-game-notes hidden></p>';
  const related = publicProducts.filter((item) => item.slug !== game.slug && !/playstation plus/i.test(item.category || '') && !/gift card/i.test(item.category || '')).slice(0, 4);
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#09080e"><meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${config.SITE_URL}/game/${game.slug}">
  <meta property="og:type" content="product"><meta property="og:title" content="${escapeHtml(game.title)} | FCHKAL DIGITAL">
  <meta property="og:description" content="${escapeHtml(description)}"><meta property="og:image" content="${config.SITE_URL}/${game.image || 'images/placeholder.svg'}">
  <title>${escapeHtml(game.title)} | FCHKAL DIGITAL</title>
  <link rel="icon" type="image/png" href="../../images/brand/fchkal-store-logo.png">
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700;1,800;1,900&family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../css/styles.css">
  <script defer src="../../data/store-config.js"></script><script defer src="../../data/games.js"></script><script defer src="../../js/app.js"></script>
</head>
<body data-base-path="../../" data-page-slug="${escapeHtml(game.slug)}">
  <a class="skip-link" href="#main" data-i18n="skip">Skip to content</a>
  <header class="site-header">
    <a class="brand-lockup" href="../../" aria-label="FCHKAL DIGITAL home"><img src="../../images/brand/fchkal-store-logo.png" alt="" width="42" height="42"><span>FCHKAL <b>DIGITAL</b></span></a>
    <nav class="desktop-nav" aria-label="Main navigation"><a href="../../#catalog" data-i18n="navGames">Games</a><a href="../../#gta-zone" data-i18n="navGta">GTA VI</a><a href="../../#trade-in" data-i18n="tradeNav">Trade</a><a href="../../reviews/" data-i18n="navReviews">Reviews</a><a href="../../#tab-info" data-i18n="navInfo">Info</a></nav>
    <div class="header-actions"><label class="sr-only" for="languageSelector" data-i18n="language">Language</label>        <select id="languageSelector" class="language-select" aria-label="Language"><option value="en">EN</option><option value="fr">FR</option><option value="es">ES</option><option value="ar">عربي</option></select>
    <a class="header-whatsapp" href="https://wa.me/${config.WHATSAPP_NUMBER}" target="_blank" rel="noopener noreferrer" data-i18n="orderWhatsApp">Order on WhatsApp</a>
      <button class="cart-trigger" id="cartButton" type="button" aria-label="Open shopping cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6"></path><circle cx="10" cy="20" r="1"></circle><circle cx="18" cy="20" r="1"></circle></svg><span class="cart-count" id="cartCount">0</span></button>
    </div>
  </header>
  <main class="content-shell game-page" id="main">
    <nav class="game-crumbs" aria-label="Breadcrumb"><a href="../../" data-i18n="gameHome">Home</a> / <a href="../../#catalog" data-i18n="gameCatalog">Games</a> / <span>${escapeHtml(game.title)}</span></nav>
    <div id="gamePageRoot">
      <article class="game-detail">
        <div class="game-detail-art"><picture>${coverVariant ? `<source type="image/webp" srcset="${escapeHtml(prefixedSrcset(coverVariant, '../../'))}" sizes="(max-width: 760px) 92vw, 45vw">` : ''}<img data-game-image data-source="${escapeHtml(variant.image || game.image)}" data-image-fallback="${escapeHtml(image)}" src="${escapeHtml(image)}" alt="${escapeHtml(game.title)}" width="${coverVariant?.width || 736}" height="${coverVariant?.height || 920}"></picture></div>
        <div class="game-detail-copy">
          <p class="section-overline" data-game-category>${escapeHtml(game.category || 'PlayStation game')}</p>
          <h1 data-game-title>${escapeHtml(game.title)}</h1>
          <div class="detail-badges" data-game-platforms>${platformBadges(game)}</div>
          <div class="game-facts">
            <div class="game-fact"><small data-i18n="platform">Platform</small><b id="detailPlatform">${escapeHtml(variant.platform)}</b></div>
            <div class="game-fact"><small data-i18n="edition">Edition</small><b id="detailEdition">${escapeHtml(variantEdition(game, variant))}</b></div>
            <div class="game-fact"><small data-i18n="gameAvailability">Availability</small><b id="detailStatus">${escapeHtml(game.status === 'available' ? 'Available' : 'WhatsApp inquiry')}</b></div>
            <div class="game-fact"><small data-i18n="gamePrice">Price</small><b class="detail-price" id="detailPrice">${escapeHtml(priceText(selectedPrice))}</b></div>
          </div>
          ${notes}
          <div class="detail-option"><label for="detailVariantSelect" data-i18n="selectOption">Edition / platform</label><select id="detailVariantSelect" aria-label="Edition and platform">${variants}</select></div>
          <div class="detail-actions"><a class="button button-primary" id="detailBuy" href="${escapeHtml(whatsappUrl(game, variant))}" target="_blank" rel="noopener noreferrer" data-i18n="buyNow">Buy now</a><button class="button button-outline" id="detailCart" type="button" data-i18n="addToCart">Add to cart</button></div>
        </div>
      </article>
      <section class="game-support"><h2 data-i18n="gameHowTo">How ordering works</h2><ol><li data-i18n="stepOne">Choose a game and platform.</li><li data-i18n="stepTwo">Send your order on WhatsApp.</li><li data-i18n="stepThree">Confirm availability, price, and payment with us.</li></ol><h2 data-i18n="gamePayments">Payment methods</h2><p id="detailPayments">${escapeHtml(config.PAYMENT_METHODS.join(' · '))}</p><h2 data-i18n="faqTitle">Before you order</h2><details><summary data-i18n="faqQuestion">How do I confirm my order?</summary><p data-i18n="faqAnswer">WhatsApp us with your chosen game and platform. We will confirm the current price and availability before payment.</p></details><details><summary data-i18n="faqQuestionTwo">What if a price is not listed?</summary><p data-i18n="faqAnswerTwo">Use “Ask on WhatsApp” to request the current price. We do not display an estimated price.</p></details></section>
      <section class="related-games"><div class="section-heading"><h2 data-i18n="gameRelated">Related games</h2><a href="../../#catalog" data-i18n="gameBack">Back to games</a></div><div class="product-grid" id="relatedGames">${related.map((item) => `<a class="product-card" href="../../games/${item.slug}/"><img class="product-cover" src="../../${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy"><div class="product-caption"><h3 class="product-title">${escapeHtml(item.title)}</h3><span>${platformBadges(item)}</span></div></a>`).join('')}</div></section>
    </div>
  </main>
  <footer class="site-footer"><div class="footer-inner"><a class="brand-lockup footer-brand" href="../../"><img src="../../images/brand/fchkal-store-logo.png" alt="" width="38" height="38"><span>FCHKAL <b>DIGITAL</b></span></a><div class="footer-contact"><a href="https://wa.me/${config.WHATSAPP_NUMBER}" target="_blank" rel="noopener noreferrer">WhatsApp · +212 636 059 783</a><a href="${config.INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer">${config.INSTAGRAM_HANDLE}</a><span>${escapeHtml(config.SHOP_HOURS)}</span></div><p class="disclaimer" data-i18n="disclaimer">FCHKAL Store is an independent reseller, not affiliated with Rockstar Games, Take-Two or Sony Interactive Entertainment. All names and artwork belong to their owners.</p><small>© <span id="copyrightYear">2026</span> FCHKAL DIGITAL</small></div></footer>
  <nav class="mobile-dock" aria-label="Quick navigation"><a href="../../" aria-label="Home"><span class="dock-icon">F</span><small data-i18n="dockHome">Home</small></a><a href="../../#catalog" aria-label="Search"><span class="dock-icon">⌕</span><small data-i18n="dockSearch">Search</small></a><a href="../../#gta-zone" aria-label="GTA VI"><span class="dock-icon">VI</span><small>GTA VI</small></a><button type="button" id="dockCart" aria-label="Cart"><span class="dock-icon">▱</span><small data-i18n="dockCart">Cart</small><i id="dockCartCount">0</i></button><a href="https://wa.me/${config.WHATSAPP_NUMBER}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><span class="dock-icon">↗</span><small>WhatsApp</small></a></nav>
  <dialog class="cart-dialog" id="cartDialog" aria-labelledby="cartTitle"><div class="dialog-sheet"><header class="dialog-header"><div><p class="section-overline" data-i18n="cartOverline">YOUR ORDER</p><h2 id="cartTitle" data-i18n="cartTitle">Shopping cart</h2></div><button class="icon-button" type="button" data-close-dialog="cartDialog" aria-label="Close cart">×</button></header><div id="cartItems" class="cart-items"></div><div class="cart-summary"><span data-i18n="cartTotal">Total</span><strong id="cartTotal">0 DH</strong></div><a class="button button-primary cart-checkout" id="cartCheckout" href="https://wa.me/${config.WHATSAPP_NUMBER}" target="_blank" rel="noopener noreferrer" data-i18n="cartWhatsApp">Continue on WhatsApp</a></div></dialog>
  <script type="application/json" id="imageVariants">${safeJson(imageVariants)}</script>
  <script type="application/json" id="reviewsData">${safeJson(reviewData)}</script>
  <script type="application/ld+json">${safeJson(productJson)}</script>
</body>
</html>`;
}

const reviewJson = safeJson(reviewData);
for (const file of ['index.html', 'reviews/index.html']) {
  const target = path.join(root, file);
  const html = fs.readFileSync(target, 'utf8');
  const withImages = html.replace(/<script type="application\/json" id="imageVariants">[\s\S]*?<\/script>/, `<script type="application/json" id="imageVariants">${safeJson(imageVariants)}</script>`);
  const updated = withImages.replace(/<script type="application\/json" id="reviewsData">[\s\S]*?<\/script>/, `<script type="application/json" id="reviewsData">${reviewJson}</script>`);
  if (updated === html && !html.includes(`id="reviewsData">${reviewJson}`)) {
    throw new Error(`Could not update embedded customer data in ${file}.`);
  }
  fs.writeFileSync(target, updated, 'utf8');
}

for (const game of publicProducts) {
  const directory = path.join(root, 'games', game.slug);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), gamePage(game), 'utf8');
}

fs.writeFileSync(path.join(root, 'games', 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=../#catalog"><link rel="canonical" href="${config.SITE_URL}/#catalog"><title>PlayStation Games | FCHKAL Store</title></head><body><p><a href="../#catalog">Browse PlayStation games</a></p></body></html>\n`, 'utf8');

const redirectRules = [
  '/game/:slug /games/:slug/index.html 200',
  '/game/:slug/ /games/:slug/index.html 200',
  '/games/:slug /game/:slug 301!',
  '/games/:slug/ /game/:slug 301!',
  '/games /#catalog 301!',
  '/games/ /#catalog 301!'
].join('\n') + '\n';
fs.writeFileSync(path.join(root, '_redirects'), redirectRules, 'utf8');

fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /archive/\nSitemap: ${config.SITE_URL}/sitemap.xml\n`, 'utf8');
const sitemapUrls = [`${config.SITE_URL}/`, `${config.SITE_URL}/reviews/`, ...publicProducts.map((game) => `${config.SITE_URL}/game/${game.slug}`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.map((url) => `  <url><loc>${url}</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(root, 'manifest.webmanifest'), JSON.stringify({
  name: 'FCHKAL DIGITAL',
  short_name: 'FCHKAL',
  start_url: './',
  display: 'standalone',
  background_color: '#05070A',
  theme_color: '#05070A',
  icons: [{ src: './images/brand/fchkal-store-logo.png', sizes: '512x512', type: 'image/png' }]
}, null, 2) + '\n', 'utf8');

const outputDirectory = path.join(root, 'dist');
fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });
for (const file of ['index.html', 'shop.html', 'plus.html', '_redirects', 'manifest.webmanifest', 'robots.txt', 'sitemap.xml']) {
  if (fs.existsSync(path.join(root, file))) {
    fs.copyFileSync(path.join(root, file), path.join(outputDirectory, file));
  }
}
for (const directory of ['css', 'data', 'games', 'how-to-order', 'images', 'js', 'reviews']) {
  fs.cpSync(path.join(root, directory), path.join(outputDirectory, directory), { recursive: true });
}
if (fs.existsSync(path.join(root, '.nojekyll'))) {
  fs.copyFileSync(path.join(root, '.nojekyll'), path.join(outputDirectory, '.nojekyll'));
}

console.log(`Built ${publicProducts.length} PS4/PS5 product pages and embedded ${reviewData.length} customer reviews.`);
