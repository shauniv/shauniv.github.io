"""Eighth round: Jan's 10 Oct list — max pressure, Endurance, links (Q35–Q37)."""

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

para(doc, "Pressure limits and links", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "Everything on your list is built. Three parts need numbers or links from you before they "
     "show on the page; the spreadsheet attached has a column ready for each.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Your notes: 10 Oct 2026", {}),
    ("     ", {}),
    ("all built", {}),
    ("     ", {}),
    ("3 questions", {}),
], font=MONO, size=8.5, color=INK_SOFT, space_after=10)

# ═════════════════════════════════════════════════════════════════════════════
h2("Done")

item("Casing wording.", "Stays \u201cExtralight or Standard\u201d, as you said.")
item("Your text changes.", "Rim width, gravel, the How Wide intro and its last line, and "
     "\u201cin anger\u201d \u2014 all as you wrote them. I also took \u201cwe\u2019ll assume the "
     "design rim\u201d out of the rim field\u2019s pop-up, for the same reason.")
item("Wheel sizes.", "700C first, then 650B, then 26\u2033. A 32\u2033 size would go last until "
     "you decide where it belongs.")
item("Less Smooth All-Road.", "When the tread a rider needs isn\u2019t made near their width, the "
     "finder now steps toward knobby, not smooth. Only riders who should get Semi-Slick are "
     "affected: a 650B rider asking for 42 mm with a Gravel bike, ridden on gravel occasionally, now "
     "gets Pumpkin Ridge instead of Babyshoe Pass.")
item("How Wide \u2192 Tire Finder.", "The link now carries your How Wide answers across, so an old "
     "Tire Finder choice can no longer turn a Road answer into a knobby. Wheel size, rim and "
     "tubeless are kept, since How Wide doesn\u2019t ask.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("What needs your spreadsheet")

body("Three new columns on the right. A blank cell just means that tire goes without, so you can "
     "fill them in any order.", space_after=9)
doc.paragraphs[-1].paragraph_format.keep_with_next = True   # don't strand it above the table

data_table(
    ["Column", "What it does"],
    [
        ["Max Pressure (psi)", "A number, e.g. 90. Drives the rules below."],
        ["Product Link", "The tire\u2019s product page. The tire name becomes the link, with "
                         "\u201cClick on the recommended tire for more information or to purchase.\u201d"],
        ["TPU Tube Link", "The right TPU tube for that tire, shown to riders on tubes."],
    ],
    [Inches(1.75), CONTENT_W - Inches(1.75)],
    mono_cols={0},
    vpad=54,
)
glue_rows(doc.tables[-1])

spacer(6)
body("Riders who choose tubeless see the sealant line instead, with your link.", space_after=9)

h3("How the maximum is used")

body("Exactly as you suggested, with your 80% idea added after it:", space_after=6)
item("1.", "Over the tire\u2019s maximum: use the soft pressure, whatever else was chosen.")
item("2.", "Over 80% of the maximum: recommend Endurance.")
item("3.", "Still over the maximum: no pressure, and your message \u2014 \u201cPlease select a wider "
     "tire.\u201d The tire stays on screen, so Go wider is one click away.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Three questions")

body("Q35 is the one worth a minute; the other two are quick.", space_after=9)

question(
    "Q35",
    "Endurance: is the 80% rule right, and what about tires not made in Endurance?",
    "I chose 80% over a second column: one number instead of 25, easy to change later, and it "
    "isn\u2019t circular, because it is checked after the switch to soft. The catch: Cayuse, Chinook "
    "and Stampede Pass aren\u2019t made in Endurance, and they are exactly the narrow tires this is "
    "for. For now those say: \u201cAt this pressure, we\u2019d recommend the Endurance casing, which "
    "this tire isn\u2019t made in. Go wider for a tire that is.\u201d OK, or would you rather they "
    "said nothing?")

question(
    "Q36",
    "Is one maximum per tire enough?",
    "If the maximum differs by casing, or for tubeless, the spreadsheet needs more than one column. "
    "If it\u2019s the number on the sidewall whatever the build, one column does it.")

question(
    "Q37",
    "Is this the right sealant page?",
    "The link you sent sits under the 26\u2033 tires section: "
    "**renehersecycles.com/shop/components/tires/26-inch/rene-herse-tubeless-sealant/**. It may be "
    "correct, but it\u2019s worth a click before it goes live.")

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

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - Pressure Limits and Links.docx"
doc.save(OUT)
print("wrote", OUT)
