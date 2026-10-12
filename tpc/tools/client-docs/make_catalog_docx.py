"""Third round: answers to Jan's two emailed questions, and three new decisions.

Reuses the layout kit so all three documents match.
"""

from _docx_kit import *          # noqa: F401,F403
from _docx_kit import (doc, para, rich, body, h2, h3, hrule, spacer,
                       boxed_table, data_table, question, run,
                       SERIF, SANS, MONO, INK, INK_SOFT, ACCENT, SETTLED,
                       SH_RESPONSE, CONTENT_W, Pt, Inches, RGBColor)

# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE FINDER", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "Your full catalog is in", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "All 26 tires are loaded and the finder is running on them. Here are the answers to your "
     "two questions, and three things the bigger catalog has brought to light.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Catalog received: 19 Aug 2026", {}),
    ("     ", {}),
    ("26 tires, 3 wheel sizes", {}),
    ("     ", {}),
    ("3 open questions", {}),
], font=MONO, size=8.5, color=INK_SOFT, space_after=4)

cell = boxed_table(SH_RESPONSE, border_color="C9A227", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "HOW TO USE THIS DOCUMENT", font=MONO, size=8.5, bold=True,
    color=RGBColor(0x8A, 0x6D, 0x1C), spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "Your two questions are answered below — nothing needed there. The three after them have "
        "the usual cream boxes. Q25 and Q26 are one-word answers; Q27 is the one worth a minute.",
    size=10, color=INK)

spacer(10)

# ═════════════════════════════════════════════════════════════════════════════
h2("Your two questions")

h3("Will every 700C tire read 700C / 29\u2033 x 26 mm Cayuse Pass?")

body("No — and that was my wording, not your reading. The rule applies to the spreadsheet cell, "
     "not to the tire's name. Only the Wheel Size cell has to be spelled the same on every row, "
     "because that cell becomes the label in the rider's wheel-size menu. The name itself uses "
     "just the part before the slash, so it comes out as 700C x 26 mm Cayuse Pass.", space_after=9)

h3("Does the width in parentheses change with the rider's inputs?")

body("It did. It doesn't now — your Nominal Size 2 column is printed exactly as you typed it, and "
     "nothing recalculates it. Naches Pass reads (42 mm) whether the rider picked tubes or "
     "tubeless. Blank means no parentheses at all. Every name below is what the finder actually "
     "produced from your sheet this morning:", space_after=9)

data_table(
    ["Sheet row", "What the rider sees"],
    [
        ["Cayuse Pass",             "700C x 26 mm Cayuse Pass"],
        ["Fleecer Ridge",           "700C x 55 mm Fleecer Ridge (29\" x 2.2\")"],
        ["Loup Loup Pass",          "650B x 38 mm Loup Loup Pass"],
        ["Umtanum Ridge",           "650B x 2.3\" Umtanum Ridge (54 mm)"],
        ["Naches Pass, with tubes", "26\" x 1.8\" Naches Pass (42 mm)"],
        ["Naches Pass, tubeless",   "26\" x 1.8\" Naches Pass (42 mm)"],
    ],
    [Inches(1.95), CONTENT_W - Inches(1.95)],
    mono_cols={0},
    vpad=58,
)

para(doc,
     "The measured width still appears, on its own line in the result, where it does move with "
     "casing and tubeless — 42.2 mm tubed, 42.7 mm tubeless for that Naches Pass. Your note about "
     "sidewall numbers sits underneath it.",
     size=9.5, color=INK_SOFT, space_before=7, space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
cell = boxed_table("E8F4EE", border_color="2D6A4F", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "ALSO WORTH KNOWING", font=MONO, size=8.5, bold=True, color=SETTLED, spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "You don't need to worry about the sheet's tab name or the order of the columns — the "
        "importer finds what it needs by the column headings. The two Semi-Slick tires are the "
        "first the finder has ever had, so the tread rules we agreed on are now doing "
        "real work rather than sitting idle.",
    size=10, color=INK)

# ═════════════════════════════════════════════════════════════════════════════
h2("Three things to decide")

h3("Small")

question(
    "Q25",
    "Should 650B read 650B / 27.5\u2033, to match the other two?",
    "You wrote 26\u2033, 650B, and 700C / 29\u2033. It works exactly as it is — all six 650B rows "
    "agree with each other, so there's no duplicate menu entry — but the menu currently reads "
    "26\u2033 · 650B · 700C / 29\u2033 and the odd one out shows.")

question(
    "Q26",
    "Stampede Pass and Orondo Grade both come out at 31.9 mm. Which should a rider get?",
    "Both are Smooth All-Road on a 31 mm baseline, so for someone asking around 31 mm with tubes "
    "the winner is currently decided by which one appears first on the sheet — not a choice anyone "
    "made. Tubeless already picks Orondo Grade, since Stampede isn't tubeless. A number in the "
    "Priority column on whichever you'd rather recommend settles it; lower wins.")

h3("Worth a minute")

question(
    "Q27",
    "Should a rider's tread choice be allowed to win when the better-matching tire is only a "
    "millimeter or two away?",
    "You settled in Q18 that width wins, and that is how it works today. But you decided that "
    "against the 26\u2033 range, where the nearest knobby tire was eleven millimeters away and the "
    "answer was obvious. With the full catalog the gaps are about a millimeter, and the rule now "
    "bites where it didn't. Someone on rough terrain asking for 56 mm gets Antelope Hill, which is "
    "smooth, because Fleecer Ridge — knobby, and arguably the tire they were describing — sits "
    "1.7 mm further from the number they typed. My suggestion: keep width first, but if a tire "
    "with the tread they asked for is within about 2 mm, prefer it.")

# ═════════════════════════════════════════════════════════════════════════════
h2("One to glance at")

body("Five tires measure about 2 mm away from their nominal size, which is entirely normal — "
     "except that they don't all lean the same way. Switchback Hill is a 48 that measures 50, "
     "while Snoqualmie Pass is a 44 that measures 42. Both are plausible; I mention it only "
     "because a transposed pair of numbers would look exactly like this. No answer needed if "
     "they're right.", space_after=8)

# ═════════════════════════════════════════════════════════════════════════════
h2("Anything else")

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
     "Nothing here blocks anything — the finder works on all 26 tires today, and Q25 through Q27 "
     "only make it work better. Next from me is the rim-width version, unless you'd rather see "
     "something else first.",
     size=9.5, color=INK_SOFT, space_after=0)

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - Full Catalog Notes.docx"
doc.save(OUT)
print("wrote", OUT)
