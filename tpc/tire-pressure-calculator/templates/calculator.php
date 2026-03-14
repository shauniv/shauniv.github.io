<div class="rhc-tpc">

<div class="tool-header">
  <h1>Tire Pressure Calculator</h1>
  <p>Rene Herse Cycles &mdash; Based on Real-Road Measurements</p>
</div>

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
        <label id="rhc-s-rider-lbl">Rider Weight (lb)</label>
        <input type="number" id="rhc-s-rider" min="0" max="500" step="0.5" placeholder="e.g. 160">
      </div>
      <div class="field">
        <label id="rhc-s-bike-lbl">Bike Weight (lb)</label>
        <input type="number" id="rhc-s-bike" min="0" max="100" step="0.5" placeholder="e.g. 22">
      </div>
    </div>

    <div class="field">
      <label>Preferred Feel</label>
      <div class="toggle-group">
        <button class="toggle-btn active" id="rhc-s-feel-soft" onclick="rhcTpcSetFeel('s','soft')">Soft</button>
        <button class="toggle-btn" id="rhc-s-feel-firm" onclick="rhcTpcSetFeel('s','firm')">Firm</button>
        <button class="toggle-btn" id="rhc-s-feel-dk" onclick="rhcTpcSetFeel('s','dk')">Don't Know</button>
      </div>
      <div class="hint">If unsure, "Don't Know" uses Soft values.</div>
    </div>


    <div id="rhc-s-error" class="error-card"></div>
    <div id="rhc-s-result" class="result-card">
      <div class="result-header">Recommended Tire Pressure</div>
      <div class="result-body">
        <div id="rhc-s-weight-warning" class="weight-warning"></div>
        <div class="result-row">
          <span class="result-label">Front &amp; Rear</span>
          <span class="result-value" id="rhc-s-out-psi">— <span class="unit">psi</span></span>
        </div>
        <div id="rhc-s-out-bar-row" class="result-row" style="display:none">
          <span class="result-label"></span>
          <span class="result-value" id="rhc-s-out-bar">— <span class="unit">bar</span></span>
        </div>
        <div id="rhc-s-result-note" class="result-note"></div>
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
          <option value="0">Rene Herse Extralight / top-tier road</option>
          <option value="-50">Rene Herse Standard / high-perf road</option>
          <option value="-150">Rene Herse Endurance / high-perf gravel</option>
          <option value="-150b">Rene Herse Endurance Plus / gravel &amp; touring</option>
          <option value="-100">Other reinforced touring / city</option>
        </select>
      </div>
      <div class="field">
        <label>Rear Casing</label>
        <select id="rhc-p-rc">
          <option value="0">Rene Herse Extralight / top-tier road</option>
          <option value="-50">Rene Herse Standard / high-perf road</option>
          <option value="-150">Rene Herse Endurance / high-perf gravel</option>
          <option value="-150b">Rene Herse Endurance Plus / gravel &amp; touring</option>
          <option value="-100">Other reinforced touring / city</option>
        </select>
      </div>
    </div>

    <hr class="divider">
    <div class="sub-label">Rims</div>

    <div class="two-col">
      <div class="field">
        <label id="rhc-p-rimw-lbl">Rim Internal Width (mm) <i class="rhc-tip" tabindex="0">i<span class="rhc-tip-box">The <strong>internal width</strong> is the measurement inside the rim channel, from wall to wall — not the outer width of the rim. It's usually printed in your wheel's specs or stamped on the rim.<br><br>Why it matters: a wider rim spreads the tire, effectively increasing its contact patch. Each millimeter over 19 mm reduces recommended pressure by 0.2% to compensate.</span></i></label>
        <input type="number" id="rhc-p-rimw" min="10" max="40" step="1" placeholder="e.g. 23">
        <div class="hint">Leave blank to use 23 mm default.</div>
      </div>
      <div class="field">
        <label>Rim Type <i class="rhc-tip" tabindex="0">i<span class="rhc-tip-box"><strong>Hooked</strong> rims have a small lip inside the rim channel that locks the tire bead in place — the traditional standard, found on most wheels.<br><br><strong>Hookless</strong> rims have a straight inner wall with no lip, common on modern tubeless-ready carbon wheels.<br><br>Why it matters: hookless rims have a max pressure of 72.5 psi (5 bar). If your recommended pressure exceeds that, the calculator will adjust it down automatically.</span></i></label>
        <select id="rhc-p-rimtype">
          <option value="hooks">Hooked (standard)</option>
          <option value="hookless">Hookless</option>
          <option value="dk">Don't Know</option>
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
        <label id="rhc-p-rider-lbl">Rider Weight (lb)</label>
        <input type="number" id="rhc-p-rider" min="0" max="500" step="0.5" placeholder="e.g. 160">
      </div>
      <div class="field">
        <label id="rhc-p-bike-lbl">Bike Weight (lb)</label>
        <input type="number" id="rhc-p-bike" min="0" max="100" step="0.5" placeholder="e.g. 22">
      </div>
    </div>

    <div class="two-col">
      <div class="field">
        <label id="rhc-p-fp-lbl">Front Panniers (lb)</label>
        <input type="number" id="rhc-p-fp" min="0" max="100" step="0.5" placeholder="0">
      </div>
      <div class="field">
        <label id="rhc-p-rp-lbl">Rear Panniers (lb)</label>
        <input type="number" id="rhc-p-rp" min="0" max="100" step="0.5" placeholder="0">
      </div>
    </div>

    <div class="field">
      <label id="rhc-p-bp-lbl">Bikepacking Load / Frame Bag (lb)</label>
      <input type="number" id="rhc-p-bp" min="0" max="50" step="0.5" placeholder="0">
      <div class="hint">Added equally to front &amp; rear via bike weight.</div>
    </div>

    <hr class="divider">
    <div class="sub-label">Bike &amp; Riding Style</div>

    <div class="two-col">
      <div class="field">
        <label>Bike Style</label>
        <select id="rhc-p-bikestyle">
          <option value="40/60">Road bike (40/60 F/R)</option>
          <option value="40/60g">Gravel bike (40/60 F/R)</option>
          <option value="38/62">Touring bike (38/62 F/R)</option>
          <option value="35/65">City bike (35/65 F/R)</option>
        </select>
      </div>
      <div class="field">
        <label>Riding Position</label>
        <select id="rhc-p-position">
          <option value="aero">Aero / flat back (+3% front)</option>
          <option value="low" selected>Low / stretched-out (neutral)</option>
          <option value="intermediate">Intermediate (−4% front)</option>
          <option value="upright">Upright (−8% front)</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label>Terrain</label>
      <select id="rhc-p-terrain">
        <option value="smooth">Smooth asphalt</option>
        <option value="rough">Rough asphalt</option>
        <option value="smooth-gravel">Smooth gravel (use Soft values)</option>
        <option value="coarse-gravel">Coarse gravel (95% of Soft)</option>
        <option value="rough-gravel">Rough gravel / large rocks (105% of Soft)</option>
        <option value="mixed">Mixed paved / gravel (use Soft values)</option>
      </select>
    </div>

    <div class="field">
      <label>Preferred Feel</label>
      <div class="toggle-group">
        <button class="toggle-btn active" id="rhc-p-feel-soft" onclick="rhcTpcSetFeel('p','soft')">Soft</button>
        <button class="toggle-btn" id="rhc-p-feel-firm" onclick="rhcTpcSetFeel('p','firm')">Firm</button>
        <button class="toggle-btn" id="rhc-p-feel-dk" onclick="rhcTpcSetFeel('p','dk')">Don't Know</button>
      </div>
      <div class="hint">Terrain selection may override this setting.</div>
    </div>


    <div id="rhc-p-error" class="error-card"></div>
    <div id="rhc-p-result" class="result-card">
      <div class="result-header">Recommended Tire Pressure</div>
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
        <label id="rhc-f-rider-lbl">Rider Weight (lb)</label>
        <input type="number" id="rhc-f-rider" min="0" max="500" step="0.5" placeholder="e.g. 160">
      </div>
      <div class="field">
        <label id="rhc-f-bike-lbl">Bike Weight (lb)</label>
        <input type="number" id="rhc-f-bike" min="0" max="100" step="0.5" placeholder="e.g. 22">
      </div>
    </div>

    <div class="field">
      <label>Riding Style</label>
      <select id="rhc-f-style">
        <option value="road">Road — smooth pavement, performance focus</option>
        <option value="allroad">All-Road — mixed surfaces, everyday riding</option>
        <option value="gravel">Gravel — dirt roads, light off-road</option>
        <option value="adventure">Adventure — rough terrain, loaded touring</option>
      </select>
    </div>

    <div class="field">
      <label>Preferred Feel</label>
      <div class="toggle-group">
        <button class="toggle-btn active" id="rhc-f-feel-soft" onclick="rhcTpcSetFeel('f','soft')">Soft</button>
        <button class="toggle-btn" id="rhc-f-feel-firm" onclick="rhcTpcSetFeel('f','firm')">Firm</button>
        <button class="toggle-btn" id="rhc-f-feel-dk" onclick="rhcTpcSetFeel('f','dk')">Don't Know</button>
      </div>
    </div>


    <div id="rhc-f-error" class="error-card"></div>
    <div id="rhc-f-result" class="result-card">
      <div class="result-header">Tire Recommendation</div>
      <div class="result-body">
        <div id="rhc-f-weight-warning" class="weight-warning"></div>
        <div class="result-row">
          <span class="result-label">Recommended Width</span>
          <span class="result-value" id="rhc-f-out-width">—</span>
        </div>
        <div class="result-row">
          <span class="result-label">Recommended Pressure</span>
          <span class="result-value" id="rhc-f-out-psi">—</span>
        </div>
        <div id="rhc-f-out-bar-row" class="result-row" style="display:none">
          <span class="result-label"></span>
          <span class="result-value" id="rhc-f-out-bar">—</span>
        </div>
        <div id="rhc-f-result-note" class="result-note"></div>
      </div>
    </div>

  </div>
</div>

</div><!-- /.rhc-tpc -->
