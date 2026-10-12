"""Fifth round: the tread model rebuilt, plus the rest of Jan's 20 August list."""

from _docx_kit import *          # noqa: F401,F403
from _docx_kit import (doc, para, rich, body, h2, h3, hrule, spacer,
                       boxed_table, data_table, question, run, cant_split,
                       SERIF, SANS, MONO, INK, INK_SOFT, ACCENT, SETTLED,
                       SH_RESPONSE, CONTENT_W, Pt, Inches, RGBColor)

# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE FINDER", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "The gravel question now counts", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "Your two complaints turned out to be the same fault, and finding that is what fixed it. "
     "Everything else on your list is in as well. The one thing worth your eye is the new tread "
     "logic, laid out overleaf.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Your notes: 20 Aug 2026", {}),
    ("     ", {}),
    ("7 items, all done", {}),
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
run(p2, "Q30 is the one that matters — it is the whole tread model on a single table, and it is "
        "easier to check there than by clicking through combinations. Q31 and Q32 are small.",
    size=10, color=INK)

spacer(10)

# ═════════════════════════════════════════════════════════════════════════════
h2("Your two complaints were one fault")

body("You reported that a Road bike answering \u201cgravel often\u201d still gave a smooth tire, "
     "and separately that Bike / Terrain and the gravel question overlapped. Those were the same "
     "thing.", space_after=9)

body("Tread used to be a lookup. The bike gave one or two candidate treads, and the gravel answer "
     "chose between them. On a Gravel or All-Road bike there were two, so the question worked. On "
     "a Road or Adventure bike there was only ever one — so the code returned it immediately and "
     "never looked at your gravel answer at all. Not a weak effect: no effect.", space_after=9)

body("Your case, 650B at 50 mm on a Road bike:", space_after=9)

data_table(
    ["Gravel", "Before", "Now"],
    [
        ["Never",            "Switchback Hill (smooth)", "Switchback Hill (smooth)"],
        ["Occasionally",     "Switchback Hill (smooth)", "Switchback Hill (smooth)"],
        ["Often",            "Switchback Hill (smooth)", "Juniper Ridge (knobby)"],
        ["Most of the time", "Switchback Hill (smooth)", "Juniper Ridge (knobby)"],
    ],
    [Inches(1.5), Inches(2.6), CONTENT_W - Inches(4.1)],
    mono_cols={0},
    vpad=54,
)

para(doc,
     "Which answers your question directly — anything past \u201coccasionally\u201d now gets the "
     "knobby tire.",
     size=9.5, color=INK_SOFT, space_before=7, space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("The new tread logic")

body("Tread is a scale rather than a lookup. Your bike says where you start on it; how often you "
     "ride gravel moves you along it. Both answers always count, on every bike. The field is "
     "relabeled \u201cBike\u201d with your shorter options, since the bike sets the starting "
     "point and the gravel question carries the surface.", space_after=9)

data_table(
    ["Bike", "Never", "Occasionally", "Often", "Most of the time"],
    [
        ["Road",            "Smooth",     "Smooth",     "Semi-Slick", "Knobby"],
        ["All-Road",        "Smooth",     "Smooth",     "Semi-Slick", "Knobby"],
        ["Gravel",          "Smooth",     "Semi-Slick", "Knobby",     "Knobby"],
        ["Adventure / MTB", "Semi-Slick", "Knobby",     "Knobby",     "Knobby"],
    ],
    [Inches(1.55), Inches(1.15), Inches(1.35), Inches(1.15), CONTENT_W - Inches(5.2)],
    mono_cols={0},
    vpad=54,
)

para(doc,
     "Every combination the finder can produce. Where a wheel size doesn\u2019t make the tread a "
     "rider lands on — there is no semi-slick 650B, for instance — the nearest width still wins "
     "and the result explains itself, exactly as before.",
     size=9.5, color=INK_SOFT, space_before=7, space_after=8)

question(
    "Q30",
    "Does that table look right to you?",
    "It is the whole of the tread logic — easier to check here than by working through the "
    "combinations one at a time in the calculator.")


# ═════════════════════════════════════════════════════════════════════════════
h2("Everything else on your list")

h3("Will It Fit?")

body("Clearance moved from 3 mm to the ISO 4 mm, in the sum and in the note under the result. "
     "Six millimeters of clearance around a 32 mm tire now gives 36 mm rather than 38. Your link "
     "text and the \u201cactual, in mm\u201d label are in. I took your line about modern bikes "
     "having more room as the reasoning rather than copy for the page — say if you wanted it "
     "printed.", space_after=8)

h3("Rim width")

body("The explainer no longer names the tire\u2019s design width. It reads \u201cabout 1.5 mm "
     "wider than on a 20 mm rim\u201d, as you wrote it. The message that appears when someone "
     "mistypes a rim width used to give the figure away too; it no longer mentions it at all.",
     space_after=8)

h3("Wider and narrower")

body("They now hold the tread and change only the width, and the button beneath reads "
     "\u201cReturn to original recommendation\u201d. This reverses what I argued for last time. "
     "Your reasoning settled it: someone who can weigh those trade-offs unaided has no need of "
     "the calculator.", space_after=8)

h3("Hurricane Ridge")

body("Retired, and it no longer appears at any width near 42 mm — a knobby 700C rider asking for "
     "42 mm is now sent to the Manastash Ridge, as you intended.", space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Two small ones")

question(
    "Q31",
    "I retired Hurricane Ridge rather than deleting its row. Is that all right?",
    "The In Production column exists for exactly this, and marking it N keeps the record of a tire "
    "you once sold without ever recommending it. Deleting the row would work too and is one "
    "keystroke — I just prefer not to throw away data on your behalf.")

question(
    "Q32",
    "\u201cHow Wide Should I Run?\u201d still says \u201cBike / Terrain\u201d. Should it match?",
    "You asked me to change the field on the Tire Finder, and that is all I changed. The other tab "
    "asks the same question in the older, longer wording. You have twice said you would rather the "
    "two tabs not drift apart — but that tab has no gravel question, so the longer descriptions "
    "there do more work. Happy either way.")

# ═════════════════════════════════════════════════════════════════════════════
h2("Anything else")
doc.paragraphs[-1].paragraph_format.keep_with_next = True

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
     "Worth another pass from Natsuko once you have looked at Q30, since the tread change moves "
     "some answers she has already seen. Nothing has gone live.",
     size=9.5, color=INK_SOFT, space_after=0)

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - Tread Logic Rebuilt.docx"
doc.save(OUT)
print("wrote", OUT)
