/**
 * admin.js - Admin Panel Logic
 * จัดการข้อมูลทั้งหมดผ่านหน้า Admin
 */

// ========== State ==========
let adminYear = new Date().getFullYear() + 543;
let adminFestival = 'songkran';
let activeTab = 'daily';

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();

  if (isAdminLoggedIn()) {
    showAdminPanel();
  }

  initAdminControls();
});

/**
 * Handle login form
 */
async function handleLogin(e) {
  e.preventDefault();
  const pw = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');

  if (!pw) {
    showToast('กรุณากรอกรหัสผ่าน', 'warning');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'กำลังเข้าสู่ระบบ...';

  const success = await adminLogin(pw);

  if (success) {
    showToast('เข้าสู่ระบบสำเร็จ', 'success');
    showAdminPanel();
    updateAuthUI();
  }

  btn.disabled = false;
  btn.textContent = '🔑 เข้าสู่ระบบ';
}

/**
 * Handle logout
 */
function handleLogout() {
  adminLogout();
  updateAuthUI();
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('loginPassword').value = '';
}

/**
 * Show admin panel after login
 */
function showAdminPanel() {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  initAdminTabs();
  loadAdminData();
}

/**
 * Init year/festival controls
 */
function initAdminControls() {
  const yearSelect = document.getElementById('adminYearSelect');
  const festivalSelect = document.getElementById('adminFestivalSelect');

  if (yearSelect) {
    const thisYear = new Date().getFullYear() + 543;
    for (let y = thisYear; y >= thisYear - 10; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = `พ.ศ. ${y}`;
      if (y === adminYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }

    yearSelect.addEventListener('change', () => {
      adminYear = yearSelect.value;
      loadAdminData();
    });
  }

  if (festivalSelect) {
    festivalSelect.addEventListener('change', () => {
      adminFestival = festivalSelect.value;
      updateDateOptions();
      loadAdminData();
    });
  }
}

/**
 * Initialize tab navigation
 */
function initAdminTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      setActiveTab(target);
    });
  });
  setActiveTab('daily');
}

function setActiveTab(tabName) {
  activeTab = tabName;

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
  });

  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });

  loadAdminData();
}

/**
 * Update date dropdown based on festival
 */
function updateDateOptions() {
  const dateSelects = document.querySelectorAll('.date-select');
  const dates = getFestivalDates(adminFestival, adminYear);

  dateSelects.forEach(select => {
    select.innerHTML = '<option value="">เลือกวันที่</option>';
    dates.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = formatDate(d);
      select.appendChild(opt);
    });
  });
}

/**
 * Load admin data for current tab
 */
async function loadAdminData() {
  updateDateOptions();

  try {
    switch (activeTab) {
      case 'daily':
        await loadDailyAdmin();
        break;
      case 'district':
        await loadDistrictAdmin();
        break;
      case 'policy':
        await loadPolicyAdmin();
        break;
      case 'casualty':
        await loadCasualtyAdmin();
        break;
    }
  } catch (error) {
    console.warn('Load admin data error:', error);
  }
}

// ==================== Daily Stats Admin ====================

async function loadDailyAdmin() {
  const tableBody = document.getElementById('dailyTableBody');
  showLoading(tableBody);

  try {
    const result = await fetchDailyStats(adminYear, adminFestival);
    if (result.success && result.data.length > 0) {
      renderDailyAdminTable(result.data);
    } else {
      tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-lg">ยังไม่มีข้อมูล</td></tr>';
    }
  } catch {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-lg">ไม่สามารถโหลดข้อมูล</td></tr>';
  }
}

function renderDailyAdminTable(data) {
  const tableBody = document.getElementById('dailyTableBody');
  tableBody.innerHTML = data.map(row => `
    <tr>
      <td>${formatDate(row.date)}</td>
      <td>${row.accidents}</td>
      <td>${row.injuries}</td>
      <td>${row.deaths}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editDailyRow('${row.date}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteDailyRow('${row.date}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function saveDailyForm(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) { showToast('กรุณาเข้าสู่ระบบ', 'error'); return; }

  const payload = {
    year: adminYear,
    festival: adminFestival,
    date: document.getElementById('dailyDate').value,
    accidents: document.getElementById('dailyAccidents').value,
    injuries: document.getElementById('dailyInjuries').value,
    deaths: document.getElementById('dailyDeaths').value
  };

  if (!payload.date) { showToast('กรุณาเลือกวันที่', 'warning'); return; }

  try {
    const result = await saveDailyData(payload, token);
    if (result.success) {
      showToast(result.message, 'success');
      loadDailyAdmin();
    } else {
      showToast(result.error?.message || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    showToast('ไม่สามารถบันทึกข้อมูล', 'error');
  }
}

async function deleteDailyRow(date) {
  if (!confirm('ต้องการลบข้อมูลวันที่ ' + formatDate(date) + ' ?')) return;
  const token = getAuthToken();

  try {
    const result = await deleteDailyData({ year: adminYear, festival: adminFestival, date }, token);
    if (result.success) {
      showToast(result.message, 'success');
      loadDailyAdmin();
    }
  } catch (error) {
    showToast('ไม่สามารถลบข้อมูล', 'error');
  }
}

async function editDailyRow(date) {
  try {
    const result = await fetchDailyStats(adminYear, adminFestival);
    if (result.success) {
      const record = result.data.find(r => r.date === date);
      if (record) {
        document.getElementById('dailyDate').value = record.date;
        document.getElementById('dailyAccidents').value = record.accidents || 0;
        document.getElementById('dailyInjuries').value = record.injuries || 0;
        document.getElementById('dailyDeaths').value = record.deaths || 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  } catch {
    showToast('ไม่สามารถโหลดข้อมูล', 'error');
  }
}

// ==================== District Stats Admin ====================

async function loadDistrictAdmin() {
  const tableBody = document.getElementById('districtTableBody');
  showLoading(tableBody);

  try {
    const result = await fetchDistrictStats(adminYear, adminFestival);
    if (result.success && result.raw && result.raw.length > 0) {
      renderDistrictAdminTable(result.raw);
    } else {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-lg">ยังไม่มีข้อมูล</td></tr>';
    }
  } catch {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-lg">ไม่สามารถโหลดข้อมูล</td></tr>';
  }

  // Populate district select
  const districtSelect = document.getElementById('districtName');
  if (districtSelect && districtSelect.options.length <= 1) {
    DISTRICTS.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      districtSelect.appendChild(opt);
    });
  }
}

function renderDistrictAdminTable(data) {
  const tableBody = document.getElementById('districtTableBody');
  tableBody.innerHTML = data.map(row => `
    <tr>
      <td>${formatDate(row.date)}</td>
      <td>${row.district}</td>
      <td>${row.accidents}</td>
      <td>${row.injuries}</td>
      <td>${row.deaths}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editDistrictRow('${row.date}', '${row.district}')">✏️</button>
        <button class="btn btn-sm btn-danger"
                onclick="deleteDistrictRow('${row.date}','${row.district}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function saveDistrictForm(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) { showToast('กรุณาเข้าสู่ระบบ', 'error'); return; }

  const payload = {
    year: adminYear,
    festival: adminFestival,
    date: document.getElementById('districtDate').value,
    district: document.getElementById('districtName').value,
    accidents: document.getElementById('districtAccidents').value,
    injuries: document.getElementById('districtInjuries').value,
    deaths: document.getElementById('districtDeaths').value
  };

  if (!payload.date || !payload.district) {
    showToast('กรุณาเลือกวันที่และอำเภอ', 'warning');
    return;
  }

  try {
    const result = await saveDistrictData(payload, token);
    if (result.success) {
      showToast(result.message, 'success');
      loadDistrictAdmin();
    } else {
      showToast(result.error?.message || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    showToast('ไม่สามารถบันทึกข้อมูล', 'error');
  }
}

async function deleteDistrictRow(date, district) {
  if (!confirm(`ลบข้อมูล อ.${district} วันที่ ${formatDate(date)} ?`)) return;
  const token = getAuthToken();

  try {
    const result = await deleteDistrictData(
      { year: adminYear, festival: adminFestival, date, district }, token
    );
    if (result.success) {
      showToast(result.message, 'success');
      loadDistrictAdmin();
    }
  } catch (error) {
    showToast('ไม่สามารถลบข้อมูล', 'error');
  }
}

async function editDistrictRow(date, district) {
  try {
    const result = await fetchDistrictStats(adminYear, adminFestival);
    if (result.success && result.raw) {
      const record = result.raw.find(r => r.date === date && r.district === district);
      if (record) {
        document.getElementById('districtDate').value = record.date;
        document.getElementById('districtName').value = record.district;
        document.getElementById('districtAccidents').value = record.accidents || 0;
        document.getElementById('districtInjuries').value = record.injuries || 0;
        document.getElementById('districtDeaths').value = record.deaths || 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  } catch {
    showToast('ไม่สามารถโหลดข้อมูล', 'error');
  }
}

// ==================== Policy Stats Admin ====================

async function loadPolicyAdmin() {
  const tableBody = document.getElementById('policyTableBody');
  showLoading(tableBody);

  try {
    const result = await fetchPolicyStats(adminYear, adminFestival);
    if (result.success && result.data.daily && result.data.daily.length > 0) {
      renderPolicyAdminTable(result.data.daily);
    } else {
      tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-lg">ยังไม่มีข้อมูล</td></tr>';
    }
  } catch {
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted p-lg">ไม่สามารถโหลดข้อมูล</td></tr>';
  }
}

function renderPolicyAdminTable(data) {
  const tableBody = document.getElementById('policyTableBody');
  tableBody.innerHTML = data.map(row => `
    <tr>
      <td>${formatDate(row.date)}</td>
      <td>${row.drunkDriving}</td>
      <td>${row.noSeatbelt}</td>
      <td>${row.noHelmet}</td>
      <td>${row.speeding}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editPolicyRow('${row.date}')">✏️</button>
      </td>
    </tr>
  `).join('');
}

async function savePolicyForm(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) { showToast('กรุณาเข้าสู่ระบบ', 'error'); return; }

  const payload = {
    year: adminYear,
    festival: adminFestival,
    date: document.getElementById('policyDate').value,
    drunkDriving: document.getElementById('policyDrunk').value || 0,
    noSeatbelt: document.getElementById('policySeatbelt').value || 0,
    noHelmet: document.getElementById('policyHelmet').value || 0,
    speeding: document.getElementById('policySpeed').value || 0
  };

  if (!payload.date) { showToast('กรุณาเลือกวันที่', 'warning'); return; }

  try {
    const result = await savePolicyData(payload, token);
    if (result.success) {
      showToast(result.message, 'success');
      loadPolicyAdmin();
    } else {
      showToast(result.error?.message || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    showToast('ไม่สามารถบันทึกข้อมูล', 'error');
  }
}

async function editPolicyRow(date) {
  try {
    const result = await fetchPolicyStats(adminYear, adminFestival);
    if (result.success && result.data && result.data.daily) {
      const record = result.data.daily.find(r => r.date === date);
      if (record) {
        document.getElementById('policyDate').value = record.date;
        document.getElementById('policyDrunk').value = record.drunkDriving || 0;
        document.getElementById('policySeatbelt').value = record.noSeatbelt || 0;
        document.getElementById('policyHelmet').value = record.noHelmet || 0;
        document.getElementById('policySpeed').value = record.speeding || 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  } catch {
    showToast('ไม่สามารถโหลดข้อมูล', 'error');
  }
}

// ==================== Casualty Details Admin ====================

async function loadCasualtyAdmin() {
  const container = document.getElementById('casualtyList');
  showLoading(container);

  // Populate district select for casualty form
  const districtSelect = document.getElementById('casualtyDistrict');
  if (districtSelect && districtSelect.options.length <= 1) {
    DISTRICTS.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      districtSelect.appendChild(opt);
    });
  }

  try {
    const result = await fetchCasualties(adminYear, adminFestival);
    if (result.success && result.data.length > 0) {
      renderCasualtyAdminList(result.data);
    } else {
      showEmpty(container, 'ยังไม่มีข้อมูลบาดเจ็บ/เสียชีวิต');
    }
  } catch {
    showEmpty(container, 'ไม่สามารถโหลดข้อมูล');
  }
}

function renderCasualtyAdminList(data) {
  const container = document.getElementById('casualtyList');
  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>วันที่/เวลา</th>
          <th>ชื่อ-สกุล</th>
          <th>อำเภอ</th>
          <th>สถานะ</th>
          <th>สาเหตุ</th>
          <th>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(row => `
          <tr>
            <td>${row.id}</td>
            <td>${formatDate(row.date)}<br><small class="text-muted">${row.time || '-'}</small></td>
            <td>${row.victimName || '-'}<br><small class="text-muted">${row.gender || ''} อายุ ${row.age || '-'}</small></td>
            <td>${row.district || '-'}</td>
            <td>
              <span class="case-status ${row.status === 'เสียชีวิต' ? 'death' : 'injury'}">
                ${row.status || '-'}
              </span>
            </td>
            <td>${row.cause || '-'}</td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="editCasualty(${row.id})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCasualty(${row.id})">🗑️</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function showCasualtyForm(editData = null) {
  const modal = document.getElementById('casualtyModal');
  if (!modal) return;
  modal.classList.add('active');

  if (editData) {
    document.getElementById('casualtyId').value = editData.id || '';
    document.getElementById('casualtyDate2').value = editData.date || '';
    document.getElementById('casualtyTime').value = editData.time || '';
    document.getElementById('casualtyLocation').value = editData.location || '';
    document.getElementById('casualtyDistrict').value = editData.district || '';
    document.getElementById('casualtyVehicle').value = editData.vehicleType || '';
    document.getElementById('casualtyCause').value = editData.cause || '';
    document.getElementById('casualtyName').value = editData.victimName || '';
    document.getElementById('casualtyGender').value = editData.gender || '';
    document.getElementById('casualtyAge').value = editData.age || '';
    document.getElementById('casualtyStatus').value = editData.status || '';
    document.getElementById('casualtyNotes').value = editData.notes || '';
  } else {
    document.getElementById('casualtyForm').reset();
    document.getElementById('casualtyId').value = '';
  }
}

function closeCasualtyModal() {
  const modal = document.getElementById('casualtyModal');
  if (modal) modal.classList.remove('active');
}

async function saveCasualtyForm(e) {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) { showToast('กรุณาเข้าสู่ระบบ', 'error'); return; }

  const id = document.getElementById('casualtyId').value;
  const payload = {
    id: id || undefined,
    year: adminYear,
    festival: adminFestival,
    date: document.getElementById('casualtyDate2').value,
    time: document.getElementById('casualtyTime').value,
    location: document.getElementById('casualtyLocation').value,
    district: document.getElementById('casualtyDistrict').value,
    vehicleType: document.getElementById('casualtyVehicle').value,
    cause: document.getElementById('casualtyCause').value,
    victimName: document.getElementById('casualtyName').value,
    gender: document.getElementById('casualtyGender').value,
    age: document.getElementById('casualtyAge').value,
    status: document.getElementById('casualtyStatus').value,
    notes: document.getElementById('casualtyNotes').value
  };

  if (!payload.date || !payload.victimName) {
    showToast('กรุณากรอกวันที่และชื่อ-สกุล', 'warning');
    return;
  }

  try {
    const result = await saveCasualtyData(payload, token);
    if (result.success) {
      showToast(result.message, 'success');
      closeCasualtyModal();
      loadCasualtyAdmin();
    } else {
      showToast(result.error?.message || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    showToast('ไม่สามารถบันทึกข้อมูล', 'error');
  }
}

async function editCasualty(id) {
  try {
    const result = await fetchCasualties(adminYear, adminFestival);
    if (result.success) {
      const record = result.data.find(r => String(r.id) === String(id));
      if (record) {
        showCasualtyForm(record);
      }
    }
  } catch {
    showToast('ไม่สามารถโหลดข้อมูล', 'error');
  }
}

async function deleteCasualty(id) {
  if (!confirm('ต้องการลบข้อมูลนี้?')) return;
  const token = getAuthToken();

  try {
    const result = await deleteCasualtyData(id, token);
    if (result.success) {
      showToast(result.message, 'success');
      loadCasualtyAdmin();
    }
  } catch (error) {
    showToast('ไม่สามารถลบข้อมูล', 'error');
  }
}
