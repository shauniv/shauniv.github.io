/* Rene Herse Cycles — Tire Pressure Calculator */
( function () {
  'use strict';

  // ═══════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════

  // Spreadsheet equations: y = slope*x + intercept  (x = wheel load in KG)
  // Keyed by nominal width → { firm: [slope, intercept], soft: [slope, intercept] }
  var EQUATIONS = {
    25: { firm: [1.24722222222222,  0.733333333333327], soft: [1.00833333333333, -8                 ] },
    28: { firm: [0.869444444444444, 2.76666666666667 ], soft: [0.7125,            0.800000000000004 ] },
    32: { firm: [0.673611111111111, 2.66666666666666 ], soft: [0.530555555555555, 3.93333333333334  ] },
    35: { firm: [0.586111111111111, 2.36666666666667 ], soft: [0.458333333333333, 3.8               ] },
    38: { firm: [0.4875,            4.1              ], soft: [0.397222222222222, 3.63333333333333  ] },
    42: { firm: [0.431944444444444, 3.96666666666667 ], soft: [0.345833333333333, 3.6               ] },
    48: { firm: [0.365277777777778, 4.86666666666666 ], soft: [0.293055555555556, 4.13333333333333  ] },
    55: { firm: [0.295833333333333, 6                ], soft: [0.244444444444444, 4.56666666666667  ] },
    58: { firm: [0.266071428571429, 6.48571428571429 ], soft: [0.223611111111111, 4.75238095238096  ] },
  };
  var ANCHOR_WIDTHS = [25, 28, 32, 35, 38, 42, 48, 55, 58];

  // Rene Herse available widths (for width finder output snapping)
  var RH_WIDTHS     = [26, 28, 31, 35, 38, 43, 48, 55];
  var RH_CALC_WIDTH = { 26:26, 28:28, 31:31, 35:35, 38:38, 43:43, 48:48, 55:55 };
  var RH_DISPLAY    = { 26:'26', 28:'28', 31:'31–32', 35:'35', 38:'38', 43:'42–44', 48:'48', 55:'55' };

  // Width finder multipliers
  var WIDTH_FINDER_MULT = { road:12, allroad:18, gravel:25, adventure:36 };

  // Width finder tread recommendations (keyed by style)
  var WIDTH_FINDER_TREAD = {
    road:      'Smooth All-Road',
    allroad:   'Smooth All-Road',
    gravel:    'Semi-Slick or Dual-Purpose Knobby',
    adventure: 'Dual-Purpose Knobby',
  };

  // Width finder casing recommendations (keyed by riding style)
  var WIDTH_FINDER_CASING = {
    smooth:           'Extralight or Standard',
    endurance:        'Endurance',
    'endurance-plus': 'Endurance Plus',
  };

  // Refine the casing recommendation so we don't suggest casings that aren't
  // offered in the recommended width (e.g. Endurance Plus in narrow tires).
  // totalLb = rider + bike (system weight); riderLb = rider weight alone.
  function widthFinderCasing(style, ridingStyle, totalLb, riderLb) {
    // Heavy smooth riders on pavement: bump up from Extralight / Standard.
    if (ridingStyle === 'smooth' && (style === 'road' || style === 'allroad') && riderLb > 250) {
      return 'Standard or Endurance';
    }

    // Tougher casings (Endurance / Endurance Plus) aren't available in the narrow
    // widths that lighter riders are recommended — downgrade based on system weight.
    var tough = ridingStyle === 'endurance' || ridingStyle === 'endurance-plus';
    if (style === 'road'      && tough)                          return totalLb < 160 ? 'Standard' : 'Endurance';
    if (style === 'allroad'   && tough)                          return totalLb < 107 ? 'Standard' : 'Endurance';
    if (style === 'gravel'    && ridingStyle === 'endurance-plus' && totalLb <  145) return 'Endurance';
    if (style === 'adventure' && ridingStyle === 'endurance-plus' && totalLb <= 100) return 'Endurance';

    return WIDTH_FINDER_CASING[ridingStyle] || WIDTH_FINDER_CASING.smooth;
  }

  // Casing adjustments (psi numerator; divided by tire width)
  var CASING_ADJ = { '0':0, '-50':-50, '-150':-150, '-150b':-150, '-100':-100 };

  // Bike type adjustments (front/rear % applied to base pressure)
  var BIKE_TYPE_ADJ = {
    road:        { f: -3, r:  3 },
    'allroad-bike': { f: -4, r:  4 },
    gravel:      { f: -4, r:  4 },
    rando:   { f: -5, r:  5 },
    touring: { f: -5, r:  5 },
    country: { f: -5, r:  5 },
    city:    { f: -7, r:  7 },
  };

  // Frame size adjustments (front/rear % applied to base pressure)
  var FRAME_SIZE_ADJ = {
    small:  { f:  2, r: -2 },
    medium: { f:  0, r:  0 },
    tall:   { f: -3, r:  3 },
  };

  // Allowed riding positions per bike type (intermediate is always valid)
  var BIKE_TYPE_POSITIONS = {
    road:           ['aero', 'low', 'intermediate', 'upright'],
    'allroad-bike': ['aero', 'low', 'intermediate', 'upright'],
    gravel:         ['aero', 'low', 'intermediate', 'upright'],
    rando:   ['aero', 'low', 'intermediate', 'upright'],
    touring: ['low', 'intermediate', 'upright'],
    country: ['intermediate', 'upright'],
    city:    ['intermediate', 'upright'],
  };

  // Default position when switching to a bike type that makes the current selection invalid
  var BIKE_TYPE_DEFAULT_POSITION = {
    road: 'intermediate', 'allroad-bike': 'intermediate', gravel: 'intermediate', rando: 'intermediate',
    touring: 'intermediate', country: 'upright', city: 'upright',
  };

  var POSITION_LABELS = {
    aero:         'Aero / Flat Back',
    low:          'Low / Stretched-Out',
    intermediate: 'Intermediate',
    upright:      'Upright',
  };

  // Riding position adjustments (front/rear % applied to base pressure)
  var POSITION_ADJ = {
    aero:         { f:  2, r: -2 },
    low:          { f:  0, r:  0 },
    intermediate: { f: -2, r:  2 },
    upright:      { f: -4, r:  4 },
  };

  var LB_PER_KG   = 2.20462;
  var BAR_PER_PSI = 0.0689476;

  var MIN_COMBINED_KG = 40;
  var MAX_COMBINED_KG = 200;

  // ═══════════════════════════════════════════
  // ═══════════════════════════════════════════
  // LOCALE-BASED UNIT DETECTION
  // ═══════════════════════════════════════════
  function guessUnit() {
    var langs = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var region = '';
      try {
        region = new Intl.Locale(langs[i]).maximize().region;
      } catch (e) {
        var parts = langs[i].split(/[-_]/);
        if (parts.length > 1) region = parts[parts.length - 1].toUpperCase();
      }
      if (region) return region === 'US' ? 'us' : 'metric';
    }
    return 'metric';
  }
  var defaultUnit = guessUnit();

  // STATE
  // ═══════════════════════════════════════════
  var state = {
    activeTab: null, // set from the DOM on init — which tabs exist varies by page
    s:  { unit: defaultUnit, feel:'soft',              outUnit: defaultUnit, lastPsi: null },
    p:  { unit: defaultUnit, feel:'soft', tube:'tubes', outUnit: defaultUnit, lastFPsi: null, lastRPsi: null },
    wf: { unit: defaultUnit, feel:'soft',              outUnit: defaultUnit, lastPsi: null },
  };

  // Shared fields synced on tab switch (only between tabs present on the page)
  var SHARED_FIELDS = [
    { s: 'rhc-s-rider', p: 'rhc-p-rider', wf: 'rhc-wf-rider' },
    { s: 'rhc-s-bike',  p: 'rhc-p-bike',  wf: 'rhc-wf-bike'  },
  ];

  // Tab slug (from the shortcode / DOM id) → internal state prefix.
  // Tabs with no inputs map to null: nothing to calculate or sync.
  var TAB_PREFIX = {
    'simple':       's',
    'pro':          'p',
    'width-finder': 'wf',
    'tire-finder':  null, // placeholder — design pending
  };

  var TAB_IDS = { s: 'rhc-tab-simple', p: 'rhc-tab-pro', wf: 'rhc-tab-width-finder' };

  function el(id) { return document.getElementById(id); }

  // ═══════════════════════════════════════════
  // INTERPOLATION
  // ═══════════════════════════════════════════
  function getEquation(width, feel) {
    var eqs     = EQUATIONS;
    var anchors = ANCHOR_WIDTHS;
    var minW = anchors[0], maxW = anchors[anchors.length - 1];

    if (width <= minW) return eqs[minW][feel];
    if (width >= maxW) return eqs[maxW][feel];

    var lower = anchors[0], upper = anchors[1];
    for (var i = 0; i < anchors.length - 1; i++) {
      if (width >= anchors[i] && width <= anchors[i+1]) {
        lower = anchors[i];
        upper = anchors[i+1];
        break;
      }
    }
    if (lower === upper) return eqs[lower][feel];

    var t  = (width - lower) / (upper - lower);
    var ls = eqs[lower][feel][0], li = eqs[lower][feel][1];
    var us = eqs[upper][feel][0], ui = eqs[upper][feel][1];
    return [ls + t*(us-ls), li + t*(ui-li)];
  }

  // weightLb converted to kg internally; equation is m × kg + b
  function calcPSI(weightLb, width, feel) {
    var eq = getEquation(width, feel);
    var weightKg = weightLb / LB_PER_KG;
    return eq[0] * weightKg + eq[1];
  }

  // ═══════════════════════════════════════════
  // UNIT HELPERS
  // ═══════════════════════════════════════════

  function fmtNum(value, decimals) {
    return new Intl.NumberFormat(navigator.language, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  // Simple / width finder rounding: nearest 1 psi or 0.1 bar
  function fmtPressureVal(psi, unit) {
    if (unit === 'metric') {
      return { val: fmtNum(psi * BAR_PER_PSI, 1), unit: 'bar' };
    }
    return { val: fmtNum(Math.round(psi), 0), unit: 'psi' };
  }

  // Pro rounding: 0.1 psi or 0.01 bar (spec §3 / §5.9)
  function fmtProPressure(psi, unit) {
    if (unit === 'metric') {
      return { val: fmtNum(psi * BAR_PER_PSI, 2), unit: 'bar' };
    }
    return { val: fmtNum(psi, 1), unit: 'psi' };
  }

  // Returns weight in lb. Reads per-field unit select (id + '-unit') if present,
  // falling back to the tab-level unit — supports mixed units per spec §7.
  function getWeight(id, fallbackUnit) {
    var input = el(id);
    if (!input) return 0;
    var v = parseFloat(input.value) || 0;
    var unitEl = el(id + '-unit');
    var unit = unitEl ? unitEl.value : fallbackUnit;
    return unit === 'us' ? v : v * LB_PER_KG; // always return lb
  }

  // ═══════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════
  // Copies rider/bike weight between tabs so switching doesn't lose input.
  // Tabs living on different pages simply aren't found and are skipped.
  function syncSharedFields(fromPrefix) {
    if (!fromPrefix) return;
    SHARED_FIELDS.forEach(function(map) {
      var src = el(map[fromPrefix]);
      if (!src) return;
      var unitEl = el(map[fromPrefix] + '-unit');
      var unit   = unitEl ? unitEl.value : null;
      Object.keys(map).forEach(function(prefix) {
        if (prefix === fromPrefix) return;
        var dest = el(map[prefix]);
        if (!dest) return;
        dest.value = src.value;
        if (unit !== null) {
          var destUnit = el(map[prefix] + '-unit');
          if (destUnit) destUnit.value = unit;
        }
      });
    });

    // Tire width — simple ↔ pro only (the width finder has no width input)
    var sw = el('rhc-s-width'), fw = el('rhc-p-fw'), rw = el('rhc-p-rw');
    if (!sw || !fw || !rw) return;
    if (fromPrefix === 's') {
      fw.value = sw.value;
      rw.value = sw.value;
    } else if (fromPrefix === 'p') {
      sw.value = rw.value || fw.value;
    }
  }

  function setWeightWarning(prefix, riderLb, bikeLb) {
    var warnEl = el('rhc-' + prefix + '-weight-warning');
    var card   = el('rhc-' + prefix + '-result');
    if (!warnEl || !card) return;
    var totalLb = riderLb + bikeLb;
    var totalKg = totalLb / LB_PER_KG;
    var kgStr = fmtNum(totalKg, 1) + ' kg / ' + fmtNum(Math.round(totalLb), 0) + ' lb';
    if (totalKg < MIN_COMBINED_KG) {
      warnEl.textContent = 'Combined rider and bike weight (' + kgStr + ') is below the minimum of ' + MIN_COMBINED_KG + ' kg / ' + Math.round(MIN_COMBINED_KG * LB_PER_KG) + ' lb. We have no data for this weight range.';
      warnEl.style.display = 'block';
      card.classList.add('out-of-range');
    } else if (totalKg > MAX_COMBINED_KG) {
      warnEl.textContent = 'Combined rider and bike weight (' + kgStr + ') is above the maximum of ' + MAX_COMBINED_KG + ' kg / ' + Math.round(MAX_COMBINED_KG * LB_PER_KG) + ' lb. We have no data for this weight range.';
      warnEl.style.display = 'block';
      card.classList.add('out-of-range');
    } else {
      warnEl.style.display = 'none';
      card.classList.remove('out-of-range');
    }
  }

  function hideResults(prefix) {
    var errEl = el('rhc-' + prefix + '-error');
    var resEl = el('rhc-' + prefix + '-result');
    if (errEl) errEl.classList.remove('visible');
    if (resEl) resEl.classList.remove('visible');
  }

  // Single gate for every calculator: a tab that isn't on this page has no
  // fields to read, so bail before the calc bodies start dereferencing them.
  // Partials are all-or-nothing, so past this point a tab's elements all exist.
  function liveCalc(prefix) {
    if (!prefix || !el(TAB_IDS[prefix])) return;
    if (prefix === 's')       window.rhcTpcCalcSimple();
    else if (prefix === 'p')  window.rhcTpcCalcPro();
    else if (prefix === 'wf') window.rhcTpcCalcWidthFinder();
  }

  function showError(prefix, msg) {
    var errEl = el('rhc-' + prefix + '-error');
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.add('visible');
    }
    var resEl = el('rhc-' + prefix + '-result');
    if (resEl) resEl.classList.remove('visible');
  }

  function clearError(prefix) {
    var errEl = el('rhc-' + prefix + '-error');
    if (errEl) errEl.classList.remove('visible');
  }

  // ═══════════════════════════════════════════
  // PUBLIC API (called from onclick attributes)
  // ═══════════════════════════════════════════
  // `slug` is the tab slug from the shortcode (e.g. 'width-finder'), not a prefix.
  window.rhcTpcSwitchTab = function(slug, btn) {
    // Scope to this instance so two shortcodes on one page don't fight.
    var root = btn.closest('.rhc-tpc');
    if (!root) return;
    syncSharedFields(state.activeTab);
    root.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
    root.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    var panel = el('rhc-tab-' + slug);
    if (panel) panel.classList.add('active');
    btn.classList.add('active');
    state.activeTab = TAB_PREFIX[slug] || null; // null for tabs with no inputs
    liveCalc(state.activeTab);
  };

  function renderOutPressure(prefix) {
    var u = state[prefix].outUnit;
    var usBtn     = el('rhc-' + prefix + '-out-unit-us');
    var metricBtn = el('rhc-' + prefix + '-out-unit-metric');
    if (usBtn)     usBtn.classList.toggle('active',     u === 'us');
    if (metricBtn) metricBtn.classList.toggle('active', u === 'metric');

    if (prefix === 'p') {
      var fEl = el('rhc-p-out-f'), rEl = el('rhc-p-out-r');
      if (fEl) fEl.innerHTML = state.p.lastFPsi === null
        ? 'N/A'
        : (function(){ var v = fmtProPressure(state.p.lastFPsi, u); return v.val + ' <span class="unit">' + v.unit + '</span>'; }());
      if (rEl) rEl.innerHTML = state.p.lastRPsi === null
        ? 'N/A'
        : (function(){ var v = fmtProPressure(state.p.lastRPsi, u); return v.val + ' <span class="unit">' + v.unit + '</span>'; }());
    } else {
      // Simple and width finder both render a single combined pressure.
      var outEl = el('rhc-' + prefix + '-out-psi');
      if (outEl) {
        var pv = fmtPressureVal(state[prefix].lastPsi, u);
        outEl.innerHTML = pv.val + ' <span class="unit">' + pv.unit + '</span>';
      }
    }
  }

  window.rhcTpcSetOutUnit = function(prefix, unit) {
    if (!state[prefix]) return;
    state[prefix].outUnit = unit;
    renderOutPressure(prefix);
  };

  window.rhcTpcSetUnit = function(prefix, unit) {
    if (!state[prefix]) return;
    state[prefix].unit = unit;
    state[prefix].outUnit = unit; // reset output unit to follow the new tab unit
    var usBtn     = el('rhc-' + prefix + '-unit-us');
    var metricBtn = el('rhc-' + prefix + '-unit-metric');
    if (usBtn)     usBtn.classList.toggle('active',     unit === 'us');
    if (metricBtn) metricBtn.classList.toggle('active', unit === 'metric');
    // Sync all per-field unit selects on this tab (convenience — user can override individually)
    var tabEl = el(TAB_IDS[prefix]);
    if (tabEl) {
      tabEl.querySelectorAll('.field-unit-sel').forEach(function(sel) {
        sel.value = unit;
        sel.classList.remove('unit-flash');
        void sel.offsetWidth; // restart animation
        sel.classList.add('unit-flash');
      });
    }
    liveCalc(prefix);
  };

  window.rhcTpcSetFeel = function(prefix, feel) {
    if (!state[prefix]) return;
    state[prefix].feel = feel;
    ['soft','firm','dk'].forEach(function(f) {
      var btn = el('rhc-' + prefix + '-feel-' + f);
      if (btn) btn.classList.toggle('active', f === feel);
    });
    liveCalc(prefix);
  };

  window.rhcTpcSetTube = function(type) {
    state.p.tube = type;
    var tubesBtn    = el('rhc-p-tube-tubes');
    var tubelessBtn = el('rhc-p-tube-tubeless');
    if (tubesBtn)    tubesBtn.classList.toggle('active',    type === 'tubes');
    if (tubelessBtn) tubelessBtn.classList.toggle('active', type === 'tubeless');
    liveCalc('p');
  };

  // ═══════════════════════════════════════════
  // SIMPLE CALCULATOR
  // ═══════════════════════════════════════════
  window.rhcTpcCalcSimple = function() {
    clearError('s');
    var unit    = state.s.unit;
    var width   = parseInt(document.getElementById('rhc-s-width').value);
    var rider   = getWeight('rhc-s-rider', unit);
    var bike    = getWeight('rhc-s-bike', unit);
    var terrain     = document.getElementById('rhc-s-terrain').value;
    var feel        = terrain === 'smooth' ? 'firm' : 'soft';
    var terrainMult = terrain === 'coarse-gravel' ? 0.95
                    : terrain === 'rough-gravel'  ? 1.05
                    : 1;

    if (!width || !rider || !bike) return hideResults('s');

    var totalLb = rider + bike;
    var psi     = calcPSI(totalLb, width, feel) * terrainMult;

    state.s.lastPsi = psi;
    state.s.outUnit = unit;

    setWeightWarning('s', rider, bike);
    renderOutPressure('s');

    document.getElementById('rhc-s-result').classList.add('visible');
  };

  // ═══════════════════════════════════════════
  // PRO CALCULATOR
  // ═══════════════════════════════════════════
  window.rhcTpcCalcPro = function() {
    clearError('p');
    var unit    = state.p.unit;
    var fw      = parseInt(document.getElementById('rhc-p-fw').value);
    var rw      = parseInt(document.getElementById('rhc-p-rw').value);
    var rider   = getWeight('rhc-p-rider', unit);
    var bike    = getWeight('rhc-p-bike', unit);
    var fp      = getWeight('rhc-p-fp', unit);
    var rp      = getWeight('rhc-p-rp', unit);
    var bp      = getWeight('rhc-p-bp', unit);
    var terrain = document.getElementById('rhc-p-terrain').value;
    var rimwRaw = parseFloat(document.getElementById('rhc-p-rimw').value);
    var rimw    = isNaN(rimwRaw) ? 23 : Math.max(10, rimwRaw);
    var rimtype = document.getElementById('rhc-p-rimtype').value;
    var tube    = state.p.tube;
    var fcVal   = document.getElementById('rhc-p-fc').value;
    var rcVal   = document.getElementById('rhc-p-rc').value;
    var btVal   = document.getElementById('rhc-p-biketype').value;
    var fsVal   = document.getElementById('rhc-p-framesize').value;
    var posVal  = document.getElementById('rhc-p-position').value;

    if (!fw || !rw || !rider || !bike) return hideResults('p');

    // 1. Per-wheel effective weights: bikepacking split evenly, panniers added to their wheel
    var baseLb  = rider + bike + bp;
    var fEffLb  = baseLb / 2 + fp;
    var rEffLb  = baseLb / 2 + rp;
    var totalLb = rider + bike + fp + rp + bp;

    // 2. Terrain: override feel and set multiplier
    var feel = state.p.feel === 'dk' ? 'soft' : state.p.feel;
    var terrainMult = 1;
    if (terrain === 'smooth-gravel' || terrain === 'mixed') {
      feel = 'soft';
    } else if (terrain === 'coarse-gravel') {
      feel = 'soft'; terrainMult = 0.95;
    } else if (terrain === 'rough-gravel') {
      feel = 'soft'; terrainMult = 1.05;
    }

    // 3. Rim width multiplier
    var rimAdj = Math.min(rimw, 32) - 19;
    var rimMult = rimAdj > 0 ? (1 - rimAdj * 0.002) : 1;

    // 4. Casing adjustments (psi / tire width)
    var fcAdj = (CASING_ADJ[fcVal] || 0) / fw;
    var rcAdj = (CASING_ADJ[rcVal] || 0) / rw;

    // 5. Percentage adjustments: bike type + frame size + riding position (all additive)
    var btAdj  = BIKE_TYPE_ADJ[btVal]  || BIKE_TYPE_ADJ.road;
    var fsAdj  = FRAME_SIZE_ADJ[fsVal] || FRAME_SIZE_ADJ.medium;
    var posAdj = POSITION_ADJ[posVal]  || POSITION_ADJ.low;
    var fPct   = (btAdj.f + fsAdj.f + posAdj.f) / 100;
    var rPct   = (btAdj.r + fsAdj.r + posAdj.r) / 100;

    // 6. Compute pressures: base (scaled by per-wheel load) → % adj → terrain → casing → rim
    var fBaseScale = (2 * fEffLb) / totalLb;
    var rBaseScale = (2 * rEffLb) / totalLb;
    var fPsi = (calcPSI(totalLb, fw, feel) * fBaseScale * (1 + fPct) * terrainMult + fcAdj) * rimMult;
    var rPsi = (calcPSI(totalLb, rw, feel) * rBaseScale * (1 + rPct) * terrainMult + rcAdj) * rimMult;

    // 7. Hookless / tubeless caps
    var notes = [];
    var HOOKLESS_MAX = 72.5;
    var TUBELESS_MAX = 60;

    if (rimtype === 'hookless' || rimtype === 'dk') {
      if (fPsi > HOOKLESS_MAX) {
        notes.push('⚠️ Your front tire/rim combination requires pressure that exceeds the 5 bar / 72.5 psi ETRTO limit for hookless rims.');
        fPsi = null;
      }
      if (rPsi !== null && rPsi > HOOKLESS_MAX) {
        notes.push('⚠️ Your rear tire/rim combination requires pressure that exceeds the 5 bar / 72.5 psi ETRTO limit for hookless rims.');
        rPsi = null;
      }
    }

    if (tube === 'tubeless') {
      if (fw > 31 && fPsi !== null && fPsi > TUBELESS_MAX) {
        notes.push('⚠️ Your front tire/rim combination requires a pressure that exceeds the 60 psi / 4.1 bar limit for Rene Herse tubeless tires (>31 mm). We suggest using tubes instead or switching to wider tires.');
        fPsi = null;
      }
      if (rw > 31 && rPsi !== null && rPsi > TUBELESS_MAX) {
        notes.push('⚠️ Your rear tire/rim combination requires a pressure that exceeds the 60 psi / 4.1 bar limit for Rene Herse tubeless tires (>31 mm). We suggest using tubes instead or switching to wider tires.');
        rPsi = null;
      }
    }

    // 8. Format output — Pro: 0.1 psi / 0.01 bar
    state.p.lastFPsi = fPsi;
    state.p.lastRPsi = rPsi;
    state.p.outUnit  = unit;

    setWeightWarning('p', rider, bike);
    renderOutPressure('p');

    var noteEl = document.getElementById('rhc-p-result-note');
    if (notes.length) {
      noteEl.style.display = 'block';
      noteEl.innerHTML = notes.map(function(n) { return '• ' + n; }).join('<br>');
    } else {
      noteEl.style.display = 'none';
    }

    document.getElementById('rhc-p-result').classList.add('visible');
  };

  // ═══════════════════════════════════════════
  // WIDTH FINDER  ("How Wide Should I Run?")
  // ═══════════════════════════════════════════
  window.rhcTpcCalcWidthFinder = function() {
    clearError('wf');
    var unit         = state.wf.unit;
    var rider        = getWeight('rhc-wf-rider', unit);
    var bike         = getWeight('rhc-wf-bike', unit);
    var style        = document.getElementById('rhc-wf-style').value;
    var ridingStyle  = document.getElementById('rhc-wf-ridingstyle').value;
    var feel         = style === 'road' ? 'firm' : 'soft';

    if (!rider || !bike) return hideResults('wf');

    var totalLb    = rider + bike;
    var totalKg    = totalLb / LB_PER_KG;
    var mult       = WIDTH_FINDER_MULT[style];
    var idealWidth = Math.sqrt(totalKg * mult);

    // Snap to nearest RH width
    var best = RH_WIDTHS[0];
    var bestDiff = Math.abs(idealWidth - best);
    RH_WIDTHS.forEach(function(w) {
      var d = Math.abs(idealWidth - w);
      if (d < bestDiff) { bestDiff = d; best = w; }
    });
    if (best > 55) best = 55;

    var calcW   = RH_CALC_WIDTH[best];
    var psi     = calcPSI(totalLb, calcW, feel);
    var casing  = widthFinderCasing(style, ridingStyle, totalLb, rider);
    var tread   = WIDTH_FINDER_TREAD[style]  || WIDTH_FINDER_TREAD.road;

    state.wf.lastPsi = psi;
    state.wf.outUnit = unit;

    setWeightWarning('wf', rider, bike);
    document.getElementById('rhc-wf-out-width').innerHTML =
      RH_DISPLAY[best] + ' <span class="unit">mm</span>';
    document.getElementById('rhc-wf-out-casing').textContent = casing;
    document.getElementById('rhc-wf-out-tread').textContent  = tread;
    renderOutPressure('wf');

    document.getElementById('rhc-wf-result-note').style.display = 'none';

    document.getElementById('rhc-wf-result').classList.add('visible');
  };

  // ═══════════════════════════════════════════
  // INIT (DOM ready)
  // ═══════════════════════════════════════════
  function updatePositionOptions(bikeType) {
    var sel     = el('rhc-p-position');
    if (!sel) return;
    var allowed = BIKE_TYPE_POSITIONS[bikeType] || BIKE_TYPE_POSITIONS.road;
    var current = sel.value;
    sel.innerHTML = '';
    allowed.forEach(function(pos) {
      var opt = document.createElement('option');
      opt.value = pos;
      opt.textContent = POSITION_LABELS[pos];
      sel.appendChild(opt);
    });
    var fallback = BIKE_TYPE_DEFAULT_POSITION[bikeType] || 'intermediate';
    sel.value = allowed.indexOf(current) !== -1 ? current : fallback;
  }

  function buildWidthDropdown(id) {
    var sel = el(id);
    if (!sel) return;
    for (var w = 25; w <= 58; w++) {
      var opt = document.createElement('option');
      opt.value = w;
      opt.textContent = w + ' mm';
      sel.appendChild(opt);
    }
  }

  function onField(id, prefix, event) {
    var field = el(id);
    if (field) field.addEventListener(event || 'input', function() { liveCalc(prefix); });
  }

  document.addEventListener('DOMContentLoaded', function() {
    buildWidthDropdown('rhc-s-width');
    buildWidthDropdown('rhc-p-fw');
    buildWidthDropdown('rhc-p-rw');

    // Simple tab
    onField('rhc-s-width',      's', 'change');
    onField('rhc-s-rider',      's');
    onField('rhc-s-bike',       's');
    onField('rhc-s-rider-unit', 's', 'change');
    onField('rhc-s-bike-unit',  's', 'change');
    onField('rhc-s-terrain',    's', 'change');

    // Pro tab
    onField('rhc-p-fw',         'p', 'change');
    onField('rhc-p-rw',         'p', 'change');
    onField('rhc-p-fc',         'p', 'change');
    onField('rhc-p-rc',         'p', 'change');
    onField('rhc-p-rimw',       'p');
    onField('rhc-p-rimtype',    'p', 'change');
    var bikeTypeEl = el('rhc-p-biketype');
    if (bikeTypeEl) {
      updatePositionOptions(bikeTypeEl.value); // set initial options
      bikeTypeEl.addEventListener('change', function() { updatePositionOptions(this.value); });
    }
    onField('rhc-p-biketype',   'p', 'change'); // liveCalc fires after position is updated
    onField('rhc-p-framesize',  'p', 'change');
    onField('rhc-p-position',   'p', 'change');
    onField('rhc-p-terrain',    'p', 'change');
    onField('rhc-p-rider',      'p');
    onField('rhc-p-bike',       'p');
    onField('rhc-p-fp',         'p');
    onField('rhc-p-rp',         'p');
    onField('rhc-p-bp',         'p');
    onField('rhc-p-rider-unit', 'p', 'change');
    onField('rhc-p-bike-unit',  'p', 'change');
    onField('rhc-p-fp-unit',    'p', 'change');
    onField('rhc-p-rp-unit',    'p', 'change');
    onField('rhc-p-bp-unit',    'p', 'change');

    // Width finder tab
    onField('rhc-wf-style',        'wf', 'change');
    onField('rhc-wf-ridingstyle',  'wf', 'change');
    onField('rhc-wf-rider',      'wf');
    onField('rhc-wf-bike',       'wf');
    onField('rhc-wf-rider-unit', 'wf', 'change');
    onField('rhc-wf-bike-unit',  'wf', 'change');

    // Apply the locale-guessed unit, but only to tabs actually on this page —
    // the two shortcodes render different subsets.
    Object.keys(TAB_IDS)
      .filter(function(prefix) { return el(TAB_IDS[prefix]); })
      .forEach(function(prefix) { rhcTpcSetUnit(prefix, defaultUnit); });

    // Seed activeTab from whichever panel the shell marked active.
    var firstPanel = document.querySelector('.rhc-tpc .tab-panel.active');
    if (firstPanel) {
      state.activeTab = TAB_PREFIX[firstPanel.id.replace(/^rhc-tab-/, '')] || null;
    }
  });

}() );
