"""Fourth round: the bug Natsuko found, and everything from Jan's 20 August list."""

from _docx_kit import *          # noqa: F401,F403
from _docx_kit import (doc, para, rich, body, h2, h3, hrule, spacer,
                       boxed_table, data_table, question, run, cant_split,
                       SERIF, SANS, MONO, INK, INK_SOFT, ACCENT, SETTLED,
                       SH_RESPONSE, CONTENT_W, Pt, Inches, RGBColor)

# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE FINDER", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "Fixed, and all four built", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "Natsuko found a real fault and everything on your list is now in. Here is what was actually "
     "wrong, what the three additions do, and two small things to confirm.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Your notes: 20 Aug 2026", {}),
    ("     ", {}),
    ("bug fixed, 3 features added", {}),
    ("     ", {}),
    ("2 open questions", {}),
], font=MONO, size=8.5, color=INK_SOFT, space_after=4)

cell = boxed_table(SH_RESPONSE, border_color="C9A227", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "HOW TO USE THIS DOCUMENT", font=MONO, size=8.5, bold=True,
    color=RGBColor(0x8A, 0x6D, 0x1C), spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "Mostly a report — only Q28 and Q29 need you, and both are one-liners. Worth passing the "
        "last page to Natsuko before she tests again, because one of the new features will change "
        "answers she has already seen.",
    size=10, color=INK)

spacer(10)

# ═════════════════════════════════════════════════════════════════════════════
h2("The fault Natsuko found")

body("She was right that something was wrong, though not about the cause — worth explaining, "
     "because the real reason is a decision you and I made together.", space_after=9)

body("The field was recalculating. Every change ran the calculator; the answer simply never moved. "
     "She asked for 650B at 50 mm, and the two tires in contention were these:", space_after=9)

data_table(
    ["Tire", "Measures", "Off by", "Tread"],
    [
        ["Juniper Ridge",   "50.5 mm", "0.5 mm", "Dual-Purpose Knobby"],
        ["Switchback Hill", "51.5 mm", "1.5 mm", "Smooth All-Road"],
    ],
    [Inches(1.7), Inches(1.1), Inches(0.9), CONTENT_W - Inches(3.7)],
    mono_cols={0},
    vpad=58,
)

para(doc,
     "Width decided the model outright, which is what Q18 settled, so the knobby tire won by one "
     "millimeter no matter what she said about gravel. That is exactly the problem you fixed in "
     "Q27 — I had simply not yet applied your 2.5 mm band. With it in, her inputs return "
     "Switchback Hill, and the gravel question visibly changes the answer.",
     size=10.5, color=INK, space_before=8, space_after=8)

body("Your instinct about the default was right too, just for a different reason. The field opened "
     "on \u201cMost of the time\u201d, so anyone who never touched it was telling us they ride "
     "gravel constantly. It now opens on \u201cOccasionally\u201d.", space_after=8)

body("Two things had hidden this. On 26\u2033 the nearest knobby tire was eleven millimeters away, "
     "so width-wins looked obviously right. And the full catalog closed those gaps to about a "
     "millimeter, which is where the rule started to bite.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("The three additions")

h3("Rim width")

body("A wider rim spreads the tire, as you set out: 0.3 mm for every millimeter of rim above the "
     "one the tire was designed around. A narrower rim doesn't make the tire narrower. Naches "
     "Pass, designed around a 20 mm rim:", space_after=9)

data_table(
    ["Rim entered", "Tire measures"],
    [
        ["blank",  "42.2 mm  — assumes the tire's design rim"],
        ["18 mm",  "42.2 mm  — narrower rim, no change"],
        ["23 mm",  "43.2 mm"],
        ["25 mm",  "43.8 mm"],
    ],
    [Inches(1.5), CONTENT_W - Inches(1.5)],
    mono_cols={0},
    vpad=52,
)

para(doc,
     "When the rim does widen the tire the result says so — \u201cOn your 25 mm rims this tire "
     "measures 43.8 mm, about 1.5 mm wider than on the 20 mm rim it is designed around\u201d — "
     "which is the explainer you asked for back in Q5.",
     size=9.5, color=INK_SOFT, space_before=7, space_after=8)

h3("Go wider and Go narrower")

body("Two buttons on the result, always visible, stepping through every tire in that wheel size "
     "by measured width, dimming when there is nothing further that way. The result keeps saying which tire we would "
     "have picked, with a link back to it, and changing any answer returns to normal.", space_after=8)

body("One deliberate quirk: stepping can land on a tire of the same width but a different tread — "
     "Babyshoe Pass to Pumpkin Ridge, for instance. That looked wrong until I remembered your "
     "reason for wanting the buttons, which was to let people see tread and casing options and "
     "not just a different number. Say if you'd rather it skipped to the next width.", space_after=8)

h3("Will It Fit?")

body("A third tab automating your formula — max width = 2 \u00d7 (tightest clearance \u2212 3 mm) "
     "+ current tire width. I read \u201ctightest clearance\u201d as the gap on one side, so the "
     "3 mm allowance and the space freed up both count twice: 6 mm of clearance around a 32 mm "
     "tire gives 38 mm. Below 3 mm it stops and says there is no room, rather than returning a "
     "number narrower than the tire already fitted.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Two to confirm")

question(
    "Q28",
    "The new tab is called \u201cWill It Fit?\u201d. Is that the name you want?",
    "You called it \u201chow wide a tire can I fit\u201d, which is clearer on its own — but it "
    "sits directly beside \u201cHow Wide Should I Run?\u201d, and two labels that similar are hard "
    "to tell apart in a row of tabs. Yours is one line to restore if you'd rather have it.")

question(
    "Q29",
    "Rim width is optional — blank means the tire's design rim. Should it stay that way?",
    "Plenty of riders won't know their internal rim width, and demanding it would stop them getting "
    "an answer at all. The cost is that anyone who leaves it blank gets the design-rim figure, "
    "which on a modern wide rim runs a millimeter or two narrow. The alternative is to require it "
    "and send people to the measuring instructions first.")

# ═════════════════════════════════════════════════════════════════════════════
h2("For Natsuko")

cell = boxed_table("E8F4EE", border_color="2D6A4F", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "BEFORE SHE TESTS AGAIN", font=MONO, size=8.5, bold=True, color=SETTLED, spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "Her original case now returns Switchback Hill rather than Juniper Ridge, and the gravel "
        "question changes the answer as it should. One thing to expect: if she fills in her rim "
        "width, recommendations and pressures will differ from what she saw before. That is the "
        "new feature working, not a fresh fault — every tire measures wider on a wide rim. Leaving "
        "the field blank reproduces the old behavior exactly.",
    size=10, color=INK)

# ═════════════════════════════════════════════════════════════════════════════
h2("Anything else")
doc.paragraphs[-1].paragraph_format.keep_with_next = True   # the rule under the heading

cell = boxed_table(SH_RESPONSE, border_color="C9A227", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(0)
p.paragraph_format.line_spacing = 1.5
run(p, "Jan: ", font=SANS, size=9.5, bold=True, color=INK_SOFT)
run(p, "[type here]", font=SANS, size=9.5, italic=True, color=RGBColor(0xA8, 0xA2, 0x8E))
for _ in range(5):
    x = cell.add_paragraph()
    x.paragraph_format.space_after = Pt(0)
    x.paragraph_format.line_spacing = 1.5
    run(x, "", size=9.5)
cant_split(doc.tables[-1])

spacer(12)
hrule(doc, space_before=4, space_after=8)
para(doc,
     "Nothing outstanding at my end. When you and Natsuko are happy with how it behaves, the next "
     "step is putting it on the site — that is a separate job and nothing has gone live yet.",
     size=9.5, color=INK_SOFT, space_after=0)

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - Fixes and Additions.docx"
doc.save(OUT)
print("wrote", OUT)
