// Client Application Logic for Survey Application (Full-Screen Admin Workspace & Executive Dashboard)
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const btnThemeToggle = document.getElementById("btnThemeToggle");
  const btnAdminThemeToggle = document.getElementById("btnAdminThemeToggle");

  const selectMall = document.getElementById("selectMall");
  const selectRegion = document.getElementById("selectRegion");
  const selectStore = document.getElementById("selectStore");
  const inputUserName = document.getElementById("inputUserName");
  const inputUserPhone = document.getElementById("inputUserPhone");
  const btnStartSurvey = document.getElementById("btnStartSurvey");

  const viewLanding = document.getElementById("viewLanding");
  const viewSurvey = document.getElementById("viewSurvey");
  const lblBadgeStoreName = document.getElementById("lblBadgeStoreName");
  const lblBadgeStoreDetail = document.getElementById("lblBadgeStoreDetail");
  const lblBadgeUserInfo = document.getElementById("lblBadgeUserInfo");
  const lblBadgeSurveyStatus = document.getElementById("lblBadgeSurveyStatus");
  const btnBackToStores = document.getElementById("btnBackToStores");

  const matrixHeaderRow = document.getElementById("matrixHeaderRow");
  const matrixBody = document.getElementById("matrixBody");
  const matrixFooter = document.getElementById("matrixFooter");
  const btnSaveSurvey = document.getElementById("btnSaveSurvey");
  const btnClearMatrix = document.getElementById("btnClearMatrix");

  // Admin Fullscreen Workspace Elements
  const btnAdminTrigger = document.getElementById("btnAdminTrigger");
  const viewAdmin = document.getElementById("viewAdmin");
  const btnAdminLogout = document.getElementById("btnAdminLogout");
  const adminAuthSection = document.getElementById("adminAuthSection");
  const adminDashboardSection = document.getElementById("adminDashboardSection");
  const inputAdminPassword = document.getElementById("inputAdminPassword");
  const btnAdminLogin = document.getElementById("btnAdminLogin");

  // Executive Dashboard Elements
  const statTotalSurveys = document.getElementById("statTotalSurveys");
  const statStoreRatio = document.getElementById("statStoreRatio");
  const statTotalPC = document.getElementById("statTotalPC");
  const statActiveRegions = document.getElementById("statActiveRegions");
  const statActiveBrands = document.getElementById("statActiveBrands");

  const filterAdminRegion = document.getElementById("filterAdminRegion");
  const filterAdminStore = document.getElementById("filterAdminStore");
  const filterAdminBrand = document.getElementById("filterAdminBrand");
  const btnAdminSearch = document.getElementById("btnAdminSearch");
  const btnAdminExportCSV = document.getElementById("btnAdminExportCSV");
  const btnAdminClearSurveys = document.getElementById("btnAdminClearSurveys");
  const tblAdminSurveysBody = document.getElementById("tblAdminSurveysBody");

  const selectDimType = document.getElementById("selectDimType");
  const tblAdminDimensionsBody = document.getElementById("tblAdminDimensionsBody");

  const fileStoreCSV = document.getElementById("fileStoreCSV");
  const btnImportStores = document.getElementById("btnImportStores");
  const fileBrandCSV = document.getElementById("fileBrandCSV");
  const btnImportBrands = document.getElementById("btnImportBrands");
  const fileAnswerCSV = document.getElementById("fileAnswerCSV");
  const btnImportAnswers = document.getElementById("btnImportAnswers");
  const btnResetDimensions = document.getElementById("btnResetDimensions");

  const spinnerOverlay = document.getElementById("spinnerOverlay");
  const toastContainer = document.getElementById("toastContainer");

  // --- Chart Instances ---
  let chartBrandInstance = null;
  let chartChoiceInstance = null;
  let chartRegionInstance = null;

  // --- State Variables ---
  let allStores = [];
  let allBrands = [];
  let allAnswerChoices = [];
  let allAdminStores = [];
  let allAdminBrands = [];
  let allAdminAnswerChoices = [];
  let currentSelectedStore = null;

  // --- Theme Toggle Logic ---
  let currentTheme = localStorage.getItem("haier-survey-theme") || "light";
  applyTheme(currentTheme);

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("haier-survey-theme", theme);
    const btnText = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
    if (btnThemeToggle) btnThemeToggle.innerHTML = btnText;
    if (btnAdminThemeToggle) btnAdminThemeToggle.innerHTML = btnText;
  }

  function handleThemeToggleClick() {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    showToast(`สลับใช้งาน ${nextTheme === "dark" ? "โหมดมืด (Dark Mode)" : "โหมดสว่าง (Light Mode)"}`, "info");
  }

  if (btnThemeToggle) btnThemeToggle.addEventListener("click", handleThemeToggleClick);
  if (btnAdminThemeToggle) btnAdminThemeToggle.addEventListener("click", handleThemeToggleClick);

  // --- Utility Functions ---
  function showSpinner(show = true) {
    if (show) spinnerOverlay.classList.add("active");
    else spinnerOverlay.classList.remove("active");
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.4s ease";
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  // --- Initial Data Loading ---
  async function loadDimensions() {
    showSpinner(true);
    try {
      const res = await fetch("/api/dimensions");
      if (!res.ok) throw new Error("Failed to load dimensions");
      const data = await res.json();

      allStores = data.stores || [];
      allBrands = data.brands || [];
      allAnswerChoices = data.answerChoices || [];

      populateMallDropdown();
      populateAdminFilters();
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  }

  // --- Cascading Dropdown Logic (Order: 1. ห้าง -> 2. ภูมิภาค -> 3. สาขา) ---
  function populateMallDropdown() {
    selectMall.innerHTML = '<option value="">-- กรุณาเลือกห้าง/ช่องทาง --</option>';
    selectRegion.innerHTML = '<option value="">-- กรุณาเลือกภูมิภาค --</option>';
    selectStore.innerHTML = '<option value="">-- กรุณาเลือกสาขา --</option>';
    selectRegion.disabled = true;
    selectStore.disabled = true;
    btnStartSurvey.disabled = true;

    const malls = Array.from(new Set(allStores.map((s) => s.mall))).sort();
    malls.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      selectMall.appendChild(opt);
    });
  }

  selectMall.addEventListener("change", () => {
    const selectedMall = selectMall.value;
    selectRegion.innerHTML = '<option value="">-- กรุณาเลือกภูมิภาค --</option>';
    selectStore.innerHTML = '<option value="">-- กรุณาเลือกสาขา --</option>';
    selectStore.disabled = true;
    btnStartSurvey.disabled = true;

    if (!selectedMall) {
      selectRegion.disabled = true;
      return;
    }

    const filteredStores = allStores.filter((s) => s.mall === selectedMall);
    const regions = Array.from(new Set(filteredStores.map((s) => s.region))).sort();

    regions.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      selectRegion.appendChild(opt);
    });
    selectRegion.disabled = false;
  });

  selectRegion.addEventListener("change", () => {
    const selectedMall = selectMall.value;
    const selectedRegion = selectRegion.value;

    selectStore.innerHTML = '<option value="">-- กรุณาเลือกสาขา --</option>';
    btnStartSurvey.disabled = true;

    if (!selectedMall || !selectedRegion) {
      selectStore.disabled = true;
      return;
    }

    const filteredStores = allStores.filter(
      (s) => s.mall === selectedMall && s.region === selectedRegion
    );

    filteredStores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id.toString();
      opt.textContent = `${s.store_name} (${s.province})`;
      selectStore.appendChild(opt);
    });
    selectStore.disabled = false;
  });

  selectStore.addEventListener("change", checkStartSurveyState);
  inputUserName.addEventListener("input", checkStartSurveyState);
  inputUserPhone.addEventListener("input", checkStartSurveyState);

  function checkStartSurveyState() {
    const storeId = parseInt(selectStore.value, 10);
    currentSelectedStore = allStores.find((s) => s.id === storeId) || null;
    const hasName = inputUserName.value.trim().length > 0;
    const hasPhone = inputUserPhone.value.trim().length > 0;

    btnStartSurvey.disabled = !(currentSelectedStore && hasName && hasPhone);
  }

  // --- Start Survey & Render Matrix ---
  btnStartSurvey.addEventListener("click", async () => {
    if (!currentSelectedStore) return;
    const userName = inputUserName.value.trim();
    const userPhone = inputUserPhone.value.trim();

    if (!userName || !userPhone) {
      showToast("กรุณาระบุชื่อผู้กรอกและเบอร์โทรศัพท์ก่อนเริ่มทำแบบสำรวจ", "warning");
      return;
    }

    lblBadgeStoreName.textContent = `สาขา: ${currentSelectedStore.store_name}`;
    lblBadgeStoreDetail.textContent = `ห้าง: ${currentSelectedStore.mall} | ภูมิภาค: ${currentSelectedStore.region} | จังหวัด: ${currentSelectedStore.province}`;
    lblBadgeUserInfo.textContent = `ผู้กรอก: ${userName} (โทร: ${userPhone})`;
    lblBadgeSurveyStatus.textContent = "กำลังโหลดข้อมูล...";

    renderMatrixGrid();

    // Check if store already has existing survey
    showSpinner(true);
    try {
      const res = await fetch(`/api/survey/${currentSelectedStore.id}`);
      const data = await res.json();

      if (data.exists) {
        const lastUpdateStr = new Date(data.header.last_update).toLocaleString("th-TH");
        lblBadgeSurveyStatus.textContent = `⚠️ พบข้อมูลเดิม (บันทึกข้ามนับล่าสุดโดย ${data.header.user || 'user'} เมื่อ ${lastUpdateStr})`;
        showToast("พบข้อมูลแบบสำรวจเดิม โหลดข้อมูลเพื่อทำการแก้ไขแล้ว", "warning");

        if (Array.isArray(data.details)) {
          data.details.forEach((d) => {
            const input = document.querySelector(
              `input[data-brand-id="${d.brand_id}"][data-choice-id="${d.answer_choice_id}"]`
            );
            if (input) {
              input.value = d.value.toString();
            }
          });
          calculateMatrixTotals();
        }
      } else {
        lblBadgeSurveyStatus.textContent = "✨ ยังไม่มีข้อมูลสำหรับสาขานี้ (สร้างใหม่)";
        showToast("ยังไม่มีข้อมูลสำรวจของสาขานี้ พร้อมสำหรับการกรอกข้อมูลใหม่", "info");
      }

      viewLanding.style.display = "none";
      viewSurvey.style.display = "block";
    } catch (err) {
      showToast("ไม่สามารถดึงข้อมูลสำรวจได้: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  btnBackToStores.addEventListener("click", () => {
    resetToLandingPage();
  });

  function resetToLandingPage() {
    viewSurvey.style.display = "none";
    viewLanding.style.display = "block";
    selectMall.value = "";
    selectRegion.innerHTML = '<option value="">-- กรุณาเลือกภูมิภาค --</option>';
    selectRegion.disabled = true;
    selectStore.innerHTML = '<option value="">-- กรุณาเลือกสาขา --</option>';
    selectStore.disabled = true;
    currentSelectedStore = null;
    btnStartSurvey.disabled = true;
  }

  // --- Matrix Grid Render & Calculation ---
  function renderMatrixGrid() {
    matrixHeaderRow.innerHTML = "<th>แบรนด์ (Brand)</th>";
    allAnswerChoices.forEach((choice) => {
      const th = document.createElement("th");
      th.textContent = choice.name;
      matrixHeaderRow.appendChild(th);
    });
    const thTotal = document.createElement("th");
    thTotal.textContent = "รวม (Total)";
    matrixHeaderRow.appendChild(thTotal);

    matrixBody.innerHTML = "";
    allBrands.forEach((brand) => {
      const tr = document.createElement("tr");

      const tdBrand = document.createElement("td");
      tdBrand.textContent = brand.name;
      tr.appendChild(tdBrand);

      allAnswerChoices.forEach((choice) => {
        const td = document.createElement("td");
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.step = "1";
        input.value = "0";
        input.className = "cell-input";
        input.dataset.brandId = brand.id.toString();
        input.dataset.choiceId = choice.id.toString();

        input.addEventListener("input", () => {
          if (parseInt(input.value) < 0 || isNaN(parseInt(input.value))) {
            input.value = "0";
          }
          calculateMatrixTotals();
        });

        td.appendChild(input);
        tr.appendChild(td);
      });

      const tdRowTotal = document.createElement("td");
      tdRowTotal.className = "row-total";
      tdRowTotal.dataset.brandTotalId = brand.id.toString();
      tdRowTotal.textContent = "0";
      tr.appendChild(tdRowTotal);

      matrixBody.appendChild(tr);
    });

    matrixFooter.innerHTML = "";
    const trFoot = document.createElement("tr");
    const tdFootLabel = document.createElement("td");
    tdFootLabel.textContent = "รวมทั้งหมด (Total)";
    tdFootLabel.style.fontWeight = "bold";
    trFoot.appendChild(tdFootLabel);

    allAnswerChoices.forEach((choice) => {
      const tdColTotal = document.createElement("td");
      tdColTotal.className = "col-total";
      tdColTotal.dataset.choiceTotalId = choice.id.toString();
      tdColTotal.textContent = "0";
      trFoot.appendChild(tdColTotal);
    });

    const tdGrandTotal = document.createElement("td");
    tdGrandTotal.className = "grand-total";
    tdGrandTotal.id = "lblGrandTotal";
    tdGrandTotal.textContent = "0";
    trFoot.appendChild(tdGrandTotal);

    matrixFooter.appendChild(trFoot);

    calculateMatrixTotals();
  }

  function calculateMatrixTotals() {
    let grandTotal = 0;

    allBrands.forEach((brand) => {
      let rowSum = 0;
      const inputs = document.querySelectorAll(
        `input[data-brand-id="${brand.id}"]`
      );
      inputs.forEach((input) => {
        const val = parseInt(input.value, 10) || 0;
        rowSum += val;
      });
      const lblRowTotal = document.querySelector(
        `td[data-brand-total-id="${brand.id}"]`
      );
      if (lblRowTotal) lblRowTotal.textContent = rowSum.toString();
    });

    allAnswerChoices.forEach((choice) => {
      let colSum = 0;
      const inputs = document.querySelectorAll(
        `input[data-choice-id="${choice.id}"]`
      );
      inputs.forEach((input) => {
        const val = parseInt(input.value, 10) || 0;
        colSum += val;
      });
      const lblColTotal = document.querySelector(
        `td[data-choice-total-id="${choice.id}"]`
      );
      if (lblColTotal) lblColTotal.textContent = colSum.toString();
      grandTotal += colSum;
    });

    const lblGrandTotal = document.getElementById("lblGrandTotal");
    if (lblGrandTotal) lblGrandTotal.textContent = grandTotal.toString();
  }

  btnClearMatrix.addEventListener("click", () => {
    const inputs = document.querySelectorAll(".cell-input");
    inputs.forEach((input) => (input.value = "0"));
    calculateMatrixTotals();
    showToast("รีเซ็ตตัวเลขทั้งหมดเป็น 0 เรียบร้อย", "info");
  });

  // --- Save Survey ---
  btnSaveSurvey.addEventListener("click", async () => {
    if (!currentSelectedStore) return;

    const userName = inputUserName.value.trim();
    const userPhone = inputUserPhone.value.trim();

    if (!userName || !userPhone) {
      showToast("กรุณาระบุชื่อผู้กรอกและเบอร์โทรศัพท์", "warning");
      return;
    }

    const details = [];
    const inputs = document.querySelectorAll(".cell-input");

    inputs.forEach((input) => {
      const brandId = parseInt(input.dataset.brandId || "0", 10);
      const choiceId = parseInt(input.dataset.choiceId || "0", 10);
      const val = parseInt(input.value, 10) || 0;

      details.push({ brandId, answerChoiceId: choiceId, value: val });
    });

    showSpinner(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentSelectedStore.id,
          user: userName,
          phone: userPhone,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save survey");
      }

      showToast("🎉 บันทึกข้อมูลแบบสำรวจสำเร็จเรียบร้อย! ระบบนำท่านกลับสู่หน้าแรก", "success");
      resetToLandingPage();

    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึก: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  // --- Full-Screen Admin Workspace Actions ---
  btnAdminTrigger.addEventListener("click", () => {
    viewAdmin.style.display = "flex";
  });

  btnAdminLogout.addEventListener("click", () => {
    viewAdmin.style.display = "none";
    adminDashboardSection.style.display = "none";
    adminAuthSection.style.display = "block";
    inputAdminPassword.value = "";
  });

  btnAdminLogin.addEventListener("click", async () => {
    const pass = inputAdminPassword.value;
    if (!pass) return;

    showSpinner(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        adminAuthSection.style.display = "none";
        adminDashboardSection.style.display = "block";
        showToast("เข้าสู่ระบบ Admin สำเร็จ", "success");
        
        // Ensure default active tab is Executive Dashboard (tabExecutiveStats)
        activateTab("tabExecutiveStats");

        loadExecutiveDashboardStats();
        loadAdminSurveys();
        loadAdminDimensions();
      } else {
        showToast("รหัสผ่านไม่ถูกต้อง", "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  // Admin Tab Switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      if (targetTab) activateTab(targetTab);
    });
  });

  function activateTab(tabId) {
    tabBtns.forEach((b) => {
      if (b.getAttribute("data-tab") === tabId) b.classList.add("active");
      else b.classList.remove("active");
    });

    document.querySelectorAll(".tab-content").forEach((tc) => tc.classList.remove("active"));
    const activeContent = document.getElementById(tabId);
    if (activeContent) activeContent.classList.add("active");

    if (tabId === "tabExecutiveStats") {
      loadExecutiveDashboardStats();
    }
  }

  // --- Executive Dashboard Stats & Visual Charts ---
  async function loadExecutiveDashboardStats() {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) return;
      const data = await res.json();

      statTotalSurveys.textContent = `${data.totalSurveys || 0} สาขา`;
      const ratio = (((data.totalSurveys || 0) / (data.totalStores || 1058)) * 100).toFixed(1);
      statStoreRatio.textContent = `จากทั้งหมด ${data.totalStores || 1058} สาขา (${ratio}%)`;

      statTotalPC.textContent = `${data.totalPC || 0} คน`;

      const activeRegionsCount = (data.byRegion || []).filter((r) => r.total_pc > 0 || r.survey_count > 0).length;
      statActiveRegions.textContent = `${activeRegionsCount} ภูมิภาค`;

      const activeBrandsCount = (data.byBrand || []).filter((b) => b.total_pc > 0).length;
      statActiveBrands.textContent = `${activeBrandsCount} แบรนด์`;

      renderBrandDistributionChart(data.byBrand || []);
      renderChoiceDistributionChart(data.byChoice || []);
      renderRegionDistributionChart(data.byRegion || []);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    }
  }

  function renderBrandDistributionChart(brandsData) {
    const ctx = document.getElementById("chartBrandDistribution")?.getContext("2d");
    if (!ctx) return;

    if (chartBrandInstance) chartBrandInstance.destroy();

    const labels = brandsData.map((b) => b.name);
    const values = brandsData.map((b) => b.total_pc);

    chartBrandInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "จำนวน PC (คน)",
            data: values,
            backgroundColor: "#005AAA",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });
  }

  function renderChoiceDistributionChart(choicesData) {
    const ctx = document.getElementById("chartChoiceDistribution")?.getContext("2d");
    if (!ctx) return;

    if (chartChoiceInstance) chartChoiceInstance.destroy();

    const labels = choicesData.map((c) => c.name);
    const values = choicesData.map((c) => c.total_pc);

    chartChoiceInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: ["#005AAA", "#00A4E4", "#0284c7", "#38bdf8", "#7dd3fc"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom" },
        },
      },
    });
  }

  function renderRegionDistributionChart(regionsData) {
    const ctx = document.getElementById("chartRegionDistribution")?.getContext("2d");
    if (!ctx) return;

    if (chartRegionInstance) chartRegionInstance.destroy();

    const labels = regionsData.map((r) => r.region);
    const pcValues = regionsData.map((r) => r.total_pc);
    const surveyValues = regionsData.map((r) => r.survey_count);

    chartRegionInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "จำนวน PC รวม (คน)",
            data: pcValues,
            backgroundColor: "#005AAA",
            borderRadius: 6,
          },
          {
            label: "จำนวนสาขาที่สำรวจแล้ว (สาขา)",
            data: surveyValues,
            backgroundColor: "#00A4E4",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    });
  }

  function populateAdminFilters() {
    filterAdminRegion.innerHTML = '<option value="">-- ทุกภูมิภาค --</option>';
    filterAdminStore.innerHTML = '<option value="">-- ทุกสาขา --</option>';
    filterAdminBrand.innerHTML = '<option value="">-- ทุกแบรนด์ --</option>';

    const regions = Array.from(new Set(allStores.map((s) => s.region))).sort();
    regions.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      filterAdminRegion.appendChild(opt);
    });

    allStores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id.toString();
      opt.textContent = `${s.store_name} (${s.mall})`;
      filterAdminStore.appendChild(opt);
    });

    allBrands.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b.id.toString();
      opt.textContent = b.name;
      filterAdminBrand.appendChild(opt);
    });
  }

  async function loadAdminSurveys() {
    showSpinner(true);
    try {
      const region = filterAdminRegion.value;
      const storeId = filterAdminStore.value;
      const brandId = filterAdminBrand.value;

      const params = new URLSearchParams();
      if (region) params.append("region", region);
      if (storeId) params.append("storeId", storeId);
      if (brandId) params.append("brandId", brandId);

      const res = await fetch(`/api/admin/surveys?${params.toString()}`);
      const data = await res.json();

      tblAdminSurveysBody.innerHTML = "";
      if (!data.results || data.results.length === 0) {
        tblAdminSurveysBody.innerHTML =
          '<tr><td colspan="11" style="text-align: center; color: var(--text-muted);">ไม่พบข้อมูลแบบสำรวจตามเงื่อนไขที่เลือก</td></tr>';
        return;
      }

      data.results.forEach((row) => {
        const tr = document.createElement("tr");
        const lastUpdateStr = row.last_update
          ? new Date(row.last_update).toLocaleString("th-TH")
          : "-";

        tr.innerHTML = `
          <td>${row.survey_id || "-"}</td>
          <td style="font-weight:600; color:var(--primary);">${row.store_id || "-"}</td>
          <td style="font-weight:600;">${row.store_name || "-"}</td>
          <td>${row.mall || "-"}</td>
          <td>${row.region || "-"}</td>
          <td>${row.user || "user"}</td>
          <td>${row.phone || "-"}</td>
          <td>${lastUpdateStr}</td>
          <td style="font-weight: bold; color: var(--primary); text-align: center;">${row.total_pc ?? 0} คน</td>
          <td style="font-size: 0.8rem; color: var(--text-main);">${row.summary || '<span style="color:var(--text-muted)">ไม่มีพนักงาน PC</span>'}</td>
          <td>
            <button class="btn btn-danger btn-delete-survey" data-survey-id="${row.survey_id}" style="padding: 4px 8px; font-size: 0.75rem;">
              🗑️ ลบ
            </button>
          </td>
        `;
        tblAdminSurveysBody.appendChild(tr);
      });

      document.querySelectorAll(".btn-delete-survey").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const sId = btn.getAttribute("data-survey-id");
          if (!sId || !confirm(`คุณต้องการลบข้อมูลแบบสำรวจ ID: ${sId} หรือไม่?`)) return;

          showSpinner(true);
          try {
            const delRes = await fetch(`/api/admin/survey/${sId}`, { method: "DELETE" });
            const delData = await delRes.json();
            if (delRes.ok && delData.success) {
              showToast("ลบข้อมูลแบบสำรวจเรียบร้อย", "success");
              loadExecutiveDashboardStats();
              loadAdminSurveys();
            } else {
              showToast("ลบไม่สำเร็จ: " + delData.error, "error");
            }
          } catch (e) {
            showToast("เกิดข้อผิดพลาด: " + e.message, "error");
          } finally {
            showSpinner(false);
          }
        });
      });
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการโหลดผลสำรวจ: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  }

  async function loadAdminDimensions() {
    showSpinner(true);
    try {
      const res = await fetch("/api/dimensions?includeInactive=true");
      const data = await res.json();

      allAdminStores = data.stores || [];
      allAdminBrands = data.brands || [];
      allAdminAnswerChoices = data.answerChoices || [];

      renderAdminDimensionsTable();
    } catch (err) {
      showToast("ไม่สามารถโหลดมิติข้อมูลแอดมินได้: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  }

  selectDimType.addEventListener("change", renderAdminDimensionsTable);

  function renderAdminDimensionsTable() {
    const dimType = selectDimType.value;
    tblAdminDimensionsBody.innerHTML = "";

    let items = [];
    if (dimType === "stores") items = allAdminStores;
    if (dimType === "brands") items = allAdminBrands;
    if (dimType === "answerChoices") items = allAdminAnswerChoices;

    if (items.length === 0) {
      tblAdminDimensionsBody.innerHTML =
        '<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">ไม่มีรายการมิติข้อมูล</td></tr>';
      return;
    }

    items.forEach((item) => {
      const tr = document.createElement("tr");
      const isActive = item.is_active === 1;

      let detailText = item.name || item.store_name;
      if (dimType === "stores") {
        detailText = `${item.store_name} (ห้าง: ${item.mall} | ภูมิภาค: ${item.region} | จังหวัด: ${item.province})`;
      }

      const statusBadge = isActive
        ? '<span style="color: #0284c7; background: var(--badge-bg); padding: 4px 10px; border-radius: 12px; font-weight:600;">Active (เปิดใช้งาน)</span>'
        : '<span style="color: #ef4444; background: rgba(239,68,68,0.15); padding: 4px 10px; border-radius: 12px; font-weight:600;">Inactive (ปิดใช้งาน)</span>';

      const toggleBtnText = isActive ? "🔴 ปิดใช้งาน (Disable)" : "🟢 เปิดใช้งาน (Enable)";
      const toggleBtnClass = isActive ? "btn-danger" : "btn-accent";

      tr.innerHTML = `
        <td>${item.id}</td>
        <td>${detailText}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn ${toggleBtnClass} btn-toggle-dim" data-dim="${dimType}" data-id="${item.id}" data-active="${isActive ? 'true' : 'false'}" style="padding: 6px 12px; font-size: 0.8rem;">
            ${toggleBtnText}
          </button>
        </td>
      `;

      tblAdminDimensionsBody.appendChild(tr);
    });

    document.querySelectorAll(".btn-toggle-dim").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const dim = btn.getAttribute("data-dim");
        const id = parseInt(btn.getAttribute("data-id") || "0", 10);
        const currentActive = btn.getAttribute("data-active") === "true";
        const newActive = !currentActive;

        showSpinner(true);
        try {
          const res = await fetch("/api/admin/dimension/toggle", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dimension: dim, id, isActive: newActive }),
          });

          const data = await res.json();
          if (res.ok && data.success) {
            showToast(`อัปเดตสถานะ Active/Inactive สำเร็จ`, "success");
            loadDimensions();
            loadAdminDimensions();
          } else {
            showToast("อัปเดตไม่สำเร็จ: " + data.error, "error");
          }
        } catch (err) {
          showToast("เกิดข้อผิดพลาด: " + err.message, "error");
        } finally {
          showSpinner(false);
        }
      });
    });
  }

  btnAdminSearch.addEventListener("click", loadAdminSurveys);

  btnAdminExportCSV.addEventListener("click", () => {
    window.open("/api/admin/export", "_blank");
  });

  btnAdminClearSurveys.addEventListener("click", async () => {
    if (!confirm("⚠️ คำเตือน: คุณต้องการล้างข้อมูลแบบสำรวจทั้งหมดในระบบใช่หรือไม่?")) return;

    showSpinner(true);
    try {
      const res = await fetch("/api/admin/clear", { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("ล้างข้อมูลแบบสำรวจทั้งหมดในระบบเรียบร้อย", "success");
        loadExecutiveDashboardStats();
        loadAdminSurveys();
      } else {
        showToast("เกิดข้อผิดพลาด: " + data.error, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  // CSV Imports
  async function handleCSVUpload(fileInput, apiEndpoint, label) {
    const file = fileInput.files?.[0];
    if (!file) {
      showToast(`กรุณาเลือกไฟล์ CSV สำหรับ ${label}`, "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (!text) return;

      showSpinner(true);
      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "text/csv; charset=utf-8" },
          body: text,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`นำเข้า ${label} สำเร็จจำนวน ${data.imported} รายการ`, "success");
          fileInput.value = "";
          loadDimensions();
          loadAdminDimensions();
        } else {
          showToast(`นำเข้าล้มเหลว: ${data.error}`, "error");
        }
      } catch (err) {
        showToast(`เกิดข้อผิดพลาด: ${err.message}`, "error");
      } finally {
        showSpinner(false);
      }
    };
    reader.readAsText(file, "UTF-8");
  }

  btnImportStores.addEventListener("click", () =>
    handleCSVUpload(fileStoreCSV, "/api/admin/import/stores", "Stores")
  );
  btnImportBrands.addEventListener("click", () =>
    handleCSVUpload(fileBrandCSV, "/api/admin/import/brands", "Brands")
  );
  btnImportAnswers.addEventListener("click", () =>
    handleCSVUpload(fileAnswerCSV, "/api/admin/import/answers", "Answers")
  );

  btnResetDimensions.addEventListener("click", async () => {
    if (
      !confirm(
        "🔥 คำเตือนขั้นสูง: คุณแน่ใจหรือไม่ว่าต้องการ Reset ลบมิติข้อมูลและผลสำรวจทั้งหมดออกจากฐานข้อมูล D1?"
      )
    )
      return;

    showSpinner(true);
    try {
      const res = await fetch("/api/admin/reset-dimensions", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("รีเซ็ตมิติข้อมูลทั้งหมดสำเร็จ", "success");
        loadDimensions();
        loadAdminDimensions();
        loadAdminSurveys();
        loadExecutiveDashboardStats();
      } else {
        showToast("เกิดข้อผิดพลาด: " + data.error, "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  // --- Start App ---
  loadDimensions();
});
