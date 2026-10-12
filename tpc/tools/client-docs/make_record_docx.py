"""Seventh round: the casing fix, and a standing record to return to after the break."""

from _docx_kit import *          # noqa: F401,F403
from _docx_kit import (doc, para, rich, body, h2, h3, hrule, spacer,
                       boxed_table, data_table, question, run, cant_split, glue_rows,
                       SERIF, SANS, MONO, INK, INK_SOFT, ACCENT, SETTLED,
                       SH_RESPONSE, CONTENT_W, Pt, Inches, RGBColor)

# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE FINDER", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "Where things stand", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "The casing mapping is fixed. Since we are not launching until I am back, the rest of "
     "this is a record rather than a request — every rule the tab now follows, in one place, so "
     "neither of us has to reconstruct it from a month of email.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Your notes: 21 Aug 2026", {}),
    ("     ", {}),
    ("25 tires live, 1 retired", {}),
    ("     ", {}),
    ("nothing on the site yet", {}),
], font=MONO, size=8.5, color=INK_SOFT, space_after=10)

# ═════════════════════════════════════════════════════════════════════════════
h2("The casing fix")

body("You were right: everyone but the careful rider was being sent to Standard. The cause is "
     "worth recording, because it was a decision of yours that had quietly outlived its reason.",
     space_after=9)

body("Back in Q4 you asked for the rider-weight casing rules to apply here as well. Those rules "
     "exist in \u201cHow Wide Should I Run?\u201d because tough casings are not made in the narrow "
     "widths that tab recommends to light riders — so it guesses at availability from weight. A "
     "fair guess for a tab with no catalog behind it.", space_after=9)

body("This tab has your catalog. It already knows exactly which casings each tire is built in. "
     "Guessing from weight on top of that was wrong twice over: it refused Endurance Plus to a "
     "light rider who had asked for a tire that comes in it, and it left riding style as the one "
     "answer a rider could watch failing to change anything.", space_after=9)

body("So riding style now maps straight to casing, as you set out. Availability is still enforced, "
     "but from the spreadsheet:", space_after=9)

data_table(
    ["Rider asks for", "Tire built in it", "Tire not built in it"],
    [
        ["Endurance Plus, 55 mm Fleecer Ridge", "Endurance Plus", "\u2014"],
        ["Endurance Plus, 26 mm Cayuse Pass",   "\u2014",
         "Standard, and the result says why"],
    ],
    [Inches(2.5), Inches(1.6), CONTENT_W - Inches(4.1)],
    vpad=54,
)
glue_rows(doc.tables[-1])

para(doc,
     "Weight still decides the pressure. It no longer decides the casing. "
     "\u201cHow Wide Should I Run?\u201d keeps its weight rules untouched — it recommends a width "
     "itself and has no catalog to check against, which is the case they were written for.",
     size=9.5, color=INK_SOFT, space_before=7, space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("How the Tire Finder decides")

h3("Tread — your bike and how often you ride gravel")

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
    vpad=52,
)
glue_rows(doc.tables[-1])

h3("Casing — riding style, then what the tire is actually built in")

data_table(
    ["Riding style", "Casing"],
    [
        ["I'm a smooth rider who picks the best lines",  "Extralight or Standard"],
        ["My tires need to handle whatever road or trail throws at them", "Endurance"],
        ["I'm racing in a peloton and want to avoid flats", "Endurance Plus"],
    ],
    [CONTENT_W - Inches(2.1), Inches(2.1)],
    vpad=52,
)
glue_rows(doc.tables[-1])

h3("Width — what a tire actually measures")

data_table(
    ["Step", "Effect"],
    [
        ["Baseline from the spreadsheet",  "the tire on its design rim, tubed, in a casing other than Extralight"],
        ["+ 0.3 mm per mm of extra rim",   "only if the rider gave a rim wider than the design rim"],
        ["\u00d7 1.03 if Extralight",      "Extralight casings measure about 3% wider"],
        ["\u00d7 1.01 if tubeless",        "a tubeless setup adds about 1%"],
    ],
    [Inches(2.3), CONTENT_W - Inches(2.3)],
    mono_cols={0},
    vpad=52,
)
glue_rows(doc.tables[-1])

para(doc,
     "Matching against the width a rider asks for happens on the first two steps only, so riding "
     "style cannot change which tire they are sent to. The finished figure is what the result shows "
     "and what the pressure is worked out from.",
     size=9.5, color=INK_SOFT, space_before=7, space_after=8)

h3("Which tire")

body("Nearest width wins — except that a tire carrying the tread the rider asked for wins if it is "
     "within 2.5 mm. Where two tires tie, the one with the right tread takes it, then the one "
     "matching tubes or tubeless, then the Priority column. Tubeless narrows the field first, so "
     "the answer is the nearest tubeless tire rather than none at all.", space_after=8)

h3("Will It Fit?")

body("Widest tire = 2 \u00d7 (tightest clearance \u2212 4 mm) + the tire you run now, the 4 mm "
     "being the ISO figure and the gap measured on one side. Under 4 mm it says there is no room "
     "rather than returning a number narrower than the tire already fitted.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Settled along the way")

body("The decisions behind all of that, and where each was made — so a question we have already "
     "answered doesn't get reopened from memory in October.", space_after=9)

data_table(
    ["Decision", "Settled"],
    [
        ["Pressure comes from the width the tire actually measures, not the width asked for", "Aug 10"],
        ["Extralight width is the one quoted, since a narrower tire still fits", "Q15"],
        ["Tire names are fixed per tire, from your Nominal Size 2 column", "Q16, Aug 19"],
        ["The size note appears only when the tire is 1.5 mm or more off", "Q17"],
        ["Width beats tread — unless the right tread is within 2.5 mm", "Q18, Q27"],
        ["Rim width optional; blank means the tire's design rim", "Q29"],
        ["Rim limits stay off the spreadsheet; the product page carries them", "Q22"],
        ["Wider / narrower hold the tread and change only width", "Aug 20"],
        ["Frame clearance uses the ISO 4 mm, not 3 mm", "Aug 21"],
        ["Riding style decides the casing and nothing else", "Aug 21"],
        ["Hurricane Ridge retired rather than deleted, so it can return", "Q31"],
        ["\u201cHow Wide Should I Run?\u201d keeps its own wording", "Q32"],
    ],
    [CONTENT_W - Inches(1.0), Inches(1.0)],
    vpad=46,
)
glue_rows(doc.tables[-1])

# ═════════════════════════════════════════════════════════════════════════════
h2("What is left")

cell = boxed_table("E8F4EE", border_color="2D6A4F", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "NOTHING HAS GONE LIVE", font=MONO, size=8.5, bold=True, color=SETTLED, spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "The calculator on the site is untouched and has been throughout — everything so far has "
        "been a preview copy. Launching is a version number, a release and an install: half a day, "
        "and no decisions left in it. Worth one more pass from Natsuko first, since the version she "
        "tested had the pressure fault. The catalog stands at 25 tires across 26\u2033, 650B and "
        "700C, with Hurricane Ridge retired.",
    size=10, color=INK)

# ═════════════════════════════════════════════════════════════════════════════
h2("One question, whenever suits")

question(
    "Q34",
    "You wrote \u201cStandard or Extralight\u201d. The tab says \u201cExtralight or Standard\u201d. "
    "Which way round?",
    "The same two casings either way — but \u201cHow Wide Should I Run?\u201d has said Extralight "
    "first since long before any of this, so I left it alone rather than have the two tabs word the "
    "same phrase differently. If you meant it as written I will change both.")

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

spacer(12)
hrule(doc, space_before=4, space_after=8)
para(doc,
     "Have a good month (or so). Anything that occurs to you while I am away can wait in the box "
     "above. Nothing here is going anywhere.",
     size=9.5, color=INK_SOFT, space_after=0)

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - Where Things Stand.docx"
doc.save(OUT)
print("wrote", OUT)
