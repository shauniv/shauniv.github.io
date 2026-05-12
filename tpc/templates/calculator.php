<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<div class="rhc-tpc">

<div class="tab-nav">
  <button class="tab-btn active" onclick="rhcTpcSwitchTab('simple', this)">Simple</button>
  <button class="tab-btn" onclick="rhcTpcSwitchTab('pro', this)">Pro</button>
  <button class="tab-btn" onclick="rhcTpcSwitchTab('finder', this)">Tire Finder</button>
</div>

<!-- ═══════════════════════════════════════════════
     TAB 1 · SIMPLE CALCULATOR
════════════════════════════════════════════════ -->
<div id="rhc-tab-simple" class="tab-panel active">
  <div class="panel-inner">

    <div class="field">
      <label>Units</label>
      <div class="toggle-group">
        <button class="toggle-btn active" id="rhc-s-unit-us" onclick="rhcTpcSetUnit('s','us')">U.S. (lb)</button>
        <button class="toggle-btn" id="rhc-s-unit-metric" onclick="rhcTpcSetUnit('s','metric')">Metric (kg)</button>
      </div>
    </div>

    <div class="field">
      <label>Tire Width (actual measured width)</label>
      <select id="rhc-s-width">
        <option value="">— select —</option>
      </select>
    </div>

    <div class="weight-row">
      <div class="field">
        <label>Rider Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-s-rider" min="0" max="500" step="0.5" placeholder="Enter Value">
          <select class="field-unit-sel" id="rhc-s-rider-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
      <div class="field">
        <label>Bike Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-s-bike" min="0" max="100" step="0.5" placeholder="Enter Value">
          <select class="field-unit-sel" id="rhc-s-bike-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
    </div>

    <div class="field">
      <label>Terrain</label>
      <select id="rhc-s-terrain">
        <option value="smooth">Smooth Asphalt</option>
        <option value="rough">Rough Asphalt</option>
        <option value="smooth-gravel">Smooth Gravel</option>
        <option value="coarse-gravel">Coarse Gravel</option>
        <option value="rough-gravel">Rough Gravel / Large Rocks</option>
        <option value="mixed">Mixed Paved / Gravel</option>
      </select>
    </div>

    <div id="rhc-s-error" class="error-card"></div>
    <div id="rhc-s-result" class="result-card">
      <div class="result-header">
        <span>Fastest-Rolling Tire Pressure</span>
        <div class="result-unit-toggle">
          <button class="result-unit-btn" id="rhc-s-out-unit-us"     onclick="rhcTpcSetOutUnit('s','us')">psi</button>
          <button class="result-unit-btn" id="rhc-s-out-unit-metric" onclick="rhcTpcSetOutUnit('s','metric')">bar</button>
        </div>
      </div>
      <div class="result-body">
        <div id="rhc-s-weight-warning" class="weight-warning"></div>
        <div id="rhc-s-out-psi-row" class="result-row">
          <span class="result-label">Front &amp; Rear</span>
          <span class="result-value" id="rhc-s-out-psi">— <span class="unit">psi</span></span>
        </div>
      </div>
    </div>



  </div>
</div>

<!-- ═══════════════════════════════════════════════
     TAB 2 · PRO CALCULATOR
════════════════════════════════════════════════ -->
<div id="rhc-tab-pro" class="tab-panel">
  <div class="panel-inner">

    <div class="field">
      <label>Units</label>
      <div class="toggle-group">
        <button class="toggle-btn active" id="rhc-p-unit-us" onclick="rhcTpcSetUnit('p','us')">U.S. (lb)</button>
        <button class="toggle-btn" id="rhc-p-unit-metric" onclick="rhcTpcSetUnit('p','metric')">Metric (kg)</button>
      </div>
    </div>

    <hr class="divider">
    <div class="sub-label">Tires</div>

    <div class="two-col">
      <div class="field">
        <label>Front Tire Width (mm)</label>
        <select id="rhc-p-fw"><option value="">— select —</option></select>
      </div>
      <div class="field">
        <label>Rear Tire Width (mm)</label>
        <select id="rhc-p-rw"><option value="">— select —</option></select>
      </div>
    </div>

    <div class="two-col">
      <div class="field">
        <label>Front Casing</label>
        <select id="rhc-p-fc">
          <option value="0">Rene Herse Extralight / Top-Tier Road</option>
          <option value="-50">Rene Herse Standard / High-Perf Road</option>
          <option value="-150">Rene Herse Endurance / High-Perf Gravel</option>
          <option value="-150b">Rene Herse Endurance Plus / Gravel &amp; Touring</option>
          <option value="-100">Other Reinforced Touring / City</option>
        </select>
      </div>
      <div class="field">
        <label>Rear Casing</label>
        <select id="rhc-p-rc">
          <option value="0">Rene Herse Extralight / Top-Tier Road</option>
          <option value="-50">Rene Herse Standard / High-Perf Road</option>
          <option value="-150">Rene Herse Endurance / High-Perf Gravel</option>
          <option value="-150b">Rene Herse Endurance Plus / Gravel &amp; Touring</option>
          <option value="-100">Other Reinforced Touring / City</option>
        </select>
      </div>
    </div>

    <hr class="divider">
    <div class="sub-label">Rims</div>

    <div class="two-col">
      <div class="field">
        <label id="rhc-p-rimw-lbl">Rim Internal Width (mm) <i class="rhc-tip" tabindex="0">i<span class="rhc-tip-box">The <strong>internal width</strong> is the measurement inside the rim channel, from wall to wall — not the outer width of the rim. It's usually printed in your wheel's specs or stamped on the rim.<br><br>Why it matters: a wider rim spreads the tire, effectively increasing its contact patch. Each millimeter over 19 mm reduces recommended pressure by 0.2% to compensate.</span></i></label>
        <input type="number" id="rhc-p-rimw" min="10" max="40" step="1" placeholder="Enter Value">
        <div class="hint">Leave blank to use 23 mm default.</div>
      </div>
      <div class="field">
        <label>Rim Type <i class="rhc-tip" tabindex="0">i<span class="rhc-tip-box"><strong>Hooked</strong> rims have a small lip inside the rim channel that locks the tire bead in place — the traditional standard, found on most wheels.<br><br><strong>Hookless</strong> rims have a straight inner wall with no lip, common on modern tubeless-ready carbon wheels.<br><br>Why it matters: hookless rims have a max pressure of 72.5 psi (5 bar). If your recommended pressure exceeds that, the calculator will adjust it down automatically.</span></i></label>
        <select id="rhc-p-rimtype">
          <option value="hooks">Hooked (Standard)</option>
          <option value="hookless">Hookless</option>
          <option value="dk">No Preference</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label>Tire Setup</label>
      <div class="toggle-group">
        <button class="toggle-btn active" id="rhc-p-tube-tubes" onclick="rhcTpcSetTube('tubes')">Tubes</button>
        <button class="toggle-btn" id="rhc-p-tube-tubeless" onclick="rhcTpcSetTube('tubeless')">Tubeless</button>
      </div>
    </div>

    <hr class="divider">
    <div class="sub-label">Weight</div>

    <div class="weight-row">
      <div class="field">
        <label>Rider Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-p-rider" min="0" max="500" step="0.5" placeholder="Enter Value">
          <select class="field-unit-sel" id="rhc-p-rider-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
      <div class="field">
        <label>Bike Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-p-bike" min="0" max="100" step="0.5" placeholder="Enter Value">
          <select class="field-unit-sel" id="rhc-p-bike-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
    </div>

    <div class="two-col">
      <div class="field">
        <label>Front Panniers / Handlebar Bag</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-p-fp" min="0" max="100" step="0.5" placeholder="0">
          <select class="field-unit-sel" id="rhc-p-fp-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
      <div class="field">
        <label>Rear Panniers</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-p-rp" min="0" max="100" step="0.5" placeholder="0">
          <select class="field-unit-sel" id="rhc-p-rp-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
    </div>

    <div class="field">
      <label>Bikepacking Load / Frame Bag</label>
      <div class="weight-input-wrap">
        <input type="number" id="rhc-p-bp" min="0" max="50" step="0.5" placeholder="0">
        <select class="field-unit-sel" id="rhc-p-bp-unit"><option value="us">lb</option><option value="metric">kg</option></select>
      </div>
      <div class="hint">Added equally to front &amp; rear via bike weight.</div>
    </div>

    <hr class="divider">
    <div class="sub-label">Bike &amp; Riding Style</div>

    <div class="two-col">
      <div class="field">
        <label>Bike Type</label>
        <select id="rhc-p-biketype">
          <option value="road">Road Bike</option>
          <option value="allroad-bike">All-Road Bike</option>
          <option value="gravel">Gravel Bike</option>
          <option value="rando">Randonneur Bike</option>
          <option value="touring">Touring Bike</option>
          <option value="city">City Bike</option>
          <option value="country">Rivendell (long chainstays)</option>
        </select>
      </div>
      <div class="field">
        <label>Riding Position</label>
        <select id="rhc-p-position">
          <option value="aero">Aero / Flat Back</option>
          <option value="low">Low / Stretched-Out</option>
          <option value="intermediate" selected>Intermediate</option>
          <option value="upright">Upright</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label>Frame Size</label>
      <select id="rhc-p-framesize">
        <option value="small">Small (Rider Height &lt;168 cm / 5'6")</option>
        <option value="medium" selected>Medium (165–182 cm / 5'5"–6'0")</option>
        <option value="tall">Tall (Rider Height &gt;182 cm / 6'0")</option>
      </select>
    </div>

    <div class="field">
      <label>Terrain</label>
      <select id="rhc-p-terrain">
        <option value="smooth">Smooth Asphalt</option>
        <option value="rough">Rough Asphalt</option>
        <option value="smooth-gravel">Smooth Gravel</option>
        <option value="coarse-gravel">Coarse Gravel</option>
        <option value="rough-gravel">Rough Gravel / Large Rocks</option>
        <option value="mixed">Mixed Paved / Gravel</option>
      </select>
    </div>

    <div class="field">
      <label>Preferred Feel</label>
      <div class="toggle-group">
        <button class="toggle-btn active" id="rhc-p-feel-soft" onclick="rhcTpcSetFeel('p','soft')">Soft</button>
        <button class="toggle-btn" id="rhc-p-feel-firm" onclick="rhcTpcSetFeel('p','firm')">Firm</button>
        <button class="toggle-btn" id="rhc-p-feel-dk" onclick="rhcTpcSetFeel('p','dk')">No Preference</button>
      </div>
      <div class="hint">Fastest-rolling pressure is same for 'firm' and 'soft' on rough surfaces.</div>
    </div>

    <div id="rhc-p-error" class="error-card"></div>
    <div id="rhc-p-result" class="result-card">
      <div class="result-header">
        <span>Fastest-Rolling Tire Pressure</span>
        <div class="result-unit-toggle">
          <button class="result-unit-btn" id="rhc-p-out-unit-us"     onclick="rhcTpcSetOutUnit('p','us')">psi</button>
          <button class="result-unit-btn" id="rhc-p-out-unit-metric" onclick="rhcTpcSetOutUnit('p','metric')">bar</button>
        </div>
      </div>
      <div class="result-body">
        <div id="rhc-p-weight-warning" class="weight-warning"></div>
        <div class="result-row">
          <span class="result-label">Front</span>
          <span class="result-value" id="rhc-p-out-f">—</span>
        </div>
        <div class="result-row">
          <span class="result-label">Rear</span>
          <span class="result-value" id="rhc-p-out-r">—</span>
        </div>
        <div id="rhc-p-result-note" class="result-note"></div>
      </div>
    </div>



  </div>
</div>

<!-- ═══════════════════════════════════════════════
     TAB 3 · TIRE FINDER
════════════════════════════════════════════════ -->
<div id="rhc-tab-finder" class="tab-panel">
  <div class="panel-inner">

    <p style="font-size:14px; color:var(--rhc-ink-light); margin-bottom:24px; line-height:1.7;">
      Instead of starting with a tire size, tell us how you ride. We'll recommend
      the ideal Rene Herse tire width for your weight and style, then calculate
      your recommended pressure.
    </p>

    <div class="field">
      <label>Units</label>
      <div class="toggle-group">
        <button class="toggle-btn active" id="rhc-f-unit-us" onclick="rhcTpcSetUnit('f','us')">U.S. (lb)</button>
        <button class="toggle-btn" id="rhc-f-unit-metric" onclick="rhcTpcSetUnit('f','metric')">Metric (kg)</button>
      </div>
    </div>

    <div class="weight-row">
      <div class="field">
        <label>Rider Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-f-rider" min="0" max="500" step="0.5" placeholder="Enter Value">
          <select class="field-unit-sel" id="rhc-f-rider-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
      <div class="field">
        <label>Bike Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-f-bike" min="0" max="100" step="0.5" placeholder="Enter Value">
          <select class="field-unit-sel" id="rhc-f-bike-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
    </div>

    <div class="field">
      <label>Bike / Terrain</label>
      <select id="rhc-f-style">
        <option value="road">Road (Smooth Pavement)</option>
        <option value="allroad">All-Road (Bumpy Pavement, Some Gravel)</option>
        <option value="gravel">Gravel or Mixed-Surface</option>
        <option value="adventure">Adventure (Rough Gravel, Single-Track)</option>
      </select>
    </div>

    <div class="field">
      <label>Riding Style</label>
      <select id="rhc-f-ridingstyle">
        <option value="smooth">I'm a smooth rider who picks the best lines.</option>
        <option value="endurance">My tires need to handle whatever the trail throws at them.</option>
        <option value="endurance-plus">I'm racing in a peloton on ultra-rough terrain and want to avoid flats at all costs.</option>
      </select>
    </div>

    <div id="rhc-f-error" class="error-card"></div>
    <div id="rhc-f-result" class="result-card">
      <div class="result-header">
        <span>Tire Recommendation</span>
        <div class="result-unit-toggle">
          <button class="result-unit-btn" id="rhc-f-out-unit-us"     onclick="rhcTpcSetOutUnit('f','us')">psi</button>
          <button class="result-unit-btn" id="rhc-f-out-unit-metric" onclick="rhcTpcSetOutUnit('f','metric')">bar</button>
        </div>
      </div>
      <div class="result-body">
        <div id="rhc-f-weight-warning" class="weight-warning"></div>
        <div class="result-row">
          <span class="result-label">Recommended Width</span>
          <span class="result-value" id="rhc-f-out-width">— <span class="unit">mm</span></span>
        </div>
        <div class="result-row">
          <span class="result-label">Recommended Casing</span>
          <span class="result-value" id="rhc-f-out-casing">—</span>
        </div>
        <div class="result-row">
          <span class="result-label">Recommended Tread</span>
          <span class="result-value" id="rhc-f-out-tread">—</span>
        </div>
        <div class="result-row">
          <span class="result-label">Recommended Pressure</span>
          <span class="result-value" id="rhc-f-out-psi">—</span>
        </div>
        <div id="rhc-f-result-note" class="result-note"></div>
      </div>
    </div>



  </div>
</div>


</div><!-- /.rhc-tpc -->
