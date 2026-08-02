// Client Application Logic for Survey Application
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const selectRegion = document.getElementById("selectRegion") as HTMLSelectElement;
  const selectMall = document.getElementById("selectMall") as HTMLSelectElement;
  const selectStore = document.getElementById("selectStore") as HTMLSelectElement;
  const inputUserName = document.getElementById("inputUserName") as HTMLInputElement;
  const btnStartSurvey = document.getElementById("btnStartSurvey") as HTMLButtonElement;

  const viewLanding = document.getElementById("viewLanding") as HTMLElement;
  const viewSurvey = document.getElementById("viewSurvey") as HTMLElement;
  const lblBadgeStoreName = document.getElementById("lblBadgeStoreName") as HTMLElement;
  const lblBadgeStoreDetail = document.getElementById("lblBadgeStoreDetail") as HTMLElement;
  const lblBadgeSurveyStatus = document.getElementById("lblBadgeSurveyStatus") as HTMLElement;
  const btnBackToStores = document.getElementById("btnBackToStores") as HTMLButtonElement;

  const matrixHeaderRow = document.getElementById("matrixHeaderRow") as HTMLTableRowElement;
  const matrixBody = document.getElementById("matrixBody") as HTMLTableSectionElement;
  const matrixFooter = document.getElementById("matrixFooter") as HTMLTableSectionElement;
  const btnSaveSurvey = document.getElementById("btnSaveSurvey") as HTMLButtonElement;
  const btnClearMatrix = document.getElementById("btnClearMatrix") as HTMLButtonElement;

  // Admin Modal Elements
  const btnAdminTrigger = document.getElementById("btnAdminTrigger") as HTMLButtonElement;
  const modalAdmin = document.getElementById("modalAdmin") as HTMLElement;
  const btnCloseAdminModal = document.getElementById("btnCloseAdminModal") as HTMLButtonElement;
  const adminAuthSection = document.getElementById("adminAuthSection") as HTMLElement;
  const adminDashboardSection = document.getElementById("adminDashboardSection") as HTMLElement;
  const inputAdminPassword = document.getElementById("inputAdminPassword") as HTMLInputElement;
  const btnAdminLogin = document.getElementById("btnAdminLogin") as HTMLButtonElement;

  const filterAdminRegion = document.getElementById("filterAdminRegion") as HTMLSelectElement;
  const filterAdminStore = document.getElementById("filterAdminStore") as HTMLSelectElement;
  const filterAdminBrand = document.getElementById("filterAdminBrand") as HTMLSelectElement;
  const btnAdminSearch = document.getElementById("btnAdminSearch") as HTMLButtonElement;
  const btnAdminExportCSV = document.getElementById("btnAdminExportCSV") as HTMLButtonElement;
  const btnAdminClearSurveys = document.getElementById("btnAdminClearSurveys") as HTMLButtonElement;
  const tblAdminSurveysBody = document.getElementById("tblAdminSurveysBody") as HTMLTableSectionElement;

  const fileStoreCSV = document.getElementById("fileStoreCSV") as HTMLInputElement;
  const btnImportStores = document.getElementById("btnImportStores") as HTMLButtonElement;
  const fileBrandCSV = document.getElementById("fileBrandCSV") as HTMLInputElement;
  const btnImportBrands = document.getElementById("btnImportBrands") as HTMLButtonElement;
  const fileAnswerCSV = document.getElementById("fileAnswerCSV") as HTMLInputElement;
  const btnImportAnswers = document.getElementById("btnImportAnswers") as HTMLButtonElement;
  const btnResetDimensions = document.getElementById("btnResetDimensions") as HTMLButtonElement;

  const spinnerOverlay = document.getElementById("spinnerOverlay") as HTMLElement;
  const toastContainer = document.getElementById("toastContainer") as HTMLElement;

  // --- State Variables ---
  interface Store {
    id: number;
    region: string;
    mall: string;
    province: string;
    store_name: string;
  }
  interface Brand {
    id: number;
    name: string;
  }
  interface AnswerChoice {
    id: number;
    name: string;
  }

  let allStores: Store[] = [];
  let allBrands: Brand[] = [];
  let allAnswerChoices: AnswerChoice[] = [];
  let currentSelectedStore: Store | null = null;
  let adminAuthenticated = false;

  // --- Utility Functions ---
  function showSpinner(show = true) {
    if (show) spinnerOverlay.classList.add("active");
    else spinnerOverlay.classList.remove("active");
  }

  function showToast(message: string, type: "success" | "error" | "warning" | "info" = "info") {
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

      populateRegionDropdown();
      populateAdminFilters();
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาดในการโหลดข้อมูล: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  }

  // --- Cascading Dropdown Logic ---
  function populateRegionDropdown() {
    selectRegion.innerHTML = '<option value="">-- กรุณาเลือกภูมิภาค --</option>';
    selectMall.innerHTML = '<option value="">-- กรุณาเลือกห้าง/ช่องทาง --</option>';
    selectStore.innerHTML = '<option value="">-- กรุณาเลือกสาขา --</option>';
    selectMall.disabled = true;
    selectStore.disabled = true;
    btnStartSurvey.disabled = true;

    const regions = Array.from(new Set(allStores.map((s) => s.region))).sort();
    regions.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r;
      opt.textContent = r;
      selectRegion.appendChild(opt);
    });
  }

  selectRegion.addEventListener("change", () => {
    const selectedRegion = selectRegion.value;
    selectMall.innerHTML = '<option value="">-- กรุณาเลือกห้าง/ช่องทาง --</option>';
    selectStore.innerHTML = '<option value="">-- กรุณาเลือกสาขา --</option>';
    selectStore.disabled = true;
    btnStartSurvey.disabled = true;

    if (!selectedRegion) {
      selectMall.disabled = true;
      return;
    }

    const filteredStores = allStores.filter((s) => s.region === selectedRegion);
    const malls = Array.from(new Set(filteredStores.map((s) => s.mall))).sort();

    malls.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      selectMall.appendChild(opt);
    });
    selectMall.disabled = false;
  });

  selectMall.addEventListener("change", () => {
    const selectedRegion = selectRegion.value;
    const selectedMall = selectMall.value;

    selectStore.innerHTML = '<option value="">-- กรุณาเลือกสาขา --</option>';
    btnStartSurvey.disabled = true;

    if (!selectedRegion || !selectedMall) {
      selectStore.disabled = true;
      return;
    }

    const filteredStores = allStores.filter(
      (s) => s.region === selectedRegion && s.mall === selectedMall
    );

    filteredStores.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id.toString();
      opt.textContent = `${s.store_name} (${s.province})`;
      selectStore.appendChild(opt);
    });
    selectStore.disabled = false;
  });

  selectStore.addEventListener("change", () => {
    const storeId = parseInt(selectStore.value, 10);
    currentSelectedStore = allStores.find((s) => s.id === storeId) || null;
    btnStartSurvey.disabled = !currentSelectedStore;
  });

  // --- Start Survey & Render Matrix ---
  btnStartSurvey.addEventListener("click", async () => {
    if (!currentSelectedStore) return;

    lblBadgeStoreName.textContent = `สาขา: ${currentSelectedStore.store_name}`;
    lblBadgeStoreDetail.textContent = `ภูมิภาค: ${currentSelectedStore.region} | ห้าง: ${currentSelectedStore.mall} | จังหวัด: ${currentSelectedStore.province}`;
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

        // Fill existing details
        if (Array.isArray(data.details)) {
          data.details.forEach((d: any) => {
            const input = document.querySelector(
              `input[data-brand-id="${d.brand_id}"][data-choice-id="${d.answer_choice_id}"]`
            ) as HTMLInputElement;
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
    } catch (err: any) {
      showToast("ไม่สามารถดึงข้อมูลสำรวจได้: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  btnBackToStores.addEventListener("click", () => {
    viewSurvey.style.display = "none";
    viewLanding.style.display = "block";
  });

  // --- Matrix Grid Render & Calculation ---
  function renderMatrixGrid() {
    // Header Row
    matrixHeaderRow.innerHTML = "<th>แบรนด์ (Brand)</th>";
    allAnswerChoices.forEach((choice) => {
      const th = document.createElement("th");
      th.textContent = choice.name;
      matrixHeaderRow.appendChild(th);
    });
    const thTotal = document.createElement("th");
    thTotal.textContent = "รวม (Total)";
    matrixHeaderRow.appendChild(thTotal);

    // Body Rows
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

    // Footer Row (Column Totals)
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

    // Row totals
    allBrands.forEach((brand) => {
      let rowSum = 0;
      const inputs = document.querySelectorAll(
        `input[data-brand-id="${brand.id}"]`
      ) as NodeListOf<HTMLInputElement>;
      inputs.forEach((input) => {
        const val = parseInt(input.value, 10) || 0;
        rowSum += val;
      });
      const lblRowTotal = document.querySelector(
        `td[data-brand-total-id="${brand.id}"]`
      );
      if (lblRowTotal) lblRowTotal.textContent = rowSum.toString();
    });

    // Column totals
    allAnswerChoices.forEach((choice) => {
      let colSum = 0;
      const inputs = document.querySelectorAll(
        `input[data-choice-id="${choice.id}"]`
      ) as NodeListOf<HTMLInputElement>;
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
    const inputs = document.querySelectorAll(".cell-input") as NodeListOf<HTMLInputElement>;
    inputs.forEach((input) => (input.value = "0"));
    calculateMatrixTotals();
    showToast("รีเซ็ตตัวเลขทั้งหมดเป็น 0 เรียบร้อย", "info");
  });

  // --- Save Survey ---
  btnSaveSurvey.addEventListener("click", async () => {
    if (!currentSelectedStore) return;

    const details: Array<{ brandId: number; answerChoiceId: number; value: number }> = [];
    const inputs = document.querySelectorAll(".cell-input") as NodeListOf<HTMLInputElement>;

    inputs.forEach((input) => {
      const brandId = parseInt(input.dataset.brandId || "0", 10);
      const choiceId = parseInt(input.dataset.choiceId || "0", 10);
      const val = parseInt(input.value, 10) || 0;

      details.push({ brandId, answerChoiceId: choiceId, value: val });
    });

    const userName = inputUserName.value.trim() || "user";

    showSpinner(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: currentSelectedStore.id,
          user: userName,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save survey");
      }

      showToast("🎉 บันทึกข้อมูลแบบสำรวจสำเร็จเรียบร้อย!", "success");
      lblBadgeSurveyStatus.textContent = `✅ บันทึกล่าสุดโดย ${userName} เมื่อ ${new Date().toLocaleString("th-TH")}`;
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาดในการบันทึก: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  // --- Admin Modal & Actions ---
  btnAdminTrigger.addEventListener("click", () => {
    modalAdmin.classList.add("active");
  });

  btnCloseAdminModal.addEventListener("click", () => {
    modalAdmin.classList.remove("active");
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
        adminAuthenticated = true;
        adminAuthSection.style.display = "none";
        adminDashboardSection.style.display = "block";
        showToast("เข้าสู่ระบบ Admin สำเร็จ", "success");
        loadAdminSurveys();
      } else {
        showToast("รหัสผ่านไม่ถูกต้อง", "error");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  // Admin Tab Switching
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const targetTab = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-content").forEach((tc) => tc.classList.remove("active"));
      const activeContent = document.getElementById(targetTab || "");
      if (activeContent) activeContent.classList.add("active");
    });
  });

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
          '<tr><td colspan="10" style="text-align: center; color: var(--text-muted);">ไม่พบข้อมูลแบบสำรวจตามเงื่อนไขที่เลือก</td></tr>';
        return;
      }

      data.results.forEach((row: any) => {
        const tr = document.createElement("tr");
        const lastUpdateStr = row.last_update
          ? new Date(row.last_update).toLocaleString("th-TH")
          : "-";

        tr.innerHTML = `
          <td>${row.survey_id || "-"}</td>
          <td>${row.region || "-"}</td>
          <td>${row.mall || "-"}</td>
          <td>${row.store_name || "-"}</td>
          <td>${row.brand_name || "-"}</td>
          <td>${row.answer_choice_name || "-"}</td>
          <td style="font-weight: bold; color: var(--accent);">${row.value ?? 0}</td>
          <td>${row.user || "user"}</td>
          <td>${lastUpdateStr}</td>
          <td>
            <button class="btn btn-danger btn-delete-survey" data-survey-id="${row.survey_id}" style="padding: 4px 8px; font-size: 0.75rem;">
              🗑️ ลบ
            </button>
          </td>
        `;
        tblAdminSurveysBody.appendChild(tr);
      });

      // Attach Delete Handlers
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
              loadAdminSurveys();
            } else {
              showToast("ลบไม่สำเร็จ: " + delData.error, "error");
            }
          } catch (e: any) {
            showToast("เกิดข้อผิดพลาด: " + e.message, "error");
          } finally {
            showSpinner(false);
          }
        });
      });
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาดในการโหลดผลสำรวจ: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
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
        loadAdminSurveys();
      } else {
        showToast("เกิดข้อผิดพลาด: " + data.error, "error");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  // CSV Imports
  async function handleCSVUpload(fileInput: HTMLInputElement, apiEndpoint: string, label: string) {
    const file = fileInput.files?.[0];
    if (!file) {
      showToast(`กรุณาเลือกไฟล์ CSV สำหรับ ${label}`, "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
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
        } else {
          showToast(`นำเข้าล้มเหลว: ${data.error}`, "error");
        }
      } catch (err: any) {
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
        loadAdminSurveys();
      } else {
        showToast("เกิดข้อผิดพลาด: " + data.error, "error");
      }
    } catch (err: any) {
      showToast("เกิดข้อผิดพลาด: " + err.message, "error");
    } finally {
      showSpinner(false);
    }
  });

  // --- Start App ---
  loadDimensions();
});
