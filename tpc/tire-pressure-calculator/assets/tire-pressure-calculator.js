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
  };
  var ANCHOR_WIDTHS = [25, 28, 32, 35, 38, 42, 48, 55];

  // Rene Herse available widths (for tire finder output snapping)
  var RH_WIDTHS     = [26, 28, 31, 35, 38, 43, 48, 55];
  var RH_CALC_WIDTH = { 26:26, 28:28, 31:31, 35:35, 38:38, 43:43, 48:48, 55:55 };
  var RH_DISPLAY    = { 26:'26', 28:'28', 31:'31–32', 35:'35', 38:'38', 43:'42–44', 48:'48', 55:'55' };

  // Tire finder multipliers
  var FINDER_MULT = { road:12, allroad:18, gravel:25, adventure:36 };

  // Tire finder tread recommendations (keyed by style)
  var FINDER_TREAD = {
    road:      'Smooth All-Road',
    allroad:   'Smooth All-Road',
    gravel:    'Semi-Slick or Dual-Purpose Knobby',
    adventure: 'Dual-Purpose Knobby',
  };

  // Tire finder casing recommendations (keyed by riding style)
  var FINDER_CASING = {
    smooth:           'Extralight or Standard',
    endurance:        'Endurance',
    'endurance-plus': 'Endurance Plus',
  };

  // Casing adjustments (psi numerator; divided by tire width)
  var CASING_ADJ = { '0':0, '-50':-50, '-150':-150, '-150b':-150, '-100':-100 };

  // Bike type adjustments (front/rear % applied to base pressure)
  var BIKE_TYPE_ADJ = {
    road:    { f: -3, r:  3 },
    gravel:  { f: -4, r:  4 },
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
    road:    ['aero', 'low', 'intermediate', 'upright'],
    gravel:  ['aero', 'low', 'intermediate', 'upright'],
    rando:   ['aero', 'low', 'intermediate', 'upright'],
    touring: ['low', 'intermediate', 'upright'],
    country: ['intermediate', 'upright'],
    city:    ['intermediate', 'upright'],
  };

  // Default position when switching to a bike type that makes the current selection invalid
  var BIKE_TYPE_DEFAULT_POSITION = {
    road: 'intermediate', gravel: 'intermediate', rando: 'intermediate',
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
    activeTab: 's',
    s: { unit: defaultUnit, feel:'soft',              outUnit: defaultUnit, lastPsi: null },
    p: { unit: defaultUnit, feel:'soft', tube:'tubes', outUnit: defaultUnit, lastFPsi: null, lastRPsi: null },
    f: { unit: defaultUnit, feel:'soft',              outUnit: defaultUnit, lastPsi: null },
  };

  // Shared fields synced on tab switch
  var SHARED_FIELDS = [
    { s: 'rhc-s-rider', p: 'rhc-p-rider', f: 'rhc-f-rider' },
    { s: 'rhc-s-bike',  p: 'rhc-p-bike',  f: 'rhc-f-bike'  },
  ];

  var TAB_IDS = { s: 'rhc-tab-simple', p: 'rhc-tab-pro', f: 'rhc-tab-finder' };

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

  // Simple / Finder rounding: nearest 1 psi or 0.1 bar
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
    var v = parseFloat(document.getElementById(id).value) || 0;
    var unitEl = document.getElementById(id + '-unit');
    var unit = unitEl ? unitEl.value : fallbackUnit;
    return unit === 'us' ? v : v * LB_PER_KG; // always return lb
  }

  // ═══════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════
  function syncSharedFields(fromPrefix) {
    if (fromPrefix === 'b') return; // background tab has no shared fields
    SHARED_FIELDS.forEach(function(map) {
      var srcId  = map[fromPrefix];
      var val    = document.getElementById(srcId).value;
      var unitEl = document.getElementById(srcId + '-unit');
      var unit   = unitEl ? unitEl.value : null;
      Object.keys(map).forEach(function(prefix) {
        if (prefix !== fromPrefix) {
          document.getElementById(map[prefix]).value = val;
          if (unit !== null) {
            var destUnit = document.getElementById(map[prefix] + '-unit');
            if (destUnit) destUnit.value = unit;
          }
        }
      });
    });

    // Tire width — simple ↔ pro only (finder has no width field)
    if (fromPrefix === 's') {
      var w = document.getElementById('rhc-s-width').value;
      document.getElementById('rhc-p-fw').value = w;
      document.getElementById('rhc-p-rw').value = w;
    } else if (fromPrefix === 'p') {
      var w = document.getElementById('rhc-p-rw').value || document.getElementById('rhc-p-fw').value;
      document.getElementById('rhc-s-width').value = w;
    }
  }

  function setWeightWarning(prefix, riderLb, bikeLb) {
    var el = document.getElementById('rhc-' + prefix + '-weight-warning');
    var card = document.getElementById('rhc-' + prefix + '-result');
    if (!el || !card) return;
    var totalLb = riderLb + bikeLb;
    var totalKg = totalLb / LB_PER_KG;
    var kgStr = fmtNum(totalKg, 1) + ' kg / ' + fmtNum(Math.round(totalLb), 0) + ' lb';
    if (totalKg < MIN_COMBINED_KG) {
      el.textContent = 'Combined rider and bike weight (' + kgStr + ') is below the minimum of ' + MIN_COMBINED_KG + ' kg / ' + Math.round(MIN_COMBINED_KG * LB_PER_KG) + ' lb. We have no data for this weight range.';
      el.style.display = 'block';
      card.classList.add('out-of-range');
    } else if (totalKg > MAX_COMBINED_KG) {
      el.textContent = 'Combined rider and bike weight (' + kgStr + ') is above the maximum of ' + MAX_COMBINED_KG + ' kg / ' + Math.round(MAX_COMBINED_KG * LB_PER_KG) + ' lb. We have no data for this weight range.';
      el.style.display = 'block';
      card.classList.add('out-of-range');
    } else {
      el.style.display = 'none';
      card.classList.remove('out-of-range');
    }
  }

  function hideResults(prefix) {
    document.getElementById('rhc-' + prefix + '-error').classList.remove('visible');
    document.getElementById('rhc-' + prefix + '-result').classList.remove('visible');
  }

  function liveCalc(prefix) {
    if (prefix === 's') window.rhcTpcCalcSimple();
    else if (prefix === 'p') window.rhcTpcCalcPro();
    else if (prefix === 'f') window.rhcTpcCalcFinder();
    // 'b' (background tab) has no calculation
  }

  function showError(prefix, msg) {
    var el = document.getElementById('rhc-' + prefix + '-error');
    el.textContent = msg;
    el.classList.add('visible');
    document.getElementById('rhc-' + prefix + '-result').classList.remove('visible');
  }

  function clearError(prefix) {
    document.getElementById('rhc-' + prefix + '-error').classList.remove('visible');
  }

  // ═══════════════════════════════════════════
  // PUBLIC API (called from onclick attributes)
  // ═══════════════════════════════════════════
  window.rhcTpcSwitchTab = function(name, btn) {
    syncSharedFields(state.activeTab);
    document.querySelectorAll('.rhc-tpc .tab-panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.rhc-tpc .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('rhc-tab-' + name).classList.add('active');
    btn.classList.add('active');
    state.activeTab = name[0]; // 's', 'p', 'f', 'b'
    liveCalc(state.activeTab);
  };

  function renderOutPressure(prefix) {
    var u = state[prefix].outUnit;
    var usBtn     = document.getElementById('rhc-' + prefix + '-out-unit-us');
    var metricBtn = document.getElementById('rhc-' + prefix + '-out-unit-metric');
    if (usBtn)     usBtn.classList.toggle('active',     u === 'us');
    if (metricBtn) metricBtn.classList.toggle('active', u === 'metric');

    if (prefix === 's') {
      var pv = fmtPressureVal(state.s.lastPsi, u);
      document.getElementById('rhc-s-out-psi').innerHTML =
        pv.val + ' <span class="unit">' + pv.unit + '</span>';
    } else if (prefix === 'p') {
      document.getElementById('rhc-p-out-f').innerHTML = state.p.lastFPsi === null
        ? 'N/A'
        : (function(){ var v = fmtProPressure(state.p.lastFPsi, u); return v.val + ' <span class="unit">' + v.unit + '</span>'; }());
      document.getElementById('rhc-p-out-r').innerHTML = state.p.lastRPsi === null
        ? 'N/A'
        : (function(){ var v = fmtProPressure(state.p.lastRPsi, u); return v.val + ' <span class="unit">' + v.unit + '</span>'; }());
    } else if (prefix === 'f') {
      var pv = fmtPressureVal(state.f.lastPsi, u);
      document.getElementById('rhc-f-out-psi').innerHTML =
        pv.val + ' <span class="unit">' + pv.unit + '</span>';
    }
  }

  window.rhcTpcSetOutUnit = function(prefix, unit) {
    state[prefix].outUnit = unit;
    renderOutPressure(prefix);
  };

  window.rhcTpcSetUnit = function(prefix, unit) {
    state[prefix].unit = unit;
    state[prefix].outUnit = unit; // reset output unit to follow the new tab unit
    document.getElementById('rhc-' + prefix + '-unit-us').classList.toggle('active', unit === 'us');
    document.getElementById('rhc-' + prefix + '-unit-metric').classList.toggle('active', unit === 'metric');
    // Sync all per-field unit selects on this tab (convenience — user can override individually)
    var tabEl = document.getElementById(TAB_IDS[prefix]);
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
    state[prefix].feel = feel;
    ['soft','firm','dk'].forEach(function(f) {
      var el = document.getElementById('rhc-' + prefix + '-feel-' + f);
      if (el) el.classList.toggle('active', f === feel);
    });
    liveCalc(prefix);
  };

  window.rhcTpcSetTube = function(type) {
    state.p.tube = type;
    document.getElementById('rhc-p-tube-tubes').classList.toggle('active', type === 'tubes');
    document.getElementById('rhc-p-tube-tubeless').classList.toggle('active', type === 'tubeless');
    liveCalc('p');
  };

  // ═══════════════════════════════════════════
  // SIMPLE CALCULATOR
  // ═══════════════════════════════════════════
  window.rhcTpcCalcSimple = function() {
    clearError('s');
    var unit  = state.s.unit;
    var width = parseInt(document.getElementById('rhc-s-width').value);
    var rider = getWeight('rhc-s-rider', unit);
    var bike  = getWeight('rhc-s-bike', unit);
    var feel  = state.s.feel === 'dk' ? 'soft' : state.s.feel;

    if (!width || !rider || !bike) return hideResults('s');

    var totalLb = rider + bike;
    var psi     = calcPSI(totalLb, width, feel);

    state.s.lastPsi = psi;
    state.s.outUnit = unit;

    setWeightWarning('s', rider, bike);
    renderOutPressure('s');

    var note = state.s.feel === 'dk'
      ? 'Using Soft values since preferred feel was set to "Don\'t Know".'
      : 'Using ' + feel.charAt(0).toUpperCase() + feel.slice(1) + ' values for a ' + width + ' mm tire at ' + fmtNum(Math.round(totalLb), 0) + ' lb / ' + fmtNum(totalLb / LB_PER_KG, 1) + ' kg total.';
    document.getElementById('rhc-s-result-note').textContent = note;

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
  // TIRE FINDER
  // ═══════════════════════════════════════════
  window.rhcTpcCalcFinder = function() {
    clearError('f');
    var unit         = state.f.unit;
    var rider        = getWeight('rhc-f-rider', unit);
    var bike         = getWeight('rhc-f-bike', unit);
    var style        = document.getElementById('rhc-f-style').value;
    var ridingStyle  = document.getElementById('rhc-f-ridingstyle').value;
    var feel         = state.f.feel === 'dk' ? 'soft' : state.f.feel;

    if (!rider || !bike) return hideResults('f');

    var totalLb    = rider + bike;
    var totalKg    = totalLb / LB_PER_KG;
    var mult       = FINDER_MULT[style];
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
    var casing  = FINDER_CASING[ridingStyle] || FINDER_CASING.smooth;
    var tread   = FINDER_TREAD[style]        || FINDER_TREAD.road;

    state.f.lastPsi = psi;
    state.f.outUnit = unit;

    setWeightWarning('f', rider, bike);
    document.getElementById('rhc-f-out-width').innerHTML =
      RH_DISPLAY[best] + ' <span class="unit">mm</span>';
    document.getElementById('rhc-f-out-casing').textContent = casing;
    document.getElementById('rhc-f-out-tread').textContent  = tread;
    renderOutPressure('f');

    var note = 'Ideal width calculated: ' + fmtNum(idealWidth, 1) + ' mm → rounded to ' + RH_DISPLAY[best] + ' mm. Pressure based on ' + feel + ' values at ' + fmtNum(Math.round(totalLb), 0) + ' lb / ' + fmtNum(totalKg, 1) + ' kg total.';
    var noteEl = document.getElementById('rhc-f-result-note');
    noteEl.textContent = note;
    noteEl.style.display = 'block';

    document.getElementById('rhc-f-result').classList.add('visible');
  };

  // ═══════════════════════════════════════════
  // INIT (DOM ready)
  // ═══════════════════════════════════════════
  function updatePositionOptions(bikeType) {
    var sel     = document.getElementById('rhc-p-position');
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
    var sel = document.getElementById(id);
    if (!sel) return;
    for (var w = 25; w <= 55; w++) {
      var opt = document.createElement('option');
      opt.value = w;
      opt.textContent = w + ' mm';
      sel.appendChild(opt);
    }
  }

  function onField(id, prefix, event) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(event || 'input', function() { liveCalc(prefix); });
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

    // Pro tab
    onField('rhc-p-fw',         'p', 'change');
    onField('rhc-p-rw',         'p', 'change');
    onField('rhc-p-fc',         'p', 'change');
    onField('rhc-p-rc',         'p', 'change');
    onField('rhc-p-rimw',       'p');
    onField('rhc-p-rimtype',    'p', 'change');
    var bikeTypeEl = document.getElementById('rhc-p-biketype');
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

    // Finder tab
    onField('rhc-f-style',        'f', 'change');
    onField('rhc-f-ridingstyle',  'f', 'change');
    onField('rhc-f-rider',      'f');
    onField('rhc-f-bike',       'f');
    onField('rhc-f-rider-unit', 'f', 'change');
    onField('rhc-f-bike-unit',  'f', 'change');

    // Apply locale-guessed unit to all tabs (syncs toggle buttons + per-field selects)
    ['s', 'p', 'f'].forEach(function(prefix) { rhcTpcSetUnit(prefix, defaultUnit); });
  });

}() );
