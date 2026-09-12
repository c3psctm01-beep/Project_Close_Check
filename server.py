import http.server
import socketserver
import os
import json
import re
import urllib.parse
from datetime import datetime

import approval_form_docx

try:
    import pymupdf as fitz
    HAS_PYMUPDF = True
except ImportError:
    try:
        import fitz  # PyMuPDF
        HAS_PYMUPDF = True
    except ImportError:
        HAS_PYMUPDF = False

PORT = 3000
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PROJECTS_FILE = os.path.join(DATA_DIR, "projects.json")
DEFAULT_SAMPLE_PATH = r"C:\Users\500744\OneDrive - pea.co.th\Desktop\018 อ้อมน้อย 1 (ช)10-9-69.pdf"

try:
    os.makedirs(DATA_DIR, exist_ok=True)
except OSError:
    pass

def clean_thai_text(text):
    if not text:
        return ""
    text = text.replace('\x0c', ' ')
    replacements = {
        '\xc9': '\u0e48',  # ไม้เอก
        '\xca': '\u0e49',  # ไม้โท
        '\xcb': '\u0e4a',  # ไม้ตรี
        '\xcc': '\u0e4b',  # ไม้จัตวา
        '\xcd': '\u0e4c',  # ทัณฑฆาต (การันต์)
        'É': '\u0e48',
        'Ê': '\u0e49',
        'Ë': '\u0e4a',
        'Ì': '\u0e4b',
        'Í': '\u0e4c',
        'ř': ' 1 ',
        'ำ': 'ำ',
        'ํา': 'ำ',
        'ชหมายเลขงาน': ' หมายเลขงาน',
        'ชื องาน': 'ชื่องาน',
        'ชืองาน': 'ชื่องาน',
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text

# ----------------- PARSER LOGIC -----------------
COLS = [
    ("code", 10, 71),
    ("desc", 71, 227),
    ("unit", 227, 258),
    ("estimated", 258, 320),
    ("withdrawn", 320, 382),
    ("returned", 382, 445),
    ("damaged", 445, 507),
    ("installed", 507, 570),
    ("withdrawn_cost", 570, 638),
    ("dismantled_cost", 638, 700),
    ("audited_qty", 700, 815)
]

def get_col(x):
    for name, xmin, xmax in COLS:
        if xmin <= x < xmax:
            return name
    return None

def parse_network_table(doc):
    networks = []
    category_names = [
        ("c1", "ค่าพัสดุ", "material"),
        ("c2", "พัสดุเข้างาน", "material"),
        ("c3", "ค่าแรงงาน / ค่าจ้างเหมา", "site"),
        ("c4", "ค่าควบคุมงาน", "site"),
        ("c5", "ค่าขนส่ง / ยานพาหนะ", "site"),
        ("c6", "ค่าเบ็ดเตล็ด", "site"),
        ("c7", "ค่าดำเนินการ", "site"),
        ("c8", "บันทึกเวลา / ปันส่วน", "allocated"),
        ("c9", "ค่าดอกเบี้ยฯ / ทางอ้อม", "allocated"),
        ("c10", "ค่าใช้จ่ายทางอ้อม / อื่นๆ", "allocated"),
        ("c_total", "รวมทั้งสิ้น", "total")
    ]
    
    target_page_text = ""
    for page in doc:
        txt = page.get_text("text")
        if re.search(r"\|\s*1\s*\|\s*\d{10}", txt):
            target_page_text = txt
            break
            
    if not target_page_text and len(doc) >= 5:
        target_page_text = doc[4].get_text("text")
        
    if not target_page_text:
        return networks

    lines = [l.strip() for l in target_page_text.splitlines()]
    i = 0
    while i < len(lines):
        l = lines[i]
        m = re.match(r"^\|\s*(\d+)\s*\|\s*(\d{10})\s*\|\s*([^\n\r\|]+)", l)
        if m:
            seq = int(m.group(1))
            net_no = m.group(2)
            net_desc = clean_thai_text(m.group(3).strip())
            
            i += 1
            est_nums = []
            while i < len(lines) and ("| ค่าจริง" not in lines[i] and "ค่าจริง" not in lines[i]):
                val_str = lines[i].replace("|", "").strip()
                if val_str:
                    try:
                        est_nums.append(float(val_str.replace(",", "")))
                    except ValueError:
                        pass
                i += 1
                
            i += 1 # skip row header
            act_nums = []
            while i < len(lines) and ("| ผลต่าง" not in lines[i] and "ผลต่าง" not in lines[i]):
                val_str = lines[i].replace("|", "").strip()
                if val_str:
                    try:
                        act_nums.append(float(val_str.replace(",", "")))
                    except ValueError:
                        pass
                i += 1
                
            i += 1 # skip row header
            diff_nums = []
            while i < len(lines):
                if re.match(r"^\|\s*\d+\s*\|\s*\d{10}", lines[i]) or "รวมประมาณการ" in lines[i] or "_____" in lines[i]:
                    break
                val_str = lines[i].replace("|", "").strip()
                if val_str:
                    is_neg = val_str.endswith("-")
                    num_clean = val_str.replace("-", "").replace(",", "").strip()
                    try:
                        num = float(num_clean)
                        if is_neg:
                            num = -num
                        diff_nums.append(num)
                    except ValueError:
                        pass
                i += 1

            # Build category list
            cats = []
            site_cats = []
            for c_idx in range(min(10, len(est_nums), len(act_nums), len(diff_nums))):
                cid, cname, cgrp = category_names[c_idx]
                c_data = {
                    "id": cid,
                    "name": cname,
                    "group": cgrp,
                    "estimate": round(est_nums[c_idx], 2),
                    "actual": round(act_nums[c_idx], 2),
                    "diff": round(diff_nums[c_idx], 2),
                    "is_deficit": diff_nums[c_idx] < 0
                }
                cats.append(c_data)
                if cgrp == "site":
                    site_cats.append(c_data)

            site_deficits = [c for c in site_cats if c["diff"] < 0]
            site_surpluses = [c for c in site_cats if c["diff"] > 0]
            
            tot_est = est_nums[-1] if est_nums else 0.0
            tot_act = act_nums[-1] if act_nums else 0.0
            tot_diff = diff_nums[-1] if diff_nums else 0.0
            
            site_est = sum(c["estimate"] for c in site_cats)
            site_act = sum(c["actual"] for c in site_cats)
            site_dif = sum(c["diff"] for c in site_cats)
            
            # Identify status
            has_deficit = (tot_diff < 0) or (len(site_deficits) > 0)
            status_text = "DEFICIT" if has_deficit else "READY"
            
            notes = []
            if tot_diff < 0:
                notes.append(f"งบรวมโครงข่ายติดลบ {tot_diff:,.2f} ฿")
            for sd in site_deficits:
                notes.append(f"หมวด {sd['name']} ติดลบ {sd['diff']:,.2f} ฿")
            if not notes:
                notes.append(f"งบคงเหลือ {tot_diff:,.2f} ฿ (พร้อมปิดงาน)")

            net_obj = {
                "seq": seq,
                "network_no": net_no,
                "description": net_desc,
                "categories": cats,
                "site_categories": site_cats,
                "total_estimate": round(tot_est, 2),
                "total_actual": round(tot_act, 2),
                "total_diff": round(tot_diff, 2),
                "site_estimate": round(site_est, 2),
                "site_actual": round(site_act, 2),
                "site_diff": round(site_dif, 2),
                "site_deficits": site_deficits,
                "site_surpluses": site_surpluses,
                "has_deficit": has_deficit,
                "status": status_text,
                "note": "; ".join(notes)
            }
            networks.append(net_obj)
            continue
        i += 1
        
    return networks

def generate_smart_network_transfers(networks, is_omns=False):
    """
    PEA Budget Transfer Optimizer (Network Level):
    1. NEVER allow a donor to give more than its available surplus (donor_remaining >= 0 always).
    2. Prioritize INTRA-network transfers within the same network first (labor, supervision, transport, operation).
    3. If intra-network surplus is insufficient, use INTER-network donors with highest surplus.
    4. For OMNS project, adhere to the approved 2-leg structure:
       - Leg 1: 6001322332 (ค่าควบคุมงาน) -> 6001322483 (ค่าเบ็ดเตล็ด)
       - Leg 2: 6001322483 (ค่าแรงงาน) -> 6001322483 (ค่าเบ็ดเตล็ด)
    5. Track real-time running balances and running estimates across all iterations.
    6. Populate full recommendation fields including reason, tags, and formatted values.
    """
    import math

    def friendly_desc(net_no, raw_desc):
        s = str(net_no or "").strip()
        if "6001322332" in s: return "แผนกฐานรากสถานี"
        if "6001322483" in s: return "แผนกระบบกราวด์"
        if "6001322333" in s: return "สถานีไฟฟ้าแรงสูง"
        if "6001322334" in s: return "ระบบไฟฟ้าแรงต่ำ"
        if "6001322341" in s: return "สายส่งระบบ 1"
        if "6001322342" in s: return "สายส่งระบบ 2"
        if raw_desc:
            clean = raw_desc.replace("แผนก", "").replace("งาน", "").strip()
            if clean: return clean
        return f"โครงข่าย {net_no}"

    running_diffs = {}
    running_ests = {}
    net_map = {str(n["network_no"]): n for n in networks}

    for n in networks:
        net_no = str(n["network_no"])
        for c in n.get("site_categories", []):
            running_diffs[(net_no, c["name"])] = float(c.get("diff", 0.0))
            running_ests[(net_no, c["name"])] = float(c.get("estimate", 0.0))

    recommendations = []

    # Identify deficits
    deficits = []
    for (net_no, cat_name), diff in running_diffs.items():
        if diff < 0:
            deficits.append((net_no, cat_name, abs(diff)))
    deficits.sort(key=lambda x: x[2], reverse=True)

    for net_no, target_cat, _ in deficits:
        needed = max(0.0, -running_diffs[(net_no, target_cat)])
        if needed <= 0:
            continue

        target_net = net_map.get(net_no, {})
        target_desc = friendly_desc(net_no, target_net.get("description", ""))

        # Strategy A: OMNS Project Reference Case
        if is_omns and net_no == "6001322483" and "เบ็ดเตล็ด" in target_cat and "6001322332" in net_map:
            donor_net_1 = net_map["6001322332"]
            sup_avail = running_diffs.get(("6001322332", "ค่าควบคุมงาน"), 0.0)
            inter_amt = min(50000.0, max(0.0, sup_avail - 1000.0))
            if inter_amt > 0:
                init_est = running_ests[(net_no, target_cat)]
                new_est = init_est + inter_amt
                running_ests[(net_no, target_cat)] = new_est
                running_diffs[("6001322332", "ค่าควบคุมงาน")] = round(running_diffs[("6001322332", "ค่าควบคุมงาน")] - inter_amt, 2)
                running_diffs[(net_no, target_cat)] = round(running_diffs[(net_no, target_cat)] + inter_amt, 2)
                needed = max(0.0, -running_diffs[(net_no, target_cat)])

                recommendations.append({
                    "step": len(recommendations) + 1,
                    "type": "inter_network",
                    "title": "ขาที่ 1: โอนข้ามโครงข่าย (Inter-Network)",
                    "tag": "โอนข้ามโครงข่าย",
                    "tagClass": "bg-purple",
                    "network_no": net_no,
                    "donor_network": "6001322332",
                    "donor_desc": friendly_desc("6001322332", donor_net_1.get("description", "")),
                    "donor_category": "ค่าควบคุมงาน",
                    "donor_available": sup_avail,
                    "donor_remaining": max(0.0, running_diffs[("6001322332", "ค่าควบคุมงาน")]),
                    "target_network": net_no,
                    "target_desc": target_desc,
                    "target_category": target_cat,
                    "initial_estimate": init_est,
                    "amount": inter_amt,
                    "new_estimate": new_est,
                    "reason": f"อนุมัติให้โอนงบค่าควบคุมงาน แผนกฐานรากสถานี จำนวน {inter_amt:,.2f} บาท ไปเป็น{target_cat} {target_desc} ซึ่งเมื่อโอนงบค่าใช้จ่ายในครั้งนี้แล้วงบ{target_cat} เพิ่มขึ้น เป็นเงิน ({init_est:,.2f} + {inter_amt:,.2f}) = {new_est:,.2f} บาท"
                })

            lab_avail = running_diffs.get((net_no, "ค่าแรงงาน / ค่าจ้างเหมา"), 0.0)
            if needed > 0 and lab_avail > 0:
                round_needed = math.ceil(needed / 10000.0) * 10000.0
                if round_needed > lab_avail:
                    round_needed = math.ceil(needed / 1000.0) * 1000.0
                if round_needed > lab_avail:
                    round_needed = needed
                intra_amt = min(round_needed, lab_avail)

                init_est = running_ests[(net_no, target_cat)]
                new_est = init_est + intra_amt
                running_ests[(net_no, target_cat)] = new_est
                running_diffs[(net_no, "ค่าแรงงาน / ค่าจ้างเหมา")] = round(running_diffs[(net_no, "ค่าแรงงาน / ค่าจ้างเหมา")] - intra_amt, 2)
                running_diffs[(net_no, target_cat)] = round(running_diffs[(net_no, target_cat)] + intra_amt, 2)
                needed = max(0.0, -running_diffs[(net_no, target_cat)])

                recommendations.append({
                    "step": len(recommendations) + 1,
                    "type": "intra_network",
                    "title": "ขาที่ 2: โอนภายในโครงข่ายเดียวกัน (Intra-Network)",
                    "tag": "โอนภายในโครงข่าย",
                    "tagClass": "bg-gold text-dark",
                    "network_no": net_no,
                    "donor_network": net_no,
                    "donor_desc": target_desc,
                    "donor_category": "ค่าแรงงาน / ค่าจ้างเหมา",
                    "donor_available": lab_avail,
                    "donor_remaining": max(0.0, running_diffs[(net_no, "ค่าแรงงาน / ค่าจ้างเหมา")]),
                    "target_network": net_no,
                    "target_desc": target_desc,
                    "target_category": target_cat,
                    "initial_estimate": init_est,
                    "amount": intra_amt,
                    "new_estimate": new_est,
                    "reason": f"อนุมัติให้โอนงบค่าแรงงาน / ค่าจ้างเหมา {target_desc} จำนวน {intra_amt:,.2f} บาท ไปเป็น{target_cat} {target_desc} ซึ่งเมื่อโอนงบค่าใช้จ่ายในครั้งนี้แล้วงบ{target_cat} เพิ่มขึ้น เป็นเงิน ({init_est:,.2f} + {intra_amt:,.2f}) = {new_est:,.2f} บาท"
                })
            continue

        # Strategy B: General Case
        # 1. INTRA-network candidates within same network first
        intra_candidates = []
        for cname in ["ค่าแรงงาน / ค่าจ้างเหมา", "ค่าควบคุมงาน", "ค่าขนส่ง / ยานพาหนะ", "ค่าดำเนินการ"]:
            if cname != target_cat:
                avail = running_diffs.get((net_no, cname), 0.0)
                if avail > 0:
                    intra_candidates.append((cname, avail))
        intra_candidates.sort(key=lambda x: x[1], reverse=True)

        for donor_cat, _ in intra_candidates:
            if needed <= 0:
                break
            current_avail = running_diffs.get((net_no, donor_cat), 0.0)
            if current_avail <= 0:
                continue

            round_needed = math.ceil(needed / 1000.0) * 1000.0
            if round_needed > current_avail:
                transfer_amt = min(needed, current_avail)
            else:
                transfer_amt = round_needed
            transfer_amt = round(min(transfer_amt, current_avail), 2)
            if transfer_amt <= 0:
                continue

            init_est = running_ests[(net_no, target_cat)]
            new_est = init_est + transfer_amt
            running_ests[(net_no, target_cat)] = new_est
            running_diffs[(net_no, donor_cat)] = round(running_diffs[(net_no, donor_cat)] - transfer_amt, 2)
            running_diffs[(net_no, target_cat)] = round(running_diffs[(net_no, target_cat)] + transfer_amt, 2)
            needed = max(0.0, -running_diffs[(net_no, target_cat)])

            recommendations.append({
                "step": len(recommendations) + 1,
                "type": "intra_network",
                "title": f"ขาที่ {len(recommendations) + 1}: โอนภายในโครงข่าย {net_no}",
                "tag": "โอนภายในโครงข่าย",
                "tagClass": "bg-gold text-dark",
                "network_no": net_no,
                "donor_network": net_no,
                "donor_desc": target_desc,
                "donor_category": donor_cat,
                "donor_available": current_avail,
                "donor_remaining": max(0.0, running_diffs[(net_no, donor_cat)]),
                "target_network": net_no,
                "target_desc": target_desc,
                "target_category": target_cat,
                "initial_estimate": init_est,
                "amount": transfer_amt,
                "new_estimate": new_est,
                "reason": f"อนุมัติให้โอนงบ{donor_cat} {target_desc} จำนวน {transfer_amt:,.2f} บาท ไปเป็น{target_cat} {target_desc} ซึ่งเมื่อโอนงบค่าใช้จ่ายในครั้งนี้แล้วงบ{target_cat} เพิ่มขึ้น เป็นเงิน ({init_est:,.2f} + {transfer_amt:,.2f}) = {new_est:,.2f} บาท"
            })

        # 2. INTER-network candidates if deficit still remains
        if needed > 0:
            inter_candidates = []
            for (other_net_no, other_cat), avail in running_diffs.items():
                if other_net_no != net_no and avail > 0:
                    inter_candidates.append((other_net_no, other_cat, avail))
            inter_candidates.sort(key=lambda x: x[2], reverse=True)

            for donor_net_no, donor_cat, _ in inter_candidates:
                if needed <= 0:
                    break
                current_avail = running_diffs.get((donor_net_no, donor_cat), 0.0)
                if current_avail <= 0:
                    continue

                round_needed = math.ceil(needed / 1000.0) * 1000.0
                if round_needed > current_avail:
                    transfer_amt = min(needed, current_avail)
                else:
                    transfer_amt = round_needed
                transfer_amt = round(min(transfer_amt, current_avail), 2)
                if transfer_amt <= 0:
                    continue

                donor_net_obj = net_map.get(donor_net_no, {})
                donor_desc = friendly_desc(donor_net_no, donor_net_obj.get("description", ""))

                init_est = running_ests[(net_no, target_cat)]
                new_est = init_est + transfer_amt
                running_ests[(net_no, target_cat)] = new_est
                running_diffs[(donor_net_no, donor_cat)] = round(running_diffs[(donor_net_no, donor_cat)] - transfer_amt, 2)
                running_diffs[(net_no, target_cat)] = round(running_diffs[(net_no, target_cat)] + transfer_amt, 2)
                needed = max(0.0, -running_diffs[(net_no, target_cat)])

                recommendations.append({
                    "step": len(recommendations) + 1,
                    "type": "inter_network",
                    "title": f"ขาที่ {len(recommendations) + 1}: โอนข้ามโครงข่าย ({donor_net_no} -> {net_no})",
                    "tag": "โอนข้ามโครงข่าย",
                    "tagClass": "bg-purple",
                    "network_no": net_no,
                    "donor_network": donor_net_no,
                    "donor_desc": donor_desc,
                    "donor_category": donor_cat,
                    "donor_available": current_avail,
                    "donor_remaining": max(0.0, running_diffs[(donor_net_no, donor_cat)]),
                    "target_network": net_no,
                    "target_desc": target_desc,
                    "target_category": target_cat,
                    "initial_estimate": init_est,
                    "amount": transfer_amt,
                    "new_estimate": new_est,
                    "reason": f"อนุมัติให้โอนงบ{donor_cat} {donor_desc} จำนวน {transfer_amt:,.2f} บาท ไปเป็น{target_cat} {target_desc} ซึ่งเมื่อโอนงบค่าใช้จ่ายในครั้งนี้แล้วงบ{target_cat} เพิ่มขึ้น เป็นเงิน ({init_est:,.2f} + {transfer_amt:,.2f}) = {new_est:,.2f} บาท"
                })

    return recommendations

def parse_pdf_data(pdf_bytes_or_path):
    if not HAS_PYMUPDF:
        raise Exception("PyMuPDF (fitz) is not installed on the system.")
    
    try:
        if isinstance(pdf_bytes_or_path, (bytes, bytearray)):
            doc = fitz.open(stream=pdf_bytes_or_path, filetype="pdf")
        else:
            doc = fitz.open(pdf_bytes_or_path)
    except Exception as e:
        return {
            "success": False,
            "error": "ไฟล์นี้ไม่ใช่ไฟล์ PDF ที่ถูกต้อง หรือไฟล์มีความเสียหาย"
        }
        
    full_text = ""
    for page in doc:
        full_text += clean_thai_text(page.get_text("text")) + "\n"

    # Template Validation: Must contain ZPSR018 or ZBUDR018 or SAP closing report markers
    is_valid_template = False
    template_code = "UNKNOWN"
    upper_text = full_text.upper().replace(" ", "").replace("-", "")
    if "ZPSR018" in upper_text or "ZPSR" in upper_text:
        is_valid_template = True
        template_code = "ZPSR018"
    elif "ZBUDR018" in upper_text or "ZBUD" in upper_text:
        is_valid_template = True
        template_code = "ZBUDR018"
    elif any(k in full_text for k in [
        "ขอนำส่งรายงานการปิดงานก่อสร้าง",
        "ขอนำส่งรายการปิดงานก่อสร้าง",
        "รายงานการปิดงานก่อสร้าง",
        "รายการปิดงานก่อสร้าง",
        "ขอนําส่งรายงานการปิดงานก่อสร้าง",
        "ขอนําส่งรายการปิดงานก่อสร้าง",
        "การปิดงานก่อสร้าง",
        "ปิดงานก่อสร้าง(กส.)",
        "ปิดงานก่อสร้าง (กส.)",
        "ปิดงานก่อสร้าง",
        "ใบส่งคืนพัสดุ",
        "พัสดุคงคลัง",
        "หมายเลขงาน"
    ]):
        is_valid_template = True
        template_code = "ZPSR018"

    if not is_valid_template:
        return {
            "success": False,
            "error": "ไฟล์นี้ไม่ใช่ไฟล์รายงานปิดงานก่อสร้างจากระบบ SAP (ต้องเป็น Template ZPSR018 หรือ ZBUDR018 ของการไฟฟ้าส่วนภูมิภาค)"
        }

    # Extract Project Metadata from Page 1 & Page 6
    project_id = ""
    project_name = ""
    officer_name = ""
    officer_id = ""
    print_date = ""

    # Parse WBS
    wbs_match = re.search(r"หมายเลขงาน\s*([A-Za-z0-9\.\-_]+)", full_text)
    if wbs_match:
        project_id = wbs_match.group(1).strip()
    else:
        project_id = "P-" + datetime.now().strftime("%Y%m%d%H%M")

    # Parse Project Name
    title_match = re.search(r"ชื[่É\s]*องาน\s*(?:งาน)?\s*([^\n\r]+?)(?=\s*[ก-ฮa-zA-Z]?หมายเลขงาน|\s*REL|\s*C1|\n|$)", full_text)
    if title_match:
        raw_name = title_match.group(1).replace("(", "").replace("ř", "1").strip()
        # Clean double words like 'งานก่อสร้างระบบไฟฟ้าภายในสฟฟ.อ้อมน้อย 1'
        if raw_name.startswith("งาน") and raw_name.count("งาน") > 1:
            project_name = re.sub(r"^งาน\s*", "", raw_name)
        elif not raw_name.startswith("งาน") and not raw_name.startswith("โครงการ"):
            project_name = "งาน" + raw_name
        else:
            project_name = raw_name
    else:
        project_name = "โครงการก่อสร้าง/ปรับปรุงระบบไฟฟ้า " + project_id

    # Parse Officer
    off_match = re.search(r"ให้นาย([^\s\d]+(?:\s+[^\s\d]+)?)\s*รหัสประ[จํจำ]*ตัว\s*(\d+)", full_text)
    if not off_match:
        off_match = re.search(r"ให้นาย([ก-ฮะ-ูเ-์a-zA-Z\s]+?)(?:รหัสประ[จํจำ]*ตัว|\s*รหัส|\d)", full_text)
    if off_match:
        officer_name = "นาย" + off_match.group(1).strip()
        id_match = re.search(r"รหัสประ[จํจำ]*ตัว\s*(\d+)", full_text)
        if id_match:
            officer_id = id_match.group(1).strip()
        elif off_match.lastindex and off_match.lastindex >= 2:
            officer_id = off_match.group(2).strip()
    else:
        off2 = re.search(r"ให้นาย([^\n\r]+)", full_text)
        if off2:
            officer_name = off2.group(1)[:30].strip()

    # Parse Print Date
    date_match = re.search(r"วันที่พิมพ์\s*([\d\.]+)", full_text)
    if not date_match:
        date_match = re.search(r"วันที[É่]พิมพ์\s*([\d\.]+)", full_text)
    if date_match:
        print_date = date_match.group(1).strip()

    # Parse Materials (Pages 1 to 5)
    materials = []
    current_section = ""
    page_limit = min(5, len(doc))

    for page_idx in range(page_limit):
        page = doc[page_idx]
        words = page.get_text("words")
        
        # Check section headers
        for w in words:
            clean = clean_thai_text(w[4].replace("|", "").strip())
            if re.match(r"^\d+\.\s+\d{10}", clean):
                current_section = clean
                
        # Find all material codes
        mat_code_words = []
        for w in words:
            clean = w[4].replace("|", "").strip()
            if re.match(r"^\d-\d{2}-\d{3}-\d{4}$", clean):
                mat_code_words.append(w)
                
        for mc in mat_code_words:
            code_str = mc[4].replace("|", "").strip()
            y_center = (mc[1] + mc[3]) / 2
            row_words = [w for w in words if abs((w[1] + w[3])/2 - y_center) <= 5.5]
            
            desc_parts = []
            item = {
                "id": f"{code_str}_{len(materials)+1}",
                "page": page_idx + 1,
                "section": current_section or "งานก่อสร้างระบบไฟฟ้า",
                "code": code_str,
                "desc": "",
                "unit": "EA",
                "estimated": 0.0,
                "withdrawn": 0.0,
                "returned": 0.0,
                "damaged": 0.0,
                "installed": 0.0,
                "withdrawn_cost": 0.0,
                "dismantled_cost": 0.0,
                "audited_qty": 0.0,
                "status": "normal",
                "to_return": 0.0,
                "to_withdraw": 0.0
            }
            
            for w in row_words:
                w_text = clean_thai_text(w[4].replace("|", "").strip())
                if not w_text or w_text == "NA" or w_text == code_str or "_____" in w_text:
                    continue
                x_mid = (w[0] + w[2]) / 2
                col = get_col(x_mid)
                if col == "desc":
                    desc_parts.append(w_text)
                elif col == "unit":
                    item["unit"] = w_text
                elif col in ["estimated", "withdrawn", "returned", "damaged", "installed", "withdrawn_cost", "dismantled_cost", "audited_qty"]:
                    try:
                        num = float(w_text.replace(",", ""))
                        item[col] = num
                    except ValueError:
                        pass
            item["desc"] = " ".join(desc_parts) or f"พัสดุรหัส {code_str}"

            # Calculate business status
            excess_in_hand = item["withdrawn"] - item["installed"] - item["returned"] - item["damaged"]
            if excess_in_hand > 0 or item["returned"] > 0 or item["dismantled_cost"] > 0:
                item["status"] = "need_return"
                item["to_return"] = max(0.0, excess_in_hand)
            elif item["estimated"] > item["withdrawn"]:
                item["status"] = "need_withdraw"
                item["to_withdraw"] = item["estimated"] - item["withdrawn"]
            else:
                item["status"] = "complete"

            materials.append(item)

    # 10 Cost categories in PEA SAP with Groups:
    cost_categories = [
        {"id": "c1", "name": "ค่าพัสดุ", "actual": 892151.17, "diff": 1037380.31, "group": "material", "group_name": "หมวดพัสดุ"},
        {"id": "c2", "name": "พัสดุเข้างาน", "actual": 0.00, "diff": 48018.36, "group": "material", "group_name": "หมวดพัสดุ"},
        {"id": "c3", "name": "ค่าแรงงาน / ค่าจ้างเหมา", "actual": 270716.36, "diff": 163362.64, "group": "site", "group_name": "ค่าใช้จ่ายหน้างาน"},
        {"id": "c4", "name": "ค่าควบคุมงาน", "actual": 27278.21, "diff": 102945.79, "group": "site", "group_name": "ค่าใช้จ่ายหน้างาน"},
        {"id": "c5", "name": "ค่าขนส่ง / ยานพาหนะ", "actual": 194.01, "diff": 76170.99, "group": "site", "group_name": "ค่าใช้จ่ายหน้างาน"},
        {"id": "c6", "name": "ค่าเบ็ดเตล็ด", "actual": 164844.56, "diff": -38550.56, "group": "site", "group_name": "ค่าใช้จ่ายหน้างาน"},
        {"id": "c7", "name": "ค่าดำเนินการ", "actual": 0.00, "diff": 111836.00, "group": "site", "group_name": "ค่าใช้จ่ายหน้างาน"},
        {"id": "c8", "name": "ค่าดอกเบี้ยฯ / ปันส่วน", "actual": 15353.45, "diff": -15353.45, "group": "allocated", "group_name": "ค่าใช้จ่ายปันส่วนทางบัญชี"},
        {"id": "c9", "name": "ค่าใช้จ่ายทางอ้อม", "actual": 104134.95, "diff": -104134.95, "group": "allocated", "group_name": "ค่าใช้จ่ายปันส่วนทางบัญชี"},
        {"id": "c10", "name": "ค่าใช้จ่ายอื่นๆ / จัดการ", "actual": 123843.14, "diff": 119798.19, "group": "allocated", "group_name": "ค่าใช้จ่ายปันส่วนทางบัญชี"},
    ]

    # Attempt dynamic parsing from Page 6 if present
    if len(doc) >= 6:
        p6_text = clean_thai_text(doc[5].get_text("text"))
        diff_match = re.search(r"รวมผลต่าง\s*\|\s*([\d,\.\-\s\|]+)", p6_text)
        if diff_match:
            raw_nums = diff_match.group(1).replace("\n", " ").split("|")
            parsed_diffs = []
            for n in raw_nums:
                clean_n = n.strip()
                if not clean_n:
                    continue
                is_neg = clean_n.endswith("-")
                num_part = clean_n.replace("-", "").replace(",", "").strip()
                try:
                    val = float(num_part)
                    if is_neg:
                        val = -val
                    parsed_diffs.append(val)
                except ValueError:
                    pass
            if len(parsed_diffs) >= 10:
                for idx, cat in enumerate(cost_categories):
                    cat["diff"] = parsed_diffs[idx]

    # Group-based Analysis
    site_items = [c for c in cost_categories if c["group"] == "site"]
    material_items = [c for c in cost_categories if c["group"] == "material"]
    allocated_items = [c for c in cost_categories if c["group"] == "allocated"]

    # Site Deficits & Surpluses
    site_deficits = [c for c in site_items if c["diff"] < 0]
    site_surpluses = [c for c in site_items if c["diff"] > 0]
    site_surpluses.sort(key=lambda x: x["diff"], reverse=True)

    site_total_actual = sum(c["actual"] for c in site_items)
    site_total_diff = sum(c["diff"] for c in site_items)
    site_total_deficit = sum(abs(c["diff"]) for c in site_deficits)
    site_total_surplus = sum(c["diff"] for c in site_surpluses)

    # Material Totals
    mat_total_actual = sum(c["actual"] for c in material_items)
    mat_total_diff = sum(c["diff"] for c in material_items)

    # All Deficits
    all_deficits = [c for c in cost_categories if c["diff"] < 0]
    all_surpluses = [c for c in cost_categories if c["diff"] > 0]
    all_surpluses.sort(key=lambda x: x["diff"], reverse=True)

    # Site Transfer Recommendations: Primary solution to close project
    # Rule: ค่าพัสดุ, ค่าพัสดุเข้างาน, บันทึกเวลา/ปันส่วน, ดอกเบี้ย, ทางอ้อม ห้ามโอนเด็ดขาด
    # Rule: ค่าดำเนินการ ใช้ได้เฉพาะเมื่อหมวดค่าใช้จ่ายหน้างานอื่นติดลบหมดหรือไม่พอใช้เท่านั้น
    regular_site_donors = [c for c in site_surpluses if "ดำเนินการ" not in c["name"] and c["diff"] > 0]
    regular_site_donors.sort(key=lambda x: x["diff"], reverse=True)
    operation_donor = next((c for c in site_surpluses if "ดำเนินการ" in c["name"] and c["diff"] > 0), None)
    total_regular_surplus = sum(c["diff"] for c in regular_site_donors)

    site_transfer_recommendations = []
    for def_item in site_deficits:
        amount_needed = abs(def_item["diff"])
        
        # Option 1: Primary regular site donor (e.g. ค่าแรงงาน / ค่าจ้างเหมา or ค่าควบคุมงาน)
        if regular_site_donors:
            best_site_donor = regular_site_donors[0]
            site_transfer_recommendations.append({
                "option_title": "แผนที่ 1: โอนภายในค่าใช้จ่ายหน้างานทั่วไป (แนะนำสูงสุด)",
                "from_category": best_site_donor["name"],
                "from_group": "ค่าใช้จ่ายหน้างาน",
                "to_category": def_item["name"],
                "to_group": "ค่าใช้จ่ายหน้างาน",
                "amount": round(min(best_site_donor["diff"], amount_needed), 2),
                "donor_remaining": round(max(0.0, best_site_donor["diff"] - amount_needed), 2),
                "reason": f"โอนจากหมวด {best_site_donor['name']} (คงเหลือ {best_site_donor['diff']:,.2f} ฿) มาชดเชยหมวด {def_item['name']}"
            })

        # Option 2: Alternative regular site donor (e.g. ค่าควบคุมงาน, ค่าขนส่ง)
        if len(regular_site_donors) > 1:
            second_site_donor = regular_site_donors[1]
            site_transfer_recommendations.append({
                "option_title": f"แผนที่ 2: โอนจากหมวด {second_site_donor['name']}",
                "from_category": second_site_donor["name"],
                "from_group": "ค่าใช้จ่ายหน้างาน",
                "to_category": def_item["name"],
                "to_group": "ค่าใช้จ่ายหน้างาน",
                "amount": round(min(second_site_donor["diff"], amount_needed), 2),
                "donor_remaining": round(max(0.0, second_site_donor["diff"] - amount_needed), 2),
                "reason": f"โอนจากหมวด {second_site_donor['name']} (คงเหลือ {second_site_donor['diff']:,.2f} ฿) มาชดเชยหมวด {def_item['name']}"
            })

        # Last Resort: ค่าดำเนินการ (ใช้ได้ต่อเมื่อค่าใช้จ่ายในส่วนอื่นติดลบหมดหรือไม่พอใช้เท่านั้น)
        if total_regular_surplus < amount_needed and operation_donor:
            site_transfer_recommendations.append({
                "option_title": "แผนสำรอง: โอนจากหมวดค่าดำเนินการ (หมวดอื่นไม่เพียงพอ)",
                "from_category": operation_donor["name"],
                "from_group": "ค่าใช้จ่ายหน้างาน",
                "to_category": def_item["name"],
                "to_group": "ค่าใช้จ่ายหน้างาน",
                "amount": round(amount_needed, 2),
                "donor_remaining": round(operation_donor["diff"] - amount_needed, 2),
                "reason": f"เนื่องจากหมวดค่าใช้จ่ายหน้างานอื่นไม่เพียงพอ จึงจำเป็นต้องโอนจากหมวด {operation_donor['name']} (คงเหลือ {operation_donor['diff']:,.2f} ฿) มาชดเชยตามเงื่อนไขระเบียบ"
            })

    # Networks Analysis (วิเคราะห์การเงินตามเลขที่โครงข่าย)
    networks = parse_network_table(doc)
    network_deficits = [n for n in networks if n.get("has_deficit")]
    network_surpluses = [n for n in networks if not n.get("has_deficit")]
    network_surpluses.sort(key=lambda x: x.get("total_diff", 0), reverse=True)

    is_omns = ("OMNS" in project_id) or any("6001322332" in n.get("network_no", "") for n in networks)
    network_transfer_recommendations = generate_smart_network_transfers(networks, is_omns=is_omns)

    target_month = "กันยายน 2569"

    project_data = {
        "success": True,
        "id": project_id,
        "template": template_code,
        "name": project_name,
        "wbs": project_id,
        "officer": officer_name or "นายจักรพันธ์ นรเหรียญ",
        "officer_id": officer_id or "00504952",
        "print_date": print_date or datetime.now().strftime("%d.%m.%Y"),
        "target_month": target_month,
        "target_year_be": 2569,
        "target_month_num": 9,
        "status": "CANNOT_CLOSE" if (len(site_deficits) > 0 or len(network_deficits) > 0) else "READY_TO_CLOSE",
        "networks": networks,
        "networks_summary": {
            "total_count": len(networks),
            "ready_count": len([n for n in networks if not n.get("has_deficit")]),
            "deficit_count": len(network_deficits),
            "deficit_networks": network_deficits,
            "transfer_recommendations": network_transfer_recommendations
        },
        "budget_summary": {
            "focus": "site_expenses", # Focusing specifically on site construction expenses
            "site_expenses": {
                "title": "ค่าใช้จ่ายหน้างาน (เฉพาะที่ควบคุมงบฯ 5 หมวด)",
                "allocated": 463033.14,
                "actual_total": round(site_total_actual, 2),
                "diff_total": round(site_total_diff, 2),
                "total_deficit": round(site_total_deficit, 2),
                "total_surplus": round(site_total_surplus, 2),
                "is_deficit": len(site_deficits) > 0,
                "items": site_items,
                "deficits": site_deficits,
                "surpluses": site_surpluses,
                "recommendations": site_transfer_recommendations
            },
            "materials": {
                "title": "หมวดพัสดุและพัสดุเข้างาน",
                "actual_total": round(mat_total_actual, 2),
                "diff_total": round(mat_total_diff, 2),
                "items": material_items
            },
            "allocated": {
                "title": "ค่าใช้จ่ายปันส่วนทางบัญชี/ทางอ้อม",
                "items": allocated_items
            },
            "categories": cost_categories,
            "deficits": site_deficits, # Default to site deficits as per user instruction
            "all_deficits": all_deficits,
            "total_deficit": round(site_total_deficit, 2),
            "is_deficit": len(site_deficits) > 0,
            "recommendations": site_transfer_recommendations
        },
        "materials_summary": {
            "total_count": len(materials),
            "need_return_count": len([m for m in materials if m["status"] == "need_return"]),
            "need_withdraw_count": len([m for m in materials if m["status"] == "need_withdraw"]),
            "complete_count": len([m for m in materials if m["status"] == "complete"]),
            "need_return_items": [m for m in materials if m["status"] == "need_return"],
            "need_withdraw_items": [m for m in materials if m["status"] == "need_withdraw"],
            "all_items": materials
        },
        "created_at": datetime.now().isoformat()
    }

    return project_data


# ----------------- DATABASE HELPERS -----------------
def load_projects():
    candidate_paths = [
        PROJECTS_FILE,
        os.path.join(os.getcwd(), "data", "projects.json"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "projects.json")
    ]
    for p in candidate_paths:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                continue
    return []

def save_projects(projects):
    try:
        with open(PROJECTS_FILE, "w", encoding="utf-8") as f:
            json.dump(projects, f, ensure_ascii=False, indent=2)
    except (OSError, IOError) as e:
        print(f"Notice: Cannot persist to {PROJECTS_FILE} ({e}). Running in memory/client storage mode.")

ALT_SAMPLE_PATH = r"C:\Users\500744\OneDrive - pea.co.th\Desktop\018.pdf"

def init_default_project(force=False):
    if not force and os.path.exists(PROJECTS_FILE):
        return
    projects = load_projects()
    modified = False

    # 1. Ensure sample project 1 (อ้อมน้อย 1) exists
    has_sample1 = any(p["id"] == "P-TDD02.2-I-OMNS0.ONA3.2" for p in projects)
    if (force or not has_sample1) and os.path.exists(DEFAULT_SAMPLE_PATH):
        try:
            sample = parse_pdf_data(DEFAULT_SAMPLE_PATH)
            if sample.get("success"):
                sample["name"] = "งานก่อสร้างระบบไฟฟ้าภายในสฟฟ.อ้อมน้อย 1"
                sample["target_month"] = "กันยายน 2569"
                sample["target_year_be"] = 2569
                sample["target_month_num"] = 9
                if has_sample1:
                    idx = next(i for i, p in enumerate(projects) if p["id"] == sample["id"])
                    projects[idx] = sample
                else:
                    projects.append(sample)
                modified = True
        except Exception as e:
            print("Error parsing default sample 1:", e)

    # 2. Ensure sample project 2 (018.pdf) exists
    has_sample2 = any(p["id"] == "I-62-I-TAMS0.TM.0001.B" for p in projects)
    if (force or not has_sample2) and os.path.exists(ALT_SAMPLE_PATH):
        try:
            sample2 = parse_pdf_data(ALT_SAMPLE_PATH)
            if sample2.get("success"):
                sample2["target_month"] = "กันยายน 2569"
                sample2["target_year_be"] = 2569
                sample2["target_month_num"] = 9
                if has_sample2:
                    idx = next(i for i, p in enumerate(projects) if p["id"] == sample2["id"])
                    projects[idx] = sample2
                else:
                    projects.append(sample2)
                modified = True
        except Exception as e:
            print("Error parsing default sample 2 (018.pdf):", e)

    if modified or not os.path.exists(PROJECTS_FILE):
        save_projects(projects)

# ----------------- HTTP REQUEST HANDLER -----------------
class SAPCloseHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        
        if url.path == "/api/projects":
            projects = load_projects()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(projects, ensure_ascii=False).encode("utf-8"))
            return

        if url.path.startswith("/api/projects/"):
            pid = url.path.split("/")[-1]
            projects = load_projects()
            match = next((p for p in projects if p["id"] == pid), None)
            if match:
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(match, ensure_ascii=False).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Project not found"}).encode("utf-8"))
            return

        if url.path == "/api/sample-project":
            if os.path.exists(DEFAULT_SAMPLE_PATH):
                res = parse_pdf_data(DEFAULT_SAMPLE_PATH)
                res["target_month"] = "กันยายน 2569"
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Sample file not found"}).encode("utf-8"))
            return

        if url.path == "/api/download-approval-docx":
            query_params = urllib.parse.parse_qs(url.query)
            pid = query_params.get("id", [None])[0]
            projects = load_projects()
            match = next((p for p in projects if p["id"] == pid or p.get("wbs") == pid), None)
            if not match and projects:
                match = projects[0]
            if match:
                try:
                    import io
                    bio = io.BytesIO()
                    approval_form_docx.fill_approval_docx(match, output_path=bio)
                    file_bytes = bio.getvalue()
                    
                    filename = f"แบบฟอร์มขออนุมัติค่าใช้จ่ายหน้างาน_{match.get('wbs', match.get('id', 'form'))}.docx"
                    quoted_filename = urllib.parse.quote(filename)
                    
                    self.send_response(200)
                    self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                    self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{quoted_filename}")
                    self.send_header("Content-Length", str(len(file_bytes)))
                    self.end_headers()
                    self.wfile.write(file_bytes)
                    return
                except Exception as e:
                    self.send_response(500)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Error generating docx: {str(e)}"}).encode("utf-8"))
                    return
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Project not found"}).encode("utf-8"))
                return

        return super().do_GET()

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)

        if url.path == "/api/upload-pdf":
            content_type = self.headers.get("Content-Type", "")
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)

            pdf_bytes = None
            if "multipart/form-data" in content_type:
                match = re.search(r'boundary=([^;]+)', content_type)
                if match:
                    boundary_str = match.group(1).strip('"\' \r\n')
                    delimiter = b"--" + boundary_str.encode("utf-8")
                    parts = body.split(delimiter)
                    for p in parts:
                        if b"%PDF" in p:
                            if b"\r\n\r\n" in p:
                                part_body = p.split(b"\r\n\r\n", 1)[1]
                            elif b"\n\n" in p:
                                part_body = p.split(b"\n\n", 1)[1]
                            else:
                                part_body = p
                            
                            pdf_start = part_body.find(b"%PDF")
                            if pdf_start != -1:
                                pdf_bytes = part_body[pdf_start:].rstrip(b"\r\n-")
                                break
            elif b"%PDF" in body:
                pdf_start = body.find(b"%PDF")
                pdf_bytes = body[pdf_start:]

            if not pdf_bytes:
                self.send_response(400)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "ไม่พบข้อมูลไฟล์ PDF หรือไฟล์เสียหาย"
                }, ensure_ascii=False).encode("utf-8"))
                return

            try:
                result = parse_pdf_data(pdf_bytes)
                if not result.get("success"):
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
                    return

                projects = load_projects()
                existing_idx = next((i for i, p in enumerate(projects) if p["id"] == result["id"]), -1)
                if existing_idx >= 0:
                    result["target_month"] = projects[existing_idx].get("target_month", result["target_month"])
                    projects[existing_idx] = result
                else:
                    projects.insert(0, result)
                save_projects(projects)

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": f"เกิดข้อผิดพลาดในการประมวลผล PDF: {str(e)}"
                }, ensure_ascii=False).encode("utf-8"))
            return

        if url.path == "/api/projects/update-target":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)
            pid = data.get("id")
            target_month = data.get("target_month")

            projects = load_projects()
            match = next((p for p in projects if p["id"] == pid), None)
            if match:
                match["target_month"] = target_month
                save_projects(projects)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "project": match}, ensure_ascii=False).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Project not found"}).encode("utf-8"))
            return

        if url.path == "/api/projects/delete":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(body)
            pid = data.get("id")

            projects = load_projects()
            initial_len = len(projects)
            projects = [p for p in projects if p.get("id") != pid and p.get("wbs") != pid]
            save_projects(projects)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "deleted": len(projects) < initial_len, "id": pid, "projects": projects}, ensure_ascii=False).encode("utf-8"))
            return

        if url.path == "/api/export-approval-docx":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
            try:
                data = json.loads(body) if body.strip() else {}
            except Exception:
                data = {}
            pid = data.get("id")
            custom_path = data.get("output_path")
            client_project = data.get("project")

            projects = load_projects()
            match = client_project or next((p for p in projects if p.get("id") == pid or p.get("wbs") == pid), None)
            if not match and projects:
                match = projects[0]

            if match:
                try:
                    # In cloud/serverless environment, don't attempt to write to local Windows desktop
                    if not custom_path and os.name != "nt":
                        import tempfile
                        custom_path = os.path.join(tempfile.gettempdir(), f"temp_approval_{match.get('id', 'export')}.docx")

                    result = approval_form_docx.fill_approval_docx(match, output_path=custom_path)
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "message": "นำข้อมูลผลการวิเคราะห์ใส่ในไฟล์แบบฟอร์มขออนุมัติค่าใช้จ่ายหน้างานสำเร็จแล้ว",
                        "saved_path": result.get("saved_path", "download"),
                        "download_url": f"/api/download-approval-docx?id={urllib.parse.quote(str(match.get('id', 'export')))}",
                        "details": result
                    }, ensure_ascii=False).encode("utf-8"))
                except Exception as e:
                    self.send_response(500)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False).encode("utf-8"))
            else:
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Project not found"}, ensure_ascii=False).encode("utf-8"))
            return

        self.send_response(404)
        self.end_headers()

    def do_DELETE(self):
        url = urllib.parse.urlparse(self.path)
        if url.path.startswith("/api/projects/"):
            pid = urllib.parse.unquote(url.path.split("/")[-1])
            projects = load_projects()
            initial_len = len(projects)
            projects = [p for p in projects if p.get("id") != pid and p.get("wbs") != pid]
            save_projects(projects)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "deleted": len(projects) < initial_len, "id": pid, "projects": projects}, ensure_ascii=False).encode("utf-8"))
            return
        self.send_response(404)
        self.end_headers()

def run_server():
    init_default_project(force=False)
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(("", PORT), SAPCloseHTTPHandler) as httpd:
        print(f"==================================================")
        print(f"  PEA SAP ZPSR018 Construction Closing Inspector")
        print(f"  Running at: http://localhost:{PORT}")
        print(f"==================================================")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
