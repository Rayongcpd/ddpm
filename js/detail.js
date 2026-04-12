/**
 * detail.js - Casualty Detail Logic
 * หน้ารายละเอียดบาดเจ็บ/เสียชีวิตทุกกรณี
 */

// ========== State ==========
let detailYear = new Date().getFullYear() + 543;
let detailFestival = 'songkran';
let allCasualties = [];
let casualtyChartGender = null;
let casualtyChartVehicle = null;
let casualtyChartCause = null;
let casualtyChartAge = null;
let casualtyChartRoad = null;
let casualtyChartRole = null;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
  initDetailControls();
  loadCasualtyDetails();
});

function initDetailControls() {
  const yearSelect = document.getElementById('detailYear');
  const festivalSelect = document.getElementById('detailFestival');
  const filterStatus = document.getElementById('filterStatus');
  const filterDistrict = document.getElementById('filterDistrict');

  const thisYear = new Date().getFullYear() + 543;

  if (yearSelect) {
    for (let y = thisYear; y >= thisYear - 10; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = `พ.ศ. ${y}`;
      if (y === detailYear) opt.selected = true;
      yearSelect.appendChild(opt);
    }
    yearSelect.addEventListener('change', () => {
      detailYear = yearSelect.value;
      loadCasualtyDetails();
    });
  }

  if (festivalSelect) {
    festivalSelect.addEventListener('change', () => {
      detailFestival = festivalSelect.value;
      loadCasualtyDetails();
    });
  }

  // Populate district filter
  if (filterDistrict) {
    DISTRICTS.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d;
      opt.textContent = d;
      filterDistrict.appendChild(opt);
    });
    filterDistrict.addEventListener('change', applyFilters);
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', applyFilters);
  }
}

/**
 * Load casualty details
 */
async function loadCasualtyDetails() {
  const content = document.getElementById('detailContent');
  showLoading(content);

  try {
    const result = await fetchCasualties(detailYear, detailFestival);
    if (result.success) {
      allCasualties = result.data;
      renderDetailPage();
    } else {
      showEmpty(content, 'ไม่สามารถโหลดข้อมูล');
    }
  } catch (error) {
    console.warn('Detail error:', error);
    allCasualties = [];
    renderDetailPage();
  }
}

/**
 * Apply filters
 */
function applyFilters() {
  renderDetailPage();
}

function getFilteredData() {
  let data = [...allCasualties];
  const status = document.getElementById('filterStatus')?.value;
  const district = document.getElementById('filterDistrict')?.value;

  if (status) {
    data = data.filter(r => r.status === status);
  }
  if (district) {
    data = data.filter(r => r.district === district);
  }

  return data;
}

/**
 * Render the full detail page
 */
function renderDetailPage() {
  const content = document.getElementById('detailContent');
  const filtered = getFilteredData();
  const fest = FESTIVALS[detailFestival];

  // Calculate statistics
  const totalCases = filtered.length;
  const injuries = filtered.filter(r => r.status === 'บาดเจ็บ').length;
  const deaths = filtered.filter(r => r.status === 'เสียชีวิต').length;
  const males = filtered.filter(r => r.gender === 'ชาย').length;
  const females = filtered.filter(r => r.gender === 'หญิง').length;

  content.innerHTML = `
    <!-- Summary Stats -->
    <div class="summary-cards mb-xl">
      <div class="card summary-card injuries">
        <div class="card-header">
          <span class="card-title">ผู้บาดเจ็บ</span>
          <div class="card-icon injuries">🏥</div>
        </div>
        <div class="summary-value injuries">${injuries}</div>
        <div class="summary-sub">ราย (${fest.emoji} เทศกาล${fest.name})</div>
      </div>

      <div class="card summary-card deaths">
        <div class="card-header">
          <span class="card-title">ผู้เสียชีวิต</span>
          <div class="card-icon deaths">✝️</div>
        </div>
        <div class="summary-value deaths">${deaths}</div>
        <div class="summary-sub">ราย</div>
      </div>

      <div class="card summary-card safe">
        <div class="card-header">
          <span class="card-title">จำนวนกรณีทั้งหมด</span>
          <div class="card-icon safe">📋</div>
        </div>
        <div class="summary-value safe">${totalCases}</div>
        <div class="summary-sub">ชาย ${males} | หญิง ${females} ราย</div>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid-3 mb-xl">
      <div class="card">
        <h3 class="section-title">👤 แยกตามเพศ</h3>
        <div class="chart-container" style="min-height:220px">
          <canvas id="chartGender"></canvas>
        </div>
      </div>
      <div class="card">
        <h3 class="section-title">🚗 แยกตามยานพาหนะ</h3>
        <div class="chart-container" style="min-height:220px">
          <canvas id="chartVehicle"></canvas>
        </div>
      </div>
      <div class="card">
        <h3 class="section-title">⚠️ แยกตามสาเหตุ</h3>
        <div class="chart-container" style="min-height:220px">
          <canvas id="chartCause"></canvas>
        </div>
      </div>
    </div>

    <!-- Charts Row 2 (Analytical) -->
    <div class="grid-3 mb-xl">
      <div class="card">
        <h3 class="section-title">🎂 แยกตามกลุ่มอายุ</h3>
        <div class="chart-container" style="min-height:220px">
          <canvas id="chartAge"></canvas>
        </div>
      </div>
      <div class="card">
        <h3 class="section-title">🛣️ แยกตามประเภทถนน</h3>
        <div class="chart-container" style="min-height:220px">
          <canvas id="chartRoadType"></canvas>
        </div>
      </div>
      <div class="card">
        <h3 class="section-title">👥 แยกตามสถานะผู้ประสบเหตุ</h3>
        <div class="chart-container" style="min-height:220px">
          <canvas id="chartRole"></canvas>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="card mb-xl">
      <h3 class="section-title">🕐 ลำดับเหตุการณ์ (Timeline)</h3>
      <div id="timelineContainer"></div>
    </div>

    <!-- Case Cards -->
    <h3 class="section-title mb-lg">📋 รายละเอียดแต่ละกรณี (${filtered.length} ราย)</h3>
    <div class="casualty-cards" id="caseCards"></div>
  `;

  renderStatCharts(filtered);
  renderTimeline(filtered);
  renderCaseCards(filtered);
}

/**
 * Render statistics charts
 */
function renderStatCharts(data) {
  // Gender chart
  if (casualtyChartGender) casualtyChartGender.destroy();
  const ctxGender = document.getElementById('chartGender');
  if (ctxGender) {
    const genderCounts = countBy(data, 'gender');
    casualtyChartGender = new Chart(ctxGender, {
      type: 'doughnut',
      data: {
        labels: Object.keys(genderCounts),
        datasets: [{
          data: Object.values(genderCounts),
          backgroundColor: ['#4f7cff', '#f48fb1', '#b388ff', '#69f0ae'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9fa8da', font: { family: 'Prompt' }, padding: 15 } }
        }
      }
    });
  }

  // Vehicle chart
  if (casualtyChartVehicle) casualtyChartVehicle.destroy();
  const ctxVehicle = document.getElementById('chartVehicle');
  if (ctxVehicle) {
    const vehicleCounts = countBy(data, 'vehicleType');
    casualtyChartVehicle = new Chart(ctxVehicle, {
      type: 'doughnut',
      data: {
        labels: Object.keys(vehicleCounts),
        datasets: [{
          data: Object.values(vehicleCounts),
          backgroundColor: ['#ff9800', '#4f7cff', '#69f0ae', '#ff5252', '#b388ff', '#ffd740'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9fa8da', font: { family: 'Prompt' }, padding: 15 } }
        }
      }
    });
  }

  // Cause chart
  if (casualtyChartCause) casualtyChartCause.destroy();
  const ctxCause = document.getElementById('chartCause');
  if (ctxCause) {
    const causeCounts = countBy(data, 'cause');
    casualtyChartCause = new Chart(ctxCause, {
      type: 'doughnut',
      data: {
        labels: Object.keys(causeCounts),
        datasets: [{
          data: Object.values(causeCounts),
          backgroundColor: ['#ff5252', '#ffd740', '#4f7cff', '#69f0ae', '#b388ff', '#00bcd4'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#9fa8da', font: { family: 'Prompt' }, padding: 15 } }
        }
      }
    });
  }

  // Age group chart
  if (casualtyChartAge) casualtyChartAge.destroy();
  const ctxAge = document.getElementById('chartAge');
  if (ctxAge) {
    const ageGroups = { 'เยาวชน (<20)': 0, 'วัยทำงาน (20-60)': 0, 'ผู้สูงอายุ (>60)': 0, 'ไม่ระบุ': 0 };
    data.forEach(r => {
      const age = parseInt(r.age);
      if (isNaN(age)) ageGroups['ไม่ระบุ']++;
      else if (age < 20) ageGroups['เยาวชน (<20)']++;
      else if (age <= 60) ageGroups['วัยทำงาน (20-60)']++;
      else ageGroups['ผู้สูงอายุ (>60)']++;
    });
    casualtyChartAge = new Chart(ctxAge, {
      type: 'doughnut',
      data: {
        labels: Object.keys(ageGroups),
        datasets: [{ data: Object.values(ageGroups), backgroundColor: ['#69f0ae', '#4f7cff', '#ffd740', '#9fa8da'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#9fa8da', font: { family: 'Prompt', size: 10 } } } } }
    });
  }

  // Road type chart
  if (casualtyChartRoad) casualtyChartRoad.destroy();
  const ctxRoad = document.getElementById('chartRoadType');
  if (ctxRoad) {
    const roadCounts = countBy(data, 'roadType');
    casualtyChartRoad = new Chart(ctxRoad, {
      type: 'doughnut',
      data: {
        labels: Object.keys(roadCounts),
        datasets: [{ data: Object.values(roadCounts), backgroundColor: ['#ff9800', '#2196f3', '#4caf50', '#f44336', '#9c27b0'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#9fa8da', font: { family: 'Prompt', size: 10 } } } } }
    });
  }

  // Victim role chart
  if (casualtyChartRole) casualtyChartRole.destroy();
  const ctxRole = document.getElementById('chartRole');
  if (ctxRole) {
    const roleCounts = countBy(data, 'role');
    casualtyChartRole = new Chart(ctxRole, {
      type: 'doughnut',
      data: {
        labels: Object.keys(roleCounts),
        datasets: [{ data: Object.values(roleCounts), backgroundColor: ['#e91e63', '#00bcd4', '#ffeb3b', '#4caf50'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: '#9fa8da', font: { family: 'Prompt', size: 10 } } } } }
    });
  }
}

/**
 * Render timeline
 */
function renderTimeline(data) {
  const container = document.getElementById('timelineContainer');
  if (!container) return;

  if (data.length === 0) {
    showEmpty(container, 'ยังไม่มีข้อมูล');
    return;
  }

  // Group by date
  const grouped = {};
  data.forEach(r => {
    const date = r.date || 'ไม่ระบุ';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(r);
  });

  let html = '<div class="timeline">';

  Object.entries(grouped).forEach(([date, items]) => {
    items.forEach(item => {
      const isDeath = item.status === 'เสียชีวิต';
      html += `
        <div class="timeline-item ${isDeath ? 'death' : ''}">
          <div class="timeline-date">${formatDate(date)} ${item.time || ''}</div>
          <div class="card" style="padding:var(--space-md)">
            <div class="flex-between mb-sm">
              <strong>${item.victimName || 'ไม่ระบุชื่อ'}</strong>
              <span class="case-status ${isDeath ? 'death' : 'injury'}">${item.status}</span>
            </div>
            <div class="font-sm text-secondary">
              ${item.gender || ''} ${item.age ? 'อายุ ' + item.age + ' ปี' : ''} |
              📍 อ.${item.district || '-'} |
              🚗 ${item.vehicleType || '-'} |
              ⚠️ ${item.cause || '-'}
            </div>
            <div class="font-sm text-secondary mt-sm">
              🛣️ ${item.roadType || 'ไม่ระบุประเภทถนน'} | 👥 ${item.role || 'ไม่ระบุสถานะ'} | 📍 ${item.spotType || 'ไม่ระบุจุดเกิดเหตุ'}
            </div>
            ${item.location ? `<div class="font-sm text-muted mt-sm">📍 ${item.location}</div>` : ''}
            ${item.notes ? `<div class="font-sm text-muted mt-sm">📝 ${item.notes}</div>` : ''}
          </div>
        </div>
      `;
    });
  });

  html += '</div>';
  container.innerHTML = html;
}

/**
 * Render case cards
 */
function renderCaseCards(data) {
  const container = document.getElementById('caseCards');
  if (!container) return;

  if (data.length === 0) {
    showEmpty(container, 'ยังไม่มีข้อมูล กรุณาเพิ่มข้อมูลผ่านหน้า Admin');
    return;
  }

  container.innerHTML = data.map((item, idx) => {
    const isDeath = item.status === 'เสียชีวิต';
    return `
      <div class="card casualty-card ${isDeath ? 'death' : ''}">
        <div class="case-header">
          <span class="case-number">กรณีที่ ${idx + 1}</span>
          <span class="case-status ${isDeath ? 'death' : 'injury'}">${item.status || '-'}</span>
        </div>
        <div class="case-detail">
          <span class="detail-label">ชื่อ-สกุล</span>
          <span class="detail-value">${item.victimName || '-'}</span>

          <span class="detail-label">เพศ/อายุ</span>
          <span class="detail-value">${item.gender || '-'} / ${item.age ? item.age + ' ปี' : '-'}</span>

          <span class="detail-label">วันที่/เวลา</span>
          <span class="detail-value">${formatDate(item.date)} ${item.time || ''}</span>

          <span class="detail-label">อำเภอ</span>
          <span class="detail-value">${item.district || '-'}</span>

          <span class="detail-label">สถานที่</span>
          <span class="detail-value">${item.location || '-'}</span>

          <span class="detail-label">ยานพาหนะ</span>
          <span class="detail-value">${item.vehicleType || '-'}</span>

          <span class="detail-label">สาเหตุ</span>
          <span class="detail-value">${item.cause || '-'}</span>

          <span class="detail-label">ประเภทถนน/จุดเกิดเหตุ</span>
          <span class="detail-value">${item.roadType || '-'} (${item.spotType || '-'})</span>

          <span class="detail-label">สถานะผู้ประสบเหตุ</span>
          <span class="detail-value">${item.role || '-'}</span>

          ${item.notes ? `
            <span class="detail-label">หมายเหตุ</span>
            <span class="detail-value">${item.notes}</span>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ========== Utilities ==========

/**
 * Count occurrences by field value
 */
function countBy(data, field) {
  const counts = {};
  data.forEach(r => {
    const key = r[field] || 'ไม่ระบุ';
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}
