/**
 * PLAYSTATION PRIZE EVENTS — FRONTEND APPLICATION SCRIPT
 * 
 * - 12 Events Total (6 PlayStation 5 + 6 PlayStation 5 Pro)
 * - 24-Hour Daily Event Cycle synchronized to India Standard Time (IST, UTC+05:30)
 * - Daily count strictly starts at zero at 00:00 IST, progresses, and never exceeds max capacity
 * - Available Remaining Capacity = Maximum Capacity - Recorded Quantity
 * - Quantity selector strictly clamped to remaining capacity
 * - Clean rectangular horizontal event cards (zero graphics)
 * - Pre-Payment Participant Information Popup with exact formal copy notice
 */

(function () {
  'use strict';

  // ==================== AUTHORITATIVE 12-EVENT CATALOG ====================
  const PS_EVENTS_CATALOG = [
    // -------------------- PLAYSTATION 5 (6 EVENTS) --------------------
    {
      id: "ps5-1",
      code: "PS5-EV01",
      eventNumber: "Event 1",
      category: "PlayStation 5",
      isPro: false,
      title: "PlayStation 5 Slim 1TB Disc Edition",
      ticketPrice: 10,
      plannedCap: 6000,
      shortPrize: "Brand-new PS5 Slim Disc Console with 1TB Custom SSD, DualSense Wireless Controller & Astro's Playroom.",
      specs: {
        "Model": "PlayStation 5 Slim (Disc Edition)",
        "Storage": "1TB Custom Ultra-High Speed NVMe SSD",
        "Drive": "Ultra HD Blu-ray Optical Disc Drive",
        "Controller": "DualSense Wireless Controller with Haptic Feedback",
        "Warranty": "1-Year Official Sony India Manufacturer Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "24-Hour daily cycle starting at 00:00 Midnight IST.",
        "Multiple tickets allowed per participant subject to remaining capacity.",
        "Physical ID verification required upon doorstep delivery."
      ]
    },
    {
      id: "ps5-2",
      code: "PS5-EV02",
      eventNumber: "Event 2",
      category: "PlayStation 5",
      isPro: false,
      title: "PS5 Slim 1TB + Extra DualSense Controller",
      ticketPrice: 20,
      plannedCap: 3000,
      shortPrize: "PS5 Slim 1TB Disc Console plus an additional Midnight Black DualSense Controller for local multiplayer.",
      specs: {
        "Model": "PlayStation 5 Slim Disc Edition",
        "Storage": "1TB High-Speed Solid State Drive",
        "Controllers": "2x Official DualSense Wireless Controllers (White + Black)",
        "Multiplayer": "Ready for 2-player local co-op out of the box",
        "Warranty": "1-Year Comprehensive Sony India Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "24-Hour daily cycle starting at 00:00 Midnight IST.",
        "Multiple tickets allowed per participant subject to remaining capacity."
      ]
    },
    {
      id: "ps5-3",
      code: "PS5-EV03",
      eventNumber: "Event 3",
      category: "PlayStation 5",
      isPro: false,
      title: "PS5 Slim 1TB + Pulse 3D Wireless Audio Suite",
      ticketPrice: 50,
      plannedCap: 1200,
      shortPrize: "PS5 Slim 1TB Console paired with official Sony Pulse 3D Wireless Gaming Headset with dual noise-cancelling mics.",
      specs: {
        "Model": "PlayStation 5 Slim Disc Edition 1TB",
        "Headset": "Sony Pulse 3D Wireless Headset with Dual Mics",
        "Audio": "Tempest 3D AudioTech Hardware Acceleration",
        "Warranty": "1-Year Sony India Warranty on Console & Headset"
      },
      rules: [
        "Open to resident Indian citizens.",
        "1,200 maximum daily capacity tier.",
        "Multiple tickets allowed up to remaining daily capacity."
      ]
    },
    {
      id: "ps5-4",
      code: "PS5-EV04",
      eventNumber: "Event 4",
      category: "PlayStation 5",
      isPro: false,
      title: "PS5 Slim 1TB Ultimate Entertainment Suite",
      ticketPrice: 100,
      plannedCap: 600,
      shortPrize: "PS5 Slim 1TB + 2 DualSense Controllers + Pulse Elite Headset + PS5 Media Remote.",
      specs: {
        "Model": "PlayStation 5 Slim 1TB Ultimate Suite",
        "Controllers": "2x DualSense Wireless Controllers",
        "Headset": "Pulse Elite Wireless Headset with Planar Drivers",
        "Remote": "PlayStation 5 Official Media Remote",
        "Warranty": "1-Year Comprehensive Sony India Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "600 maximum daily capacity tier.",
        "Multiple tickets allowed up to remaining daily capacity."
      ]
    },
    {
      id: "ps5-5",
      code: "PS5-EV05",
      eventNumber: "Event 5",
      category: "PlayStation 5",
      isPro: false,
      title: "PS5 Slim 1TB + PlayStation VR2 Horizon Bundle",
      ticketPrice: 200,
      plannedCap: 300,
      shortPrize: "Brand-new PS5 Slim 1TB Disc Edition Console bundled with PlayStation VR2 4K HDR Headset & Sense Controllers.",
      specs: {
        "Model": "PS5 Slim 1TB + PS VR2 Horizon Bundle",
        "VR System": "PlayStation VR2 OLED 4K HDR Headset with Eye Tracking",
        "Controllers": "2x PS VR2 Sense Controllers with Finger Touch Detection",
        "Warranty": "1-Year Official Sony India Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "High-odds low-allocation tier capped at 300 entries.",
        "Multiple tickets allowed up to remaining daily capacity."
      ]
    },
    {
      id: "ps5-6",
      code: "PS5-EV06",
      eventNumber: "Event 6",
      category: "PlayStation 5",
      isPro: false,
      title: "PS5 Slim 1TB VIP Master Gaming Suite",
      ticketPrice: 300,
      plannedCap: 200,
      shortPrize: "PS5 Slim 1TB Console + PlayStation VR2 System + 2 DualSense Controllers + DualSense Charging Station + Pulse Elite Headset.",
      specs: {
        "Model": "PS5 Slim 1TB VIP Master Suite",
        "VR System": "PlayStation VR2 OLED 4K HDR Headset",
        "Controllers": "2x DualSense Controllers + DualSense Charging Station",
        "Headset": "Pulse Elite Wireless Planar Magnetic Headset",
        "Warranty": "1-Year Comprehensive Sony India Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "Exclusive ultra-low tier capped at only 200 entries.",
        "Multiple tickets allowed up to remaining daily capacity."
      ]
    },

    // -------------------- PLAYSTATION 5 PRO (6 EVENTS) --------------------
    {
      id: "pro-1",
      code: "PRO-EV01",
      eventNumber: "Event 1",
      category: "PlayStation 5 Pro",
      isPro: true,
      title: "PlayStation 5 Pro 2TB Console",
      ticketPrice: 15,
      plannedCap: 6000,
      shortPrize: "Sony PlayStation 5 Pro with 2TB NVMe SSD, PlayStation Spectral Super Resolution (PSSR) & Advanced Ray Tracing.",
      specs: {
        "Model": "PlayStation 5 Pro (2TB)",
        "Storage": "2TB High-Speed Custom Solid State Drive",
        "AI Upscaling": "PlayStation Spectral Super Resolution (PSSR)",
        "Graphics": "Up to 45% faster GPU rendering with Advanced Ray Tracing",
        "Warranty": "1-Year Sony Official Manufacturer Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "24-Hour daily cycle starting at 00:00 Midnight IST.",
        "Multiple tickets allowed per participant subject to remaining capacity."
      ]
    },
    {
      id: "pro-2",
      code: "PRO-EV02",
      eventNumber: "Event 2",
      category: "PlayStation 5 Pro",
      isPro: true,
      title: "PS5 Pro 2TB + DualSense Edge Pro Controller",
      ticketPrice: 25,
      plannedCap: 3000,
      shortPrize: "PS5 Pro 2TB Console plus Sony's flagship DualSense Edge Wireless Controller with remappable back buttons.",
      specs: {
        "Model": "PlayStation 5 Pro 2TB + DualSense Edge",
        "Pro Controller": "Customizable controls, swappable stick caps, tunable triggers",
        "Storage": "2TB Custom NVMe SSD",
        "Performance": "Enhanced 60FPS / 120FPS 4K Gaming",
        "Warranty": "1-Year Sony India Warranty on Console & Controller"
      },
      rules: [
        "Open to resident Indian citizens.",
        "24-Hour daily cycle starting at 00:00 Midnight IST.",
        "Multiple tickets allowed per user up to remaining capacity."
      ]
    },
    {
      id: "pro-3",
      code: "PRO-EV03",
      eventNumber: "Event 3",
      category: "PlayStation 5 Pro",
      isPro: true,
      title: "PS5 Pro 2TB + Audiophile Pulse Elite Kit",
      ticketPrice: 60,
      plannedCap: 1200,
      shortPrize: "PS5 Pro 2TB Console with Sony Pulse Elite Wireless Headset featuring planar magnetic drivers & lossless audio.",
      specs: {
        "Model": "PlayStation 5 Pro 2TB Audiophile Suite",
        "Audio": "Pulse Elite Headset with Planar Magnetic Drivers",
        "Microphone": "Retractable Boom Mic with AI Noise Rejection",
        "Charging": "Included Headset Charging Hanger",
        "Warranty": "1-Year Sony India Manufacturer Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "1,200 maximum daily capacity tier.",
        "Multiple tickets allowed per participant subject to remaining slots."
      ]
    },
    {
      id: "pro-4",
      code: "PRO-EV04",
      eventNumber: "Event 4",
      category: "PlayStation 5 Pro",
      isPro: true,
      title: "PS5 Pro 2TB Flagship Master Suite",
      ticketPrice: 115,
      plannedCap: 600,
      shortPrize: "PS5 Pro 2TB + DualSense Edge Controller + Pulse Elite Headset + Official DualSense Charging Station.",
      specs: {
        "Model": "PlayStation 5 Pro 2TB Flagship Master Suite",
        "Pro Controller": "DualSense Edge Ultra-Customizable Controller",
        "Headset": "Pulse Elite Planar Magnetic Headset",
        "Dock": "Sony DualSense Quick-Charge Station",
        "Warranty": "1-Year Comprehensive Sony India Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "600 maximum daily capacity tier.",
        "Multiple tickets permitted per registered user."
      ]
    },
    {
      id: "pro-5",
      code: "PRO-EV05",
      eventNumber: "Event 5",
      category: "PlayStation 5 Pro",
      isPro: true,
      title: "PS5 Pro 2TB + PlayStation VR2 Next-Gen Horizon Suite",
      ticketPrice: 225,
      plannedCap: 300,
      shortPrize: "Sony PS5 Pro 2TB Console with Advanced Ray Tracing paired with the flagship PlayStation VR2 4K HDR Headset.",
      specs: {
        "Model": "PS5 Pro 2TB + PS VR2 Horizon Suite",
        "Console": "PlayStation 5 Pro 2TB with PSSR AI Upscaling",
        "VR System": "PlayStation VR2 OLED 4K HDR Headset with 120Hz refresh",
        "Warranty": "1-Year Official Sony India Manufacturer Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "Strict 300 maximum daily participant cap.",
        "Multiple tickets allowed up to remaining daily slots."
      ]
    },
    {
      id: "pro-6",
      code: "PRO-EV06",
      eventNumber: "Event 6",
      category: "PlayStation 5 Pro",
      isPro: true,
      title: "PS5 Pro 2TB Ultimate Enthusiast Collector Suite",
      ticketPrice: 325,
      plannedCap: 200,
      shortPrize: "PS5 Pro 2TB Console + PlayStation VR2 Headset + DualSense Edge Pro Controller + Pulse Elite Planar Audio Headset.",
      specs: {
        "Model": "PS5 Pro 2TB Ultimate Enthusiast Collector Suite",
        "Console": "PlayStation 5 Pro 2TB Flagship Edition",
        "VR System": "PlayStation VR2 4K HDR Headset & Sense Controllers",
        "Pro Controller": "DualSense Edge Modular Wireless Controller",
        "Headset": "Pulse Elite Wireless Planar Magnetic Headset",
        "Warranty": "1-Year Comprehensive Sony India Warranty"
      },
      rules: [
        "Open to resident Indian citizens.",
        "Ultra-limited allocation tier capped at 200 total participants.",
        "Multiple tickets permitted per registered user up to remaining capacity."
      ]
    }
  ];

  // Global Application State
  const appState = {
    events: [],
    selectedEvent: null,
    targetUtcMs: 0,
    categoryFilter: 'all',
    quantity: 1,
    timerInterval: null,
    // Track user pre-registrations within current session
    userSessionEntries: {}
  };

  // ==================== 24-HOUR IST CYCLE ENGINE ====================
  /**
   * Calculates India Standard Time (IST, UTC+05:30) daily cycle state
   * The daily cycle starts at 00:00:00 IST and ends at the next midnight IST (24h)
   */
  function getISTCycleState(nowMs = Date.now()) {
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(nowMs + IST_OFFSET_MS);

    const year = istNow.getUTCFullYear();
    const month = istNow.getUTCMonth();
    const date = istNow.getUTCDate();

    // Start of current daily cycle (00:00:00 IST) in UTC ms
    const cycleStartUtcMs = Date.UTC(year, month, date, 0, 0, 0) - IST_OFFSET_MS;
    // End of current daily cycle (Next 00:00:00 IST) in UTC ms
    const cycleEndUtcMs = Date.UTC(year, month, date + 1, 0, 0, 0) - IST_OFFSET_MS;

    const elapsedSeconds = Math.max(0, Math.floor((nowMs - cycleStartUtcMs) / 1000));
    const remainingSeconds = Math.max(0, Math.floor((cycleEndUtcMs - nowMs) / 1000));

    return {
      cycleStartUtcMs,
      cycleEndUtcMs,
      elapsedSeconds,
      remainingSeconds,
      dayFraction: Math.min(1, Math.max(0, elapsedSeconds / 86400)),
      cycleKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    };
  }

  // Distinct deterministic progression profiles for all 12 events
  const EVENT_PROGRESSION_PROFILES = {
    'ps5-1': { maxRate: 0.728, p: 1.60 }, // Generates ~4,102 / 6,000 at ~19:45 IST
    'ps5-2': { maxRate: 0.720, p: 1.50 },
    'ps5-3': { maxRate: 0.810, p: 1.70 },
    'ps5-4': { maxRate: 0.690, p: 1.40 },
    'ps5-5': { maxRate: 0.840, p: 1.80 },
    'ps5-6': { maxRate: 0.750, p: 1.55 },

    'pro-1': { maxRate: 0.630, p: 1.45 },
    'pro-2': { maxRate: 0.580, p: 1.65 },
    'pro-3': { maxRate: 0.740, p: 1.50 },
    'pro-4': { maxRate: 0.610, p: 1.75 },
    'pro-5': { maxRate: 0.710, p: 1.40 },
    'pro-6': { maxRate: 0.820, p: 1.35 }
  };

  /**
   * Computes the daily diurnal participation curve
   * - Strictly 0 at 00:00:00 IST
   * - Progresses smoothly and deterministically throughout the daytime hours
   * - Each event has a distinct profile (PS5 vs PS5 Pro never match)
   * - Never exceeds the maximum capacity
   */
  function calculateDailyParticipation(event, cycle) {
    if (!cycle || cycle.elapsedSeconds <= 0) {
      return 0;
    }

    const profile = EVENT_PROGRESSION_PROFILES[event.id] || { maxRate: 0.70, p: 1.5 };
    const t = Math.min(1, Math.max(0, cycle.elapsedSeconds / 86400));
    const diurnalShape = Math.pow(Math.sin((Math.PI * t) / 2), profile.p);
    const effectiveFactor = profile.maxRate * diurnalShape;

    const baseRecorded = Math.min(event.plannedCap, Math.floor(event.plannedCap * effectiveFactor));
    const sessionExtra = appState.userSessionEntries[event.id] || 0;
    const totalCount = baseRecorded + sessionExtra;

    // Strict boundary: Never exceed planned capacity!
    return Math.min(event.plannedCap, totalCount);
  }

  /**
   * Computes current dynamic stats for all 12 events
   */
  function refreshEventStats() {
    const cycle = getISTCycleState();
    appState.targetUtcMs = cycle.cycleEndUtcMs;

    appState.events = PS_EVENTS_CATALOG.map(ev => {
      const currentCount = calculateDailyParticipation(ev, cycle);
      const remainingCapacity = Math.max(0, ev.plannedCap - currentCount);
      const progressPercent = Number(((currentCount / ev.plannedCap) * 100).toFixed(1));

      return {
        ...ev,
        recordedQuantity: currentCount,
        remainingCapacity,
        progressPercent,
        isSoldOut: remainingCapacity === 0
      };
    });
  }

  // ==================== INITIALIZATION ====================
  document.addEventListener('DOMContentLoaded', () => {
    initCategoryTabs();
    initMobileNav();
    initFaqAccordion();

    // Initial calculation of all 12 events
    refreshEventStats();
    renderAllCards();
    updateAllTimers();

    // Handle incoming payment status from PayU callback redirect
    checkPaymentCallback();

    // Start background timer updater (every 1 second)
    if (appState.timerInterval) clearInterval(appState.timerInterval);
    appState.timerInterval = setInterval(() => {
      updateAllTimers();
    }, 1000);
  });

  // ==================== CARD RENDERING ====================
  function renderAllCards() {
    const ps5Grid = document.getElementById('ps5-grid');
    const proGrid = document.getElementById('pro-grid');

    if (!ps5Grid || !proGrid) return;

    ps5Grid.innerHTML = '';
    proGrid.innerHTML = '';

    const ps5Events = appState.events.filter(e => !e.isPro);
    const proEvents = appState.events.filter(e => e.isPro);

    ps5Events.forEach(ev => {
      ps5Grid.appendChild(createRectangularCardElement(ev));
    });

    proEvents.forEach(ev => {
      proGrid.appendChild(createRectangularCardElement(ev));
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function createRectangularCardElement(event) {
    const card = document.createElement('div');
    card.className = 'ps-rect-card';
    card.id = `card-${event.id}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${event.title} - ₹${event.ticketPrice}`);

    // Click & Keyboard Enter handling
    card.addEventListener('click', () => openDetailModal(event.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetailModal(event.id);
      }
    });

    const categoryBadgeClass = event.isPro ? 'pro' : '';
    const progressPercent = Math.min(100, Math.max(0, event.progressPercent || 0));

    card.innerHTML = `
      <!-- Column 1: Identity & Category -->
      <div class="ps-card-col-main">
        <div class="ps-card-tags">
          <span class="ps-badge-id">${escapeHtml(event.code || event.eventNumber)}</span>
          <span class="ps-badge-category ${categoryBadgeClass}">${escapeHtml(event.category)}</span>
        </div>
        <h3 class="ps-card-title">${escapeHtml(event.title)}</h3>
      </div>

      <!-- Column 2: Entry Price & Short Prize -->
      <div class="ps-card-col-price">
        <span class="ps-col-label">Price / Entry</span>
        <div class="ps-price-tag">₹${event.ticketPrice}</div>
        <span class="ps-ticket-note">per ticket</span>
      </div>

      <!-- Column 3: Total Participating & Progress Bar -->
      <div class="ps-card-col-progress">
        <div class="ps-progress-header">
          <span class="ps-col-label">TOTAL PARTICIPATING</span>
          <span class="ps-progress-count">
            <strong>${(event.recordedQuantity || 0).toLocaleString()}</strong> / ${(event.plannedCap || 0).toLocaleString()}
          </span>
        </div>
        <div class="ps-progress-bar">
          <div class="ps-progress-fill" style="width: ${progressPercent}%;"></div>
        </div>
        <div class="ps-progress-footer">
          <span class="ps-badge-verified">
            <i data-lucide="shield-check" style="width:12px; height:12px;"></i>
            <span>Service Verified</span>
          </span>
          <span class="ps-remaining-tag">${event.remainingCapacity.toLocaleString()} Left</span>
        </div>
      </div>

      <!-- Column 4: Countdown Timer & Buy Your Ticket Action -->
      <div class="ps-card-col-timer">
        <div class="ps-timer-box">
          <span class="ps-timer-label">TIME LEFT</span>
          <div class="ps-timer-display" data-timer-event="${event.id}">--h --m --s</div>
        </div>
        <div class="ps-card-arrow">
          <span>BUY YOUR TICKET</span>
          <i data-lucide="chevron-right" style="width:14px; height:14px;"></i>
        </div>
      </div>
    `;

    return card;
  }

  // ==================== TIME & COUNTDOWN CALCULATOR ====================
  function formatTimeRemaining(totalSec) {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }

  function updateAllTimers() {
    const cycle = getISTCycleState();
    const remainingSec = cycle.remainingSeconds;
    const timeString = formatTimeRemaining(remainingSec);

    // Update all card timer elements
    const timerNodes = document.querySelectorAll('.ps-timer-display');
    timerNodes.forEach(node => {
      node.textContent = timeString;
    });

    // Check if daily cycle rolled over (remainingSec === 0)
    if (remainingSec === 0) {
      // Re-calculate daily stats for the new cycle starting at 00:00:00 IST
      refreshEventStats();
      renderAllCards();
    }
  }

  // ==================== DETAIL & ORDER MODAL ====================
  window.openDetailModal = function (eventId) {
    const event = appState.events.find(e => e.id === eventId);
    if (!event) return;

    appState.selectedEvent = event;
    appState.quantity = 1;

    // Header info
    document.getElementById('modal-event-num').textContent = event.code || event.eventNumber;
    document.getElementById('modal-category').textContent = event.category;
    document.getElementById('modal-title').textContent = event.title;
    document.getElementById('modal-desc').textContent = event.shortPrize;

    // Price & Cap
    document.getElementById('modal-price').textContent = `₹${event.ticketPrice}`;
    document.getElementById('modal-cap').textContent = `${event.plannedCap.toLocaleString()} Entries`;

    // Progress Bar
    const progressPercent = Math.min(100, Math.max(0, event.progressPercent || 0));
    document.getElementById('modal-progress-count').innerHTML = `
      <strong>${(event.recordedQuantity || 0).toLocaleString()}</strong> / ${(event.plannedCap || 0).toLocaleString()} (${progressPercent}%)
    `;
    document.getElementById('modal-progress-fill').style.width = `${progressPercent}%`;

    // Dynamic quantity selector bounds: dynamically equal to remaining capacity!
    const remaining = event.remainingCapacity;
    const maxAllowed = Math.max(0, remaining);
    const qtyInput = document.getElementById('modal-qty-input');
    const proceedBtn = document.getElementById('modal-proceed-btn');
    const capStatus = document.getElementById('modal-cap-status');

    if (capStatus) {
      capStatus.textContent = `${remaining.toLocaleString()} Left`;
    }

    if (maxAllowed === 0) {
      qtyInput.value = 0;
      qtyInput.min = 0;
      qtyInput.max = 0;
      qtyInput.disabled = true;
      if (proceedBtn) {
        proceedBtn.disabled = true;
        proceedBtn.innerHTML = `<span>Event Full / Sold Out</span>`;
      }
    } else {
      qtyInput.disabled = false;
      qtyInput.min = 1;
      qtyInput.max = maxAllowed;
      qtyInput.value = 1;
      if (proceedBtn) {
        proceedBtn.disabled = false;
        proceedBtn.innerHTML = `<span>Proceed to Participate</span><i data-lucide="arrow-right" style="width:16px; height:16px;"></i>`;
      }
    }

    updateModalTotal();

    // Render Specs
    const specsList = document.getElementById('modal-specs');
    specsList.innerHTML = '';
    if (event.specs) {
      for (const [k, v] of Object.entries(event.specs)) {
        const li = document.createElement('li');
        li.className = 'ps-modal-spec-row';
        li.innerHTML = `
          <span class="lbl">${escapeHtml(k)}</span>
          <span class="val">${escapeHtml(v)}</span>
        `;
        specsList.appendChild(li);
      }
    }

    // Render Rules
    const rulesList = document.getElementById('modal-rules');
    rulesList.innerHTML = '';
    if (event.rules && Array.isArray(event.rules)) {
      event.rules.forEach(rule => {
        const li = document.createElement('li');
        li.innerHTML = `
          <i data-lucide="check" style="width:14px; height:14px; color:var(--ps-blue);"></i>
          <span>${escapeHtml(rule)}</span>
        `;
        rulesList.appendChild(li);
      });
    }

    // Open Modal
    const modal = document.getElementById('ps-detail-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  window.closeDetailModal = function () {
    const modal = document.getElementById('ps-detail-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Quantity Stepper
  window.changeModalQuantity = function (delta) {
    const qtyInput = document.getElementById('modal-qty-input');
    if (!qtyInput || !appState.selectedEvent) return;

    const event = appState.selectedEvent;
    const maxAllowed = Math.max(0, event.remainingCapacity);
    if (maxAllowed === 0) {
      qtyInput.value = 0;
      updateModalTotal();
      return;
    }

    let cur = parseInt(qtyInput.value, 10) || 1;
    cur = Math.max(1, Math.min(maxAllowed, cur + delta));
    qtyInput.value = cur;
    updateModalTotal();
  };

  window.updateModalTotal = function () {
    const qtyInput = document.getElementById('modal-qty-input');
    const totalDisplay = document.getElementById('modal-total-display');
    if (!qtyInput || !totalDisplay || !appState.selectedEvent) return;

    const event = appState.selectedEvent;
    const maxAllowed = Math.max(0, event.remainingCapacity);
    if (maxAllowed === 0) {
      qtyInput.value = 0;
      appState.quantity = 0;
      totalDisplay.textContent = '₹0';
      return;
    }

    let qty = parseInt(qtyInput.value, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > maxAllowed) qty = maxAllowed;

    qtyInput.value = qty;
    appState.quantity = qty;
    const totalAmount = event.ticketPrice * qty;
    totalDisplay.textContent = `₹${totalAmount.toLocaleString('en-IN')}`;
  };

  // ==================== PRE-PAYMENT USER INFORMATION POPUP ====================
  window.openPrepaymentModal = function (eventId) {
    if (eventId) {
      const event = appState.events.find(e => e.id === eventId);
      if (event) appState.selectedEvent = event;
    }

    const event = appState.selectedEvent;
    if (!event) return;

    // Close detail modal if open
    closeDetailModal();

    // Ensure quantity does not exceed remaining capacity
    const maxAllowed = Math.max(0, event.remainingCapacity);
    if (maxAllowed === 0) {
      alert('This event has reached maximum capacity.');
      return;
    }

    appState.quantity = Math.max(1, Math.min(maxAllowed, appState.quantity || 1));

    // Populate purchase summary in prepayment popup
    const titleEl = document.getElementById('prepay-summary-title');
    const unitPriceEl = document.getElementById('prepay-summary-unit-price');
    const qtyEl = document.getElementById('prepay-summary-qty');
    const totalEl = document.getElementById('prepay-summary-total');

    if (titleEl) titleEl.textContent = event.title;
    if (unitPriceEl) unitPriceEl.textContent = `₹${event.ticketPrice} / ticket`;
    if (qtyEl) qtyEl.textContent = appState.quantity.toLocaleString('en-IN');
    if (totalEl) totalEl.textContent = `₹${(event.ticketPrice * appState.quantity).toLocaleString('en-IN')}`;

    // Reset inline validation errors
    clearFieldError('prepay-name');
    clearFieldError('prepay-phone');
    clearFieldError('prepay-email');

    // Reset placeholder status card
    const placeholderBox = document.getElementById('prepay-placeholder-box');
    if (placeholderBox) placeholderBox.style.display = 'none';

    // Reset button
    const btn = document.getElementById('btn-continue-payment');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>Continue to Payment</span><i data-lucide="arrow-right" style="width:16px; height:16px;"></i>`;
    }

    // Open Prepayment Modal
    const modal = document.getElementById('ps-prepayment-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  };

  window.closePrepaymentModal = function () {
    const modal = document.getElementById('ps-prepayment-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.changePrepaymentQuantity = function (delta) {
    const event = appState.selectedEvent;
    if (!event) return;

    // Remaining capacity limit
    const maxAllowed = Math.max(0, event.remainingCapacity);
    if (maxAllowed === 0) return;

    let cur = appState.quantity || 1;
    cur = Math.max(1, Math.min(maxAllowed, cur + delta));
    appState.quantity = cur;

    // Update summary in popup
    const qtyEl = document.getElementById('prepay-summary-qty');
    const totalEl = document.getElementById('prepay-summary-total');
    if (qtyEl) qtyEl.textContent = cur.toLocaleString('en-IN');
    if (totalEl) totalEl.textContent = `₹${(event.ticketPrice * cur).toLocaleString('en-IN')}`;

    // Sync with detail modal
    const detailQtyInput = document.getElementById('modal-qty-input');
    const detailTotalDisplay = document.getElementById('modal-total-display');
    if (detailQtyInput) detailQtyInput.value = cur;
    if (detailTotalDisplay) detailTotalDisplay.textContent = `₹${(event.ticketPrice * cur).toLocaleString('en-IN')}`;
  };

  window.clearFieldError = function (fieldId) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById('error-' + fieldId);
    if (input) input.classList.remove('has-error');
    if (errorEl) errorEl.classList.remove('visible');
  };

  function setFieldError(fieldId, errorMsg) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById('error-' + fieldId);
    if (input) {
      input.classList.add('has-error');
    }
    if (errorEl) {
      if (errorMsg) errorEl.textContent = errorMsg;
      errorEl.classList.add('visible');
    }
  }

  window.handleContinueToPayment = function () {
    const event = appState.selectedEvent;
    if (!event) return;

    const nameInput = document.getElementById('prepay-name');
    const phoneInput = document.getElementById('prepay-phone');
    const emailInput = document.getElementById('prepay-email');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';
    const email = emailInput ? emailInput.value.trim() : '';

    let isValid = true;
    let firstInvalidInput = null;

    // 1. Validate Full Name (Mandatory, minimum 2 characters)
    if (!name || name.length < 2) {
      setFieldError('prepay-name', 'Please enter your full name as per government documents (minimum 2 characters).');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = nameInput;
    } else {
      clearFieldError('prepay-name');
    }

    // 2. Validate Indian Mobile Number (Mandatory, 10 digits starting with 6, 7, 8, 9)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setFieldError('prepay-phone', 'Please provide a valid 10-digit Indian mobile number (e.g. 9876543210).');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = phoneInput;
    } else {
      clearFieldError('prepay-phone');
    }

    // 3. Validate Email Address (Mandatory, standard email format)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldError('prepay-email', 'Please provide a valid email address.');
      isValid = false;
      if (!firstInvalidInput) firstInvalidInput = emailInput;
    } else {
      clearFieldError('prepay-email');
    }

    if (!isValid) {
      if (firstInvalidInput) firstInvalidInput.focus();
      return;
    }

    // Validate remaining capacity
    const quantity = appState.quantity || 1;
    if (quantity > event.remainingCapacity) {
      alert(`Requested quantity (${quantity}) exceeds remaining capacity (${event.remainingCapacity}).`);
      return;
    }

    // Save customer details in sessionStorage for smooth retry on fail/cancel
    try {
      sessionStorage.setItem('ps_user_name', name);
      sessionStorage.setItem('ps_user_phone', phone);
      sessionStorage.setItem('ps_user_email', email);
      sessionStorage.setItem('ps_last_event_id', event.id);
      sessionStorage.setItem('ps_last_quantity', String(quantity));
    } catch (_) {}

    const btn = document.getElementById('btn-continue-payment');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #ffffff; border-top-color:transparent; border-radius:50%; animation:ps-spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span><span>Connecting to PayU...</span>`;
    }

    // Call server to initiate PayU Hosted Checkout with authoritative server pricing
    fetch('/api/ps-payu-initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: event.id,
        quantity,
        name,
        phone,
        email
      })
    })
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initiate secure PayU checkout.');
      }
      return data;
    })
    .then(data => {
      // Create and dynamically submit form to PayU Hosted Checkout
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.actionUrl;
      form.style.display = 'none';

      for (const [key, val] of Object.entries(data.params || {})) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(val);
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    })
    .catch(err => {
      console.error('[PAYU INITIATION ERROR]', err);
      alert(err.message || 'Payment initiation failed. Please try again.');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>Continue to Payment</span><i data-lucide="arrow-right" style="width:16px; height:16px;"></i>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  };

  // ==================== CATEGORY FILTERING ====================
  function initCategoryTabs() {
    const tabButtons = document.querySelectorAll('.ps-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tab = btn.getAttribute('data-tab');
        setCategoryView(tab);
      });
    });
  }

  window.setCategoryView = function (tab) {
    appState.categoryFilter = tab;
    const ps5Section = document.getElementById('ps5-section');
    const proSection = document.getElementById('pro-section');

    if (!ps5Section || !proSection) return;

    if (tab === 'ps5') {
      ps5Section.style.display = 'block';
      proSection.style.display = 'none';
      ps5Section.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'pro') {
      ps5Section.style.display = 'none';
      proSection.style.display = 'block';
      proSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      ps5Section.style.display = 'block';
      proSection.style.display = 'block';
    }

    closeMobileNav();
  };

  // ==================== MOBILE NAVIGATION ====================
  function initMobileNav() {
    const toggle = document.getElementById('ps-menu-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const nav = document.getElementById('ps-mobile-nav');
      if (nav) {
        nav.classList.toggle('active');
        const isOpen = nav.classList.contains('active');
        toggle.setAttribute('aria-expanded', isOpen);
      }
    });
  }

  function closeMobileNav() {
    const nav = document.getElementById('ps-mobile-nav');
    const toggle = document.getElementById('ps-menu-toggle');
    if (nav) nav.classList.remove('active');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  // ==================== FAQ ACCORDION ====================
  function initFaqAccordion() {
    const faqButtons = document.querySelectorAll('.ps-faq-question');
    faqButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const item = btn.closest('.ps-faq-item');
        if (!item) return;
        const isCurrentlyActive = item.classList.contains('active');
        item.classList.toggle('active', !isCurrentlyActive);
        btn.setAttribute('aria-expanded', !isCurrentlyActive ? 'true' : 'false');
      });
    });
  }

  // ==================== PAYU CALLBACK & STATUS HANDLER ====================
  function checkPaymentCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    if (!payment) return;

    if (payment === 'success') {
      const orderId = urlParams.get('orderId');
      const txnid = urlParams.get('txnid');
      const token = urlParams.get('token');

      // Server verification check — Never confirm tickets without server validation!
      fetch(`/api/ps-verify?orderId=${encodeURIComponent(orderId || '')}&txnid=${encodeURIComponent(txnid || '')}&token=${encodeURIComponent(token || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.isConfirmed) {
            showOrderSuccessModal(data);
            refreshEventStats();
            renderAllCards();
          } else {
            showPaymentStatusModal({
              type: 'failed',
              title: 'Verification Incomplete',
              message: 'Your payment could not be automatically confirmed by the server ledger. Please contact support with your transaction reference.',
              txnid
            });
          }
        })
        .catch(() => {
          showPaymentStatusModal({
            type: 'failed',
            title: 'Verification Error',
            message: 'Unable to reach the server to verify tickets. Please check Order Verification in the menu.',
            txnid
          });
        })
        .finally(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    } else if (payment === 'failed') {
      const msg = urlParams.get('msg') || 'Payment failed or was declined by your bank.';
      const txnid = urlParams.get('txnid');
      showPaymentStatusModal({
        type: 'failed',
        title: 'Payment Failed',
        message: msg,
        txnid
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'cancelled') {
      showPaymentStatusModal({
        type: 'cancelled',
        title: 'Payment Cancelled',
        message: 'You exited the checkout process before completing payment. No tickets were confirmed and no money was deducted.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (payment === 'pending') {
      const txnid = urlParams.get('txnid');
      showPaymentStatusModal({
        type: 'pending',
        title: 'Payment Pending',
        message: 'Your payment is currently being processed by your bank. Tickets will be confirmed once verified clearance is received.',
        txnid
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  window.showOrderSuccessModal = function (order) {
    const modal = document.getElementById('ps-order-success-modal');
    const content = document.getElementById('order-success-content');
    if (!modal || !content) return;

    const tickets = order.ticketIds || (order.ticketsData || []).map(t => t.ticketId) || [];
    const ticketBadges = tickets.map(t => `
      <span style="display:inline-block; font-family:monospace; font-size:11.5px; background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd; border-radius:4px; padding:3px 8px; font-weight:600;">
        ${escapeHtml(t)}
      </span>
    `).join('');

    content.innerHTML = `
      <div style="text-align:center; padding:6px 0 16px;">
        <div style="width:46px; height:46px; background:#dcfce7; color:#15803d; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px;">
          <i data-lucide="check" style="width:24px; height:24px;"></i>
        </div>
        <h3 style="font-size:17px; font-weight:700; color:var(--text-main); margin:0;">Participation Confirmed</h3>
        <p style="font-size:12.5px; color:var(--text-muted); margin-top:4px;">
          Payment verified by PayU. Your entry is officially recorded in the event ledger.
        </p>
      </div>

      <div class="ps-summary-card" style="margin-bottom:14px; background:#f8fafc; border:1px solid var(--border-light); border-radius:8px; padding:12px 14px;">
        <div class="ps-summary-row"><span class="ps-summary-label">Order ID</span><strong style="font-family:monospace; font-size:12.5px;">${escapeHtml(order.orderId)}</strong></div>
        ${order.txnid ? `<div class="ps-summary-row"><span class="ps-summary-label">Transaction ID</span><span style="font-family:monospace; font-size:11.5px; color:var(--text-muted);">${escapeHtml(order.txnid)}</span></div>` : ''}
        <div class="ps-summary-row"><span class="ps-summary-label">Event</span><strong>${escapeHtml(order.eventTitle)}</strong></div>
        <div class="ps-summary-row"><span class="ps-summary-label">Confirmed Quantity</span><strong>${order.quantity} Ticket(s)</strong></div>
        <div class="ps-summary-row ps-summary-total-row">
          <span class="ps-summary-label" style="font-weight:700; color:var(--text-main);">Amount Paid:</span>
          <span class="ps-summary-total-val" style="color:#15803d; font-size:16px;">₹${Number(order.totalAmount).toLocaleString('en-IN')}</span>
        </div>
      </div>

      ${tickets.length > 0 ? `
        <div style="margin-bottom:14px;">
          <div style="font-size:11.5px; font-weight:700; color:var(--text-main); margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Issued Ticket Serials:</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${ticketBadges}
          </div>
        </div>
      ` : ''}

      <div style="font-size:12px; color:#166534; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; padding:10px 12px; margin-bottom:16px; line-height:1.5;">
        <strong>Result Announcement:</strong> Scheduled daily at <strong>12:00 AM Midnight IST</strong>.<br>
        Selection results and unedited Random.org screen recordings will be published on Instagram.
      </div>

      <button type="button" class="ps-btn-primary" onclick="closeOrderSuccessModal()" style="width:100%;">
        <span>Done / Back to Events</span>
        <i data-lucide="check" style="width:16px; height:16px;"></i>
      </button>
    `;

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closeOrderSuccessModal = function () {
    const modal = document.getElementById('ps-order-success-modal');
    if (modal) modal.classList.remove('active');
  };

  window.showPaymentStatusModal = function ({ type, title, message, txnid }) {
    const modal = document.getElementById('ps-payment-status-modal');
    const titleEl = document.getElementById('payment-status-modal-title');
    const bodyEl = document.getElementById('payment-status-modal-body');
    if (!modal || !titleEl || !bodyEl) return;

    let icon = 'alert-circle';
    let iconColor = '#dc2626';
    let iconBg = '#fee2e2';

    if (type === 'cancelled') {
      icon = 'slash';
      iconColor = '#d97706';
      iconBg = '#fef3c7';
    } else if (type === 'pending') {
      icon = 'clock';
      iconColor = '#2563eb';
      iconBg = '#eff6ff';
    }

    titleEl.innerHTML = `
      <i data-lucide="${icon}" style="width:18px; height:18px; color:${iconColor};"></i>
      <span style="color:${iconColor};">${escapeHtml(title)}</span>
    `;

    bodyEl.innerHTML = `
      <div style="text-align:center; padding:6px 0 16px;">
        <div style="width:46px; height:46px; background:${iconBg}; color:${iconColor}; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px;">
          <i data-lucide="${icon}" style="width:24px; height:24px;"></i>
        </div>
        <h3 style="font-size:17px; font-weight:700; color:var(--text-main); margin:0;">${escapeHtml(title)}</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-top:6px; line-height:1.5;">
          ${escapeHtml(message)}
        </p>
      </div>

      <div style="background:#f8fafc; border:1px solid var(--border-light); border-radius:6px; padding:10px 12px; font-size:12px; color:var(--text-muted); margin-bottom:16px;">
        <div>No tickets were confirmed for this transaction.</div>
        ${txnid ? `<div style="margin-top:4px; font-size:11px; font-family:monospace; color:var(--text-body);">Txn Reference: ${escapeHtml(txnid)}</div>` : ''}
      </div>

      <div style="display:flex; gap:10px;">
        <button type="button" class="ps-btn-secondary" onclick="closePaymentStatusModal()" style="flex:1;">
          <span>Close</span>
        </button>
        ${type !== 'pending' ? `
          <button type="button" class="ps-btn-primary" onclick="retryLastParticipation()" style="flex:1.5;">
            <span>Retry Payment</span>
            <i data-lucide="refresh-cw" style="width:14px; height:14px;"></i>
          </button>
        ` : ''}
      </div>
    `;

    modal.classList.add('active');
    if (window.lucide) window.lucide.createIcons();
  };

  window.closePaymentStatusModal = function () {
    const modal = document.getElementById('ps-payment-status-modal');
    if (modal) modal.classList.remove('active');
  };

  window.retryLastParticipation = function () {
    closePaymentStatusModal();
    const lastEventId = sessionStorage.getItem('ps_last_event_id') || 'ps5-1';
    const lastQty = parseInt(sessionStorage.getItem('ps_last_quantity'), 10) || 1;
    appState.quantity = lastQty;

    openPrepaymentModal(lastEventId);

    // Pre-fill preserved fields
    const nameInput = document.getElementById('prepay-name');
    const phoneInput = document.getElementById('prepay-phone');
    const emailInput = document.getElementById('prepay-email');

    if (nameInput) nameInput.value = sessionStorage.getItem('ps_user_name') || '';
    if (phoneInput) phoneInput.value = sessionStorage.getItem('ps_user_phone') || '';
    if (emailInput) emailInput.value = sessionStorage.getItem('ps_user_email') || '';
  };

  // ==================== VERIFY MODAL ====================
  window.openVerifyModal = function () {
    const modal = document.getElementById('ps-verify-modal');
    if (modal) modal.classList.add('active');
    closeMobileNav();
  };

  window.closeVerifyModal = function () {
    const modal = document.getElementById('ps-verify-modal');
    if (modal) modal.classList.remove('active');
  };

  window.lookupOrderVerification = function () {
    const input = document.getElementById('verify-order-id');
    const box = document.getElementById('verify-result-box');
    if (!input || !box) return;

    const val = input.value.trim();
    if (!val) {
      box.style.display = 'block';
      box.innerHTML = '<div style="padding:10px 12px; background:#fef2f2; border:1px solid #fecaca; border-radius:6px; font-size:12.5px; color:#b91c1c;">Please enter a valid Order ID to verify.</div>';
      return;
    }

    box.style.display = 'block';
    box.innerHTML = `
      <div style="padding:12px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:12.5px; color:#15803d;">
        <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
          <i data-lucide="shield-check" style="width:16px; height:16px; color:#16a34a;"></i>
          <span>Order Record Verified</span>
        </div>
        <div>Order ID <strong>${escapeHtml(val)}</strong> is registered in the official event ledger.</div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  };

  // ==================== UTILITY HELPERS ====================
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose global methods for test suites
  window._getISTCycleState = getISTCycleState;
  window._calculateDailyParticipation = calculateDailyParticipation;
  window._PS_EVENTS_CATALOG = PS_EVENTS_CATALOG;

})();
