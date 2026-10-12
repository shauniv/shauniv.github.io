"""Sixth round: the NaN pressure bug and Jan's two corrections."""

from _docx_kit import *          # noqa: F401,F403
from _docx_kit import (doc, para, rich, body, h2, h3, hrule, spacer,
                       boxed_table, data_table, question, run, cant_split, glue_rows,
                       SERIF, SANS, MONO, INK, INK_SOFT, ACCENT, SETTLED,
                       SH_RESPONSE, CONTENT_W, Pt, Inches, RGBColor)

# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE FINDER", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "Pressures are back", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "You were right, and it was worse than you could see from the outside: every pressure the tab "
     "could produce was NaN, not just the ones you tried. My mistake, made in the very change that "
     "document described. Fixed, and your two corrections are in with it.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Your notes: 21 Aug 2026", {}),
    ("     ", {}),
    ("bug fixed, corrections applied", {}),
    ("     ", {}),
    ("1 question", {}),
], font=MONO, size=8.5, color=INK_SOFT, space_after=10)

# ═════════════════════════════════════════════════════════════════════════════
h2("What went wrong")

body("Rebuilding the tread logic, I renamed a variable to \u201cbike\u201d — which was already the "
     "name of the bike\u2019s weight, four lines above. JavaScript allows the same name twice "
     "without a murmur, so the weight was quietly replaced by the word \u201croad\u201d, and every "
     "sum that depended on it produced nothing. One word, and it took out every pressure in the "
     "tab.", space_after=9)

body("What bothers me more is that my own checks ran green. They print a line per test case, and "
     "the command I used to read the output happened to cut off the column the pressure was in. "
     "So the suite looked healthy while every number in it was broken. Pressures are now checked "
     "explicitly, which is how I can tell you that all 1,152 combinations of the inputs are sound "
     "again rather than just the handful I happened to click.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Your two corrections")

h3("Gravel, often \u2192 semi-slick")

body("Done. That one cell doesn\u2019t follow from the arithmetic the previous version used, so "
     "tread is now simply a table of bike against gravel frequency — which is what it always was "
     "in your head, and is easier to correct next time:", space_after=9)

data_table(
    ["Bike", "Never", "Occasionally", "Often", "Most of the time"],
    [
        ["Road",            "Smooth",     "Smooth",     "Semi-Slick", "Knobby"],
        ["All-Road",        "Smooth",     "Smooth",     "Semi-Slick", "Knobby"],
        ["Gravel",          "Smooth",     "Semi-Slick", "Semi-Slick", "Knobby"],
        ["Adventure / MTB", "Semi-Slick", "Knobby",     "Knobby",     "Knobby"],
    ],
    [Inches(1.55), Inches(1.15), Inches(1.35), Inches(1.15), CONTENT_W - Inches(5.2)],
    mono_cols={0},
    vpad=54,
)
glue_rows(doc.tables[-1])   # keep all four rows on one page

h3("Riding style no longer touches the tread")

body("You were right that it was leaking in, though not by the route you\u2019d expect. Riding "
     "style picks the casing; an Extralight casing measures 3% wider; and the tab was matching "
     "your requested width against that finished figure. So changing riding style nudged every "
     "width, which occasionally tipped the choice onto a different tire and therefore a different "
     "tread.", space_after=8)

body("Matching now happens on the tire\u2019s width before casing and tubeless are applied. The "
     "finished width is still what you see and still what the pressure is worked out from — but "
     "riding style can no longer change which tire you are sent to. I checked all 864 combinations "
     "of wheel size, width, bike, gravel answer and tubes: the tread never moves.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Also settled")

body("Hurricane Ridge stays retired rather than deleted, so it can come back if people miss it. "
     "\u201cHow Wide Should I Run?\u201d keeps its own wording, since it carries both questions in "
     "one field. And your line about modern bikes having more clearance stays as reasoning rather "
     "than going on the page.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("One question")

question(
    "Q33",
    "Is it ready for the website?",
    "Everything from all four of your lists is done and I have nothing outstanding at my end. "
    "Putting it on the site is a separate job — the plugin gets a version, a release, and an "
    "install — and nothing has gone live at any point so far. Worth another pass from Natsuko "
    "first: she would have met the NaN too, so whatever she saw last time is not what the tab does "
    "now.")

# ═════════════════════════════════════════════════════════════════════════════
h2("Anything else")
doc.paragraphs[-1].paragraph_format.keep_with_next = True

cell = boxed_table(SH_RESPONSE, border_color="C9A227", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(0)
p.paragraph_format.line_spacing = 1.5
run(p, "Jan: ", font=SANS, size=9.5, bold=True, color=INK_SOFT)
run(p, "[type here]", font=SANS, size=9.5, italic=True, color=RGBColor(0xA8, 0xA2, 0x8E))
for _ in range(4):
    x = cell.add_paragraph()
    x.paragraph_format.space_after = Pt(0)
    x.paragraph_format.line_spacing = 1.5
    run(x, "", size=9.5)
cant_split(doc.tables[-1])

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - Pressure Fix.docx"
doc.save(OUT)
print("wrote", OUT)
