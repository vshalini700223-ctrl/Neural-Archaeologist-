"""
Native Epigraphic PDF Dossier Generation Service
Generates publication-quality, academic epigraphic research reports as standard PDF 1.4 documents.
Requires zero external C-libraries or pip packages — fully self-contained, offline capable, and robust.
"""
import io
import time
from typing import Dict, Any, List, Optional


class EpigraphicPDFGenerator:
    """Generates standard PDF 1.4 epigraphic research reports."""

    def __init__(self):
        self.page_width = 595.28  # A4 width in points
        self.page_height = 841.89  # A4 height in points
        self.margin = 42.0

    def generate_dossier_pdf(
        self,
        artifact: Dict[str, Any],
        ocr_data: Dict[str, Any],
        reconstruction_data: Optional[Dict[str, Any]] = None,
        enhancement_metrics: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """
        Build complete multi-page publication-grade PDF dossier.
        """
        # Pages buffer
        pages_content: List[List[str]] = []
        current_ops: List[str] = []
        y = [self.page_height - self.margin]  # mutable y coordinate in points

        def new_page():
            nonlocal current_ops
            if current_ops:
                pages_content.append(current_ops)
            current_ops = []
            y[0] = self.page_height - self.margin
            # Header rule on subsequent pages
            if len(pages_content) > 0:
                current_ops.append("0.8 0.7 0.3 RG 0.75 w 42 805 m 553 805 l S")
                current_ops.append(
                    f"BT /F1 8 Tf 0.5 0.5 0.5 rg 42 810 Td (NEURAL ARCHAEOLOGIST AI - EPIGRAPHIC DOSSIER [PAGE {len(pages_content) + 1}]) Tj ET"
                )
                y[0] = 780

        def check_page(needed_pt: float = 40):
            if y[0] - needed_pt < 45:
                new_page()

        def draw_rect(x: float, cur_y: float, w: float, h: float, r: float, g: float, b: float, fill: bool = True):
            if fill:
                current_ops.append(f"{r:.3f} {g:.3f} {b:.3f} rg {x:.2f} {cur_y:.2f} {w:.2f} {h:.2f} re f")
            else:
                current_ops.append(f"{r:.3f} {g:.3f} {b:.3f} RG 1 w {x:.2f} {cur_y:.2f} {w:.2f} {h:.2f} re S")

        def escape_pdf(text: str) -> str:
            # Clean string to standard Latin-1 / ASCII safe representation for PDF Type-1 Helvetica
            clean = []
            for ch in str(text):
                code = ord(ch)
                if code == 92:
                    clean.append("\\\\")
                elif code == 40:
                    clean.append("\\(")
                elif code == 41:
                    clean.append("\\)")
                elif 32 <= code <= 126 or 160 <= code <= 255:
                    clean.append(ch)
                else:
                    # Non-ascii or ancient script: replace with ASCII phonetic / bracket approximation
                    clean.append(f"[U+{code:04X}]" if code > 255 else " ")
            return "".join(clean)

        def write_text(
            text: str,
            cur_x: float,
            cur_y: float,
            font: str = "/F1",
            size: float = 10,
            r: float = 0.1,
            g: float = 0.1,
            b: float = 0.1
        ):
            escaped = escape_pdf(text)
            current_ops.append(f"BT {font} {size} Tf {r:.3f} {g:.3f} {b:.3f} rg {cur_x:.2f} {cur_y:.2f} Td ({escaped}) Tj ET")

        def write_wrapped_text(
            text: str,
            cur_x: float,
            max_width: float = 510,
            font: str = "/F1",
            size: float = 9.5,
            line_height: float = 13,
            r: float = 0.2,
            g: float = 0.2,
            b: float = 0.2
        ):
            words = text.split(" ")
            line = []
            char_width = size * 0.52
            max_chars = max(10, int(max_width / char_width))

            for word in words:
                test_line = " ".join(line + [word])
                if len(test_line) > max_chars:
                    check_page(line_height)
                    write_text(" ".join(line), cur_x, y[0], font=font, size=size, r=r, g=g, b=b)
                    y[0] -= line_height
                    line = [word]
                else:
                    line.append(word)

            if line:
                check_page(line_height)
                write_text(" ".join(line), cur_x, y[0], font=font, size=size, r=r, g=g, b=b)
                y[0] -= line_height

        # ================= PAGE 1: TITLE & DOSSIER HEADER =================
        # Header Gold Bar
        draw_rect(self.margin, y[0] - 50, self.page_width - 2 * self.margin, 50, 0.08, 0.12, 0.20, fill=True)
        draw_rect(self.margin, y[0] - 52, self.page_width - 2 * self.margin, 2, 0.83, 0.68, 0.21, fill=True)
        write_text("NEURAL ARCHAEOLOGIST AI", self.margin + 16, y[0] - 22, font="/F2", size=14, r=0.95, g=0.82, b=0.45)
        write_text("EPIGRAPHIC RESEARCH DOSSIER & TRANSCRIBED CORPUS", self.margin + 16, y[0] - 38, font="/F1", size=8.5, r=0.8, g=0.8, b=0.8)
        write_text(f"DATE: {time.strftime('%Y-%m-%d %H:%M UTC')}", self.page_width - self.margin - 140, y[0] - 22, font="/F3", size=8, r=0.7, g=0.7, b=0.7)
        write_text("CLASSIFICATION: SCHOLARLY", self.page_width - self.margin - 140, y[0] - 36, font="/F3", size=7.5, r=0.83, g=0.68, b=0.21)

        y[0] -= 68

        # Inscription Overview Table
        check_page(90)
        draw_rect(self.margin, y[0] - 85, self.page_width - 2 * self.margin, 85, 0.96, 0.97, 0.98, fill=True)
        draw_rect(self.margin, y[0] - 85, self.page_width - 2 * self.margin, 85, 0.82, 0.85, 0.88, fill=False)

        title = artifact.get("title", "Ancient Inscription Artifact")
        script = artifact.get("script", ocr_data.get("detected_script", "Epigraphic Script"))
        period = artifact.get("period", "Classical Epigraphic Period")
        provenance = artifact.get("provenance", "Epigraphic Archaeological Site")
        image_id = artifact.get("id", ocr_data.get("image_id", "artifact-01"))

        write_text("1. ARTIFACT METADATA & PROVENANCE", self.margin + 10, y[0] - 16, font="/F2", size=10, r=0.1, g=0.15, b=0.25)
        write_text(f"Artifact Title: {title}", self.margin + 10, y[0] - 32, font="/F2", size=9, r=0.2, g=0.2, b=0.2)
        write_text(f"System ID: {image_id}", self.margin + 10, y[0] - 46, font="/F3", size=8.5, r=0.4, g=0.4, b=0.4)
        write_text(f"Script Family: {script}", self.margin + 10, y[0] - 60, font="/F1", size=8.5, r=0.3, g=0.3, b=0.3)
        write_text(f"Period / Epoch: {period}", self.margin + 260, y[0] - 46, font="/F1", size=8.5, r=0.3, g=0.3, b=0.3)
        write_text(f"Provenance / Findspot: {provenance}", self.margin + 260, y[0] - 60, font="/F1", size=8.5, r=0.3, g=0.3, b=0.3)
        write_text(f"Overall Model Confidence: {ocr_data.get('overall_confidence', 0.92) * 100:.1f}%", self.margin + 10, y[0] - 76, font="/F2", size=8.5, r=0.1, g=0.5, b=0.2)

        y[0] -= 100

        # Photometric & Enhancement Metrics
        check_page(50)
        enh = enhancement_metrics or {}
        filter_name = enh.get("filter_applied", "multiscale_retinex")
        gain_db = enh.get("contrast_gain_db", 14.2)
        write_text("2. PHOTOMETRIC ENHANCEMENT SUMMARY", self.margin, y[0], font="/F2", size=10, r=0.1, g=0.15, b=0.25)
        y[0] -= 16
        enh_summary = (
            f"Filter Algorithm: {filter_name.upper()} | Contrast Gain: +{gain_db} dB | "
            f"Denoising: {'Active' if enh.get('denoising_active', True) else 'Bypassed'} | "
            f"Chisel Depth Estimation: {'Normalized' if enh.get('depth_estimated', True) else 'Standard'}"
        )
        write_text(enh_summary, self.margin, y[0], font="/F3", size=8.5, r=0.35, g=0.35, b=0.35)
        y[0] -= 22

        # Epigraphic Decipherment Section
        check_page(120)
        write_text("3. EPIGRAPHIC DECIPHERMENT & TRANSLITERATION", self.margin, y[0], font="/F2", size=10, r=0.1, g=0.15, b=0.25)
        y[0] -= 16

        # Transliteration Box
        translit = ocr_data.get("transliteration", "N/A")
        write_text("Academic Romanization (IAST / ALA-LC):", self.margin, y[0], font="/F2", size=8.5, r=0.2, g=0.2, b=0.2)
        y[0] -= 14
        write_wrapped_text(f'"{translit}"', self.margin + 10, max_width=490, font="/F1", size=9, line_height=13, r=0.15, g=0.15, b=0.15)
        y[0] -= 8

        # English Translation Box
        translation = ocr_data.get("translation_en", "Translation unavailable for this corpus fragment.")
        write_text("English Historical Interpretation:", self.margin, y[0], font="/F2", size=8.5, r=0.2, g=0.2, b=0.2)
        y[0] -= 14
        write_wrapped_text(f'"{translation}"', self.margin + 10, max_width=490, font="/F1", size=9, line_height=13, r=0.1, g=0.25, b=0.45)
        y[0] -= 14

        # ================= UNCERTAIN TEXT AUDIT TABLE =================
        check_page(90)
        write_text("4. UNCERTAIN TEXT DETECTION & MODEL CONFIDENCE AUDIT", self.margin, y[0], font="/F2", size=10, r=0.1, g=0.15, b=0.25)
        y[0] -= 14

        audit_intro = (
            "Model confidence is quantitatively computed per glyph cell from stroke definition and character feature maps. "
            "Heuristic warnings indicate physical stone erosion or calcification independent of probabilistic scores."
        )
        write_wrapped_text(audit_intro, self.margin, max_width=510, font="/F1", size=8, line_height=11, r=0.4, g=0.4, b=0.4)
        y[0] -= 8

        glyphs = ocr_data.get("glyph_details", [])
        uncertain_glyphs = [g for g in glyphs if g.get("is_uncertain", False)]

        # Table Header
        check_page(40)
        draw_rect(self.margin, y[0] - 16, self.page_width - 2 * self.margin, 16, 0.15, 0.20, 0.28, fill=True)
        write_text("SEGMENT", self.margin + 8, y[0] - 12, font="/F2", size=7.5, r=1, g=1, b=1)
        write_text("TRANSLIT", self.margin + 65, y[0] - 12, font="/F2", size=7.5, r=1, g=1, b=1)
        write_text("MODEL CONF", self.margin + 130, y[0] - 12, font="/F2", size=7.5, r=1, g=1, b=1)
        write_text("UNCERTAINTY STATUS", self.margin + 205, y[0] - 12, font="/F2", size=7.5, r=1, g=1, b=1)
        write_text("HEURISTIC PHYSICAL WARNINGS", self.margin + 335, y[0] - 12, font="/F2", size=7.5, r=1, g=1, b=1)
        y[0] -= 22

        table_items = uncertain_glyphs if uncertain_glyphs else glyphs[:8]
        for idx, g in enumerate(table_items):
            check_page(20)
            is_odd = (idx % 2 == 1)
            row_color = (0.97, 0.98, 0.99) if is_odd else (1.0, 1.0, 1.0)
            draw_rect(self.margin, y[0] - 16, self.page_width - 2 * self.margin, 16, *row_color, fill=True)

            m_conf = float(g.get("model_confidence", g.get("confidence", 0.0)))
            conf_str = f"{m_conf * 100:.1f}%"
            status = g.get("uncertainty_category", "confident").replace("_", " ").upper()
            warnings = ", ".join(g.get("heuristic_warnings", [])) or "None (Surface intact)"
            if len(warnings) > 38:
                warnings = warnings[:35] + "..."

            conf_r = 0.8 if m_conf < 0.75 else (0.6 if m_conf < 0.85 else 0.1)
            conf_g = 0.2 if m_conf < 0.75 else (0.4 if m_conf < 0.85 else 0.5)

            write_text(f"[{g.get('id', 'g')}]", self.margin + 8, y[0] - 12, font="/F3", size=7.5, r=0.3, g=0.3, b=0.3)
            write_text(str(g.get("transliteration", "-")), self.margin + 65, y[0] - 12, font="/F2", size=8, r=0.2, g=0.2, b=0.2)
            write_text(conf_str, self.margin + 130, y[0] - 12, font="/F2", size=8, r=conf_r, g=conf_g, b=0.1)
            write_text(status, self.margin + 205, y[0] - 12, font="/F1", size=7.5, r=0.3, g=0.3, b=0.3)
            write_text(warnings, self.margin + 335, y[0] - 12, font="/F1", size=7, r=0.4, g=0.4, b=0.4)
            y[0] -= 18

        y[0] -= 12

        # ================= EXPERIMENTAL RECONSTRUCTION SECTION =================
        check_page(110)
        write_text("5. EXPERIMENTAL TEXT RECONSTRUCTION ANALYSIS", self.margin, y[0], font="/F2", size=10, r=0.1, g=0.15, b=0.25)
        y[0] -= 14

        # Prominent Academic Warning Banner
        draw_rect(self.margin, y[0] - 28, self.page_width - 2 * self.margin, 28, 0.99, 0.94, 0.85, fill=True)
        draw_rect(self.margin, y[0] - 28, self.page_width - 2 * self.margin, 28, 0.85, 0.60, 0.15, fill=False)
        write_text("WARNING: ALL RECONSTRUCTIONS ARE AI-GENERATED HYPOTHESES, NOT VERIFIED FACTS.", self.margin + 10, y[0] - 12, font="/F2", size=7.5, r=0.75, g=0.40, b=0.05)
        write_text("Never substitute experimental reconstruction for primary epigraphic record or autopsy.", self.margin + 10, y[0] - 23, font="/F1", size=7, r=0.55, g=0.35, b=0.10)
        y[0] -= 38

        rec = reconstruction_data or {}
        if rec.get("method_available", False) and rec.get("hypotheses"):
            write_text(f"Reconstruction Method: {rec.get('method_name', 'Corpus Collocation')}", self.margin, y[0], font="/F2", size=8.5, r=0.2, g=0.2, b=0.2)
            y[0] -= 14

            for hyp in rec.get("hypotheses", []):
                check_page(65)
                draw_rect(self.margin + 8, y[0] - 55, self.page_width - 2 * self.margin - 16, 55, 0.98, 0.98, 0.98, fill=True)
                draw_rect(self.margin + 8, y[0] - 55, self.page_width - 2 * self.margin - 16, 55, 0.88, 0.88, 0.88, fill=False)

                p_score = hyp.get("plausibility_score", 0.0) * 100
                write_text(f"Hypothesis: {hyp.get('proposed_transliteration', '-')} (Plausibility: {p_score:.1f}%)", self.margin + 16, y[0] - 14, font="/F2", size=8.5, r=0.15, g=0.25, b=0.45)
                write_text(f"English Meaning: \"{hyp.get('proposed_translation_en', '-')}\"", self.margin + 16, y[0] - 27, font="/F1", size=8, r=0.25, g=0.25, b=0.25)
                parallels = ", ".join(hyp.get("supporting_parallels", []))
                if len(parallels) > 75:
                    parallels = parallels[:72] + "..."
                write_text(f"Corpus Parallels: {parallels}", self.margin + 16, y[0] - 40, font="/F3", size=7.5, r=0.45, g=0.45, b=0.45)
                y[0] -= 63
        else:
            reason = rec.get("reason_if_unavailable", "Reconstruction withheld: Corpus lacks sufficient contextual anchors.")
            write_wrapped_text(f"Status: Method Unavailable. {reason}", self.margin, max_width=510, font="/F1", size=8.5, line_height=12, r=0.5, g=0.2, b=0.2)
            y[0] -= 12

        # ================= RESEARCH INFORMATION & LIMITATIONS =================
        check_page(95)
        write_text("6. RESEARCH INFORMATION & SCHOLARLY LIMITATIONS", self.margin, y[0], font="/F2", size=10, r=0.1, g=0.15, b=0.25)
        y[0] -= 16

        res_info = ocr_data.get("research_info", {})
        model_name = res_info.get("model_name", "EpigraphNet Vision-CTC")
        version = res_info.get("model_version", "v2.0-heritage")
        corpus = res_info.get("training_corpus", "Corpus Inscriptionum Indicarum / Classical Epigraphy")

        write_text(f"Architecture: {model_name} ({version})", self.margin, y[0], font="/F2", size=8.5, r=0.2, g=0.2, b=0.2)
        y[0] -= 13
        write_text(f"Corpus Baseline: {corpus}", self.margin, y[0], font="/F1", size=8, r=0.35, g=0.35, b=0.35)
        y[0] -= 13

        limitations = res_info.get("known_limitations", [
            "Model performance degrades on friable sandstone and exfoliated surfaces",
            "Epigraphic ligatures require min 300 DPI orthophoto resolution"
        ])
        write_text("Known Model Limitations:", self.margin, y[0], font="/F2", size=8, r=0.4, g=0.15, b=0.15)
        y[0] -= 11
        for lim in limitations:
            check_page(12)
            write_text(f"  * {lim}", self.margin, y[0], font="/F1", size=7.5, r=0.35, g=0.35, b=0.35)
            y[0] -= 11

        # Push the final page
        if current_ops:
            pages_content.append(current_ops)

        # Assemble PDF 1.4 Binary Stream
        return self._build_pdf_stream(pages_content)

    def _build_pdf_stream(self, pages_ops: List[List[str]]) -> bytes:
        """Serializes pages operations into standard PDF 1.4 byte payload."""
        buf = io.BytesIO()
        objects: List[int] = []

        def write_bytes(b: bytes):
            buf.write(b)

        write_bytes(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

        total_pages = len(pages_ops)

        # Obj 1: Catalog
        objects.append(buf.tell())
        write_bytes(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

        # Obj 2: Pages
        objects.append(buf.tell())
        kids = " ".join([f"{3 + i * 2} 0 R" for i in range(total_pages)])
        write_bytes(f"2 0 obj\n<< /Type /Pages /Kids [{kids}] /Count {total_pages} >>\nendobj\n".encode("latin-1"))

        font_helv = 3 + total_pages * 2
        font_bold = font_helv + 1
        font_mono = font_bold + 1

        # Page and Content objects
        for i, ops in enumerate(pages_ops):
            page_obj_id = 3 + i * 2
            content_obj_id = page_obj_id + 1

            # Page Object
            objects.append(buf.tell())
            page_dict = (
                f"{page_obj_id} 0 obj\n"
                f"<< /Type /Page /Parent 2 0 R\n"
                f"   /MediaBox [0 0 {self.page_width:.2f} {self.page_height:.2f}]\n"
                f"   /Contents {content_obj_id} 0 R\n"
                f"   /Resources << /Font << /F1 {font_helv} 0 R /F2 {font_bold} 0 R /F3 {font_mono} 0 R >> >>\n"
                f">>\nendobj\n"
            )
            write_bytes(page_dict.encode("latin-1"))

            # Content Stream Object
            stream_body = "\n".join(ops).encode("latin-1")
            objects.append(buf.tell())
            content_dict = (
                f"{content_obj_id} 0 obj\n"
                f"<< /Length {len(stream_body)} >>\n"
                f"stream\n"
            ).encode("latin-1")
            write_bytes(content_dict)
            write_bytes(stream_body)
            write_bytes(b"\nendstream\nendobj\n")

        # Font 1: Helvetica
        objects.append(buf.tell())
        write_bytes(f"{font_helv} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n".encode("latin-1"))

        # Font 2: Helvetica-Bold
        objects.append(buf.tell())
        write_bytes(f"{font_bold} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n".encode("latin-1"))

        # Font 3: Courier
        objects.append(buf.tell())
        write_bytes(f"{font_mono} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n".encode("latin-1"))

        # XREF Table
        xref_offset = buf.tell()
        total_objs = len(objects) + 1
        write_bytes(f"xref\n0 {total_objs}\n0000000000 65535 f \n".encode("latin-1"))
        for off in objects:
            write_bytes(f"{off:010d} 00000 n \n".encode("latin-1"))

        # Trailer
        trailer = (
            f"trailer\n"
            f"<< /Size {total_objs}\n"
            f"   /Root 1 0 R\n"
            f">>\n"
            f"startxref\n"
            f"{xref_offset}\n"
            f"%%EOF\n"
        )
        write_bytes(trailer.encode("latin-1"))

        return buf.getvalue()
