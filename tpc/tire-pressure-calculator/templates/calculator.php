<div class="rhc-tpc">

<div class="tool-header">
  <h1>Tire Pressure Calculator</h1>
  <p>Rene Herse Cycles &mdash; Based on Real-Road Measurements</p>
</div>

<div class="tab-nav">
  <button class="tab-btn active" onclick="rhcTpcSwitchTab('simple', this)">Simple</button>
  <button class="tab-btn" onclick="rhcTpcSwitchTab('pro', this)">Pro</button>
  <button class="tab-btn" onclick="rhcTpcSwitchTab('finder', this)">Tire Finder</button>
  <button class="tab-btn" onclick="rhcTpcSwitchTab('background', this)">Background</button>
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
          <input type="number" id="rhc-s-rider" min="0" max="500" step="0.5" placeholder="e.g. 160">
          <select class="field-unit-sel" id="rhc-s-rider-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
      <div class="field">
        <label>Bike Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-s-bike" min="0" max="100" step="0.5" placeholder="e.g. 22">
          <select class="field-unit-sel" id="rhc-s-bike-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
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
        <div id="rhc-s-out-psi-row" class="result-row">
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
        <label>Rider Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-p-rider" min="0" max="500" step="0.5" placeholder="e.g. 160">
          <select class="field-unit-sel" id="rhc-p-rider-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
      <div class="field">
        <label>Bike Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-p-bike" min="0" max="100" step="0.5" placeholder="e.g. 22">
          <select class="field-unit-sel" id="rhc-p-bike-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
    </div>

    <div class="two-col">
      <div class="field">
        <label>Front Panniers</label>
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
        <label>Rider Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-f-rider" min="0" max="500" step="0.5" placeholder="e.g. 160">
          <select class="field-unit-sel" id="rhc-f-rider-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
      </div>
      <div class="field">
        <label>Bike Weight</label>
        <div class="weight-input-wrap">
          <input type="number" id="rhc-f-bike" min="0" max="100" step="0.5" placeholder="e.g. 22">
          <select class="field-unit-sel" id="rhc-f-bike-unit"><option value="us">lb</option><option value="metric">kg</option></select>
        </div>
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

<!-- ═══════════════════════════════════════════════
     TAB 4 · BACKGROUND
════════════════════════════════════════════════ -->
<div id="rhc-tab-background" class="tab-panel">
  <div class="panel-inner">

    <p class="bg-intro">"Finally a tire pressure calculator based on real-road rolling resistance measurements."</p>

    <div class="bg-section">
      <p>On real roads—rather than on a steel drum in the lab—supple high-performance tires work best at considerably lower pressures than most cyclists are used to. Lower pressures roll as fast or faster, while optimizing comfort and tire grip. They also result in fewer flat tires: a soft tire often rolls over debris that would puncture a tire inflated to high pressure. Your ideal tire pressure depends on your tire size, your weight (and that of your bike), and your riding style and preferences.</p>
      <img src="<?php echo esc_url( RHC_TPC_URL . 'assets/Tire_Pressure_Paso_Cortes_MR-1024x675.jpg' ); ?>" alt="Cyclist riding on a gravel road at Paso Cortes" style="max-width:100%;height:auto;display:block;margin:1em 0;">
    </div>

    <hr class="bg-divider">

    <div class="bg-section">
      <h2>Soft or Firm?</h2>
      <p>The calculator gives you <strong>two tire pressure recommendations</strong>. Use the <strong>Soft</strong> value for gravel, rough pavement, or if you prefer a more comfortable ride. Use the <strong>Firm</strong> value if you like your bike to have a firm feel. The Firm values also provide a considerable margin of safety if your pressure drops a bit. With the Soft pressure, you are stressing your tire casing more, and it may wear out faster.</p>
      <p>For almost 20 years, we have tested tires in many widths, at many pressures, with many casings and tread patterns—on smooth roads, with a rider on the bike. We've found that supple high-performance tires roll at the same speed at either of these two pressures: soft or firm. Pressures between these two values roll a little slower. On rough surfaces, your bike will be faster at the Soft pressure.</p>
      <p>These pressure recommendations optimize your bike for speed, but speed isn't everything. Use these values as starting points to find out which pressure feels best for <em>your</em> bike, <em>your</em> terrain and <em>your</em> riding style. Also remember that your pump's gauge may not be accurate. When in doubt, use a tire pressure that feels right and safe to you instead of values provided by the calculator.</p>
      <div class="bg-warning"><strong>Do not exceed the maximum pressure for your tire and/or rim.</strong> For tubeless installation, many tires have lower maximum pressures than what's listed on the sidewall. Refer to the specifications of your tire and rim manufacturers. Maximum pressure for tubeless tires on hookless rims is defined by ETRTO standards: 73 psi (5 bar).</div>
    </div>

    <hr class="bg-divider">

    <div class="bg-section">
      <h2>Front vs. Rear Pressure</h2>
      <p>Most bikes carry more weight on the rear wheel than the front. However, when you brake hard, almost the entire weight shifts to the front wheel. For that reason, it's not advisable to run a lower pressure in the front tire.</p>
    </div>

    <hr class="bg-divider">

    <div class="bg-section">
      <h2>Even Lower Pressure?</h2>
      <p>On <strong>very rough</strong> surfaces, many riders run even lower pressures than the Soft values. This increases speed and comfort. It comes with trade-offs: there is less support for the weight of rider and bike. If these low pressures are used on firm, high-grip surfaces, the tire can collapse under hard cornering or braking. The tires also flex more at ultra-low pressures, so the sidewalls can wear out faster.</p>
    </div>

    <hr class="bg-divider">

    <div class="bg-section">
      <h2>Don't Sweat It!</h2>
      <p>The 'right' pressure will make your bike a little faster and more comfortable, but the difference isn't huge. You won't get dropped by your friends because you're running your tires at too high pressures. More important than tire pressure is choosing supple tires that offer both more speed and more comfort than stiff tires.</p>
    </div>

    <hr class="bg-divider">

    <div class="bg-section">
      <h2>The Science</h2>
      <p>Lower pressure means less vibration and less energy lost to suspension losses. That makes up for the higher hysteretic losses due to greater deformation of the tire.</p>
      <img src="<?php echo esc_url( RHC_TPC_URL . 'assets/Pressure_Suspension_Hysteresis.jpg' ); ?>" alt="Graph showing suspension losses vs. hysteretic losses vs. tire pressure" style="max-width:100%;height:auto;display:block;margin:1em 0;">
      <p>These two factors—suspension losses and hysteretic losses—do not interact in a linear way. The result: mid-range pressures actually roll a little slower than either high or low pressures.</p>
      <p>Based on <em>Bicycle Quarterly's</em> tests of rolling resistance for different tire widths and pressures, together with Frank Berto's measurements of tire drop under different weights, we have established two tire pressure charts. These charts were translated into this Tire Pressure Calculator.</p>
    </div>

    <hr class="bg-divider">

    <div class="bg-section bg-further">
      <h2>Further Reading</h2>
      <ul>
        <li><a href="https://www.renehersecycles.com/category/bicycle-quarterly/tire-tests/" target="_blank">Science behind the Tire Pressure Calculator</a></li>
        <li><a href="https://www.renehersecycles.com/bq-tire-test-results/" target="_blank">Results of <em>Bicycle Quarterly's</em> tire tests</a></li>
      </ul>
    </div>

  </div>
</div>

</div><!-- /.rhc-tpc -->
