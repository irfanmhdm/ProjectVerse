from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle
)
from reportlab.lib import colors
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle
)
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from urllib.parse import unquote
import os
import uuid
from datetime import datetime


# =========================================================
# GENERATE SIMILARITY ANALYSIS PDF
# =========================================================

def generate_similarity_pdf(
    project_name,
    results,
    total_projects_checked
):
    """
    Generate a downloadable similarity-analysis
    evidence PDF.

    Args:
        project_name: Name of the uploaded project.
        results: List of similarity results.
        total_projects_checked: Number of processed
                                approved projects checked.

    Returns:
        Dictionary containing report information.
    """

    # =====================================================
    # CREATE REPORT DIRECTORY
    # =====================================================

    report_directory = "similarity_reports"

    os.makedirs(
        report_directory,
        exist_ok=True
    )

    # =====================================================
    # GENERATE REPORT ID
    # =====================================================

    report_id = uuid.uuid4().hex

    filename = (
        f"similarity_report_{report_id}.pdf"
    )

    file_path = os.path.join(
        report_directory,
        filename
    )

    # =====================================================
    # CREATE PDF DOCUMENT
    # =====================================================

    document = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    # =====================================================
    # STYLES
    # =====================================================

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "SimilarityTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=20,
        leading=24,
        spaceAfter=8
    )

    subtitle_style = ParagraphStyle(
        "SimilaritySubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=10,
        leading=14,
        textColor=colors.grey,
        spaceAfter=20
    )

    heading_style = ParagraphStyle(
        "SimilarityHeading",
        parent=styles["Heading2"],
        fontSize=13,
        leading=17,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor("#1F2937")
    )

    normal_style = ParagraphStyle(
        "SimilarityNormal",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#374151")
    )

    small_style = ParagraphStyle(
        "SimilaritySmall",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#6B7280")
    )

    # =====================================================
    # CONTENT
    # =====================================================

    content = []

    # =====================================================
    # HEADER
    # =====================================================

    content.append(
        Paragraph(
            "ProjectVerse",
            title_style
        )
    )

    content.append(
        Paragraph(
            "Similarity Analysis Report",
            subtitle_style
        )
    )

    # =====================================================
    # PROJECT INFORMATION
    # =====================================================

    content.append(
        Paragraph(
            "Project Information",
            heading_style
        )
    )

    current_date = datetime.now().strftime(
        "%d %B %Y, %I:%M %p"
    )

    # =====================================================
    # FIX PROJECT NAME ENCODING
    # =====================================================
    #
    # Example:
    #
    # Muhammed%20Irfan%20S%20Synopsis.pdf
    #
    # becomes:
    #
    # Muhammed Irfan S Synopsis.pdf
    #
    # The loop also handles the case where the value
    # has been URL-encoded more than once.
    #
    # =====================================================

    clean_project_name = str(
        project_name
    )

    while "%" in clean_project_name:

        decoded_project_name = unquote(
            clean_project_name
        )

        if (
            decoded_project_name
            == clean_project_name
        ):
            break

        clean_project_name = (
            decoded_project_name
        )

    # =====================================================
    # PROJECT DATA
    # =====================================================

    project_data = [
        [
            "Project",
            clean_project_name
        ],
        [
            "Analysis Date",
            current_date
        ],
        [
            "Projects Checked",
            str(total_projects_checked)
        ],
        [
            "Report ID",
            report_id
        ]
    ]

    project_table = Table(
        project_data,
        colWidths=[
            1.6 * inch,
            4.8 * inch
        ]
    )

    project_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (0, -1),
                colors.HexColor("#F1F5F9")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (0, -1),
                colors.HexColor("#1F2937")
            ),
            (
                "FONTNAME",
                (0, 0),
                (0, -1),
                "Helvetica-Bold"
            ),
            (
                "FONTNAME",
                (1, 0),
                (1, -1),
                "Helvetica"
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor("#CBD5E1")
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            )
        ])
    )

    content.append(
        project_table
    )

    content.append(
        Spacer(1, 15)
    )

    # =====================================================
    # ANALYSIS METHOD
    # =====================================================

    content.append(
        Paragraph(
            "Analysis Method",
            heading_style
        )
    )

    method_text = (
        "The ProjectVerse similarity analysis compares the "
        "uploaded project report against processed reports "
        "of approved projects available in the system."
    )

    content.append(
        Paragraph(
            method_text,
            normal_style
        )
    )

    content.append(
        Spacer(1, 6)
    )

    methods = [
        "1. PDF text extraction",
        "2. Text preprocessing",
        "3. TF-IDF vectorization",
        "4. Cosine similarity calculation"
    ]

    for method in methods:

        content.append(
            Paragraph(
                method,
                normal_style
            )
        )

    content.append(
        Spacer(1, 15)
    )

    # =====================================================
    # SIMILARITY RESULTS
    # =====================================================

    content.append(
        Paragraph(
            "Similarity Results",
            heading_style
        )
    )

    # -----------------------------------------------------
    # RESULT TABLE HEADER
    # -----------------------------------------------------

    table_data = [
        [
            "Project",
            "Similarity"
        ]
    ]

    # -----------------------------------------------------
    # ADD RESULTS
    # -----------------------------------------------------

    if results:

        for result in results:

            title = result.get(
                "title",
                "Untitled Project"
            )

            similarity = result.get(
                "similarity",
                0
            )

            try:

                similarity_value = float(
                    similarity
                )

            except (
                TypeError,
                ValueError
            ):

                similarity_value = 0.0

            table_data.append(
                [
                    str(title),
                    f"{similarity_value:.2f}%"
                ]
            )

    else:

        table_data.append(
            [
                "No projects available",
                "N/A"
            ]
        )

    # =====================================================
    # RESULT TABLE
    # =====================================================

    result_table = Table(
        table_data,
        colWidths=[
            4.8 * inch,
            1.6 * inch
        ],
        repeatRows=1
    )

    result_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor("#4338CA")
            ),
            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white
            ),
            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),
            (
                "FONTNAME",
                (0, 1),
                (-1, -1),
                "Helvetica"
            ),
            (
                "TEXTCOLOR",
                (0, 1),
                (-1, -1),
                colors.HexColor("#1F2937")
            ),
            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor("#CBD5E1")
            ),
            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
            (
                "VALIGN",
                (0, 0),
                (-1, -1),
                "MIDDLE"
            ),
            (
                "ALIGN",
                (1, 1),
                (1, -1),
                "CENTER"
            )
        ])
    )

    content.append(
        result_table
    )

    content.append(
        Spacer(1, 20)
    )

    # =====================================================
    # EVIDENCE STATEMENT
    # =====================================================

    content.append(
        Paragraph(
            "Evidence Statement",
            heading_style
        )
    )

    evidence_text = (
        "This document records the similarity analysis "
        "performed by ProjectVerse for the uploaded project. "
        "The analysis compares the uploaded report against "
        "processed reports belonging to approved projects "
        "available in the ProjectVerse database at the time "
        "of analysis."
    )

    content.append(
        Paragraph(
            evidence_text,
            normal_style
        )
    )

    content.append(
        Spacer(1, 20)
    )

    # =====================================================
    # FOOTER
    # =====================================================

    content.append(
        Paragraph(
            "Generated by ProjectVerse Similarity Analysis System",
            subtitle_style
        )
    )

    # =====================================================
    # BUILD PDF
    # =====================================================

    document.build(
        content
    )

    # =====================================================
    # LOG
    # =====================================================

    print(
        "Similarity PDF generated:",
        file_path
    )

    # =====================================================
    # RETURN REPORT INFORMATION
    # =====================================================

    return {
        "reportId": report_id,
        "filename": filename,
        "filePath": file_path
    }