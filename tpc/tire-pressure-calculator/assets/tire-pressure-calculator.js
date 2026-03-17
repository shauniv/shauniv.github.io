/* Rene Herse Cycles — Tire Pressure Calculator */
( function () {
  'use strict';

  // ═══════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════

  // Spreadsheet equations: y = slope*x + intercept  (x = wheel load in KG)
  // Keyed by nominal width → { firm: [slope, intercept], soft: [slope, intercept] }
  var EQUATIONS = {
    28: { firm: [0.8105, 6.0956], soft: [0.6762, 2.5409] },
    35: { firm: [0.5846, 8.0286], soft: [0.4582, 4.4979] },
    38: { firm: [0.4683, 4.5270], soft: [0.3814, 5.6948] },
    44: { firm: [0.4167, 6.0000], soft: [0.3333, 7.0000] },
    48: { firm: [0.3750, 7.0000], soft: [0.2778, 8.6667] },
  };

  var ANCHOR_WIDTHS = [28, 35, 38, 44, 48];

  // Rene Herse available widths (for tire finder output snapping)
  var RH_WIDTHS     = [26, 28, 31, 35, 38, 43, 48, 55];
  var RH_CALC_WIDTH = { 26:26, 28:28, 31:31, 35:35, 38:38, 43:43, 48:48, 55:55 };
  var RH_DISPLAY    = { 26:'26 mm', 28:'28 mm', 31:'31–32 mm', 35:'35 mm', 38:'38 mm', 43:'42–44 mm', 48:'48 mm', 55:'55 mm' };

  // Tire finder multipliers
  var FINDER_MULT = { road:12, allroad:18, gravel:25, adventure:36 };

  // Casing adjustments (psi numerator; divided by tire width)
  var CASING_ADJ = { '0':0, '-50':-50, '-150':-150, '-150b':-150, '-100':-100 };

  // Bike style front/rear weight ratios
  var BIKE_STYLE = {
    '40/60':  [0.40, 0.60],
    '40/60g': [0.40, 0.60],
    '38/62':  [0.38, 0.62],
    '35/65':  [0.35, 0.65],
  };

  // Riding position: fraction of total weight shifted front/rear
  var POSITION_ADJ = {
    aero:         [ 0.03, -0.03],
    low:          [ 0,     0   ],
    intermediate: [-0.04,  0.04],
    upright:      [-0.08,  0.08],
  };

  var LB_PER_KG   = 2.20462;
  var BAR_PER_PSI = 0.0689476;

  var MIN_COMBINED_KG = 40;
  var MAX_COMBINED_KG = 200;

  // ═══════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════
  var state = {
    activeTab: 's',
    s: { unit:'us', feel:'soft' },
    p: { unit:'us', feel:'soft', tube:'tubes' },
    f: { unit:'us', feel:'soft' },
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
    if (width <= 28) return EQUATIONS[28][feel];
    if (width >= 48) return EQUATIONS[48][feel];

    var lower = 28, upper = 35;
    for (var i = 0; i < ANCHOR_WIDTHS.length - 1; i++) {
      if (width >= ANCHOR_WIDTHS[i] && width <= ANCHOR_WIDTHS[i+1]) {
        lower = ANCHOR_WIDTHS[i];
        upper = ANCHOR_WIDTHS[i+1];
        break;
      }
    }
    if (lower === upper) return EQUATIONS[lower][feel];

    var t  = (width - lower) / (upper - lower);
    var ls = EQUATIONS[lower][feel][0], li = EQUATIONS[lower][feel][1];
    var us = EQUATIONS[upper][feel][0], ui = EQUATIONS[upper][feel][1];
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

  // Simple / Finder rounding: nearest 1 psi or 0.1 bar
  function fmtPressureVal(psi, unit) {
    if (unit === 'metric') {
      return { val: (psi * BAR_PER_PSI).toFixed(1), unit: 'bar' };
    }
    return { val: Math.round(psi), unit: 'psi' };
  }

  // Pro rounding: 0.1 psi or 0.01 bar (spec §3 / §5.9)
  function fmtProPressure(psi, unit) {
    if (unit === 'metric') {
      return { val: (psi * BAR_PER_PSI).toFixed(2), unit: 'bar' };
    }
    return { val: psi.toFixed(1), unit: 'psi' };
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
      var val = document.getElementById(map[fromPrefix]).value;
      Object.keys(map).forEach(function(prefix) {
        if (prefix !== fromPrefix) document.getElementById(map[prefix]).value = val;
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
    var kgStr = totalKg.toFixed(1) + ' kg / ' + Math.round(totalLb) + ' lb';
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

  window.rhcTpcSetUnit = function(prefix, unit) {
    state[prefix].unit = unit;
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

    setWeightWarning('s', rider, bike);

    var pv = fmtPressureVal(psi, 'us');
    var bv = fmtPressureVal(psi, 'metric');
    document.getElementById('rhc-s-out-psi').innerHTML =
      pv.val + ' <span class="unit">psi</span> / ' + bv.val + ' <span class="unit">bar</span>';

    var note = state.s.feel === 'dk'
      ? 'Using Soft values since preferred feel was set to "Don\'t Know".'
      : 'Using ' + feel.charAt(0).toUpperCase() + feel.slice(1) + ' values for a ' + width + ' mm tire at ' + Math.round(totalLb) + ' lb / ' + (totalLb / LB_PER_KG).toFixed(1) + ' kg total.';
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
    var bsVal   = document.getElementById('rhc-p-bikestyle').value;
    var posVal  = document.getElementById('rhc-p-position').value;

    if (!fw || !rw || !rider || !bike) return hideResults('p');

    // 1. Bike style base split
    var bsSplit = BIKE_STYLE[bsVal] || BIKE_STYLE['40/60'];
    var fRatio  = bsSplit[0];
    var rRatio  = bsSplit[1];

    // 2. Riding position adjustment
    var posAdj = POSITION_ADJ[posVal] || [0, 0];

    // 3. Per-wheel loads (spec §5.2–5.3)
    // splitTotal = rider + bike + bikepacking (panniers added directly to their wheel)
    var splitTotalLb = rider + bike + bp;
    var fLoad = splitTotalLb * (fRatio + posAdj[0]) + fp;
    var rLoad = splitTotalLb * (rRatio + posAdj[1]) + rp;
    // totalLb includes everything — used as the equation input (equations calibrated
    // for total system weight, same as Simple) and for scaling each wheel's pressure
    var totalLb = rider + bike + fp + rp + bp;

    // 4. Terrain: override feel and set multiplier
    var feel = state.p.feel === 'dk' ? 'soft' : state.p.feel;
    var terrainMult = 1;
    if (terrain === 'smooth-gravel' || terrain === 'mixed') {
      feel = 'soft';
    } else if (terrain === 'coarse-gravel') {
      feel = 'soft'; terrainMult = 0.95;
    } else if (terrain === 'rough-gravel') {
      feel = 'soft'; terrainMult = 1.05;
    }

    // 5. Rim width multiplier (spec §5.6)
    var rimAdj = Math.min(rimw, 32) - 19;
    var rimMult = rimAdj > 0 ? (1 - rimAdj * 0.002) : 1;

    // 6. Casing adjustments (psi / tire width, spec §5.5)
    var fcAdj = (CASING_ADJ[fcVal] || 0) / fw;
    var rcAdj = (CASING_ADJ[rcVal] || 0) / rw;

    // Full pressure pipeline: base → scale by load ratio → terrain → casing → rim
    // Simple is calibrated for a road bike (40/60 front/rear). Pro anchors to that
    // baseline so road + neutral + no panniers = Simple exactly. Other bike styles and
    // position adjustments produce small, proportionate deviations:
    //   scalingFactor = (wheelLoad / totalLb) + (1 − roadBaseline)
    // e.g. road+aero front: 0.43 + 0.60 = 1.03 → +3%; road+upright: 0.32+0.60 = 0.92 → −8%
    var ROAD_FRONT = 0.40, ROAD_REAR = 0.60;
    function pipePSI(loadLb, complementFraction, width, f, casingAdj) {
      var scale = loadLb / totalLb + complementFraction;
      var base  = calcPSI(totalLb, width, f) * scale * terrainMult;
      return (base + casingAdj) * rimMult;
    }

    // 7. Compute base pressures
    var fPsi = pipePSI(fLoad, ROAD_REAR, fw, feel, fcAdj);
    var rPsi = pipePSI(rLoad, ROAD_FRONT, rw, feel, rcAdj);

    // 8. Hookless / tubeless caps (spec §5.7–5.8)
    var notes = [];
    var HOOKLESS_MAX = 72.5;
    var TUBELESS_MAX = 60;

    if (rimtype === 'hookless' || rimtype === 'dk') {
      [['f', fw, fLoad, ROAD_REAR, fcAdj], ['r', rw, rLoad, ROAD_FRONT, rcAdj]].forEach(function(entry) {
        var side = entry[0], w = entry[1], load = entry[2], comp = entry[3], adj = entry[4];
        var p = side === 'f' ? fPsi : rPsi;
        if (p > HOOKLESS_MAX) {
          var softP = pipePSI(load, comp, w, 'soft', adj);
          if (softP > HOOKLESS_MAX) {
            notes.push('⚠️ Your ' + (side==='f'?'front':'rear') + ' tire/rim combination requires pressure that exceeds the 5 bar / 72.5 psi ETRTO limit for hookless rims.');
            if (side === 'f') fPsi = HOOKLESS_MAX; else rPsi = HOOKLESS_MAX;
          } else {
            notes.push((side==='f'?'Front':'Rear') + ': Switched to Soft values to stay within hookless rim limit (72.5 psi).');
            if (side === 'f') fPsi = softP; else rPsi = softP;
          }
        }
      });
    }

    if (tube === 'tubeless') {
      [['f', fw, fLoad, ROAD_REAR, fcAdj], ['r', rw, rLoad, ROAD_FRONT, rcAdj]].forEach(function(entry) {
        var side = entry[0], w = entry[1], load = entry[2], comp = entry[3], adj = entry[4];
        if (w > 31) {
          var p = side === 'f' ? fPsi : rPsi;
          if (p > TUBELESS_MAX) {
            var softP = pipePSI(load, comp, w, 'soft', adj);
            if (softP > TUBELESS_MAX) {
              notes.push('⚠️ Your ' + (side==='f'?'front':'rear') + ' tire/rim combination requires a pressure that exceeds the 60 psi / 4.1 bar limit for Rene Herse tubeless tires (>31 mm). We suggest using tubes instead or switching to wider tires.');
              if (side === 'f') fPsi = TUBELESS_MAX; else rPsi = TUBELESS_MAX;
            } else {
              notes.push((side==='f'?'Front':'Rear') + ': Switched to Soft values to stay within tubeless limit (60 psi) for ' + w + ' mm tire.');
              if (side === 'f') fPsi = softP; else rPsi = softP;
            }
          }
        }
      });
    }

    // 9. Front minimum: Soft pressure for 50% of total system weight (spec §5.9)
    var fMin = calcPSI(totalLb * 0.5, fw, 'soft');
    if (fPsi < fMin) {
      fPsi = fMin;
      notes.push('Front pressure raised to minimum safe level for braking performance.');
    }

    // 10. Rear ≥ front
    if (rPsi < fPsi) {
      rPsi = fPsi;
      notes.push('Rear pressure adjusted to match front (rear must be ≥ front).');
    }

    // 11. Format output — Pro: 0.1 psi / 0.01 bar (spec §5.9)
    setWeightWarning('p', rider, bike);
    var fv = fmtProPressure(fPsi, 'us');
    var rv = fmtProPressure(rPsi, 'us');
    var fb = fmtProPressure(fPsi, 'metric');
    var rb = fmtProPressure(rPsi, 'metric');

    document.getElementById('rhc-p-out-f').innerHTML =
      fv.val + ' <span class="unit">psi</span> / ' + fb.val + ' <span class="unit">bar</span>';
    document.getElementById('rhc-p-out-r').innerHTML =
      rv.val + ' <span class="unit">psi</span> / ' + rb.val + ' <span class="unit">bar</span>';

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
    var unit  = state.f.unit;
    var rider = getWeight('rhc-f-rider', unit);
    var bike  = getWeight('rhc-f-bike', unit);
    var style = document.getElementById('rhc-f-style').value;
    var feel  = state.f.feel === 'dk' ? 'soft' : state.f.feel;

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

    var calcW = RH_CALC_WIDTH[best];
    var psi   = calcPSI(totalLb, calcW, feel);
    var pv    = fmtPressureVal(psi, 'us');
    var bv    = fmtPressureVal(psi, 'metric');

    setWeightWarning('f', rider, bike);
    document.getElementById('rhc-f-out-width').innerHTML = RH_DISPLAY[best];
    document.getElementById('rhc-f-out-psi').innerHTML =
      pv.val + ' <span class="unit">psi</span> / ' + bv.val + ' <span class="unit">bar</span>';

    var note = 'Ideal width calculated: ' + idealWidth.toFixed(1) + ' mm → rounded to ' + RH_DISPLAY[best] + '. Pressure based on ' + feel + ' values at ' + Math.round(totalLb) + ' lb / ' + totalKg.toFixed(1) + ' kg total.';
    var noteEl = document.getElementById('rhc-f-result-note');
    noteEl.textContent = note;
    noteEl.style.display = 'block';

    document.getElementById('rhc-f-result').classList.add('visible');
  };

  // ═══════════════════════════════════════════
  // INIT (DOM ready)
  // ═══════════════════════════════════════════
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
    onField('rhc-p-bikestyle',  'p', 'change');
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
    onField('rhc-f-style',      'f', 'change');
    onField('rhc-f-rider',      'f');
    onField('rhc-f-bike',       'f');
    onField('rhc-f-rider-unit', 'f', 'change');
    onField('rhc-f-bike-unit',  'f', 'change');
  });

}() );
