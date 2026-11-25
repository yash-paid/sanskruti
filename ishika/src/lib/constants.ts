// ============================================================
// ISHIKA'S WORLD — Brand Constants
// ============================================================

export const BRAND = {
  name: "ISHIKA'S WORLD",
  tagline: "Official Digital Universe of Ishq Army 💚",
  description: "The luxury creator hub bringing together Shiddat, Not My Type, Pretending To Be Yours, and Eclipsé Stories under one exclusive platform.",
  email: "hello@ishikasworld.com",
  instagram: "@ishikasworld",
  youtube: "https://www.youtube.com/@Ishq_31",
} as const;

export const YOUTUBE_CHANNELS = [
  {
    handle: '@Ishq_31',
    name: 'ɪsʜɪᴋᴀ',
    url: 'https://www.youtube.com/@Ishq_31',
    subscribers: '4.2K+',
    videos: 'Series',
    description: 'Home of the mega-hit series "Shiddat (When Love Has No Gender)" featuring Yashvi ♾️ Vandana.',
    avatar: 'https://yt3.googleusercontent.com/WszhonG7nLbylLVDwyJeMRn2_RNuJwfGYKfamIEUCKTXPNQ7nb-WuDWpQZlZkQhyvxv4JqFq=s900-c-k-c0x00ffffff-no-rj',
    badge: 'Shiddat 🌈',
  },
  {
    handle: '@ishika3106',
    name: 'ɪsʜǫ',
    url: 'https://www.youtube.com/@ishika3106',
    subscribers: '11K+',
    videos: '35 videos',
    description: 'Home of the popular romantic series "Not My Type 🫀" and special story arcs.',
    avatar: 'https://yt3.googleusercontent.com/qUGWfjx_oHmlc2Dnbto5UAWzl8xNgIilm5rlirNbWwgyvgh2RLayX1wxKRQhniT1268JAX_enQ=s900-c-k-c0x00ffffff-no-rj',
    badge: 'Not My Type 🫀',
  },
  {
    handle: '@bakwas_On_31',
    name: 'Ishq Army 💚',
    url: 'https://www.youtube.com/@bakwas_On_31',
    subscribers: '10.7K+',
    videos: '46 videos',
    description: 'Home of the captivating series "Pretending To Be Yours 𓆩♡𓆪" starring Maya × Siddhi.',
    avatar: 'https://yt3.googleusercontent.com/pFazIS_Z016_DTno8XuRnD_EC3Nf5x6fDvrIwm9t6kBsZKnG1cdtWU6BQcglmqSsdOxLaNg_3A=s900-c-k-c0x00ffffff-no-rj',
    badge: 'Pretending To Be Yours',
  },
  {
    handle: '@Eclipse_3177',
    name: 'Eclipsé 💫',
    url: 'https://www.youtube.com/@Eclipse_3177',
    subscribers: '2.5K+',
    videos: '25 videos',
    description: 'Special audio plays, Enemies to Lovers, and creative standalone romantic mini stories.',
    avatar: 'https://yt3.googleusercontent.com/LSB3j4741CRhkEZxZnz7u6Ilk2Z3mJ9wCRo3u7vYGaSQObKfu_m-FeG6mxPFDvQSWUuX3GLx=s900-c-k-c0x00ffffff-no-rj',
    badge: 'Eclipsé Mini Stories',
  },
] as const;

export const COLORS = {
  black: {
    deep: '#050507',
    primary: '#0a0a0f',
    card: '#111118',
    surface: '#18181f',
    elevated: '#1f1f28',
    border: '#2a2a35',
  },
  rose: {
    light: '#fda4ca',
    primary: '#e91e8c',
    dark: '#be185d',
    glow: 'rgba(233, 30, 140, 0.15)',
  },
  gold: {
    light: '#f5e6b8',
    primary: '#d4a853',
    dark: '#b8860b',
    glow: 'rgba(212, 168, 83, 0.15)',
  },
  emerald: {
    light: '#6ee7b7',
    primary: '#10b981',
    dark: '#047857',
  },
  text: {
    primary: '#f5f5f7',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },
} as const;

export const MEMBERSHIP_TIERS = ['Explorer', 'VIP', 'Elite'] as const;

export const VIDEO_CATEGORIES = [
  'All',
  'Shiddat 🌈',
  'Not My Type 🫀',
  'Pretending To Be Yours 𓆩♡𓆪',
  'Eclipsé Stories 💫',
  'Inside My Characters ✨',
  'VIP Audio Vault 👑',
] as const;

export const PRODUCT_CATEGORIES = [
  'All',
  'Shirts & Tops',
  'Pants & Joggers',
  'Hoodies & Outerwear',
  'Couple Jewelry',
  'Accessories & Bags',
  'Collectibles & Art',
] as const;

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Videos', href: '/videos' },
  { label: 'Membership', href: '/membership' },
  { label: 'Store', href: '/store' },
  { label: 'Community', href: '/community' },
] as const;

export const FOOTER_LINKS = {
  platform: [
    { label: 'Videos', href: '/videos' },
    { label: 'Membership Plans', href: '/membership' },
    { label: 'Merchandise', href: '/store' },
    { label: 'Community', href: '/community' },
  ],
  account: [
    { label: 'My Profile', href: '/profile' },
    { label: 'Watch History', href: '/history' },
    { label: 'My Orders', href: '/orders' },
    { label: 'My Membership', href: '/my-membership' },
  ],
  support: [
    { label: 'Contact & Support', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
} as const;
