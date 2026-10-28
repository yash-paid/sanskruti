// Sanskruti eBooks - Catalog & Application Logic

const BOOKS_DATA = [
  // --- MOTIVATIONAL & MINDSET ---
  {
    id: 'mind-1',
    title: 'The Unstoppable Mind: Master Self-Discipline & Iron Will',
    hindiTitle: 'अजेय मन: आत्म-अनुशासन और अदम्य संकल्प',
    author: 'Dr. Aarav Singhania',
    category: 'motivational',
    rating: 4.9,
    reviewsCount: 1420,
    price: 99,
    originalPrice: 499,
    discount: '80% OFF',
    pages: 245,
    format: 'PDF + EPUB',
    languages: 'Hindi & English',
    badge: 'Bestseller',
    color1: '#4338ca',
    color2: '#312e81',
    accentColor: '#818cf8',
    description: 'A psychological masterclass on eliminating procrastination, developing unstoppable mental toughness, and crushing self-doubt to conquer your highest goals.',
    sampleChapter: `
      <h4>Chapter 1: The Anatomy of Modern Distraction</h4>
      <p>Every single day, your mental bandwidth is under siege. Algorithms are engineered by the world's highest-paid engineers to steal the one finite asset you can never buy back: <strong>your focused attention</strong>.</p>
      <p>Discipline is not about sheer torturous punishment; it is about identity engineering. When you shift your self-narrative from "I am trying to concentrate" to "I am the type of human who finishes what I start," the friction disappears.</p>
      <p>In this chapter, we install the <em>10-Minute Friction Barrier</em> — an evidence-based neural cue that resets dopamine receptors before you embark on deep, meaningful work.</p>
    `
  },
  {
    id: 'mind-2',
    title: 'Atomic Habits for High Achievers',
    hindiTitle: 'शिखर सफलता की अचूक आदतें',
    author: 'Vivek Malhotra',
    category: 'motivational',
    rating: 4.9,
    reviewsCount: 2180,
    price: 129,
    originalPrice: 599,
    discount: '78% OFF',
    pages: 310,
    format: 'PDF + EPUB + Audio Summary',
    languages: 'English & Hindi',
    badge: 'Top Rated',
    color1: '#b45309',
    color2: '#78350f',
    accentColor: '#fbbf24',
    description: 'How small 1% compounding daily adjustments lead to monumental career breakthroughs, unstoppable health habits, and relentless consistency.',
    sampleChapter: `
      <h4>Chapter 1: The Power of 1% Compounding</h4>
      <p>If you get 1 percent better each day for one year, you’ll end up thirty-seven times better by the time you’re done. Conversely, if you get 1 percent worse each day for one year, you’ll decline nearly to zero.</p>
      <p>Winners and losers have the exact same goals. Every Olympic athlete wants gold; every student wants top rank. The goal cannot be the differentiator. The system is the differentiator.</p>
    `
  },
  {
    id: 'mind-3',
    title: 'Beyond Fear: Break Free from Anxiety & Overthinking',
    hindiTitle: 'भय से परे: चिंता और ओवरथिंकिंग पर विजय',
    author: 'Maya Kapoor',
    category: 'motivational',
    rating: 4.8,
    reviewsCount: 890,
    price: 89,
    originalPrice: 450,
    discount: '80% OFF',
    pages: 195,
    format: 'PDF + EPUB',
    languages: 'Hindi & English',
    badge: 'Trending',
    color1: '#0e7490',
    color2: '#155e75',
    accentColor: '#38bdf8',
    description: 'A compassionate, science-backed manual to silence negative mental loops, dissolve social fear, and reclaim your natural state of peaceful confidence.',
    sampleChapter: `
      <h4>Chapter 1: The Illusion of the Catastrophic Mind</h4>
      <p>90% of the nightmares you invent at 2 AM will never come to pass. Your sympathetic nervous system evolved to outrun predatory predators on the savannah, not to parse unread WhatsApp notifications or awkward meetings.</p>
      <p>Learn the <em>Somatic Grounding Sequence</em> to immediately pull electrical energy away from the hyperactive amygdala back into the prefrontal cortex within 90 seconds.</p>
    `
  },
  {
    id: 'mind-4',
    title: 'The Winner’s 5 AM Blueprint',
    hindiTitle: 'विजेता की सुबह: 5 AM ब्लूप्रिंट',
    author: 'Rohan Varma',
    category: 'motivational',
    rating: 4.8,
    reviewsCount: 750,
    price: 89,
    originalPrice: 399,
    discount: '77% OFF',
    pages: 180,
    format: 'PDF + Action Planner',
    languages: 'English & Hindi',
    badge: 'Popular',
    color1: '#be123c',
    color2: '#881337',
    accentColor: '#fb7185',
    description: 'Master the golden hours before the rest of the world wakes up. Includes neuro-priming rituals, morning hydration protocols, and daily goal activation.',
    sampleChapter: `
      <h4>Chapter 1: The Untouched Quiet of Dawn</h4>
      <p>When the sun rises, the demands of family, clients, and society seize your attention. But between 5:00 AM and 6:30 AM, your brain waves linger in a serene alpha state.</p>
      <p>Use the <em>20/20/20 Rule</em>: 20 minutes of heart-pumping sweat, 20 minutes of reflective contemplation, and 20 minutes of deep skill acquisition.</p>
    `
  },
  {
    id: 'mind-5',
    title: 'Art of Emotional Peace & Gita Wisdom',
    hindiTitle: 'गीता का ज्ञान: तनावमुक्त और शांत जीवन',
    author: 'Swami Anand Dev',
    category: 'motivational',
    rating: 5.0,
    reviewsCount: 2450,
    price: 119,
    originalPrice: 550,
    discount: '78% OFF',
    pages: 260,
    format: 'PDF + EPUB',
    languages: 'Hindi & Sanskrit Insights',
    badge: 'Must Read',
    color1: '#c2410c',
    color2: '#7c2d12',
    accentColor: '#fb923c',
    description: 'Timeless spiritual psychology translated for the hyper-paced modern lifestyle. Discover inner equilibrium amidst corporate chaos and emotional upheaval.',
    sampleChapter: `
      <h4>अध्याय 1: निष्काम कर्म और मन की स्थिरता</h4>
      <p>कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। जब हम परिणाम की चिंता में डूब जाते हैं, तो वर्तमान क्रिया की गुणवत्ता शून्य हो जाती है।</p>
      <p>यह पुस्तक आपको सिखाती है कि कैसे अपने दैनिक कार्य को ध्यान में बदलें ताकि चिंता और तनाव कभी आपकी आत्मा को स्पर्श न कर सकें।</p>
    `
  },
  {
    id: 'mind-6',
    title: 'The Wealth Mindset: Financial Freedom Blueprint',
    hindiTitle: 'अमीर सोच: वित्तीय स्वतंत्रता का मार्ग',
    author: 'Harshvardhan Joshi',
    category: 'motivational',
    rating: 4.9,
    reviewsCount: 1640,
    price: 149,
    originalPrice: 699,
    discount: '79% OFF',
    pages: 290,
    format: 'PDF + Budget Sheets',
    languages: 'Hindi & English',
    badge: 'Bestseller',
    color1: '#047857',
    color2: '#064e3b',
    accentColor: '#34d399',
    description: 'Break free from generational scarcity mindsets, build multiple cash-flow engines, and master the wealth psychology of self-made entrepreneurs.',
    sampleChapter: `
      <h4>Chapter 1: The Psychology of Money Velocity</h4>
      <p>Money is an amplifier, not a character trait. Poor people view money as something to be spent immediately before it vanishes; the middle class views it as safety; the wealthy view it as loyal soldiers sent out to capture more territory.</p>
      <p>Learn how to pivot from a consumer brain to an owner brain starting with your very next paycheck.</p>
    `
  },

  // --- HEALTH & NUTRITION ---
  {
    id: 'health-1',
    title: 'The Miracle of Gut Healing & Microbiome Restoration',
    hindiTitle: 'आंतों का स्वास्थ्य: पाचन और रोगमुक्ति',
    author: 'Dr. Sunita Rao, MD',
    category: 'health',
    rating: 4.9,
    reviewsCount: 1890,
    price: 129,
    originalPrice: 599,
    discount: '78% OFF',
    pages: 280,
    format: 'PDF + Recipe Guide',
    languages: 'Hindi & English',
    badge: 'Doctor Recommended',
    color1: '#059669',
    color2: '#065f46',
    accentColor: '#6ee7b7',
    description: 'Heal acid reflux, chronic bloating, IBS, and systemic inflammation naturally through traditional fermented foods and microbiome repair protocols.',
    sampleChapter: `
      <h4>Chapter 1: Your Second Brain is in Your Belly</h4>
      <p>Over 80% of your body’s serotonin (the joy molecule) is synthesized inside the mucosal lining of your gut by trillions of symbiotic bacteria.</p>
      <p>When you consume emulsifiers, refined oils, and artificial sweeteners, you inadvertently starve your protective bacterial colonies, triggering systemic brain fog and mood swings.</p>
      <p>Follow our 14-day prebiotic broth protocol to restore integrity to your intestinal barrier.</p>
    `
  },
  {
    id: 'health-2',
    title: 'The Ayurvedic Blueprint for Lifelong Vitality',
    hindiTitle: 'आयुर्वेद रहस्य: 100 वर्ष स्वस्थ और निरोगी जीवन',
    author: 'Vaidya Acharya Shresth',
    category: 'health',
    rating: 4.9,
    reviewsCount: 2310,
    price: 149,
    originalPrice: 699,
    discount: '78% OFF',
    pages: 340,
    format: 'PDF + EPUB + Dosha Chart',
    languages: 'Hindi & English',
    badge: 'Bestseller',
    color1: '#d97706',
    color2: '#92400e',
    accentColor: '#fde68a',
    description: 'Balance Vata, Pitta, and Kapha naturally. Learn kitchen herb pharmacy, Dinacharya daily rhythms, and seasonal cleanses to prevent chronic illnesses.',
    sampleChapter: `
      <h4>अध्याय 1: त्रिदोष संतुलन और रसोई घर की औषधियां</h4>
      <p>आयुर्वेद का मूल सिद्धांत है: 'स्वस्थस्य स्वास्थ्य रक्षणं, आतुरस्य विकार प्रशमनं च'। बीमारी का इंतजार मत करो; अपने शरीर को ऐसा बनाओ कि कोई रोग टिक ही न सके।</p>
      <p>आपकी रसोई में मौजूद सोंठ, हल्दी, दालचीनी और त्रिफला किसी भी महंगी दवा से अधिक सामर्थ्यवान हैं यदि उनका सही ऋतु और प्रकृति के अनुसार सेवन किया जाए।</p>
    `
  },
  {
    id: 'health-3',
    title: 'Sugar Detox & Reversing Insulin Resistance',
    hindiTitle: 'इंसुलिन रेजिस्टेंस और शुगर रिवर्सल गाइड',
    author: 'Dr. Pradeep Nair',
    category: 'health',
    rating: 4.8,
    reviewsCount: 1120,
    price: 119,
    originalPrice: 549,
    discount: '78% OFF',
    pages: 230,
    format: 'PDF + Meal Plans',
    languages: 'English & Hindi',
    badge: 'High Impact',
    color1: '#4f46e5',
    color2: '#3730a3',
    accentColor: '#a5b4fc',
    description: 'A clinical yet accessible roadmap to reversing fatty liver, pre-diabetes, and hormonal spikes through whole-food low-glycemic eating and meal timing.',
    sampleChapter: `
      <h4>Chapter 1: The Stealth Epidemic of Fatty Liver</h4>
      <p>You can be thin and still carry dangerously elevated visceral fat around your internal organs. Modern ultra-processed flour and liquid sugars overload liver mitochondria.</p>
      <p>Discover how eating order matters: consuming fiber first, protein second, and complex carbs last flattens glucose curves by up to 73%!</p>
    `
  },
  {
    id: 'health-4',
    title: 'Hormonal Harmony for Women: PCOD & Thyroid Freedom',
    hindiTitle: 'महिलाओं के लिए संपूर्ण हार्मोनल बैलेंस',
    author: 'Dr. Ananya Mukherjee',
    category: 'health',
    rating: 4.9,
    reviewsCount: 1540,
    price: 129,
    originalPrice: 599,
    discount: '78% OFF',
    pages: 275,
    format: 'PDF + Seed Cycling Guide',
    languages: 'Hindi & English',
    badge: 'Essential',
    color1: '#db2777',
    color2: '#9d174d',
    accentColor: '#f472b6',
    description: 'End cycle irregularity, stubborn hormonal acne, and unexplained weight gain through natural seed cycling, endocrine-friendly adaptogens, and stress shielding.',
    sampleChapter: `
      <h4>Chapter 1: Decoding Your Endocrine Signals</h4>
      <p>PCOS is not merely a reproductive condition — it is primarily a metabolic adaptation to modern environmental toxins, chronic cortisol, and glycemic instability.</p>
      <p>We break down step-by-step how seed cycling (flax, pumpkin, sesame, sunflower) works in sync with follicular and luteal phases to re-establish estrogen-progesterone harmony.</p>
    `
  },
  {
    id: 'health-5',
    title: 'Heart Strong: Natural Blood Pressure & Lipid Health',
    hindiTitle: 'हृदय सुरक्षा: प्राकृतिक रक्तचाप और कोलेस्ट्रॉल नियंत्रण',
    author: 'Dr. K. Radhakrishnan',
    category: 'health',
    rating: 4.8,
    reviewsCount: 920,
    price: 139,
    originalPrice: 650,
    discount: '78% OFF',
    pages: 260,
    format: 'PDF + Heart Diet Sheet',
    languages: 'English & Hindi',
    badge: 'Life Saver',
    color1: '#dc2626',
    color2: '#991b1b',
    accentColor: '#fca5a5',
    description: 'Prevent arterial stiffness, lower high blood pressure naturally, and understand the truth about cholesterol, inflammation, and cardiovascular resilience.',
    sampleChapter: `
      <h4>Chapter 1: Beyond the Cholesterol Myth</h4>
      <p>Cholesterol is not the arsonist; it is the firefighter sent to patch damaged, inflamed endothelial walls. The real villain is systemic vascular oxidation fueled by smoking, trans-fats, and chronic emotional distress.</p>
      <p>Discover nitric oxide boosting foods like beetroot, leafy greens, and pomegranate that naturally expand coronary blood vessels.</p>
    `
  },

  // --- FITNESS & LONGEVITY ---
  {
    id: 'fitness-1',
    title: 'Pranayama & Yogic Breathwork Mastery',
    hindiTitle: 'प्राणायाम और यौगिक श्वास साधना',
    author: 'Yogi Devendra Nath',
    category: 'fitness',
    rating: 5.0,
    reviewsCount: 2650,
    price: 99,
    originalPrice: 499,
    discount: '80% OFF',
    pages: 210,
    format: 'PDF + Illustrated Guide',
    languages: 'Hindi & English',
    badge: 'Masterclass',
    color1: '#7c3aed',
    color2: '#5b21b6',
    accentColor: '#c4b5fd',
    description: 'Harness the ancient science of Prana. Step-by-step illustrated breathwork for instant vagus nerve activation, lung capacity expansion, and meditation depth.',
    sampleChapter: `
      <h4>अध्याय 1: प्राण शक्ति का विज्ञान</h4>
      <p>जैसे ही आपकी श्वास की गति धीमी और गहरी होती है, आपका मस्तिष्क तुरंत विश्राम और कायाकल्प की स्थिति में आ जाता है। अनुलोम-विलोम, भस्त्रिका और भ्रामरी के सूक्ष्म नियम सीखें।</p>
    `
  },
  {
    id: 'fitness-2',
    title: 'Home Workout Mastery: Zero Equipment, Maximum Strength',
    hindiTitle: 'होम वर्कआउट: बिना जिम बॉडी ट्रांसफॉर्मेशन',
    author: 'Coach Vikram Thapa',
    category: 'fitness',
    rating: 4.8,
    reviewsCount: 1380,
    price: 119,
    originalPrice: 499,
    discount: '76% OFF',
    pages: 205,
    format: 'PDF + Exercise Video Links',
    languages: 'Hindi & English',
    badge: 'Action Packed',
    color1: '#ea580c',
    color2: '#9a3412',
    accentColor: '#fdba74',
    description: 'Transform your physique using bodyweight calisthenics, progressive overload at home, posture correction, and 20-minute fat-burning HIIT protocols.',
    sampleChapter: `
      <h4>Chapter 1: Progressive Overload with Your Own Mass</h4>
      <p>You don't need thousand-rupee gym memberships or fancy iron dumbbells to build dense, functional muscle. The Roman legions and ancient Akhada pehlwans built unbreakable armor with bodyweight mastery.</p>
    `
  },
  {
    id: 'fitness-3',
    title: 'Deep Sleep Revolution: Sleep Like a Baby',
    hindiTitle: 'गहरी नींद क्रांति: अनिद्रा से स्थायी मुक्ति',
    author: 'Dr. Natasha Sen',
    category: 'fitness',
    rating: 4.9,
    reviewsCount: 1470,
    price: 89,
    originalPrice: 399,
    discount: '77% OFF',
    pages: 185,
    format: 'PDF + Night Routine Guide',
    languages: 'English & Hindi',
    badge: 'Restorative',
    color1: '#1e3a8a',
    color2: '#172554',
    accentColor: '#93c5fd',
    description: 'Fix your broken circadian clock, banish insomnia, optimize REM and deep delta waves, and wake up energized without reliance on caffeine or sleeping pills.',
    sampleChapter: `
      <h4>Chapter 1: The Circadian Architecture</h4>
      <p>Viewing morning sunlight within 30 minutes of waking sets a biological countdown timer for evening melatonin release 14 hours later. Master the evening light environment to protect your brain.</p>
    `
  },
  {
    id: 'fitness-4',
    title: 'The Cellular Longevity & Anti-Aging Code',
    hindiTitle: 'दीर्घायु और यौवन रक्षा रहस्य',
    author: 'Dr. Vikramaditya Roy',
    category: 'fitness',
    rating: 4.9,
    reviewsCount: 880,
    price: 149,
    originalPrice: 699,
    discount: '78% OFF',
    pages: 310,
    format: 'PDF + Fasting Schedules',
    languages: 'English & Hindi',
    badge: 'Advanced Science',
    color1: '#0f766e',
    color2: '#134e4a',
    accentColor: '#5eead4',
    description: 'Unlock autophagy through smart intermittent fasting, mitochondrial biogenesis, telomere preservation, and cold/heat thermogenesis protocols.',
    sampleChapter: `
      <h4>Chapter 1: Activating Cellular Autophagy</h4>
      <p>When cells are continuously supplied with incoming nutrients, they never clean up damaged organelles and folded proteins. Fasting acts as your body’s deep biological vacuum cleaner.</p>
    `
  }
];

// Bundles Data
const BUNDLES_DATA = [
  {
    id: 'bundle-mind',
    title: 'Ultimate Mindset & Motivation Combo',
    booksCount: 6,
    price: 299,
    originalPrice: 2999,
    discount: '90% OFF',
    tag: 'Bestseller Bundle',
    description: 'All 6 top motivational eBooks including The Unstoppable Mind, Atomic Habits, Beyond Fear & Gita Wisdom.',
    items: ['The Unstoppable Mind', 'Atomic Habits for High Achievers', 'Beyond Fear', 'The Winner’s 5 AM Blueprint', 'Art of Emotional Peace', 'The Wealth Mindset']
  },
  {
    id: 'bundle-health',
    title: 'Holistic Health & Longevity Master Pack',
    booksCount: 5,
    price: 249,
    originalPrice: 2899,
    discount: '91% OFF',
    tag: 'Doctor Recommended',
    description: 'Complete health library: Gut Healing, Ayurvedic Vitality, Sugar Reversal, Hormone Balance & Heart Strong.',
    items: ['Miracle of Gut Healing', 'Ayurvedic Blueprint', 'Sugar Detox & Insulin Reversal', 'Hormonal Harmony', 'Heart Strong']
  },
  {
    id: 'bundle-mega',
    title: 'Sanskruti All-In-One Mega Digital Library',
    booksCount: 15,
    price: 499,
    originalPrice: 7999,
    discount: '93% OFF',
    tag: 'Most Value ⭐',
    featured: true,
    description: 'Lifetime access to all 15 Motivational, Mindset, Health, Ayurveda & Fitness eBooks + All future updates free.',
    items: ['All 6 Motivational eBooks', 'All 5 Health & Nutrition eBooks', 'All 4 Fitness & Longevity eBooks', 'Free Audio Summaries & Action Checklists']
  }
];

// App State
let state = {
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'featured',
  cart: [],
  discountCode: '',
  discountMultiplier: 1.0,
  selectedBook: null,
  activeCheckoutItem: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderBooks();
  renderBundles();
  initEventListeners();
  loadCartFromStorage();
  updateCartUI();
});

// Render Books Catalog
function renderBooks() {
  const container = document.getElementById('booksGrid');
  if (!container) return;

  let filtered = BOOKS_DATA.filter(book => {
    const matchesCat = state.currentCategory === 'all' || book.category === state.currentCategory;
    const matchesSearch = !state.searchQuery || 
      book.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      book.hindiTitle.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      book.description.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Sorting
  if (state.sortBy === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortBy === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (state.sortBy === 'reviews') {
    filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-sub); margin-bottom: 1rem;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <h3 style="color: #fff; margin-bottom: 0.5rem;">No eBooks found</h3>
        <p style="color: var(--text-muted); font-size: 0.95rem;">Try adjusting your search keyword or change the category filter.</p>
        <button class="pill-btn active" style="margin: 1.5rem auto 0; display: inline-flex;" onclick="resetFilters()">Show All eBooks</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(book => {
    const badgeCategory = book.category === 'motivational' ? 'badge-motivation' : 
                          book.category === 'health' ? 'badge-health' : 'badge-fitness';
    const categoryLabel = book.category === 'motivational' ? 'Motivational & Mindset' : 
                          book.category === 'health' ? 'Health & Nutrition' : 'Fitness & Longevity';

    return `
      <article class="book-card" data-id="${book.id}">
        <!-- Cover 3D Presentation -->
        <div class="book-cover-area">
          <div class="card-category-badge ${badgeCategory}">${categoryLabel}</div>
          <div class="card-discount-badge">${book.discount}</div>
          
          <div class="book-cover-3d" style="background: linear-gradient(135deg, ${book.color1} 0%, ${book.color2} 100%); border: 1px solid ${book.accentColor};">
            <span class="cover-badge" style="color: ${book.accentColor};">${book.badge}</span>
            <div>
              <div style="font-size: 1.4rem; margin-bottom: 0.2rem; margin-left: 6px;">${book.category === 'motivational' ? '⚡' : book.category === 'health' ? '🌿' : '🧘'}</div>
              <div class="cover-title">${book.title}</div>
              <div class="cover-author" style="margin-top: 0.3rem;">By ${book.author}</div>
            </div>
            <div style="font-size: 0.6rem; opacity: 0.8; letter-spacing: 1px; text-transform: uppercase;">Sanskruti Edition</div>
          </div>
        </div>

        <!-- Details -->
        <div class="book-details">
          <div class="book-meta-row">
            <div class="rating-stars">
              ★ <span>${book.rating}</span> <span style="color: var(--text-dim); font-weight: 500;">(${book.reviewsCount.toLocaleString()})</span>
            </div>
            <span>${book.languages}</span>
          </div>

          <h3 class="book-title" title="${book.title}">${book.title}</h3>
          <p style="font-size: 0.82rem; color: var(--accent-gold); margin-bottom: 0.4rem; font-weight: 600;">${book.hindiTitle}</p>
          <div class="book-author">By ${book.author}</div>

          <div class="book-specs-chips">
            <span class="spec-chip">📄 ${book.pages} Pages</span>
            <span class="spec-chip">⚡ Instant PDF</span>
            <span class="spec-chip">📱 Mobile + PC</span>
          </div>

          <!-- Footer Price & CTAs -->
          <div class="card-footer">
            <div class="price-row">
              <span class="current-price">₹${book.price}</span>
              <span class="original-price">₹${book.originalPrice}</span>
              <span class="format-text">Digital eBook</span>
            </div>

            <div class="card-action-btns">
              <button class="btn-sample" onclick="openSampleModal('${book.id}')" aria-label="Read Sample for ${book.title}">
                📖 Preview
              </button>
              <button class="btn-buy-card" onclick="openDirectBuy('${book.id}')" aria-label="Buy Now ${book.title}">
                ⚡ Buy Now
              </button>
            </div>

            <button class="btn-add-cart" onclick="addToCart('${book.id}')">
              <span>+ Add to Reading Cart</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Render Bundles
function renderBundles() {
  const container = document.getElementById('bundlesGrid');
  if (!container) return;

  container.innerHTML = BUNDLES_DATA.map(b => `
    <div class="bundle-card ${b.featured ? 'featured' : ''}">
      <div class="bundle-tag">${b.tag}</div>
      <h3 class="bundle-title">${b.title}</h3>
      <p class="bundle-desc">${b.description}</p>

      <ul class="bundle-features">
        ${b.items.map(item => `
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span>${item}</span>
          </li>
        `).join('')}
      </ul>

      <div class="bundle-pricing">
        <div>
          <span class="bundle-price-val">₹${b.price}</span>
          <span class="bundle-strike">₹${b.originalPrice}</span>
        </div>
        <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 0.3rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.85rem;">
          ${b.discount}
        </span>
      </div>

      <button class="btn-bundle-buy" onclick="openBundleBuy('${b.id}')">
        🚀 Get Complete Pack for ₹${b.price}
      </button>
    </div>
  `).join('');
}

// Event Listeners Initialization
function initEventListeners() {
  // Category buttons
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentCategory = btn.getAttribute('data-cat') || 'all';
      renderBooks();
    });
  });

  // Search Input & Clear Button
  const searchInput = document.getElementById('bookSearch');
  const searchClearBtn = document.getElementById('searchClearBtn');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      if (searchClearBtn) {
        searchClearBtn.style.display = state.searchQuery ? 'flex' : 'none';
      }
      renderBooks();
    });
  }

  // Sort Select
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderBooks();
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

  // Close modals when clicking backdrop or ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
      closeCartDrawer();
    }
  });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
  const overlay = document.getElementById('mobileMenuOverlay');
  if (overlay) {
    overlay.classList.toggle('active');
  }
}

// Global Category Filter from anywhere (Header, Footer, Bundles)
function setCategory(cat) {
  state.currentCategory = cat;
  document.querySelectorAll('.pill-btn').forEach(btn => {
    if (btn.getAttribute('data-cat') === cat) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  renderBooks();
  const catalogEl = document.getElementById('catalog');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
}

function clearSearch() {
  const input = document.getElementById('bookSearch');
  const btn = document.getElementById('searchClearBtn');
  if (input) input.value = '';
  if (btn) btn.style.display = 'none';
  state.searchQuery = '';
  renderBooks();
}

function resetFilters() {
  state.currentCategory = 'all';
  state.searchQuery = '';
  const searchInput = document.getElementById('bookSearch');
  const searchClearBtn = document.getElementById('searchClearBtn');
  if (searchInput) searchInput.value = '';
  if (searchClearBtn) searchClearBtn.style.display = 'none';
  document.querySelectorAll('.pill-btn').forEach(b => {
    if (b.getAttribute('data-cat') === 'all') b.classList.add('active');
    else b.classList.remove('active');
  });
  renderBooks();
}

// Sample Reader Modal with interactive E-Reader Controls
let currentReaderFontSize = 16;

function changeReaderFontSize(delta) {
  currentReaderFontSize = Math.max(13, Math.min(22, currentReaderFontSize + delta));
  const readerWindow = document.getElementById('readerContentWindow');
  if (readerWindow) {
    readerWindow.style.fontSize = currentReaderFontSize + 'px';
  }
}

function setReaderTheme(theme) {
  const readerWindow = document.getElementById('readerContentWindow');
  document.querySelectorAll('.reader-theme-btn').forEach(b => b.classList.remove('active'));
  if (!readerWindow) return;

  readerWindow.classList.remove('sepia-mode', 'day-mode');
  if (theme === 'sepia') {
    readerWindow.classList.add('sepia-mode');
    document.getElementById('btnThemeSepia')?.classList.add('active');
  } else if (theme === 'day') {
    readerWindow.classList.add('day-mode');
    document.getElementById('btnThemeDay')?.classList.add('active');
  } else {
    document.getElementById('btnThemeDark')?.classList.add('active');
  }
}

function openSampleModal(bookId) {
  const book = BOOKS_DATA.find(b => b.id === bookId);
  if (!book) return;

  const modal = document.getElementById('previewModal');
  const modalBody = document.getElementById('previewModalBody');
  if (!modal || !modalBody) return;

  currentReaderFontSize = 16;

  modalBody.innerHTML = `
    <div class="preview-header">
      <div class="preview-cover-thumb" style="background: linear-gradient(135deg, ${book.color1} 0%, ${book.color2} 100%);">
        <div>${book.title}</div>
      </div>
      <div>
        <div style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 700; text-transform: uppercase;">Free Sample Chapter Preview</div>
        <h2 style="font-size: 1.45rem; color: #fff; margin: 0.2rem 0 0.4rem;">${book.title}</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">By ${book.author} • Rating: ★ ${book.rating} (${book.reviewsCount.toLocaleString()} readers)</p>
        <p style="color: var(--accent-gold); font-size: 0.88rem; margin-top: 0.3rem;">${book.hindiTitle}</p>
      </div>
    </div>

    <!-- Interactive E-Reader Controls Toolbar -->
    <div class="reader-toolbar">
      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <span style="font-size: 0.8rem; color: var(--text-muted);">Mode:</span>
        <button id="btnThemeDark" class="reader-theme-btn active" onclick="setReaderTheme('dark')">🌙 Night</button>
        <button id="btnThemeSepia" class="reader-theme-btn" onclick="setReaderTheme('sepia')">📜 Sepia</button>
        <button id="btnThemeDay" class="reader-theme-btn" onclick="setReaderTheme('day')">☀️ Day</button>
      </div>

      <div style="display: flex; align-items: center; gap: 0.4rem;">
        <span style="font-size: 0.8rem; color: var(--text-muted);">Text Size:</span>
        <button class="reader-theme-btn" onclick="changeReaderFontSize(-2)" title="Smaller text">A-</button>
        <button class="reader-theme-btn" onclick="changeReaderFontSize(2)" title="Larger text">A+</button>
      </div>
    </div>

    <div id="readerContentWindow" class="preview-reading-window">
      ${book.sampleChapter}
      <hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 1.5rem 0;" />
      <p style="font-size: 0.9rem; color: var(--text-muted); font-style: italic;">
        To unlock the full <strong>${book.pages} pages</strong> along with actionable worksheets, exercises, and life-changing strategies, get your complete digital copy below.
      </p>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: var(--bg-primary); padding: 1.2rem; border-radius: 12px; border: 1px solid var(--border-subtle);">
      <div>
        <span style="font-size: 0.85rem; color: var(--text-muted);">Instant Lifetime Download Price:</span>
        <div style="font-size: 1.5rem; font-weight: 800; color: #fff;">
          ₹${book.price} <span style="font-size: 0.9rem; color: var(--text-dim); text-decoration: line-through;">₹${book.originalPrice}</span>
        </div>
      </div>
      <div style="display: flex; gap: 0.6rem;">
        <button class="btn-primary" style="padding: 0.75rem 1.4rem;" onclick="closeModal('previewModal'); openDirectBuy('${book.id}');">
          ⚡ Get Full eBook for ₹${book.price}
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Instant Direct Buy Checkout Modal
function openDirectBuy(bookId) {
  const book = BOOKS_DATA.find(b => b.id === bookId);
  if (!book) return;

  state.activeCheckoutItem = {
    type: 'single',
    title: book.title,
    price: book.price,
    originalPrice: book.originalPrice,
    id: book.id
  };

  showCheckoutModal();
}

function openBundleBuy(bundleId) {
  const bundle = BUNDLES_DATA.find(b => b.id === bundleId);
  if (!bundle) return;

  state.activeCheckoutItem = {
    type: 'bundle',
    title: bundle.title,
    price: bundle.price,
    originalPrice: bundle.originalPrice,
    id: bundle.id
  };

  showCheckoutModal();
}

// PayU Environment Cache (defaults safely to TEST)
let payuEnvState = { mode: 'TEST', isLive: false, loaded: false };

async function fetchPayUConfig() {
  if (payuEnvState.loaded) return payuEnvState;
  try {
    let res = await fetch('/.netlify/functions/payu-config');
    if (!res.ok) {
      res = await fetch('/api/payu-config');
    }
    const data = await res.json();
    if (data && data.success) {
      payuEnvState = { mode: data.mode, isLive: data.isLive, loaded: true };
    }
  } catch (e) {
    payuEnvState = { mode: 'TEST', isLive: false, loaded: true };
  }
  return payuEnvState;
}

// Fetch PayU config on script load
fetchPayUConfig();

function clearCheckoutErrors() {
  const banner = document.getElementById('checkoutErrorBanner');
  if (banner) {
    banner.style.display = 'none';
    banner.textContent = '';
  }
  ['custName', 'custWhatsapp', 'custEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('input-error');
  });
}

function displayCheckoutError(message, inputId) {
  const banner = document.getElementById('checkoutErrorBanner');
  if (banner) {
    banner.textContent = '⚠️ ' + message;
    banner.style.display = 'block';
  }
  if (inputId) {
    const el = document.getElementById(inputId);
    if (el) {
      el.classList.add('input-error');
      el.focus();
    }
  }
  showToast(message, 'error');
}

function showCheckoutModal() {
  const item = state.activeCheckoutItem;
  if (!item) return;

  const modal = document.getElementById('checkoutModal');
  const modalBody = document.getElementById('checkoutModalBody');
  if (!modal || !modalBody) return;

  const upiId = "9238861171@ybl";
  const upiPayLink = `upi://pay?pa=${upiId}&pn=Sanskruti%20eBooks&am=${item.price}&cu=INR&tn=${encodeURIComponent('Order for ' + item.title.substring(0, 30))}`;
  const whatsappNumber = "919238861171";
  const whatsappPreFilled = encodeURIComponent(`Namaste Sanskruti eBooks Team, I want to purchase "${item.title}" for ₹${item.price}. I have paid via UPI / please send me the direct payment & download link.`);

  const modeBadge = payuEnvState.isLive
    ? '<span class="payu-badge-tag">🔒 PayU 256-Bit SSL Checkout</span>'
    : '<span class="payu-badge-tag sandbox">🧪 PayU Sandbox Mode (Test)</span>';

  modalBody.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <span style="font-size: 0.8rem; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 700; text-transform: uppercase;">Instant Digital Delivery</span>
      <h2 style="font-size: 1.6rem; color: #fff; margin-top: 0.5rem;">Complete Your eBook Order</h2>
      <p style="color: var(--text-muted); font-size: 0.92rem;">Choose your preferred payment method: PayU Hosted Checkout or Direct UPI.</p>
    </div>

    <div class="checkout-grid">
      <!-- Left: PayU Hosted Checkout Form (Cards, UPI, NetBanking, Wallets) -->
      <div>
        <div class="order-summary-box">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div style="font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Order Summary</div>
            ${modeBadge}
          </div>
          <div style="color: #fff; font-weight: 700; font-size: 1rem; margin-bottom: 0.6rem;">${item.title}</div>
          
          <div class="order-row">
            <span>Original Price:</span>
            <span>₹${item.originalPrice}</span>
          </div>
          <div class="order-row" style="color: var(--accent-emerald);">
            <span>Instant Digital Discount:</span>
            <span>- ₹${item.originalPrice - item.price}</span>
          </div>
          <div class="order-row total">
            <span>Total Payable:</span>
            <span style="color: var(--accent-gold);">₹${item.price}</span>
          </div>
        </div>

        <form class="checkout-form" id="checkoutDetailsForm" novalidate onsubmit="initiatePayUCheckout(event)">
          <div id="checkoutErrorBanner" class="checkout-error-banner" role="alert"></div>

          <div class="form-group">
            <input type="text" id="custName" value="Sanskruti" placeholder="Your Full Name *" required autocomplete="name" oninput="this.classList.remove('input-error')" />
          </div>
          <div class="form-group">
            <input type="tel" id="custWhatsapp" value="9238861171" placeholder="10-digit WhatsApp Number * (e.g. 9876543210)" required autocomplete="tel" oninput="this.classList.remove('input-error')" />
          </div>
          <div class="form-group">
            <input type="email" id="custEmail" value="paid32041@gmail.com" placeholder="Email Address * (for PayU receipt & downloads)" required autocomplete="email" oninput="this.classList.remove('input-error')" />
          </div>

          <button type="button" id="btnPayUCheckout" class="btn-payu" onclick="initiatePayUCheckout(event)">
            💳 Pay via PayU (Cards, UPI, NetBanking, Wallets)
          </button>

          <div class="payu-trust-note">
            <span>🔒 256-Bit SSL Encrypted • Verified Server Hash Protection</span>
          </div>
        </form>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Initiates PayU India Hosted Checkout via Netlify Function
 */
async function initiatePayUCheckout(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();

  clearCheckoutErrors();

  const nameInput = document.getElementById('custName');
  const phoneInput = document.getElementById('custWhatsapp');
  const emailInput = document.getElementById('custEmail');
  const btn = document.getElementById('btnPayUCheckout');

  const name = (nameInput && nameInput.value.trim()) || 'Sanskruti';
  let phone = (phoneInput && phoneInput.value.trim().replace(/[^0-9]/g, '')) || '9238861171';
  const email = (emailInput && emailInput.value.trim().toLowerCase()) || 'paid32041@gmail.com';
  const item = state.activeCheckoutItem;

  if (!item) {
    displayCheckoutError('No item selected for checkout. Please select an eBook or bundle first.');
    return;
  }

  if (!name || name.length < 2) {
    displayCheckoutError('Please enter your full name (at least 2 letters).', 'custName');
    return;
  }

  // Normalize Indian phone formats: +919876543210 (12 digits) or 09876543210 (11 digits)
  if (phone.startsWith('91') && phone.length === 12) {
    phone = phone.slice(2);
  } else if (phone.startsWith('0') && phone.length === 11) {
    phone = phone.slice(1);
  }

  if (phone.length !== 10) {
    displayCheckoutError('Please enter a valid 10-digit WhatsApp number (e.g. 9876543210).', 'custWhatsapp');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    displayCheckoutError('Please enter a valid email address (e.g. name@example.com).', 'custEmail');
    return;
  }

  // Update button state with spinner
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Connecting to PayU Gateway...';
  }

  try {
    const payload = {
      itemType: item.type,
      itemId: item.id,
      cartItems: item.type === 'cart' ? state.cart.map(b => b.id) : [],
      couponCode: state.discountCode || '',
      name,
      phone,
      email
    };

    // Try canonical Netlify Functions route directly, with fallback to /api/
    let response;
    try {
      response = await fetch('/.netlify/functions/payu-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.status === 404) {
        response = await fetch('/api/payu-initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (netErr) {
      response = await fetch('/api/payu-initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      throw new Error(`Server returned status ${response.status} (${rawText.slice(0, 100)})`);
    }

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to initiate PayU payment.');
    }

    showToast('Redirecting to PayU Hosted Checkout...', 'success');

    // Build and submit hidden POST form to PayU Hosted Checkout endpoint
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = data.actionUrl;
    form.style.display = 'none';

    for (const [key, val] of Object.entries(data.params)) {
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = key;
      hiddenInput.value = val;
      form.appendChild(hiddenInput);
    }

    document.body.appendChild(form);
    form.submit();

  } catch (err) {
    console.error('PayU Checkout Error:', err);
    displayCheckoutError(err.message || 'Payment initiation failed. Please try again.');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '💳 Pay via PayU (Cards, UPI, NetBanking, Wallets)';
    }
  }
}


/**
 * Fallback Manual UPI Order Submission (Preserved from original code)
 */
function handleManualUpiSubmit() {
  const nameInput = document.getElementById('custName');
  const phoneInput = document.getElementById('custWhatsapp');

  const name = nameInput ? nameInput.value.trim() : 'Reader';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const item = state.activeCheckoutItem;

  if (!item) return;

  const modalBody = document.getElementById('checkoutModalBody');
  modalBody.innerHTML = `
    <div style="text-align: center; padding: 2rem 1rem;">
      <div style="width: 70px; height: 70px; background: rgba(16, 185, 129, 0.15); border: 2px solid var(--accent-emerald); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; color: var(--accent-emerald); font-size: 2rem;">
        ✓
      </div>
      <h2 style="color: #fff; font-size: 1.8rem; margin-bottom: 0.5rem;">UPI Payment Registered!</h2>
      <p style="color: var(--text-muted); font-size: 1rem; max-width: 480px; margin: 0 auto 1.5rem;">
        Thank you, <strong>${name}</strong>! Your eBook order for <strong>${item.title}</strong> has been noted.
      </p>

      <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid var(--border-light); border-radius: 12px; padding: 1.5rem; max-width: 450px; margin: 0 auto 2rem; text-align: left;">
        <div style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 700; margin-bottom: 0.5rem;">MANUAL UPI VERIFICATION</div>
        <div style="font-size: 0.95rem; color: #fff; margin-bottom: 0.4rem;">📱 WhatsApp Delivery to: <strong>+91 ${phone || 'Your Phone'}</strong></div>
        <div style="font-size: 0.85rem; color: var(--text-muted);">Please send your UPI payment screenshot to our WhatsApp support team for instant confirmation.</div>
      </div>

      <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
        <button class="btn-primary" onclick="simulateDownload('${item.title}')">
          📥 Direct Download Sample PDF
        </button>
        <a href="https://wa.me/919238861171?text=${encodeURIComponent('Hello! I submitted payment via UPI for ' + item.title + '. My name is ' + name)}" target="_blank" class="whatsapp-nav-btn">
          💬 Confirm on WhatsApp
        </a>
      </div>
    </div>
  `;
}

function handleOrderSubmit(e) {
  initiatePayUCheckout(e);
}


function simulateDownload(bookTitle) {
  showToast(`Initiating download for "${bookTitle}"...`);
  setTimeout(() => {
    // Generate a downloadable sample text file as a mock eBook representation
    const sampleContent = `========================================================\nSANSKRUTI E-BOOKS - DIGITAL EDITION\nTitle: ${bookTitle}\nLicensed To: Verified Reader\n========================================================\n\nThank you for choosing Sanskruti eBooks!\nEnjoy your journey of self-mastery, healthy living, and mental strength.\n\nSupport & Inquiries: +91 9238861171\nWebsite: https://sanskrutiservice.in\n========================================================`;
    const blob = new Blob([sampleContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bookTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Sanskruti.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Download started successfully! Enjoy reading.');
  }, 1000);
}

function copyUPI(upiId) {
  navigator.clipboard.writeText(upiId).then(() => {
    showToast('UPI ID copied to clipboard: ' + upiId);
    const copyBtns = document.querySelectorAll('.btn-copy-upi');
    copyBtns.forEach(btn => {
      const origText = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.style.background = 'var(--accent-emerald)';
      setTimeout(() => {
        btn.textContent = origText;
        btn.style.background = '';
      }, 2500);
    });
  }).catch(() => {
    showToast('UPI ID: ' + upiId);
  });
}

// Free Chapter Lead Capture
function submitLeadCapture(e) {
  e.preventDefault();
  const phone = document.getElementById('leadWhatsapp').value.trim();
  showToast(`Success! Free 3-Chapter Preview pack prepared for +91 ${phone}`);
  
  // Trigger simulated starter pack download
  setTimeout(() => {
    simulateDownload('Sanskruti_Free_3_Chapter_Starter_Pack');
  }, 600);

  // Pre-fill WhatsApp message for the user
  const waUrl = `https://wa.me/919238861171?text=${encodeURIComponent('Hello Sanskruti eBooks! I requested the Free 3-Chapter Starter Pack for my number: ' + phone)}`;
  window.open(waUrl, '_blank');

  document.getElementById('leadWhatsapp').value = '';
}
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
  document.body.style.overflow = '';
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
  document.body.style.overflow = '';
}

// Cart System
function addToCart(bookId) {
  const book = BOOKS_DATA.find(b => b.id === bookId);
  if (!book) return;

  const exists = state.cart.find(item => item.id === bookId);
  if (exists) {
    showToast('Book is already in your reading cart!');
    openCartDrawer();
    return;
  }

  state.cart.push(book);
  saveCartToStorage();
  updateCartUI();
  showToast(`Added "${book.title}" to cart!`);
  openCartDrawer();
}

function removeFromCart(bookId) {
  state.cart = state.cart.filter(item => item.id !== bookId);
  saveCartToStorage();
  updateCartUI();
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = state.cart.length;

  const cartList = document.getElementById('cartDrawerItems');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');

  if (!cartList) return;

  if (state.cart.length === 0) {
    cartList.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; color: #fff; margin-bottom: 0.5rem;">Your reading cart is empty</p>
        <p style="font-size: 0.88rem;">Explore our motivational and health eBooks to add to your library.</p>
      </div>
    `;
    if (cartSubtotal) cartSubtotal.textContent = '₹0';
    if (cartTotal) cartTotal.textContent = '₹0';
    return;
  }

  cartList.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div style="width: 40px; height: 55px; border-radius: 4px; background: linear-gradient(135deg, ${item.color1}, ${item.color2}); display: flex; align-items: center; justify-content: center; font-size: 0.5rem; color: #fff; font-weight: 700; text-align: center; padding: 2px;">
        eBook
      </div>
      <div style="flex: 1;">
        <div class="cart-item-title">${item.title}</div>
        <div class="cart-item-price">₹${item.price} <span style="text-decoration: line-through; color: var(--text-sub); font-size: 0.78rem;">₹${item.originalPrice}</span></div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')" title="Remove">✕</button>
    </div>
  `).join('');

  const subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
  const total = Math.round(subtotal * state.discountMultiplier);

  if (cartSubtotal) cartSubtotal.textContent = `₹${subtotal}`;
  if (cartTotal) cartTotal.textContent = `₹${total}`;
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (code === 'SANSKRUTI50' || code === 'WELCOME50') {
    state.discountMultiplier = 0.5;
    state.discountCode = code;
    showToast('Coupon Applied! 50% extra discount added.');
    updateCartUI();
  } else if (code === 'GROW20') {
    state.discountMultiplier = 0.8;
    state.discountCode = code;
    showToast('Coupon Applied! 20% extra discount added.');
    updateCartUI();
  } else {
    showToast('Invalid promo code. Try "SANSKRUTI50"');
  }
}

function checkoutCart() {
  if (state.cart.length === 0) {
    showToast('Your cart is empty!');
    return;
  }

  const subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
  const total = Math.round(subtotal * state.discountMultiplier);

  state.activeCheckoutItem = {
    type: 'cart',
    title: `Cart Bundle (${state.cart.length} eBooks: ${state.cart.map(b => b.title.substring(0, 15)).join(', ')}...)`,
    price: total,
    originalPrice: subtotal * 3,
    id: 'cart-checkout'
  };

  closeCartDrawer();
  showCheckoutModal();
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartDrawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartDrawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function saveCartToStorage() {
  try {
    localStorage.setItem('sanskruti_cart', JSON.stringify(state.cart.map(b => b.id)));
  } catch (e) {}
}

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('sanskruti_cart');
    if (saved) {
      const ids = JSON.parse(saved);
      state.cart = BOOKS_DATA.filter(b => ids.includes(b.id));
    }
  } catch (e) {}
}

// User Reviews Submission
function submitUserReview(e) {
  e.preventDefault();
  const name = document.getElementById('reviewName').value.trim();
  const bookTag = document.getElementById('reviewBookSelect').value;
  const rating = document.getElementById('reviewRating').value;
  const text = document.getElementById('reviewText').value.trim();

  if (!name || !text) return;

  const reviewsGrid = document.querySelector('.reviews-grid');
  if (reviewsGrid) {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-top">
        <div class="reviewer-profile">
          <div class="reviewer-avatar">${name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="reviewer-name">${name}</div>
            <div class="reviewer-location">India • Just Now</div>
          </div>
        </div>
        <!-- Note: badge removed — reviews submitted via form are not independently verified -->
      </div>
      <div class="review-stars">${'★'.repeat(parseInt(rating))}</div>
      <div class="review-book-tag">📖 Read: ${bookTag}</div>
      <p class="review-comment">"${text}"</p>
    `;
    reviewsGrid.insertBefore(card, reviewsGrid.firstChild);
  }

  showToast('Thank you! Your reader review has been published.');
  document.getElementById('reviewName').value = '';
  document.getElementById('reviewText').value = '';
}

// (submitLeadCapture is defined once above at line ~977 — duplicate removed)

// Toast Notifications
function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const isError = type === 'error';
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.innerHTML = isError ? `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    <span>${msg}</span>
  ` : `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
    <span>${msg}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}