(function () {
  'use strict';

  const config = window.STORE_CONFIG;
  const catalog = Array.isArray(window.GAME_CATALOG) ? window.GAME_CATALOG : [];
  if (!config || !config.GTA6_PRODUCT) {
    console.error('FCHKAL Store configuration is missing.');
    return;
  }

  const platforms = ['PS4', 'PS5'];
  const gtaCatalogIds = new Set(['g-gta-vi', 'g-gta-vi-ultimate-edition']);
  const publicCatalog = catalog
    .filter((game) => game.status !== 'draft' && !gtaCatalogIds.has(game.id))
    .map((game) => ({
      ...game,
      platforms: (game.platforms || []).filter((platform) => platforms.includes(platform)),
      variants: (game.variants || []).filter((variant) => platforms.includes(variant.platform))
    }))
    .filter((game) => game.platforms.length);
  const products = [...publicCatalog, config.GTA6_PRODUCT];
  const gta = config.GTA6_PRODUCT;
  const releaseAt = new Date(config.GTA6_RELEASE_ISO).getTime();
  const imageVariants = readJsonScript('imageVariants', {});
  const selectedVariants = new Map();
  let selectedPlatform = 'PS5';
  let activeTab = 'games';
  let lightboxReviews = [];
  let lightboxIndex = 0;
  let countdownTimer;
  let lastEventState = null;
  let language = readStorage('fchkal-language') || 'en';
  if (!['en', 'fr', 'es', 'ar'].includes(language)) language = 'en';

  const copy = {
    en: {
      skip: 'Skip to content', heroEyebrow: 'FCHKAL DIGITAL · PLAYSTATION STORE', heroTitle: 'Level up your collection.', heroText: 'Discover your next favorite game for PlayStation 4 and PlayStation 5.', shopGames: 'Shop games', choosePlatform: 'Choose your console', comparePlatforms: 'Switch platforms to compare available games and listed prices.', platformPS4: 'PlayStation 4', platformPS5: 'PlayStation 5', trustPlatforms: 'PS4 and PS5 games', trustOrdering: 'Order directly on WhatsApp', eventAnnouncement: 'GTA VI arrives November 19 — PS5', countdownLink: 'Countdown',
      navGames: 'Games', navGta: 'GTA VI', navReviews: 'Reviews', navInfo: 'Info', language: 'Language',
      bioRole: 'Gamer', bioProducts: 'PS4 · PS5 games · PS Plus · PSN gift cards', bioTagline: 'The best games at the lowest prices',
      followers: 'followers', orderWhatsApp: 'Order on WhatsApp', followInstagram: 'Follow on Instagram',
      highlightPlus: 'PS Plus', highlightGift: 'Gift cards', highlightReviews: 'Reviews', highlightOffers: 'Offers',
      tabGames: 'Games', tabOffers: 'Offers', tabReviews: 'Reviews', tabInfo: 'Info',
      eventKicker: 'THE NEXT CHAPTER', eventDate: '19 NOVEMBER 2026 — PS5', days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds',
      reserveGta: 'Reserve your copy on WhatsApp', viewStory: 'Open story', openCountdown: 'Open countdown',
      zoneEyebrow: 'THE COUNTDOWN STARTS HERE', zoneTitle: 'GTA VI ZONE', catalogEyebrow: 'THE COLLECTION', catalogTitle: 'PlayStation games',
      searchLabel: 'Search games', searchPlaceholder: 'Search games', allPlatforms: 'All', sortLabel: 'Sort games',
      sortNew: 'New', sortPriceAsc: 'Price: low to high', sortPriceDesc: 'Price: high to low', sortGta: 'GTA VI first',
      plusEyebrow: 'MEMBERSHIP', plusTitle: 'PlayStation Plus', offersEyebrow: 'NO MADE-UP DISCOUNTS', offersTitle: 'Offers',
      offersEmpty: 'There are no advertised discounts right now. Ask us on WhatsApp about current prices.',
      askWhatsApp: 'Ask on WhatsApp', reviewsEyebrow: 'REAL CUSTOMER MOMENTS', reviewsTitle: 'Customer reviews',
      reviewsEmpty: 'Customer photos will appear here when customers choose to share them.',
      reviewCta: 'Bought from us? Send your photo on WhatsApp', reviewError: 'Reviews could not be loaded. Please try again later.',
      reviewClient: 'CLIENT #{index}', reviewPhoto: 'Customer photo {index}', highlightsLabel: 'Store highlights', quickNavLabel: 'Quick navigation',
      verifiedPurchase: 'Verified purchase via WhatsApp', infoEyebrow: 'HERE TO HELP', infoTitle: 'Store information',
      hoursLabel: 'OPEN DAILY', hoursNote: 'Message us on WhatsApp during store hours.', paymentLabel: 'PAYMENT METHODS',
      paymentTitle: 'Choose your method', orderingLabel: 'ORDERING', orderingTitle: 'Three simple steps',
      stepOne: 'Choose a game and platform.', stepTwo: 'Send your order on WhatsApp.',
      stepThree: 'Confirm availability, price, and payment with us.', faqLabel: 'FAQ', faqTitle: 'Before you order',
      faqQuestion: 'How do I confirm my order?', faqAnswer: 'WhatsApp us with your chosen game and platform. We will confirm the current price and availability before payment.',
      faqQuestionTwo: 'What if a price is not listed?', faqAnswerTwo: 'Use “Ask on WhatsApp” to request the current price. We do not display an estimated price.',
      contactWhatsApp: 'Contact us on WhatsApp', giftEyebrow: 'TOP UP YOUR PLAY', giftTitle: 'PSN gift cards',
      giftText: 'Choose PS4 or PS5 and ask us about available values.', disclaimer: 'FCHKAL Store is an independent reseller, not affiliated with Rockstar Games, Take-Two or Sony Interactive Entertainment. All names and artwork belong to their owners.',
      tradeNav: 'Trade', tradeEyebrow: 'TRADE IN / EXCHANGE', tradeTitle: 'Trade a game you own', tradeIntro: 'Tell us which PlayStation game you have and what you are looking for. We will confirm possible exchange options and details on WhatsApp.',
      tradeStepOne: 'Tell us the game and platform you have.', tradeStepTwo: 'Share the game you would like, if you have one in mind.', tradeStepThree: 'We will confirm possible options and discuss terms with you.',
      tradeNote: 'No exchange values or conditions are published here; ask us to confirm the options for your games.',
      tradeGameLabel: 'Game you have', tradeGameRequired: 'Enter the name of the game you have.', tradePlatformLabel: 'Platform of your game', tradeWantedLabel: 'Game you want',
      tradeWantedPlatformLabel: 'Platform you want', tradeOptional: 'Optional', tradeNotSpecified: 'Not specified',
      tradeSubmit: 'Ask about an exchange on WhatsApp',
      tradeWhatsApp: 'Hello FCHKAL Store! I would like to ask about exchanging my game: {game} ({platform}). Game I am looking for: {wantedGame} ({wantedPlatform}). Please confirm whether an exchange is possible and any applicable details. Language: {language}.',
      dockHome: 'Home', dockSearch: 'Search', dockCart: 'Cart', cartOverline: 'YOUR ORDER', cartTitle: 'Shopping cart',
      cartTotal: 'Total', cartWhatsApp: 'Continue on WhatsApp', cartEmpty: 'Your cart is empty.',
      remove: 'Remove', decrease: 'Decrease quantity', increase: 'Increase quantity', details: 'Details', addToCart: 'Add to cart',
      close: 'Close', previousPhoto: 'Previous photo', nextPhoto: 'Next photo',
      buyNow: 'Buy now', available: 'Available', inquiry: 'WhatsApp inquiry', preorder: 'Preorder',
      noResults: 'No games match your search.',
      askPrice: 'Ask price on WhatsApp', selectOption: 'Select edition / platform', platform: 'Platform', edition: 'Edition',
      eventOutNow: 'GTA VI IS OUT NOW — PS5', outNow: 'OUT NOW', newLabel: 'NEW', storyLabel: 'FCHKAL DIGITAL · EVENT',
      gameHome: 'Home', gameCatalog: 'Games', gameAvailability: 'Availability', gamePrice: 'Price', gameHowTo: 'How ordering works',
      gamePayments: 'Payment methods', gameRelated: 'Related games', gameBack: 'Back to games',
      waProduct: 'Hello FCHKAL Store! I am interested in {game} ({edition}) for {platform}. Price: {price}. Language: {language}. Please confirm availability and order details.',
      waGta: 'Hello FCHKAL Store! I would like to order Grand Theft Auto VI ({edition}) for {platform}. Listed price: {price}. Language: {language}. Please confirm availability and order details.',
      waGift: 'Hello FCHKAL Store! I am interested in PSN gift cards for PlayStation. Please confirm available values and current prices.',
      waCart: 'Hello FCHKAL Store! I would like to order:\n{lines}\n\n{total}\nPlease confirm availability and order details.',
      cartSubtotal: 'Subtotal', cartConfirmTotal: 'Subtotal for listed prices: {amount} DH', cartUnknownTotal: 'Some prices need confirmation; please confirm the order total on WhatsApp.',
      waReview: 'Hello FCHKAL Store! I bought from you and would like to share a customer photo. I have permission to publish it.'
    },
    fr: {
      skip: 'Aller au contenu', heroEyebrow: 'FCHKAL DIGITAL · BOUTIQUE PLAYSTATION', heroTitle: 'Passez au niveau supérieur.', heroText: 'Découvrez votre prochain jeu favori sur PlayStation 4 et PlayStation 5.', shopGames: 'Voir les jeux', choosePlatform: 'Choisissez votre console', comparePlatforms: 'Changez de plateforme pour comparer les jeux et les prix affichés.', platformPS4: 'PlayStation 4', platformPS5: 'PlayStation 5', trustPlatforms: 'Jeux PS4 et PS5', trustOrdering: 'Commande directe sur WhatsApp', eventAnnouncement: 'GTA VI arrive le 19 novembre — PS5', countdownLink: 'Compte à rebours',
      navGames: 'Jeux', navGta: 'GTA VI', navReviews: 'Avis', navInfo: 'Infos', language: 'Langue',
      bioRole: 'Joueur', bioProducts: 'Jeux PS4 · PS5 · PS Plus · cartes PSN', bioTagline: 'Les meilleurs jeux aux prix les plus bas',
      followers: 'abonnés', orderWhatsApp: 'Commander sur WhatsApp', followInstagram: 'Suivre sur Instagram',
      highlightPlus: 'PS Plus', highlightGift: 'Cartes cadeau', highlightReviews: 'Avis', highlightOffers: 'Offres',
      tabGames: 'Jeux', tabOffers: 'Offres', tabReviews: 'Avis', tabInfo: 'Infos',
      eventKicker: 'LE PROCHAIN CHAPITRE', eventDate: '19 NOVEMBRE 2026 — PS5', days: 'Jours', hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes',
      reserveGta: 'Réserver sur WhatsApp', viewStory: 'Voir la story', openCountdown: 'Voir le compte à rebours',
      zoneEyebrow: 'LE COMPTE À REBOURS COMMENCE ICI', zoneTitle: 'ZONE GTA VI', catalogEyebrow: 'LA COLLECTION', catalogTitle: 'Jeux PlayStation',
      searchLabel: 'Rechercher des jeux', searchPlaceholder: 'Rechercher des jeux', allPlatforms: 'Tout', sortLabel: 'Trier les jeux',
      sortNew: 'Nouveautés', sortPriceAsc: 'Prix : croissant', sortPriceDesc: 'Prix : décroissant', sortGta: 'GTA VI en premier',
      plusEyebrow: 'ABONNEMENT', plusTitle: 'PlayStation Plus', offersEyebrow: 'AUCUNE FAUSSE REMISE', offersTitle: 'Offres',
      offersEmpty: 'Aucune remise annoncée pour le moment. Demandez les prix actuels sur WhatsApp.',
      askWhatsApp: 'Demander sur WhatsApp', reviewsEyebrow: 'VRAIS MOMENTS CLIENTS', reviewsTitle: 'Avis clients',
      reviewsEmpty: 'Les photos des clients apparaîtront ici lorsqu’ils choisiront de les partager.',
      reviewCta: 'Vous avez acheté chez nous ? Envoyez votre photo sur WhatsApp', reviewError: 'Impossible de charger les avis. Réessayez plus tard.',
      reviewClient: 'CLIENT Nº {index}', reviewPhoto: 'Photo client {index}', highlightsLabel: 'À la une', quickNavLabel: 'Navigation rapide',
      verifiedPurchase: 'Achat vérifié via WhatsApp', infoEyebrow: 'À VOTRE ÉCOUTE', infoTitle: 'Informations boutique',
      hoursLabel: 'OUVERT TOUS LES JOURS', hoursNote: 'Écrivez-nous sur WhatsApp pendant les horaires d’ouverture.',
      paymentLabel: 'MOYENS DE PAIEMENT', paymentTitle: 'Choisissez votre moyen', orderingLabel: 'COMMANDE',
      orderingTitle: 'Trois étapes simples', stepOne: 'Choisissez un jeu et une plateforme.',
      stepTwo: 'Envoyez votre commande sur WhatsApp.', stepThree: 'Confirmez avec nous la disponibilité, le prix et le paiement.',
      faqLabel: 'FAQ', faqTitle: 'Avant de commander', faqQuestion: 'Comment confirmer ma commande ?',
      faqAnswer: 'Contactez-nous sur WhatsApp avec le jeu et la plateforme choisis. Nous confirmerons le prix actuel et la disponibilité avant le paiement.',
      faqQuestionTwo: 'Et si aucun prix n’est indiqué ?', faqAnswerTwo: 'Utilisez « Demander sur WhatsApp » pour connaître le prix actuel. Aucun prix estimé n’est affiché.',
      contactWhatsApp: 'Nous contacter sur WhatsApp', giftEyebrow: 'RECHARGEZ VOTRE COMPTE', giftTitle: 'Cartes cadeau PSN',
      giftText: 'Choisissez PS4 ou PS5 et demandez les valeurs disponibles.', disclaimer: 'FCHKAL Store est un revendeur indépendant, non affilié à Rockstar Games, Take-Two ou Sony Interactive Entertainment. Tous les noms et visuels appartiennent à leurs propriétaires.',
      tradeNav: 'Échange', tradeEyebrow: 'ÉCHANGE DE JEUX', tradeTitle: 'Échangez un jeu que vous possédez', tradeIntro: 'Indiquez le jeu PlayStation que vous avez et celui que vous recherchez. Nous confirmerons les options possibles et les détails sur WhatsApp.',
      tradeStepOne: 'Indiquez le jeu et la plateforme que vous possédez.', tradeStepTwo: 'Précisez le jeu souhaité, si vous en avez un en tête.', tradeStepThree: 'Nous confirmerons les options possibles et discuterons des conditions avec vous.',
      tradeNote: 'Aucune valeur ni condition d’échange n’est publiée ici ; contactez-nous pour confirmer les options possibles.',
      tradeGameLabel: 'Jeu que vous possédez', tradeGameRequired: 'Indiquez le nom du jeu que vous possédez.', tradePlatformLabel: 'Plateforme de votre jeu', tradeWantedLabel: 'Jeu souhaité',
      tradeWantedPlatformLabel: 'Plateforme souhaitée', tradeOptional: 'Facultatif', tradeNotSpecified: 'Non précisée',
      tradeSubmit: 'Demander un échange sur WhatsApp',
      tradeWhatsApp: 'Bonjour FCHKAL Store ! Je souhaite me renseigner sur un échange. Mon jeu : {game} ({platform}). Jeu recherché : {wantedGame} ({wantedPlatform}). Merci de confirmer si un échange est possible et de préciser les détails applicables. Langue : {language}.',
      dockHome: 'Accueil', dockSearch: 'Recherche', dockCart: 'Panier', cartOverline: 'VOTRE COMMANDE', cartTitle: 'Panier',
      cartTotal: 'Total', cartWhatsApp: 'Continuer sur WhatsApp', cartEmpty: 'Votre panier est vide.', remove: 'Retirer',
      decrease: 'Diminuer la quantité', increase: 'Augmenter la quantité', details: 'Détails', addToCart: 'Ajouter au panier',
      close: 'Fermer', previousPhoto: 'Photo précédente', nextPhoto: 'Photo suivante',
      buyNow: 'Acheter', available: 'Disponible', inquiry: 'Demande WhatsApp', preorder: 'Précommande',
      noResults: 'Aucun jeu ne correspond à votre recherche.',
      askPrice: 'Prix sur WhatsApp', selectOption: 'Choisir édition / plateforme', platform: 'Plateforme', edition: 'Édition',
      eventOutNow: 'GTA VI EST DISPONIBLE — PS5', outNow: 'DISPONIBLE', newLabel: 'NOUVEAU', storyLabel: 'FCHKAL DIGITAL · ÉVÉNEMENT',
      gameHome: 'Accueil', gameCatalog: 'Jeux', gameAvailability: 'Disponibilité', gamePrice: 'Prix', gameHowTo: 'Comment commander',
      gamePayments: 'Moyens de paiement', gameRelated: 'Jeux similaires', gameBack: 'Retour aux jeux',
      waProduct: 'Bonjour FCHKAL Store ! Je souhaite acheter {game} ({edition}) pour {platform}. Prix : {price}. Langue : {language}. Veuillez confirmer la disponibilité et les détails.',
      waGta: 'Bonjour FCHKAL Store ! Je souhaite commander Grand Theft Auto VI ({edition}) pour {platform}. Prix affiché : {price}. Langue : {language}. Veuillez confirmer la disponibilité et les détails.',
      waGift: 'Bonjour FCHKAL Store ! Je souhaite connaître les cartes cadeau PSN disponibles pour PlayStation. Merci de confirmer les montants disponibles et les prix actuels.',
      waCart: 'Bonjour FCHKAL Store ! Je souhaite commander :\n{lines}\n\n{total}\nVeuillez confirmer la disponibilité et les détails.',
      cartSubtotal: 'Sous-total', cartConfirmTotal: 'Sous-total des prix indiqués : {amount} DH', cartUnknownTotal: 'Certains prix doivent être confirmés ; merci de confirmer le total sur WhatsApp.',
      waReview: 'Bonjour FCHKAL Store ! J’ai acheté chez vous et souhaite partager une photo client. J’autorise sa publication.'
    },
    es: {
      skip: 'Saltar al contenido', heroEyebrow: 'FCHKAL DIGITAL · TIENDA PLAYSTATION', heroTitle: 'Sube de nivel tu colección.', heroText: 'Descubre tu próximo juego favorito para PlayStation 4 y PlayStation 5.', shopGames: 'Ver juegos', choosePlatform: 'Elige tu consola', comparePlatforms: 'Cambia de plataforma para comparar juegos y precios publicados.', platformPS4: 'PlayStation 4', platformPS5: 'PlayStation 5', trustPlatforms: 'Juegos de PS4 y PS5', trustOrdering: 'Pedido directo por WhatsApp', eventAnnouncement: 'GTA VI llega el 19 de noviembre — PS5', countdownLink: 'Cuenta atrás',
      navGames: 'Juegos', navGta: 'GTA VI', navReviews: 'Opiniones', navInfo: 'Info', language: 'Idioma',
      bioRole: 'Gamer', bioProducts: 'Juegos PS4 · PS5 · PS Plus · tarjetas PSN', bioTagline: 'Los mejores juegos al mejor precio',
      followers: 'seguidores', orderWhatsApp: 'Pedir por WhatsApp', followInstagram: 'Seguir en Instagram',
      highlightPlus: 'PS Plus', highlightGift: 'Tarjetas regalo', highlightReviews: 'Opiniones', highlightOffers: 'Ofertas',
      tabGames: 'Juegos', tabOffers: 'Ofertas', tabReviews: 'Opiniones', tabInfo: 'Info',
      eventKicker: 'EL SIGUIENTE CAPÍTULO', eventDate: '19 DE NOVIEMBRE DE 2026 — PS5', days: 'Días', hours: 'Horas', minutes: 'Minutos', seconds: 'Segundos',
      reserveGta: 'Reserva por WhatsApp', viewStory: 'Ver historia', openCountdown: 'Ver cuenta atrás',
      zoneEyebrow: 'LA CUENTA ATRÁS EMPIEZA AQUÍ', zoneTitle: 'ZONA GTA VI', catalogEyebrow: 'LA COLECCIÓN', catalogTitle: 'Juegos PlayStation',
      searchLabel: 'Buscar juegos', searchPlaceholder: 'Buscar juegos', allPlatforms: 'Todos', sortLabel: 'Ordenar juegos',
      sortNew: 'Novedades', sortPriceAsc: 'Precio: menor a mayor', sortPriceDesc: 'Precio: mayor a menor', sortGta: 'GTA VI primero',
      plusEyebrow: 'MEMBRESÍA', plusTitle: 'PlayStation Plus', offersEyebrow: 'SIN DESCUENTOS INVENTADOS', offersTitle: 'Ofertas',
      offersEmpty: 'Ahora mismo no hay descuentos anunciados. Pregúntanos los precios actuales por WhatsApp.',
      askWhatsApp: 'Preguntar por WhatsApp', reviewsEyebrow: 'MOMENTOS REALES DE CLIENTES', reviewsTitle: 'Opiniones de clientes',
      reviewsEmpty: 'Las fotos de clientes aparecerán aquí cuando decidan compartirlas.',
      reviewCta: '¿Compraste con nosotros? Envía tu foto por WhatsApp', reviewError: 'No se pudieron cargar las opiniones. Inténtalo más tarde.',
      reviewClient: 'CLIENTE #{index}', reviewPhoto: 'Foto de cliente {index}', highlightsLabel: 'Destacados', quickNavLabel: 'Navegación rápida',
      verifiedPurchase: 'Compra verificada por WhatsApp', infoEyebrow: 'A TU DISPOSICIÓN', infoTitle: 'Información de la tienda',
      hoursLabel: 'ABIERTO TODOS LOS DÍAS', hoursNote: 'Escríbenos por WhatsApp durante el horario de atención.',
      paymentLabel: 'MÉTODOS DE PAGO', paymentTitle: 'Elige tu método', orderingLabel: 'PEDIDOS',
      orderingTitle: 'Tres pasos sencillos', stepOne: 'Elige un juego y una plataforma.',
      stepTwo: 'Envía tu pedido por WhatsApp.', stepThree: 'Confirma con nosotros la disponibilidad, el precio y el pago.',
      faqLabel: 'PREGUNTAS', faqTitle: 'Antes de pedir', faqQuestion: '¿Cómo confirmo mi pedido?',
      faqAnswer: 'Escríbenos por WhatsApp con el juego y la plataforma elegidos. Confirmaremos el precio actual y la disponibilidad antes del pago.',
      faqQuestionTwo: '¿Y si no aparece el precio?', faqAnswerTwo: 'Usa «Preguntar por WhatsApp» para consultar el precio actual. No mostramos precios estimados.',
      contactWhatsApp: 'Contactar por WhatsApp', giftEyebrow: 'RECARGA TU JUEGO', giftTitle: 'Tarjetas regalo PSN',
      giftText: 'Elige PS4 o PS5 y pregunta por los valores disponibles.', disclaimer: 'FCHKAL Store es un revendedor independiente, no afiliado a Rockstar Games, Take-Two ni Sony Interactive Entertainment. Todos los nombres e imágenes pertenecen a sus propietarios.',
      tradeNav: 'Cambio', tradeEyebrow: 'INTERCAMBIO DE JUEGOS', tradeTitle: 'Cambia un juego que ya tienes', tradeIntro: 'Cuéntanos qué juego de PlayStation tienes y cuál buscas. Confirmaremos por WhatsApp las opciones de intercambio y los detalles.',
      tradeStepOne: 'Indica el juego y la plataforma que tienes.', tradeStepTwo: 'Comparte el juego que buscas, si ya tienes uno en mente.', tradeStepThree: 'Confirmaremos las opciones posibles y hablaremos de las condiciones contigo.',
      tradeNote: 'Aquí no publicamos valores ni condiciones de intercambio; consúltanos para confirmar las opciones disponibles.',
      tradeGameLabel: 'Juego que tienes', tradeGameRequired: 'Escribe el nombre del juego que tienes.', tradePlatformLabel: 'Plataforma de tu juego', tradeWantedLabel: 'Juego que buscas',
      tradeWantedPlatformLabel: 'Plataforma que buscas', tradeOptional: 'Opcional', tradeNotSpecified: 'Sin especificar',
      tradeSubmit: 'Consultar intercambio por WhatsApp',
      tradeWhatsApp: '¡Hola FCHKAL Store! Quiero consultar un intercambio. Mi juego: {game} ({platform}). Juego que busco: {wantedGame} ({wantedPlatform}). Confirmen si es posible el intercambio y los detalles aplicables. Idioma: {language}.',
      dockHome: 'Inicio', dockSearch: 'Buscar', dockCart: 'Carrito', cartOverline: 'TU PEDIDO', cartTitle: 'Carrito',
      cartTotal: 'Total', cartWhatsApp: 'Continuar por WhatsApp', cartEmpty: 'Tu carrito está vacío.', remove: 'Quitar',
      decrease: 'Reducir cantidad', increase: 'Aumentar cantidad', details: 'Detalles', addToCart: 'Añadir al carrito',
      close: 'Cerrar', previousPhoto: 'Foto anterior', nextPhoto: 'Foto siguiente',
      buyNow: 'Comprar', available: 'Disponible', inquiry: 'Consulta por WhatsApp', preorder: 'Reserva',
      noResults: 'No hay juegos que coincidan con la búsqueda.',
      askPrice: 'Consultar precio por WhatsApp', selectOption: 'Elegir edición / plataforma', platform: 'Plataforma', edition: 'Edición',
      eventOutNow: 'GTA VI YA DISPONIBLE — PS5', outNow: 'DISPONIBLE', newLabel: 'NUEVO', storyLabel: 'FCHKAL DIGITAL · EVENTO',
      gameHome: 'Inicio', gameCatalog: 'Juegos', gameAvailability: 'Disponibilidad', gamePrice: 'Precio', gameHowTo: 'Cómo pedir',
      gamePayments: 'Métodos de pago', gameRelated: 'Juegos relacionados', gameBack: 'Volver a los juegos',
      waProduct: '¡Hola FCHKAL Store! Me interesa {game} ({edition}) para {platform}. Precio: {price}. Idioma: {language}. Confirma disponibilidad y detalles, por favor.',
      waGta: '¡Hola FCHKAL Store! Quiero pedir Grand Theft Auto VI ({edition}) para {platform}. Precio indicado: {price}. Idioma: {language}. Confirma disponibilidad y detalles, por favor.',
      waGift: '¡Hola FCHKAL Store! Me interesan las tarjetas regalo PSN para PlayStation. Confirma los valores disponibles y los precios actuales, por favor.',
      waCart: '¡Hola FCHKAL Store! Quiero pedir:\n{lines}\n\n{total}\nConfirma disponibilidad y detalles, por favor.',
      cartSubtotal: 'Subtotal', cartConfirmTotal: 'Subtotal de precios indicados: {amount} DH', cartUnknownTotal: 'Hay precios pendientes de confirmar; confirma el total por WhatsApp.',
      waReview: '¡Hola FCHKAL Store! Compré con vosotros y quiero compartir una foto de cliente. Autorizo su publicación.'
    },
    ar: {
      skip: 'تجاوز إلى المحتوى', heroEyebrow: 'FCHKAL DIGITAL · متجر PLAYSTATION', heroTitle: 'ارتقِ بمجموعتك إلى مستوى جديد.', heroText: 'اكتشف لعبتك القادمة على PlayStation 4 وPlayStation 5.', shopGames: 'تصفح الألعاب', choosePlatform: 'اختر جهازك', comparePlatforms: 'بدّل المنصة لمقارنة الألعاب والأسعار المعروضة.', platformPS4: 'PlayStation 4', platformPS5: 'PlayStation 5', trustPlatforms: 'ألعاب PS4 وPS5', trustOrdering: 'اطلب مباشرة عبر واتساب', eventAnnouncement: 'تصدر GTA VI في 19 نوفمبر — PS5', countdownLink: 'العد التنازلي',
      navGames: 'الألعاب', navGta: 'GTA VI', navReviews: 'آراء العملاء', navInfo: 'معلومات', language: 'اللغة',
      bioRole: 'لاعب', bioProducts: 'ألعاب PS4 · PS5 · PS Plus · بطاقات PSN', bioTagline: 'أفضل الألعاب بأفضل الأسعار',
      followers: 'متابع', orderWhatsApp: 'اطلب عبر واتساب', followInstagram: 'تابعنا على إنستغرام',
      highlightPlus: 'PS Plus', highlightGift: 'بطاقات هدايا', highlightReviews: 'الآراء', highlightOffers: 'العروض',
      tabGames: 'الألعاب', tabOffers: 'العروض', tabReviews: 'الآراء', tabInfo: 'معلومات',
      eventKicker: 'الفصل التالي', eventDate: '19 نوفمبر 2026 — PS5', days: 'أيام', hours: 'ساعات', minutes: 'دقائق', seconds: 'ثوانٍ',
      reserveGta: 'احجز نسختك عبر واتساب', viewStory: 'عرض القصة', openCountdown: 'عرض العد التنازلي',
      zoneEyebrow: 'يبدأ العد التنازلي هنا', zoneTitle: 'منطقة GTA VI', catalogEyebrow: 'المجموعة', catalogTitle: 'ألعاب بلايستيشن',
      searchLabel: 'ابحث عن الألعاب', searchPlaceholder: 'ابحث عن الألعاب', allPlatforms: 'الكل', sortLabel: 'ترتيب الألعاب',
      sortNew: 'الأحدث', sortPriceAsc: 'السعر: من الأقل للأعلى', sortPriceDesc: 'السعر: من الأعلى للأقل', sortGta: 'GTA VI أولاً',
      plusEyebrow: 'العضوية', plusTitle: 'PlayStation Plus', offersEyebrow: 'بدون خصومات وهمية', offersTitle: 'العروض',
      offersEmpty: 'لا توجد خصومات معلنة حالياً. اسألنا عبر واتساب عن الأسعار الحالية.',
      askWhatsApp: 'اسأل عبر واتساب', reviewsEyebrow: 'لحظات حقيقية للعملاء', reviewsTitle: 'آراء العملاء',
      reviewsEmpty: 'ستظهر صور العملاء هنا عندما يختارون مشاركتها.',
      reviewCta: 'هل اشتريت منا؟ أرسل صورتك عبر واتساب', reviewError: 'تعذر تحميل الآراء. حاول مرة أخرى لاحقاً.',
      reviewClient: 'العميل #{index}', reviewPhoto: 'صورة عميل {index}', highlightsLabel: 'أبرز المتجر', quickNavLabel: 'التنقل السريع',
      verifiedPurchase: 'شراء مؤكد عبر واتساب', infoEyebrow: 'نحن هنا للمساعدة', infoTitle: 'معلومات المتجر',
      hoursLabel: 'مفتوح يومياً', hoursNote: 'راسلنا عبر واتساب خلال ساعات العمل.',
      paymentLabel: 'طرق الدفع', paymentTitle: 'اختر طريقة الدفع', orderingLabel: 'الطلب',
      orderingTitle: 'ثلاث خطوات بسيطة', stepOne: 'اختر اللعبة والمنصة.',
      stepTwo: 'أرسل طلبك عبر واتساب.', stepThree: 'أكد معنا التوفر والسعر وطريقة الدفع.',
      faqLabel: 'الأسئلة الشائعة', faqTitle: 'قبل الطلب', faqQuestion: 'كيف أؤكد طلبي؟',
      faqAnswer: 'راسلنا عبر واتساب مع اللعبة والمنصة التي اخترتها. سنؤكد السعر الحالي والتوفر قبل الدفع.',
      faqQuestionTwo: 'ماذا لو لم يظهر السعر؟', faqAnswerTwo: 'استخدم «اسأل عبر واتساب» لمعرفة السعر الحالي. لا نعرض أسعاراً تقديرية.',
      contactWhatsApp: 'تواصل معنا عبر واتساب', giftEyebrow: 'اشحن رصيدك', giftTitle: 'بطاقات PSN',
      giftText: 'اختر PS4 أو PS5 واسألنا عن القيم المتاحة.', disclaimer: 'FCHKAL Store بائع مستقل غير تابع لـ Rockstar Games أو Take-Two أو Sony Interactive Entertainment. جميع الأسماء والأعمال الفنية ملك لأصحابها.',
      tradeNav: 'مبادلة', tradeEyebrow: 'مبادلة الألعاب', tradeTitle: 'استبدل لعبة تملكها', tradeIntro: 'أخبرنا عن لعبة PlayStation التي لديك واللعبة التي تبحث عنها. سنؤكد خيارات المبادلة والتفاصيل عبر واتساب.',
      tradeStepOne: 'أخبرنا باسم اللعبة والمنصة التي لديك.', tradeStepTwo: 'اذكر اللعبة التي تريدها إن كانت لديك لعبة محددة.', tradeStepThree: 'سنؤكد الخيارات الممكنة ونناقش التفاصيل معك.',
      tradeNote: 'لا نعرض هنا قيماً أو شروطاً للمبادلة؛ تواصل معنا لتأكيد الخيارات المتاحة لألعابك.',
      tradeGameLabel: 'اللعبة التي لديك', tradeGameRequired: 'أدخل اسم اللعبة التي لديك.', tradePlatformLabel: 'منصة لعبتك', tradeWantedLabel: 'اللعبة التي تريدها',
      tradeWantedPlatformLabel: 'المنصة التي تريدها', tradeOptional: 'اختياري', tradeNotSpecified: 'غير محدد',
      tradeSubmit: 'استفسر عن المبادلة عبر واتساب',
      tradeWhatsApp: 'مرحباً FCHKAL Store! أود الاستفسار عن مبادلة. لعبتي: {game} ({platform}). اللعبة التي أبحث عنها: {wantedGame} ({wantedPlatform}). يرجى تأكيد إمكانية المبادلة والتفاصيل المعمول بها. اللغة: {language}.',
      dockHome: 'الرئيسية', dockSearch: 'بحث', dockCart: 'السلة', cartOverline: 'طلبك', cartTitle: 'سلة التسوق',
      cartTotal: 'الإجمالي', cartWhatsApp: 'تابع عبر واتساب', cartEmpty: 'سلة التسوق فارغة.', remove: 'إزالة',
      decrease: 'تقليل الكمية', increase: 'زيادة الكمية', details: 'التفاصيل', addToCart: 'أضف إلى السلة',
      close: 'إغلاق', previousPhoto: 'الصورة السابقة', nextPhoto: 'الصورة التالية',
      buyNow: 'اشتر الآن', available: 'متوفر', inquiry: 'استفسار عبر واتساب', preorder: 'طلب مسبق',
      noResults: 'لا توجد ألعاب تطابق بحثك.',
      askPrice: 'اسأل عن السعر عبر واتساب', selectOption: 'اختر الإصدار / المنصة', platform: 'المنصة', edition: 'الإصدار',
      eventOutNow: 'GTA VI متاحة الآن — PS5', outNow: 'متاحة الآن', newLabel: 'جديد', storyLabel: 'FCHKAL DIGITAL · فعالية',
      gameHome: 'الرئيسية', gameCatalog: 'الألعاب', gameAvailability: 'التوفر', gamePrice: 'السعر', gameHowTo: 'كيفية الطلب',
      gamePayments: 'طرق الدفع', gameRelated: 'ألعاب ذات صلة', gameBack: 'العودة إلى الألعاب',
      waProduct: 'مرحباً FCHKAL Store! أود الاستفسار عن {game} ({edition}) لمنصة {platform}. السعر: {price}. اللغة: {language}. يرجى تأكيد التوفر والتفاصيل.',
      waGta: 'مرحباً FCHKAL Store! أود طلب Grand Theft Auto VI ({edition}) لمنصة {platform}. السعر المدرج: {price}. اللغة: {language}. يرجى تأكيد التوفر والتفاصيل.',
      waGift: 'مرحباً FCHKAL Store! أود الاستفسار عن بطاقات PSN لمنصة PlayStation. يرجى تأكيد القيم المتاحة والأسعار الحالية.',
      waCart: 'مرحباً FCHKAL Store! أود طلب:\n{lines}\n\n{total}\nيرجى تأكيد التوفر والتفاصيل.',
      cartSubtotal: 'المجموع الفرعي', cartConfirmTotal: 'مجموع الأسعار المعروضة: {amount} DH', cartUnknownTotal: 'بعض الأسعار بحاجة إلى تأكيد؛ يرجى تأكيد الإجمالي عبر واتساب.',
      waReview: 'مرحباً FCHKAL Store! اشتريت منكم وأرغب في مشاركة صورة للعميل. أوافق على نشرها.'
    }
  };

  function readStorage(key) {
    try { return window.localStorage.getItem(key); }
    catch (error) { console.warn('Local storage is unavailable.', error); return null; }
  }

  function readJsonScript(id, fallback) {
    const node = document.getElementById(id);
    if (!node) return fallback;
    try { return JSON.parse(node.textContent || ''); }
    catch (error) { console.error(`Invalid embedded ${id} data.`, error); return fallback; }
  }

  function writeStorage(key, value) {
    try { window.localStorage.setItem(key, value); }
    catch (error) { console.warn('Local storage is unavailable.', error); }
  }

  function t(key) {
    return (copy[language] && copy[language][key]) || copy.en[key] || key;
  }

  function interpolate(text, values) {
    return text.replace(/\{(\w+)\}/g, (match, key) => values[key] == null ? '' : String(values[key]));
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function basePath() {
    return document.body.dataset.basePath || './';
  }

  function currentGameSlug() {
    if (document.body.dataset.pageSlug) return document.body.dataset.pageSlug;
    const querySlug = new URLSearchParams(window.location.search).get('slug');
    if (querySlug) return querySlug;
    const match = window.location.pathname.match(/\/game\/([^/]+)\/?$/);
    return match && match[1] !== 'index.html' ? decodeURIComponent(match[1]) : null;
  }

  function assetPath(path) {
    if (!path) return basePath() + 'images/placeholder.svg';
    return /^(?:https?:|data:|\/)/.test(path) ? path : basePath() + path;
  }

  function imageSrcSet(variant) {
    if (!variant || !variant.srcset) return '';
    return variant.srcset.split(',').map((entry) => {
      const parts = entry.trim().split(/\s+/);
      return `${assetPath(parts[0])} ${parts[1] || ''}`.trim();
    }).join(', ');
  }

  function productImage(game, alt, loading, className, selected) {
    const variantImage = selected && selected.image && selected.image !== game.image;
    const variant = variantImage ? imageVariants[`${game.slug}-${selected.id}`] : imageVariants[game.slug];
    const source = variant ? `<source type="image/webp" srcset="${escapeHtml(imageSrcSet(variant))}" sizes="(max-width: 679px) 50vw, (max-width: 979px) 33vw, 25vw">` : '';
    const width = variant && variant.width ? variant.width : 736;
    const height = variant && variant.height ? variant.height : 920;
    const fallback = assetPath((selected && selected.image) || game.image);
    return `<picture>${source}<img class="${escapeHtml(className)}" src="${escapeHtml(fallback)}" data-image-fallback="${escapeHtml(fallback)}" alt="${escapeHtml(alt)}" width="${width}" height="${height}" loading="${loading}"></picture>`;
  }

  function reviewImageMarkup(review, alt, width, height) {
    const variant = imageVariants.reviews && imageVariants.reviews[review.image];
    const source = variant ? `<source type="image/webp" srcset="${escapeHtml(imageSrcSet(variant))}" sizes="(max-width: 700px) 90vw, 25vw">` : '';
    const fallback = assetPath(`reviews/${review.image}`);
    const dimensions = width && height
      ? ` width="${width}" height="${height}"`
      : variant && variant.width && variant.height ? ` width="${variant.width}" height="${variant.height}"` : '';
    return `<picture>${source}<img src="${escapeHtml(fallback)}" data-image-fallback="${escapeHtml(fallback)}" alt="${escapeHtml(alt)}"${dimensions} loading="lazy"></picture>`;
  }

  function gameUrl(game) {
    return `${basePath()}games/${encodeURIComponent(game.slug)}/`;
  }

  function isPlus(game) {
    return /playstation plus/i.test(game.category || '');
  }

  function isGiftCard(game) {
    return /gift card/i.test(game.category || '');
  }

  function selectedVariant(game) {
    const variants = Array.isArray(game.variants) ? game.variants : [];
    if (!variants.length) return { platform: (game.platforms || []).find((platform) => platform === selectedPlatform) || (game.platforms || [])[0] || 'PS5', edition: game.edition || 'Standard', price: game.price };
    const selected = selectedVariants.get(game.id);
    return variants.find((variant) => variant.id === selected) ||
      variants.find((variant) => variant.platform === selectedPlatform) ||
      variants[0];
  }

  function productPrice(game, variant) {
    const price = variant && Object.prototype.hasOwnProperty.call(variant, 'price') ? variant.price : game.price;
    return price === null || price === undefined || price === '' ? null : Number(price);
  }

  function variantEdition(game, variant) {
    if (variant && variant.edition) return variant.edition;
    if (variant && variant.label && !platforms.includes(variant.label)) return variant.label;
    return game.edition || 'Standard';
  }

  function priceText(price) {
    return price === null ? t('askPrice') : `${price} DH`;
  }

  function waLink(message) {
    return `https://wa.me/${config.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function productWhatsAppMessage(game, variant) {
    const isGta = game.id === gta.id;
    if (isGta) return interpolate(t('waGta'), {
      edition: variantEdition(game, variant),
      platform: (variant && variant.platform) || 'PS5',
      price: priceText(productPrice(game, variant)),
      language
    });
    return interpolate(t('waProduct'), {
      game: game.title,
      edition: variantEdition(game, variant) || t('edition'),
      platform: (variant && variant.platform) || (game.platforms || []).join(' / '),
      price: priceText(productPrice(game, variant)),
      language
    });
  }

  function cardPlatforms(game, variant) {
    const list = (game.platforms || []).filter((item) => platforms.includes(item));
    const platform = variant && platforms.includes(variant.platform) ? [variant.platform] : list;
    return platform.length ? platform : list;
  }

  function platformPills(game, variant) {
    return cardPlatforms(game, variant).map((platform) => `<span class="platform-pill">${escapeHtml(platform)}</span>`).join('');
  }

  function makeCard(game, options) {
    const variant = selectedVariant(game);
    const price = productPrice(game, variant);
    const title = escapeHtml(game.title);
    const isGta = game.id === gta.id;
    const edition = variantEdition(game, variant);
    const selectableVariants = (game.variants || []).filter((item) => item.platform === selectedPlatform);
    const multiVariant = selectableVariants.length > 1;
    const showNew = isPostReleaseNew() && isGta;
    const selectLabel = game.id === gta.id ? t('edition') : t('selectOption');
    const variantOptions = multiVariant
      ? `<select class="variant-select" aria-label="${escapeHtml(selectLabel)}" data-variant-product="${escapeHtml(game.id)}">${selectableVariants.map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === variant.id ? 'selected' : ''}>${escapeHtml(variantEdition(game, item))} · ${escapeHtml(item.platform)} · ${escapeHtml(priceText(productPrice(game, item)))}</option>`).join('')}</select>`
      : '';
    const primaryLabel = isGta || game.status === 'preorder' ? t('preorder') : (game.status === 'available' ? t('buyNow') : t('inquiry'));
    const statusLabel = isGta || game.status === 'preorder' ? t('preorder') : (game.status === 'available' ? t('available') : t('inquiry'));
    const compactClass = options && options.compact ? ' product-card-compact' : '';
    const description = game.description ? `<p class="product-description">${escapeHtml(game.description)}</p>` : '';
    const coverClass = isGta && edition === 'Ultimate Edition' ? ' is-banner-cover' : '';

    return `<article class="product-card${compactClass}${coverClass}" data-product-id="${escapeHtml(game.id)}">
      <a class="cover-link" href="${escapeHtml(gameUrl(game))}" aria-label="${escapeHtml(t('details'))}: ${title}">${productImage(game, game.title, options && options.eager ? 'eager' : 'lazy', 'product-cover', variant)}</a>
      <div class="product-caption">
        <div class="product-topline"><span class="post-platforms">${platformPills(game, variant)}${showNew ? `<span class="edition-pill">${escapeHtml(t('newLabel'))}</span>` : ''}</span><span class="edition-pill">${escapeHtml(edition)}</span></div>
        <h3 class="product-title">${title}</h3>
        ${description}
        <p class="product-status">${escapeHtml(statusLabel)}</p>
        <p class="product-price${price === null ? ' ask-price' : ''}" data-price-for="${escapeHtml(game.id)}">${escapeHtml(priceText(price))}</p>
        ${variantOptions}
        <div class="product-actions">
          <a class="button button-primary" data-buy-product="${escapeHtml(game.id)}" href="${escapeHtml(waLink(productWhatsAppMessage(game, variant)))}" target="_blank" rel="noopener noreferrer">${escapeHtml(primaryLabel)}</a>
          <div class="secondary-actions"><button class="button button-outline" type="button" data-add-product="${escapeHtml(game.id)}">${escapeHtml(t('addToCart'))}</button><a class="button button-outline" href="${escapeHtml(gameUrl(game))}">${escapeHtml(t('details'))}</a></div>
        </div>
      </div>
    </article>`;
  }

  function productsForStore() {
    return products.filter((game) => !isPlus(game) && !isGiftCard(game) && (game.platforms || []).some((platform) => platforms.includes(platform)));
  }

  function sortProducts(items) {
    const sort = document.getElementById('sortFilter')?.value || 'new';
    const ordered = [...items];
    if (sort === 'gta-first') {
      ordered.sort((a, b) => Number(b.id === gta.id) - Number(a.id === gta.id));
    } else if (sort === 'price-asc' || sort === 'price-desc') {
      const direction = sort === 'price-asc' ? 1 : -1;
      ordered.sort((a, b) => {
        const priceA = productPrice(a, selectedVariant(a));
        const priceB = productPrice(b, selectedVariant(b));
        if (priceA === null && priceB === null) return 0;
        if (priceA === null) return 1;
        if (priceB === null) return -1;
        return (priceA - priceB) * direction;
      });
    } else if (isPostReleaseNew()) {
      ordered.sort((a, b) => Number(b.id === gta.id) - Number(a.id === gta.id));
    }
    return ordered;
  }

  function renderCatalog() {
    const grid = document.getElementById('gamesGrid');
    if (!grid) return;
    const query = (document.getElementById('searchInput')?.value || '').trim().toLocaleLowerCase();
    const visible = sortProducts(productsForStore().filter((game) => {
      const platformMatch = selectedPlatform === 'all' || (game.platforms || []).includes(selectedPlatform);
      const queryMatch = !query || `${game.title} ${game.category} ${game.edition}`.toLocaleLowerCase().includes(query);
      return platformMatch && queryMatch;
    }));
    grid.innerHTML = visible.length ? visible.map((game) => makeCard(game)).join('') :
      `<div class="empty-products">${escapeHtml(copy[language].noResults || 'No games found.')}</div>`;
    const count = document.getElementById('catalogCount');
    if (count) count.textContent = String(visible.length);
  }

  function renderPlus() {
    const grid = document.getElementById('plusGrid');
    if (grid) grid.innerHTML = products.filter(isPlus).map((game) => makeCard(game, { compact: true })).join('');
  }

  function renderGtaZone() {
    const grid = document.getElementById('gtaZoneGrid');
    if (!grid) return;
    const plus = products.find((game) => game.id === 'g-playstation-plus-essential-3-months');
    const gift = products.find(isGiftCard);
    const cards = [gta, plus].filter(Boolean).map((game, index) => makeCard(game, { eager: index === 0 }));
    cards.push(gift
      ? makeCard(gift)
      : `<article class="product-card gift-inquiry-card"><div class="product-caption"><span class="platform-pill">${escapeHtml(t('trustPlatforms'))}</span><h3 class="product-title">${escapeHtml(t('giftTitle'))}</h3><p class="product-description">${escapeHtml(t('giftText'))}</p><a class="button button-primary" href="${escapeHtml(waLink(t('waGift')))}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('askWhatsApp'))}</a></div></article>`);
    grid.innerHTML = cards.join('');
    const slot = document.getElementById('giftCardSlot');
    if (slot) slot.innerHTML = gift
      ? makeCard(gift, { compact: true })
      : `<a class="button button-primary gift-inquiry-link" id="giftCardAsk" href="${escapeHtml(waLink(t('waGift')))}" target="_blank" rel="noopener noreferrer">${escapeHtml(t('askWhatsApp'))}</a>`;
  }

  function readReviews() {
    const node = document.getElementById('reviewsData');
    if (!node) return [];
    try {
      const parsed = JSON.parse(node.textContent || '[]');
      if (!Array.isArray(parsed)) throw new TypeError('Expected the review data to be an array.');
      return parsed.filter((review) => review && typeof review.image === 'string' && review.image.trim());
    } catch (error) {
      console.error('The customer review data is invalid.', error);
      return null;
    }
  }

  function reviewCaption(review) {
    return [review.name, review.game, review.platform, review.date, review.caption].filter(Boolean).join(' · ');
  }

  function renderReviews() {
    const gallery = document.getElementById('reviewGallery');
    if (!gallery) return;
    const reviews = readReviews();
    const empty = document.getElementById('reviewsEmpty');
    const stories = document.getElementById('reviewStories');
    const count = document.getElementById('reviewCount');
    if (reviews === null) {
      if (empty) { empty.hidden = false; empty.querySelector('p').textContent = t('reviewError'); }
      if (stories) stories.hidden = true;
      gallery.hidden = true;
      if (count) count.hidden = true;
      return;
    }
    const pageRoot = document.getElementById('reviewsPageRoot');
    if (pageRoot) {
      gallery.innerHTML = '';
      gallery.hidden = reviews.length === 0;
      if (empty) empty.hidden = reviews.length > 0;
    } else {
      gallery.hidden = reviews.length === 0;
      if (empty) empty.hidden = reviews.length > 0;
    }
    if (count) {
      count.hidden = reviews.length === 0;
      count.textContent = String(reviews.length);
    }
    lightboxReviews = reviews;
    if (stories) {
      stories.hidden = reviews.length === 0;
      stories.innerHTML = reviews.map((review, index) => {
        const label = interpolate(t('reviewClient'), { index: index + 1 });
        return `<button class="review-story" type="button" data-review-index="${index}" aria-label="${escapeHtml(label)}">${reviewImageMarkup(review, '', '66', '66')}<span>${escapeHtml(label)}</span></button>`;
      }).join('');
    }
    gallery.innerHTML = reviews.map((review, index) => {
      const caption = reviewCaption(review);
      const alt = [review.name, review.game, review.platform].filter(Boolean).join(' — ') || interpolate(t('reviewPhoto'), { index: index + 1 });
      return `<button type="button" class="review-item" data-review-index="${index}" aria-label="${escapeHtml(alt)}">${reviewImageMarkup(review, alt, '', '')}<span class="review-caption">${escapeHtml(caption)}</span>${review.verified === true ? `<span class="verified-label">${escapeHtml(t('verifiedPurchase'))}</span>` : ''}</button>`;
    }).join('');
  }

  function applyLanguage() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const value = t(node.dataset.i18n);
      if (node.dataset.i18n === 'eventDate') {
        node.textContent = value;
      } else {
        node.textContent = value;
      }
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
      node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
    });
    const search = document.getElementById('searchInput');
    if (search) search.placeholder = t('searchPlaceholder');
    const selector = document.getElementById('languageSelector');
    if (selector) selector.value = language;
    const paymentMethods = document.getElementById('paymentMethods');
    if (paymentMethods) paymentMethods.innerHTML = config.PAYMENT_METHODS.map((method) => `<span>${escapeHtml(method)}</span>`).join('');
    const hours = config.SHOP_HOURS || '11:00–00:00';
    ['shopHours', 'infoHours', 'footerHours'].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = hours;
    });
    const reviewLink = document.getElementById('reviewWhatsApp');
    if (reviewLink) reviewLink.href = waLink(t('waReview'));
    const tradeNote = document.getElementById('tradeInNote');
    const configuredTradeNote = config.TRADE_IN && config.TRADE_IN.termsByLanguage && config.TRADE_IN.termsByLanguage[language];
    if (tradeNote && typeof configuredTradeNote === 'string' && configuredTradeNote.trim()) {
      tradeNote.textContent = configuredTradeNote.trim();
    }
    document.querySelectorAll('.product-card').forEach((card) => {
      const product = products.find((item) => item.id === card.dataset.productId);
      if (product) {
        const replacement = document.createElement('template');
        replacement.innerHTML = makeCard(product, { eager: product.id === gta.id });
        card.replaceWith(replacement.content.firstElementChild);
      }
    });
    renderCatalog();
    renderPlus();
    renderGtaZone();
    renderReviews();
    if (currentGameSlug()) hydrateGamePage(currentGameSlug());
    renderCart();
  }

  function eventState(now) {
    const weekLater = releaseAt + 7 * 24 * 60 * 60 * 1000;
    if (!config.EVENT_MODE || !Number.isFinite(releaseAt)) return 'off';
    if (now < releaseAt) return 'countdown';
    if (now < weekLater) return 'out-now';
    return 'new';
  }

  function isPostReleaseNew() {
    return eventState(Date.now()) === 'new';
  }

  function updateCountdown() {
    const state = eventState(Date.now());
    const eventHero = document.getElementById('gtaEvent');
    const announcement = document.getElementById('announcementBar');
    if (eventHero) eventHero.hidden = state === 'off' || state === 'new';
    if (announcement) announcement.hidden = state === 'off' || state === 'new';
    const notice = document.getElementById('announcementText');
    if (notice) notice.textContent = state === 'out-now' ? t('eventOutNow') : t('eventAnnouncement');
    const target = document.getElementById('countdown');
    const storyTarget = document.getElementById('storyCountdown');
    if (state === 'out-now') {
      [target, storyTarget].filter(Boolean).forEach((node) => { node.innerHTML = `<div class="countdown-out-now">${escapeHtml(t('outNow'))}</div>`; });
    } else if (state === 'countdown') {
      const remaining = Math.max(0, releaseAt - Date.now());
      const values = [
        ['countDays', Math.floor(remaining / 86400000)],
        ['countHours', Math.floor((remaining / 3600000) % 24)],
        ['countMinutes', Math.floor((remaining / 60000) % 60)],
        ['countSeconds', Math.floor((remaining / 1000) % 60)]
      ];
      values.forEach(([id, value]) => {
        const node = document.getElementById(id);
        if (node) node.textContent = String(value).padStart(2, '0');
      });
      if (storyTarget) {
        storyTarget.innerHTML = values.map(([id, value]) => {
          const label = id === 'countDays' ? t('days') : id === 'countHours' ? t('hours') : id === 'countMinutes' ? t('minutes') : t('seconds');
          return `<div><b>${String(value).padStart(2, '0')}</b><span>${escapeHtml(label)}</span></div>`;
        }).join('');
      }
    } else if (state === 'new' && storyTarget) {
      storyTarget.innerHTML = `<div class="countdown-out-now">${escapeHtml(t('newLabel'))}</div>`;
    }
    if (state !== lastEventState) {
      lastEventState = state;
      renderGtaZone();
      if (document.getElementById('gamesGrid')) renderCatalog();
    }
  }

  function setPlatformFilter(value) {
    selectedPlatform = value;
    products.forEach((game) => {
      const variant = (game.variants || []).find((item) => item.platform === value);
      if (variant) selectedVariants.set(game.id, variant.id);
    });
    document.querySelectorAll('.filter-chip[data-filter-platform]').forEach((button) => {
      button.classList.toggle('active', button.dataset.filterPlatform === value);
    });
    openTab('games');
    renderCatalog();
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function openTab(name) {
    activeTab = name;
    document.querySelectorAll('.profile-tab').forEach((button) => {
      const selected = button.dataset.tab === name;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
    if (name === 'reviews') renderReviews();
  }

  function openStory() {
    const dialog = document.getElementById('storyDialog');
    const img = document.getElementById('storyArt');
    if (img) {
      img.src = assetPath(config.GTA6_HERO_IMAGE);
      img.dataset.imageFallback = assetPath(config.GTA6_HERO_IMAGE);
      img.srcset = imageVariants.gta6Hero ? imageSrcSet(imageVariants.gta6Hero) : '';
    }
    updateCountdown();
    showDialog(dialog);
  }

  function showDialog(dialog) {
    if (dialog && !dialog.open) {
      dialog.showModal();
      document.body.classList.add('dialog-open');
    }
  }

  function closeDialog(id) {
    const dialog = document.getElementById(id);
    if (dialog && dialog.open) {
      dialog.close();
      if (!Array.from(document.querySelectorAll('dialog')).some((item) => item.open)) document.body.classList.remove('dialog-open');
    }
  }

  function loadCart() {
    const raw = readStorage('fchkal-cart');
    if (!raw) return [];
    try {
      const stored = JSON.parse(raw);
      if (!Array.isArray(stored)) throw new TypeError('Stored cart is not a list.');
      return stored.filter((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const valid = product && platforms.includes(item.platform) && (product.platforms || []).includes(item.platform);
        if (!valid) console.warn('Removed an old cart item with an unsupported platform.', item);
        return valid;
      }).map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        const variant = (product.variants || []).find((entry) => entry.id === item.variantId);
        if (!variant) return { ...item, title: product.title, image: product.image, price: productPrice(product, null), edition: product.edition || 'Standard' };
        return { ...item, title: product.title, image: variant && variant.image || product.image, price: productPrice(product, variant), edition: variantEdition(product, variant) };
      });
    } catch (error) {
      console.warn('The saved cart could not be read.', error);
      return [];
    }
  }

  let cartItems = loadCart();

  function saveCart() {
    writeStorage('fchkal-cart', JSON.stringify(cartItems));
  }

  function updateCartCount() {
    const count = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    ['cartCount', 'dockCartCount'].forEach((id) => {
      const node = document.getElementById(id);
      if (node) node.textContent = String(count);
    });
  }

  function renderCart() {
    updateCartCount();
    const container = document.getElementById('cartItems');
    if (!container) return;
    if (!cartItems.length) {
      container.innerHTML = `<p class="cart-empty">${escapeHtml(t('cartEmpty'))}</p>`;
      document.getElementById('cartTotal').textContent = '0 DH';
      return;
    }
    const hasUnknown = cartItems.some((item) => item.price === null || item.price === undefined);
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price == null ? 0 : Number(item.price) * Number(item.quantity)), 0);
    document.getElementById('cartTotal').textContent = hasUnknown
      ? t('cartUnknownTotal')
      : interpolate(t('cartConfirmTotal'), { amount: subtotal });
    container.innerHTML = cartItems.map((item) =>
      `<article class="cart-item" data-cart-id="${escapeHtml(item.id)}"><img src="${escapeHtml(assetPath(item.image))}" alt="${escapeHtml(item.title)}" width="66" height="83"><div class="cart-item-body"><h3 class="cart-item-title">${escapeHtml(item.title)}</h3><p class="cart-item-meta">${escapeHtml([item.edition, item.platform].filter(Boolean).join(' · '))}</p><div class="cart-item-controls"><button class="quantity-button" type="button" data-quantity="-1" data-cart-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t('decrease'))}">−</button><span>${Number(item.quantity)}</span><button class="quantity-button" type="button" data-quantity="1" data-cart-id="${escapeHtml(item.id)}" aria-label="${escapeHtml(t('increase'))}">+</button><span class="cart-item-price">${escapeHtml(item.price == null ? t('askPrice') : `${Number(item.price) * Number(item.quantity)} DH`)}</span><button class="remove-button" type="button" data-remove-cart="${escapeHtml(item.id)}">${escapeHtml(t('remove'))}</button></div></div></article>`
    ).join('');
    const lines = cartItems.map((item) => `${item.title} (${item.edition || 'Standard'}, ${item.platform}) x${item.quantity} — ${item.price == null ? t('askPrice') : `${item.price * item.quantity} DH`}`).join('\n');
    const total = hasUnknown ? t('cartUnknownTotal') : interpolate(t('cartConfirmTotal'), { amount: subtotal });
    document.getElementById('cartCheckout').href = waLink(interpolate(t('waCart'), { lines, total }));
  }

  function addToCart(game, variant) {
    const id = `${game.id}:${variant && variant.id ? variant.id : 'default'}`;
    const found = cartItems.find((item) => item.id === id);
    if (found) found.quantity += 1;
    else cartItems.push({
      id,
      productId: game.id,
      variantId: variant && variant.id,
      title: game.title,
      edition: variantEdition(game, variant),
      platform: (variant && variant.platform) || (game.platforms || [])[0],
      image: variant && variant.image || game.image,
      price: productPrice(game, variant),
      quantity: 1
    });
    saveCart();
    renderCart();
    const dialog = document.getElementById('cartDialog');
    showDialog(dialog);
  }

  function changeQuantity(id, amount) {
    const item = cartItems.find((entry) => entry.id === id);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) cartItems = cartItems.filter((entry) => entry.id !== id);
    saveCart();
    renderCart();
  }

  function updateCardVariant(game, variantId, card) {
    const variant = (game.variants || []).find((entry) => entry.id === variantId);
    if (!variant) return;
    selectedVariants.set(game.id, variant.id);
    card.classList.toggle('is-banner-cover', game.id === gta.id && variantEdition(game, variant) === 'Ultimate Edition');
    const price = card.querySelector('.product-price');
    if (price) {
      const amount = productPrice(game, variant);
      price.textContent = priceText(amount);
      price.classList.toggle('ask-price', amount === null);
    }
    const badges = card.querySelector('.post-platforms');
    if (badges) badges.innerHTML = platformPills(game, variant) + (isPostReleaseNew() && game.id === gta.id ? `<span class="edition-pill">${escapeHtml(t('newLabel'))}</span>` : '');
    const edition = card.querySelector('.product-topline > .edition-pill');
    if (edition) edition.textContent = variantEdition(game, variant);
    const cover = card.querySelector('.product-cover');
    const coverPath = variant.image || game.image;
    if (cover && cover.dataset.imageFallback !== assetPath(coverPath)) {
      const picture = cover.closest('picture');
      picture?.querySelectorAll('source').forEach((source) => source.remove());
      cover.removeAttribute('srcset');
      cover.dataset.imageFallback = assetPath(coverPath);
      cover.dataset.fallbackUsed = '';
      cover.src = assetPath(coverPath);
      const optimized = variant.image && variant.image !== game.image
        ? imageVariants[`${game.slug}-${variant.id}`]
        : imageVariants[game.slug];
      if (optimized && picture) {
        const source = document.createElement('source');
        source.type = 'image/webp';
        source.srcset = imageSrcSet(optimized);
        source.sizes = '(max-width: 679px) 50vw, (max-width: 979px) 33vw, 25vw';
        picture.prepend(source);
      }
    }
    const buy = card.querySelector('[data-buy-product]');
    if (buy) buy.href = waLink(productWhatsAppMessage(game, variant));
  }

  function reviewImage(index) {
    const review = lightboxReviews[index];
    if (!review) return;
    const image = document.getElementById('lightboxImage');
    const caption = document.getElementById('lightboxCaption');
    image.src = assetPath(`reviews/${review.image}`);
    const optimized = imageVariants.reviews && imageVariants.reviews[review.image];
    image.srcset = optimized ? imageSrcSet(optimized) : '';
    image.dataset.imageFallback = assetPath(`reviews/${review.image}`);
    image.alt = [review.name, review.game, review.platform].filter(Boolean).join(' — ') || `Customer photo ${index + 1}`;
    caption.textContent = reviewCaption(review);
    document.querySelector('.lightbox-prev')?.toggleAttribute('disabled', lightboxReviews.length < 2);
    document.querySelector('.lightbox-next')?.toggleAttribute('disabled', lightboxReviews.length < 2);
  }

  function openReview(index) {
    lightboxIndex = Number(index);
    reviewImage(lightboxIndex);
    const dialog = document.getElementById('reviewLightbox');
    showDialog(dialog);
  }

  function stepReview(amount) {
    if (lightboxReviews.length < 2) return;
    lightboxIndex = (lightboxIndex + amount + lightboxReviews.length) % lightboxReviews.length;
    reviewImage(lightboxIndex);
  }

  function hydrateGamePage(slug) {
    const game = products.find((item) => item.slug === slug);
    const root = document.getElementById('gamePageRoot');
    if (!root) return;
    if (!game) {
      root.innerHTML = `<div class="empty-panel">${escapeHtml(t('noResults'))}</div>`;
      return;
    }
    const title = root.querySelector('[data-game-title]');
    if (title) title.textContent = game.title;
    const category = root.querySelector('[data-game-category]');
    if (category) category.textContent = game.category || '';
    const initialVariant = selectedVariant(game);
    const initialImage = initialVariant.image || game.image;
    const image = root.querySelector('[data-game-image]');
    if (image && image.dataset.source !== initialImage) {
      image.src = assetPath(initialImage);
      image.alt = game.title;
      image.dataset.source = initialImage;
    }
    const coverVariant = initialVariant.image && initialVariant.image !== game.image
      ? imageVariants[`${game.slug}-${initialVariant.id}`]
      : imageVariants[game.slug];
    const coverSource = image?.closest('picture')?.querySelector('source');
    if (coverSource && coverVariant) coverSource.srcset = imageSrcSet(coverVariant);
    const platformBadges = root.querySelector('[data-game-platforms]');
    if (platformBadges) platformBadges.innerHTML = (game.platforms || []).filter((item) => platforms.includes(item)).map((item) => `<span class="platform-pill">${escapeHtml(item)}</span>`).join('');
    const notes = root.querySelector('[data-game-notes]');
    if (notes) {
      notes.textContent = game.reviewNotes || '';
      notes.hidden = !game.reviewNotes;
    }
    document.title = `${game.title} | FCHKAL DIGITAL`;
    const variantSelect = document.getElementById('detailVariantSelect');
    if (!variantSelect) return;
    const variants = game.variants && game.variants.length ? game.variants : [{ id: `${game.id}-default`, platform: game.platforms[0], edition: game.edition, label: game.edition, price: game.price }];
    variantSelect.innerHTML = variants.map((variant) =>
      `<option value="${escapeHtml(variant.id)}">${escapeHtml(variantEdition(game, variant))}${variants.length > 1 ? ` · ${escapeHtml(variant.platform)}` : ''} — ${escapeHtml(priceText(productPrice(game, variant)))}</option>`
    ).join('');
    variantSelect.value = selectedVariants.get(game.id) || variants[0].id;
    const update = () => {
      const variant = variants.find((entry) => entry.id === variantSelect.value) || variants[0];
      selectedVariants.set(game.id, variant.id);
      const amount = productPrice(game, variant);
      document.getElementById('detailPrice').textContent = priceText(amount);
      document.getElementById('detailPrice').classList.toggle('ask-price', amount === null);
      document.getElementById('detailEdition').textContent = variantEdition(game, variant);
      document.getElementById('detailPlatform').textContent = variant.platform;
      document.getElementById('detailStatus').textContent = game.status === 'available' ? t('available') : t('inquiry');
      document.getElementById('detailBuy').href = waLink(productWhatsAppMessage(game, variant));
      document.getElementById('detailCart').onclick = () => addToCart(game, variant);
      const variantImage = root.querySelector('[data-game-image]');
      const variantImagePath = variant.image || game.image;
      if (variantImage && variantImage.dataset.source !== variantImagePath) {
        const picture = variantImage.closest('picture');
        picture?.querySelectorAll('source').forEach((source) => source.remove());
        variantImage.removeAttribute('srcset');
        variantImage.src = assetPath(variantImagePath);
        variantImage.dataset.imageFallback = assetPath(variantImagePath);
        variantImage.dataset.source = variantImagePath;
        const optimized = variant.image && variant.image !== game.image
          ? imageVariants[`${game.slug}-${variant.id}`]
          : imageVariants[game.slug];
        if (optimized && picture) {
          const source = document.createElement('source');
          source.type = 'image/webp';
          source.srcset = imageSrcSet(optimized);
          source.sizes = '(max-width: 760px) 92vw, 45vw';
          picture.prepend(source);
        }
      }
    };
    variantSelect.onchange = update;
    update();
    const payment = document.getElementById('detailPayments');
    if (payment) payment.textContent = config.PAYMENT_METHODS.join(' · ');
    const related = document.getElementById('relatedGames');
    if (related) related.innerHTML = products.filter((item) => item.id !== game.id && !isPlus(item) && !isGiftCard(item)).slice(0, 4).map((item) => makeCard(item, { compact: true })).join('');
  }

  function attachEvents() {
    document.addEventListener('error', (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || !image.dataset.imageFallback || image.dataset.fallbackUsed) return;
      image.dataset.fallbackUsed = 'true';
      image.closest('picture')?.querySelectorAll('source').forEach((source) => source.remove());
      image.removeAttribute('srcset');
      image.src = image.dataset.imageFallback;
    }, true);
    document.addEventListener('click', (event) => {
      const target = event.target.closest('button, a');
      if (!target) return;
      if (target.dataset.tab) { event.preventDefault(); openTab(target.dataset.tab); }
      if (target.dataset.filterPlatform) { event.preventDefault(); setPlatformFilter(target.dataset.filterPlatform); }
      if (target.dataset.openStory === 'gta') { event.preventDefault(); openStory(); }
      if (target.dataset.scrollTo) {
        event.preventDefault();
        document.getElementById(target.dataset.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (target.id === 'cartButton' || target.id === 'dockCart') {
        event.preventDefault();
        const dialog = document.getElementById('cartDialog');
        showDialog(dialog);
      }
      if (target.id === 'focusSearch' || target.id === 'dockSearch') {
        event.preventDefault();
        openTab('games');
        document.getElementById('searchInput')?.focus();
        document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (target.dataset.closeDialog) closeDialog(target.dataset.closeDialog);
      if (target.dataset.addProduct) {
        const game = products.find((item) => item.id === target.dataset.addProduct);
        if (game) addToCart(game, selectedVariant(game));
      }
      if (target.dataset.quantity) changeQuantity(target.dataset.cartId, Number(target.dataset.quantity));
      if (target.dataset.removeCart) {
        cartItems = cartItems.filter((item) => item.id !== target.dataset.removeCart);
        saveCart();
        renderCart();
      }
      if (target.dataset.reviewIndex !== undefined) openReview(target.dataset.reviewIndex);
      if (target.dataset.reviewStep) stepReview(Number(target.dataset.reviewStep));
    });
    document.addEventListener('change', (event) => {
      const selector = event.target.closest('[data-variant-product]');
      if (selector) {
        const game = products.find((item) => item.id === selector.dataset.variantProduct);
        const card = selector.closest('.product-card');
        if (game && card) updateCardVariant(game, selector.value, card);
      }
      if (event.target.id === 'languageSelector') {
        language = event.target.value;
        writeStorage('fchkal-language', language);
        applyLanguage();
      }
      if (event.target.id === 'sortFilter') renderCatalog();
    });
    const tradeInForm = document.getElementById('tradeInForm');
    if (tradeInForm) {
      const offeredGameInput = document.getElementById('tradeGameName');
      offeredGameInput?.addEventListener('input', () => offeredGameInput.setCustomValidity(''));
      tradeInForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(tradeInForm);
        const game = String(formData.get('tradeGame') || '').trim();
        if (!game) {
          offeredGameInput?.setCustomValidity(t('tradeGameRequired'));
          offeredGameInput?.reportValidity();
          return;
        }
        const message = interpolate(t('tradeWhatsApp'), {
          game,
          platform: String(formData.get('tradePlatform') || ''),
          wantedGame: String(formData.get('wantedGame') || '').trim() || t('tradeNotSpecified'),
          wantedPlatform: String(formData.get('wantedPlatform') || '') || t('tradeNotSpecified'),
          language
        });
        window.open(waLink(message), '_blank', 'noopener,noreferrer');
      });
    }
    document.getElementById('searchInput')?.addEventListener('input', renderCatalog);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' && document.getElementById('reviewLightbox')?.open) stepReview(1);
      if (event.key === 'ArrowLeft' && document.getElementById('reviewLightbox')?.open) stepReview(-1);
    });
    document.querySelectorAll('dialog').forEach((dialog) => {
      dialog.addEventListener('close', () => document.body.classList.toggle('dialog-open', Array.from(document.querySelectorAll('dialog')).some((item) => item.open)));
      dialog.addEventListener('cancel', () => document.body.classList.remove('dialog-open'));
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.close();
      });
    });
    const reviewDialog = document.getElementById('reviewLightbox');
    if (reviewDialog) {
      reviewDialog.addEventListener('touchstart', (event) => { reviewDialog.dataset.touchX = String(event.changedTouches[0].clientX); }, { passive: true });
      reviewDialog.addEventListener('touchend', (event) => {
        const start = Number(reviewDialog.dataset.touchX || 0);
        const delta = event.changedTouches[0].clientX - start;
        if (Math.abs(delta) > 50) stepReview(delta < 0 ? 1 : -1);
      }, { passive: true });
    }
  }

  function init() {
    products.forEach((game) => {
      if (game.variants && game.variants.length) {
        const variant = game.variants.find((item) => item.platform === selectedPlatform) || game.variants[0];
        selectedVariants.set(game.id, variant.id);
      }
    });
    const copyrightYear = document.getElementById('copyrightYear');
    if (copyrightYear) copyrightYear.textContent = String(new Date().getFullYear());
    const tradeInSection = document.getElementById('trade-in');
    const tradeInConfig = config.TRADE_IN;
    if (tradeInSection) {
      tradeInSection.hidden = !tradeInConfig || tradeInConfig.enabled !== true;
      if (!tradeInSection.hidden) {
        const acceptedPlatforms = Array.isArray(tradeInConfig.acceptedPlatforms)
          ? tradeInConfig.acceptedPlatforms.filter((platform) => platforms.includes(platform))
          : [];
        if (!acceptedPlatforms.length) throw new Error('Trade-in is enabled but has no supported PS4/PS5 platforms configured.');
        tradeInSection.querySelectorAll('select').forEach((select) => {
          select.querySelectorAll('option[value]').forEach((option) => {
            if (option.value && !acceptedPlatforms.includes(option.value)) option.remove();
          });
        });
      }
    }
    document.querySelectorAll('.filter-chip[data-filter-platform]').forEach((button) => {
      button.classList.toggle('active', button.dataset.filterPlatform === selectedPlatform);
    });
    const profileWhatsApp = document.getElementById('profileWhatsApp');
    if (profileWhatsApp) profileWhatsApp.href = waLink(interpolate(t('waGta'), { platform: 'PS5', language }));
    const storyOrder = document.getElementById('storyOrder');
    if (storyOrder) storyOrder.href = waLink(productWhatsAppMessage(gta, gta.variants[0]));
    const gtaOrderLink = document.getElementById('gtaOrderLink');
    if (gtaOrderLink) gtaOrderLink.href = waLink(productWhatsAppMessage(gta, gta.variants[0]));
    attachEvents();
    const heroArt = document.getElementById('storeHeroArt');
    const eventArt = document.getElementById('eventArt');
    if (heroArt && imageVariants.gta6Hero) heroArt.srcset = imageSrcSet(imageVariants.gta6Hero);
    if (eventArt && imageVariants[gta.slug]) eventArt.srcset = imageSrcSet(imageVariants[gta.slug]);
    applyLanguage();
    const initialHash = window.location.hash;
    if (initialHash === '#tab-info') openTab('info');
    renderCatalog();
    renderPlus();
    renderGtaZone();
    renderReviews();
    renderCart();
    if (currentGameSlug()) hydrateGamePage(currentGameSlug());
    updateCountdown();
    countdownTimer = window.setInterval(updateCountdown, 1000);
    const root = document.getElementById('storeStructuredData');
    if (root) root.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: 'FCHKAL DIGITAL',
      url: config.SITE_URL + '/',
      sameAs: [config.INSTAGRAM_URL],
      telephone: '+212' + config.WHATSAPP_NUMBER.slice(3),
      openingHours: 'Mo-Su 11:00-00:00',
      currenciesAccepted: 'MAD'
    });
    window.addEventListener('pagehide', () => window.clearInterval(countdownTimer), { once: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
