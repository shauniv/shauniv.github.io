"""Setup instructions for Jan's web person: install the test build, create both pages."""

from _docx_kit import *          # noqa: F401,F403
from _docx_kit import (doc, para, rich, body, h2, h3, hrule, spacer,
                       boxed_table, data_table, run, cant_split, glue_rows,
                       SERIF, SANS, MONO, INK, INK_SOFT, ACCENT, SETTLED,
                       SH_SETTLED, CONTENT_W, Pt, Inches, RGBColor)


def step(n, parts, space_after=5):
    """A numbered step; parts as for rich()."""
    out = [(n + "  ", {"bold": True, "color": ACCENT})] + parts
    rich(doc, out, size=10.5, color=INK, space_after=space_after, line=1.35)


def code(text):
    return (text, {"font": MONO, "size": 10, "bold": True, "color": INK})


def plain(text):
    return (text, {})


def ui(text):
    return (text, {"bold": True})


# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE CALCULATORS", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "Setting up the test site", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "Hello, I\u2019m Shaun Ivory. I built the tire pressure calculator on renehersecycles.com "
     "for Jan, and a new Tire Finder to go with it. Jan and I would like to try both on your test "
     "site before anything goes live. It should take about 15 minutes.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=10)

cell = boxed_table(SH_SETTLED, border_color="2D6A4F", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(0)
p.paragraph_format.line_spacing = 1.4
run(p, "Test site only. ", bold=True, color=SETTLED)
run(p, "Please don\u2019t install this on the live site yet. The test build also changes the "
       "existing calculator, and it goes live only after Jan and I have tested it.", color=INK)
cant_split(doc.tables[-1])

spacer(4)
h3("You will need")
step("\u2022", [plain("WordPress admin access to the test site.")], space_after=3)
step("\u2022", [plain("The file I sent, "), code("tire-pressure-calculator-test-\u2026.zip"),
                plain(". Don\u2019t unzip it; WordPress takes the ZIP as it is.")])

# ═════════════════════════════════════════════════════════════════════════════
h2("1. Install the plugin")

step("1", [plain("Go to "), ui("Plugins \u2192 Add New Plugin \u2192 Upload Plugin"),
           plain(", choose the ZIP, and click "), ui("Install Now"), plain(".")])
step("2", [plain("If the test site is a copy of the live site, the calculator is already installed. "
                 "WordPress will say so: click "), ui("Replace current with uploaded"), plain(".")])
step("3", [plain("Click "), ui("Activate Plugin"), plain(" if it isn\u2019t active already. It is listed "
                 "as "), ui("Rene Herse Tire Pressure Calculator"), plain(". It will show version "
                 "1.0.6; that is expected for a test build.")], space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("2. Create the two pages")

rich(doc, [plain("Each page holds a single shortcode. In the page editor, add a "),
           ui("Shortcode"), plain(" block (type "), code("/shortcode"),
           plain(") and paste the text below into it. A plain paragraph works too.")],
     size=10.5, color=INK, space_after=9)
doc.paragraphs[-1].paragraph_format.keep_with_next = True

data_table(
    ["Page", "Shortcode", "What it shows"],
    [
        ["Tire Pressure Calculator", "[tire_pressure_calculator]", "Two tabs: Simple and Pro"],
        ["Tire Finder", "[tire_finder]",
         "Three tabs: Tire Finder, How Wide Should I Run?, Will It Fit?"],
    ],
    [Inches(1.75), Inches(2.2), CONTENT_W - Inches(3.95)],
    mono_cols={1},
    vpad=54,
)
glue_rows(doc.tables[-1])

spacer(6)
step("\u2022", [plain("If the test site already has the calculator page, leave it as it is. It "
                      "now runs the new version.")], space_after=3)
step("\u2022", [plain("The page titles and addresses are up to you and Jan.")], space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("3. Check that it works")

step("1", [plain("Open each page and enter a rider weight of 160 and a bike weight of 20. A result "
                 "card with a pressure should appear right away; there is no button to press.")])
step("2", [plain("On the Tire Finder, the recommended tire\u2019s name should link to its product "
                 "page.")])
step("3", [plain("Send me the addresses of both pages, and Jan and I will take it from there.")],
     space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("If something looks wrong")

data_table(
    ["What you see", "What to do"],
    [
        ["The shortcode shows as text on the page",
         "The plugin isn\u2019t active. Check Plugins."],
        ["The calculator appears but has no styling, or typing does nothing",
         "The page is probably built with a page builder (Elementor, Divi, etc.). Add this line to "
         "wp-config.php:\ndefine( 'RHC_TPC_FORCE_ENQUEUE', true );"],
        ["The tabs or buttons don\u2019t respond",
         "A caching or optimization plugin is delaying or combining JavaScript. Exclude "
         "tire-pressure-calculator.js from those settings."],
    ],
    [Inches(2.3), CONTENT_W - Inches(2.3)],
    vpad=54,
)
glue_rows(doc.tables[-1])

spacer(8)
body("Anything else, just reply to my email.", space_after=0)

OUT = r"D:\repos\TirePressureCalculator\Tire Calculators - Test Site Setup.docx"
doc.save(OUT)
print("wrote", OUT)
