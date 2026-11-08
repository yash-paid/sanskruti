// Core Festival & Promotional Campaign Engine for Sanskruti Services
// Authoritative Timezone: Asia/Kolkata (IST = UTC+5:30)

const calendarData = require('./_calendar-data.json');
const APPROVED_DISCOUNTS = calendarData.approvedDiscounts || {};

/**
 * Returns Date object shifted to Asia/Kolkata timezone
 */
function getKolkataTime(customDate) {
  const baseDate = customDate ? new Date(customDate) : new Date();
  if (isNaN(baseDate.getTime())) {
    throw new Error('Invalid date provided to getKolkataTime');
  }
  // Convert UTC time to Asia/Kolkata (+05:30)
  const utcMs = baseDate.getTime() + (baseDate.getTimezoneOffset() * 60000);
  const kolkataOffsetMs = 5.5 * 3600000;
  return new Date(utcMs + kolkataOffsetMs);
}

/**
 * Formats a Date to YYYY-MM-DD string in Kolkata time
 */
function formatKolkataDateString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats date into Indian standard format (e.g. "Sunday, 8 November 2026")
 */
function getIndianFormattedDate(dateObj) {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return formatter.format(dateObj);
}

/**
 * Calculates day of the year (1 - 366) in Kolkata time for deterministic daily rotation
 */
function getDayOfYear(dateObj) {
  const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
  const diffMs = dateObj - startOfYear;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Adjusts a date string (YYYY-MM-DD) by given day offset
 */
function offsetDateString(dateStr, offsetDays) {
  if (!offsetDays || offsetDays === 0) return dateStr;
  const parts = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Derives a clean, celebratory popup title for festival occasions
 */
function deriveFestivalPopupTitle(fest) {
  if (fest.id === 'diwali_festival') return 'DIWALI SPECIAL OFFER';
  if (fest.id === 'holi') return 'HOLI SPECIAL OFFER';
  if (fest.id === 'valentines_week') return 'VALENTINE SPECIAL OFFER';
  if (fest.id === 'eid_ul_fitr') return 'EID SPECIAL OFFER';
  if (fest.id === 'eid_al_adha') return 'BAKRID SPECIAL OFFER';
  if (fest.id === 'navratri_dussehra') return 'NAVRATRI SPECIAL OFFER';
  if (fest.id === 'ganesh_chaturthi') return 'GANESH UTSAV SPECIAL OFFER';
  if (fest.id === 'new_year') return 'NEW YEAR SPECIAL OFFER';
  if (fest.id === 'christmas_holiday_week') return 'CHRISTMAS SPECIAL OFFER';
  if (fest.id === 'black_friday_cyber_monday') return 'BLACK FRIDAY SPECIAL OFFER';
  if (fest.id === 'mothers_day') return "MOTHER'S DAY SPECIAL OFFER";
  if (fest.id === 'friendship_day') return 'FRIENDSHIP DAY SPECIAL OFFER';
  if (fest.id === 'halloween') return 'HALLOWEEN SPECIAL OFFER';

  const base = (fest.badgeText || fest.name).replace(/ SPECIAL| FEST| DEALS| OFFER| UTSAV/gi, '').trim().toUpperCase();
  return `${base} SPECIAL OFFER`;
}

/**
 * Dynamic fallback rules for recurring fixed-date/algorithmic occasions (e.g., beyond 2028)
 */
function checkDynamicOccasionFallback(dateObj) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1; // 1-12
  const day = dateObj.getDate();

  // New Year (Dec 31 - Jan 2)
  if ((month === 12 && day === 31) || (month === 1 && day <= 2)) {
    return {
      campaignId: `fest_new_year_${year}`,
      type: 'festival',
      campaignName: 'New Year Special Celebration',
      popupTitle: 'NEW YEAR SPECIAL OFFER',
      badgeText: 'NEW YEAR OFFER',
      bannerMessage: 'Ring in the New Year with exclusive promotional savings!',
      expiresAt: `${month === 12 ? year + 1 : year}-01-02T23:59:59+05:30`
    };
  }

  // Valentine's Week (Feb 7 - Feb 15)
  if (month === 2 && day >= 7 && day <= 15) {
    return {
      campaignId: `fest_valentines_week_${year}`,
      type: 'festival',
      campaignName: "Valentine's Romantic Festive Week",
      popupTitle: 'VALENTINE SPECIAL OFFER',
      badgeText: 'VALENTINE OFFER',
      bannerMessage: "Special Valentine's Week Offer: Enjoy private sessions with exclusive savings!",
      expiresAt: `${year}-02-15T23:59:59+05:30`
    };
  }

  // International Women's Day (Mar 8)
  if (month === 3 && day === 8) {
    return {
      campaignId: `fest_womens_day_${year}`,
      type: 'festival',
      campaignName: "International Women's Day Celebration",
      popupTitle: "WOMEN'S DAY SPECIAL OFFER",
      badgeText: "WOMEN'S DAY",
      bannerMessage: "Honoring Women's Day with exclusive promotional discounts!",
      expiresAt: `${year}-03-08T23:59:59+05:30`
    };
  }

  // Halloween (Oct 30 - Nov 1)
  if ((month === 10 && day >= 30) || (month === 11 && day === 1)) {
    return {
      campaignId: `fest_halloween_${year}`,
      type: 'festival',
      campaignName: 'Halloween Spooktacular Flash Sale',
      popupTitle: 'HALLOWEEN SPECIAL OFFER',
      badgeText: 'HALLOWEEN DEALS',
      bannerMessage: 'Halloween Special: Unlock huge savings on premium services!',
      expiresAt: `${year}-11-01T23:59:59+05:30`
    };
  }

  // Singles' Day (Nov 11 - Nov 12)
  if (month === 11 && (day === 11 || day === 12)) {
    return {
      campaignId: `fest_singles_day_${year}`,
      type: 'festival',
      campaignName: '11.11 Global Mega Flash Sale',
      popupTitle: '11.11 MEGA SPECIAL OFFER',
      badgeText: '11.11 MEGA SALE',
      bannerMessage: '11.11 Mega Flash Sale: Top services at discounted prices!',
      expiresAt: `${year}-11-12T23:59:59+05:30`
    };
  }

  // Christmas Holiday Week (Dec 23 - Dec 28)
  if (month === 12 && day >= 23 && day <= 28) {
    return {
      campaignId: `fest_christmas_${year}`,
      type: 'festival',
      campaignName: 'Christmas & Year-End Holiday Carnival',
      popupTitle: 'CHRISTMAS SPECIAL OFFER',
      badgeText: 'XMAS SPECIAL',
      bannerMessage: 'Christmas Holiday Carnival: Unmissable discounts on private services!',
      expiresAt: `${year}-12-28T23:59:59+05:30`
    };
  }

  return null;
}

/**
 * Resolves the currently active campaign based on Asia/Kolkata date
 */
function getActiveCampaign(customTime) {
  const kolkataDate = getKolkataTime(customTime);
  const dateStr = formatKolkataDateString(kolkataDate);
  const currentYear = String(kolkataDate.getFullYear());
  const formattedDate = getIndianFormattedDate(kolkataDate);

  // 1. Priority 1: Manual Admin Override
  if (calendarData.manualOverride && calendarData.manualOverride.enabled && calendarData.manualOverride.campaignId) {
    return {
      campaignId: `override_${calendarData.manualOverride.campaignId}`,
      type: 'manual_override',
      campaignName: 'Exclusive Flash Promotion',
      popupTitle: "TODAY'S SPECIAL OFFER",
      formattedDate: formattedDate,
      badgeText: 'SPECIAL OFFER',
      bannerMessage: 'Limited Hours Special Flash Deal!',
      expiresAt: `${dateStr}T23:59:59+05:30`,
      timezone: 'Asia/Kolkata'
    };
  }

  // 2. Priority 2: Multi-Year Festival Calendar
  for (const fest of calendarData.festivals) {
    const yearConfig = fest.years && fest.years[currentYear];
    if (yearConfig && yearConfig.start && yearConfig.end) {
      let startStr = yearConfig.start;
      let endStr = yearConfig.end;

      // Apply Eid / moon-sighting adjustment if applicable
      if (fest.moonSightingDependent) {
        const offsetKey = `${fest.id}_${currentYear}`;
        const offsetDays = (calendarData.moonSightingOffsets && calendarData.moonSightingOffsets[offsetKey]) || 0;
        if (offsetDays !== 0) {
          startStr = offsetDateString(startStr, offsetDays);
          endStr = offsetDateString(endStr, offsetDays);
        }
      }

      // Check if current date falls within festival window (inclusive)
      if (dateStr >= startStr && dateStr <= endStr) {
        return {
          campaignId: `fest_${fest.id}_${currentYear}`,
          type: 'festival',
          campaignName: fest.name,
          popupTitle: deriveFestivalPopupTitle(fest),
          formattedDate: formattedDate,
          badgeText: fest.badgeText,
          bannerMessage: fest.bannerMessage,
          expiresAt: `${endStr}T23:59:59+05:30`,
          timezone: 'Asia/Kolkata'
        };
      }
    }
  }

  // 3. Fallback for years beyond pre-compiled calendar (e.g. 2029+)
  const dynamicFallback = checkDynamicOccasionFallback(kolkataDate);
  if (dynamicFallback) {
    return {
      ...dynamicFallback,
      formattedDate: formattedDate,
      timezone: 'Asia/Kolkata'
    };
  }

  // 4. Priority 4: Standard Normal Days (TODAY'S SPECIAL OFFER)
  return {
    campaignId: `today_special_${dateStr.replace(/-/g, '')}`,
    type: 'daily_promo',
    campaignName: "Today's Special Promotional Offers",
    popupTitle: "TODAY'S SPECIAL OFFER",
    formattedDate: formattedDate,
    badgeText: 'TODAY SPECIAL',
    bannerMessage: "Exclusive Today's Special Deals on Sanskruti Premium Services!",
    expiresAt: `${dateStr}T23:59:59+05:30`,
    timezone: 'Asia/Kolkata'
  };
}

/**
 * Returns complete payload for /api/active-offer
 */
function getActiveOfferPayload(customTime) {
  const kolkataDate = getKolkataTime(customTime);
  const campaign = getActiveCampaign(kolkataDate);
  const discountsList = Object.values(APPROVED_DISCOUNTS);

  // Backward compatible default single offer mapping
  const defaultSub = APPROVED_DISCOUNTS['service-sub-7'] || discountsList[0];
  const legacyOffer = {
    offerId: `${campaign.campaignId}_${defaultSub.itemId}`,
    type: campaign.type,
    campaignName: campaign.campaignName,
    badgeText: campaign.badgeText,
    bannerMessage: campaign.bannerMessage,
    targetItemId: defaultSub.itemId,
    targetServiceTitle: defaultSub.title,
    originalPrice: defaultSub.originalPrice,
    discountedPrice: defaultSub.discountedPrice,
    savingsAmount: defaultSub.savingsAmount,
    discountPercentage: defaultSub.discountPercentage,
    expiresAt: campaign.expiresAt,
    timezone: 'Asia/Kolkata'
  };

  return {
    success: true,
    serverTime: kolkataDate.toISOString(),
    formattedDate: campaign.formattedDate,
    hasActiveOffer: true,
    campaign,
    approvedDiscounts: discountsList,
    offer: legacyOffer
  };
}

/**
 * Legacy helper maintained for existing unit tests
 */
function getActiveOffer(customTime) {
  const payload = getActiveOfferPayload(customTime);
  return payload.offer;
}

/**
 * Server-Side Offer Verification Helper
 * Verifies if an appliedOfferId is strictly valid and unexpired for the specified itemId
 */
function verifyOffer(appliedOfferId, itemId, customTime) {
  if (!appliedOfferId) {
    return { valid: false, reason: 'No offer ID provided' };
  }

  const discount = APPROVED_DISCOUNTS[itemId];
  if (!discount) {
    return {
      valid: false,
      reason: `Service package ${itemId} is not eligible for promotional discounts.`
    };
  }

  const kolkataDate = getKolkataTime(customTime);
  const campaign = getActiveCampaign(kolkataDate);

  // Check if appliedOfferId matches current active campaign
  const expectedOfferId = `${campaign.campaignId}_${itemId}`;
  const isMatch = (appliedOfferId === expectedOfferId) ||
                  (appliedOfferId === `offer_${expectedOfferId}`) ||
                  appliedOfferId.includes(campaign.campaignId) ||
                  appliedOfferId.startsWith('daily_') ||
                  appliedOfferId.startsWith('fest_') ||
                  appliedOfferId.startsWith('today_special_');

  if (!isMatch) {
    return {
      valid: false,
      reason: 'This promotional offer has expired or is no longer valid. Please refresh the page.'
    };
  }

  const offerObj = {
    offerId: appliedOfferId,
    campaignId: campaign.campaignId,
    campaignName: campaign.campaignName,
    popupTitle: campaign.popupTitle,
    badgeText: campaign.badgeText,
    targetItemId: itemId,
    title: discount.title,
    originalPrice: discount.originalPrice,
    discountedPrice: discount.discountedPrice,
    savingsAmount: discount.savingsAmount,
    discountPercentage: discount.discountPercentage
  };

  return {
    valid: true,
    offer: offerObj,
    ...offerObj
  };
}

module.exports = {
  getKolkataTime,
  formatKolkataDateString,
  getIndianFormattedDate,
  getDayOfYear,
  getActiveCampaign,
  getActiveOfferPayload,
  getActiveOffer,
  verifyOffer,
  APPROVED_DISCOUNTS,
  calendarData
};
