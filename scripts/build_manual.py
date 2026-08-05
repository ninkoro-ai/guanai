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
    para(doc, "心的桥梁", size=14, color=GRAY, align=WD_ALIGN_PARAGRAPH.CENTER, after=40)
    for line in [
        "版本：V1.3",
        "适用对象：银行客户经理",
        "产品定位：客户关怀系统",
        "在线访问：https://xinqiao.ninkoro.com",
        "访问方式：通过浏览器访问 https://xinqiao.ninkoro.com（唯一访问入口）",
        "数据存储：本机浏览器 IndexedDB（隐私友好，无需服务器）",
        "全量版：含全部已上线功能与每个功能的设计考量说明",
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
    para(doc, "心桥是一款面向银行客户经理的客户关怀系统，品牌 slogan 为“心的桥梁”，常驻展示在应用顶部标题区。产品以“客户编号 + 生日提醒 + 祝福辅助 + 维护记录 + 家属关系”为主线，帮助客户经理每天用 30 秒到 2 分钟完成重点客户的关怀，避免遗漏、沉淀关系资产。")
    h2(doc, "1.2  核心功能一览")
    for item in [
        "首页工作台：今日生日、未来 7 天（不含今天）、A 类客户统计一目了然；",
        "客户管理：新增、编辑、删除、搜索、筛选，支持客户详情、家属关系与历史维护记录；",
        "Excel 批量导入：模板下载、智能生日解析、格式校验、重复处理，导入后可撤销；",
        "生日提醒：提前 7 天提醒，当天 A 类客户 09:00 / 10:00 / 14:00 三次提醒；",
        "祝福助手：按行业、等级、备注关键词离线随机生成个性化祝福（30-80 字）；",
        "维护记录：电话/微信记录、自动记录日期，支持二次编辑；",
        "客户星标：C 类客户也能被单独标记置顶，重要客户不遗漏；",
        "生日画像标签：含年份的生日自动显示年龄、属相、本命年、星座；",
        "家属关系增强：关联人生日倒计时、备注跟随关联人本人；",
        "数据备份提醒：完成关怀后提醒及时导出，避免清缓存/换机丢数据；",
        "轻量化导入导出：模板精简、导出跳过空单元格，文件更小更快；",
        "PWA 离线：首次访问后断网可用，可安装到桌面或手机主屏。",
    ]:
        bullet(doc, item)
    h2(doc, "1.3  隐私与数据安全")
    add_note(doc, "隐私说明", "系统仅保存行内客户编号、客户简称、生日、性别、行业、客户等级与备注；不保存身份证号码、银行账号、完整客户姓名与交易信息。全部数据仅存储在本机浏览器，不上传任何服务器。")
    bullet(doc, "换设备前请先在“设置 → 数据导出”导出备份，再在新设备导入。")
    add_note(doc, "设计考量", "数据只存在本机，是隐私与零成本的结果，但也意味着“清缓存、清历史、换手机”都可能让数据消失。因此产品在完成关怀后会提醒你及时导出，并持续把模板与导出文件做得更轻，方便备份与迁移。")

    # ---------- 2 快速开始 ----------
    h1(doc, "2  快速开始")
    h2(doc, "2.1  访问方式")
    para(doc, "心桥的唯一访问入口为网页地址：https://xinqiao.ninkoro.com。使用电脑或手机浏览器打开即可使用，无需安装任何软件；首次访问后支持断网离线查看与记录，也可将网页添加到桌面或手机主屏获得更接近 App 的体验（见 2.2、2.3 节）。")
    add_note(doc, "重要提示", "请始终通过 https://xinqiao.ninkoro.com 访问心桥；使用其他来源的副本或离线文件无法保证功能完整与数据安全。")
    add_note(doc, "设计考量", "只保留一个访问入口，是为了让你永远用的是最新版本，也避免“文件版本不一致导致数据对不上”的困扰；网页应用的安装与离线能力都基于同一个地址，数据始终一致。")
    h2(doc, "2.2  安装为应用（PWA）")
    para(doc, "以下安装方式均基于同一网页地址 xinqiao.ninkoro.com，仅是“把网页快捷方式添加到桌面/主屏”，并非独立的分发渠道，数据与网页版完全一致。")
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
    h2(doc, "3.0  顶部标题区（品牌与问候）")
    para(doc, "顶部标题区展示品牌信息与个人问候：左侧为“心桥 · 客户关怀系统”与品牌 slogan“心的桥梁”；中间居中显示当天日期；右侧为应用图标与“Hi，用户名”问候。用户名可在“设置 → 账户与团队”中填写，未设置时显示“Hi，客户经理”。")
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
    add_note(doc, "设计考量", "首页只回答三个问题：今天该维护谁、近期该准备谁、重点在哪里。今日卡片自带“生成祝福 / 完成维护”，让你在一条路径上完成“看名单 → 发祝福 → 记结果”，不来回跳页面。")

    # ---------- 4 客户管理 ----------
    h1(doc, "4  客户管理")
    h2(doc, "4.1  客户列表与搜索筛选")
    add_figure(doc, "02-customers.png", "图 4  客户列表（A 类筛选）")
    add_figure(doc, "03-customer-search.png", "图 5  客户搜索")
    for item in [
        "搜索：支持按客户编号、客户简称搜索；",
        "排序：默认按“距离生日倒计时”正序排列，最近过生日的客户排在最前；",
        "分页：每页展示 20 位客户，底部提供“上一页 / 下一页”与页码，并统计客户总数；",
        "筛选：时间（今日生日 / 未来 7 天 / 本月生日）用快捷按钮，其余条件整合为下拉菜单——等级、行业、星标、生日月份、星座、属相，可组合使用，方便按月份/星座/属相批量准备礼物；",
        "星标：列表行可一键设为星标，可通过“星标”筛选单独查看重点客户；",
        "生日标签：生日含年份的客户，列表自动显示年龄、属相、星座，本命年客户额外高亮；",
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
            ["生日", "是", "支持多种格式自动识别：1990-08-05、08-05、1990年8月5日、8月5日 等，统一保存"],
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
    para(doc, "客户详情页集中展示客户完整信息（编号、性别、行业、生日、距离生日天数、备注、公司、职位），生日含年份时还会显示年龄、属相、星座与本命年标签，并提供“编辑客户 / 生成祝福 / 完成维护”快捷操作。“家属关系”模块可登记客户家属（夫妻 / 子女 / 父母 / 其他）：支持按客户编号或姓名搜索添加关联客户（点击家属姓名可直接跳转到对方详情页，并显示该关联人的生日倒计时，如“生日：6 天后”），也可仅登记姓名；关联关系双向自动同步，被添加客户的详情页会同步出现对应从属关系（如 A 添加“子女 B”，B 的详情页自动显示“父母 A”）。家属关系的备注跟随关联人本人：例如在张小姐的档案里为父亲张先生填写“喜欢雪茄”，这条信息会出现在张先生本人的信息中，而不会串到“张先生的子女张小姐”条目上，送礼与话术才不会张冠李戴。删除关联时双方同步移除。客户编辑弹窗内同样提供家属关系维护入口，首页今日卡片、客户列表行、提醒时间线均可点击进入客户详情。“历史维护记录”模块按时间倒序展示该客户过往全部维护记录，每条记录包含维护日期与内容，可直接在此二次编辑。")
    h2(doc, "4.4  编辑与删除客户")
    bullet(doc, "编辑：客户列表行内点击编辑图标（或直接点击该行），或进入客户详情后点击“编辑客户”；编辑弹窗内可直接维护家属关系；")
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

    h2(doc, "4.6  星标客户")
    add_figure(doc, "14-star-customers.png", "图 8  星标筛选（星标客户置顶）")
    para(doc, "星标是与 A/B/C 等级相互独立的标记：等级衡量客户价值，星标表达“值得被记住”。比如某位 C 类老客户是重要的引荐人，或某位客户正处于关键业务节点，都可以一键打星。")
    numbered(doc, "客户列表行点击星形图标即可设为星标（再点一次取消），详情页右上角同样可切换；")
    numbered(doc, "星标客户在列表中自动置顶，首页与提醒页也会显示星标图标；")
    numbered(doc, "点击列表上方的“星标”筛选，可单独查看全部星标客户；")
    numbered(doc, "导入模板与导出文件均包含“星标”列（是/否），换设备后星标不丢失。")
    add_note(doc, "设计考量", "银行客户的价值等级往往由系统规则决定，但“谁值得我多花心思”是个人的判断——星标把这个判断交还给你，C 类客户也可以被单独记住。")

    add_note(doc, "设计考量", "客户管理模块围绕“找得到、录得快、可回退”设计：搜索与组合筛选解决客户多找不到，智能导入解决迁移成本，撤销与确认保护误操作；生日标签与星标则服务于“精准画像”与“重点不遗漏”。")

    # ---------- 5 生日提醒 ----------
    h1(doc, "5  生日提醒")
    add_figure(doc, "06-reminders.png", "图 9  提醒页（提前 7 天 + 当天提醒）")
    h2(doc, "5.1  提前 7 天提醒")
    para(doc, "生日前 7 天，客户会同时出现在首页“未来 7 天生日”与“提醒”页，提示“请提前安排客户关怀”。提醒卡片可点击，直接进入客户详情查看资料与历史维护记录。")
    h2(doc, "5.2  当天提醒（A 类客户）")
    para(doc, "生日当天，A 类客户在提醒页按 09:00、10:00、14:00 三个时间点展示提醒。完成联系后点击“标记已联系”，状态变为“已联系”。")
    h2(doc, "5.3  提醒开关")
    para(doc, "可在“设置 → 提醒设置”中分别开启或关闭“提前 7 天提醒”与“当天提醒”。")
    add_note(doc, "设计考量", "提前 7 天是为了“来得及”——订花、备礼、约时间都需要提前量；当天 A 类客户分 09:00 / 10:00 / 14:00 三次提醒，是因为重点客户通常一次触达不到位。提醒状态由“当天是否已维护”自动判断，跨年也不会过期。")

    # ---------- 6 生日祝福助手 ----------
    h1(doc, "6  生日祝福助手")
    add_figure(doc, "05-blessing.png", "图 10  生日祝福（个性化随机生成）")
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
    add_note(doc, "设计考量", "祝福语是高情感价值、低成本的触达，但群发模板最伤感情，所以按等级、行业、备注关键词个性化生成，像人写的话。为了隐私与零成本，生成完全在本机离线完成。生日标签（年龄、属相、星座、本命年）正是为这类场景准备的画像素材：马年给属马客户送红绳、按星座聊话题、按年龄把握称呼与关怀分寸。")

    # ---------- 7 维护记录 ----------
    h1(doc, "7  维护记录")
    h2(doc, "7.1  新增维护记录")
    para(doc, "在今日生日卡片点击“完成维护”，或在提醒页点击“标记已联系”，选择方式（电话 / 微信）并填写内容，系统自动记录当天日期。")
    h2(doc, "7.2  二次编辑")
    add_figure(doc, "11-record-edit.png", "图 11  维护记录二次编辑")
    bullet(doc, "入口：提醒页“维护记录”列表，或客户详情页“历史维护记录”模块；")
    bullet(doc, "可修改“方式”与“内容”，维护日期保持不变；")
    bullet(doc, "修改后列表与详情页实时同步更新。")
    h2(doc, "7.3  完成关怀后的备份提醒")
    add_figure(doc, "13-export-reminder.png", "图 12  数据备份提醒（每日一次）")
    para(doc, "每次完成关怀（保存一条新的维护记录）后，系统会弹出“数据备份提醒”：心桥的数据保存在本机浏览器，手机清理内存、清除历史记录或卸载应用都可能导致数据丢失，建议及时到“设置 → 数据导出”备份。")
    numbered(doc, "点击“去导出”直接跳转到设置页的导出入口；")
    numbered(doc, "点击“稍后再说”关闭；")
    numbered(doc, "同一天内最多提醒一次，不会反复打扰，次日继续完成关怀时仍会提醒。")
    add_note(doc, "设计考量", "把备份提醒放在“完成关怀”之后，恰好是你最有空、最顺手的时刻；每日一次是克制。导出文件会跳过空单元格并设置紧凑列宽，体积更小，方便保存到电脑或云端。")

    # ---------- 8 设置 ----------
    h1(doc, "8  设置")
    add_figure(doc, "09-settings.png", "图 13  设置页")
    para(doc, "设置页按类别分组展示，共三组：账户与团队、数据管理、提醒设置。")
    h2(doc, "8.1  账户与团队")
    para(doc, "填写当前用户名与所属团队：用户名会显示在顶部标题区的“Hi，用户名”问候中，增加归属感；团队信息将用于后续日报/周报汇总时按团队归类数据。填写后离开输入框即自动保存。")
    h2(doc, "8.2  演示模式")
    para(doc, "开启演示模式后，应用会加载内置的演示数据（34 位客户，含家属关系、维护记录、星标与生日画像标签），用于快速体验每一项功能；演示数据与您的真实数据完全隔离（分别存储），关闭演示模式后自动恢复您的数据，互不影响。")
    h2(doc, "8.3  数据管理")
    for item in [
        "下载 Excel 模板：获取标准导入模板；",
        "批量导入：从设置页也可发起批量导入；",
        "数据导出：导出全部客户、维护记录与家属关系（.xlsx），用于备份；",
        "撤销上次导入：回退最近一次批量导入（导入完成后显示）；",
        "轻量化说明：模板精简了示例行，导出会跳过空单元格并压缩列宽，文件更小、传输更快。",
    ]:
        bullet(doc, item)
    h2(doc, "8.4  清空所有数据（三次确认）")
    add_figure(doc, "10-clear-data.png", "图 14  清空数据三次确认")
    numbered(doc, "点击“清空数据”，弹出第一次确认“清空所有数据？”；")
    numbered(doc, "点击“继续”，进入第二次确认“再次确认”；")
    numbered(doc, "点击“再次确认”，进入“最后确认”，点击红色“确认清空”后执行；")
    numbered(doc, "清空将永久删除全部客户、维护记录与家属关系，删除后不可恢复，请谨慎操作。")
    h2(doc, "8.5  提醒设置")
    para(doc, "可分别开关“提前 7 天提醒”与“当天提醒（A 类客户）”，设置自动保存在本机。")
    h2(doc, "8.6  隐私与版权")
    para(doc, "隐私说明：仅保存客户编号、简称、生日、性别、行业、等级与备注；不保存身份证号、账号、完整姓名与交易信息；数据仅存于本机浏览器，不上传服务器。")
    para(doc, "设置页底部保留创作者标识“Powered by Ninkoro.com”。最新版完整用户手册以 PDF 形式独立发布（https://xinqiao.ninkoro.com/心桥_产品使用文档.pdf），不占用应用本身体积。")
    add_note(doc, "设计考量", "设置项按“账户 / 数据 / 提醒”分组，让高频操作（导出、导入）与低频操作（清空）各归其位，界面保持精简；用户名与团队为后续日报汇总铺路，Header 问候则让工具更有“自己的”感觉。")

    # ---------- 9 FAQ ----------
    h1(doc, "9  常见问题（FAQ）")
    qa = [
        ("如何访问心桥？", "唯一访问入口为网页 https://xinqiao.ninkoro.com，使用 Chrome / Edge / Safari 打开即可；可将网页添加到桌面或主屏幕作为快捷方式。数据保存在本机浏览器，清除浏览器数据前请先导出备份。"),
        ("浏览器提示无法打开页面怎么办？", "请检查网络连接与 https://xinqiao.ninkoro.com 地址是否完整，稍后刷新重试；如有疑问可联系网站管理员。"),
        ("客户数据会不会上传？", "不会。全部数据仅保存在本机浏览器（IndexedDB），可通过“设置 → 数据导出”备份。"),
        ("如何登记客户家属？", "进入客户详情页 → “家属关系” → 新增家属，选择关系类型（夫妻 / 子女 / 父母 / 其他），可按客户编号或姓名搜索添加关联客户（双向自动同步），或仅填写姓名与备注。"),
        ("iPhone / iPad 上如何像 App 一样使用？", "用 Safari 打开 https://xinqiao.ninkoro.com → 点击“分享” → “添加到主屏幕”，主屏幕即可生成应用图标，全屏使用。"),
        ("iOS 上会收到定时提醒推送吗？", "iOS 网页 App 不支持系统级推送，请每天打开应用查看首页与提醒页；Android 与桌面端 PWA 同样以打开应用查看提醒为主。"),
        ("生日只有月日、没有年份可以吗？", "可以。新增与导入均支持仅填月日，如 08-05，系统按“下一次生日”自动计算提醒。"),
        ("误导入了一批客户怎么办？", "导入完成后可立即点击“撤销导入”，或稍后到“设置 → 撤销上次导入”一键回退。"),
        ("维护记录填错了能修改吗？", "可以。在提醒页“维护记录”或客户详情页“历史维护记录”中点击编辑图标即可修改方式与内容。"),
        ("清空数据后还能找回吗？", "不能。清空为永久删除，建议定期导出备份后再进行清空操作。"),
        ("为什么完成关怀后会弹出“数据备份提醒”？", "心桥的数据只保存在本机浏览器，手机清内存、清历史或换机都可能导致数据丢失。这是每天一次的安全提醒，点击“去导出”可直达备份入口。"),
        ("星标和 A/B/C 等级有什么区别？", "等级衡量客户价值，星标表达“值得被记住”，两者相互独立。C 类客户同样可以打星标置顶，方便随时找到。"),
        ("客户信息里的“38岁 / 属龙 / 狮子座 / 本命年”是什么？", "生日填写了年份后，系统会自动计算这些画像标签，用于准备祝福语、挑选礼品和选择聊天话题；只填了月日没有年份则不会显示，避免推算错误。"),
        ("如何修改用户名和团队？", "进入“设置 → 账户与团队”，填写当前用户名与所属团队，离开输入框即自动保存；顶部标题区会显示“Hi，用户名”问候。"),
        ("如何体验演示数据？", "进入“设置 → 演示模式”开启开关，应用即加载内置演示数据（含家属关系、维护记录与生日画像标签）；演示数据与真实数据完全隔离，关闭后自动恢复您的数据。"),
        ("如何查看最新版用户手册？", "最新版完整使用手册以 PDF 形式发布：https://xinqiao.ninkoro.com/心桥_产品使用文档.pdf，可直接打开或保存。"),
        ("“客户关怀系统”和“心的桥梁”是什么？", "“客户关怀系统”是产品定位，说明它是一款客户关怀工具；“心的桥梁”是品牌 slogan，解释“心桥”名字的含义，两者常驻展示在应用顶部标题区。"),
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
            ["产品定位", "客户关怀系统（品牌 slogan：心的桥梁）"],
            ["在线访问", "https://xinqiao.ninkoro.com"],
            ["版本", "V1.3"],
            ["技术栈", "React + TypeScript + Vite + IndexedDB"],
            ["数据存储", "本机浏览器 IndexedDB（本地优先，隐私友好）"],
            ["访问方式", "浏览器访问 https://xinqiao.ninkoro.com（唯一入口）"],
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
            ["访问心桥", "浏览器打开 https://xinqiao.ninkoro.com"],
            ["设置用户名 / 团队", "设置 → 账户与团队"],
            ["开启演示模式", "设置 → 演示模式"],
            ["查看用户手册", "https://xinqiao.ninkoro.com/心桥_产品使用文档.pdf"],
            ["查看今日生日客户", "首页 → 今日生日"],
            ["查看未来 7 天客户", "首页 → 未来 7 天生日 / 提醒页"],
            ["新增客户", "客户 → 新增客户"],
            ["批量导入", "客户 → 批量导入 / 设置 → 批量导入"],
            ["设为星标", "客户列表行星形图标 / 客户详情右上角"],
            ["查看星标客户", "客户 → 星标筛选"],
            ["按生日月份/星座/属相筛选", "客户 → 下拉筛选（生日月份 / 星座 / 属相）"],
            ["查看生日标签", "客户详情 / 客户列表（生日含年份时自动显示）"],
            ["安装到 iPhone 主屏幕", "Safari → 分享 → 添加到主屏幕"],
            ["登记家属关系", "客户详情 → 家属关系 → 新增家属"],
            ["查看家属生日", "客户详情 → 家属关系条目（显示生日倒计时）"],
            ["撤销导入", "导入结果页 / 设置 → 撤销上次导入"],
            ["生成祝福", "今日生日卡片 → 生成祝福"],
            ["完成维护", "今日生日卡片 → 完成维护"],
            ["数据备份提醒", "完成关怀后自动弹出（每日一次）"],
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
