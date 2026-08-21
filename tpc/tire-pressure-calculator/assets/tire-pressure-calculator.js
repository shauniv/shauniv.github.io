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
    // Two candidates, spanning where the tire finder's tread scale can land an
    // All-Road bike once the gravel answer is applied. This tab has no gravel
    // question, so it shows the pair rather than picking one. Both tabs can sit
    // on one page, so they must not contradict each other.
    allroad:   'Smooth All-Road or Semi-Slick',
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

  // ── Tire finder catalog ─────────────────────────────────────────────────────
  // ── BEGIN GENERATED CATALOG — do not edit by hand ──────────────────────
  // Generated from Tire Catalog.xlsx by tools/build-catalog.mjs. Jan maintains
  // the spreadsheet; run `node tools/build-catalog.mjs` after he sends a new one.
  //
  // One row per tire per tread pattern. `baseline` is the measured width on the
  // design rim, tubed, in a casing other than Extralight — every width the
  // finder shows is derived from it, see tireActualWidth().
  //
  // 26 tires across 3 wheel sizes: 26", 650B, 700C / 29"
  var TIRE_CATALOG = [
    { size:'26"',        model:'Elk Pass',         nominal:'1.25"', nominal2:'30 mm',
      designRim:20, baseline:29,
      tread:'Smooth All-Road',     casings:['Extralight'],
      tubeless:false,  inProduction:true,   priority:1 },
    { size:'26"',        model:'Naches Pass',      nominal:'1.8"',  nominal2:'42 mm',
      designRim:20, baseline:41,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'26"',        model:'Rat Trap Pass',    nominal:'2.3"',  nominal2:'54 mm',
      designRim:20, baseline:52,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'26"',        model:'Humptulips Ridge', nominal:'2.3"',  nominal2:'54 mm',
      designRim:20, baseline:52,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'650B',       model:'Loup Loup Pass',   nominal:'38 mm', nominal2:'',
      designRim:20, baseline:37,
      tread:'Smooth All-Road',     casings:['Extralight'],
      tubeless:false,  inProduction:true,   priority:1 },
    { size:'650B',       model:'Babyshoe Pass',    nominal:'42 mm', nominal2:'',
      designRim:20, baseline:40,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'650B',       model:'Switchback Hill',  nominal:'48 mm', nominal2:'',
      designRim:20, baseline:50,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'650B',       model:'Pumpkin Ridge',    nominal:'42 mm', nominal2:'',
      designRim:20, baseline:40,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'650B',       model:'Juniper Ridge',    nominal:'48 mm', nominal2:'',
      designRim:20, baseline:49,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'650B',       model:'Umtanum Ridge',    nominal:'2.3"',  nominal2:'54 mm',
      designRim:21, baseline:53,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Cayuse Pass',      nominal:'26 mm', nominal2:'',
      designRim:20, baseline:25.5,
      tread:'Smooth All-Road',     casings:['Extralight','Standard'],
      tubeless:false,  inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Chinook Pass',     nominal:'28 mm', nominal2:'',
      designRim:20, baseline:28,
      tread:'Smooth All-Road',     casings:['Extralight','Standard'],
      tubeless:false,  inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Stampede Pass',    nominal:'32 mm', nominal2:'',
      designRim:20, baseline:31,
      tread:'Smooth All-Road',     casings:['Extralight','Standard'],
      tubeless:false,  inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Orondo Grade',     nominal:'31 mm', nominal2:'',
      designRim:20, baseline:31,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Bon Jon Pass',     nominal:'35 mm', nominal2:'',
      designRim:20, baseline:35,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Barlow Pass',      nominal:'38 mm', nominal2:'',
      designRim:20, baseline:38,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Snoqualmie Pass',  nominal:'44 mm', nominal2:'',
      designRim:20, baseline:42,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Hatcher Pass',     nominal:'48 mm', nominal2:'',
      designRim:21, baseline:47,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Antelope Hill',    nominal:'55 mm', nominal2:'29" x 2.2"',
      designRim:20, baseline:54,
      tread:'Smooth All-Road',     casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Steilacoom',       nominal:'38 mm', nominal2:'',
      designRim:20, baseline:36,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Hurricane Ridge',  nominal:'42 mm', nominal2:'',
      designRim:20, baseline:42,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:false,  priority:1 },
    { size:'700C / 29"', model:'Manastash Ridge',  nominal:'44 mm', nominal2:'',
      designRim:20, baseline:43,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Oracle Ridge',     nominal:'48 mm', nominal2:'',
      designRim:21, baseline:47,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Fleecer Ridge',    nominal:'55 mm', nominal2:'29" x 2.2"',
      designRim:21, baseline:56,
      tread:'Dual-Purpose Knobby', casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Corkscrew Climb',  nominal:'44 mm', nominal2:'',
      designRim:20, baseline:43,
      tread:'Semi-Slick',          casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
    { size:'700C / 29"', model:'Poteau Mountain',  nominal:'48 mm', nominal2:'',
      designRim:21, baseline:47,
      tread:'Semi-Slick',          casings:['Extralight','Standard','Endurance','Endurance Plus'],
      tubeless:true,   inProduction:true,   priority:1 },
  ];
  // ── END GENERATED CATALOG ────────────────────────────────────────────

  // Wheel sizes actually present in the catalog, in catalog order.
  var TIRE_SIZES = TIRE_CATALOG.reduce(function(acc, t) {
    if (acc.indexOf(t.size) === -1) acc.push(t.size);
    return acc;
  }, []);

  // Width factors, per Jan's 14 Aug note. Multiplicative, not additive:
  // an Extralight tire set up tubeless is baseline × 1.03 × 1.01.
  var TF_EXTRALIGHT_FACTOR = 1.03;
  var TF_TUBELESS_FACTOR   = 1.01;

  // A wider rim spreads the tire: 0.3 mm of extra width per millimeter of rim
  // over the one the tire was designed around (Jan, 14 Aug; asked for again on
  // 20 Aug). A narrower rim does NOT make the tire narrower than its baseline,
  // so only rim width above the design figure counts.
  //
  // Per-tire rim limits are deliberately NOT catalog data (Q22): they move as new
  // rims reach the market, so the tab points riders at the product page instead.
  var TF_RIM_PER_MM = 0.3;

  // Internal rim widths live in this range. A number outside it is a mistake --
  // usually the rim's outer width, or a slip -- and quietly believing it would
  // hand the rider a confidently wrong tire and pressure.
  var TF_RIM_MIN = 10;
  var TF_RIM_MAX = 45;

  // Casings, soft → tough. Only Extralight changes the measured width.
  var TF_CASING_ORDER = ['Extralight', 'Standard', 'Endurance', 'Endurance Plus'];

  // Treads, smooth → knobby.
  var TF_TREAD_ORDER = ['Smooth All-Road', 'Semi-Slick', 'Dual-Purpose Knobby'];

  // Q27: width still leads, but a tire carrying the tread the rider asked for
  // beats a marginally closer width. Jan set the band at 2.5 mm (20 Aug). Inside
  // it the two tires are closer together than individual tires of the same model
  // vary, so the tread is the more meaningful signal; outside it they really are
  // different sizes and the width the rider typed should win.
  var TF_TREAD_TOLERANCE = 2.5;

  // Q5/Q17: how far the recommended tire has to be from the requested width before
  // we tell the rider the size moved. Below this, the difference comes from the
  // casing and tubeless factors rather than from a different tire, and saying
  // "you asked for 42 mm, this is 43 mm" about the 42 mm tire reads as a fault.
  // Confirmed by Jan on 18 Aug: below 1.5 mm is inside the variation between
  // individual tires anyway. His "On your rims, ..." idea waits for rim input.
  var TF_WIDTH_NOTE_THRESHOLD = 1.5;

  // Bike × how often the rider rides gravel → tread. A table rather than a
  // formula: Jan's 21 Aug correction — a Gravel bike ridden on gravel "often"
  // wants a semi-slick, because that is what gravel racers choose — does not
  // fall out of any arithmetic, and dressing it up as one would make the next
  // correction harder instead of easier.
  //
  // The property to preserve is that every row varies. Whatever bike a rider
  // picks, their gravel answer changes the answer. Its absence was the fault Jan
  // hit on 20 Aug, when a Road bike ignored the question completely.
  var TF_GRAVEL_ORDER = ['never', 'occasional', 'often', 'most'];

  var SMOOTH = 'Smooth All-Road', SEMI = 'Semi-Slick', KNOBBY = 'Dual-Purpose Knobby';
  var TF_TREAD = {
    //          never    occasional  often    most
    road:      [SMOOTH,  SMOOTH,     SEMI,    KNOBBY],
    allroad:   [SMOOTH,  SMOOTH,     SEMI,    KNOBBY],
    gravel:    [SMOOTH,  SEMI,       SEMI,    KNOBBY],
    adventure: [SEMI,    KNOBBY,     KNOBBY,  KNOBBY],
  };

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
    wf: { unit: defaultUnit, feel:'soft',              outUnit: defaultUnit, lastPsi: null, lastWidth: null },
    tf: { unit: defaultUnit, feel:'soft', tube:'tubes', outUnit: defaultUnit, lastPsi: null,
          browse: null, ladder: [], currentKey: null },
    cl: {},   // no units, no weights — just two measurements in mm
  };

  // Shared fields synced on tab switch (only between tabs present on the page)
  var SHARED_FIELDS = [
    { s: 'rhc-s-rider', p: 'rhc-p-rider', wf: 'rhc-wf-rider', tf: 'rhc-tf-rider' },
    { s: 'rhc-s-bike',  p: 'rhc-p-bike',  wf: 'rhc-wf-bike',  tf: 'rhc-tf-bike'  },
    // Same physical measurement in both tabs, so don't make anyone type it twice.
    // Tabs missing from a map are skipped, so this is safe on any page.
    { p: 'rhc-p-rimw',  tf: 'rhc-tf-rimw' },
  ];

  // Tab slug (from the shortcode / DOM id) → internal state prefix.
  // Tabs with no inputs map to null: nothing to calculate or sync.
  var TAB_PREFIX = {
    'simple':       's',
    'pro':          'p',
    'width-finder': 'wf',
    'tire-finder':  'tf',
    'clearance':    'cl',
  };

  var TAB_IDS = {
    s:  'rhc-tab-simple',
    p:  'rhc-tab-pro',
    wf: 'rhc-tab-width-finder',
    tf: 'rhc-tab-tire-finder',
    cl: 'rhc-tab-clearance',
  };

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
    else if (prefix === 'tf') window.rhcTpcCalcTireFinder();
    else if (prefix === 'cl') window.rhcTpcCalcClearance();
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

  // Prefix first, to match rhcTpcSetUnit / rhcTpcSetFeel.
  window.rhcTpcSetTube = function(prefix, type) {
    if (!state[prefix]) return;
    if (prefix === 'tf') state.tf.browse = null;
    state[prefix].tube = type;
    var tubesBtn    = el('rhc-' + prefix + '-tube-tubes');
    var tubelessBtn = el('rhc-' + prefix + '-tube-tubeless');
    if (tubesBtn)    tubesBtn.classList.toggle('active',    type === 'tubes');
    if (tubelessBtn) tubelessBtn.classList.toggle('active', type === 'tubeless');
    liveCalc(prefix);
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

    state.wf.lastPsi   = psi;
    state.wf.lastWidth = calcW;
    state.wf.outUnit   = unit;

    setWeightWarning('wf', rider, bike);
    document.getElementById('rhc-wf-out-width').innerHTML =
      RH_DISPLAY[best] + ' <span class="unit">mm</span>';
    document.getElementById('rhc-wf-out-casing').textContent = casing;
    document.getElementById('rhc-wf-out-tread').textContent  = tread;
    renderOutPressure('wf');

    // Q13: offer the handoff only when the tire finder is actually on this page.
    var wfNote = document.getElementById('rhc-wf-result-note');
    if (el(TAB_IDS.tf)) {
      wfNote.style.display = 'block';
      wfNote.innerHTML = 'Looking for a specific tire? ' +
        '<button type="button" class="link-btn" onclick="rhcTpcSendToFinder(this)">' +
        'Find Rene Herse tires this width</button>';
    } else {
      wfNote.style.display = 'none';
    }

    document.getElementById('rhc-wf-result').classList.add('visible');
  };

  // ═══════════════════════════════════════════
  // TIRE FINDER
  // ═══════════════════════════════════════════
  function tireFinderTread(bikeType, gravelFreq) {
    var row = TF_TREAD[bikeType] || TF_TREAD.road;
    var at  = TF_GRAVEL_ORDER.indexOf(gravelFreq);
    return row[at === -1 ? 1 : at];   // an answer we don't know reads as "occasionally"
  }

  // The casing recommendation is a phrase ('Extralight or Standard'), and a tire
  // may not be built in every casing it names. Keep the ones it is built in; if
  // that leaves nothing, step down the toughness order — the draft's only stated
  // casing substitution is "instead of Endurance Plus, recommend Endurance".
  function tireFinderCasings(tire, phrase) {
    var wanted = String(phrase).split(' or ');
    var kept   = wanted.filter(function(c) { return tire.casings.indexOf(c) !== -1; });
    if (kept.length) return { casings: kept, substituted: kept.length !== wanted.length };

    var from = TF_CASING_ORDER.indexOf(wanted[0]);
    if (from === -1) from = 0;
    for (var d = from - 1; d >= 0; d--) {
      if (tire.casings.indexOf(TF_CASING_ORDER[d]) !== -1) {
        return { casings: [TF_CASING_ORDER[d]], substituted: true };
      }
    }
    for (var u = from + 1; u < TF_CASING_ORDER.length; u++) {
      if (tire.casings.indexOf(TF_CASING_ORDER[u]) !== -1) {
        return { casings: [TF_CASING_ORDER[u]], substituted: true };
      }
    }
    return { casings: tire.casings.slice(0, 1), substituted: true };
  }

  // Measured width for a tire in a given casing set, on its design rim.
  //
  // When the recommendation names two casings they measure differently, and only
  // one number can drive the pressure. We take the Extralight width whenever
  // Extralight is one of the options: that reproduces every display name in Jan's
  // spreadsheet exactly (29→30, 41→42, 52→54). Confirmed by Jan on 18 Aug (Q15):
  // quoting the wider of the two is the safe direction, because a tire that comes
  // out slightly narrower than advertised still fits the frame.
  // The width a tire is *matched* against: what it measures on the rider's rim,
  // before casing and tubeless are taken into account. Riding style chooses the
  // casing, and casing changes width — so matching on the finished width let
  // riding style decide which tire, and therefore which tread, a rider was sent
  // to. Jan asked for riding style to settle the casing and nothing else
  // (21 Aug), so selection uses this and display uses the width below.
  function tireFitWidth(tire, rimW) {
    var w = tire.baseline;
    if (rimW && rimW > tire.designRim) w += (rimW - tire.designRim) * TF_RIM_PER_MM;
    return w;
  }

  // What the tire actually measures for this rider's setup — shown in the result
  // and used for the pressure.
  function tireActualWidth(tire, casings, tubeless, rimW) {
    var w = tireFitWidth(tire, rimW);
    if (casings.indexOf('Extralight') !== -1) w *= TF_EXTRALIGHT_FACTOR;
    if (tubeless) w *= TF_TUBELESS_FACTOR;
    return w;
  }

  // How much of a tire's width comes from the rim rather than the tire, so the
  // result can say so. Zero when the rider left the rim field blank or is on the
  // rim the tire was designed around.
  function tireRimGain(tire, casings, tubeless, rimW) {
    return tireActualWidth(tire, casings, tubeless, rimW) -
           tireActualWidth(tire, casings, tubeless, 0);
  }

  // 'a, b or c' — casing lists read as prose in the explainer notes.
  function joinList(items) {
    if (items.length <= 1) return items[0] || '';
    return items.slice(0, -1).join(', ') + ' or ' + items[items.length - 1];
  }

  // Wheel sizes carry Jan's spreadsheet wording ('26"', '700C / 29"'), which
  // suits a dropdown but is long for a tire name. Q12's examples name the tire
  // '700C x 32 mm Stampede Pass', so the name takes the part before the slash.
  function sizePrefix(size) {
    return String(size).split(' / ')[0];
  }

  // The parenthetical is catalog data, not a calculation: Jan's 'Nominal Size 2'
  // column, printed verbatim, blank meaning none. He asked for it to stay fixed
  // per tire (19 Aug) — Naches Pass is always "(42 mm)" even though the tire
  // actually measures 41–43 depending on casing and tubeless. The measured
  // figure has its own row in the result card, and the standing note under it
  // explains that a sidewall number and a measured width need not agree.
  function tireDisplayName(tire) {
    var name = sizePrefix(tire.size) + ' x ' + tire.nominal + ' ' + tire.model;
    return tire.nominal2 ? name + ' (' + tire.nominal2 + ')' : name;
  }

  // Width decides the model; tread breaks ties between tires of the same width.
  // On 26" that ordering matters: asking for 42 mm on knobby terrain still gets
  // Naches Pass, because no knobby 26" tire is made anywhere near that width.
  // Identifies a tire across recalculations. Model alone isn't enough: a model
  // sold in two treads is two rows.
  function tireKey(t) { return t.size + '|' + t.model + '|' + t.tread; }

  function tireFinderCandidates(pool, requestedW, casingPhrase, tubeless, wantTread, rimW) {
    return pool.map(function(tire) {
      var resolved = tireFinderCasings(tire, casingPhrase);
      var fitW     = tireFitWidth(tire, rimW);
      var actualW  = tireActualWidth(tire, resolved.casings, tubeless, rimW);
      return {
        tire: tire,
        casings: resolved.casings,
        casingSubstituted: resolved.substituted,
        actualW: actualW,
        fitW: fitW,
        widthDiff: Math.abs(fitW - requestedW),
        treadMatch: tire.tread === wantTread,
        // Q26: Orondo Grade is the tubeless build of Stampede Pass, so a rider on
        // tubes should be sent to the tubed one when both fit equally well. Only
        // a tie-break: it never overrides a better width or the right tread.
        tubeMatch: tire.tubeless === tubeless,
      };
    });
  }

  function tireFinderPick(pool, requestedW, casingPhrase, tubeless, wantTread, rimW) {
    var cands = tireFinderCandidates(pool, requestedW, casingPhrase, tubeless, wantTread, rimW);

    // If the rider's tread is made anywhere near the width they asked for, choose
    // from those alone — see TF_TREAD_TOLERANCE. Otherwise the whole pool is fair
    // game and width decides, which is what Q18 settled.
    var onTread = cands.filter(function(c) {
      return c.treadMatch && c.widthDiff <= TF_TREAD_TOLERANCE;
    });
    var field = onTread.length ? onTread : cands;

    var best = null;
    field.forEach(function(cand) {
      if (!best) { best = cand; return; }
      // Rounded to 0.1 mm so a rounding artefact can't outrank a tie-break.
      var dw = Math.round((cand.widthDiff - best.widthDiff) * 10) / 10;
      if (dw < 0) { best = cand; return; }
      if (dw > 0) return;
      if (cand.treadMatch !== best.treadMatch) { if (cand.treadMatch) best = cand; return; }
      if (cand.tubeMatch  !== best.tubeMatch)  { if (cand.tubeMatch)  best = cand; return; }
      if (cand.tire.priority < best.tire.priority) best = cand;
    });
    return best;
  }

  window.rhcTpcCalcTireFinder = function() {
    clearError('tf');
    var unit        = state.tf.unit;
    var rider       = getWeight('rhc-tf-rider', unit);
    var bike        = getWeight('rhc-tf-bike', unit);
    var size        = el('rhc-tf-size').value;
    var requestedW  = parseInt(el('rhc-tf-width').value, 10);
    // DOM id is historical — the field is labeled "Bike" since 21 Aug. Named
    // bikeType, NOT bike: `bike` is the bike's weight three lines up, and `var`
    // lets a second declaration quietly overwrite the first.
    var bikeType    = el('rhc-tf-terrain').value;
    var gravelFreq  = el('rhc-tf-gravel').value;
    var ridingStyle = el('rhc-tf-ridingstyle').value;
    var tubeless    = state.tf.tube === 'tubeless';
    var feel        = bikeType === 'road' ? 'firm' : 'soft';
    // Optional. Blank means "the rim this tire was designed around", which is the
    // honest default -- plenty of riders won't know their internal rim width.
    // Out-of-range numbers are ignored rather than clamped: clamping 200 down to
    // 45 would invent a measurement the rider never gave us.
    var rimRaw      = parseFloat(el('rhc-tf-rimw').value);
    var rimGiven    = isFinite(rimRaw);
    var rimOk       = rimGiven && rimRaw >= TF_RIM_MIN && rimRaw <= TF_RIM_MAX;
    var rimW        = rimOk ? rimRaw : 0;

    if (!rider || !bike) return hideResults('tf');

    var inSize = TIRE_CATALOG.filter(function(t) {
      return t.size === size && t.inProduction;
    });
    if (!inSize.length) {
      return showError('tf', 'No ' + size + ' tires are in the catalog yet.');
    }

    var totalLb      = rider + bike;
    var casingPhrase = widthFinderCasing(bikeType, ridingStyle, totalLb, rider);
    var wantTread    = tireFinderTread(bikeType, gravelFreq);

    // Q8: tubeless narrows the pool first, so the answer is always the nearest
    // tubeless tire rather than no tire at all.
    var pool = tubeless ? inSize.filter(function(t) { return t.tubeless; }) : inSize;
    if (!pool.length) {
      return showError('tf', 'No tubeless-compatible ' + size + ' tires are in the catalog yet.');
    }

    var cands = tireFinderCandidates(pool, requestedW, casingPhrase, tubeless, wantTread, rimW);
    var pick  = tireFinderPick(pool, requestedW, casingPhrase, tubeless, wantTread, rimW);
    var recommended = pick;

    // The rungs the Go wider / Go narrower buttons climb: tires of the same tread
    // as the recommendation, narrowest first. Jan asked for the tread to hold
    // while browsing (20 Aug) — stepping used to change tread as well as width,
    // which asks the rider to weigh a trade-off the calculator exists to make
    // for them.
    var ladder = cands
      .filter(function(c) { return c.tire.tread === recommended.tire.tread; })
      .sort(function(a, b) { return a.fitW - b.fitW; });
    state.tf.ladder = ladder.map(function(c) { return tireKey(c.tire); });

    // If the rider stepped away from our recommendation, show what they stepped
    // to. Any change to the inputs clears it (see onTfField).
    if (state.tf.browse) {
      var browsed = ladder.filter(function(c) { return tireKey(c.tire) === state.tf.browse; })[0];
      if (browsed) pick = browsed;
      else state.tf.browse = null;
    }
    state.tf.currentKey = tireKey(pick.tire);

    // Did filtering to tubeless push us past a closer tire?
    var tubelessDetour = false;
    if (!state.tf.browse && tubeless && pool.length !== inSize.length) {
      var open = tireFinderPick(inSize, requestedW, casingPhrase, tubeless, wantTread, rimW);
      tubelessDetour = open && open.tire !== pick.tire;
    }

    var casingText = pick.casings.join(' or ');
    var psi        = calcPSI(totalLb, pick.actualW, feel);

    state.tf.lastPsi = psi;
    state.tf.outUnit = unit;

    setWeightWarning('tf', rider, bike);
    el('rhc-tf-out-tire').textContent   = tireDisplayName(pick.tire);
    el('rhc-tf-out-width').innerHTML    = fmtNum(pick.actualW, 1) + ' <span class="unit">mm</span>';
    el('rhc-tf-out-casing').textContent = casingText;
    el('rhc-tf-out-tread').textContent  = pick.tire.tread;
    renderOutPressure('tf');

    // ── Explainers ──
    var notes = [];

    // Q5: never let the rider wonder why the size moved. Silent while browsing --
    // this describes our recommendation, and calling a tire the rider deliberately
    // stepped to "the closest available" is both wrong and self-contradictory
    // next to the browsing note below.
    if (!state.tf.browse && Math.abs(pick.actualW - requestedW) >= TF_WIDTH_NOTE_THRESHOLD) {
      notes.push('Closest size available — you asked for ' + requestedW + ' mm and the nearest ' +
                 sizePrefix(size) + ' Rene Herse tire measures ' + Math.round(pick.actualW) + ' mm.');
    }

    // Q8
    if (tubelessDetour) {
      notes.push('Closest tubeless-compatible Rene Herse tire.');
    }

    if (rimGiven && !rimOk) {
      notes.push('That rim width doesn\u2019t look like an internal measurement — those run ' +
                 TF_RIM_MIN + ' to ' + TF_RIM_MAX + ' mm — so we\u2019ve ignored it.');
    }

    // Jan's "On your rims, ..." explainer from Q5, now that there is a rim field.
    var rimGain = tireRimGain(pick.tire, pick.casings, tubeless, rimW);
    if (rimGain >= 0.1) {
      notes.push('On your ' + fmtNum(rimW, 0) + ' mm rims this tire measures ' +
                 fmtNum(pick.actualW, 1) + ' mm — about ' + fmtNum(rimGain, 1) +
                 ' mm wider than on a ' + pick.tire.designRim + ' mm rim.');
    }

    // Say plainly that this is no longer our recommendation.
    if (state.tf.browse) {
      notes.push('You are browsing. Our pick for these answers is ' +
                 tireDisplayName(recommended.tire) + '.');
    }

    // Q10: the catalog overrode an answer the rider gave, so say so rather than
    // letting a forced result read as a bug. Only the parts that were actually
    // forced get a clause — reciting a tire's whole casing list when nothing was
    // overridden just contradicts the recommendation above it.
    var forced = [];
    if (pick.casingSubstituted || pick.tire.casings.length === 1) {
      forced.push('in ' + joinList(pick.tire.casings));
    }
    if (pick.tire.tread !== wantTread) {
      forced.push('with a ' + pick.tire.tread + ' tread');
    }
    if (forced.length) {
      notes.push(pick.tire.model + ' is only available ' + forced.join(' ') + '.');
    }

    var noteEl = el('rhc-tf-result-note');
    if (notes.length) {
      noteEl.style.display = 'block';
      noteEl.innerHTML = notes.map(function(n) { return '• ' + n; }).join('<br>');
    } else {
      noteEl.style.display = 'none';
    }

    // Grey out a direction with nothing left in it, rather than hiding the button
    // and shifting the card about.
    var at = state.tf.ladder.indexOf(state.tf.currentKey);
    var narrower = el('rhc-tf-step-narrower');
    var wider    = el('rhc-tf-step-wider');
    if (narrower) narrower.disabled = at <= 0;
    if (wider)    wider.disabled    = at === -1 || at >= state.tf.ladder.length - 1;
    var resetEl = el('rhc-tf-step-reset');
    if (resetEl) resetEl.style.display = state.tf.browse ? 'inline' : 'none';

    el('rhc-tf-result').classList.add('visible');
  };

  // Go wider / Go narrower: step one rung along the tires that exist in this
  // wheel size, so the rider sees real alternatives — different tread and casing
  // availability, not just a different number.
  window.rhcTpcStepTire = function(dir) {
    var ladder = state.tf.ladder || [];
    var at = ladder.indexOf(state.tf.currentKey);
    var to = at + dir;
    if (at === -1 || to < 0 || to >= ladder.length) return;
    state.tf.browse = ladder[to];
    liveCalc('tf');
  };

  window.rhcTpcResetTire = function() {
    state.tf.browse = null;
    liveCalc('tf');
  };

  // ═══════════════════════════════════════════
  // CLEARANCE  ("Will It Fit?")
  // ═══════════════════════════════════════════
  // Jan's formula, 20 Aug:
  //   max tire width = 2 × (tightest clearance − 3 mm) + current tire width
  // The gap is measured on one side, so the 3 mm allowance and the space freed
  // up both count twice. 3 mm a side is the usual margin for mud, a wheel that
  // is slightly out of true, and a tire growing as it wears in.
  // ISO standard, and Jan's preference from 21 Aug: modern frames have room, so
  // there is less call to cram the widest possible tire into a tight one.
  var CL_MARGIN_MM = 4;
  var CL_GAP_MAX   = 60;    // a gap larger than this is not a frame clearance
  var CL_WIDTH_MIN = 15;
  var CL_WIDTH_MAX = 120;

  window.rhcTpcCalcClearance = function() {
    clearError('cl');
    var gap     = parseFloat(el('rhc-cl-gap').value);
    var current = parseFloat(el('rhc-cl-width').value);

    if (!isFinite(gap) || !isFinite(current)) return hideResults('cl');

    // Both fields are required here, so an implausible number is worth stopping
    // for rather than answering. 2 x (500 - 3) + 32 is arithmetically fine and
    // completely useless.
    if (gap < 0 || gap > CL_GAP_MAX) {
      return showError('cl', 'Clearance should be between 0 and ' + CL_GAP_MAX +
        ' mm. Measure the gap on one side only, at its tightest point.');
    }
    if (current < CL_WIDTH_MIN || current > CL_WIDTH_MAX) {
      return showError('cl', 'Tire width should be between ' + CL_WIDTH_MIN + ' and ' +
        CL_WIDTH_MAX + ' mm — the width the tire actually measures on the bike.');
    }

    var max = 2 * (gap - CL_MARGIN_MM) + current;

    var notes = [];
    if (max < current) {
      // Less than 3 mm a side: the tire already on the bike is over the margin.
      max = current;
      notes.push('With under ' + CL_MARGIN_MM + ' mm of clearance there is no room to go wider — ' +
                 'this is already as much tire as the frame will take.');
    } else if (max - current < 1) {
      notes.push('There is no useful room to go wider than the tire you already have.');
    } else {
      notes.push('Room for about ' + fmtNum(max - current, 1) + ' mm more tire than you run now.');
    }

    el('rhc-cl-out-max').innerHTML = fmtNum(max, 1) + ' <span class="unit">mm</span>';
    var noteEl = el('rhc-cl-result-note');
    noteEl.style.display = 'block';
    noteEl.innerHTML = notes.map(function(n) { return '• ' + n; }).join('<br>');
    el('rhc-cl-result').classList.add('visible');
  };

  // Q13: hand the width finder's recommendation across to the tire finder.
  // Clicking the real tab button keeps tab switching in one place, and quietly
  // does nothing if the tire finder isn't on this page.
  window.rhcTpcSendToFinder = function(btn) {
    var root = btn.closest('.rhc-tpc');
    if (!root) return;
    var widthSel = el('rhc-tf-width');
    if (widthSel && state.wf.lastWidth) widthSel.value = String(Math.round(state.wf.lastWidth));
    var navBtns = root.querySelectorAll('.tab-nav .tab-btn');
    for (var i = 0; i < navBtns.length; i++) {
      if ((navBtns[i].getAttribute('onclick') || '').indexOf("'tire-finder'") !== -1) {
        navBtns[i].click();
        return;
      }
    }
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

  // Tire finder fields additionally drop any Go wider / Go narrower browsing:
  // once the question changes, the tire the rider stepped to is stale.
  function onTfField(id, event) {
    var field = el(id);
    if (field) field.addEventListener(event || 'input', function() {
      state.tf.browse = null;
      liveCalc('tf');
    });
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

    // Tire finder tab. Q7: the width list stays full for every wheel size —
    // the rider may ask for anything and the finder answers with the best fit.
    buildWidthDropdown('rhc-tf-width');
    var tfWidth = el('rhc-tf-width');
    if (tfWidth) tfWidth.value = '42'; // mid-range starting point, not the 25 mm floor
    var sizeSel = el('rhc-tf-size');
    if (sizeSel) {
      TIRE_SIZES.forEach(function(size) {
        var opt = document.createElement('option');
        opt.value = size;
        opt.textContent = size;
        sizeSel.appendChild(opt);
      });
    }
    onTfField('rhc-tf-size',        'change');
    onTfField('rhc-tf-width',       'change');
    onTfField('rhc-tf-rimw');
    onTfField('rhc-tf-terrain',     'change');
    onTfField('rhc-tf-gravel',      'change');
    onTfField('rhc-tf-ridingstyle', 'change');
    onTfField('rhc-tf-rider');
    onTfField('rhc-tf-bike');
    onTfField('rhc-tf-rider-unit',  'change');
    onTfField('rhc-tf-bike-unit',   'change');

    // Clearance tab
    onField('rhc-cl-gap',   'cl');
    onField('rhc-cl-width', 'cl');

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
