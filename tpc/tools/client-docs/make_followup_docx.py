"""Follow-up to Jan's 14 August answers: what got built, and what is still open.

Reuses the layout kit from the first handoff so the two documents match.
"""

from _docx_kit import *          # noqa: F401,F403  — doc, helpers, palette
from _docx_kit import (doc, para, rich, body, h2, h3, hrule, spacer,
                       boxed_table, data_table, question, run, keep_together,
                       SERIF, SANS, MONO, INK, INK_SOFT, ACCENT, SETTLED,
                       SH_RESPONSE, CONTENT_W, Pt, Inches, RGBColor)

# ═════════════════════════════════════════════════════════════════════════════
# Masthead
# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE FINDER", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "The 26-inch tab, and what's still open", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "Your 14 August answers were enough to build it. This covers the decisions I had to make "
     "where an answer didn't quite reach, and the handful of things I still need from you.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Answers received: 14 Aug 2026", {}),
    ("     ", {}),
    ("26\u2033 tab built and working", {}),
    ("     ", {}),
    ("10 open questions", {}),
], font=MONO, size=8.5, color=INK_SOFT, space_after=4)

cell = boxed_table(SH_RESPONSE, border_color="C9A227", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "HOW TO USE THIS DOCUMENT", font=MONO, size=8.5, bold=True,
    color=RGBColor(0x8A, 0x6D, 0x1C), spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "Same as last time — type into the cream box under each question. Questions pick up where "
        "the last document left off, so this one starts at Q15. Several are just \"is this what you "
        "meant?\"; a one-word answer is plenty. Q15 is the one that changes a number riders will see.",
    size=10, color=INK)

spacer(10)

# ═════════════════════════════════════════════════════════════════════════════
cell = boxed_table("E8F4EE", border_color="2D6A4F", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "WHAT'S WORKING NOW", font=MONO, size=8.5, bold=True, color=SETTLED, spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "The 26\u2033 tab is built from the four rows on your sheet and runs end to end. It takes "
        "wheel size, the width the rider wants, tubes or tubeless, terrain, the new gravel-frequency "
        "question, riding style and weights, then returns the tire, the casing, the tread and the "
        "pressure. The rider-weight casing rules from \u201cHow Wide Should I Run?\u201d are applied "
        "as you asked; a tubeless request in a size with no tubeless option gets the nearest tubeless "
        "tire rather than nothing; and whenever the catalog overrides an answer, the result says so. "
        "Adding 650B and 700C is rows on the spreadsheet — no code.",
    size=10, color=INK)

# ═════════════════════════════════════════════════════════════════════════════
h2("What I changed in your spreadsheet")

body("The file is now Tire Catalog.xlsx, beside this document. Your figures are untouched — these "
     "are the housekeeping changes.", space_after=9)

data_table(
    ["What", "Why"],
    [
        ["The four casing columns",
         "Lower-case y normalized to Y, so the sheet reads consistently."],
        ["Calculation Width (mm)",
         "Blanked. Every row said \u201csame as actual width\u201d, which is a rule rather than data — "
         "so the calculator now applies it and the column is left for it to fill."],
        ["Display Name",
         "Blanked. See **Q16** — the width in the name moves with casing and tubeless, so the "
         "calculator builds the name instead."],
        ["Pink highlighting",
         "Cleared. It marked the cells the draft hadn't answered, and you have since filled every one."],
        ["Column Guide",
         "Rewritten. It still described Actual Width Low and High, which you replaced with Design Rim "
         "Width and Actual Width Baseline, and it pointed at the wrong question number for tubeless."],
    ],
    [Inches(1.85), CONTENT_W - Inches(1.85)],
    mono_cols={0},
    vpad=60,
)

# ═════════════════════════════════════════════════════════════════════════════
h2("Decisions I had to make")

body("Each of these is somewhere an answer stopped just short. I picked what looked most consistent "
     "with the rest of what you said, and the tab is running on these choices now.", space_after=4)

h3("The one that changes a number")
question(
    "Q15",
    "When the recommendation names two casings — \u201cExtralight or Standard\u201d — which one "
    "should the width and the pressure be calculated from?",
    "They measure differently: Extralight is baseline \u00d7 1.03, Standard is baseline \u00d7 1.00. "
    "On Naches Pass that is 42.2 mm against 41.0 mm, so both the size shown and the pressure move. "
    "I have used the Extralight width, because it reproduces all four display names on your sheet "
    "exactly — 29\u219230, 41\u219242, 52\u219254. If that was a coincidence rather than your "
    "convention, say so; it is a one-line change.")

h3("Presentation and wording")
question(
    "Q16",
    "I blanked the Display Name column and the calculator now builds the name itself. Right call?",
    "Your names had the width baked in — 26\" x 1.8\" Naches Pass (42 mm) — but the width now moves "
    "with casing and tubeless, so a fixed name would contradict the pressure printed beside it. The "
    "calculator applies your Q12 rule instead: nominal size plus the computed width. Filling a cell "
    "still overrides it for that one tire.")

question(
    "Q17",
    "How far off does the size have to be before the rider is told — and do you want the "
    "\u201cOn your rims\u2026\u201d explainer you raised in Q5?",
    "A 42 mm tire set up tubeless measures 42.7 mm, and announcing \u201cyou asked for 42 mm, this "
    "measures 43 mm\u201d about the 42 mm tire reads as a fault rather than an explanation. I show "
    "the note only when the gap is 1.5 mm or more. Your \u201cOn your rims\u2026\u201d idea is the "
    "better long-term answer, but it needs the rim-width input — see Q21.")

h3("Where two of your answers pull against each other")
question(
    "Q18",
    "When the width asked for and the tread that suits the terrain can't both be had, width wins. "
    "Agreed?",
    "On 26\u2033 a gravel rider asking for 42 mm gets Naches Pass, which is smooth — the only knobby "
    "26\u2033 tire is 52 mm, eleven millimeters away. The result explains itself: \u201cNaches Pass "
    "is only available with a Smooth All-Road tread.\u201d Q2 settled which way to substitute when a "
    "tread isn't made in a size; it didn't cover width and tread pointing in opposite directions.")

question(
    "Q19",
    "In the new gravel question, \u201cOccasionally\u201d and \u201cNever\u201d both map to the less "
    "knobby tread — so the two options do the same thing. Drop one, or should they differ?",
    "As written the question offers four choices and produces three outcomes. On 26\u2033 it hardly "
    "shows, because there is no semi-slick tire to choose — but it will show on 650B and 700C.")

# ═════════════════════════════════════════════════════════════════════════════
h2("One check on the numbers")

question(
    "Q20",
    "Naches Pass in Standard or Endurance, with tubes, on a 20 mm rim works out at 41 mm. Is that "
    "right?",
    "The 10 August draft gave 42\u201344 mm. The 44 falls out nicely — Extralight, tubeless, on a "
    "wider rim. But the plain Standard figure lands a millimeter under the range you quoted, which "
    "makes me want to confirm the baseline is 41 and not 42 before 650B and 700C are entered the "
    "same way.")

# ═════════════════════════════════════════════════════════════════════════════
h2("Before rim width can happen")

question(
    "Q21",
    "I've treated rim width as a second version. Any objection?",
    "You asked what I thought. It is a good model, and the spreadsheet already carries Design Rim "
    "Width so nothing is wasted. But it adds two inputs, needs rim limits I don't have, and leaves "
    "your own \u201cOn your rims\u2026\u201d question unanswered. The 26\u2033 tab works today with "
    "every tire treated as sitting on its design rim.")

question(
    "Q22",
    "Minimum and maximum rim width — spreadsheet columns, or a generic note pointing riders at the "
    "web page?",
    "You offered both and left it open. It only bites once rim width is an input, but if you'd "
    "rather have the columns, say so before you fill in 650B and 700C — otherwise that is data "
    "entered twice.")

# ═════════════════════════════════════════════════════════════════════════════
h2("Small confirmations")

question(
    "Q23",
    "Both tabs now read \u201cMy tires need to handle whatever the road or trail throws at "
    "them.\u201d Is that the wording you meant?",
    "You said change both and use \u201cthrows\u201d. I took the draft's phrasing and fixed the "
    "grammar — the existing tab had \u201cwhatever the trail throws at them\u201d, with no road.")

question(
    "Q24",
    "\u201cHow Wide Should I Run?\u201d now ends with a link reading \u201cFind Rene Herse tires "
    "this width\u201d, which carries the width across to the Tire Finder. Link or button?",
    "You suggested either. A link inside the result card felt less shouty than a button next to the "
    "pressure, but it is a two-minute change.")

# ═════════════════════════════════════════════════════════════════════════════
h2("Anything else")

body("Corrections, things I've misread, questions back to me — whatever doesn't fit above.",
     space_after=8)

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

spacer(12)
hrule(doc, space_before=4, space_after=8)
para(doc,
     "Q15 is the only one holding up a number a rider will see; the rest can be answered at leisure "
     "and the tab keeps working meanwhile. Once 650B and 700C are on the spreadsheet they should "
     "need nothing from me beyond a look at the result.",
     size=9.5, color=INK_SOFT, space_after=0)

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - 26in Build Notes and Follow-Up.docx"
doc.save(OUT)
print("wrote", OUT)
