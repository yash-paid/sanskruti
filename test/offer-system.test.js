// Comprehensive Regression & Security Test Suite for Dual-Offer System
const assert = require('assert');
const {
  getKolkataTime,
  formatKolkataDateString,
  getDayOfYear,
  getActiveCampaign,
  getActiveOfferPayload,
  getActiveOffer,
  verifyOffer,
  APPROVED_DISCOUNTS,
  calendarData
} = require('../netlify/functions/_offers');
const { validateAndCalculateOrder, SERVICES, BOOKS, VALID_COUPONS } = require('../netlify/functions/_catalog');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

console.log('\n=== RUNNING EXTENDED DUAL-OFFER SYSTEM REGRESSION TESTS ===\n');

// Group 1: Timezone & Calendar Math
console.log('1. Timezone & Calendar Math:');
it('should correctly format Asia/Kolkata date', () => {
  const testDate = new Date('2026-11-08T07:15:00Z');
  const kTime = getKolkataTime(testDate);
  const formatted = formatKolkataDateString(kTime);
  assert.strictEqual(formatted, '2026-11-08');
});

it('should calculate day of the year deterministically', () => {
  const jan1 = new Date('2026-01-01T06:00:00Z');
  const day1 = getDayOfYear(getKolkataTime(jan1));
  assert.strictEqual(day1, 1);
});

// Group 2: Excluded Holidays Verification
console.log('\n2. Excluded Public & National Holidays:');
const excludedDates = ['2026-01-26', '2026-05-01', '2026-08-15', '2026-10-02'];
for (const exDate of excludedDates) {
  it(`should NOT trigger national occasion on ${exDate}`, () => {
    const campaign = getActiveCampaign(new Date(`${exDate}T10:00:00+05:30`));
    if (campaign.type === 'festival') {
      assert(!campaign.campaignName.toLowerCase().includes('republic'), 'Republic Day must not be in campaign');
      assert(!campaign.campaignName.toLowerCase().includes('independence'), 'Independence Day must not be in campaign');
      assert(!campaign.campaignName.toLowerCase().includes('gandhi'), 'Gandhi Jayanti must not be in campaign');
      assert(!campaign.campaignName.toLowerCase().includes('labour'), 'Labour Day must not be in campaign');
    }
  });
}

// Group 3: Festival Calendar Detection & Payload
console.log('\n3. Festival Calendar Detection & Multi-Offer Payload:');
it('should detect Diwali festival window in 2026 (Nov 06 - Nov 12)', () => {
  const diwaliTime = new Date('2026-11-08T12:00:00+05:30');
  const campaign = getActiveCampaign(diwaliTime);
  assert.strictEqual(campaign.type, 'festival');
  assert.strictEqual(campaign.campaignId, 'fest_diwali_festival_2026');
  assert.strictEqual(campaign.badgeText, 'DIWALI SPECIAL');
});

it('should return complete dual-offer payload with all 13 approved discounts', () => {
  const payload = getActiveOfferPayload(new Date('2026-11-08T12:00:00+05:30'));
  assert.strictEqual(payload.success, true);
  assert.strictEqual(payload.hasActiveOffer, true);
  assert(payload.campaign);
  assert.strictEqual(payload.approvedDiscounts.length, 13);
});

// Group 4: Verify ALL 13 Approved Product Discounts Server-Side
console.log('\n4. Server-Side Verification for ALL 13 Approved Discounts:');
const EXPECTED_DISCOUNTS = [
  { id: 'service-pic-5', original: 60, discounted: 49 },
  { id: 'service-pic-10', original: 100, discounted: 79 },
  { id: 'service-combo-1', original: 120, discounted: 89 },
  { id: 'service-vid-5', original: 150, discounted: 119 },
  { id: 'service-chat-30', original: 150, discounted: 129 },
  { id: 'service-chat-60', original: 250, discounted: 180 },
  { id: 'service-vc-10', original: 199, discounted: 149 },
  { id: 'service-vc-30', original: 300, discounted: 200 },
  { id: 'service-vc-60', original: 400, discounted: 280 },
  { id: 'service-voice-30', original: 200, discounted: 179 },
  { id: 'service-voice-60', original: 300, discounted: 240 },
  { id: 'service-sub-7', original: 750, discounted: 350 },
  { id: 'service-sub-15', original: 1500, discounted: 600 }
];

for (const exp of EXPECTED_DISCOUNTS) {
  it(`should accurately calculate discount for ${exp.id}: ₹${exp.original} → ₹${exp.discounted}`, () => {
    const verified = verifyOffer(`fest_diwali_festival_2026_${exp.id}`, exp.id);
    assert.strictEqual(verified.valid, true);
    assert.strictEqual(verified.discountedPrice, exp.discounted);

    const order = validateAndCalculateOrder({
      itemType: 'service',
      itemId: exp.id,
      appliedOfferId: `fest_diwali_festival_2026_${exp.id}`
    });
    assert.strictEqual(order.subtotal, exp.discounted);
    assert.strictEqual(order.finalAmount, exp.discounted);
    assert.strictEqual(order.amountFormatted, exp.discounted.toFixed(2));
  });
}

// Group 5: Two Random Product Selection Simulation & Independence
console.log('\n5. Dual-Product Independent Checkout Simulation:');
it('should independently validate checkouts for any two distinct selected products', () => {
  // Simulate visitor selecting product 8 (30-min call) and product 12 (7-day membership)
  const selectionPair = ['service-vc-30', 'service-sub-7'];
  
  // Checkout product A
  const orderA = validateAndCalculateOrder({
    itemType: 'service',
    itemId: selectionPair[0],
    appliedOfferId: `fest_diwali_festival_2026_${selectionPair[0]}`
  });
  assert.strictEqual(orderA.subtotal, 200);

  // Checkout product B
  const orderB = validateAndCalculateOrder({
    itemType: 'service',
    itemId: selectionPair[1],
    appliedOfferId: `fest_diwali_festival_2026_${selectionPair[1]}`
  });
  assert.strictEqual(orderB.subtotal, 350);
});

// Group 6: Security & Negative Tests
console.log('\n6. Security & Negative Verification:');
it('should reject fake or expired offerId', () => {
  assert.throws(() => {
    validateAndCalculateOrder({
      itemType: 'service',
      itemId: 'service-sub-7',
      appliedOfferId: 'fake_expired_offer_999'
    });
  }, /expired/);
});

it('should reject offer for non-discounted service items (e.g. VIP upgrades)', () => {
  assert.throws(() => {
    validateAndCalculateOrder({
      itemType: 'service',
      itemId: 'service-vc-upgrade-50',
      appliedOfferId: 'fest_diwali_festival_2026_service-vc-upgrade-50'
    });
  }, /not eligible/);
});

// Group 7: Full-Price Backward Compatibility (Regression)
console.log('\n7. Full-Price Backward Compatibility:');
it('should charge full catalog price for 30-min call when no offerId is passed', () => {
  const order = validateAndCalculateOrder({
    itemType: 'service',
    itemId: 'service-vc-30'
  });
  assert.strictEqual(order.subtotal, 300);
  assert.strictEqual(order.finalAmount, 300);
});

it('should charge full catalog price for 7-day subscription when no offerId is passed', () => {
  const order = validateAndCalculateOrder({
    itemType: 'service',
    itemId: 'service-sub-7'
  });
  assert.strictEqual(order.subtotal, 750);
  assert.strictEqual(order.finalAmount, 750);
});

// Group 8: eBook Purchases & Coupon Compatibility
console.log('\n8. eBook Purchases & Coupon Compatibility:');
it('should allow purchasing single eBook at full price', () => {
  const order = validateAndCalculateOrder({ itemType: 'single', itemId: 'mind-1' });
  assert.strictEqual(order.subtotal, 99);
  assert.strictEqual(order.finalAmount, 99);
});

it('should apply 50% discount on eBooks when SANSKRUTI50 coupon is used', () => {
  const order = validateAndCalculateOrder({
    itemType: 'single',
    itemId: 'mind-1',
    couponCode: 'SANSKRUTI50'
  });
  assert.strictEqual(order.subtotal, 99);
  assert.strictEqual(order.appliedCoupon, 'SANSKRUTI50');
  assert.strictEqual(order.finalAmount, 50);
});

console.log(`\n======================================================`);
console.log(`ALL EXTENDED TESTS PASSED: ${passedTests} / ${totalTests}`);
console.log(`======================================================\n`);
