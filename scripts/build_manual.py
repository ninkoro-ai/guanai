# -*- coding: utf-8 -*-
"""生成《心桥 产品使用文档》DOCX（compact_reference_guide 预设）。"""
import os
import sys

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.oxml.numbering import CT_Num
from docx.shared import Inches, Pt, RGBColor, Twips

SKILL_SCRIPTS = r"C:/Users/Administrator/.codex/plugins/cache/openai-primary-runtime/documents/26.802.11031/skills/documents/scripts"
sys.path.insert(0, SKILL_SCRIPTS)
from table_geometry import apply_table_geometry, column_widths_from_weights  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
IMG_DIR = os.path.join(ROOT, "screenshots", "manual")
OUT_DIR = os.path.join(ROOT, "docs")
OUT = os.path.join(OUT_DIR, "心桥_产品使用文档.docx")

# ---------------- preset tokens: compact_reference_guide ----------------
BASE_FONT = "Calibri"
BODY_EAST = "宋体"
HEAD_EAST = "微软雅黑"
BODY_SIZE = 11
BODY_AFTER = Pt(6)
BODY_LINE = 300  # 1.25
HEADINGS = {
    1: dict(size=16, color="2E74B5", before=18, after=10),
    2: dict(size=13, color="2E74B5", before=14, after=7),
    3: dict(size=12, color="1F4D78", before=10, after=5),
}
INK_BLUE = "0B2545"
GRAY = "595959"
MUTED = "7F7F7F"
TABLE_HEADER_FILL = "E8EEF5"
CALLOUT_FILL = "F4F6F9"


def set_run(run, size=BODY_SIZE, bold=False, italic=False, color=None, east=BODY_EAST, font=BASE_FONT):
    run.font.name = font
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:eastAsia"), east)


def set_style_font(style, size, bold=False, color=None, east=BODY_EAST, font=BASE_FONT):
    style.font.name = font
    style.font.size = Pt(size)
    style.font.bold = bold
    if color:
        style.font.color.rgb = RGBColor.from_string(color)
    rPr = style.element.get_or_add_rPr()
    rFonts = rPr.get_or_add_rFonts()
    rFonts.set(qn("w:eastAsia"), east)


def add_numbering_part(doc):
    numbering = doc.part.numbering_part.element
    numbering.append(parse_xml(
        '<w:abstractNum %s w:abstractNumId="100">'
        '<w:multiLevelType w:val="hybridMultilevel"/>'
        '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/>'
        '<w:lvlText w:val="\u2022"/><w:lvlJc w:val="left"/>'
        '<w:pPr><w:ind w:left="540" w:hanging="270"/></w:pPr>'
        '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>'
        '</w:abstractNum>' % nsdecls("w"),
    ))
    numbering.append(parse_xml(
        '<w:abstractNum %s w:abstractNumId="101">'
        '<w:multiLevelType w:val="hybridMultilevel"/>'
        '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/>'
        '<w:lvlText w:val="%%1."/><w:lvlJc w:val="left"/>'
        '<w:pPr><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl>'
        '</w:abstractNum>' % nsdecls("w"),
    ))
    numbering.append(CT_Num.new(100, 100))
    numbering.append(CT_Num.new(101, 101))


def add_numpr(p, num_id):
    pPr = p._p.get_or_add_pPr()
    numPr = OxmlElement("w:numPr")
    ilvl = OxmlElement("w:ilvl")
    ilvl.set(qn("w:val"), "0")
    numId = OxmlElement("w:numId")
    numId.set(qn("w:val"), str(num_id))
    numPr.append(ilvl)
    numPr.append(numId)
    pPr.append(numPr)
    p.paragraph_format.left_indent = Twips(540)
    p.paragraph_format.first_line_indent = Twips(-270)


def para(doc, text="", size=BODY_SIZE, bold=False, italic=False, color=None, align=None, before=0, after=6, line=BODY_LINE):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line / 240.0 if line else None
    if align is not None:
        pf.alignment = align
    if text:
        set_run(p.add_run(text), size=size, bold=bold, italic=italic, color=color)
    return p


def bullet(doc, text, after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = BODY_LINE / 240.0
    add_numpr(p, 100)
    set_run(p.add_run(text))
    return p


def numbered(doc, text, after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.line_spacing = BODY_LINE / 240.0
    add_numpr(p, 101)
    set_run(p.add_run(text))
    return p


def h1(doc, text):
    p = doc.add_heading(text, level=1)
    return p


def h2(doc, text):
    return doc.add_heading(text, level=2)


def h3(doc, text):
    return doc.add_heading(text, level=3)


def shade_cell(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)


def set_cell(cell, text, bold=False, color=None, align="left", size=10.5, fill=None):
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.1
    if align == "center":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "right":
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    set_run(p.add_run(text), size=size, bold=bold, color=color)
    if fill:
        shade_cell(cell, fill)


def add_table(doc, headers, rows, weights, header_align="left", body_align="left"):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    table.alignment = 1
    for j, htext in enumerate(headers):
        set_cell(table.rows[0].cells[j], htext, bold=True, align="center", fill=TABLE_HEADER_FILL)
    trPr = table.rows[0]._tr.get_or_add_trPr()
    tblHeader = OxmlElement("w:tblHeader")
    tblHeader.set(qn("w:val"), "true")
    trPr.append(tblHeader)
    for i, row in enumerate(rows, start=1):
        for j, val in enumerate(row):
            set_cell(table.rows[i].cells[j], val, align=body_align if j > 0 else header_align)
    widths = column_widths_from_weights(weights, 9360)
    apply_table_geometry(table, column_widths_dxa=widths)
    return table


def add_note(doc, label, text):
    table = doc.add_table(rows=1, cols=1)
    table.style = "Table Grid"
    cell = table.rows[0].cells[0]
    shade_cell(cell, CALLOUT_FILL)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.25
    set_run(p.add_run(label + "："), bold=True, color=INK_BLUE)
    set_run(p.add_run(text))
    apply_table_geometry(table, column_widths_dxa=column_widths_from_weights([1], 9360))
    return table


def add_figure(doc, filename, caption, width=2.1):
    img = os.path.join(IMG_DIR, filename)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(2)
    inline = p.add_run().add_picture(img, width=Inches(width))
    inline._inline.docPr.set("descr", caption)
    cap = doc.add_paragraph(caption, style="Caption")
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_after = Pt(10)


def page_break(doc):
    from docx.enum.text import WD_BREAK
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)


def add_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.paragraph_format.tab_stops.add_tab_stop(Inches(6.5), 2)  # right tab
    set_run(p.add_run("心桥 · 产品使用文档"), size=8.5, color=MUTED)
    r = p.add_run("\t第 ")
    set_run(r, size=8.5, color=MUTED)
    run = p.add_run()
    set_run(run, size=8.5, color=MUTED)
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld2 = OxmlElement("w:fldChar")
    fld2.set(qn("w:fldCharType"), "end")
    run._r.append(fld1)
    run._r.append(instr)
    run._r.append(fld2)
    run2 = p.add_run(" 页")
    set_run(run2, size=8.5, color=MUTED)


def build():
    os.makedirs(OUT_DIR, exist_ok=True)
    doc = Document()

    # page setup (US Letter, 1in margins)
    sec = doc.sections[0]
    sec.page_width = Inches(8.5)
    sec.page_height = Inches(11)
    sec.top_margin = Inches(1)
    sec.right_margin = Inches(1)
    sec.bottom_margin = Inches(1)
    sec.left_margin = Inches(1)
    sec.header_distance = Inches(0.492)
    sec.footer_distance = Inches(0.492)

    # styles
    normal = doc.styles["Normal"]
    set_style_font(normal, BODY_SIZE)
    normal.paragraph_format.space_after = BODY_AFTER
    normal.paragraph_format.line_spacing = BODY_LINE / 240.0
    for level, tokens in HEADINGS.items():
        st = doc.styles["Heading %d" % level]
        set_style_font(st, tokens["size"], bold=True, color=tokens["color"], east=HEAD_EAST)
        st.paragraph_format.space_before = Pt(tokens["before"])
        st.paragraph_format.space_after = Pt(tokens["after"])
        st.paragraph_format.keep_with_next = True
    cap_style = doc.styles["Caption"]
    set_style_font(cap_style, 9.5, color=MUTED)
    cap_style.paragraph_format.space_before = Pt(2)
    cap_style.paragraph_format.space_after = Pt(10)

    add_numbering_part(doc)
    add_footer(sec)

    # ---------- cover (editorial_cover) ----------
    para(doc, "客户生日关怀助手 · 产品用户手册", size=12, bold=True, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, before=90, after=14)
    para(doc, "心桥", size=30, bold=True, color=INK_BLUE, align=WD_ALIGN_PARAGRAPH.CENTER, after=8)
    para(doc, "为你搭建与客户之间心的桥梁", size=14, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, after=40)
    for line in [
        "版本：V1.0",
        "适用对象：银行客户经理",
        "在线访问：https://xinqiao.ninkoro.com",
        "运行方式：浏览器本地运行（数据存储于本机 IndexedDB，无需服务器）",
        "演示数据：客户生日关怀助手_产品展示数据.xlsx（48 位客户）",
    ]:
        para(doc, line, size=10.5, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, after=6)
    para(doc, "", after=120)
    para(doc, "Powered by Ninkoro.com", size=9.5, color=MUTED, align=WD_ALIGN_PARAGRAPH.CENTER, after=0)
    page_break(doc)

    # ---------- 目录 ----------
    h1(doc, "目录")
    toc_items = [
        "1  产品简介",
        "2  快速开始",
        "3  首页工作台",
        "4  客户管理",
        "5  生日提醒",
        "6  生日祝福助手",
        "7  维护记录",
        "8  设置",
        "9  常见问题（FAQ）",
        "10  版本信息",
        "附录 A  常用操作速查",
    ]
    for item in toc_items:
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_after = Pt(5)
        set_run(p.add_run(item), size=11)
    page_break(doc)

    # ---------- 1 产品简介 ----------
    h1(doc, "1  产品简介")
    h2(doc, "1.1  产品定位")
    para(doc, "心桥（客户生日关怀助手）是一款面向银行客户经理的轻量化客户关系维护工具，品牌口号为“为你搭建与客户之间心的桥梁”。产品以“客户编号 + 生日提醒 + 祝福辅助 + 维护记录”为主线，帮助客户经理每天用 30 秒到 2 分钟完成重点客户的生日关怀，避免遗漏、沉淀关系资产。")
    h2(doc, "1.2  核心功能一览")
    for item in [
        "首页工作台：今日生日、未来 7 天（不含今天）、A 类客户统计一目了然；",
        "客户管理：新增、编辑、删除、搜索、筛选，支持客户详情、家属关系与历史维护记录；",
        "Excel 批量导入：模板下载、智能生日解析、格式校验、重复处理，导入后可撤销；",
        "生日提醒：提前 7 天提醒，当天 A 类客户 09:00 / 10:00 / 14:00 三次提醒；",
        "祝福助手：按行业、等级、备注关键词离线随机生成个性化祝福（30-80 字）；",
        "维护记录：电话/微信记录、自动记录日期，支持二次编辑；",
        "PWA 离线：首次访问后断网可用，可安装到桌面或手机主屏。",
    ]:
        bullet(doc, item)
    h2(doc, "1.3  隐私与数据安全")
    add_note(doc, "隐私说明", "系统仅保存行内客户编号、客户简称、生日、性别、行业、客户等级与备注；不保存身份证号码、银行账号、完整客户姓名与交易信息。全部数据仅存储在本机浏览器，不上传任何服务器。")
    bullet(doc, "换设备前请先在“设置 → 数据导出”导出备份，再在新设备导入。")

    # ---------- 2 快速开始 ----------
    h1(doc, "2  快速开始")
    h2(doc, "2.1  访问方式")
    for item in [
        "在线访问（推荐）：https://xinqiao.ninkoro.com，支持 PWA 安装与离线使用；",
        "本地直接使用：构建后双击 dist/index.html（单文件自包含，无需安装任何服务）；",
        "本地开发预览：运行 npm run preview 后访问 http://localhost:4173；",
    ]:
        bullet(doc, item)
    h2(doc, "2.2  安装为应用（PWA）")
    numbered(doc, "使用 Chrome 或 Edge 浏览器打开 https://xinqiao.ninkoro.com；")
    numbered(doc, "点击地址栏右侧的“安装”图标，或通过菜单选择“安装应用”；")
    numbered(doc, "桌面或手机主屏出现应用图标后，即可像普通应用一样使用，断网也能查看与记录。")
    h2(doc, "2.3  安装为应用（iOS Safari 添加到主屏幕）")
    para(doc, "在 iPhone / iPad 上，无需安装 App Store 应用，通过 Safari 即可把心桥添加到主屏幕，获得接近原生 App 的全屏使用体验：")
    numbered(doc, "使用 iPhone / iPad 自带的 Safari 浏览器打开 https://xinqiao.ninkoro.com；")
    numbered(doc, "点击屏幕底部工具栏中间的“分享”按钮（方框加向上箭头图标）；")
    numbered(doc, "在弹出的菜单中向下滑动，选择“添加到主屏幕”；")
    numbered(doc, "确认应用名称（如“心桥”）后，点击右上角“添加”；")
    numbered(doc, "返回主屏幕，点击“心桥”图标即可全屏打开使用，数据与网页版完全一致。")
    add_note(doc, "iOS 提示", "iOS 网页 App 不支持系统级定时通知，请每天打开应用查看首页与提醒页；其余功能（客户管理、导入导出、离线查看）与网页版完全一致。")
    h2(doc, "2.4  导入演示数据")
    numbered(doc, "进入“客户 → 批量导入”；")
    numbered(doc, "点击“下载模板”了解字段要求，或直接选择演示数据文件《客户生日关怀助手_产品展示数据.xlsx》；")
    numbered(doc, "上传后系统自动校验，展示可导入数量与错误提示（见图 1）；")
    numbered(doc, "确认无误后点击“跳过 / 覆盖”，完成导入（见图 2）；")
    numbered(doc, "返回首页即可看到今日生日与未来 7 天客户，开始体验完整流程。")
    add_figure(doc, "07-import-check.png", "图 1  批量导入校验结果")
    add_figure(doc, "08-import-result.png", "图 2  批量导入完成")

    # ---------- 3 首页工作台 ----------
    h1(doc, "3  首页工作台")
    add_figure(doc, "01-home.png", "图 3  首页工作台")
    h2(doc, "3.1  顶部统计")
    para(doc, "打开应用即可看到三个统计数字：今日生日、未来 7 天（不含今天）、A 类客户数量，方便第一时间判断当天工作量。")
    h2(doc, "3.2  今日生日卡片")
    for item in [
        "卡片展示客户简称、客户编号、行业与备注；",
        "点击“生成祝福”打开祝福助手，生成个性化祝福语；",
        "点击“完成维护”登记本次关怀（方式与内容），登记后卡片标记“今日已维护”。",
    ]:
        bullet(doc, item)
    h2(doc, "3.3  未来 7 天生日")
    bullet(doc, "按距离生日天数列出未来 7 天（不含今天）的客户；")
    bullet(doc, "点击任一卡片可进入客户详情页，查看完整资料与历史维护记录。")

    # ---------- 4 客户管理 ----------
    h1(doc, "4  客户管理")
    h2(doc, "4.1  客户列表与搜索筛选")
    add_figure(doc, "02-customers.png", "图 4  客户列表（A 类筛选）")
    add_figure(doc, "03-customer-search.png", "图 5  客户搜索")
    for item in [
        "搜索：支持按客户编号、客户简称搜索；",
        "筛选：按等级（A/B/C）、时间（今日生日 / 未来 7 天 / 本月生日）、行业组合筛选；",
        "行内操作：查看详情、编辑客户、删除客户（删除会连同维护记录一起删除，需确认）。",
    ]:
        bullet(doc, item)
    h2(doc, "4.2  新增客户")
    add_figure(doc, "12-add-customer.png", "图 6  新增客户表单")
    add_table(
        doc,
        ["字段", "必填", "说明"],
        [
            ["客户编号", "是", "行内唯一，用于对应行内客户，如 C20260001"],
            ["客户简称", "是", "脱敏名称，如 刘先生 / 刘XX"],
            ["生日", "是", "支持 YYYY-MM-DD 或仅月日 MM-DD（如 08-05）"],
            ["性别", "否", "男 / 女 / 未知"],
            ["行业", "否", "制造业、建筑业、房地产、批发零售、信息技术、服务业、金融业、其他"],
            ["客户等级", "否", "A 类重点客户 / B 类重要客户 / C 类普通客户"],
            ["备注", "否", "如：合作5年以上、喜欢茶文化（可触发祝福个性化）"],
            ["所属公司", "否", "用于公私联动与客户精准画像，如 华兴制造集团"],
            ["职位", "否", "如 总经理 / 财务总监"],
        ],
        [1.2, 0.7, 4.6],
    )
    h2(doc, "4.3  客户详情与历史维护记录")
    add_figure(doc, "04-customer-detail.png", "图 7  客户详情（家属关系与历史维护记录）")
    para(doc, "客户详情页集中展示客户完整信息（编号、性别、行业、生日、距离生日天数、备注），并提供“编辑客户 / 生成祝福 / 完成维护”快捷操作。“家属关系”模块可登记客户家属（夫妻 / 子女 / 父母 / 其他）：支持按客户编号或姓名搜索添加关联客户（点击家属姓名可直接跳转到对方详情页），也可仅登记姓名与备注；关联关系双向自动同步，被添加客户的详情页会同步出现对应从属关系（如 A 添加“子女 B”，B 的详情页自动显示“父母 A”）。删除关联时双方同步移除。“历史维护记录”模块按时间倒序展示该客户过往全部维护记录，每条记录包含维护日期与内容，可直接在此二次编辑。")
    h2(doc, "4.4  编辑与删除客户")
    bullet(doc, "编辑：客户列表行内点击编辑图标，或进入客户详情后点击“编辑客户”；")
    bullet(doc, "删除：客户列表行内点击删除图标，确认后删除该客户及其全部维护记录。")
    h2(doc, "4.5  Excel 批量导入")
    para(doc, "批量导入支持智能解析生日格式，无论用户填写什么格式，系统都会自动识别并统一转换为 YYYY-MM-DD 或 MM-DD 存储。")
    add_table(
        doc,
        ["输入格式", "示例", "统一存储"],
        [
            ["YYYY-MM-DD", "1990-08-05", "1990-08-05"],
            ["MM-DD（仅月日）", "08-05", "08-05"],
            ["YYYY/MM/DD", "1990/08/05", "1990-08-05"],
            ["YYYY.MM.DD", "1990.08.05", "1990-08-05"],
            ["中文日期", "1990年8月5日 / 8月5日", "1990-08-05 / 08-05"],
            ["省略补零", "8-5 / 8/5 / 8.5", "08-05"],
            ["Excel 日期序列号", "45874 等", "自动转换为日期"],
        ],
        [2.0, 2.0, 2.5],
    )
    para(doc, "导入校验错误提示如下：", before=6, after=4)
    add_table(
        doc,
        ["场景", "提示"],
        [
            ["客户编号为空", "第N行：客户编号不能为空"],
            ["生日为空", "生日不能为空"],
            ["生日无法识别", "生日格式无法识别，请填写例如：1990-08-05、08-05、1990年8月5日"],
            ["生日不存在（如 2026-02-30）", "生日日期不存在，请检查年月日是否正确"],
            ["客户编号重复", "可选择“覆盖 / 跳过 / 取消”处理"],
        ],
        [2.6, 3.9],
    )
    add_note(doc, "导入撤销", "导入完成后可立即在结果页点击“撤销导入”，或稍后到“设置 → 撤销上次导入”一键回退误导入的数据，包括删除新增客户及其维护记录、还原被覆盖的客户资料。")

    # ---------- 5 生日提醒 ----------
    h1(doc, "5  生日提醒")
    add_figure(doc, "06-reminders.png", "图 8  提醒页（提前 7 天 + 当天提醒）")
    h2(doc, "5.1  提前 7 天提醒")
    para(doc, "生日前 7 天，客户会同时出现在首页“未来 7 天生日”与“提醒”页，提示“请提前安排客户关怀”。提醒卡片可点击，直接进入客户详情查看资料与历史维护记录。")
    h2(doc, "5.2  当天提醒（A 类客户）")
    para(doc, "生日当天，A 类客户在提醒页按 09:00、10:00、14:00 三个时间点展示提醒。完成联系后点击“标记已联系”，状态变为“已联系”。")
    h2(doc, "5.3  提醒开关")
    para(doc, "可在“设置 → 提醒设置”中分别开启或关闭“提前 7 天提醒”与“当天提醒”。")

    # ---------- 6 生日祝福助手 ----------
    h1(doc, "6  生日祝福助手")
    add_figure(doc, "05-blessing.png", "图 9  生日祝福（个性化随机生成）")
    h2(doc, "6.1  生成规则")
    for item in [
        "按客户等级选取信任话术（A 类更郑重、B 类亲切、C 类简洁）；",
        "按行业选取事业祝愿（8 个行业各有多个备选句）；",
        "按备注关键词智能解析个性化话题：茶、授信、理财、对公/结算、私行、创业、合作年限等 20 余类；",
        "各组件随机组合，自动控制 30-80 字，微信聊天风格，全程本地离线生成，不调用网络与 AI。",
    ]:
        bullet(doc, item)
    h2(doc, "6.2  操作步骤")
    numbered(doc, "在今日生日卡片点击“生成祝福”；")
    numbered(doc, "不满意可点击“换一换”，重新随机生成；")
    numbered(doc, "点击“复制”，粘贴到微信或短信发送给客户。")
    h2(doc, "6.3  个性化示例")
    add_note(doc, "示例", "制造业 A 类客户，备注“合作5年以上，喜欢茶文化”：\n刘先生，生日快乐！\n很荣幸能与您长期同行。\n祝您订单满满，事业再上一层楼。\n改天请您喝茶，好好聊聊。\n祝您一切顺利，常联系！")

    # ---------- 7 维护记录 ----------
    h1(doc, "7  维护记录")
    h2(doc, "7.1  新增维护记录")
    para(doc, "在今日生日卡片点击“完成维护”，或在提醒页点击“标记已联系”，选择方式（电话 / 微信）并填写内容，系统自动记录当天日期。")
    h2(doc, "7.2  二次编辑")
    add_figure(doc, "11-record-edit.png", "图 10  维护记录二次编辑")
    bullet(doc, "入口：提醒页“维护记录”列表，或客户详情页“历史维护记录”模块；")
    bullet(doc, "可修改“方式”与“内容”，维护日期保持不变；")
    bullet(doc, "修改后列表与详情页实时同步更新。")

    # ---------- 8 设置 ----------
    h1(doc, "8  设置")
    add_figure(doc, "09-settings.png", "图 11  设置页")
    h2(doc, "8.1  数据管理")
    for item in [
        "下载 Excel 模板：获取标准导入模板；",
        "批量导入：从设置页也可发起批量导入；",
        "数据导出：导出全部客户与维护记录（.xlsx），用于备份；",
        "撤销上次导入：回退最近一次批量导入（导入完成后显示）。",
    ]:
        bullet(doc, item)
    h2(doc, "8.2  清空所有数据（三次确认）")
    add_figure(doc, "10-clear-data.png", "图 12  清空数据三次确认")
    numbered(doc, "点击“清空数据”，弹出第一次确认“清空所有数据？”；")
    numbered(doc, "点击“继续”，进入第二次确认“再次确认”；")
    numbered(doc, "点击“再次确认”，进入“最后确认”，点击红色“确认清空”后执行；")
    numbered(doc, "清空将永久删除全部客户与维护记录，删除后不可恢复，请谨慎操作。")
    h2(doc, "8.3  提醒设置")
    para(doc, "可分别开关“提前 7 天提醒”与“当天提醒（A 类客户）”，设置自动保存在本机。")
    h2(doc, "8.4  隐私说明")
    para(doc, "仅保存客户编号、简称、生日、性别、行业、等级与备注；不保存身份证号、账号、完整姓名与交易信息；数据仅存于本机浏览器，不上传服务器。")

    # ---------- 9 FAQ ----------
    h1(doc, "9  常见问题（FAQ）")
    qa = [
        ("直接双击页面是空白怎么办？", "请使用构建后的 dist/index.html（单文件），或通过本地服务 / 在线地址访问；PWA 安装与离线能力需要 https 或 localhost 环境。"),
        ("客户数据会不会上传？", "不会。全部数据仅保存在本机浏览器（IndexedDB），可通过“设置 → 数据导出”备份。"),
        ("如何登记客户家属？", "进入客户详情页 → “家属关系” → 新增家属，选择关系类型（夫妻 / 子女 / 父母 / 其他），可按客户编号或姓名搜索添加关联客户（双向自动同步），或仅填写姓名与备注。"),
        ("iPhone / iPad 上如何像 App 一样使用？", "用 Safari 打开 https://xinqiao.ninkoro.com → 点击“分享” → “添加到主屏幕”，主屏幕即可生成应用图标，全屏使用。"),
        ("iOS 上会收到定时提醒推送吗？", "iOS 网页 App 不支持系统级推送，请每天打开应用查看首页与提醒页；Android 与桌面端 PWA 同样以打开应用查看提醒为主。"),
        ("生日只有月日、没有年份可以吗？", "可以。新增与导入均支持仅填月日，如 08-05，系统按“下一次生日”自动计算提醒。"),
        ("误导入了一批客户怎么办？", "导入完成后可立即点击“撤销导入”，或稍后到“设置 → 撤销上次导入”一键回退。"),
        ("维护记录填错了能修改吗？", "可以。在提醒页“维护记录”或客户详情页“历史维护记录”中点击编辑图标即可修改方式与内容。"),
        ("清空数据后还能找回吗？", "不能。清空为永久删除，建议定期导出备份后再进行清空操作。"),
    ]
    for q, a in qa:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        set_run(p.add_run(q), bold=True)
        para(doc, a, after=6)

    # ---------- 10 版本信息 ----------
    h1(doc, "10  版本信息")
    add_table(
        doc,
        ["项目", "内容"],
        [
            ["产品名称", "心桥"],
            ["产品定位", "客户生日关怀助手（品牌口号：为你搭建与客户之间心的桥梁）"],
            ["在线访问", "https://xinqiao.ninkoro.com"],
            ["版本", "V1.0"],
            ["技术栈", "React + TypeScript + Vite + IndexedDB"],
            ["数据存储", "本机浏览器 IndexedDB（本地优先，隐私友好）"],
            ["部署方式", "个人网站（xinqiao.ninkoro.com）/ 本地单文件（dist/index.html）"],
            ["演示数据", "48 位客户（demo/客户生日关怀助手_产品展示数据.xlsx）"],
            ["版权标识", "Powered by Ninkoro.com"],
            ["更新日期", "2026-08-05"],
        ],
        [1.8, 4.7],
    )

    # ---------- 附录 A ----------
    h1(doc, "附录 A  常用操作速查")
    add_table(
        doc,
        ["操作", "入口"],
        [
            ["查看今日生日客户", "首页 → 今日生日"],
            ["查看未来 7 天客户", "首页 → 未来 7 天生日 / 提醒页"],
            ["新增客户", "客户 → 新增客户"],
            ["批量导入", "客户 → 批量导入 / 设置 → 批量导入"],
            ["安装到 iPhone 主屏幕", "Safari → 分享 → 添加到主屏幕"],
            ["登记家属关系", "客户详情 → 家属关系 → 新增家属"],
            ["撤销导入", "导入结果页 / 设置 → 撤销上次导入"],
            ["生成祝福", "今日生日卡片 → 生成祝福"],
            ["完成维护", "今日生日卡片 → 完成维护"],
            ["编辑维护记录", "提醒 → 维护记录 / 客户详情 → 历史维护记录"],
            ["导出数据", "设置 → 数据导出"],
            ["清空数据", "设置 → 清空所有数据（三次确认）"],
        ],
        [2.4, 4.1],
    )

    doc.save(OUT)
    print("saved:", OUT)


if __name__ == "__main__":
    build()
