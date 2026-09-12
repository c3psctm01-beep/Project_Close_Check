import os
import shutil
import docx
from docx.shared import Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH

import tempfile

def find_template_path():
    candidates = [
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates", "แบบฟอร์มอนุมัติค่าใช้จ่ายหน้างาน_template.docx"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "templates", "แบบฟอร์มอนุมัติค่าใช้จ่ายหน้างาน_template.docx"),
        os.path.join(os.getcwd(), "templates", "แบบฟอร์มอนุมัติค่าใช้จ่ายหน้างาน_template.docx")
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return candidates[0]

TEMPLATE_PATH = find_template_path()
DESKTOP_PATH = r"C:\Users\500744\OneDrive - pea.co.th\Desktop\2.แบบฟอร์มอนุมัติค่าใช้จ่ายหน้างาน.docx"
DEFAULT_DESKTOP_PATH = DESKTOP_PATH if os.path.exists(os.path.dirname(DESKTOP_PATH)) else os.path.join(tempfile.gettempdir(), "แบบฟอร์มอนุมัติค่าใช้จ่ายหน้างาน.docx")

def format_number(val, is_currency=False):
    if val is None or val == "":
        return ""
    try:
        f = float(val)
        if abs(f - round(f)) < 0.001:
            return f"{int(round(f)):,}"
        return f"{f:,.2f}"
    except (ValueError, TypeError):
        return str(val)

def format_table1_val(val):
    if val is None or val == "" or val == 0:
        return ""
    try:
        f = float(val)
        if abs(f) < 0.001:
            return ""
        if f < 0:
            return f"-({format_number(abs(f))})"
        else:
            return f"{format_number(f)}"
    except (ValueError, TypeError):
        return str(val)

def set_cell(cell, text, font_name="TH SarabunPSK", font_size=12, bold=False, align=WD_ALIGN_PARAGRAPH.CENTER):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    run = p.add_run(str(text) if text is not None else "")
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.bold = bold

def set_paragraph(p, text, font_name="TH SarabunIT๙", font_size=14, bold=False):
    p.text = ""
    run = p.add_run(str(text))
    run.font.name = font_name
    run.font.size = Pt(font_size)
    run.bold = bold

def get_friendly_network_name(net_no, raw_desc=""):
    net_no = str(net_no).strip()
    if "6001322332" in net_no:
        return "ฐานรากสถานี"
    if "6001322483" in net_no:
        return "ระบบกราวด์"
    if "6001322333" in net_no:
        return "สถานีไฟฟ้าแรงสูง"
    if "6001322334" in net_no:
        return "ระบบไฟฟ้าแรงต่ำ"
    if "6001322341" in net_no:
        return "สายส่งระบบ 1"
    if "6001322342" in net_no:
        return "สายส่งระบบ 2"
    if raw_desc:
        clean = raw_desc.replace("แผนก", "").replace("งาน", "").strip()
        if clean:
            return clean
    return f"โครงข่าย {net_no}"

def fill_approval_docx(project_data, output_path=None, custom_options=None):
    """
    Fills the official PEA Site Expense Approval Form (.docx) using analysis data.
    Saves to output_path (default: User's desktop).
    Returns dict with status, saved_path, and metadata.
    """
    if not output_path:
        output_path = DEFAULT_DESKTOP_PATH

    opts = custom_options or {}

    # Ensure template exists
    if not os.path.exists(TEMPLATE_PATH):
        # If template not yet in templates/, copy from desktop if exists
        if os.path.exists(DEFAULT_DESKTOP_PATH):
            os.makedirs(os.path.dirname(TEMPLATE_PATH), exist_ok=True)
            shutil.copy2(DEFAULT_DESKTOP_PATH, TEMPLATE_PATH)
        else:
            raise FileNotFoundError(f"Template not found at {TEMPLATE_PATH}")

    doc = docx.Document(TEMPLATE_PATH)

    # 1. Project Basic Metadata
    wbs = opts.get("wbs") or project_data.get("wbs") or project_data.get("id") or "P-TDD02.2-I-OMNS0.ONA3.2"
    raw_name = opts.get("name") or project_data.get("name") or ""
    
    # Clean up project name for official phrasing
    if "อ้อมน้อย" in raw_name or "OMNS" in wbs:
        clean_name = "สถานีไฟฟ้าอ้อมน้อย 1 (ชั่วคราว) จ.สมุทรสาคร"
    elif raw_name.startswith("งานก่อสร้าง"):
        clean_name = raw_name[len("งานก่อสร้าง"):].strip()
    elif raw_name.startswith("งาน"):
        clean_name = raw_name[len("งาน"):].strip()
    else:
        clean_name = raw_name or f"โครงการ {wbs}"

    # Determine region / departments
    if "ก3" in clean_name or "ONA3" in wbs or "ก.3" in clean_name or "สมุทรสาคร" in clean_name:
        dept_owner = opts.get("dept_owner", "กฟก.3")
        dept_from = opts.get("dept_from", "กรย.(ก3)")
        learn_to = opts.get("learn_to", "ผชก.(ก3)  ผ่าน  อฝ.วบ.(ก3)")
    elif "ก2" in clean_name or "ก.2" in clean_name:
        dept_owner = opts.get("dept_owner", "กฟก.2")
        dept_from = opts.get("dept_from", "กรย.(ก2)")
        learn_to = opts.get("learn_to", "ผชก.(ก2)  ผ่าน  อฝ.วบ.(ก2)")
    elif "ก1" in clean_name or "ก.1" in clean_name:
        dept_owner = opts.get("dept_owner", "กฟก.1")
        dept_from = opts.get("dept_from", "กรย.(ก1)")
        learn_to = opts.get("learn_to", "ผชก.(ก1)  ผ่าน  อฝ.วบ.(ก1)")
    else:
        dept_owner = opts.get("dept_owner", "กฟภ.")
        dept_from = opts.get("dept_from", "กรย.(ก3)")
        learn_to = opts.get("learn_to", "ผชก.(ก3)  ผ่าน  อฝ.วบ.(ก3)")

    # 2. Update Paragraphs
    # P2: เรียน ...
    if len(doc.paragraphs) > 2:
        set_paragraph(doc.paragraphs[2], f"เรียน         {learn_to}", font_name="TH SarabunIT๙", font_size=14, bold=False)

    # P3: ตามที่ ...
    p3_text = f"ตามที่ {dept_owner} ต้องดำเนินการก่อสร้าง{clean_name} ภายใต้หมายเลขงาน (WBS) {wbs} นั้น  ในขั้นนี้เห็นควรอนุมัติค่าใช้จ่ายหน้างานในการก่อสร้าง (เพิ่มเติม) ดังรายการต่อไปนี้"
    if len(doc.paragraphs) > 3:
        set_paragraph(doc.paragraphs[3], p3_text, font_name="TH SarabunIT๙", font_size=14, bold=False)

    # 3. Update Table 0 (Memo header)
    if len(doc.tables) > 0:
        t0 = doc.tables[0]
        # Row 0: จาก กรย.(ก3) ถึง กฟก.3
        set_cell(t0.rows[0].cells[1], dept_from, font_name="TH SarabunIT๙", font_size=14, align=WD_ALIGN_PARAGRAPH.LEFT)
        set_cell(t0.rows[0].cells[3], dept_owner, font_name="TH SarabunIT๙", font_size=14, align=WD_ALIGN_PARAGRAPH.LEFT)

    # 4. Extract Transfer Recommendations & Budget Numbers
    networks = project_data.get("networks", [])
    net_summary = project_data.get("networks_summary", {})
    recs = net_summary.get("transfer_recommendations", [])

    # Map networks by network_no
    net_map = {str(n.get("network_no")): n for n in networks}

    # Determine participating networks in the reallocation
    involved_net_ids = []
    # Collect from recommendations
    for r in recs:
        d_no = str(r.get("donor_network", "")).strip()
        t_no = str(r.get("target_network", "")).strip()
        if d_no and d_no not in involved_net_ids:
            involved_net_ids.append(d_no)
        if t_no and t_no not in involved_net_ids:
            involved_net_ids.append(t_no)

    # Fallback if no transfer recs
    if not involved_net_ids:
        # Default to networks with deficits and highest surplus
        def_nets = [str(n["network_no"]) for n in networks if n.get("has_deficit")]
        sur_nets = [str(n["network_no"]) for n in networks if not n.get("has_deficit")]
        involved_net_ids = (sur_nets[:1] + def_nets[:1]) if sur_nets and def_nets else [str(n["network_no"]) for n in networks[:2]]

    # Ensure at least 2 networks for Table 1 and Table 2 if available
    if len(involved_net_ids) < 2 and len(networks) >= 2:
        for n in networks:
            n_id = str(n.get("network_no"))
            if n_id not in involved_net_ids:
                involved_net_ids.append(n_id)
                if len(involved_net_ids) == 2:
                    break

    # Calculate adjustments per network per category
    # Categories: labor (ค่าแรงงาน), supervise (ค่าควบคุมงาน), transport (ค่าขนส่ง), misc (ค่าเบ็ดเตล็ด)
    def categorize_name(name):
        n = str(name).lower()
        if "แรงงาน" in n or "จ้างเหมา" in n:
            return "labor"
        if "ควบคุม" in n:
            return "supervise"
        if "ขนส่ง" in n or "ยานพาหนะ" in n:
            return "transport"
        if "เบ็ดเตล็ด" in n:
            return "misc"
        if "ดำเนินการ" in n:
            return "operation"
        return "other"

    net_adjustments = {}
    for net_id in involved_net_ids:
        net_adjustments[net_id] = {
            "labor": 0.0,
            "supervise": 0.0,
            "transport": 0.0,
            "misc": 0.0,
            "total": 0.0
        }

    for r in recs:
        amt = float(r.get("amount", 0.0))
        d_net = str(r.get("donor_network", "")).strip()
        t_net = str(r.get("target_network", "")).strip()
        d_cat = categorize_name(r.get("donor_category", ""))
        t_cat = categorize_name(r.get("target_category", ""))

        if d_net in net_adjustments and d_cat in net_adjustments[d_net]:
            net_adjustments[d_net][d_cat] -= amt
            net_adjustments[d_net]["total"] -= amt

        if t_net in net_adjustments and t_cat in net_adjustments[t_net]:
            net_adjustments[t_net][t_cat] += amt
            net_adjustments[t_net]["total"] += amt

    # 5. Update Table 1: Transfer Summary
    if len(doc.tables) > 1:
        t1 = doc.tables[1]
        # Table 1 has columns: 0=Header, 1=Net1, 2=Net2, 3=Net3, 4=Net4
        num_cols = len(t1.columns)

        for idx, net_id in enumerate(involved_net_ids[:num_cols - 1]):
            col_idx = idx + 1
            net_obj = net_map.get(net_id, {})
            friendly_name = get_friendly_network_name(net_id, net_obj.get("description", ""))

            adj = net_adjustments.get(net_id, {})

            # Row 0: งบ -> กฟภ.
            set_cell(t1.rows[0].cells[col_idx], "กฟภ.", font_name="TH SarabunIT๙", font_size=12)
            # Row 1: โครงข่าย -> เลขที่โครงข่าย
            set_cell(t1.rows[1].cells[col_idx], net_id, font_name="TH SarabunPSK", font_size=12)
            # Row 2: รายการ -> ชื่อแผนก/งานโครงข่าย
            set_cell(t1.rows[2].cells[col_idx], friendly_name, font_name="TH SarabunIT๙", font_size=12)
            # Row 3: ค่าแรงงาน
            set_cell(t1.rows[3].cells[col_idx], format_table1_val(adj.get("labor", 0)), font_name="TH SarabunPSK", font_size=12)
            # Row 4: ค่าควบคุมงาน
            set_cell(t1.rows[4].cells[col_idx], format_table1_val(adj.get("supervise", 0)), font_name="TH SarabunPSK", font_size=12)
            # Row 5: ค่าขนส่ง
            set_cell(t1.rows[5].cells[col_idx], format_table1_val(adj.get("transport", 0)), font_name="TH SarabunPSK", font_size=12)
            # Row 6: ค่าเบ็ดเตล็ด
            set_cell(t1.rows[6].cells[col_idx], format_table1_val(adj.get("misc", 0)), font_name="TH SarabunPSK", font_size=12)
            # Row 7: รวม
            set_cell(t1.rows[7].cells[col_idx], format_table1_val(adj.get("total", 0)), font_name="TH SarabunPSK", font_size=12)

        # Clear unused columns in Table 1
        for col_idx in range(len(involved_net_ids) + 1, num_cols):
            for row_idx in range(8):
                set_cell(t1.rows[row_idx].cells[col_idx], "", font_name="TH SarabunPSK", font_size=12)

    # 6. Update Table 2: Comparison with Estimate
    if len(doc.tables) > 2:
        t2 = doc.tables[2]
        # In Table 2:
        # Net 1 spans columns 1 to 4
        # Net 2 spans columns 5 to 8
        transfer_times_label = f"อนุมัติ {len(recs)} ครั้ง" if len(recs) > 0 else "อนุมัติครั้งนี้"

        for idx, net_id in enumerate(involved_net_ids[:2]):
            net_obj = net_map.get(net_id, {})
            friendly_name = get_friendly_network_name(net_id, net_obj.get("description", ""))
            adj = net_adjustments.get(net_id, {})

            base_col = 1 if idx == 0 else 5
            # Columns: base_col + 0: ประมาณการ, +1: อนุมัติ, +2: ร้อยละ, +3: คงเหลือ

            # Row 0: Network Name
            # The 4 cells are merged in the template, so updating cells[base_col] updates the merged block
            set_cell(t2.rows[0].cells[base_col], friendly_name, font_name="TH SarabunIT๙", font_size=12, bold=False)

            # Row 1: Headers
            set_cell(t2.rows[1].cells[base_col + 0], "ประมาณการ", font_name="TH SarabunPSK", font_size=12)
            set_cell(t2.rows[1].cells[base_col + 1], transfer_times_label, font_name="TH SarabunPSK", font_size=12)
            set_cell(t2.rows[1].cells[base_col + 2], "ร้อยละ", font_name="TH SarabunPSK", font_size=12)
            set_cell(t2.rows[1].cells[base_col + 3], "คงเหลือ", font_name="TH SarabunPSK", font_size=12)

            # Helper to find category data in network
            def get_net_cat(net, cat_key):
                cats = net.get("site_categories") or net.get("categories") or []
                for c in cats:
                    if categorize_name(c.get("name", "")) == cat_key:
                        return c
                return {"estimate": 0.0, "actual": 0.0, "diff": 0.0}

            cat_keys = [
                ("labor", 2),       # Row 2: ค่าแรงงาน
                ("supervise", 3),   # Row 3: ค่าควบคุมงาน
                ("transport", 4),   # Row 4: ค่าขนส่ง
                ("misc", 5)         # Row 5: ค่าเบ็ดเตล็ด
            ]

            for cat_key, row_idx in cat_keys:
                cat_info = get_net_cat(net_obj, cat_key)
                est = float(cat_info.get("estimate", 0.0))
                cat_adj = adj.get(cat_key, 0.0)
                new_approved = est + cat_adj
                pct = (new_approved / est * 100.0) if est > 0 else 0.0

                set_cell(t2.rows[row_idx].cells[base_col + 0], format_number(est), font_name="TH SarabunPSK", font_size=12)
                set_cell(t2.rows[row_idx].cells[base_col + 1], format_number(new_approved), font_name="TH SarabunPSK", font_size=12)
                set_cell(t2.rows[row_idx].cells[base_col + 2], f"{pct:.2f}", font_name="TH SarabunPSK", font_size=12)
                set_cell(t2.rows[row_idx].cells[base_col + 3], "", font_name="TH SarabunPSK", font_size=12)

    # 7. Save Document
    saved_path_display = str(output_path)
    if isinstance(output_path, (str, os.PathLike)):
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        doc.save(output_path)
    else:
        # File-like object / io.BytesIO
        doc.save(output_path)
        saved_path_display = "memory_stream"

    return {
        "success": True,
        "saved_path": saved_path_display,
        "wbs": wbs,
        "project_name": clean_name,
        "involved_networks": involved_net_ids,
        "adjustments": net_adjustments,
        "transfers_count": len(recs)
    }

if __name__ == "__main__":
    import json
    projects_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "projects.json")
    if os.path.exists(projects_path):
        with open(projects_path, "r", encoding="utf-8") as f:
            projects = json.load(f)
        if projects:
            res = fill_approval_docx(projects[0])
            print("Successfully executed fill_approval_docx!")
            print(json.dumps(res, ensure_ascii=False, indent=2))
        else:
            print("No projects found in projects.json")
    else:
        print("projects.json not found")
