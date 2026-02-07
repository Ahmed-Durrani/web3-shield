from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.graphics.shapes import Drawing, Rect, String
from io import BytesIO
from datetime import datetime

# --- COLORS ---
brand_dark = colors.HexColor("#0f172a")
brand_blue = colors.HexColor("#3b82f6")
risk_safe = colors.HexColor("#10b981")
risk_warn = colors.HexColor("#f59e0b")
risk_crit = colors.HexColor("#ef4444")

def draw_background(canvas, doc):
    canvas.saveState()
    # Watermark
    canvas.saveState()
    canvas.translate(4.25*inch, 5.5*inch)
    canvas.rotate(45)
    canvas.setFillColor(colors.HexColor("#f8fafc"))
    canvas.setFont("Helvetica-Bold", 60)
    canvas.drawCentredString(0, 0, "WEB3 SHIELD")
    canvas.restoreState()
    # Header
    canvas.setFillColor(brand_dark)
    canvas.rect(0, 10*inch, 8.5*inch, 1*inch, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 16)
    canvas.drawString(0.5*inch, 10.4*inch, "WEB3 SHIELD")
    canvas.setFont("Helvetica", 10)
    canvas.drawRightString(8*inch, 10.4*inch, "INSTITUTIONAL SECURITY REPORT")
    # Footer
    canvas.setStrokeColor(colors.lightgrey)
    canvas.line(0.5*inch, 0.75*inch, 8*inch, 0.75*inch)
    canvas.setFillColor(colors.grey)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(0.5*inch, 0.5*inch, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    canvas.drawRightString(8*inch, 0.5*inch, f"Page {doc.page}")
    canvas.restoreState()

def create_risk_meter(risk_level):
    d = Drawing(400, 40)
    d.add(Rect(0, 10, 100, 10, fillColor=colors.HexColor("#dcfce7"), strokeWidth=0))
    d.add(Rect(105, 10, 100, 10, fillColor=colors.HexColor("#fef3c7"), strokeWidth=0))
    d.add(Rect(210, 10, 100, 10, fillColor=colors.HexColor("#fee2e2"), strokeWidth=0))
    d.add(String(50, 0, "SAFE", fontSize=8, textAnchor="middle", fillColor=colors.grey))
    d.add(String(155, 0, "WARN", fontSize=8, textAnchor="middle", fillColor=colors.grey))
    d.add(String(260, 0, "CRITICAL", fontSize=8, textAnchor="middle", fillColor=colors.grey))
    x_pos, color = 155, risk_warn
    if risk_level == "SAFE": x_pos, color = 50, risk_safe
    elif risk_level == "CRIT": x_pos, color = 260, risk_crit
    d.add(Rect(x_pos-5, 25, 10, 5, fillColor=color, strokeWidth=0))
    return d

def create_audit_pdf(audit_data):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=100, bottomMargin=100)
    story = []
    styles = getSampleStyleSheet()

    s_h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=24, spaceAfter=20, textColor=brand_dark)
    s_h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=14, spaceBefore=25, spaceAfter=10, textColor=brand_blue)
    s_body = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor("#334155"))
    s_key = ParagraphStyle('Key', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor("#64748b"), uppercase=True)
    s_val = ParagraphStyle('Val', parent=styles['Normal'], fontSize=10, textColor=brand_dark, fontName="Helvetica-Bold")
    s_score_big = ParagraphStyle('Score', parent=styles['Normal'], fontSize=42, textColor=brand_dark, fontName="Helvetica-Bold", alignment=TA_CENTER)
    
    verdict_raw = audit_data.get('verdict', 'UNKNOWN').upper()
    risk_code = "WARN"
    verdict_color = risk_warn
    verdict_text = "CAUTION ADVISED"
    if "SAFE" in verdict_raw: risk_code, verdict_color, verdict_text = "SAFE", risk_safe, "PASSED: LOW RISK"
    elif "CRITICAL" in verdict_raw or "FAIL" in verdict_raw: risk_code, verdict_color, verdict_text = "CRIT", risk_crit, "CRITICAL RISK DETECTED"

    # 1. HEADER
    story.append(Paragraph(f"AUDIT REPORT: {audit_data.get('name', 'Smart Contract')}", s_h1))
    t_v = Table([[Paragraph(verdict_text, ParagraphStyle('V', parent=s_h1, alignment=TA_CENTER, textColor=colors.white))]], colWidths=[7.5*inch])
    t_v.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), verdict_color), ('TOPPADDING', (0,0), (-1,-1), 15), ('BOTTOMPADDING', (0,0), (-1,-1), 15), ('ROUNDEDCORNERS', [6,6,6,6])]))
    story.append(t_v)
    story.append(Spacer(1, 15))
    story.append(create_risk_meter(risk_code))
    story.append(Spacer(1, 20))

    # 2. SCORECARD (CLEAN LAYOUT)
    score = audit_data.get('score', 0)
    reasons = audit_data.get('score_reasons', [])
    
    # Logic for colors
    score_color = risk_safe if score >= 80 else (risk_warn if score >= 50 else risk_crit)
    
    # Left Column: The Big Number
    left_cell = [
        Paragraph("SECURITY SCORE", ParagraphStyle('SL', parent=s_key, alignment=TA_CENTER)),
        Spacer(1, 6),
        Paragraph(f"{score}/100", ParagraphStyle('S', parent=s_score_big, textColor=score_color))
    ]
    
    # Right Column: The Reasons List
    right_cell = [Paragraph("RISK FACTORS DETECTED:", s_key)]
    if reasons:
        for r in reasons:
            # Bullet point with color
            right_cell.append(Spacer(1, 4))
            right_cell.append(Paragraph(f"<font color='{risk_crit.hexval()}'>•</font> {r}", s_val))
    else:
        right_cell.append(Spacer(1, 4))
        right_cell.append(Paragraph("✅ No major automated red flags detected.", s_body))

    # Table Structure
    t_score = Table([[left_cell, right_cell]], colWidths=[2.5*inch, 5*inch])
    t_score.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LINEBEFORE', (1,0), (1,0), 1, colors.HexColor("#e2e8f0")), # Vertical divider
        ('LEFTPADDING', (1,0), (1,0), 20),
        ('RIGHTPADDING', (0,0), (0,0), 20),
    ]))
    story.append(t_score)
    story.append(Spacer(1, 20))

    # 3. MARKET INTEL (KeepTogether prevents page break splits)
    market = audit_data.get('market')
    if market and isinstance(market, dict):
        market_section = []
        market_section.append(Paragraph("LIVE MARKET INTELLIGENCE", s_h2))
        liq = f"${market.get('liquidity_usd', 0):,.2f}"
        if market.get('liquidity_usd', 0) < 5000: liq += " (CRITICAL LOW)"
        market_grid = [
            [Paragraph("LIQUIDITY (USD)", s_key), Paragraph(liq, s_val)],
            [Paragraph("MARKET CAP (FDV)", s_key), Paragraph(f"${market.get('fdv', 0):,.2f}", s_val)],
            [Paragraph("CURRENT PRICE", s_key), Paragraph(f"${float(market.get('price_usd', 0)):.8f}", s_val)],
            [Paragraph("DEX SOURCE", s_key), Paragraph(market.get('dex_id', 'Unknown').upper(), s_val)]
        ]
        t_mkt = Table(market_grid, colWidths=[2.5*inch, 5*inch])
        t_mkt.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")), 
            ('TOPPADDING', (0,0), (-1,-1), 8), 
            ('BOTTOMPADDING', (0,0), (-1,-1), 8), 
            ('BACKGROUND', (0,0), (-1,3), colors.HexColor("#f0fdf4"))
        ]))
        market_section.append(t_mkt)
        story.append(KeepTogether(market_section))

    # 4. REPORT BODY
    raw_text = audit_data.get('report', '')
    sections_map = [("🕵️‍♂️ DEPLOYER INTEL", "DEPLOYER INTELLIGENCE"), ("🧠 SMART CONTRACT INTELLIGENCE", "CODE ARCHITECTURE"), ("🚨 THREAT DETECTION", "VULNERABILITY ASSESSMENT"), ("💰 GAS OPTIMIZATION", "GAS EFFICIENCY")]

    for marker, title in sections_map:
        if marker in raw_text:
            parts = raw_text.split(marker)
            if len(parts) > 1:
                content = parts[1].split("###")[0].strip()
                story.append(Paragraph(title, s_h2))
                lines = content.split('\n')
                table_rows = []
                for line in lines:
                    clean = line.replace('*', '').strip()
                    if not clean or clean.replace('-', '').replace('—', '').strip() == '': continue
                    
                    if clean.startswith("(") and clean.endswith(")"):
                        # Flush table if exists
                        if table_rows:
                            story.append(Table(table_rows, colWidths=[2.5*inch, 5*inch], style=TableStyle([('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")), ('VALIGN', (0,0), (-1,-1), 'TOP'), ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6)])))
                            table_rows = []
                        story.append(Spacer(1, 8))
                        story.append(Paragraph(clean.replace("(", "").replace(")", ""), s_val))
                    elif ":" in clean and len(clean) < 120:
                        k, v = clean.split(":", 1)
                        table_rows.append([Paragraph(k.strip(), s_key), Paragraph(v.strip(), s_body)])
                    else:
                        # Flush table if exists
                        if table_rows:
                            story.append(Table(table_rows, colWidths=[2.5*inch, 5*inch], style=TableStyle([('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")), ('VALIGN', (0,0), (-1,-1), 'TOP'), ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6)])))
                            table_rows = []
                        story.append(Paragraph(f"• {clean}", s_body))
                        story.append(Spacer(1, 4))
                if table_rows: 
                    story.append(Table(table_rows, colWidths=[2.5*inch, 5*inch], style=TableStyle([('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")), ('VALIGN', (0,0), (-1,-1), 'TOP'), ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6)])))

    doc.build(story, onFirstPage=draw_background, onLaterPages=draw_background)
    buffer.seek(0)
    return buffer