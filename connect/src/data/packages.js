export const COIN_PACKAGES = [
  {
    id: 'pack-19',
    coins: 50,
    originalCoins: null,
    extraText: null,
    price: 19,
    badge: '⚡ Starter',
    badgeType: 'starter',
    isPopular: false,
  },
  {
    id: 'pack-49',
    coins: 160,
    originalCoins: null,
    extraText: null,
    price: 49,
    badge: null,
    badgeType: null,
    isPopular: false,
  },
  {
    id: 'pack-99',
    coins: 400,
    originalCoins: 360,
    extraText: '40 Extra Coins',
    price: 99,
    badge: '👑 Most Popular',
    badgeType: 'popular',
    isPopular: true,
  },
  {
    id: 'pack-149',
    coins: 880,
    originalCoins: 790,
    extraText: '90 Extra Coins',
    price: 149,
    badge: null,
    badgeType: null,
    isPopular: false,
  },
  {
    id: 'pack-199',
    coins: 1250,
    originalCoins: 1000,
    extraText: '250 Extra Coins',
    price: 199,
    badge: '🔥 Hot Deal',
    badgeType: 'hot',
    isPopular: false,
  },
  {
    id: 'pack-499',
    coins: 2400,
    originalCoins: 2160,
    extraText: '240 Extra Coins',
    price: 499,
    badge: '⭐ Value Pack',
    badgeType: 'value',
    isPopular: false,
  },
  {
    id: 'pack-999',
    coins: 5000,
    originalCoins: 4500,
    extraText: '500 Extra Coins',
    price: 999,
    badge: null,
    badgeType: null,
    isPopular: false,
  },
  {
    id: 'pack-1999',
    coins: 11000,
    originalCoins: 9900,
    extraText: '1100 Extra Coins',
    price: 1999,
    badge: null,
    badgeType: null,
    isPopular: false,
  },
  {
    id: 'pack-4999',
    coins: 30000,
    originalCoins: 27000,
    extraText: '3000 Extra Coins',
    price: 4999,
    badge: null,
    badgeType: null,
    isPopular: false,
  },
  {
    id: 'pack-9999',
    coins: 66000,
    originalCoins: 59400,
    extraText: '6600 Extra Coins',
    price: 9999,
    badge: null,
    badgeType: null,
    isPopular: false,
  },
  {
    id: 'pack-14999',
    coins: 100000,
    originalCoins: 90000,
    extraText: '10000 Extra Coins',
    price: 14999,
    badge: null,
    badgeType: null,
    isPopular: false,
  },
  {
    id: 'pack-29999',
    coins: 200000,
    originalCoins: 180000,
    extraText: '20000 Extra Coins',
    price: 29999,
    badge: null,
    badgeType: null,
    isPopular: false,
  },
];

// ── One-Time Introductory Purchase Packs ──
// Only ₹19 (pack-19), ₹49 (pack-49), and ₹99 (pack-99) disappear after purchase.
// All subsequent packs (₹149, ₹199, ₹499, ₹999, etc.) remain permanently available.
export const ONE_TIME_PURCHASE_PACK_IDS = ['pack-19', 'pack-49', 'pack-99'];

export const getPurchasedPackIds = (userId) => {
  try {
    const activeUid = userId || (typeof window !== 'undefined' ? (localStorage.getItem('connect_last_auth_uid') || '') : '');

    // Self-heal corrupted localStorage for pack-49 (e.g. mistakenly marked when redeeming promo code)
    if (typeof window !== 'undefined') {
      try {
        const rawSaved = localStorage.getItem('connect_purchased_packs');
        if (rawSaved && rawSaved.includes('pack-49')) {
          const localLedgerRaw = activeUid ? localStorage.getItem(`connect_local_ledger_${activeUid}`) : null;
          const ledgerList = localLedgerRaw ? JSON.parse(localLedgerRaw) : [];
          const hasReal49 = Array.isArray(ledgerList) && ledgerList.some(
            (t) => (t.type === 'purchase' || t.type === 'recharge') &&
                   !String(t.id || '').startsWith('TXN-PACK-') &&
                   (t.metadata?.packId === 'pack-49' || (t.metadata?.price === 49 && !t.metadata?.code))
          );
          if (!hasReal49) {
            const parsed = JSON.parse(rawSaved).filter((id) => id !== 'pack-49');
            localStorage.setItem('connect_purchased_packs', JSON.stringify(parsed));
            if (activeUid) {
              localStorage.setItem(`connect_purchased_packs_${activeUid}`, JSON.stringify(parsed));
            }
          }
        }
      } catch (_) {}
    }

    // If an authenticated user ID is available, verify against actual completed purchases in ledger
    if (activeUid) {
      const localLedgerRaw = localStorage.getItem(`connect_local_ledger_${activeUid}`);
      if (localLedgerRaw) {
        const list = JSON.parse(localLedgerRaw);
        if (Array.isArray(list)) {
          const purchasedInLedger = list
            .filter((item) => {
              if (!item || item.status === 'Failed') return false;
              // Ignore synthetic TXN-PACK- entries from past bug
              if (String(item.id || '').startsWith('TXN-PACK-')) return false;
              // Ignore promo codes
              if (item.type === 'promo_code' || item.metadata?.code) return false;
              return item.type === 'purchase' || item.type === 'recharge';
            })
            .map((item) => {
              const packId = item.metadata?.packId || '';
              const cleanId = String(packId).replace(/^connect-/, '');
              if (ONE_TIME_PURCHASE_PACK_IDS.includes(cleanId)) return cleanId;
              const title = item.title || '';
              if (title.includes('₹19') || title.includes('pack-19') || title.includes('50 Coins')) return 'pack-19';
              if (title.includes('₹49') || title.includes('pack-49')) return 'pack-49';
              if (title.includes('₹99') || title.includes('pack-99')) return 'pack-99';
              for (const id of ONE_TIME_PURCHASE_PACK_IDS) {
                if (title.includes(id)) return id;
              }
              return null;
            })
            .filter(Boolean);

          return Array.from(new Set(purchasedInLedger));
        }
      }
      return [];
    }

    const saved = localStorage.getItem('connect_purchased_packs');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    // Strictly restrict to only the 3 one-time packs
    return parsed.filter((id) => ONE_TIME_PURCHASE_PACK_IDS.includes(id));
  } catch (e) {
    return [];
  }
};

export const markPackAsPurchased = (packId, userId) => {
  if (!packId) return;
  try {
    const cleanId = String(packId).replace(/^connect-/, '');
    // Only pack-19, pack-49, and pack-99 disappear after purchase!
    if (!ONE_TIME_PURCHASE_PACK_IDS.includes(cleanId)) {
      return;
    }
    const existing = getPurchasedPackIds(userId);
    if (!existing.includes(cleanId)) {
      existing.push(cleanId);
      localStorage.setItem('connect_purchased_packs', JSON.stringify(existing));
      if (userId) {
        localStorage.setItem(`connect_purchased_packs_${userId}`, JSON.stringify(existing));
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('connect_purchased_packs_updated', {
            detail: { packId: cleanId, all: existing },
          })
        );
      }
    }
  } catch (e) {}
};

export const resetPurchasedPacks = () => {
  try {
    localStorage.removeItem('connect_purchased_packs');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('connect_purchased_packs_updated', {
          detail: { all: [] },
        })
      );
    }
  } catch (e) {}
};

export const SAMPLE_TRANSACTIONS = [];

