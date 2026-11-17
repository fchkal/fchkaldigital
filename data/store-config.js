(function (root) {
  const STORE_CONFIG = {
    SITE_URL: 'https://fchkaldigital.netlify.app',
    WHATSAPP_NUMBER: '212636059783',
    INSTAGRAM_URL: 'https://www.instagram.com/fchkal___keys.ma/',
    INSTAGRAM_HANDLE: '@fchkal___keys.ma',
    SHOP_HOURS: '11:00–00:00',
    PAYMENT_METHODS: ['CIH', 'Wafacash', 'PayPal', 'Cash Plus', 'Tijarawafa'],
    TRADE_IN: {
      enabled: true,
      acceptedPlatforms: ['PS4', 'PS5'],
      termsByLanguage: { en: null, fr: null, es: null, ar: null }
    },
    EVENT_MODE: true,
    // Rockstar has not announced an exact unlock time; adjust this Morocco-time default if needed.
    GTA6_RELEASE_ISO: '2026-11-19T00:00:00+01:00',
    GTA6_HERO_IMAGE: 'images/gta6/hero.jpg',
    GTA6_PRODUCT: {
      id: 'g-gta-vi',
      slug: 'gta-vi',
      title: 'Grand Theft Auto VI (GTA 6)',
      category: 'Grand Theft Auto',
      edition: 'Standard',
      price: 500,
      image: 'images/Grand Theft Auto VI (GTA 6).jpg',
      status: 'preorder',
      platforms: ['PS5'],
      releaseDate: '2026-11-19',
      reviewNotes: '',
      variants: [
        { id: 'g-gta-vi-standard', platform: 'PS5', label: 'PS5', edition: 'Standard', price: 500, status: 'preorder', image: 'images/Grand Theft Auto VI (GTA 6).jpg' },
        { id: 'g-gta-vi-ultimate', platform: 'PS5', label: 'PS5', edition: 'Ultimate Edition', price: 649, status: 'preorder', image: 'images/UltimateEdition_07_en_us_R04_Deliv.jpg' }
      ]
    }
  };

  if (typeof window !== 'undefined') window.STORE_CONFIG = STORE_CONFIG;
  if (typeof module !== 'undefined') module.exports = STORE_CONFIG;
})(typeof globalThis !== 'undefined' ? globalThis : this);
