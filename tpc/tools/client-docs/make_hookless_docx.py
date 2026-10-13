"""Ninth round: Jan's 12 Oct answers built; the ETRTO hookless table (Q38–Q39)."""

from _docx_kit import *          # noqa: F401,F403
from _docx_kit import (doc, para, rich, body, h2, h3, hrule, spacer,
                       boxed_table, data_table, question, run, cant_split, glue_rows,
                       SERIF, SANS, MONO, INK, INK_SOFT, ACCENT, SETTLED,
                       SH_RESPONSE, CONTENT_W, Pt, Inches, RGBColor)


def item(lead, text, space_after=5):
    rich(doc, [(lead + " ", {"bold": True, "color": INK}), (text, {})],
         size=10.5, color=INK_SOFT, space_after=space_after, line=1.35)


# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE FINDER", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "Hookless rims", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "Your spreadsheet and answers are in. The new ETRTO table is the last open item, and I "
     "have a proposal for it.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Your notes: 12 Oct 2026", {}),
    ("     ", {}),
    ("all built", {}),
    ("     ", {}),
    ("2 questions", {}),
], font=MONO, size=8.5, color=INK_SOFT, space_after=10)

# ═════════════════════════════════════════════════════════════════════════════
h2("Done")

item("Maximum pressure.", "Both columns are used: the finder picks the tubes or tubeless figure "
     "from the rider\u2019s choice. With your numbers, no recommendation is ever above a tire\u2019s "
     "maximum. \u201cPlease select a wider tire\u201d appears only for very heavy riders on Cayuse "
     "Pass, or tubeless on Bon Jon Pass or Steilacoom.")
item("Endurance.", "Tires not made in Endurance now say nothing, as you asked.")
item("Links.", "Every tire name links to its page, with the sealant or TPU tube line below.")
item("Warning.", "Your text is at the bottom of the Tire Finder and How Wide Should I Run?")
item("32\u2033.", "Indiana Pass is in, listed after 26\u2033 so 700C stays the default.",
     space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Hookless: my proposal")

body("A rule in the code rather than a spreadsheet column. The limit depends on the tire\u2019s "
     "width and the rim, not on which tire it is, so one table covers every tire \u2014 and when "
     "ETRTO changes it again, I change six lines instead of you changing 27 cells.", space_after=8)

body("The same table would serve both the Tire Pressure Calculator and the Tire Finder:",
     space_after=9)
doc.paragraphs[-1].paragraph_format.keep_with_next = True   # don't strand it above the table

data_table(
    ["Tire width", "Hookless maximum"],
    [
        ["25\u201329 mm", "5 bar (72.5 psi)"],
        ["30\u201334 mm", "4.5 bar (65 psi)"],
        ["35\u201339 mm", "4 bar (58 psi)"],
        ["40\u201344 mm", "3.5 bar (51 psi)"],
        ["45\u201354 mm", "3 bar (44 psi)"],
        ["55\u201364 mm", "2.5 bar (36 psi)"],
    ],
    [Inches(1.75), CONTENT_W - Inches(1.75)],
    mono_cols={0},
    vpad=54,
)
glue_rows(doc.tables[-1])

spacer(6)
item("Tire Pressure Calculator.", "The table replaces today\u2019s single 5 bar limit. "
     "\u201cDon\u2019t know\u201d still counts as hookless, as it does now. This changes the live "
     "calculator, so it would go out together with the Tire Finder.")
item("Tire Finder.", "The limit becomes the lower of the tire\u2019s maximum and the hookless "
     "maximum \u2014 your \u201cwhichever is lowest\u201d \u2014 and goes through the same steps: "
     "soft pressure, then Endurance, then \u201cPlease select a wider tire.\u201d", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Two questions")

question(
    "Q38",
    "Should the table use the width printed on the tire, or the width it measures?",
    "I suggest the printed width, since that is what ETRTO sizes refer to. It matters at the band "
    "edges: Antelope Hill is sold as 55 mm (2.5 bar) but measures about 54 mm (3 bar).")

question(
    "Q39",
    "Shall I add a Rim Type question to the Tire Finder?",
    "It has no way to know about hookless rims today. Same choices as the calculator: Hooked, "
    "Hookless, Don\u2019t know.")

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

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - Hookless Rims.docx"
doc.save(OUT)
print("wrote", OUT)
