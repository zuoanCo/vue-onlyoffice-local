# -*- coding: utf-8 -*-
"""Generate the three sample documents shipped with the vue-onlyoffice-local demo.

These are produced with the reference OOXML writers (python-docx / openpyxl /
python-pptx) rather than hand-rolled zip contents: x2t rejects hand-built
packages with conversion errors 80/88, so the samples have to be genuinely
well-formed documents.

    pip install python-docx openpyxl python-pptx
    python demo/scripts/make_samples.py

The generated files are committed, so running this is only needed when you want
to change the sample content.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.normpath(os.path.join(HERE, "..", "public", "samples"))

INTRO = ("This document is being edited inside your own browser. Nothing is "
         "uploaded to any server: the OnlyOffice 9.x offline build runs in an "
         "iframe and hands the file back to the host page as a Blob URL.")


def make_docx(path):
    from docx import Document
    from docx.shared import Pt, RGBColor

    d = Document()

    t = d.add_heading("vue-onlyoffice-local", level=0)
    t.alignment = 1
    sub = d.add_paragraph("Purely local OnlyOffice editing for Vue 3")
    sub.alignment = 1
    for r in sub.runs:
        r.font.size = Pt(16)
        r.font.color.rgb = RGBColor(0x4B, 0x55, 0x63)

    p = d.add_paragraph(INTRO)
    for r in p.runs:
        r.font.size = Pt(11)

    d.add_heading("What this demo proves", level=1)
    for line in [
        "Edit and save DOCX, XLSX and PPTX with no document server.",
        "Zero uploads - the file never leaves your browser tab.",
        "Imperative save() via a postMessage file-stream hook.",
        "One Vue plugin: component, composable and headless SDK.",
    ]:
        d.add_paragraph(line, style="List Bullet")

    d.add_heading("Try it", level=1)
    d.add_paragraph(
        "Type anywhere on this page. When you are done, use the Save button in "
        "the demo toolbar to download the edited file back to your machine.")

    d.save(path)
    print("wrote %s (%d bytes)" % (path, os.path.getsize(path)))


def make_xlsx(path):
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill

    wb = Workbook()
    ws = wb.active
    ws.title = "Formats"

    headers = ["Format", "Editor mode", "Server upload", "Notes"]
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="1D4ED8")
        cell.alignment = Alignment(horizontal="left")

    rows = [
        ("DOCX", "Word editing", "None", "Round-trips through the browser only"),
        ("XLSX", "Cell editing", "None", "Formula bar works as expected"),
        ("PPTX", "Slide editing", "None", "Slide thumbnails included"),
    ]
    for r in rows:
        ws.append(r)

    ws["A6"] = "=COUNTA(A2:A4)&\" formats open locally - no document server.\""
    ws["A8"] = "Edits in this sheet are saved back to your disk by the demo toolbar."

    for col, width in zip("ABCD", (14, 16, 16, 44)):
        ws.column_dimensions[col].width = width
    ws.row_dimensions[1].height = 22
    ws.freeze_panes = "A2"

    wb.save(path)
    print("wrote %s (%d bytes)" % (path, os.path.getsize(path)))


def make_pptx(path):
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor

    prs = Presentation()
    prs.slide_width = Inches(10)
    prs.slide_height = Inches(7.5)

    def title_slide(title, subtitle):
        s = prs.slides.add_slide(prs.slide_layouts[0])
        s.shapes.title.text = title
        s.placeholders[1].text = subtitle
        return s

    def bullet_slide(title, lines):
        s = prs.slides.add_slide(prs.slide_layouts[1])
        s.shapes.title.text = title
        body = s.placeholders[1].text_frame
        body.text = lines[0]
        for line in lines[1:]:
            p = body.add_paragraph()
            p.text = line
            p.level = 0
        return s

    title_slide("vue-onlyoffice-local", "Purely local OnlyOffice editing for Vue 3")

    bullet_slide("What runs where", [
        "The OnlyOffice 9.x offline build is served from this origin and rendered in an iframe.",
        "Your document is opened as a Blob URL, so no upload request is ever made.",
        "Edited bytes come back to the host page as an ArrayBuffer.",
    ])

    bullet_slide("Fully offline formats", [
        "DOCX, XLSX and PPTX are supported for editing.",
        "No converter service, no callback URL, no document server.",
        "Saving returns the file straight to the visitor.",
    ])

    # Tint the title slide so the deck does not read as unstyled output.
    slide = prs.slides[0]
    for shape, size in ((slide.shapes.title, Pt(40)), (slide.placeholders[1], Pt(20))):
        if not shape.has_text_frame:
            continue
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                run.font.size = size
                run.font.color.rgb = RGBColor(0x1D, 0x4E, 0xD8)

    prs.save(path)
    print("wrote %s (%d bytes)" % (path, os.path.getsize(path)))


if __name__ == "__main__":
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    make_docx(os.path.join(OUT, "sample.docx"))
    make_xlsx(os.path.join(OUT, "sample.xlsx"))
    make_pptx(os.path.join(OUT, "sample.pptx"))
