"""Generate the Tire Finder handoff as an editable Word document.

Mirrors the content of tire-finder-handoff.html, but adds a response box under
every open question so Jan can type answers directly into the file.
"""

import copy
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, Inches, RGBColor

# ── palette ──────────────────────────────────────────────────────────────────
INK        = RGBColor(0x22, 0x25, 0x29)
INK_SOFT   = RGBColor(0x5E, 0x62, 0x67)
ACCENT     = RGBColor(0xC0, 0x40, 0x40)
SETTLED    = RGBColor(0x2D, 0x6A, 0x4F)
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)

SH_HEAD    = "222529"   # table header fill
SH_ZEBRA   = "F4F4F5"   # alternating row
SH_SETTLED = "E8F4EE"   # settled callout
SH_QUESTION= "F6F6F7"   # question block
SH_RESPONSE= "FFFDF3"   # response box (warm = "type here")
SH_GAP     = "FDECEA"   # missing-data cell
RULE       = "DCDDE0"

SERIF = "Georgia"
SANS  = "Segoe UI"
MONO  = "Consolas"


# ── low-level helpers ────────────────────────────────────────────────────────
def shade(cell, fill):
    el = OxmlElement("w:shd")
    el.set(qn("w:val"), "clear")
    el.set(qn("w:fill"), fill)
    cell._tc.get_or_add_tcPr().append(el)


def cell_margins(cell, top=80, bottom=80, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for tag, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        node = OxmlElement(f"w:{tag}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        mar.append(node)
    tcPr.append(mar)


def borders(cell, edges, color=RULE, sz=4):
    """edges: dict of edge -> True/False. Missing edges are cleared."""
    tcPr = cell._tc.get_or_add_tcPr()
    existing = tcPr.find(qn("w:tcBorders"))
    if existing is not None:
        tcPr.remove(existing)
    node = OxmlElement("w:tcBorders")
    for edge in ("top", "left", "bottom", "right"):
        e = OxmlElement(f"w:{edge}")
        spec = edges.get(edge)
        if spec:
            c, s = (spec if isinstance(spec, tuple) else (color, sz))
            e.set(qn("w:val"), "single")
            e.set(qn("w:sz"), str(s))
            e.set(qn("w:color"), c)
        else:
            e.set(qn("w:val"), "nil")
        node.append(e)
    tcPr.append(node)


def no_borders(table):
    for row in table.rows:
        for cell in row.cells:
            borders(cell, {})


def keep_together(paragraph):
    paragraph.paragraph_format.keep_with_next = True


def cant_split(table):
    """Stop individual rows breaking across a page."""
    for row in table.rows:
        row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))


def glue_rows(table, through=-1):
    """Keep every paragraph up to `through` with the next, so the rows of a
    block stay on one page together."""
    rows = table.rows[:through] if through != -1 else table.rows[:-1]
    for row in rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                p.paragraph_format.keep_with_next = True


def set_col_widths(table, widths):
    table.autofit = False
    for row in table.rows:
        for cell, w in zip(row.cells, widths):
            cell.width = w


def run(paragraph, text, *, font=SANS, size=10.5, bold=False, italic=False,
        color=INK, caps=False, spacing=None):
    r = paragraph.add_run(text)
    r.font.name = font
    r.font.size = Pt(size)
    r.bold = bold
    r.italic = italic
    r.font.color.rgb = color
    if caps:
        r.font.all_caps = True
    if spacing is not None:
        rPr = r._element.get_or_add_rPr()
        el = OxmlElement("w:spacing")
        el.set(qn("w:val"), str(int(spacing * 20)))
        rPr.append(el)
    # make the font stick for non-ASCII too
    rPr = r._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs"):
        rFonts.set(qn(attr), font)
    return r


def para(container, text=None, *, space_before=0, space_after=6, line=1.3,
         align=None, **kw):
    p = container.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line
    if align is not None:
        p.alignment = align
    if text:
        run(p, text, **kw)
    return p


def rich(container, parts, *, space_before=0, space_after=6, line=1.3, **base):
    """parts: list of (text, overrides) tuples."""
    p = container.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line
    for text, over in parts:
        kw = dict(base)
        kw.update(over)
        run(p, text, **kw)
    return p


def hrule(doc, color=RULE, sz=6, space_before=2, space_after=10):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(sz))
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), color)
    pbdr.append(bottom)
    pPr.append(pbdr)
    return p


# ── document scaffolding ─────────────────────────────────────────────────────
doc = Document()

sec = doc.sections[0]
sec.page_width  = Inches(8.5)
sec.page_height = Inches(11)
sec.left_margin = sec.right_margin = Inches(0.9)
sec.top_margin = Inches(0.85)
sec.bottom_margin = Inches(0.9)

CONTENT_W = sec.page_width - sec.left_margin - sec.right_margin

normal = doc.styles["Normal"]
normal.font.name = SANS
normal.font.size = Pt(10.5)
normal.font.color.rgb = INK
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.line_spacing = 1.3

# Proof this document — and anything Jan types into it — as US English.
lang = OxmlElement("w:lang")
lang.set(qn("w:val"), "en-US")
lang.set(qn("w:eastAsia"), "en-US")
lang.set(qn("w:bidi"), "ar-SA")
normal.element.get_or_add_rPr().append(lang)

# footer with page numbers
footer_p = sec.footer.paragraphs[0]
footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
run(footer_p, "Rene Herse Cycles · Tire Finder · page ", font=MONO, size=8, color=INK_SOFT)
fld = OxmlElement("w:fldSimple")
fld.set(qn("w:instr"), "PAGE")
footer_p._p.append(fld)


def h2(text):
    p = para(doc, text, font=SERIF, size=17, bold=True, color=INK,
             space_before=20, space_after=2, line=1.2)
    keep_together(p)
    hrule(doc, space_after=9)
    return p


def h3(text):
    p = para(doc, text, font=SANS, size=9, bold=True, color=INK_SOFT,
             caps=True, spacing=1.0, space_before=14, space_after=5)
    keep_together(p)
    return p


def body(text, space_after=7):
    return para(doc, text, size=10.5, color=INK, space_after=space_after)


def boxed_table(fill, border_color=None, border_edge="left", border_sz=18):
    """Single-cell table used as a callout box."""
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    set_col_widths(t, [CONTENT_W])
    cell = t.cell(0, 0)
    cell.text = ""
    shade(cell, fill)
    cell_margins(cell, top=140, bottom=140, left=180, right=180)
    edges = {}
    if border_color:
        edges[border_edge] = (border_color, border_sz)
    borders(cell, edges)
    return cell


def spacer(pts=10):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1
    run(p, "", size=pts / 2)
    return p


def data_table(headers, rows, widths, *, gap_cells=frozenset(), mono_cols=frozenset(),
               compact=False, vpad=70):
    """headers: list[str]; rows: list[list[str]]; gap_cells: set of (row, col).

    compact=True tightens the horizontal padding so short column labels fit on
    one line in a narrow column.
    """
    pad = 55 if compact else 120
    head_size = 7.5 if compact else 8
    t = doc.add_table(rows=1 + len(rows), cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    set_col_widths(t, widths)
    t.rows[0]._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))

    for j, head in enumerate(headers):
        cell = t.cell(0, j)
        cell.text = ""
        shade(cell, SH_HEAD)
        cell_margins(cell, top=vpad, bottom=vpad, left=pad, right=pad)
        borders(cell, {})
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.1
        run(p, head, font=MONO, size=head_size, bold=True, color=WHITE, caps=True,
            spacing=0.2 if compact else 0.4)

    for i, cols in enumerate(rows):
        for j, text in enumerate(cols):
            cell = t.cell(i + 1, j)
            cell.text = ""
            is_gap = (i, j) in gap_cells
            if is_gap:
                shade(cell, SH_GAP)
            elif i % 2 == 1:
                shade(cell, SH_ZEBRA)
            cell_margins(cell, top=vpad, bottom=vpad, left=pad, right=pad)
            borders(cell, {"bottom": (RULE, 4)})
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.25
            if is_gap:
                run(p, text, font=MONO, size=9, bold=True, color=ACCENT)
            elif j in mono_cols:
                run(p, text, font=MONO, size=8.5, color=INK)
            else:
                # allow inline bold via **markers**
                for k, chunk in enumerate(text.split("**")):
                    if chunk:
                        run(p, chunk, size=9.5, bold=bool(k % 2), color=INK)
    cant_split(t)
    return t


def question(qid, ask, why):
    """Question block with an attached response box for Jan."""
    t = doc.add_table(rows=2, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    id_w = Inches(0.5)
    set_col_widths(t, [id_w, CONTENT_W - id_w])

    # ── row 0: the question
    idc = t.cell(0, 0)
    idc.text = ""
    shade(idc, SH_QUESTION)
    cell_margins(idc, top=130, bottom=110, left=150, right=40)
    borders(idc, {"left": (ACCENT.__str__(), 18)})
    p = idc.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run(p, qid, font=MONO, size=10, bold=True, color=ACCENT)

    bodyc = t.cell(0, 1)
    bodyc.text = ""
    shade(bodyc, SH_QUESTION)
    cell_margins(bodyc, top=130, bottom=110, left=40, right=150)
    borders(bodyc, {})
    p = bodyc.paragraphs[0]
    p.paragraph_format.space_after = Pt(5)
    p.paragraph_format.line_spacing = 1.3
    for k, chunk in enumerate(ask.split("**")):
        if chunk:
            run(p, chunk, size=10.5, bold=True, color=INK)
    p2 = bodyc.add_paragraph()
    p2.paragraph_format.space_after = Pt(0)
    p2.paragraph_format.line_spacing = 1.3
    for k, chunk in enumerate(why.split("**")):
        if chunk:
            run(p2, chunk, size=9.5, color=INK_SOFT,
                font=MONO if k % 2 else SANS)

    # ── row 1: response box
    lab = t.cell(1, 0)
    lab.text = ""
    shade(lab, SH_RESPONSE)
    cell_margins(lab, top=110, bottom=140, left=150, right=40)
    borders(lab, {"left": (ACCENT.__str__(), 18), "top": ("E8E4D8", 4)})
    p = lab.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run(p, "→", font=SANS, size=10, bold=True, color=INK_SOFT)

    ans = t.cell(1, 1)
    ans.text = ""
    shade(ans, SH_RESPONSE)
    cell_margins(ans, top=110, bottom=140, left=40, right=150)
    borders(ans, {"top": ("E8E4D8", 4)})
    p = ans.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.35
    run(p, "Jan: ", font=SANS, size=9.5, bold=True, color=INK_SOFT)
    run(p, "[type your answer here]", font=SANS, size=9.5, italic=True,
        color=RGBColor(0xA8, 0xA2, 0x8E))

    # a question must never be separated from the box it is answered in
    cant_split(t)
    glue_rows(t)

    spacer(7)
    return t


# ═════════════════════════════════════════════════════════════════════════════
# Masthead
# ═════════════════════════════════════════════════════════════════════════════
para(doc, "RENE HERSE CYCLES · TIRE FINDER", font=MONO, size=8.5, bold=True,
     color=ACCENT, spacing=1.3, space_after=6)

para(doc, "Catalog format and open questions", font=SERIF, size=27, bold=True,
     color=INK, space_after=8, line=1.12)

para(doc,
     "A response to the 10 August draft. The design works — this covers the one change that "
     "decides how much effort 650B and 700C take, and the questions I need answered before "
     "the tab can be built.",
     size=11.5, color=INK_SOFT, space_after=12, line=1.4)

hrule(doc, color="222529", sz=12, space_before=0, space_after=6)

rich(doc, [
    ("Draft reviewed: Tire Finder for Shaun, 10 Aug 2026", {}),
    ("     ", {}),
    ("14 open questions", {}),
], font=MONO, size=8.5, color=INK_SOFT, space_after=4)

# How to use this document — the reason it's a Word file
cell = boxed_table(SH_RESPONSE, border_color="C9A227", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "HOW TO USE THIS DOCUMENT", font=MONO, size=8.5, bold=True,
    color=RGBColor(0x8A, 0x6D, 0x1C), spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "Each open question has a cream response box beneath it. Type straight into the box — "
        "replace the placeholder text with your answer. Partial answers are useful; anything you'd "
        "rather discuss than write down, just mark ", size=10, color=INK)
run(p2, "\"let's talk\"", size=10, italic=True, color=INK)
run(p2, ". There is space for anything else at the end. Send the file back however is easiest.",
    size=10, color=INK)

spacer(10)

# ═════════════════════════════════════════════════════════════════════════════
# Already settled
# ═════════════════════════════════════════════════════════════════════════════
cell = boxed_table(SH_SETTLED, border_color="2D6A4F", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(4)
run(p, "ALREADY SETTLED", font=MONO, size=8.5, bold=True, color=SETTLED, spacing=1.1)
p2 = cell.add_paragraph()
p2.paragraph_format.space_after = Pt(0)
p2.paragraph_format.line_spacing = 1.35
run(p2, "The overall structure holds up and needs no rework: terrain decides tread, riding style "
        "decides casing, and wheel size plus width plus tubes/tubeless decides the model. "
        "Calculating pressure from the width of the tire I recommend — rather than the width the "
        "rider asked for — is the right call, and matches how the existing tool already works.",
    size=10, color=INK)

# ═════════════════════════════════════════════════════════════════════════════
h2("The one change worth making")

body("The 10 August draft describes the 26″ range as a set of rules — if the width is this, then "
     "that model; except this casing; unless that tread. Written out this way, 650B and 700C really "
     "will be voluminous, exactly as you expect.")

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(7)
p.paragraph_format.line_spacing = 1.3
run(p, "If the same information is supplied as a table of tires instead, the rules disappear. "
       "Every exception in the draft becomes an ordinary entry: ", size=10.5)
run(p, "Elk Pass is always Extralight with a smooth tread", size=10.5, italic=True)
run(p, " is just an Elk Pass row that lists one casing and one tread. ", size=10.5)
run(p, "Instead of Endurance Plus, recommend Endurance", size=10.5, italic=True)
run(p, " is a Naches Pass row with Endurance Plus marked N. ", size=10.5)
run(p, "If tread is Semi-Slick, recommend Dual-Purpose Knobby instead", size=10.5, italic=True)
run(p, " is simply the fact that no 26″ tire has a semi-slick tread.", size=10.5)

body("The substitution behavior gets written once and applies to every wheel size. Adding 650B "
     "and 700C then means adding rows — no new rules, and no code change when the range itself "
     "changes.")

body("The accompanying spreadsheet has these columns set up, with the 26″ section of your draft "
     "already transcribed into it so you can check I read it correctly.")

# ═════════════════════════════════════════════════════════════════════════════
h2("Spreadsheet columns")

body("One row per tire per tread pattern. If a model is sold in two tread patterns under different "
     "names, that is two rows.", space_after=9)

COLS = [
    ("Wheel Size", "Required", "700C / 29″, 650B / 27.5″, or 26″."),
    ("Model Name", "Required", "Just the name — Naches Pass, Stampede Pass, Humptulips Ridge."),
    ("Nominal Size", "Required", "As printed on the tire: 1.8″ for 26″, 32 mm for 700C."),
    ("Actual Width Low", "Required", "Low end of the measured width in mm. Same as the high value when it's a single number."),
    ("Actual Width High", "Required", "High end of the measured width in mm."),
    ("Calculation Width", "Required", "The one width pressure is calculated from. See **Q6** — a range can't be used for arithmetic."),
    ("Tread Pattern", "Required", "Smooth All-Road, Semi-Slick, or Dual-Purpose Knobby."),
    ("Extralight", "Required", "Y or N — is this tire offered in this casing?"),
    ("Standard", "Required", "Y or N."),
    ("Endurance", "Required", "Y or N."),
    ("Endurance Plus", "Required", "Y or N."),
    ("Tubeless Compatible", "Required", "Y or N. See **Q9** if this varies by casing rather than by model."),
    ("In Production", "Required", "Y or N. Lets discontinued models stay on the sheet without being recommended."),
    ("Display Name", "Optional", "Exactly how the rider should see it, e.g. 26\" x 1.8\" Naches Pass (42-44 mm). I can build this from the other columns if the rule is consistent — see **Q12**."),
    ("Priority", "Optional", "If two tires both fit, the lower number wins. Leave blank if it never comes up."),
    ("Notes", "Optional", "Anything that doesn't fit above."),
]

data_table(
    ["Column", "Needed", "What goes in it"],
    [[c, n, d] for c, n, d in COLS],
    [Inches(1.55), Inches(0.78), CONTENT_W - Inches(2.33)],
    mono_cols={0},
    vpad=48,
)

# ═════════════════════════════════════════════════════════════════════════════
h2("Your 26″ section as rows")

body("This is the draft transcribed into the format above, abbreviated here — the spreadsheet has "
     "every column. Shaded cells are what the draft didn't say.", space_after=9)

ROWS_26 = [
    ["Elk Pass",         "1.25″", "30",    "30", "Smooth All-Road",     "Y", "N", "N", "N", "N"],
    ["Naches Pass",      "1.8″",  "42–44", "?",  "Smooth All-Road",     "?", "?", "Y", "N", "Y"],
    ["Rat Trap Pass",    "2.3″",  "53–54", "?",  "Smooth All-Road",     "?", "?", "Y", "N", "Y"],
    ["Humptulips Ridge", "2.3″",  "?",     "?",  "Dual-Purpose Knobby", "?", "?", "?", "?", "?"],
]
gaps = {(i, j) for i, r in enumerate(ROWS_26) for j, v in enumerate(r) if v == "?"}

data_table(
    ["Model", "Nominal", "Actual", "Calc", "Tread", "XL", "Std", "End", "End+", "Tubeless"],
    ROWS_26,
    [Inches(1.18), Inches(0.60), Inches(0.60), Inches(0.44), Inches(1.34),
     Inches(0.34), Inches(0.40), Inches(0.40), Inches(0.46), Inches(0.72)],
    gap_cells=gaps,
    compact=True,
)

para(doc,
     "Four rows cover the whole 26″ range, including every exception in the draft. Note that nothing "
     "above encodes \u201cSemi-Slick becomes Dual-Purpose Knobby\u201d — that falls out of there being "
     "no semi-slick row for 26″.",
     size=9.5, color=INK_SOFT, space_before=7, space_after=4)

# ═════════════════════════════════════════════════════════════════════════════
h2("Open questions")

body("Numbered so they can be answered individually. Q1 through Q6 block the build; the rest "
     "shape it.", space_after=4)

QUESTIONS = [
    ("Choosing a tread pattern", [
        ("Q1",
         "All-Road maps to \u201cSmooth All-Road or Semi-Slick,\u201d and Gravel to \u201cSemi-Slick "
         "or Dual-Purpose Knobby.\u201d How should I choose between the two?",
         "Two candidates with no tiebreaker. Does riding style decide it, or width, or should one "
         "always win?"),
        ("Q2",
         "When the tread I picked isn't made in that size, do I substitute toward the smoother "
         "tread or the knobbier one?",
         "The 26″ draft sends a semi-slick request to Dual-Purpose Knobby — knobbier. I'd like to "
         "apply that direction everywhere rather than case by case."),
    ]),
    ("Choosing a casing", [
        ("Q3",
         "Should \u201cExtralight or Standard\u201d be shown to the rider as that exact phrase, or "
         "should I pick one of the two?",
         "The current tool displays the phrase verbatim, which suggests you mean it literally. But "
         "the override rules — \u201cinstead of Endurance Plus, recommend Endurance\u201d — treat "
         "casing as a single value that can be swapped. If I should pick one, what decides?"),
        ("Q4",
         "Should the new Tire Finder apply the rider-weight casing rules that \u201cHow Wide Should "
         "I Run?\u201d already uses, or leave casing entirely to riding style?",
         "The existing tab moves riders over 250 lb up from Extralight, and steps lighter riders "
         "down from Endurance Plus because those casings aren't made in narrow widths. The draft "
         "doesn't mention weight affecting casing at all."),
    ]),
    ("Width", [
        ("Q5",
         "On 26″, a rider asking for 25–29 mm gets Elk Pass at 30 mm — wider than they asked for. "
         "Should I show it with a note that 30 mm is the narrowest 26″ tire made?",
         "This is the one place the draft contradicts itself: the closing note says \u201crecommend "
         "narrower tire than selected, rather than wider,\u201d because wider may not fit the frame. "
         "Here the only option is wider."),
        ("Q6",
         "Which single width should pressure be calculated from when a tire is listed as a range — "
         "Naches Pass at 42–44 mm, say?",
         "Midpoint, low end, or a number you set per tire. I need one value; the spreadsheet has a "
         "column for it."),
        ("Q7",
         "Should the width dropdown narrow to what's actually offered once a wheel size is chosen?",
         "It currently runs 25–55 mm for every wheel size, so a rider on 26″ can pick widths that "
         "don't exist in that size and only find out after submitting."),
    ]),
    ("Tubeless", [
        ("Q8",
         "When someone picks tubeless in a width with no tubeless option, should I keep the drafted "
         "message, or recommend the nearest tubeless tire and let them decide?",
         "As drafted this is the only path that returns no tire at all. On 26″ I could instead offer "
         "Naches Pass at 42 mm and say why."),
        ("Q9",
         "Is tubeless compatibility a property of the model, or does it depend on which casing the "
         "tire is built in?",
         "If it varies by casing, the spreadsheet needs a row per casing rather than a single Y/N "
         "column. Worth settling before you start filling it in."),
    ]),
    ("When the rider's answers don't change anything", [
        ("Q10",
         "Should the result explain itself when the catalog overrides the rider's answers — "
         "\u201cElk Pass is only made in Extralight with a smooth tread\u201d?",
         "For 26″ with tubes between 25 and 41 mm, both tread and casing are forced. The rider "
         "answers Terrain and Riding Style carefully and neither affects the result, which will read "
         "as a bug unless I say why."),
    ]),
    ("Wording and presentation", [
        ("Q11",
         "The second riding-style option is worded differently from the existing tab. Should both "
         "tabs use the new wording?",
         "The draft has \u201cwhatever road or trail throw at them\u201d; the existing tab has "
         "\u201cwhatever the trail throws at them.\u201d Two tabs asking the same question in "
         "different words looks accidental. (Also — \u201cthrow\u201d or \u201cthrows\u201d?)"),
        ("Q12",
         "Is the model naming rule just \u201cadd the width in mm for 26″ tires,\u201d or should the "
         "spreadsheet carry the exact display name for every tire?",
         "The draft shows **700C x 32 mm Stampede Pass** alongside **26\" x 1.8\" Naches Pass "
         "(42-44 mm)**. Either is fine — I just need to know which."),
    ]),
    ("How the two tabs relate", [
        ("Q13",
         "Should there be a direct handoff from \u201cHow Wide Should I Run?\u201d to Tire Finder — "
         "a button that carries the recommended width across?",
         "One tab produces a width and the other takes a width as input, so riders will want to move "
         "between them. They're on the same page now, so this is straightforward."),
    ]),
    ("Missing from the draft", [
        ("Q14",
         "Could you fill in the shaded cells in the spreadsheet?",
         "Humptulips Ridge has no actual width and no casing availability, and for Naches Pass and "
         "Rat Trap Pass I only know that Endurance Plus is excluded — not which of the other three "
         "casings are offered."),
    ]),
]

for heading, qs in QUESTIONS:
    h3(heading)
    for qid, ask, why in qs:
        question(qid, ask, why)

# ═════════════════════════════════════════════════════════════════════════════
h2("Anything else")

body("Corrections, things I've misread, questions back to me — whatever doesn't fit above.",
     space_after=8)

cell = boxed_table(SH_RESPONSE, border_color="C9A227", border_edge="left")
p = cell.paragraphs[0]
p.paragraph_format.space_after = Pt(0)
p.paragraph_format.line_spacing = 1.5
run(p, "Jan: ", font=SANS, size=9.5, bold=True, color=INK_SOFT)
run(p, "[type here]", font=SANS, size=9.5, italic=True,
    color=RGBColor(0xA8, 0xA2, 0x8E))
for _ in range(5):
    x = cell.add_paragraph()
    x.paragraph_format.space_after = Pt(0)
    x.paragraph_format.line_spacing = 1.5
    run(x, "", size=9.5)

spacer(12)
hrule(doc, space_before=4, space_after=8)
para(doc,
     "Once Q1 through Q6 are settled and the 26″ rows are complete, the tab can be built and tested "
     "against 26″ alone. If it handles the size with the most exceptions, 650B and 700C are "
     "additional rows rather than additional work.",
     size=9.5, color=INK_SOFT, space_after=0)

OUT = r"D:\repos\TirePressureCalculator\Tire Finder - Catalog Format and Open Questions.docx"
doc.save(OUT)
print("wrote", OUT)
