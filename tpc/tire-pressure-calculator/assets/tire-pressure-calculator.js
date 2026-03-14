/* Rene Herse Cycles — Tire Pressure Calculator */
( function () {
  'use strict';

  // ═══════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════

  // Spreadsheet equations: y = slope*x + intercept  (x = total weight in KG)
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
  var RH_WIDTHS      = [26, 28, 31, 35, 38, 43, 48, 55];
  var RH_CALC_WIDTH  = { 26:26, 28:28, 31:31, 35:35, 38:38, 43:43, 48:48, 55:55 };
  var RH_DISPLAY     = { 26:'26 mm', 28:'28 mm', 31:'31–32 mm', 35:'35 mm', 38:'38 mm', 43:'42–44 mm', 48:'48 mm', 55:'55 mm' };

  // Tire finder multipliers
  var FINDER_MULT = { road:12, allroad:18, gravel:25, adventure:36 };

  // Casing adjustments (psi)
  var CASING_ADJ = { '0':0, '-50':-50, '-150':-150, '-150b':-150, '-100':-100 };

  // Bike style front/rear ratios
  var BIKE_STYLE = {
    '40/60':  [0.40, 0.60],
    '40/60g': [0.40, 0.60],
    '38/62':  [0.38, 0.62],
    '35/65':  [0.35, 0.65],
  };

  // Riding position front/rear adjustments (percentage points)
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

  // Shared fields that appear on multiple tabs — synced on tab switch
  var SHARED_FIELDS = [
    { s: 'rhc-s-rider', p: 'rhc-p-rider', f: 'rhc-f-rider' },
    { s: 'rhc-s-bike',  p: 'rhc-p-bike',  f: 'rhc-f-bike'  },
  ];

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

  function calcPSI(weightLb, width, feel) {
    var eq = getEquation(width, feel);
    var weightKg = weightLb / LB_PER_KG;
    return eq[0] * weightKg + eq[1];
  }

  // ═══════════════════════════════════════════
  // UNIT HELPERS
  // ═══════════════════════════════════════════
  function fmtPressureVal(psi, unit) {
    if (unit === 'metric') {
      return { val: (psi * BAR_PER_PSI).toFixed(1), unit: 'bar' };
    }
    return { val: Math.round(psi), unit: 'psi' };
  }

  function wtLabel(noun, unit) {
    return unit === 'us' ? noun + ' Weight (lb)' : noun + ' Weight (kg)';
  }

  function getWeight(id, unit) {
    var v = parseFloat(document.getElementById(id).value) || 0;
    return unit === 'us' ? v : v * LB_PER_KG; // always return lb
  }

  // ═══════════════════════════════════════════
  // UI HELPERS
  // ═══════════════════════════════════════════
  function syncSharedFields(fromPrefix) {
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
    state.activeTab = name[0]; // 's', 'p', 'f'
    liveCalc(state.activeTab);
  };

  window.rhcTpcSetUnit = function(prefix, unit) {
    state[prefix].unit = unit;
    document.getElementById('rhc-' + prefix + '-unit-us').classList.toggle('active', unit === 'us');
    document.getElementById('rhc-' + prefix + '-unit-metric').classList.toggle('active', unit === 'metric');

    var maps = {
      s: [['rhc-s-rider-lbl','Rider'],['rhc-s-bike-lbl','Bike']],
      p: [['rhc-p-rider-lbl','Rider'],['rhc-p-bike-lbl','Bike'],['rhc-p-fp-lbl','Front Panniers'],['rhc-p-rp-lbl','Rear Panniers'],['rhc-p-bp-lbl','Bikepacking Load / Frame Bag']],
      f: [['rhc-f-rider-lbl','Rider'],['rhc-f-bike-lbl','Bike']],
    };
    (maps[prefix] || []).forEach(function(pair) {
      document.getElementById(pair[0]).textContent = wtLabel(pair[1], unit);
    });
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
    var pv      = fmtPressureVal(psi, 'us');
    var bv      = fmtPressureVal(psi, 'metric');

    setWeightWarning('s', rider, bike);
    document.getElementById('rhc-s-out-psi').innerHTML = pv.val + ' <span class="unit">psi</span>';
    document.getElementById('rhc-s-out-bar').innerHTML = bv.val + ' <span class="unit">bar</span>';
    document.getElementById('rhc-s-out-bar-row').style.display = 'flex';

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

    // 1. Total weight
    var totalLb = rider + bike + fp + rp + bp;

    // 2. Bike style base split
    var bsSplit = BIKE_STYLE[bsVal] || BIKE_STYLE['40/60'];
    var fRatio  = bsSplit[0];
    var rRatio  = bsSplit[1];

    // 3. Riding position adjustment
    var posAdj = POSITION_ADJ[posVal] || [0, 0];
    var fBaseRatio = fRatio + posAdj[0];
    var rBaseRatio = rRatio + posAdj[1];

    // 4. Front & rear load
    var bikeHalf = (bike + bp) * 0.5;
    var fLoad = rider * fBaseRatio + bikeHalf + fp;
    var rLoad = rider * rBaseRatio + bikeHalf + rp;

    // 5. Determine feel from terrain
    var feel = state.p.feel === 'dk' ? 'soft' : state.p.feel;
    var terrainMultF = 1, terrainMultR = 1;
    if (terrain === 'smooth-gravel' || terrain === 'mixed') {
      feel = 'soft';
    } else if (terrain === 'coarse-gravel') {
      feel = 'soft'; terrainMultF = terrainMultR = 0.95;
    } else if (terrain === 'rough-gravel') {
      feel = 'soft'; terrainMultF = terrainMultR = 1.05;
    }

    // 6. Base pressures
    // Equations are calibrated for total rider+bike weight (not per-wheel load).
    // Scale by how much each wheel's actual load deviates from the bike style baseline.
    var fPsi = calcPSI(totalLb, fw, feel) * (fLoad / (totalLb * fRatio)) * terrainMultF;
    var rPsi = calcPSI(totalLb, rw, feel) * (rLoad / (totalLb * rRatio)) * terrainMultR;

    // 7. Casing adjustments (psi / tire width)
    var fcAdj = (CASING_ADJ[fcVal] || 0) / fw;
    var rcAdj = (CASING_ADJ[rcVal] || 0) / rw;
    fPsi += fcAdj;
    rPsi += rcAdj;

    // 8. Rim width adjustment: each mm over 19 (up to 32) → −0.2%
    var rimAdj = Math.min(rimw, 32) - 19;
    if (rimAdj > 0) {
      fPsi *= (1 - rimAdj * 0.002);
      rPsi *= (1 - rimAdj * 0.002);
    }

    // 9. Hookless / tubeless caps
    var notes = [];
    var HOOKLESS_MAX = 72.5;
    var TUBELESS_MAX = 60;

    if (rimtype === 'hookless' || rimtype === 'dk') {
      [['f', fw], ['r', rw]].forEach(function(pair) {
        var side = pair[0], w = pair[1];
        var p = side === 'f' ? fPsi : rPsi;
        if (p > HOOKLESS_MAX) {
          var load  = side === 'f' ? fLoad : rLoad;
          var ratio = side === 'f' ? fRatio : rRatio;
          var mult  = side === 'f' ? terrainMultF : terrainMultR;
          var adj   = side === 'f' ? fcAdj : rcAdj;
          var softP = calcPSI(totalLb, w, 'soft') * (load / (totalLb * ratio)) * mult + adj;
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
      [['f', fw], ['r', rw]].forEach(function(pair) {
        var side = pair[0], w = pair[1];
        if (w > 31) {
          var p = side === 'f' ? fPsi : rPsi;
          if (p > TUBELESS_MAX) {
            var load  = side === 'f' ? fLoad : rLoad;
            var ratio = side === 'f' ? fRatio : rRatio;
            var mult  = side === 'f' ? terrainMultF : terrainMultR;
            var adj   = side === 'f' ? fcAdj : rcAdj;
            var softP = calcPSI(totalLb, w, 'soft') * (load / (totalLb * ratio)) * mult + adj;
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

    // 10. Front must be ≥ soft pressure for 50% of total weight
    var fMin = calcPSI(totalLb * 0.5, fw, 'soft');
    if (fPsi < fMin) {
      fPsi = fMin;
      notes.push('Front pressure raised to minimum safe level for braking performance.');
    }

    // 11. Rear must be ≥ front
    if (rPsi < fPsi) {
      rPsi = fPsi;
      notes.push('Rear pressure adjusted to match front (rear must be ≥ front).');
    }

    // 12. Format output
    setWeightWarning('p', rider, bike);
    var fv = fmtPressureVal(fPsi, 'us');
    var rv = fmtPressureVal(rPsi, 'us');
    var fb = fmtPressureVal(fPsi, 'metric');
    var rb = fmtPressureVal(rPsi, 'metric');

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

    var totalLb  = rider + bike;
    var totalKg  = totalLb / LB_PER_KG;
    var mult     = FINDER_MULT[style];
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
    document.getElementById('rhc-f-out-psi').innerHTML   = pv.val + ' <span class="unit">psi</span>';
    document.getElementById('rhc-f-out-bar').innerHTML   = bv.val + ' <span class="unit">bar</span>';
    document.getElementById('rhc-f-out-bar-row').style.display = 'flex';

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
    onField('rhc-s-width',  's', 'change');
    onField('rhc-s-rider',  's');
    onField('rhc-s-bike',   's');

    // Pro tab
    onField('rhc-p-fw',       'p', 'change');
    onField('rhc-p-rw',       'p', 'change');
    onField('rhc-p-fc',       'p', 'change');
    onField('rhc-p-rc',       'p', 'change');
    onField('rhc-p-rimw',     'p');
    onField('rhc-p-rimtype',  'p', 'change');
    onField('rhc-p-bikestyle','p', 'change');
    onField('rhc-p-position', 'p', 'change');
    onField('rhc-p-terrain',  'p', 'change');
    onField('rhc-p-rider',    'p');
    onField('rhc-p-bike',     'p');
    onField('rhc-p-fp',       'p');
    onField('rhc-p-rp',       'p');
    onField('rhc-p-bp',       'p');

    // Finder tab
    onField('rhc-f-style', 'f', 'change');
    onField('rhc-f-rider', 'f');
    onField('rhc-f-bike',  'f');
  });

}() );
