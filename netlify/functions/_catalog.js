// Canonical Server-Side Product Catalog & Order Validation for Sanskruti eBooks

const BOOKS = {
  'mind-1': {
    id: 'mind-1',
    title: 'The Unstoppable Mind: Master Self-Discipline & Iron Will',
    price: 99,
    originalPrice: 499,
    category: 'motivational'
  },
  'mind-2': {
    id: 'mind-2',
    title: 'Atomic Habits for High Achievers',
    price: 129,
    originalPrice: 599,
    category: 'motivational'
  },
  'mind-3': {
    id: 'mind-3',
    title: 'Beyond Fear: Break Free from Anxiety & Overthinking',
    price: 89,
    originalPrice: 450,
    category: 'motivational'
  },
  'mind-4': {
    id: 'mind-4',
    title: 'The Winner’s 5 AM Blueprint',
    price: 89,
    originalPrice: 399,
    category: 'motivational'
  },
  'mind-5': {
    id: 'mind-5',
    title: 'Art of Emotional Peace & Gita Wisdom',
    price: 119,
    originalPrice: 550,
    category: 'motivational'
  },
  'mind-6': {
    id: 'mind-6',
    title: 'The Wealth Mindset: Financial Freedom Blueprint',
    price: 149,
    originalPrice: 699,
    category: 'motivational'
  },
  'health-1': {
    id: 'health-1',
    title: 'The Miracle of Gut Healing & Microbiome Restoration',
    price: 129,
    originalPrice: 599,
    category: 'health'
  },
  'health-2': {
    id: 'health-2',
    title: 'The Ayurvedic Blueprint for Lifelong Vitality',
    price: 149,
    originalPrice: 650,
    category: 'health'
  },
  'health-3': {
    id: 'health-3',
    title: 'Sugar Detox & Reversing Insulin Resistance',
    price: 119,
    originalPrice: 499,
    category: 'health'
  },
  'health-4': {
    id: 'health-4',
    title: 'Hormonal Harmony for Women: PCOD & Thyroid Freedom',
    price: 129,
    originalPrice: 599,
    category: 'health'
  },
  'health-5': {
    id: 'health-5',
    title: 'Heart Strong: Natural Blood Pressure & Lipid Health',
    price: 139,
    originalPrice: 620,
    category: 'health'
  },
  'fitness-1': {
    id: 'fitness-1',
    title: 'Pranayama & Yogic Breathwork Mastery',
    price: 99,
    originalPrice: 450,
    category: 'fitness'
  },
  'fitness-2': {
    id: 'fitness-2',
    title: 'Home Workout Mastery: Zero Equipment, Maximum Strength',
    price: 119,
    originalPrice: 520,
    category: 'fitness'
  },
  'fitness-3': {
    id: 'fitness-3',
    title: 'Deep Sleep Revolution: Sleep Like a Baby',
    price: 89,
    originalPrice: 420,
    category: 'fitness'
  },
  'fitness-4': {
    id: 'fitness-4',
    title: 'The Cellular Longevity & Anti-Aging Code',
    price: 149,
    originalPrice: 699,
    category: 'fitness'
  }
};

const BUNDLES = {
  'bundle-mind': {
    id: 'bundle-mind',
    title: 'Ultimate Mindset & Motivation Combo',
    price: 299,
    originalPrice: 2999,
    booksCount: 6,
    bookIds: ['mind-1', 'mind-2', 'mind-3', 'mind-4', 'mind-5', 'mind-6']
  },
  'bundle-health': {
    id: 'bundle-health',
    title: 'Holistic Health & Longevity Master Pack',
    price: 249,
    originalPrice: 2899,
    booksCount: 5,
    bookIds: ['health-1', 'health-2', 'health-3', 'health-4', 'health-5']
  },
  'bundle-mega': {
    id: 'bundle-mega',
    title: 'Sanskruti All-In-One Mega Digital Library',
    price: 499,
    originalPrice: 7999,
    booksCount: 15,
    bookIds: Object.keys(BOOKS)
  }
};

const VALID_COUPONS = {
  'SANSKRUTI50': 0.50, // 50% discount
  'WELCOME50': 0.50,   // 50% discount
  'GROW20': 0.80       // 20% discount (pays 80%)
};

// Authoritative Non-eBook Services & Access Packages (Server-Enforced Pricing)
const SERVICES = {
  // Sanskruti Services (/service/)
  'service-pic-5':    { id: 'service-pic-5',    title: '5 Exclusive Photos Package',          price: 60,   category: 'service' },
  'service-pic-10':   { id: 'service-pic-10',   title: '10 Exclusive Photos Package',         price: 100,  category: 'service' },
  'service-combo-1':  { id: 'service-combo-1',  title: '5 Photos + 3 Videos Package',         price: 120,  category: 'service' },
  'service-vid-5':    { id: 'service-vid-5',    title: '5 Exclusive Videos Package',          price: 150,  category: 'service' },
  'service-chat-30':  { id: 'service-chat-30',  title: '30 Minutes Chat Session',             price: 150,  category: 'service' },
  'service-chat-60':  { id: 'service-chat-60',  title: '60 Minutes Chat Session',             price: 250,  category: 'service' },
  'service-vc-10':    { id: 'service-vc-10',    title: '10 Minutes Video Call Session',       price: 1,    category: 'service' },
  'service-vc-30':    { id: 'service-vc-30',    title: '30 Minutes Video Call Session',       price: 300,  category: 'service' },
  'service-vc-60':    { id: 'service-vc-60',    title: '60 Minutes Video Call Session',       price: 400,  category: 'service' },
  'service-vc-upgrade-50':  { id: 'service-vc-upgrade-50',  title: 'VIP Video Call Upgrade (+10m Extra + Face & Body)', price: 50,  category: 'service' },
  'service-vc-upgrade-100': { id: 'service-vc-upgrade-100', title: 'VIP Video Call Upgrade (+20m Extra + Face & Body)', price: 100, category: 'service' },
  'service-vc-upgrade-150': { id: 'service-vc-upgrade-150', title: 'VIP Video Call Upgrade (+30m Extra + Face & Body)', price: 150, category: 'service' },
  'service-voice-30': { id: 'service-voice-30', title: '30 Minutes Voice Call Session',       price: 200,  category: 'service' },
  'service-voice-60': { id: 'service-voice-60', title: '60 Minutes Voice Call Session',       price: 300,  category: 'service' },
  'service-sub-7':    { id: 'service-sub-7',    title: '7 Days Video Call VIP Subscription',  price: 750,  category: 'service' },
  'service-sub-15':   { id: 'service-sub-15',   title: '15 Days Video Call VIP Subscription', price: 1500, category: 'service' },

  // WA.vc Call Plans (/wa.vc/)
  'wavc-call-15':     { id: 'wavc-call-15',     title: 'WA Meet 15 Min HD Video Call',        price: 99,   category: 'wavc' },
  'wavc-call-vip':    { id: 'wavc-call-vip',    title: 'WA Meet Full Night VIP Access',       price: 179,  category: 'wavc' },
  'wavc-room-79':     { id: 'wavc-room-79',     title: 'WA Meet Video Call Room Access',      price: 49,   category: 'wavc' },
  'wavc-chat-99':     { id: 'wavc-chat-99',     title: 'WA Meet Private Chat Access',         price: 49,   category: 'wavc' },
  'wavc-call-49':     { id: 'wavc-call-49',     title: 'WA Meet 10 Min Call (50% OFF)',       price: 49,   category: 'wavc' },
  'wavc-call-99':     { id: 'wavc-call-99',     title: 'WA Meet Continue Video Call',         price: 99,   category: 'wavc' },
  'wavc-vvip-129':    { id: 'wavc-vvip-129',    title: 'WA Meet VVIP Room Access',            price: 129,  category: 'wavc' },

  // NearMe Meeting Advance (/meeting/)
  'meeting-advance':  { id: 'meeting-advance',  title: 'NearMe Meeting Advance Booking Fee',  price: 350,  category: 'meeting' }
};

/**
 * Server-side order calculation and verification.
 * Prevents client-side manipulation of price, quantity, or discount.
 */
function validateAndCalculateOrder({ itemType, itemId, cartItems = [], couponCode = '' }) {
  let subtotal = 0;
  let itemsPurchased = [];
  let productInfoText = '';
  let productCategory = 'ebook';

  const cleanCoupon = String(couponCode || '').trim().toUpperCase();
  const discountMultiplier = VALID_COUPONS[cleanCoupon] || 1.0;

  if (itemType === 'single') {
    const book = BOOKS[itemId];
    if (!book) {
      throw new Error(`Invalid book selection: ${itemId}`);
    }
    subtotal = book.price;
    itemsPurchased = [{ id: book.id, title: book.title, price: book.price, category: 'ebook' }];
    productInfoText = book.title;
    productCategory = 'ebook';
  } else if (itemType === 'bundle') {
    const bundle = BUNDLES[itemId];
    if (!bundle) {
      throw new Error(`Invalid bundle selection: ${itemId}`);
    }
    subtotal = bundle.price;
    itemsPurchased = bundle.bookIds.map(bId => ({
      id: bId,
      title: BOOKS[bId] ? BOOKS[bId].title : bId,
      price: BOOKS[bId] ? BOOKS[bId].price : 0,
      category: 'ebook'
    }));
    productInfoText = bundle.title;
    productCategory = 'ebook';
  } else if (itemType === 'cart') {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }
    const validatedBooks = [];
    for (const bId of cartItems) {
      const book = BOOKS[bId];
      if (book) {
        subtotal += book.price;
        validatedBooks.push({ id: book.id, title: book.title, price: book.price, category: 'ebook' });
      }
    }
    if (validatedBooks.length === 0) {
      throw new Error('No valid books found in cart');
    }
    itemsPurchased = validatedBooks;
    productInfoText = `Sanskruti Cart (${validatedBooks.length} eBooks)`;
    productCategory = 'ebook';
  } else if (itemType === 'service' || itemType === 'wavc' || itemType === 'meeting') {
    const service = SERVICES[itemId];
    if (!service) {
      throw new Error(`Invalid service selection: ${itemId}`);
    }
    subtotal = service.price;
    itemsPurchased = [{
      id: service.id,
      title: service.title,
      price: service.price,
      category: service.category
    }];
    productInfoText = service.title;
    productCategory = service.category;
  } else {
    throw new Error(`Unknown item type: ${itemType}`);
  }

  // Calculate final amount after validated coupon (coupons only apply to eBooks)
  const isEbook = productCategory === 'ebook';
  const effectiveMultiplier = isEbook ? discountMultiplier : 1.0;
  let finalAmount = Math.round(subtotal * effectiveMultiplier);
  // Ensure minimum charge of 1 rupee if applicable
  if (finalAmount < 1) finalAmount = 1;

  // PayU recommends clean productinfo without special characters
  const sanitizedProductInfo = productInfoText.replace(/[^a-zA-Z0-9\s-_]/g, '').trim().substring(0, 80) || 'Sanskruti Order';

  return {
    itemType,
    itemId,
    subtotal,
    discountMultiplier: effectiveMultiplier,
    appliedCoupon: (isEbook && VALID_COUPONS[cleanCoupon]) ? cleanCoupon : null,
    finalAmount,
    amountFormatted: finalAmount.toFixed(2),
    itemsPurchased,
    productCategory,
    productInfo: sanitizedProductInfo
  };
}

module.exports = {
  BOOKS,
  BUNDLES,
  SERVICES,
  VALID_COUPONS,
  validateAndCalculateOrder
};
