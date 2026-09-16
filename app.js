/**
 * PEA SAP ZPSR018 Construction Closing Inspector
 * Client-Side Application Logic & State Management
 */

// Global State
let currentProject = null;
let allProjects = [];
let budgetChart = null;
let selectedPdfFile = null;

// DOM Elements
const projectSelect = document.getElementById("projectSelect");
const templateBadge = document.getElementById("templateBadge");
const wbsBadge = document.getElementById("wbsBadge");
const heroWbs = document.getElementById("heroWbs");
const closingStatusBadge = document.getElementById("closingStatusBadge");
const heroProjectName = document.getElementById("heroProjectName");
const heroOfficer = document.getElementById("heroOfficer");
const heroOfficerId = document.getElementById("heroOfficerId");
const heroPrintDate = document.getElementById("heroPrintDate");

// Target Month Elements
const targetMonthSelect = document.getElementById("targetMonthSelect");
const targetYearSelect = document.getElementById("targetYearSelect");
const btnSaveTargetMonth = document.getElementById("btnSaveTargetMonth");
const targetMonthDisplay = document.getElementById("targetMonthDisplay");

// KPI Elements
const kpiReadinessPct = document.getElementById("kpiReadinessPct");
const kpiReadinessTag = document.getElementById("kpiReadinessTag");
const kpiReadinessDesc = document.getElementById("kpiReadinessDesc");
const kpiBudgetDeficitVal = document.getElementById("kpiBudgetDeficitVal");
const kpiBudgetTag = document.getElementById("kpiBudgetTag");
const kpiBudgetDesc = document.getElementById("kpiBudgetDesc");
const kpiDeficitCount = document.getElementById("kpiDeficitCount");
const kpiReturnCount = document.getElementById("kpiReturnCount");
const kpiReturnTag = document.getElementById("kpiReturnTag");
const kpiWithdrawCount = document.getElementById("kpiWithdrawCount");
const kpiWithdrawTag = document.getElementById("kpiWithdrawTag");

// Badges
const budgetTabBadge = document.getElementById("budgetTabBadge");
const matTabBadge = document.getElementById("matTabBadge");

// Modals
const uploadModal = document.getElementById("uploadModal");
const btnUploadModal = document.getElementById("btnUploadModal");
const btnCloseUploadModal = document.getElementById("btnCloseUploadModal");
const btnCancelUpload = document.getElementById("btnCancelUpload");
const btnConfirmUpload = document.getElementById("btnConfirmUpload");
const pdfDropzone = document.getElementById("pdfDropzone");
const pdfFileInput = document.getElementById("pdfFileInput");
const selectedFileCard = document.getElementById("selectedFileCard");
const selectedFileName = document.getElementById("selectedFileName");
const selectedFileSize = document.getElementById("selectedFileSize");
const btnRemoveSelectedFile = document.getElementById("btnRemoveSelectedFile");
const uploadProgressContainer = document.getElementById("uploadProgressContainer");
const invalidTemplateModal = document.getElementById("invalidTemplateModal");
const btnCloseInvalidModal = document.getElementById("btnCloseInvalidModal");
const btnRetryUpload = document.getElementById("btnRetryUpload");
const invalidModalErrorText = document.getElementById("invalidModalErrorText");

// Edit Project Name Modal
const editProjectNameModal = document.getElementById("editProjectNameModal");
const btnEditProjectName = document.getElementById("btnEditProjectName");
const btnCloseEditProjectNameModal = document.getElementById("btnCloseEditProjectNameModal");
const btnCancelEditProjectName = document.getElementById("btnCancelEditProjectName");
const btnSaveProjectName = document.getElementById("btnSaveProjectName");
const inputEditProjectName = document.getElementById("inputEditProjectName");
const uploadProjectNameGroup = document.getElementById("uploadProjectNameGroup");
const uploadCustomProjectName = document.getElementById("uploadCustomProjectName");

// Memo Modal
const memoModal = document.getElementById("memoModal");
const btnCloseMemoModal = document.getElementById("btnCloseMemoModal");
const btnCloseMemoBtn = document.getElementById("btnCloseMemoBtn");
const btnCopyTransferMemo = document.getElementById("btnCopyTransferMemo");
const btnExportApprovalDocx = document.getElementById("btnExportApprovalDocx");
const btnExportMemoDocx = document.getElementById("btnExportMemoDocx");
const memoTextarea = document.getElementById("memoTextarea");

// Tab Navigation
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

document.addEventListener("DOMContentLoaded", () => {
  initEventListeners();
  loadProjectsFromServer();
  const heroSection = document.getElementById("projectDetailHeroSection");
  if (heroSection) heroSection.style.display = "none";
});

function initEventListeners() {
  // Tabs
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Project select change
  projectSelect.addEventListener("change", (e) => {
    const selectedId = e.target.value;
    const project = allProjects.find(p => p.id === selectedId);
    if (project) {
      setCurrentProject(project);
    }
  });

  // Target month save
  btnSaveTargetMonth.addEventListener("click", saveTargetMonth);

  // Upload Modal triggers
  btnUploadModal.addEventListener("click", openUploadModal);
  btnCloseUploadModal.addEventListener("click", closeUploadModal);
  btnCancelUpload.addEventListener("click", closeUploadModal);
  btnConfirmUpload.addEventListener("click", handleUploadSubmit);

  // Edit project name triggers
  if (btnEditProjectName) btnEditProjectName.addEventListener("click", () => openEditProjectNameModal());
  if (btnCloseEditProjectNameModal) btnCloseEditProjectNameModal.addEventListener("click", closeEditProjectNameModal);
  if (btnCancelEditProjectName) btnCancelEditProjectName.addEventListener("click", closeEditProjectNameModal);
  if (btnSaveProjectName) btnSaveProjectName.addEventListener("click", handleSaveProjectName);

  // Dropzone drag & drop
  pdfDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    pdfDropzone.classList.add("dragover");
  });
  pdfDropzone.addEventListener("dragleave", () => {
    pdfDropzone.classList.remove("dragover");
  });
  pdfDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    pdfDropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  pdfFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  btnRemoveSelectedFile.addEventListener("click", resetSelectedFile);

  // Invalid modal triggers
  btnCloseInvalidModal.addEventListener("click", () => invalidTemplateModal.classList.remove("show"));
  btnRetryUpload.addEventListener("click", () => {
    invalidTemplateModal.classList.remove("show");
    openUploadModal();
  });

  // Memo Modal triggers
  btnCopyTransferMemo.addEventListener("click", openMemoModal);
  btnCloseMemoModal.addEventListener("click", () => memoModal.classList.remove("show"));
  btnCloseMemoBtn.addEventListener("click", () => memoModal.classList.remove("show"));
  btnCopyMemoContent.addEventListener("click", copyMemoToClipboard);

  // Export Approval Docx triggers
  if (btnExportApprovalDocx) {
    btnExportApprovalDocx.addEventListener("click", handleExportApprovalDocx);
  }
  if (btnExportMemoDocx) {
    btnExportMemoDocx.addEventListener("click", handleExportApprovalDocx);
  }

  // Network Filter Tabs
  document.querySelectorAll(".net-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".net-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentNetworkFilter = btn.getAttribute("data-filter");
      renderNetworksTable();
    });
  });

  // Network Modal triggers
  const netModal = document.getElementById("networkModal");
  const btnCloseNetModal = document.getElementById("btnCloseNetworkModal");
  const btnCloseNetModalBtn = document.getElementById("btnCloseNetworkModalBtn");
  if (btnCloseNetModal && netModal) {
    btnCloseNetModal.addEventListener("click", () => netModal.classList.remove("show"));
  }
  if (btnCloseNetModalBtn && netModal) {
    btnCloseNetModalBtn.addEventListener("click", () => netModal.classList.remove("show"));
  }

  // Close any modal on backdrop click
  document.querySelectorAll(".pea-modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("show");
      }
    });
  });

  // Close any modal on ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".pea-modal-backdrop.show").forEach(m => m.classList.remove("show"));
    }
  });

  // Material filters
  document.getElementById("materialFilterSelect").addEventListener("change", renderAllMaterialsTable);
  document.getElementById("materialSearchInput").addEventListener("input", renderAllMaterialsTable);

  // Print & PDF Report Triggers
  const btnPrint = document.getElementById("btnPrintReport");
  if (btnPrint) btnPrint.addEventListener("click", openReportPreviewModal);
  const btnPrintSec = document.getElementById("btnPrintSectionPdf");
  if (btnPrintSec) btnPrintSec.addEventListener("click", openReportPreviewModal);
  const btnPrintMemo = document.getElementById("btnPrintMemoPdf");
  if (btnPrintMemo) btnPrintMemo.addEventListener("click", openReportPreviewModal);

  // Browser Print Buttons
  const btnPrintBrowser = document.getElementById("btnPrintBrowserBtn");
  if (btnPrintBrowser) btnPrintBrowser.addEventListener("click", printReport);
  const btnPrintBrowserBottom = document.getElementById("btnPrintBrowserBtnBottom");
  if (btnPrintBrowserBottom) btnPrintBrowserBottom.addEventListener("click", printReport);

  // Close Report Preview Modal
  const btnCloseReportModal = document.getElementById("btnCloseReportPreviewModal");
  const btnCloseReportBtn = document.getElementById("btnCloseReportPreviewBtn");
  const reportModal = document.getElementById("reportPreviewModal");
  if (btnCloseReportModal && reportModal) {
    btnCloseReportModal.addEventListener("click", () => reportModal.classList.remove("show"));
  }
  if (btnCloseReportBtn && reportModal) {
    btnCloseReportBtn.addEventListener("click", () => reportModal.classList.remove("show"));
  }

  // Delete project modal triggers
  const btnCloseDeleteModal = document.getElementById("btnCloseDeleteModal");
  const btnCancelDeleteProject = document.getElementById("btnCancelDeleteProject");
  const btnConfirmDeleteProject = document.getElementById("btnConfirmDeleteProject");
  const btnDeleteCurrentProject = document.getElementById("btnDeleteCurrentProject");

  if (btnCloseDeleteModal) btnCloseDeleteModal.addEventListener("click", closeDeleteModal);
  if (btnCancelDeleteProject) btnCancelDeleteProject.addEventListener("click", closeDeleteModal);
  if (btnConfirmDeleteProject) btnConfirmDeleteProject.addEventListener("click", executeDeleteProject);
  if (btnDeleteCurrentProject) {
    btnDeleteCurrentProject.addEventListener("click", () => {
      if (!currentProject) {
        showToast("ไม่มีโครงการที่กำลังเปิดอยู่", "warning");
        return;
      }
      promptDeleteProject(currentProject.id, currentProject.name, currentProject.wbs || currentProject.id);
    });
  }
}

function switchTab(tabId) {
  tabButtons.forEach(b => {
    if (b.getAttribute("data-tab") === tabId) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });

  tabContents.forEach(c => {
    if (c.id === tabId) {
      c.classList.add("active");
    } else {
      c.classList.remove("active");
    }
  });

  // Toggle project detail hero section visibility
  const heroSection = document.getElementById("projectDetailHeroSection");
  if (heroSection) {
    if (tabId === "tab-projects") {
      heroSection.style.display = "none";
    } else {
      heroSection.style.display = "block";
    }
  }

  if (tabId === "tab-projects") {
    renderProjectsCardsAndDirectory();
  }
}

// --------------------------------------------------------------------------
// API Calls, LocalStorage Cache & Data Loading
// --------------------------------------------------------------------------
const STORAGE_KEY = "pea_sap_projects_cache";

function getCachedProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Failed to read from localStorage:", e);
  }
  return null;
}

function saveProjectsToCache(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }
}

async function loadProjectsFromServer() {
  // 1. Fetch fresh projects from server API first
  try {
    const response = await fetch("/api/projects");
    if (response.ok) {
      const serverProjects = await response.json();
      if (Array.isArray(serverProjects) && serverProjects.length > 0) {
        allProjects = serverProjects;
        saveProjectsToCache(allProjects);
        populateProjectSelect();
        setCurrentProject(allProjects[0]);
        renderProjectsCardsAndDirectory();
        return;
      }
    }
  } catch (err) {
    console.warn("Server unavailable or offline mode, checking local cache...", err);
  }

  // 2. Fallback to local cache if server is offline
  const cached = getCachedProjects();
  if (cached && cached.length > 0) {
    allProjects = cached;
    populateProjectSelect();
    setCurrentProject(allProjects[0]);
    renderProjectsCardsAndDirectory();
    return;
  }

  // 3. Fallback to sample project
  await loadSampleProject();
  renderProjectsCardsAndDirectory();
}

async function loadSampleProject() {
  try {
    const response = await fetch("/api/sample-project");
    if (response.ok) {
      const sample = await response.json();
      allProjects = [sample];
      populateProjectSelect();
      setCurrentProject(sample);
    }
  } catch (err) {
    console.error("Failed to load sample project:", err);
  }
}

function populateProjectSelect() {
  projectSelect.innerHTML = "";
  if (allProjects.length === 0) {
    projectSelect.innerHTML = '<option value="">ไม่มีข้อมูลโครงการ (โปรดอัปโหลด)</option>';
    return;
  }

  allProjects.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.wbs || p.id} - ${p.name}`;
    projectSelect.appendChild(opt);
  });
}

function setCurrentProject(project) {
  currentProject = project;
  projectSelect.value = project.id;
  renderProjectUI();
}

// --------------------------------------------------------------------------
// UI Rendering
// --------------------------------------------------------------------------
function renderProjectUI() {
  if (!currentProject) return;

  const p = currentProject;
  const b = p.budget_summary || {};
  const m = p.materials_summary || {};

  // Hero Card Info
  heroWbs.textContent = p.wbs || p.id;
  heroProjectName.textContent = p.name || "โครงการไม่มีชื่อ";
  heroOfficer.textContent = p.officer || "-";
  heroOfficerId.textContent = p.officer_id || "-";
  heroPrintDate.textContent = p.print_date || "-";
  templateBadge.innerHTML = `<i class="fa-solid fa-file-invoice"></i> TEMPLATE ${p.template || "ZPSR018"}`;

  // Target Closing Month
  if (p.target_month) {
    targetMonthDisplay.textContent = p.target_month;
    document.getElementById("checkTargetMonthText").textContent = p.target_month;
    // parse month / year if matches
    const parts = p.target_month.split(" ");
    if (parts.length >= 2) {
      targetMonthSelect.value = parts[0];
      targetYearSelect.value = parts[1];
    }
  }

  // Closing Status Badge
  const isDeficit = b.is_deficit;
  if (isDeficit) {
    closingStatusBadge.className = "pea-badge badge-status";
    closingStatusBadge.innerHTML = `<i class="fa-solid fa-ban"></i> ปิดงานไม่ได้ (งบติดลบ)`;
    document.getElementById("overallClosingBadge").className = "badge-status-pill bg-danger";
    document.getElementById("overallClosingBadge").textContent = "ปิดงานไม่ได้ (ต้องโอนงบ)";
  } else {
    closingStatusBadge.className = "pea-badge badge-status ready";
    closingStatusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> พร้อมปิดงาน`;
    document.getElementById("overallClosingBadge").className = "badge-status-pill bg-success";
    document.getElementById("overallClosingBadge").textContent = "พร้อมปิดงาน (งบประมาณสมบูรณ์)";
  }

  // Budget Disbursement Overview Banner (ภาพรวมการเบิกจ่ายงบประมาณโครงการ)
  const allocBudget = b.allocated_budget !== undefined ? b.allocated_budget : (b.total_budget || 0);
  const ctrlActual = b.controlled_actual !== undefined ? b.controlled_actual : (b.total_actual || 0);
  const remBudget = (b.remaining_budget !== undefined && b.remaining_budget !== null) 
    ? b.remaining_budget 
    : (allocBudget - ctrlActual);
  const disbRate = b.disbursement_rate_pct !== undefined 
    ? b.disbursement_rate_pct 
    : (allocBudget > 0 ? ((ctrlActual / allocBudget) * 100).toFixed(2) : 0);

  const elAlloc = document.getElementById("projAllocatedBudgetVal");
  const elCtrl = document.getElementById("projControlledActualVal");
  const elRem = document.getElementById("projRemainingBudgetVal");
  const elRate = document.getElementById("projDisbursementRateVal");
  const elHint = document.getElementById("projRemainingBudgetHint");

  if (elAlloc) elAlloc.textContent = `${formatMoney(allocBudget)} ฿`;
  if (elCtrl) elCtrl.textContent = `${formatMoney(ctrlActual)} ฿`;
  if (elRem) {
    elRem.textContent = `${remBudget < 0 ? '-' : ''}${formatMoney(Math.abs(remBudget))} ฿`;
    elRem.className = remBudget < 0 ? "budget-metric-val val-danger" : "budget-metric-val val-positive";
  }
  if (elRate) elRate.textContent = `${Number(disbRate).toFixed(2)}%`;
  if (elHint) {
    if (remBudget < 0) {
      elHint.textContent = `(เบิกเกินงบจัดสรร ${formatMoney(Math.abs(remBudget))} ฿)`;
      elHint.className = "metric-sub text-danger";
    } else {
      elHint.textContent = `(คงเหลือเบิกจ่ายได้อีก ${formatMoney(remBudget)} ฿)`;
      elHint.className = "metric-sub text-success";
    }
  }

  // Focus specifically on site expenses (5 categories) as requested
  const siteNames = ["ค่าแรงงาน / ค่าจ้างเหมา", "ค่าควบคุมงาน", "ค่าขนส่ง / ยานพาหนะ", "ค่าเบ็ดเตล็ด", "ค่าดำเนินการ"];
  const cats = b.categories || [];
  const siteItems = cats.filter(c => siteNames.includes(c.name));
  const siteDeficits = siteItems.filter(c => c.diff < 0);
  const siteDeficitCount = siteDeficits.length;
  const siteTotalDeficit = siteDeficits.reduce((sum, d) => sum + Math.abs(d.diff), 0);
  const siteTotalActual = siteItems.reduce((sum, c) => sum + c.actual, 0);
  const siteTotalDiff = siteItems.reduce((sum, c) => sum + c.diff, 0);
  const isSiteDeficit = siteDeficitCount > 0;

  // KPIs
  if (kpiDeficitCount) kpiDeficitCount.textContent = siteDeficitCount;
  if (kpiBudgetDeficitVal) kpiBudgetDeficitVal.textContent = isSiteDeficit ? `-${formatMoney(siteTotalDeficit)} ฿` : "0.00 ฿";
  
  if (isSiteDeficit) {
    if (kpiBudgetTag) {
      kpiBudgetTag.className = "kpi-status-tag tag-danger";
      const defNames = siteDeficits.map(d => d.name).join(", ");
      kpiBudgetTag.textContent = `ติดลบ ${siteDeficitCount} หมวด (${defNames})`;
    }
    if (kpiBudgetDesc) kpiBudgetDesc.textContent = `ค่าใช้จ่ายหน้างานจริง ${formatMoney(siteTotalActual)} ฿ (งบคงเหลือรวม ${siteTotalDiff >= 0 ? '+' : ''}${formatMoney(siteTotalDiff)} ฿)`;
  } else {
    if (kpiBudgetTag) {
      kpiBudgetTag.className = "kpi-status-tag tag-success";
      kpiBudgetTag.textContent = "งบหน้างานสมบูรณ์";
    }
    if (kpiBudgetDesc) kpiBudgetDesc.textContent = "ไม่มีหมวดค่าใช้จ่ายหน้างานที่ติดลบ";
  }

  // Materials KPI
  const returnCount = m.need_return_count || 0;
  const withdrawCount = m.need_withdraw_count || 0;
  if (kpiReturnCount) kpiReturnCount.textContent = returnCount;
  if (kpiWithdrawCount) kpiWithdrawCount.textContent = withdrawCount;

  if (kpiReturnTag) {
    if (returnCount > 0) {
      kpiReturnTag.className = "kpi-status-tag tag-warning";
      kpiReturnTag.textContent = "มีพัสดุค้างส่งคืน";
    } else {
      kpiReturnTag.className = "kpi-status-tag tag-neutral";
      kpiReturnTag.textContent = "ไม่มีค้างส่งคืน";
    }
  }

  if (kpiWithdrawTag) {
    if (withdrawCount > 0) {
      kpiWithdrawTag.className = "kpi-status-tag tag-warning";
      kpiWithdrawTag.textContent = "มีรายการขาดเบิก";
    } else {
      kpiWithdrawTag.className = "kpi-status-tag tag-success";
      kpiWithdrawTag.textContent = "เบิกครบตามแผน";
    }
  }

  // Calculate Readiness Score
  // 100 max: -40 if budget deficit, -30 if return pending, -20 if withdraw pending
  let readiness = 100;
  if (isSiteDeficit) readiness -= 40;
  if (returnCount > 0) readiness -= 20;
  if (withdrawCount > 0) readiness -= 15;
  if (kpiReadinessPct) kpiReadinessPct.textContent = `${readiness}%`;

  if (kpiReadinessTag) {
    if (readiness >= 90) {
      kpiReadinessTag.className = "kpi-status-tag tag-success";
      kpiReadinessTag.textContent = "พร้อมปิดงาน";
    } else if (readiness >= 50) {
      kpiReadinessTag.className = "kpi-status-tag tag-warning";
      kpiReadinessTag.textContent = "ต้องแก้ไขข้อมูล";
    } else {
      kpiReadinessTag.className = "kpi-status-tag tag-danger";
      kpiReadinessTag.textContent = "ยังไม่พร้อมปิดงาน";
    }
  }

  // Badges
  if (budgetTabBadge) budgetTabBadge.textContent = isSiteDeficit ? `ติดลบ ${siteDeficitCount} หมวด` : "ปกติ";
  if (matTabBadge) matTabBadge.textContent = `${withdrawCount} ขาดเบิก`;

  // Checklist items
  const checkItemBudget = document.getElementById("checkItemBudget");
  const checkBudgetDesc = document.getElementById("checkBudgetDesc");
  const checkBudgetBadge = document.getElementById("checkBudgetBadge");
  if (checkItemBudget) {
    if (isSiteDeficit) {
      checkItemBudget.className = "check-item";
      const icon = checkItemBudget.querySelector(".check-icon");
      if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-xmark text-danger"></i>';
      if (checkBudgetDesc) {
        const defDetails = siteDeficits.map(d => `${d.name} (-${formatMoney(Math.abs(d.diff))} บาท)`).join(", ");
        checkBudgetDesc.textContent = `พบหมวดค่าใช้จ่ายหน้างานติดลบ ${siteDeficitCount} หมวด: ${defDetails} ต้องโอนงบมาชดเชย`;
      }
      if (checkBudgetBadge) {
        checkBudgetBadge.className = "check-badge bg-danger";
        checkBudgetBadge.textContent = "ไม่ผ่าน";
      }
    } else {
      checkItemBudget.className = "check-item check-pass";
      const icon = checkItemBudget.querySelector(".check-icon");
      if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
      if (checkBudgetDesc) checkBudgetDesc.textContent = "ค่าใช้จ่ายหน้างานทุกหมวดมียอดคงเหลือเป็นบวก ผ่านเกณฑ์ปิดงาน";
      if (checkBudgetBadge) {
        checkBudgetBadge.className = "check-badge bg-success";
        checkBudgetBadge.textContent = "ผ่าน";
      }
    }
  }

  const checkItemReturn = document.getElementById("checkItemReturn");
  const checkReturnDesc = document.getElementById("checkReturnDesc");
  const checkReturnBadge = document.getElementById("checkReturnBadge");
  if (checkItemReturn) {
    if (returnCount > 0) {
      checkItemReturn.className = "check-item";
      const icon = checkItemReturn.querySelector(".check-icon");
      if (icon) icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-warning"></i>';
      if (checkReturnDesc) checkReturnDesc.textContent = `มีอุปกรณ์เบิกเกินค้างส่งคืนคลัง ${returnCount} รายการ`;
      if (checkReturnBadge) {
        checkReturnBadge.className = "check-badge bg-warning";
        checkReturnBadge.textContent = "ต้องคืนคลัง";
      }
    } else {
      checkItemReturn.className = "check-item check-pass";
      const icon = checkItemReturn.querySelector(".check-icon");
      if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
      if (checkReturnDesc) checkReturnDesc.textContent = "ไม่มีพัสดุเบิกเกินค้างส่งคืน หรือส่งคืนคลังเรียบร้อยแล้ว";
      if (checkReturnBadge) {
        checkReturnBadge.className = "check-badge bg-success";
        checkReturnBadge.textContent = "ผ่าน";
      }
    }
  }

  const checkItemWithdraw = document.getElementById("checkItemWithdraw");
  const checkWithdrawDesc = document.getElementById("checkWithdrawDesc");
  const checkWithdrawBadge = document.getElementById("checkWithdrawBadge");
  if (checkItemWithdraw) {
    if (withdrawCount > 0) {
      if (checkWithdrawDesc) checkWithdrawDesc.textContent = `มีพัสดุตามแบบที่ยังไม่ได้เบิก ${withdrawCount} รายการ (ต้องตรวจสอบว่าใช้จริงหรือไม่เพื่อปลดจอง)`;
      if (checkWithdrawBadge) checkWithdrawBadge.textContent = "แจ้งเตือน";
    } else {
      checkItemWithdraw.className = "check-item check-pass";
      const icon = checkItemWithdraw.querySelector(".check-icon");
      if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
      if (checkWithdrawDesc) checkWithdrawDesc.textContent = "พัสดุเบิกจ่ายครบถ้วนตามประมาณการ";
      if (checkWithdrawBadge) {
        checkWithdrawBadge.className = "check-badge bg-success";
        checkWithdrawBadge.textContent = "ผ่าน";
      }
    }
  }

  // Closing Action Summary
  const closingActionSummary = document.getElementById("closingActionSummary");
  if (closingActionSummary) {
    if (isSiteDeficit) {
      const defDetails = siteDeficits.map(d => `[${d.name}] (-${formatMoney(Math.abs(d.diff))} บาท)`).join(", ");
      closingActionSummary.innerHTML = `
        โครงการนี้ยังไม่สามารถปิดงานได้เนื่องจาก <strong>ค่าใช้จ่ายหน้างานในหมวด ${defDetails} ติดลบ</strong> 
        แต่ภาพรวมงบประมาณค่าใช้จ่ายหน้างานยังมีงบคงเหลือถึง ${siteTotalDiff >= 0 ? '+' : ''}${formatMoney(siteTotalDiff)} บาท 
        ให้ดำเนินการโอนงบประมาณจากหมวดค่าใช้จ่ายหน้างานที่มีเงินเหลือ (เช่น ค่าแรงงาน/ค่าจ้างเหมา หรือ ค่าควบคุมงาน) มาชดเชย ${formatMoney(siteTotalDeficit)} บาท 
        และตรวจสอบรายการพัสดุที่ยังไม่ได้เบิก ${withdrawCount} รายการให้เรียบร้อยก่อนส่งเอกสาร กส.3
      `;
    } else {
      closingActionSummary.innerHTML = `
        โครงการนี้มีความพร้อมในการปิดงานด้านงบประมาณค่าใช้จ่ายหน้างานสมบูรณ์ <strong>(ไม่มีหมวดติดลบ)</strong> 
        ขอให้ตรวจสอบความถูกต้องของพัสดุและจัดทำรายงานเสนอคณะกรรมการตรวจงานเพื่อส่งมอบงาน กส.3 ตามแผนเดือน ${p.target_month || "ที่กำหนด"}
      `;
    }
  }

  // Render Charts & Tables with individual try/catch
  try { renderBudgetChart(); } catch(e) { console.error("renderBudgetChart error:", e); }
  try { renderSiteBudgetTable(); } catch(e) { console.error("renderSiteBudgetTable error:", e); }
  try { renderMaterialBudgetTable(); } catch(e) { console.error("renderMaterialBudgetTable error:", e); }
  try { renderNetworksTable(); } catch(e) { console.error("renderNetworksTable error:", e); }
  try { renderNetworkTransferGuide(); } catch(e) { console.error("renderNetworkTransferGuide error:", e); }
  try { renderTransferRecommendations(); } catch(e) { console.error("renderTransferRecommendations error:", e); }
  try { renderSimulationTable(); } catch(e) { console.error("renderSimulationTable error:", e); }
  try { renderAllocatedBudgetTable(); } catch(e) { console.error("renderAllocatedBudgetTable error:", e); }
  try { renderReturnMaterialsTable(); } catch(e) { console.error("renderReturnMaterialsTable error:", e); }
  try { renderWithdrawMaterialsTable(); } catch(e) { console.error("renderWithdrawMaterialsTable error:", e); }
  try { renderAllMaterialsTable(); } catch(e) { console.error("renderAllMaterialsTable error:", e); }
  try { renderProjectsDirectory(); } catch(e) { console.error("renderProjectsDirectory error:", e); }
}

// --------------------------------------------------------------------------
// Chart Rendering (Chart.js)
// --------------------------------------------------------------------------
function renderBudgetChart() {
  const ctx = document.getElementById("budgetDiffChart").getContext("2d");
  const cats = currentProject.budget_summary.categories || [];
  
  // Show Site expenses and materials
  const displayNames = [
    "ค่าแรงงาน / ค่าจ้างเหมา", 
    "ค่าควบคุมงาน", 
    "ค่าขนส่ง / ยานพาหนะ", 
    "ค่าเบ็ดเตล็ด", 
    "ค่าดำเนินการ",
    "ค่าพัสดุ",
    "พัสดุเข้างาน"
  ];
  const filteredCats = cats.filter(c => displayNames.includes(c.name));

  const labels = filteredCats.map(c => c.name);
  const dataValues = filteredCats.map(c => c.diff);
  const backgroundColors = dataValues.map(v => v < 0 ? "#ef4444" : "#10b981");

  if (budgetChart) {
    budgetChart.destroy();
  }

  budgetChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "ผลต่างงบประมาณ (บาท)",
        data: dataValues,
        backgroundColor: backgroundColors,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.raw;
              return `${context.dataset.label}: ${formatMoney(val)} บาท (${val < 0 ? "ติดลบ" : "คงเหลือ"})`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: "#e2e8f0" },
          ticks: {
            callback: function(value) {
              return (value / 1000).toLocaleString() + "k";
            }
          }
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: "'Prompt', sans-serif", size: 11 } }
        }
      }
    }
  });
}

// --------------------------------------------------------------------------
// Tab 2: Site Budget, Material Budget & Transfer Engine
// --------------------------------------------------------------------------
function renderSiteBudgetTable() {
  const tbody = document.getElementById("siteBudgetTableBody");
  const tfoot = document.getElementById("siteBudgetTableFoot");
  if (!tbody || !currentProject) return;

  const cats = currentProject.budget_summary.categories || [];
  const siteNames = ["ค่าแรงงาน / ค่าจ้างเหมา", "ค่าควบคุมงาน", "ค่าขนส่ง / ยานพาหนะ", "ค่าเบ็ดเตล็ด", "ค่าดำเนินการ"];
  const siteItems = cats.filter(c => siteNames.includes(c.name));

  const totalEstimate = siteItems.reduce((acc, c) => acc + (c.estimate || 0), 0);
  const totalActual = siteItems.reduce((acc, c) => acc + c.actual, 0) || 1;
  const totalDiff = siteItems.reduce((acc, c) => acc + c.diff, 0);
  const deficitItem = siteItems.find(c => c.diff < 0);

  const totalDefSum = document.getElementById("budgetTotalDeficitSum");
  if (totalDefSum) {
    const totalDef = siteItems.filter(c => c.diff < 0).reduce((sum, c) => sum + Math.abs(c.diff), 0);
    totalDefSum.textContent = totalDef > 0 ? `-${formatMoney(totalDef)} ฿` : "0.00 ฿";
  }

  tbody.innerHTML = "";
  siteItems.forEach((c, idx) => {
    const pct = ((c.actual / totalActual) * 100).toFixed(1);
    const isNeg = c.diff < 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center">${idx + 1}</td>
      <td><strong>${c.name}</strong></td>
      <td class="text-right font-weight-bold">${formatMoney(c.estimate)}</td>
      <td class="text-right">${formatMoney(c.actual)}</td>
      <td class="text-right ${isNeg ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
        ${isNeg ? '-' : '+'}${formatMoney(Math.abs(c.diff))}
      </td>
      <td class="text-center">${pct}%</td>
      <td class="text-center">
        <span class="check-badge ${isNeg ? 'bg-danger' : 'bg-success'}">
          ${isNeg ? '<i class="fa-solid fa-triangle-exclamation"></i> ติดลบ (ปิดงานไม่ได้)' : '<i class="fa-solid fa-circle-check"></i> ปกติ (มีงบเหลือ)'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr class="table-secondary" style="border-top: 2px solid #cbd5e1; background: #f8fafc;">
        <td colspan="2" class="text-center"><strong>รวมค่าใช้จ่ายหน้างาน (เฉพาะที่ควบคุมงบฯ 5 หมวด)</strong></td>
        <td class="text-right"><strong>${formatMoney(totalEstimate)} ฿</strong></td>
        <td class="text-right"><strong>${formatMoney(totalActual)} ฿</strong></td>
        <td class="text-right ${totalDiff < 0 ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
          <strong>${totalDiff < 0 ? '-' : '+'}${formatMoney(Math.abs(totalDiff))} ฿</strong>
        </td>
        <td class="text-center"><strong>100%</strong></td>
        <td class="text-center">
          <span class="pea-badge ${deficitItem ? 'badge-status' : 'badge-purple'}">
            ${deficitItem ? `ติดลบ ${formatMoney(Math.abs(deficitItem.diff))} ฿ (ต้องโอนงบ)` : 'ยอดสุทธิพร้อมปิดงาน'}
          </span>
        </td>
      </tr>
    `;
  }
}

function renderMaterialBudgetTable() {
  const tbody = document.getElementById("materialBudgetTableBody");
  const tfoot = document.getElementById("materialBudgetTableFoot");
  if (!tbody || !currentProject) return;

  const cats = currentProject.budget_summary.categories || [];
  const matNames = ["ค่าพัสดุ", "พัสดุเข้างาน"];
  const matItems = cats.filter(c => matNames.includes(c.name));

  const totalEstimate = matItems.reduce((acc, c) => acc + (c.estimate || 0), 0);
  const totalActual = matItems.reduce((acc, c) => acc + c.actual, 0);
  const totalDiff = matItems.reduce((acc, c) => acc + c.diff, 0);

  const matSurplusBadge = document.getElementById("matSurplusBadge");
  if (matSurplusBadge) {
    matSurplusBadge.textContent = `งบพัสดุคงเหลือ: ${totalDiff < 0 ? '-' : '+'}${formatMoney(Math.abs(totalDiff))} ฿`;
  }

  tbody.innerHTML = "";
  matItems.forEach((c, idx) => {
    const isNeg = c.diff < 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center">${idx + 1}</td>
      <td><strong>${c.name}</strong></td>
      <td class="text-right font-weight-bold">${formatMoney(c.estimate)}</td>
      <td class="text-right">${formatMoney(c.actual)}</td>
      <td class="text-right ${isNeg ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
        ${isNeg ? '-' : '+'}${formatMoney(Math.abs(c.diff))}
      </td>
      <td class="text-center">${totalActual > 0 ? ((c.actual / totalActual) * 100).toFixed(1) + '%' : '0.0%'}</td>
      <td class="text-center">
        <span class="check-badge ${isNeg ? 'bg-danger' : 'bg-success'}">
          ${isNeg ? 'ติดลบ' : 'มีงบคงเหลือ (พร้อมให้โอน)'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr class="table-secondary" style="border-top: 2px solid #cbd5e1; background: #f8fafc;">
        <td colspan="2" class="text-center"><strong>รวมหมวดพัสดุ</strong></td>
        <td class="text-right"><strong>${formatMoney(totalEstimate)} ฿</strong></td>
        <td class="text-right"><strong>${formatMoney(totalActual)} ฿</strong></td>
        <td class="text-right ${totalDiff < 0 ? 'text-danger' : 'text-success'} font-weight-bold">
          <strong>${totalDiff < 0 ? '-' : '+'}${formatMoney(Math.abs(totalDiff))} ฿</strong>
        </td>
        <td class="text-center"><strong>100%</strong></td>
        <td class="text-center">
          <span class="badge-status-pill ${totalDiff < 0 ? 'bg-danger' : 'bg-success'}">
            ${totalDiff < 0 ? 'งบพัสดุติดลบ' : 'งบพัสดุเหลือสมบูรณ์'}
          </span>
        </td>
      </tr>
    `;
  }
}

// --------------------------------------------------------------------------
// Section 3: SAP Network Financial Analysis
// --------------------------------------------------------------------------
let currentNetworkFilter = "all";

function renderNetworksTable() {
  const tbody = document.getElementById("networksTableBody");
  const tfoot = document.getElementById("networksTableFoot");
  if (!tbody || !currentProject) return;

  const nets = currentProject.networks || [];
  const netSummary = currentProject.networks_summary || {};

  const totalCount = nets.length;
  const readyCount = nets.filter(n => !n.has_deficit).length;
  const deficitCount = nets.filter(n => n.has_deficit).length;

  const netCountTotal = document.getElementById("netCountTotal");
  const netCountPass = document.getElementById("netCountPass");
  const netCountDeficit = document.getElementById("netCountDeficit");
  if (netCountTotal) netCountTotal.textContent = totalCount;
  if (netCountPass) netCountPass.textContent = readyCount;
  if (netCountDeficit) netCountDeficit.textContent = deficitCount;

  const filterAllCount = document.getElementById("filterNetAllCount");
  const filterDeficitCount = document.getElementById("filterNetDeficitCount");
  const filterReadyCount = document.getElementById("filterNetReadyCount");
  if (filterAllCount) filterAllCount.textContent = totalCount;
  if (filterDeficitCount) filterDeficitCount.textContent = deficitCount;
  if (filterReadyCount) filterReadyCount.textContent = readyCount;

  // Update Network Root Cause Callout Alert dynamically
  const networkAlertBox = document.getElementById("networkAlertBox");
  const networkAlertDesc = document.getElementById("networkAlertDesc");
  if (networkAlertBox && networkAlertDesc) {
    if (deficitCount > 0) {
      networkAlertBox.className = "network-alert-box mb-3";
      networkAlertBox.style.display = "flex";
      const iconEl = networkAlertBox.querySelector(".net-alert-icon");
      if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';

      const defNets = nets.filter(n => n.has_deficit);
      const defNetDetails = defNets.map(n => {
        let issues = [];
        if (n.site_deficits && n.site_deficits.length > 0) {
          issues.push(n.site_deficits.map(d => `${d.name} (-${formatMoney(Math.abs(d.diff))} ฿)`).join(", "));
        }
        if (n.total_diff < 0) {
          issues.push(`ผลต่างรวม (-${formatMoney(Math.abs(n.total_diff))} ฿)`);
        }
        return `<strong class="text-danger">โครงข่าย ${n.network_no} (${n.description || 'ไม่ระบุชื่อ'})</strong> [${issues.join("; ")}]`;
      }).join(" และ ");

      const b = currentProject.budget_summary || {};
      const siteExpenseNames = ["ค่าแรงงาน / ค่าจ้างเหมา", "ค่าควบคุมงาน", "ค่าขนส่ง / ยานพาหนะ", "ค่าเบ็ดเตล็ด", "ค่าดำเนินการ"];
      const siteDefCats = (b.categories || []).filter(c => siteExpenseNames.includes(c.name) && c.diff < 0);
      let catDeficitText = "";
      if (siteDefCats.length > 0) {
        catDeficitText = `ยอดติดลบในหมวด${siteDefCats.map(c => `${c.name} (-${formatMoney(Math.abs(c.diff))} ฿)`).join(", ")} ของทั้งโครงการ เกิดขึ้นจาก `;
      } else {
        catDeficitText = `พบรายการติดลบในระดับโครงข่ายที่ `;
      }

      networkAlertDesc.innerHTML = `
        ${catDeficitText}${defNetDetails} 
        ในขณะที่โครงข่ายอื่นๆ อีก ${totalCount - deficitCount} โครงข่ายมีงบประมาณเหลือ 
        จึงต้องดำเนินการเกลี่ย/โอนงบประมาณระหว่างหมวดและระหว่างโครงข่ายตามระเบียบ กส.3 ก่อนปิดงาน
      `;
    } else {
      networkAlertBox.className = "network-alert-box alert-success mb-3";
      networkAlertBox.style.display = "flex";
      const iconEl = networkAlertBox.querySelector(".net-alert-icon");
      if (iconEl) iconEl.innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
      networkAlertDesc.innerHTML = `
        โครงข่ายทั้งหมด (${totalCount} โครงข่าย) มีงบประมาณค่าใช้จ่ายหน้างานเพียงพอและไม่มีหมวดค่าใช้จ่ายที่เกินวงเงิน 
        พร้อมสำหรับการปิดงานทางด้านการเงิน
      `;
    }
  }

  let displayNets = nets;
  if (currentNetworkFilter === "deficit") {
    displayNets = nets.filter(n => n.has_deficit);
  } else if (currentNetworkFilter === "ready") {
    displayNets = nets.filter(n => !n.has_deficit);
  }

  tbody.innerHTML = "";
  if (displayNets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="text-center py-4 text-muted">ไม่พบข้อมูลโครงข่ายตามเงื่อนไขที่เลือก</td></tr>`;
  } else {
    displayNets.forEach(n => {
      const isDef = n.has_deficit;
      const isTotNeg = n.total_diff < 0;
      const isSiteNeg = n.site_diff < 0;

      let problemHtml = '<span class="text-success"><i class="fa-solid fa-circle-check"></i> ปกติ (งบไม่เกิน)</span>';
      if (n.site_deficits && n.site_deficits.length > 0) {
        problemHtml = n.site_deficits.map(d => 
          `<span class="badge-tag bg-danger font-weight-bold"><i class="fa-solid fa-triangle-exclamation"></i> ${d.name} (-${formatMoney(Math.abs(d.diff))} ฿)</span>`
        ).join(" ");
      } else if (isTotNeg) {
        problemHtml = `<span class="badge-tag bg-danger font-weight-bold"><i class="fa-solid fa-triangle-exclamation"></i> ผลต่างรวมติดลบ (-${formatMoney(Math.abs(n.total_diff))} ฿)</span>`;
      }

      const tr = document.createElement("tr");
      if (isDef) {
        tr.style.backgroundColor = "rgba(239, 68, 68, 0.04)";
      }
      tr.innerHTML = `
        <td class="text-center font-weight-bold">${n.seq}</td>
        <td>
          <span class="font-mono text-purple font-weight-bold" style="font-size: 0.95rem;">
            <i class="fa-solid fa-cube text-muted"></i> ${n.network_no}
          </span>
        </td>
        <td><strong>${n.description}</strong></td>
        <td class="text-right">${formatMoney(n.total_estimate)}</td>
        <td class="text-right">${formatMoney(n.total_actual)}</td>
        <td class="text-right ${isTotNeg ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
          ${isTotNeg ? '-' : '+'}${formatMoney(Math.abs(n.total_diff))}
        </td>
        <td class="text-right">${formatMoney(n.site_actual)}</td>
        <td class="text-right ${isSiteNeg ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
          ${isSiteNeg ? '-' : '+'}${formatMoney(Math.abs(n.site_diff))}
        </td>
        <td>${problemHtml}</td>
        <td class="text-center">
          <span class="check-badge ${isDef ? 'bg-danger' : 'bg-success'}">
            ${isDef ? '<i class="fa-solid fa-ban"></i> ติดลบ' : '<i class="fa-solid fa-circle-check"></i> พร้อมปิด'}
          </span>
        </td>
        <td class="text-center">
          <button class="btn btn-xs btn-purple" onclick="openNetworkModal('${n.network_no}')">
            <i class="fa-solid fa-magnifying-glass-chart"></i> ดู 10 หมวด
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  if (tfoot) {
    const sumTotEst = nets.reduce((sum, n) => sum + (n.total_estimate || 0), 0);
    const sumTotAct = nets.reduce((sum, n) => sum + (n.total_actual || 0), 0);
    const sumTotDiff = nets.reduce((sum, n) => sum + (n.total_diff || 0), 0);
    const sumSiteAct = nets.reduce((sum, n) => sum + (n.site_actual || 0), 0);
    const sumSiteDiff = nets.reduce((sum, n) => sum + (n.site_diff || 0), 0);

    tfoot.innerHTML = `
      <tr class="table-secondary" style="border-top: 2px solid #cbd5e1; background: #f8fafc;">
        <td colspan="3" class="text-center"><strong>รวมทุกโครงข่าย (${nets.length} โครงข่าย)</strong></td>
        <td class="text-right"><strong>${formatMoney(sumTotEst)} ฿</strong></td>
        <td class="text-right"><strong>${formatMoney(sumTotAct)} ฿</strong></td>
        <td class="text-right ${sumTotDiff < 0 ? 'text-danger' : 'text-success'} font-weight-bold">
          <strong>${sumTotDiff < 0 ? '-' : '+'}${formatMoney(Math.abs(sumTotDiff))} ฿</strong>
        </td>
        <td class="text-right"><strong>${formatMoney(sumSiteAct)} ฿</strong></td>
        <td class="text-right ${sumSiteDiff < 0 ? 'text-danger' : 'text-success'} font-weight-bold">
          <strong>${sumSiteDiff < 0 ? '-' : '+'}${formatMoney(Math.abs(sumSiteDiff))} ฿</strong>
        </td>
        <td colspan="3" class="text-center">
          <span class="pea-badge ${deficitCount > 0 ? 'badge-status' : 'badge-purple'}">
            ${deficitCount > 0 ? `ติดลบ ${deficitCount} โครงข่าย (มีเงินเหลือสุทธิ)` : 'ทุกโครงข่ายพร้อมปิดงาน'}
          </span>
        </td>
      </tr>
    `;
  }
}

function renderNetworkTransferGuide() {
  const container = document.getElementById("netTransferGuideGrid");
  if (!container || !currentProject) return;

  const netSummary = currentProject.networks_summary || {};
  const recs = netSummary.transfer_recommendations || [];

  if (recs.length === 0) {
    container.innerHTML = `
      <div class="net-guide-card" style="grid-column: 1 / -1;">
        <div class="guide-card-header">
          <strong class="text-success"><i class="fa-solid fa-circle-check"></i> ไม่จำเป็นต้องโอนงบประมาณระดับโครงข่าย</strong>
        </div>
        <div class="guide-card-body">
          <p class="text-muted">ทุกโครงข่ายมีงบประมาณคงเหลือเพียงพอและไม่มีรายการติดลบในหมวดสำคัญ</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = recs.map(rec => {
    const isIntra = rec.type === "intra_network";
    return `
      <div class="net-guide-card ${isIntra ? 'card-intra' : 'card-inter'}">
        <div class="guide-card-header">
          <strong>
            <i class="fa-solid ${isIntra ? 'fa-arrows-rotate text-gold' : 'fa-network-wired text-purple'}"></i> 
            ${rec.title}
          </strong>
          <span class="badge-tag ${isIntra ? 'bg-gold text-dark' : 'bg-purple'} font-weight-bold">
            ${formatMoney(rec.amount)} ฿
          </span>
        </div>
        <div class="guide-card-body">
          <p>${rec.reason}</p>
          <div class="guide-flow-box">
            ${isIntra ? `
              <span><strong>จากหมวด:</strong> [${rec.donor_category}]</span>
              <i class="fa-solid fa-arrow-right text-gold"></i>
              <span><strong>เข้าหมวด:</strong> [${rec.target_category}]</span>
            ` : `
              <span><strong>จากโครงข่าย:</strong> ${rec.donor_network} (${rec.donor_desc})</span>
              <i class="fa-solid fa-arrow-right text-purple"></i>
              <span><strong>เข้าโครงข่าย:</strong> ${rec.target_network} (${rec.target_desc})</span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function openNetworkModal(networkNo) {
  if (!currentProject || !currentProject.networks) return;
  const net = currentProject.networks.find(n => n.network_no === networkNo);
  if (!net) return;

  const modal = document.getElementById("networkModal");
  const modalBody = modal ? modal.querySelector(".modal-body") : null;
  if (modalBody) {
    modalBody.scrollTop = 0;
  }
  document.getElementById("modalNetNo").textContent = net.network_no;
  document.getElementById("modalNetDesc").textContent = `${net.description} (ลำดับที่ ${net.seq})`;
  
  const statusBadge = document.getElementById("modalNetStatusBadge");
  if (net.has_deficit) {
    statusBadge.className = "badge-status-pill bg-danger";
    statusBadge.innerHTML = `<i class="fa-solid fa-ban"></i> ติดลบ (ปิดงานไม่ได้)`;
  } else {
    statusBadge.className = "badge-status-pill bg-success";
    statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> งบประมาณสมบูรณ์`;
  }

  document.getElementById("modalNetEstimate").textContent = `${formatMoney(net.total_estimate)} ฿`;
  document.getElementById("modalNetActual").textContent = `${formatMoney(net.total_actual)} ฿`;
  
  const diffEl = document.getElementById("modalNetDiff");
  diffEl.textContent = `${net.total_diff < 0 ? '-' : '+'}${formatMoney(Math.abs(net.total_diff))} ฿`;
  diffEl.className = net.total_diff < 0 ? "text-danger font-weight-bold" : "text-success font-weight-bold";

  const siteDiffEl = document.getElementById("modalNetSiteDiff");
  siteDiffEl.textContent = `${net.site_diff < 0 ? '-' : '+'}${formatMoney(Math.abs(net.site_diff))} ฿`;
  siteDiffEl.className = net.site_diff < 0 ? "text-danger font-weight-bold" : "text-success font-weight-bold";

  const tbody = document.getElementById("modalNetCategoryTableBody");
  tbody.innerHTML = "";
  (net.categories || []).forEach((c, idx) => {
    const isNeg = c.diff < 0;
    let grpName = "ค่าใช้จ่ายปันส่วนทางบัญชี";
    let grpClass = "badge-tag";
    if (c.group === "material") {
      grpName = "หมวดพัสดุ";
      grpClass = "badge-tag bg-gold text-dark";
    } else if (c.group === "site") {
      grpName = "ค่าใช้จ่ายหน้างาน (ควบคุม)";
      grpClass = "badge-tag bg-purple";
    }

    const tr = document.createElement("tr");
    if (isNeg && c.group === "site") {
      tr.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
    }
    tr.innerHTML = `
      <td class="text-center font-weight-bold">${idx + 1}</td>
      <td><strong>${c.name}</strong></td>
      <td><span class="${grpClass}">${grpName}</span></td>
      <td class="text-right">${formatMoney(c.estimate)}</td>
      <td class="text-right">${formatMoney(c.actual)}</td>
      <td class="text-right ${isNeg ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
        ${isNeg ? '-' : '+'}${formatMoney(Math.abs(c.diff))}
      </td>
      <td class="text-center">
        <span class="check-badge ${isNeg ? 'bg-danger' : 'bg-success'}">
          ${isNeg ? 'ติดลบ' : 'คงเหลือ'}
        </span>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const transferBox = document.getElementById("modalNetTransferBox");
  if (net.has_deficit) {
    transferBox.style.display = "block";
    transferBox.className = "modal-transfer-box mt-3";
    transferBox.innerHTML = `
      <strong><i class="fa-solid fa-lightbulb text-gold"></i> คำแนะนำการแก้ปัญหางบประมาณติดลบของโครงข่าย ${net.network_no}:</strong>
      <p class="mt-1 mb-0">
        - <strong>โอนงบภายในโครงข่าย:</strong> แนะนำโอนจากหมวด [ค่าแรงงาน/ค่าจ้างเหมา] ที่มีงบคงเหลือ +45,630.00 ฿ มาชดเชย [ค่าเบ็ดเตล็ด] ที่ติดลบ -89,083.49 ฿<br>
        - <strong>โอนงบข้ามโครงข่ายใน SAP:</strong> สามารถดำเนินการตัดโอนงบประมาณผ่าน T-Code <code>KB11N</code> / <code>CJ30</code> จากหมวด [ค่าควบคุมงาน] โครงข่าย 6001322332 ที่มีงบคงเหลือ 53,382.00 ฿ มาชดเชย
      </p>
    `;
  } else {
    transferBox.style.display = "block";
    transferBox.className = "modal-transfer-box mt-3 bg-light border";
    transferBox.innerHTML = `
      <span class="text-success"><i class="fa-solid fa-circle-check"></i> โครงข่ายนี้มีงบประมาณคงเหลือ ${formatMoney(net.total_diff)} บาท สามารถใช้เป็นโครงข่ายต้นทางเพื่อโอนงบไปชดเชยโครงข่ายอื่นที่ติดลบได้</span>
    `;
  }

  modal.classList.add("show");
}

function renderTransferRecommendations() {
  const container = document.getElementById("transferCardsGrid");
  if (!container) return;

  const cats = currentProject.budget_summary.categories || [];
  const netSummary = currentProject.networks_summary || {};
  const netRecs = netSummary.transfer_recommendations || [];

  // Check if there are any site deficits at all
  const siteNames = ["ค่าแรงงาน / ค่าจ้างเหมา", "ค่าควบคุมงาน", "ค่าขนส่ง / ยานพาหนะ", "ค่าเบ็ดเตล็ด", "ค่าดำเนินการ"];
  const siteDeficits = cats.filter(c => siteNames.includes(c.name) && c.diff < 0);
  const netDeficits = (currentProject.networks || []).filter(n => n.has_deficit);

  if (siteDeficits.length === 0 && netDeficits.length === 0) {
    container.innerHTML = `
      <div class="p-3 text-center text-muted" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-circle-check text-success"></i> ค่าใช้จ่ายหน้างานไม่มีหมวดติดลบ ไม่จำเป็นต้องโอนงบประมาณ
      </div>
    `;
    return;
  }

  // Build plans from network-level recommendations if available
  const plans = [];

  if (netRecs.length > 0) {
    netRecs.forEach((rec, idx) => {
      const isIntra = rec.type === "intra_network";
      plans.push({
        title: rec.title || `ขาที่ ${idx + 1}: ${isIntra ? "โอนภายในโครงข่ายเดียวกัน (Intra-Network)" : "โอนข้ามโครงข่าย (Inter-Network)"}`,
        tag: rec.tag || (isIntra ? "โอนภายในโครงข่าย" : "โอนข้ามโครงข่าย"),
        tagClass: rec.tagClass || (isIntra ? "bg-gold text-dark" : "bg-purple"),
        from: rec.donor_category || (isIntra ? (rec.donor_category || "-") : `โครงข่าย ${rec.donor_network}`),
        fromGroup: rec.donor_desc || (isIntra ? `โครงข่าย ${rec.network_no}` : `โครงข่าย ${rec.donor_network}`),
        fromNetwork: rec.donor_network || "-",
        fromRemain: rec.donor_remaining !== undefined ? rec.donor_remaining : (rec.donor_available ? rec.donor_available - rec.amount : 0),
        to: rec.target_category || "-",
        toGroup: rec.target_desc || (isIntra ? `โครงข่าย ${rec.network_no}` : `โครงข่าย ${rec.target_network}`),
        toNetwork: rec.target_network || "-",
        toNewEstimate: rec.new_estimate,
        initialEstimate: rec.initial_estimate,
        amount: rec.amount || 0,
        reason: rec.reason || ""
      });
    });
  } else {
    // Fallback: category-level recommendations
    const siteDeficit = cats.find(c => c.name === "ค่าเบ็ดเตล็ด" && c.diff < 0);
    if (siteDeficit) {
      const defAmount = Math.abs(siteDeficit.diff);
      const labor = cats.find(c => c.name.includes("แรงงาน")) || { diff: 0, name: "ค่าแรงงาน / ค่าจ้างเหมา" };
      const supervision = cats.find(c => c.name.includes("ควบคุมงาน")) || { diff: 0, name: "ค่าควบคุมงาน" };
      const operation = cats.find(c => c.name.includes("ดำเนินการ")) || { diff: 0, name: "ค่าดำเนินการ" };

      const roundNeeded = Math.ceil(defAmount / 100) * 100;

      if (labor.diff > 1000) {
        const maxLabor = Math.max(0, labor.diff - 1000);
        const capLabor = Math.floor(maxLabor / 100) * 100;
        const amt = Math.min(roundNeeded, capLabor);
        if (amt > 0) {
          plans.push({
            title: "แผนที่ 1: โอนภายในหมวดค่าแรงงาน (แนะนำสูงสุด)",
            tag: "แนะนำ", tagClass: "bg-success",
            from: labor.name, fromGroup: "ค่าใช้จ่ายหน้างาน", fromNetwork: "รวม",
            fromRemain: labor.diff - amt,
            to: "ค่าเบ็ดเตล็ด", toGroup: "ค่าใช้จ่ายหน้างาน", toNetwork: "รวม",
            amount: amt,
            reason: `โอนจากหมวด${labor.name} ซึ่งมีงบคงเหลือ ${formatMoney(labor.diff)} ฿ ชดเชยยอดติดลบ (คงเหลือติดหมวด ${formatMoney(labor.diff - amt)} ฿)`
          });
        }
      }
      if (supervision.diff > 1000) {
        const maxSup = Math.max(0, supervision.diff - 1000);
        const capSup = Math.floor(maxSup / 100) * 100;
        const amt = Math.min(roundNeeded, capSup);
        if (amt > 0) {
          plans.push({
            title: "แผนที่ 2: โอนจากหมวดค่าควบคุมงาน",
            tag: "ทางเลือก", tagClass: "bg-info",
            from: supervision.name, fromGroup: "ค่าใช้จ่ายหน้างาน", fromNetwork: "รวม",
            fromRemain: supervision.diff - amt,
            to: "ค่าเบ็ดเตล็ด", toGroup: "ค่าใช้จ่ายหน้างาน", toNetwork: "รวม",
            amount: amt,
            reason: `โอนจากหมวด${supervision.name} ซึ่งมีงบคงเหลือ ${formatMoney(supervision.diff)} ฿ (คงเหลือติดหมวด ${formatMoney(supervision.diff - amt)} ฿)`
          });
        }
      }
      // Operation cost is strictly LAST RESORT: only if regular site costs cannot cover the deficit
      const regularSurplus = (labor.diff > 0 ? labor.diff : 0) + (supervision.diff > 0 ? supervision.diff : 0);
      if (regularSurplus < defAmount && operation.diff > 1000) {
        const maxOp = Math.max(0, operation.diff - 1000);
        const capOp = Math.floor(maxOp / 100) * 100;
        const amt = Math.min(roundNeeded, capOp);
        if (amt > 0) {
          plans.push({
            title: "แผนสำรอง: โอนจากหมวดค่าดำเนินการ (หมวดอื่นไม่พอใช้)",
            tag: "หมวดสำรอง", tagClass: "bg-warning",
            from: operation.name, fromGroup: "ค่าใช้จ่ายหน้างาน", fromNetwork: "รวม",
            fromRemain: operation.diff - amt,
            to: "ค่าเบ็ดเตล็ด", toGroup: "ค่าใช้จ่ายหน้างาน", toNetwork: "รวม",
            amount: amt,
            reason: `เนื่องจากหมวดค่าใช้จ่ายหน้างานอื่นไม่เพียงพอ จึงจำเป็นต้องโอนจากหมวด${operation.name} (คงเหลือ ${formatMoney(operation.diff)} ฿) (คงเหลือติดหมวด ${formatMoney(operation.diff - amt)} ฿)`
          });
        }
      }
    }
  }

  container.innerHTML = "";
  plans.forEach(r => {
    const card = document.createElement("div");
    card.className = "transfer-card";
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
        <strong style="font-size: 0.95rem; color: var(--pea-purple-900);"><i class="fa-solid fa-arrows-turn-right text-purple"></i> ${r.title}</strong>
        <span class="check-badge ${r.tagClass}">${r.tag}</span>
      </div>
      <div class="transfer-route">
        <div class="transfer-source">
          <span class="label">โอนออกจาก [${r.fromGroup}]:</span>
          <strong style="color: #1e293b; display: block; font-size: 0.88rem;">${r.from}</strong>
          ${r.fromNetwork && r.fromNetwork !== 'รวม' ? `<span style="font-size: 0.72rem; color: var(--pea-purple-600); display: block;"><i class="fa-solid fa-cube"></i> โครงข่าย: ${r.fromNetwork}</span>` : ''}
          <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 2px;">คงเหลือหลังโอน: <strong>${formatMoney(r.fromRemain)} ฿</strong></span>
        </div>
        <div class="transfer-arrow"><i class="fa-solid fa-arrow-right-long"></i></div>
        <div class="transfer-dest">
          <span class="label">โอนเข้า [${r.toGroup}]:</span>
          <strong class="text-danger" style="display: block; font-size: 0.88rem;">${r.to}</strong>
          ${r.toNetwork && r.toNetwork !== 'รวม' ? `<span style="font-size: 0.72rem; color: var(--pea-purple-600); display: block;"><i class="fa-solid fa-cube"></i> โครงข่าย: ${r.toNetwork}</span>` : ''}
          <span style="font-size: 0.72rem; color: #059669; display: block; margin-top: 2px;">
            ${r.toNewEstimate ? `งบประมาณการเพิ่มเป็น: <strong>${formatMoney(r.toNewEstimate)} ฿</strong>` : 'ยอดหลังโอน: 0.00 ฿'}
          </span>
        </div>
      </div>
      <div class="transfer-amount-box">
        <span style="font-weight: 500;">จำนวนเงินที่เสนอขออนุมัติโอน:</span>
        <strong style="font-size: 1.05rem; color: #059669;">+${formatMoney(r.amount)} บาท</strong>
      </div>
      <p class="transfer-reason" style="font-size: 0.8rem; line-height: 1.5; color: #475569; margin: 0.5rem 0 0;"><i class="fa-solid fa-circle-info text-purple"></i> ${r.reason}</p>
    `;
    container.appendChild(card);
  });
}

// --------------------------------------------------------------------------
// Friendly Network Description Helper & Post-Transfer Filter
// --------------------------------------------------------------------------
function getFriendlyNetworkDesc(netNo, rawDesc) {
  const s = String(netNo || "").trim();
  if (s.includes("6001322332")) return "ฐานรากสถานี";
  if (s.includes("6001322483")) return "ระบบกราวด์";
  if (s.includes("6001322333")) return "สถานีไฟฟ้าแรงสูง";
  if (s.includes("6001322334")) return "ระบบไฟฟ้าแรงต่ำ";
  if (s.includes("6001322341")) return "สายส่งระบบ 1";
  if (s.includes("6001322342")) return "สายส่งระบบ 2";
  if (rawDesc) {
    const clean = rawDesc.replace(/แผนก|งาน/g, "").trim();
    if (clean) return clean;
  }
  return rawDesc || `โครงข่าย ${netNo}`;
}
window.getFriendlyNetworkDesc = getFriendlyNetworkDesc;

let postTransferFilterMode = "transfer_only"; // "transfer_only" or "all"

function setPostTransferView(mode) {
  postTransferFilterMode = mode;
  const btnOnly = document.getElementById("btnFilterTransferOnly");
  const btnAll = document.getElementById("btnFilterAllNets");
  if (btnOnly && btnAll) {
    if (mode === "transfer_only") {
      btnOnly.className = "btn btn-xs btn-purple active";
      btnAll.className = "btn btn-xs btn-outline-dark";
    } else {
      btnOnly.className = "btn btn-xs btn-outline-dark";
      btnAll.className = "btn btn-xs btn-purple active";
    }
  }
  renderSimulationTable();
}
window.setPostTransferView = setPostTransferView;

function renderSimulationTable() {
  const tbody = document.getElementById("simulationTableBody");
  const summaryBody = document.getElementById("postTransferSummaryBody");
  if (!tbody) return;

  const netSummary = currentProject.networks_summary || {};
  const netRecs = netSummary.transfer_recommendations || [];
  const cats = currentProject.budget_summary.categories || [];
  const siteNames = ["ค่าแรงงาน / ค่าจ้างเหมา", "ค่าควบคุมงาน", "ค่าขนส่ง / ยานพาหนะ", "ค่าเบ็ดเตล็ด", "ค่าดำเนินการ"];
  const siteItems = cats.filter(c => siteNames.includes(c.name));

  // --- Part 1: Detailed Transfer Simulation Table ---
  tbody.innerHTML = "";

  // Combine network-level recommendations AND category-level recommendations
  const transferRows = [];

  // Add network-level transfer recommendations
  netRecs.forEach((rec, idx) => {
    const isIntra = rec.type === "intra_network";
    transferRows.push({
      type: rec.title || `ขาที่ ${idx + 1}: ${isIntra ? "โอนภายในโครงข่าย" : "โอนข้ามโครงข่าย"}`,
      typeClass: rec.tagClass || (isIntra ? "bg-gold text-dark" : "bg-purple"),
      fromNetwork: rec.donor_network || "-",
      fromNetworkDesc: rec.donor_desc || "",
      fromCategory: rec.donor_category || (isIntra ? "-" : "งบประมาณรวม"),
      toNetwork: rec.target_network || "-",
      toNetworkDesc: rec.target_desc || "",
      toCategory: rec.target_category || (isIntra ? "-" : "งบประมาณรวม"),
      amount: rec.amount || 0,
      reason: rec.reason || ""
    });
  });

  // If no network-level recs, also build category-level transfers (fallback)
  if (transferRows.length === 0) {
    const defItem = siteItems.find(c => c.diff < 0);
    if (defItem) {
      const defAmount = Math.abs(defItem.diff);
      const donor = siteItems.find(c => c.name.includes("แรงงาน") && c.diff > 1000) || siteItems.find(c => c.diff > 1000);
      if (donor) {
        const maxTrans = Math.max(0, donor.diff - 1000);
        const cap100 = Math.floor(maxTrans / 100) * 100;
        const roundNeed = Math.ceil(defAmount / 100) * 100;
        const amt = Math.min(roundNeed, cap100);
        if (amt > 0) {
          transferRows.push({
            type: "ภายในหมวด",
            typeClass: "bg-info",
            fromNetwork: "รวมทุกโครงข่าย",
            fromNetworkDesc: "",
            fromCategory: donor.name,
            toNetwork: "รวมทุกโครงข่าย",
            toNetworkDesc: "",
            toCategory: defItem.name,
            amount: amt,
            reason: `โอนจาก ${donor.name} (คงเหลือ ${formatMoney(donor.diff)} ฿) มาชดเชย ${defItem.name} (ติดลบ ${formatMoney(defItem.diff)} ฿) (คงเหลือติดหมวด ${formatMoney(donor.diff - amt)} ฿)`
          });
        }
      }
    }
  }

  if (transferRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-3 text-muted"><i class="fa-solid fa-circle-check text-success"></i> ไม่มีรายการที่ต้องโอนงบประมาณ</td></tr>`;
  } else {
    transferRows.forEach((row, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="text-center font-weight-bold">${idx + 1}</td>
        <td><span class="badge-tag ${row.typeClass} font-weight-bold">${row.type}</span></td>
        <td>
          <span class="font-mono text-purple font-weight-bold">${row.fromNetwork}</span>
          ${row.fromNetworkDesc ? `<br><span style="font-size: 0.75rem; color: var(--text-muted);">${row.fromNetworkDesc}</span>` : ''}
        </td>
        <td><strong>${row.fromCategory}</strong></td>
        <td>
          <span class="font-mono text-purple font-weight-bold">${row.toNetwork}</span>
          ${row.toNetworkDesc ? `<br><span style="font-size: 0.75rem; color: var(--text-muted);">${row.toNetworkDesc}</span>` : ''}
        </td>
        <td><strong class="text-danger">${row.toCategory}</strong></td>
        <td class="text-right font-weight-bold text-success">${formatMoney(row.amount)} ฿</td>
        <td class="text-center">
          <span class="check-badge bg-success"><i class="fa-solid fa-arrow-right-arrow-left"></i> โอนได้</span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- Part 2: Post-Transfer Summary Table per Network ---
  if (!summaryBody) return;

  const networks = currentProject.networks || [];
  summaryBody.innerHTML = "";

  if (networks.length === 0) {
    summaryBody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted">ไม่พบข้อมูลโครงข่ายในโครงการ</td></tr>`;
    return;
  }

  let displayedNetworksCount = 0;

  networks.forEach((net) => {
    const netNo = String(net.network_no || "").trim();
    const friendlyDesc = getFriendlyNetworkDesc(netNo, net.description);
    const siteCats = net.site_categories || (net.categories || []).filter(c => c.group === "site");

    // Check adjustments for this specific network from netRecs
    const netAdjustments = {};
    siteCats.forEach(c => netAdjustments[c.name] = 0);
    let hasTransferInThisNet = false;

    netRecs.forEach(r => {
      const dNo = String(r.donor_network || "").trim();
      const tNo = String(r.target_network || "").trim();
      const amt = Number(r.amount || 0);
      const dCat = r.donor_category || "";
      const tCat = r.target_category || "";

      if (dNo === netNo) {
        siteCats.forEach(c => {
          if (c.name.includes(dCat) || dCat.includes(c.name)) {
            netAdjustments[c.name] -= amt;
            hasTransferInThisNet = true;
          }
        });
      }

      if (tNo === netNo) {
        siteCats.forEach(c => {
          if (c.name.includes(tCat) || tCat.includes(c.name)) {
            netAdjustments[c.name] += amt;
            hasTransferInThisNet = true;
          }
        });
      }
    });

    // Fallback: If no netRecs were generated, but category-level deficit exists on this network
    if (netRecs.length === 0 && defAmount > 0) {
      if (net.has_deficit) {
        const defC = siteCats.find(c => c.diff < 0);
        if (defC) {
          netAdjustments[defC.name] += defAmount;
          hasTransferInThisNet = true;
        }
      } else if (!hasTransferInThisNet) {
        const donorC = siteCats.find(c => c.diff >= defAmount);
        if (donorC) {
          netAdjustments[donorC.name] -= defAmount;
          hasTransferInThisNet = true;
        }
      }
    }

    // Filter by mode: if transfer_only, show only networks with transfer or deficit
    if (postTransferFilterMode === "transfer_only" && !hasTransferInThisNet && !net.has_deficit) {
      return;
    }

    displayedNetworksCount++;

    let netTotalOrig = 0;
    let netTotalAdj = 0;
    let netTotalPost = 0;

    siteCats.forEach((c, catIdx) => {
      const orig = Number(c.diff || 0);
      const adj = Number(netAdjustments[c.name] || 0);
      const post = orig + adj;
      const isOk = post >= 0;

      netTotalOrig += orig;
      netTotalAdj += adj;
      netTotalPost += post;

      let adjDisplay = '<span class="text-muted">-</span>';
      if (adj > 0) {
        adjDisplay = `<span class="text-success font-weight-bold">+${formatMoney(adj)}</span>`;
      } else if (adj < 0) {
        adjDisplay = `<span class="text-danger font-weight-bold">-${formatMoney(Math.abs(adj))}</span>`;
      }

      const tr = document.createElement("tr");
      if (catIdx === 0) {
        tr.style.borderTop = "2px solid #cbd5e1";
      }

      tr.innerHTML = `
        <td class="font-mono text-purple font-weight-bold">
          <i class="fa-solid fa-cube text-muted" style="font-size: 0.75rem;"></i> ${netNo}
        </td>
        <td>
          <strong style="color: var(--pea-purple-900);">${friendlyDesc}</strong>
          ${net.description && net.description !== friendlyDesc ? `<span class="text-muted" style="font-size: 0.75rem;"> (${net.description})</span>` : ''}
        </td>
        <td>${c.name}</td>
        <td class="text-right ${orig < 0 ? 'text-danger font-weight-bold' : 'text-success'}">
          ${orig < 0 ? '-' : '+'}${formatMoney(Math.abs(orig))}
        </td>
        <td class="text-center">${adjDisplay}</td>
        <td class="text-right font-weight-bold ${isOk ? 'text-success' : 'text-danger'}">
          ${post < 0 ? '-' : '+'}${formatMoney(Math.abs(post))}
        </td>
        <td class="text-center">
          <span class="pea-badge ${isOk ? 'badge-purple' : 'badge-status'}">
            ${isOk ? '<i class="fa-solid fa-circle-check text-success"></i> ยอดไม่ติดลบ' : '<i class="fa-solid fa-circle-xmark text-danger"></i> ยังติดลบ'}
          </span>
        </td>
      `;
      summaryBody.appendChild(tr);
    });

    // Summary Subtotal Row for this Network
    const subtotalTr = document.createElement("tr");
    subtotalTr.style.backgroundColor = "#f8fafc";
    subtotalTr.style.borderBottom = "2px solid #94a3b8";

    let subtotalAdjDisplay = '<span class="text-muted">-</span>';
    if (netTotalAdj > 0) {
      subtotalAdjDisplay = `<span class="text-success font-weight-bold">+${formatMoney(netTotalAdj)}</span>`;
    } else if (netTotalAdj < 0) {
      subtotalAdjDisplay = `<span class="text-danger font-weight-bold">-${formatMoney(Math.abs(netTotalAdj))}</span>`;
    }
    const netIsOk = netTotalPost >= 0;

    subtotalTr.innerHTML = `
      <td colspan="3" class="text-right font-weight-bold text-purple" style="font-size: 0.85rem;">
        <i class="fa-solid fa-calculator"></i> รวมค่าใช้จ่ายหน้างาน โครงข่าย ${netNo} (${friendlyDesc}):
      </td>
      <td class="text-right ${netTotalOrig < 0 ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
        ${netTotalOrig < 0 ? '-' : '+'}${formatMoney(Math.abs(netTotalOrig))}
      </td>
      <td class="text-center font-weight-bold">${subtotalAdjDisplay}</td>
      <td class="text-right font-weight-bold ${netIsOk ? 'text-success' : 'text-danger'}">
        ${netTotalPost < 0 ? '-' : '+'}${formatMoney(Math.abs(netTotalPost))}
      </td>
      <td class="text-center">
        <span class="check-badge ${netIsOk ? 'bg-success' : 'bg-danger'}">
          ${netIsOk ? 'พร้อมปิดงาน' : 'ยังติดลบ'}
        </span>
      </td>
    `;
    summaryBody.appendChild(subtotalTr);
  });

  if (displayedNetworksCount === 0) {
    summaryBody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted">ไม่พบข้อมูลโครงข่ายที่ตรงตามเงื่อนไข</td></tr>`;
  }
}

// --------------------------------------------------------------------------
// Official Memo Generator (บันทึกข้อความขออนุมัติโอนงบประมาณ SAP WBS)
// --------------------------------------------------------------------------
function openMemoModal() {
  const modal = document.getElementById("memoModal");
  const textarea = document.getElementById("memoTextarea");
  if (!modal || !textarea) return;

  if (!currentProject) {
    alert("กรุณาเลือกโครงการก่อน");
    return;
  }

  const modalBody = modal.querySelector(".modal-body");
  if (modalBody) {
    modalBody.scrollTop = 0;
  }

  const p = currentProject;
  const wbs = p.wbs || p.id || "P-TDD02.2-I-OMNS0.ONA3.2";
  const projName = p.name || "งานก่อสร้างสถานีไฟฟ้าอ้อมน้อย 1 (ชั่วคราว) จ.สมุทรสาคร";
  const dateStr = p.print_date || new Date().toLocaleDateString("th-TH", { day: 'numeric', month: 'long', year: 'numeric' });
  
  const isOMNS = p.id === "omns1" || (p.wbs && p.wbs.includes("OMNS0")) || (p.name && p.name.includes("อ้อมน้อย"));

  let memoContent = "";

  if (isOMNS) {
    const net1 = (p.networks || []).find(n => n.network_no === "6001322332") || (p.networks || [])[0];
    const net2 = (p.networks || []).find(n => n.network_no === "6001322483") || (p.networks || [])[1];

    function formatNetRows(net) {
      if (!net) return "";
      const cats = net.site_categories || (net.categories || []).filter(c => c.group === "site");
      let res = "รายการ                 ประมาณการ          เบิกจ่าย            คงเหลือ\n";
      res += "-----------------------------------------------------------------------\n";
      cats.forEach(c => {
        const nameCol = (c.name.length > 18 ? c.name.substring(0, 18) : c.name).padEnd(20, ' ');
        const estCol = formatMoney(c.estimate).padStart(14, ' ');
        const actCol = formatMoney(c.actual).padStart(15, ' ');
        const diffStr = c.diff < 0 ? `(${formatMoney(Math.abs(c.diff))})` : formatMoney(c.diff);
        const diffCol = diffStr.padStart(16, ' ');
        res += `${nameCol} ${estCol}  ${actCol}  ${diffCol}\n`;
      });
      res += "-----------------------------------------------------------------------";
      return res;
    }

    const net1Table = net1 ? formatNetRows(net1) : "";
    const net2Table = net2 ? formatNetRows(net2) : "";
    const net1No = net1 ? net1.network_no : "6001322332";
    const net1Desc = "แผนกฐานรากสถานี";
    const net2No = net2 ? net2.network_no : "6001322483";
    const net2Desc = "แผนกระบบกราวด์";

    let transferClauses = "";
    const pRecs = (p.networks_summary && p.networks_summary.transfer_recommendations) || [];
    if (pRecs.length > 0) {
      pRecs.forEach((r, idx) => {
        transferClauses += `    3.${idx + 1} ${r.reason}\n`;
      });
    } else {
      transferClauses = `    3.1 อนุมัติให้โอนงบค่าควบคุมงานแผนกฐานรากสถานี จำนวน 50,000.00 บาท ไปเป็นค่าเบ็ดเตล็ดแผนกระบบกราวด์ ซึ่งเมื่อโอนงบค่าใช้จ่ายในครั้งนี้แล้วงบค่าเบ็ดเตล็ดแผนกระบบกราวด์ เพิ่มขึ้น เป็นเงิน (27,934.00 + 50,000.00) = 77,934.00 บาท\n    3.2 อนุมัติให้โอนงบค่าแรงงาน / ค่าจ้างเหมา แผนกระบบกราวด์ จำนวน 40,000.00 บาท ไปเป็นค่าเบ็ดเตล็ดแผนกระบบกราวด์ ซึ่งเมื่อโอนงบค่าใช้จ่ายในครั้งนี้แล้วงบค่าเบ็ดเตล็ดแผนกระบบกราวด์เพิ่มขึ้น เป็นเงิน (77,934.00 + 40,000.00) = 117,934.00 บาท\n`;
    }

    memoContent = `บันทึกข้อความ
ส่วนงาน: กรย.(ก3) แผนกจัดการงานก่อสร้างระบบส่งและสถานีไฟฟ้า  โทร. (๓๓) 10161
ที่: ก.3 กรย.(จส)        /2569                  วันที่: ${dateStr}
เรื่อง: ขออนุมัติค่าใช้จ่ายเพิ่มเติม${projName}

เรียน  ผชก.(ก3) ผ่าน อฝ.วบ.(ก๓)

1. เรื่องเดิม
ตามหนังสือที่ ก.3 กวว.(วร) 462/2566 ลงวันที่ 20 กุมภาพันธ์ 2566 อนุมัติแบบและค่าใช้จ่ายในการก่อสร้างสถานีไฟฟ้าอ้อมน้อย 1 (ชั่วคราว) จ.สมุทรสาคร เพื่อรองรับงานปรับปรุงสถานีไฟฟ้าเสื่อมสภาพตาม คพจ.2 โดยย้ายหม้อแปลงไฟฟ้ากำลังขนาด 1x50 MVA จากสถานีไฟฟ้าสมุทรสาคร 4 จ.สมุทรสาคร (หม้อแปลงดังกล่าวติดตั้งใช้งานที่สถานีไฟฟ้าอ้อมน้อย 1 จ.สมุทรสาคร) และย้ายอุปกรณ์ป้องกันระบบ 115 เควี จากสถานีไฟฟ้าบางกะดี (ชั่วคราว) จ.ปทุมธานี ตามแผนผังเลขที่ RN11-A03/650040 (งานด้านไฟฟ้า) และแผนผังเลขที่ RN34-A3/65019 ซึ่งมีค่าใช้จ่ายทั้งสิ้นเป็นเงิน 10,319,053.- บาท (เอกสารแนบ) นั้น

2. ข้อมูล
กรย.(ก3) ได้ดำเนินการก่อสร้างสถานีไฟฟ้าอ้อมน้อย 1 (ชั่วคราว) ในส่วนของงานระบบไฟฟ้าภายในสถานีฯ หมายเลขงาน WBS : ${wbs} แล้วเสร็จ และจ่ายไฟแล้ว แต่เนื่องจากปัญหาและอุปสรรคในการดำเนินการก่อสร้างสถานีไฟฟ้า ส่งผลให้ค่าใช้จ่ายหน้างานในบางส่วนไม่เพียงพอ โดยปัจจุบันมีรายละเอียดการเบิกจ่าย ดังนี้

2.1 ${net1Desc} โครงข่าย ${net1No}
${net1Table}

2.2 ${net2Desc} โครงข่าย ${net2No}
${net2Table}

3. ข้อพิจารณา - สรุป
จากรายละเอียดข้อมูลข้างต้น กรย.(ก3) พิจารณาแล้ว เพื่อให้งานก่อสร้างสถานีไฟฟ้าอ้อมน้อย 1 (ชั่วคราว) ในส่วนของงานระบบไฟฟ้าภายในสถานีฯ หมายเลขงาน WBS : ${wbs} สามารถดำเนินการปิดงานก่อสร้างเพื่อขึ้นทะเบียนทรัพย์สินได้ตามระเบียบ จึงเห็นควรอนุมัติค่าใช้จ่ายเพิ่มเติม ดังนี้
${transferClauses}
จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติค่าใช้จ่าย(เพิ่มเติม) ตามข้อ 3.1 – 3.${pRecs.length || 2}  พร้อมลงนามในแบบฟอร์มค่าใช้จ่ายหน้างานให้ต่อไป พร้อมนี้ได้แนบเรื่องเดิมมาเพื่อประกอบการพิจารณาด้วยแล้ว


                                            (นายศุภเสกย์ กุลเลิศวิวัฒน์)
                                       ชก.รย.(ก3) ปฏิบัติงานแทน อก.รย.(ก3)

คำสั่งการ:
ที่ ก.3 กรย.(จส)                /2569
อก.รย.(ก3), อก.วว.(ก3), อก.บฟ.(ก3)
อนุมัติ และให้ดำเนินการในส่วนที่เกี่ยวข้องต่อไป


                                              (นายเมธี สุกก่ำ)
                                       อฝ.วบ.(ก3) ปฏิบัติงานแทน ผชก.(ก3)`;
  } else {
    const b = p.budget_summary || {};
    const netRecs = (p.networks_summary && p.networks_summary.transfer_recommendations) || [];
    let transferLines = "";
    let totalTransferAmt = 0;
    if (netRecs.length > 0) {
      netRecs.forEach((r, idx) => {
        transferLines += `    3.${idx + 1} ${r.reason}\n`;
        totalTransferAmt += (Number(r.amount) || 0);
      });
    } else {
      const recs = b.recommendations || [];
      recs.forEach((r, idx) => {
        transferLines += `    3.${idx + 1} โอนจากหมวด [${r.from_category}] ไปยังหมวด [${r.to_category}] จำนวนเงิน ${formatMoney(r.amount)} บาท\n`;
        totalTransferAmt += (Number(r.amount) || 0);
      });
    }

    memoContent = `บันทึกข้อความ
ส่วนงาน: แผนกก่อสร้างและปรับปรุงระบบไฟฟ้า การไฟฟ้าส่วนภูมิภาค
ที่: กส. / .................................... วันที่: ${dateStr}
เรื่อง: ขออนุมัติโอนงบประมาณภายในโครงการก่อสร้าง เพื่อดำเนินการปิดงานในระบบ SAP (ZPSR018)

เรียน: ผู้จัดการ / ผู้อำนวยการฝ่าย

1. เรื่องเดิม
ตามที่ได้รับมอบหมายให้ดำเนินการก่อสร้าง-ปรับปรุงระบบไฟฟ้า โครงการ "${projName}" 
หมายเลขงาน (WBS): ${wbs} ผู้ควบคุมงาน: ${p.officer || '-'} (รหัส ${p.officer_id || '-'})
ซึ่งงานก่อสร้างได้ดำเนินการแล้วเสร็จตามแบบรูปรายการและประมาณการเรียบร้อยแล้วนั้น

2. ข้อมูล
ในการดำเนินการปิดงานก่อสร้างในระบบ SAP คีย์โค้ด ZPSR018 พบว่าโครงการมีหมวดค่าใช้จ่ายที่มียอดเงินติดลบ 
ส่งผลให้ระบบ SAP ไม่อนุญาตให้ทำการปิดบัญชีและปิดงาน (CLSD) ได้ จำนวน ${b.deficits ? b.deficits.length : 0} หมวด 
รวมเป็นยอดเงินติดลบทั้งสิ้น -${formatMoney(b.total_deficit || 0)} บาท

3. ข้อพิจารณา - สรุป
เพื่อให้การปิดงานก่อสร้างในระบบ SAP เป็นไปตามระเบียบ กฟภ. และยอดงบประมาณทุกหมวดไม่ติดลบ 
จึงใคร่ขออนุมัติปรับเปลี่ยน/โอนงบประมาณภายในโครงการ ดังมีรายการต่อไปนี้:
${transferLines || '    ไม่มีรายการโอนงบที่ต้องดำเนินการ\n'}
รวมยอดเงินที่ขออนุมัติโอนทั้งสิ้น: ${formatMoney(totalTransferAmt || b.total_deficit || 0)} บาท 

จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติการโอนงบประมาณในระบบ SAP เพื่อให้สามารถดำเนินการปิดงาน กส.3 ต่อไป


                                ( ${p.officer || 'ผู้ควบคุมงาน'} )
                               ผู้ควบคุมงาน กฟภ.`;
  }

  textarea.value = memoContent;
  modal.classList.add("show");
}

function copyMemoToClipboard() {
  const textarea = document.getElementById("memoTextarea");
  if (!textarea || !textarea.value) return;

  navigator.clipboard.writeText(textarea.value).then(() => {
    showToast("คัดลอกบันทึกข้อความขอโอนงบ SAP เรียบร้อยแล้ว", "success");
  }).catch(() => {
    textarea.select();
    document.execCommand("copy");
    showToast("คัดลอกบันทึกข้อความเรียบร้อยแล้ว", "success");
  });
}

// --------------------------------------------------------------------------
// Official Site Expenses Approval Form (.docx) Exporter
// --------------------------------------------------------------------------
async function handleExportApprovalDocx() {
  if (!currentProject) {
    alert("กรุณาเลือกโครงการก่อน");
    return;
  }

  const btn1 = document.getElementById("btnExportApprovalDocx");
  const btn2 = document.getElementById("btnExportMemoDocx");

  const origBtn1Text = btn1 ? btn1.innerHTML : "";
  const origBtn2Text = btn2 ? btn2.innerHTML : "";

  const loadingHtml = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกข้อมูล...`;
  if (btn1) {
    btn1.disabled = true;
    btn1.innerHTML = loadingHtml;
  }
  if (btn2) {
    btn2.disabled = true;
    btn2.innerHTML = loadingHtml;
  }

  try {
    const response = await fetch("/api/export-approval-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: currentProject.id || currentProject.wbs,
        project: currentProject
      })
    });

    const result = await response.json();
    if (result.success) {
      showToast(`บันทึกข้อมูลใส่ไฟล์ 2.แบบฟอร์มอนุมัติค่าใช้จ่ายหน้างาน.docx สำเร็จแล้ว!`, "success");

      // Also trigger a download in the browser for user convenience
      if (result.download_url) {
        const downloadLink = document.createElement("a");
        downloadLink.href = result.download_url;
        downloadLink.download = "";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } else {
      alert("เกิดข้อผิดพลาดในการบันทึกแบบฟอร์ม: " + (result.error || "ไม่ทราบสาเหตุ"));
    }
  } catch (err) {
    console.error("Export approval docx error:", err);
    alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อบันทึกไฟล์ได้: " + err.message);
  } finally {
    if (btn1) {
      btn1.disabled = false;
      btn1.innerHTML = origBtn1Text;
    }
    if (btn2) {
      btn2.disabled = false;
      btn2.innerHTML = origBtn2Text;
    }
  }
}


function renderAllocatedBudgetTable() {
  const tbody = document.getElementById("allocatedBudgetTableBody");
  const tfoot = document.getElementById("allocatedBudgetTableFoot");
  if (!tbody || !currentProject) return;

  // 1. Retrieve allocated categories robustly
  let allocItems = [];
  if (currentProject.budget_summary?.allocated?.items && currentProject.budget_summary.allocated.items.length > 0) {
    allocItems = currentProject.budget_summary.allocated.items;
  } else if (currentProject.budget_summary?.categories) {
    allocItems = currentProject.budget_summary.categories.filter(c => 
      c.group === "allocated" ||
      (c.id && ["c8", "c9", "c10"].includes(c.id.toLowerCase())) ||
      (c.name && (c.name.includes("ปันส่วน") || c.name.includes("ทางอ้อม") || c.name.includes("ดอกเบี้ย")))
    );
  }

  // Fallback: Aggregate from networks if project has networks
  if (allocItems.length === 0 && currentProject.networks) {
    const allocMap = {};
    currentProject.networks.forEach(net => {
      (net.categories || []).forEach(c => {
        const cid = (c.id || "").toLowerCase();
        if (c.group === "allocated" || ["c8", "c9", "c10"].includes(cid)) {
          const key = cid || "c8";
          if (!allocMap[key]) {
            allocMap[key] = { id: c.id, name: c.name, group: "allocated", estimate: 0, actual: 0, diff: 0 };
          }
          allocMap[key].estimate += (Number(c.estimate) || 0);
          allocMap[key].actual += (Number(c.actual) || 0);
        }
      });
    });
    allocItems = Object.values(allocMap).map(item => {
      item.diff = item.estimate - item.actual;
      item.is_deficit = item.diff < 0;
      return item;
    });
  }

  // Empty state handling
  if (allocItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fa-solid fa-circle-info text-info"></i> ไม่พบข้อมูลค่าใช้จ่ายปันส่วนทางบัญชีในโครงการนี้</td></tr>`;
    if (tfoot) tfoot.innerHTML = "";
    return;
  }

  tbody.innerHTML = "";
  let totalEstimate = 0;
  let totalActual = 0;
  let totalDiff = 0;

  allocItems.forEach(c => {
    const est = Number(c.estimate) || 0;
    const act = Number(c.actual) || 0;
    const diff = c.diff !== undefined ? Number(c.diff) : (est - act);
    totalEstimate += est;
    totalActual += act;
    totalDiff += diff;

    const isNeg = diff < 0;
    const cid = (c.id || "").toLowerCase();
    const cname = c.name || "";

    let noteText = "ค่าใช้จ่ายปันส่วนโดยฝ่ายบัญชีและการเงินตามระยะเวลาก่อสร้าง (ระบบกลางปันส่วน)";
    if (cid === "c8" || cname.includes("บันทึกเวลา")) {
      noteText = "ค่าแรงงานปันส่วน/บันทึกเวลาทำงานโดยฝ่ายบัญชี (ระบบกลางปันส่วน ไม่กระทบการปิดงานหน้างาน)";
    } else if (cid === "c9" || cname.includes("ดอกเบี้ย")) {
      noteText = "ค่าดอกเบี้ยเงินกู้ฯ/ต้นทุนทางการเงินระหว่างก่อสร้าง (ระบบกลางปันส่วน ไม่กระทบการปิดงานหน้างาน)";
    } else if (cid === "c10" || cname.includes("ทางอ้อม")) {
      noteText = "ค่าใช้จ่ายส่วนกลางและทางอ้อมอื่นๆ ปันส่วนตามสัดส่วน (ระบบกลางปันส่วน ไม่กระทบการปิดงานหน้างาน)";
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center font-weight-bold"><code>${(c.id || "").toUpperCase()}</code></td>
      <td><strong>${c.name}</strong></td>
      <td class="text-right font-weight-bold">${formatMoney(est)}</td>
      <td class="text-right">${formatMoney(act)}</td>
      <td class="text-right ${isNeg ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
        ${isNeg ? '-' : '+'}${formatMoney(Math.abs(diff))}
      </td>
      <td class="text-muted" style="font-size: 0.82rem;">${noteText}</td>
    `;
    tbody.appendChild(tr);
  });

  if (tfoot) {
    tfoot.innerHTML = `
      <tr class="table-secondary" style="border-top: 2px solid #cbd5e1; background: #f8fafc;">
        <td colspan="2" class="text-center"><strong>รวมค่าใช้จ่ายปันส่วนทางบัญชี/ทางอ้อม</strong></td>
        <td class="text-right"><strong>${formatMoney(totalEstimate)} ฿</strong></td>
        <td class="text-right"><strong>${formatMoney(totalActual)} ฿</strong></td>
        <td class="text-right ${totalDiff < 0 ? 'text-danger font-weight-bold' : 'text-success font-weight-bold'}">
          <strong>${totalDiff < 0 ? '-' : '+'}${formatMoney(Math.abs(totalDiff))} ฿</strong>
        </td>
        <td class="text-muted" style="font-size: 0.8rem;">ระบบกลางปันส่วนอัตโนมัติ (ไม่นำมาคิดเป็นข้อบกพร่องการปิดงานหน้างาน)</td>
      </tr>
    `;
  }
}

// --------------------------------------------------------------------------
// Tab 3: Materials Return & Withdrawal Tables
// --------------------------------------------------------------------------
function renderReturnMaterialsTable() {
  const tbody = document.getElementById("returnMaterialsTableBody");
  const returnItems = currentProject.materials_summary.need_return_items || [];
  document.getElementById("returnItemBadge").textContent = `${returnItems.length} รายการ`;

  if (returnItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted"><i class="fa-solid fa-circle-check text-success"></i> ไม่พบอุปกรณ์ค้างส่งคืนคลังพัสดุ (ส่งคืนครบถ้วนแล้ว)</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  returnItems.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${item.code}</code></td>
      <td>${item.desc}</td>
      <td class="text-right">${item.withdrawn}</td>
      <td class="text-right">${item.installed}</td>
      <td class="text-right text-danger font-weight-bold">${item.to_return}</td>
      <td>${item.unit}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderWithdrawMaterialsTable() {
  const tbody = document.getElementById("withdrawMaterialsTableBody");
  const withdrawItems = currentProject.materials_summary.need_withdraw_items || [];
  document.getElementById("withdrawItemBadge").textContent = `${withdrawItems.length} รายการ`;

  if (withdrawItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-success"><i class="fa-solid fa-circle-check"></i> พัสดุเบิกจ่ายครบถ้วนตามแบบประมาณการ</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  withdrawItems.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><code>${item.code}</code></td>
      <td>${item.desc}</td>
      <td class="text-right">${item.estimated}</td>
      <td class="text-right">${item.withdrawn}</td>
      <td class="text-right text-warning font-weight-bold">${item.to_withdraw}</td>
      <td>${item.unit}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --------------------------------------------------------------------------
// Tab 4: All Materials Full Table with Filter & Search
// --------------------------------------------------------------------------
function renderAllMaterialsTable() {
  const tbody = document.getElementById("allMaterialsTableBody");
  const allItems = currentProject.materials_summary.all_items || [];
  const filterVal = document.getElementById("materialFilterSelect").value;
  const searchVal = document.getElementById("materialSearchInput").value.trim().toLowerCase();

  let filtered = allItems;

  // Filter by status
  if (filterVal !== "ALL") {
    filtered = filtered.filter(item => item.status === filterVal);
  }

  // Filter by search
  if (searchVal) {
    filtered = filtered.filter(item => 
      item.code.toLowerCase().includes(searchVal) ||
      item.desc.toLowerCase().includes(searchVal) ||
      (item.section && item.section.toLowerCase().includes(searchVal))
    );
  }

  document.getElementById("totalMaterialsCountTag").textContent = `${filtered.length} จาก ${allItems.length} รายการ`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center py-4 text-muted">ไม่พบข้อมูลพัสดุที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  filtered.forEach(item => {
    let statusBadge = `<span class="pea-badge badge-purple"><i class="fa-solid fa-check"></i> ติดตั้งครบ</span>`;
    if (item.status === "need_withdraw") {
      statusBadge = `<span class="pea-badge badge-wbs text-warning"><i class="fa-solid fa-triangle-exclamation"></i> ขาดเบิก ${item.to_withdraw}</span>`;
    } else if (item.status === "need_return") {
      statusBadge = `<span class="pea-badge badge-status"><i class="fa-solid fa-arrow-rotate-left"></i> ต้องคืน ${item.to_return}</span>`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center">${item.page}</td>
      <td><code>${item.code}</code></td>
      <td>${item.desc}</td>
      <td class="text-center">${item.unit}</td>
      <td class="text-right">${item.estimated}</td>
      <td class="text-right">${item.withdrawn}</td>
      <td class="text-right">${item.returned}</td>
      <td class="text-right font-weight-bold">${item.installed}</td>
      <td class="text-right">${formatMoney(item.withdrawn_cost)}</td>
      <td class="text-center">${statusBadge}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --------------------------------------------------------------------------
// Tab 5: Projects Directory
// --------------------------------------------------------------------------
function escapeAttr(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let projectPendingDelete = null;

function promptDeleteProject(id, name, wbs) {
  projectPendingDelete = { id, name, wbs };
  const modal = document.getElementById("deleteConfirmModal");
  const modalWbs = document.getElementById("deleteModalWbs");
  const modalName = document.getElementById("deleteModalName");
  if (modalWbs) modalWbs.textContent = wbs || id;
  if (modalName) modalName.textContent = name || id;
  if (modal) modal.classList.add("show");
}

function closeDeleteModal() {
  const modal = document.getElementById("deleteConfirmModal");
  if (modal) modal.classList.remove("show");
  projectPendingDelete = null;
}

async function executeDeleteProject() {
  if (!projectPendingDelete) return;

  const btnConfirm = document.getElementById("btnConfirmDeleteProject");
  const originalHtml = btnConfirm ? btnConfirm.innerHTML : "";
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> กำลังลบ...`;
  }

  const deletedName = projectPendingDelete.name;
  const deletedId = projectPendingDelete.id;

  try {
    const res = await fetch("/api/projects/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deletedId })
    });

    const data = await res.json();
    if (res.ok && data.success) {
      // Update client-side allProjects list
      allProjects = allProjects.filter(p => p.id !== deletedId && p.wbs !== deletedId);
      saveProjectsToCache(allProjects);
      
      closeDeleteModal();
      showToast(`ลบโครงการ "${deletedName}" ออกจากทะเบียนเรียบร้อยแล้ว`, "success");

      // Handle current project deletion
      if (currentProject && (currentProject.id === deletedId || currentProject.wbs === deletedId)) {
        if (allProjects.length > 0) {
          populateProjectSelect();
          setCurrentProject(allProjects[0]);
        } else {
          renderEmptyProjectState();
        }
      } else {
        populateProjectSelect();
        if (currentProject) {
          projectSelect.value = currentProject.id;
        }
      }

      renderProjectsDirectory();
    } else {
      showToast(data.error || "เกิดข้อผิดพลาดในการลบโครงการ", "danger");
    }
  } catch (err) {
    console.error("Error deleting project:", err);
    showToast("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อลบโครงการได้", "danger");
  } finally {
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = originalHtml;
    }
  }
}

function renderEmptyProjectState() {
  currentProject = null;
  heroWbs.textContent = "-";
  heroProjectName.textContent = "ไม่มีโครงการในระบบ (โปรดอัปโหลดรายงาน SAP ZPSR018)";
  heroOfficer.textContent = "-";
  heroOfficerId.textContent = "-";
  heroPrintDate.textContent = "-";
  closingStatusBadge.className = "pea-badge badge-status";
  closingStatusBadge.innerHTML = '<i class="fa-solid fa-circle-info"></i> รอข้อมูล';
  kpiReadinessPct.textContent = "0%";
  kpiBudgetDeficitVal.textContent = "0.00 ฿";
  kpiMaterialsVal.textContent = "0 รายการ";
  kpiActionText.textContent = "อัปโหลดไฟล์ PDF";
  populateProjectSelect();
  renderProjectsDirectory();
}

// --------------------------------------------------------------------------
// Projects Hub, Cards Grid & Directory Management
// --------------------------------------------------------------------------
let projectsViewMode = "cards";

function setProjectsViewMode(mode) {
  projectsViewMode = mode;
  const btnCards = document.getElementById("btnViewCards");
  const btnTable = document.getElementById("btnViewTable");
  const cardsContainer = document.getElementById("projectsCardsContainer");
  const tableContainer = document.getElementById("projectsTableContainer");

  if (mode === "cards") {
    if (btnCards) btnCards.className = "btn btn-xs btn-purple active";
    if (btnTable) btnTable.className = "btn btn-xs btn-outline-purple";
    if (cardsContainer) cardsContainer.style.display = "grid";
    if (tableContainer) tableContainer.style.display = "none";
  } else {
    if (btnCards) btnCards.className = "btn btn-xs btn-outline-purple";
    if (btnTable) btnTable.className = "btn btn-xs btn-purple active";
    if (cardsContainer) cardsContainer.style.display = "none";
    if (tableContainer) tableContainer.style.display = "block";
  }
}

function filterAndRenderProjectsCards() {
  renderProjectsCardsAndDirectory();
}

function renderProjectsCardsAndDirectory() {
  const cardsContainer = document.getElementById("projectsCardsContainer");
  const tbody = document.getElementById("projectsDirectoryTableBody");
  const searchInput = document.getElementById("hubSearchInput");
  const statusFilter = document.getElementById("hubStatusFilter");

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const filterVal = statusFilter ? statusFilter.value : "ALL";

  // 1. Calculate Hub Aggregate Stats
  let totalCount = allProjects.length;
  let readyCount = 0;
  let deficitCount = 0;
  let totalMissing = 0;

  allProjects.forEach(p => {
    const isDef = p.budget_summary && p.budget_summary.is_deficit;
    if (isDef) deficitCount++;
    else readyCount++;

    const withCount = (p.materials_summary && p.materials_summary.need_withdraw_count) || 0;
    if (withCount > 0) totalMissing++;
  });

  const elTotal = document.getElementById("hubTotalCount");
  const elReady = document.getElementById("hubReadyCount");
  const elDeficit = document.getElementById("hubDeficitCount");
  const elMissing = document.getElementById("hubMissingCount");
  const elBadge = document.getElementById("hubProjectsBadge");

  if (elTotal) elTotal.textContent = totalCount;
  if (elReady) elReady.textContent = readyCount;
  if (elDeficit) elDeficit.textContent = deficitCount;
  if (elMissing) elMissing.textContent = totalMissing;
  if (elBadge) elBadge.textContent = totalCount;

  // 2. Filter Projects
  let filtered = allProjects;
  if (filterVal === "READY") {
    filtered = filtered.filter(p => !p.budget_summary || !p.budget_summary.is_deficit);
  } else if (filterVal === "DEFICIT") {
    filtered = filtered.filter(p => p.budget_summary && p.budget_summary.is_deficit);
  } else if (filterVal === "WITHDRAW") {
    filtered = filtered.filter(p => p.materials_summary && p.materials_summary.need_withdraw_count > 0);
  }

  if (query) {
    filtered = filtered.filter(p => {
      const wbs = (p.wbs || p.id || "").toLowerCase();
      const name = (p.name || "").toLowerCase();
      const officer = (p.officer || "").toLowerCase();
      return wbs.includes(query) || name.includes(query) || officer.includes(query);
    });
  }

  // 3. Render Cards Grid
  if (cardsContainer) {
    cardsContainer.innerHTML = "";

    if (filtered.length === 0) {
      if (allProjects.length === 0) {
        cardsContainer.innerHTML = `
          <div class="project-card project-card-add" onclick="openUploadModal()" style="grid-column: 1 / -1; min-height: 240px;">
            <div class="add-card-inner">
              <div class="add-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
              <h4>ยังไม่มีโครงการในระบบ</h4>
              <p>คลิกที่นี่เพื่ออัปโหลดรายงานปิดงาน SAP ZPSR018 / ZBUDR018 (.pdf)</p>
            </div>
          </div>
        `;
      } else {
        cardsContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b;">
            <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 0.75rem; opacity: 0.5;"></i>
            <h4>ไม่พบโครงการที่ตรงกับเงื่อนไขการค้นหา</h4>
            <p>ลองเปลี่ยนคำค้นหา หรือเลือก "สถานะทั้งหมด"</p>
          </div>
        `;
      }
    } else {
      filtered.forEach(p => {
        const isDef = p.budget_summary && p.budget_summary.is_deficit;
        const defSum = p.budget_summary ? (p.budget_summary.total_deficit || 0) : 0;
        const withCount = p.materials_summary ? (p.materials_summary.need_withdraw_count || 0) : 0;
        const retCount = p.materials_summary ? (p.materials_summary.need_return_count || 0) : 0;
        const isCurrent = currentProject && (currentProject.id === p.id || currentProject.wbs === p.wbs);

        // Calculate readiness score
        let readiness = 100;
        if (isDef) readiness -= 40;
        if (retCount > 0) readiness -= 20;
        if (withCount > 0) readiness -= 15;
        if (readiness < 0) readiness = 0;

        let fillClass = "fill-success";
        let scoreColor = "text-success";
        if (readiness < 50) {
          fillClass = "fill-danger";
          scoreColor = "text-danger";
        } else if (readiness < 90) {
          fillClass = "fill-warning";
          scoreColor = "text-warning";
        }

        const card = document.createElement("div");
        card.className = `project-card ${isDef ? 'card-deficit' : 'card-ready'} ${isCurrent ? 'card-current' : ''}`;
        card.innerHTML = `
          <div>
            <div class="project-card-header">
              <span class="project-card-wbs"><i class="fa-solid fa-hashtag"></i> ${p.wbs || p.id}</span>
              <span class="badge-status-pill ${isDef ? 'bg-danger' : 'bg-success'}">
                <i class="fa-solid ${isDef ? 'fa-ban' : 'fa-circle-check'}"></i> ${isDef ? 'ปิดงานไม่ได้' : 'พร้อมปิดงาน'}
              </span>
            </div>

            <h4 class="project-card-title" title="${escapeAttr(p.name)}">${p.name}</h4>

            <div class="project-card-meta">
              <span><i class="fa-solid fa-user-gear"></i> ${p.officer || '-'} (รหัส ${p.officer_id || '-'})</span>
              <span><i class="fa-solid fa-calendar-check text-gold"></i> แผนปิดงาน: <strong>${p.target_month || 'ไม่ระบุ'}</strong></span>
            </div>

            <!-- Readiness Bar -->
            <div class="project-card-readiness">
              <div class="readiness-bar-row">
                <span>ความพร้อมปิดงาน</span>
                <span class="${scoreColor} font-weight-bold">${readiness}%</span>
              </div>
              <div class="readiness-track">
                <div class="readiness-fill ${fillClass}" style="width: ${readiness}%;"></div>
              </div>
            </div>

            <!-- Metric Chips (สถานะบางส่วน) -->
            <div class="project-card-chips">
              <div class="metric-chip ${isDef ? 'chip-danger' : 'chip-success'}">
                <span class="chip-label">งบหน้างาน</span>
                <span class="chip-val">${isDef ? '-' + formatMoney(defSum) + ' ฿' : 'ปกติ (0 ฿)'}</span>
              </div>
              <div class="metric-chip ${withCount > 0 ? 'chip-warning' : 'chip-neutral'}">
                <span class="chip-label">พัสดุขาดเบิก</span>
                <span class="chip-val">${withCount} รายการ</span>
              </div>
              <div class="metric-chip ${retCount > 0 ? 'chip-warning' : 'chip-neutral'} chip-full">
                <span class="chip-label">พัสดุค้างส่งคืน</span>
                <span class="chip-val">${retCount > 0 ? 'ค้างส่งคืน ' + retCount + ' รายการ' : '✓ ไม่มีค้างส่งคืน'}</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="project-card-actions">
            <button class="btn btn-purple btn-open-detail" onclick="selectProjectById('${p.id}')">
              <i class="fa-solid fa-chart-pie"></i> เปิดดูรายละเอียดโครงการ
            </button>
            <button class="btn btn-outline-purple btn-sm" onclick="openEditProjectNameModalById('${p.id}')" title="แก้ไขชื่อโครงการ">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="promptDeleteProject('${p.id}', '${escapeAttr(p.name)}', '${p.wbs || p.id}')" title="ลบโครงการ">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `;
        cardsContainer.appendChild(card);
      });

      // Add "Add New Project" Card at the end of grid
      const addCard = document.createElement("div");
      addCard.className = "project-card project-card-add";
      addCard.onclick = openUploadModal;
      addCard.innerHTML = `
        <div class="add-card-inner">
          <div class="add-icon"><i class="fa-solid fa-plus"></i></div>
          <h4>เพิ่มโครงการใหม่</h4>
          <p>อัปโหลดรายงาน SAP ZPSR018 (.pdf)</p>
        </div>
      `;
      cardsContainer.appendChild(addCard);
    }
  }

  // 4. Render Table View (Directory)
  if (tbody) {
    tbody.innerHTML = "";
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">ไม่พบข้อมูลโครงการที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
    } else {
      filtered.forEach(p => {
        const isDef = p.budget_summary && p.budget_summary.is_deficit;
        const defSum = p.budget_summary ? (p.budget_summary.total_deficit || 0) : 0;
        const withCount = p.materials_summary ? (p.materials_summary.need_withdraw_count || 0) : 0;
        const isCurrent = currentProject && (currentProject.id === p.id || currentProject.wbs === p.wbs);

        const tr = document.createElement("tr");
        if (isCurrent) tr.style.backgroundColor = "rgba(123, 31, 162, 0.05)";

        tr.innerHTML = `
          <td><code>${p.wbs || p.id}</code></td>
          <td><strong>${p.name}</strong> ${isCurrent ? '<span class="pea-badge badge-purple ml-1">กำลังดู</span>' : ''}</td>
          <td>${p.officer || "-"}</td>
          <td><span class="pea-badge badge-wbs"><i class="fa-solid fa-calendar-check text-gold"></i> ${p.target_month || "ไม่ระบุ"}</span></td>
          <td class="text-right ${isDef ? 'text-danger font-weight-bold' : 'text-success'}">${isDef ? `-${formatMoney(defSum)} ฿` : '0.00 ฿'}</td>
          <td class="text-center">${withCount} รายการ</td>
          <td class="text-center">
            <span class="check-badge ${isDef ? 'bg-danger' : 'bg-success'}">
              ${isDef ? 'ปิดงานไม่ได้' : 'พร้อมปิดงาน'}
            </span>
          </td>
          <td class="text-center">
            <div style="display: inline-flex; gap: 0.35rem; align-items: center; justify-content: center;">
              <button class="btn btn-xs btn-purple" onclick="selectProjectById('${p.id}')" title="เปิดดูโครงการนี้">
                <i class="fa-solid fa-eye"></i> เปิดดู
              </button>
              <button class="btn btn-xs btn-outline-purple" onclick="openEditProjectNameModalById('${p.id}')" title="แก้ไขชื่อโครงการ">
                <i class="fa-solid fa-pen-to-square"></i> แก้ไขชื่อ
              </button>
              <button class="btn btn-xs btn-outline-danger" onclick="promptDeleteProject('${p.id}', '${escapeAttr(p.name)}', '${p.wbs || p.id}')" title="ลบโครงการออกจากทะเบียน">
                <i class="fa-solid fa-trash-can"></i> ลบ
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }
  }
}

const renderProjectsDirectory = renderProjectsCardsAndDirectory;

function selectProjectById(id) {
  const match = allProjects.find(p => p.id === id || p.wbs === id);
  if (match) {
    setCurrentProject(match);
    switchTab("tab-overview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// --------------------------------------------------------------------------
// Target Month Management
// --------------------------------------------------------------------------
async function saveTargetMonth() {
  if (!currentProject) return;

  const month = targetMonthSelect.value;
  const year = targetYearSelect.value;
  const newTarget = `${month} ${year}`;

  currentProject.target_month = newTarget;
  targetMonthDisplay.textContent = newTarget;
  document.getElementById("checkTargetMonthText").textContent = newTarget;
  saveProjectsToCache(allProjects);

  try {
    const res = await fetch("/api/projects/update-target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: currentProject.id, target_month: newTarget })
    });
    if (res.ok) {
      showToast(`บันทึกแผนเดือนปิดงานเป็น "${newTarget}" เรียบร้อยแล้ว`, "success");
      renderProjectsDirectory();
    }
  } catch (e) {
    console.warn("Target updated locally (offline mode):", e);
    showToast(`บันทึกแผนเดือนปิดงานเรียบร้อยแล้ว`, "success");
    renderProjectsDirectory();
  }
}

// --------------------------------------------------------------------------
// File Upload & Template Validation
// --------------------------------------------------------------------------
function openUploadModal() {
  resetSelectedFile();
  uploadModal.classList.add("show");
}

function closeUploadModal() {
  uploadModal.classList.remove("show");
  resetSelectedFile();
}

function suggestProjectNameFromFilename(filename) {
  if (!filename) return "";
  let base = filename.replace(/\.[^/.]+$/, ""); // strip .pdf
  // Remove SAP prefixes
  base = base.replace(/^(?:ZPSR018|ZBUDR018|018|รายงานการปิดงาน|รายงานปิดงาน|ปิดงาน)[-_ ]*/i, "");
  // Remove dates
  base = base.replace(/[-_ ]*\d{1,2}[-_\.]\d{1,2}[-_\.]\d{2,4}$/, "").trim();

  // Look for number and suffix e.g. 17(ช), 14(ช), 1 (ช)
  const numMatch = base.match(/(\d+)\s*(\((?:ชค|ช|ชั่วคราว)?\))?/);
  const num = numMatch ? numMatch[1] : "";
  const suffix = (numMatch && numMatch[2] && numMatch[2].includes("ช")) ? "(ช)" : (numMatch && numMatch[2] ? numMatch[2] : "(ช)");

  if (base.includes("สมุทรสาคร") || base.includes("สค.")) {
    return num ? `งานก่อสร้างสฟฟ.สค. ${num}${suffix}` : `งานก่อสร้างสฟฟ.สค.`;
  }
  if (base.includes("อ้อมน้อย") || base.includes("อน.")) {
    return num ? `งานก่อสร้างระบบไฟฟ้าภายในสฟฟ.อ้อมน้อย ${num}` : `งานก่อสร้างระบบไฟฟ้าภายในสฟฟ.อ้อมน้อย`;
  }
  if (base.includes("ท่าม่วง") || base.includes("ทมง.")) {
    return num ? `งานด้านสถานีไฟฟ้าทมง.${num}` : `งานด้านสถานีไฟฟ้าทมง.`;
  }
  if (base.includes("กระทุ่มแบน") || base.includes("กบ.")) {
    return num ? `งานก่อสร้างสฟฟ.กบ. ${num}${suffix}` : `งานก่อสร้างสฟฟ.กบ.`;
  }
  if (base.includes("ดำเนินสะดวก") || base.includes("ดน.")) {
    return num ? `งานก่อสร้างสฟฟ.ดน. ${num}${suffix}` : `งานก่อสร้างสฟฟ.ดน.`;
  }

  // Fallback: if base starts with งาน, use it, else prepend งาน
  if (base.length > 0) {
    let clean = base.replace(/^(?:งานก่อสร้าง|งาน)/, "").trim();
    return `งานก่อสร้าง ${clean}`;
  }
  return "";
}

function handleFileSelected(file) {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    showInvalidTemplateModal("ไฟล์ที่เลือกไม่ใช่นามสกุล .pdf โปรดเลือกไฟล์เอกสาร PDF จากระบบ SAP เท่านั้น");
    return;
  }

  selectedPdfFile = file;
  selectedFileName.textContent = file.name;
  selectedFileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
  selectedFileCard.style.display = "flex";

  // Pre-fill suggested project name
  if (uploadProjectNameGroup && uploadCustomProjectName) {
    uploadProjectNameGroup.style.display = "block";
    uploadCustomProjectName.value = suggestProjectNameFromFilename(file.name);
  }

  btnConfirmUpload.disabled = false;
}

function resetSelectedFile() {
  selectedPdfFile = null;
  pdfFileInput.value = "";
  selectedFileCard.style.display = "none";
  if (uploadProjectNameGroup) uploadProjectNameGroup.style.display = "none";
  if (uploadCustomProjectName) uploadCustomProjectName.value = "";
  btnConfirmUpload.disabled = true;
  uploadProgressContainer.style.display = "none";
}

async function handleUploadSubmit() {
  if (!selectedPdfFile) return;

  uploadProgressContainer.style.display = "block";
  btnConfirmUpload.disabled = true;

  const customProjectName = uploadCustomProjectName ? uploadCustomProjectName.value.trim() : "";

  const formData = new FormData();
  formData.append("file", selectedPdfFile);
  formData.append("filename", selectedPdfFile.name);
  if (customProjectName) {
    formData.append("custom_project_name", customProjectName);
  }

  try {
    const res = await fetch("/api/upload-pdf", {
      method: "POST",
      headers: {
        "X-Filename": encodeURIComponent(selectedPdfFile.name),
        "X-Project-Name": encodeURIComponent(customProjectName)
      },
      body: formData
    });

    const result = await res.json();
    uploadProgressContainer.style.display = "none";

    if (!res.ok || !result.success) {
      closeUploadModal();
      showInvalidTemplateModal(
        result.error || "ไฟล์นี้ไม่ใช่รายงานปิดงานจากระบบ SAP (ZPSR018 / ZBUDR018) ของการไฟฟ้าส่วนภูมิภาค",
        "ไม่สามารถนำเข้าไฟล์ SAP PDF ได้"
      );
      return;
    }

    // Success
    closeUploadModal();
    showToast("นำเข้าและวิเคราะห์ไฟล์ SAP PDF เรียบร้อยแล้ว!", "success");

    // Add or update in allProjects
    const existingIdx = allProjects.findIndex(p => p.id === result.id);
    if (existingIdx >= 0) {
      allProjects[existingIdx] = result;
    } else {
      allProjects.unshift(result);
    }
    saveProjectsToCache(allProjects);

    populateProjectSelect();
    setCurrentProject(result);
    switchTab("tab-overview");
  } catch (err) {
    uploadProgressContainer.style.display = "none";
    closeUploadModal();
    showInvalidTemplateModal(
      "ไม่สามารถติดต่อเซิร์ฟเวอร์ระบบเพื่อประมวลผล PDF ได้ (" + err.message + ") กรุณาตรวจสอบว่าเซิร์ฟเวอร์ Python กำลังทำงานอยู่ที่พอร์ต 3000",
      "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์"
    );
  }
}

// --------------------------------------------------------------------------
// Project Name Editing
// --------------------------------------------------------------------------
function openEditProjectNameModal(project = null) {
  const p = project || currentProject;
  if (!p) return;
  if (inputEditProjectName) {
    inputEditProjectName.value = p.name || "";
    inputEditProjectName.dataset.projectId = p.id;
  }
  if (editProjectNameModal) {
    editProjectNameModal.classList.add("show");
    setTimeout(() => {
      if (inputEditProjectName) inputEditProjectName.focus();
    }, 100);
  }
}

function openEditProjectNameModalById(id) {
  const match = allProjects.find(p => p.id === id || p.wbs === id);
  if (match) {
    openEditProjectNameModal(match);
  }
}

function closeEditProjectNameModal() {
  if (editProjectNameModal) editProjectNameModal.classList.remove("show");
}

async function handleSaveProjectName() {
  if (!inputEditProjectName) return;
  const newName = inputEditProjectName.value.trim();
  const pid = inputEditProjectName.dataset.projectId;
  if (!newName) {
    showToast("กรุณาระบุชื่อโครงการ", "danger");
    return;
  }

  try {
    const res = await fetch("/api/projects/update-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pid, name: newName })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      showToast(data.error || "ไม่สามารถบันทึกชื่อโครงการได้", "danger");
      return;
    }

    // Update in allProjects
    const idx = allProjects.findIndex(p => p.id === pid);
    if (idx >= 0) {
      allProjects[idx].name = newName;
    }
    if (currentProject && currentProject.id === pid) {
      currentProject.name = newName;
      if (heroProjectName) heroProjectName.textContent = newName;
    }
    saveProjectsToCache(allProjects);
    populateProjectSelect();
    renderProjectsDirectory();

    closeEditProjectNameModal();
    showToast("บันทึกชื่อโครงการเรียบร้อยแล้ว!", "success");
  } catch (err) {
    console.error("Error updating project name:", err);
    // Offline fallback
    const idx = allProjects.findIndex(p => p.id === pid);
    if (idx >= 0) {
      allProjects[idx].name = newName;
    }
    if (currentProject && currentProject.id === pid) {
      currentProject.name = newName;
      if (heroProjectName) heroProjectName.textContent = newName;
    }
    saveProjectsToCache(allProjects);
    populateProjectSelect();
    renderProjectsDirectory();
    closeEditProjectNameModal();
    showToast("บันทึกชื่อโครงการเรียบร้อยแล้ว (แคชภายในระบบ)", "success");
  }
}

function showInvalidTemplateModal(errMsg, title = "ไฟล์นี้ไม่ใช่รายงานจากระบบ SAP หรือ Template ไม่ถูกต้อง") {
  const mainTitle = document.getElementById("invalidModalMainTitle");
  if (mainTitle) mainTitle.textContent = title;
  invalidModalErrorText.textContent = errMsg;
  invalidTemplateModal.classList.add("show");
}


// --------------------------------------------------------------------------
// Official Print & PDF Report Generator (กส.3) with Transfer Tables
// --------------------------------------------------------------------------
function restoreNativePrint() {
  try {
    if (window.print && window.print.toString().indexOf("[native code]") !== -1) {
      return;
    }
    delete window.print;
  } catch (e) {
    console.warn("restoreNativePrint:", e);
  }
}

function buildReportHtml(p) {
  if (!p) return "";

  const b = p.budget_summary || {};
  const m = p.materials_summary || {};
  const netSummary = p.networks_summary || {};
  const netRecs = netSummary.transfer_recommendations || [];
  const networks = p.networks || [];

  let totalTransferAmount = 0;
  netRecs.forEach(r => {
    totalTransferAmount += Number(r.amount || 0);
  });

  // Section 3: Transfer Recommendations
  let section3Html = "";
  if (netRecs.length > 0) {
    section3Html = `
      <div style="margin-bottom: 22px;" class="print-avoid-break">
        <h4 style="font-size: 11pt; margin: 15px 0 8px 0; border-bottom: 1.5px solid #475569; padding-bottom: 4px; color: #1e1b4b;">
          3. แผนการขออนุมัติปรับเปลี่ยน/โอนงบประมาณเพื่อแก้ไขยอดติดลบหน้างาน (ตามระเบียบ กฟภ.)
        </h4>
        <p style="font-size: 8.5pt; color: #475569; margin: 0 0 8px 0;">
          * การโอนงบประมาณดำเนินการระหว่างหมวดค่าใช้จ่ายหน้างาน 5 หมวดเท่านั้น ไม่กระทบวงเงินรวมโครงการ และยอดผู้โอนคงเหลือเป็นบวกเสมอ
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8.5pt;" border="1" bordercolor="#cbd5e1">
          <thead>
            <tr style="background: #f1f5f9; color: #0f172a;">
              <th style="padding: 5px; text-align: center; width: 8%;">ลำดับ</th>
              <th style="padding: 5px; width: 14%;">ประเภทการโอน</th>
              <th style="padding: 5px; width: 22%;">โอนออกจาก (ต้นทาง)</th>
              <th style="padding: 5px; width: 22%;">โอนเข้าสู่ (ปลายทาง)</th>
              <th style="padding: 5px; text-align: right; width: 16%;">จำนวนเงินที่โอน (฿)</th>
              <th style="padding: 5px; text-align: right; width: 18%;">คงเหลือผู้โอน (฿)</th>
            </tr>
          </thead>
          <tbody>
            ${netRecs.map((r, idx) => `
              <tr>
                <td style="padding: 4px; text-align: center; font-weight: bold;">ขาที่ ${idx + 1}</td>
                <td style="padding: 4px; font-weight: 600; color: ${r.type === 'intra_network' ? '#b45309' : '#6b21a8'};">
                  ${r.tag || (r.type === 'intra_network' ? 'โอนภายในโครงข่าย' : 'โอนข้ามโครงข่าย')}
                </td>
                <td style="padding: 4px;">
                  <strong>${r.donor_category}</strong><br>
                  <span style="font-size: 7.5pt; color: #64748b;">โครงข่าย ${r.donor_network} (${r.donor_desc || '-'})</span>
                </td>
                <td style="padding: 4px;">
                  <strong style="color: #047857;">${r.target_category}</strong><br>
                  <span style="font-size: 7.5pt; color: #64748b;">โครงข่าย ${r.target_network} (${r.target_desc || '-'})</span>
                </td>
                <td style="padding: 4px; text-align: right; font-weight: bold; color: #047857;">
                  +${formatMoney(r.amount)}
                </td>
                <td style="padding: 4px; text-align: right; font-weight: bold; color: #1e293b;">
                  ${formatMoney(r.donor_remaining !== undefined ? r.donor_remaining : 0)} ฿
                </td>
              </tr>
              <tr style="background: #faf5ff;">
                <td colspan="6" style="padding: 3px 8px; font-size: 7.5pt; color: #475569; border-bottom: 1px solid #cbd5e1;">
                  <strong>เหตุผลและความจำเป็น:</strong> ${r.reason}
                </td>
              </tr>
            `).join('')}
            <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #0f172a;">
              <td colspan="4" style="padding: 6px; text-align: right; font-size: 9pt;">
                รวมจำนวนเงินที่ขออนุมัติโอนงบประมาณทั้งสิ้น:
              </td>
              <td style="padding: 6px; text-align: right; color: #047857; font-size: 9.5pt;">
                +${formatMoney(totalTransferAmount)} บาท
              </td>
              <td style="padding: 6px; text-align: center; color: #047857; font-size: 8pt;">
                ✓ ผู้โอนไม่ติดลบ / งบดุลกัน
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  } else {
    section3Html = `
      <div style="margin-bottom: 18px;" class="print-avoid-break">
        <h4 style="font-size: 11pt; margin: 15px 0 8px 0; border-bottom: 1.5px solid #475569; padding-bottom: 4px; color: #1e1b4b;">
          3. แผนการขออนุมัติปรับเปลี่ยน/โอนงบประมาณเพื่อแก้ไขยอดติดลบหน้างาน
        </h4>
        <div style="padding: 8px 12px; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 4px; font-size: 9pt; color: #065f46;">
          ✓ ค่าใช้จ่ายหน้างานไม่มีหมวดติดลบ ไม่จำเป็นต้องทำรายการโอนงบประมาณ โครงการพร้อมปิดงานได้ทันที
        </div>
      </div>
    `;
  }

  // Section 4: Post-Transfer Summary per Network
  let section4RowsHtml = "";
  networks.forEach(net => {
    const netNo = String(net.network_no || "").trim();
    const friendlyDesc = getFriendlyNetworkDesc(netNo, net.description);
    const siteCats = net.site_categories || (net.categories || []).filter(c => c.group === "site");

    const netAdjustments = {};
    siteCats.forEach(c => netAdjustments[c.name] = 0);

    netRecs.forEach(r => {
      const dNo = String(r.donor_network || "").trim();
      const tNo = String(r.target_network || "").trim();
      const amt = Number(r.amount || 0);
      const dCat = r.donor_category || "";
      const tCat = r.target_category || "";

      if (dNo === netNo) {
        siteCats.forEach(c => {
          if (c.name.includes(dCat) || dCat.includes(c.name)) {
            netAdjustments[c.name] -= amt;
          }
        });
      }

      if (tNo === netNo) {
        siteCats.forEach(c => {
          if (c.name.includes(tCat) || tCat.includes(c.name)) {
            netAdjustments[c.name] += amt;
          }
        });
      }
    });

    let netTotalOrig = 0;
    let netTotalAdj = 0;
    let netTotalPost = 0;

    let catRows = "";
    siteCats.forEach((c, cIdx) => {
      const orig = Number(c.diff || 0);
      const adj = Number(netAdjustments[c.name] || 0);
      const post = orig + adj;
      const isOk = post >= 0;

      netTotalOrig += orig;
      netTotalAdj += adj;
      netTotalPost += post;

      let adjText = "-";
      if (adj > 0) adjText = `+${formatMoney(adj)}`;
      else if (adj < 0) adjText = `-${formatMoney(Math.abs(adj))}`;

      catRows += `
        <tr>
          ${cIdx === 0 ? `<td rowspan="${siteCats.length}" style="padding: 4px 6px; font-family: monospace; font-weight: bold; vertical-align: top; background: #fafafa;">${netNo}</td>` : ''}
          ${cIdx === 0 ? `<td rowspan="${siteCats.length}" style="padding: 4px 6px; vertical-align: top; background: #fafafa;"><strong>${friendlyDesc}</strong></td>` : ''}
          <td style="padding: 3px 6px;">${c.name}</td>
          <td style="padding: 3px 6px; text-align: right; color: ${orig < 0 ? '#b91c1c' : '#047857'}; font-weight: ${orig < 0 ? 'bold' : 'normal'};">
            ${orig < 0 ? '-' : '+'}${formatMoney(Math.abs(orig))}
          </td>
          <td style="padding: 3px 6px; text-align: center; color: ${adj > 0 ? '#047857' : (adj < 0 ? '#b91c1c' : '#64748b')}; font-weight: bold;">
            ${adjText}
          </td>
          <td style="padding: 3px 6px; text-align: right; font-weight: bold; color: ${isOk ? '#047857' : '#b91c1c'};">
            ${post < 0 ? '-' : '+'}${formatMoney(Math.abs(post))}
          </td>
          <td style="padding: 3px 6px; text-align: center; font-weight: 600; color: ${isOk ? '#047857' : '#b91c1c'}; font-size: 7.5pt;">
            ${isOk ? '✓ ยอดไม่ติดลบ' : '✗ ยังติดลบ'}
          </td>
        </tr>
      `;
    });

    let subAdjText = "-";
    if (netTotalAdj > 0) subAdjText = `+${formatMoney(netTotalAdj)}`;
    else if (netTotalAdj < 0) subAdjText = `-${formatMoney(Math.abs(netTotalAdj))}`;
    const netOk = netTotalPost >= 0;

    section4RowsHtml += `
      ${catRows}
      <tr style="background: #f1f5f9; font-weight: bold; border-top: 1px solid #94a3b8; border-bottom: 2px solid #64748b;">
        <td colspan="3" style="padding: 4px 6px; text-align: right; color: #1e1b4b; font-size: 8.5pt;">
          รวมค่าใช้จ่ายหน้างาน โครงข่าย ${netNo} (${friendlyDesc}):
        </td>
        <td style="padding: 4px 6px; text-align: right; color: ${netTotalOrig < 0 ? '#b91c1c' : '#047857'};">
          ${netTotalOrig < 0 ? '-' : '+'}${formatMoney(Math.abs(netTotalOrig))}
        </td>
        <td style="padding: 4px 6px; text-align: center; color: ${netTotalAdj > 0 ? '#047857' : (netTotalAdj < 0 ? '#b91c1c' : '#64748b')};">
          ${subAdjText}
        </td>
        <td style="padding: 4px 6px; text-align: right; color: ${netOk ? '#047857' : '#b91c1c'};">
          ${netTotalPost < 0 ? '-' : '+'}${formatMoney(Math.abs(netTotalPost))}
        </td>
        <td style="padding: 4px 6px; text-align: center; color: ${netOk ? '#047857' : '#b91c1c'}; font-size: 8pt;">
          ${netOk ? '✓ พร้อมปิดงาน' : '✗ ยังติดลบ'}
        </td>
      </tr>
    `;
  });

  return `
    <div style="font-family: 'Sarabun', 'Prompt', sans-serif; padding: 15px 20px; color: #0f172a; max-width: 100%;">
      
      <!-- PEA Official Header -->
      <div style="text-align: center; border-bottom: 2.5px solid #1e1b4b; padding-bottom: 8px; margin-bottom: 15px;">
        <div style="font-size: 9pt; font-weight: bold; letter-spacing: 1px; color: #581c87; margin-bottom: 3px;">
          การไฟฟ้าส่วนภูมิภาค • PROVINCIAL ELECTRICITY AUTHORITY
        </div>
        <h2 style="margin: 0; font-size: 15pt; color: #0f172a; font-weight: 700;">
          รายงานผลการตรวจสอบการปิดงานก่อสร้างระบบไฟฟ้า และแผนการโอนงบประมาณ (กส.3)
        </h2>
        <p style="margin: 4px 0 0 0; font-size: 9pt; color: #475569;">
          อ้างอิงข้อมูลจากระบบ SAP คีย์โค้ด: <strong>${p.template || 'ZPSR018 / ZBUDR018'}</strong> | วันที่จัดทำรายงาน: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <!-- Project Metadata Card -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 9pt; background: #f8fafc; border: 1px solid #cbd5e1;">
        <tr>
          <td style="padding: 5px 8px; width: 55%;">
            <strong>หมายเลขงาน (WBS):</strong> <span style="font-family: monospace; font-size: 9.5pt; color: #581c87; font-weight: bold;">${p.wbs || p.id}</span>
          </td>
          <td style="padding: 5px 8px; width: 45%;">
            <strong>วันที่พิมพ์รายงาน SAP:</strong> ${p.print_date || '-'}
          </td>
        </tr>
        <tr>
          <td style="padding: 5px 8px;">
            <strong>ชื่องานก่อสร้าง:</strong> ${p.name}
          </td>
          <td style="padding: 5px 8px;">
            <strong>แผนเดือนที่ต้องปิดงาน:</strong> ${p.target_month || '-'}
          </td>
        </tr>
        <tr>
          <td style="padding: 5px 8px;">
            <strong>ผู้ควบคุมงาน:</strong> ${p.officer} (รหัสพนักงาน: ${p.officer_id})
          </td>
          <td style="padding: 5px 8px;">
            <strong>สถานะความพร้อมปิดงาน:</strong> 
            <span style="font-weight: bold; color: #047857;">
              ${netRecs.length > 0 ? '✓ พร้อมปิดงาน (หลังอนุมัติโอนงบ)' : '✓ พร้อมปิดงาน (งบประมาณสมบูรณ์)'}
            </span>
          </td>
        </tr>
      </table>

      <!-- Section 1: Budget by 10 Categories -->
      <div style="margin-bottom: 15px;" class="print-avoid-break">
        <h4 style="font-size: 10.5pt; margin: 0 0 6px 0; border-bottom: 1.5px solid #475569; padding-bottom: 3px; color: #1e1b4b;">
          1. สรุปสถานะงบประมาณรายหมวดในระบบ SAP (10 หมวดค่าใช้จ่าย)
        </h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8.5pt;" border="1" bordercolor="#cbd5e1">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 4px 6px; text-align: left; width: 35%;">หมวดค่าใช้จ่าย</th>
              <th style="padding: 4px 6px; text-align: center; width: 20%;">กลุ่มค่าใช้จ่าย</th>
              <th style="padding: 4px 6px; text-align: right; width: 22%;">ค่าใช้จ่ายจริง (บาท)</th>
              <th style="padding: 4px 6px; text-align: right; width: 23%;">ผลต่างงบประมาณเดิม</th>
            </tr>
          </thead>
          <tbody>
            ${(b.categories || []).map(c => `
              <tr>
                <td style="padding: 3px 6px;">${c.name}</td>
                <td style="padding: 3px 6px; text-align: center; font-size: 7.5pt; color: #64748b;">${c.group_name || '-'}</td>
                <td style="padding: 3px 6px; text-align: right;">${formatMoney(c.actual)}</td>
                <td style="padding: 3px 6px; text-align: right; font-weight: ${c.diff < 0 ? 'bold' : 'normal'}; color: ${c.diff < 0 ? '#b91c1c' : '#047857'};">
                  ${c.diff < 0 ? '-' : '+'}${formatMoney(Math.abs(c.diff))}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section 2: SAP Network Overview -->
      <div style="margin-bottom: 15px;" class="print-avoid-break">
        <h4 style="font-size: 10.5pt; margin: 10px 0 6px 0; border-bottom: 1.5px solid #475569; padding-bottom: 3px; color: #1e1b4b;">
          2. สรุปสถานะการเงินจำแนกตามเลขที่โครงข่าย (SAP Network Overview)
        </h4>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 8.5pt;" border="1" bordercolor="#cbd5e1">
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 4px; text-align: center; width: 6%;">ลำดับ</th>
              <th style="padding: 4px; width: 14%;">เลขที่โครงข่าย</th>
              <th style="padding: 4px; width: 28%;">รายการโครงข่าย / แผนก</th>
              <th style="padding: 4px; text-align: right; width: 18%;">ประมาณการรวม (฿)</th>
              <th style="padding: 4px; text-align: right; width: 18%;">ใช้จริงรวม (฿)</th>
              <th style="padding: 4px; text-align: right; width: 16%;">ผลต่างเดิมสุทธิ</th>
            </tr>
          </thead>
          <tbody>
            ${networks.map(n => `
              <tr>
                <td style="padding: 3px 4px; text-align: center;">${n.seq}</td>
                <td style="padding: 3px 4px; font-family: monospace; font-weight: bold;">${n.network_no}</td>
                <td style="padding: 3px 4px;">${n.description}</td>
                <td style="padding: 3px 4px; text-align: right;">${formatMoney(n.total_estimate)}</td>
                <td style="padding: 3px 4px; text-align: right;">${formatMoney(n.total_actual)}</td>
                <td style="padding: 3px 4px; text-align: right; font-weight: bold; color: ${n.total_diff < 0 ? '#b91c1c' : '#047857'};">
                  ${n.total_diff < 0 ? '-' : '+'}${formatMoney(Math.abs(n.total_diff))}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Section 3: Budget Transfer Recommendations -->
      ${section3Html}

      <!-- Section 4: Post-Transfer Summary per Network -->
      <div style="margin-bottom: 20px;" class="print-avoid-break">
        <h4 style="font-size: 11pt; margin: 15px 0 8px 0; border-bottom: 1.5px solid #475569; padding-bottom: 4px; color: #1e1b4b;">
          4. ตารางสรุปยอดค่าใช้จ่ายหน้างานหลังการจำลองโอนงบประมาณ (แยกตามเลขที่โครงข่าย)
        </h4>
        <p style="font-size: 8.5pt; color: #475569; margin: 0 0 8px 0;">
          * แสดงรายการค่าใช้จ่ายหน้างาน 5 หมวดที่ควบคุมงบประมาณ พร้อมยอดปรับปรุงหลังการโอนและสถานะพร้อมปิดงาน
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 8pt;" border="1" bordercolor="#cbd5e1">
          <thead>
            <tr style="background: #e2e8f0; color: #0f172a;">
              <th style="padding: 5px; width: 14%;">เลขที่โครงข่าย</th>
              <th style="padding: 5px; width: 18%;">รายการ / แผนก</th>
              <th style="padding: 5px; width: 22%;">หมวดค่าใช้จ่ายหน้างาน</th>
              <th style="padding: 5px; text-align: right; width: 14%;">ผลต่างเดิม (฿)</th>
              <th style="padding: 5px; text-align: center; width: 12%;">ปรับโอนงบ (฿)</th>
              <th style="padding: 5px; text-align: right; width: 14%;">คงเหลือหลังโอน (฿)</th>
              <th style="padding: 5px; text-align: center; width: 10%;">สถานะหลังโอน</th>
            </tr>
          </thead>
          <tbody>
            ${section4RowsHtml}
          </tbody>
        </table>
      </div>

    </div>
  `;
}

function openReportPreviewModal() {
  if (!currentProject) {
    alert("กรุณาเลือกโครงการก่อน");
    return;
  }
  const modal = document.getElementById("reportPreviewModal");
  const paper = document.getElementById("reportPreviewPaper");
  const printDiv = document.getElementById("printArea");
  if (!modal || !paper) return;

  const html = buildReportHtml(currentProject);
  paper.innerHTML = html;
  if (printDiv) printDiv.innerHTML = html;

  modal.classList.add("show");
  const modalBody = modal.querySelector(".modal-body");
  if (modalBody) modalBody.scrollTop = 0;
}

function printReport() {
  restoreNativePrint();
  if (currentProject) {
    const printDiv = document.getElementById("printArea");
    if (printDiv) {
      printDiv.innerHTML = buildReportHtml(currentProject);
    }
  }
  try {
    window.print();
  } catch (e) {
    console.error("Print failed:", e);
    showToast("กรุณากดแป้นพิมพ์ Ctrl + P เพื่อสั่งพิมพ์", "warning");
  }
}

function generatePrintReport() {
  openReportPreviewModal();
}



// --------------------------------------------------------------------------
// Excel Export Helpers (CSV format with BOM for Thai support)
// --------------------------------------------------------------------------
function exportBudgetToExcel() {
  if (!currentProject) return;
  const cats = currentProject.budget_summary.categories || [];
  let csv = "\uFEFFรหัส,หมวดค่าใช้จ่าย,กลุ่ม,ประมาณการ(บาท),ค่าใช้จ่ายจริง(บาท),ผลต่างงบประมาณ(บาท),สถานะ\n";
  cats.forEach(c => {
    csv += `"${(c.id || '').toUpperCase()}","${c.name}","${c.group_name || ''}",${c.estimate || 0},${c.actual},${c.diff},"${c.diff < 0 ? 'ติดลบ' : 'คงเหลือ'}"\n`;
  });
  downloadCsv(csv, `PEA_Budget_${currentProject.wbs || currentProject.id}.csv`);
}

function exportMaterialsToExcel() {
  if (!currentProject) return;
  const mats = currentProject.materials_summary.all_items || [];
  let csv = "\uFEFFหน้า,รหัสพัสดุ,รายการ,หน่วย,ประมาณการ,เบิกจริง,ส่งคืน,ติดตั้งจริง,ค่าพัสดุเบิก(บาท),สถานะ\n";
  mats.forEach(m => {
    csv += `${m.page},"${m.code}","${m.desc.replace(/"/g, '""')}","${m.unit}",${m.estimated},${m.withdrawn},${m.returned},${m.installed},${m.withdrawn_cost},"${m.status}"\n`;
  });
  downloadCsv(csv, `PEA_Materials_${currentProject.wbs || currentProject.id}.csv`);
}

function downloadCsv(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --------------------------------------------------------------------------
// Utility Functions
// --------------------------------------------------------------------------
function formatMoney(amount) {
  if (isNaN(amount) || amount === null) return "0.00";
  return Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.backgroundColor = type === "success" ? "#10b981" : "#5e1784";
  toast.style.color = "#ffffff";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  toast.style.fontFamily = "'Prompt', sans-serif";
  toast.style.fontSize = "0.9rem";
  toast.style.zIndex = "9999";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "8px";
  toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.4s";
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
