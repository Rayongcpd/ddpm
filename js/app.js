/**
 * app.js - Dashboard Main Logic
 * หน้า Dashboard หลักสำหรับแสดงข้อมูลสรุป
 */

// ========== State ==========
let currentYear = new Date().getFullYear() + 543; // ปี พ.ศ.
let currentFestival = 'songkran';
let dashboardData = null;
let trendChart = null;
let districtChart = null;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', async () => {
  initControls();
  await loadDashboard();
});

/**
 * Initialize year/festival controls
 */
function initControls() {
  const yearSelect = document.getElementById('yearSelect');
  const festivalSelect = document.getElementById('festivalSelect');

  // Populate year options (current year ± 5)
  const thisYear = new Date().getFullYear() + 543;
  for (let y = thisYear; y >= thisYear - 10; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = `พ.ศ. ${y}`;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }

  yearSelect.addEventListener('change', () => {
    currentYear = yearSelect.value;
    loadDashboard();
  });

  festivalSelect.addEventListener('change', () => {
    currentFestival = festivalSelect.value;
    updateFestivalBadge();
    loadDashboard();
  });

  updateFestivalBadge();
}

function updateFestivalBadge() {
  const badge = document.getElementById('festivalBadge');
  const fest = FESTIVALS[currentFestival];
  if (badge && fest) {
    badge.className = `festival-badge ${fest.cssClass}`;
    badge.innerHTML = `${fest.emoji} เทศกาล${fest.name} ${fest.dateRange}`;
  }
}

/**
 * Load all dashboard data
 */
async function loadDashboard() {
  const mainContent = document.getElementById('mainContent');
  showLoading(mainContent);

  try {
    const result = await fetchDashboard(currentYear, currentFestival);

    if (result.success) {
      dashboardData = result.data;
      renderDashboard();
    } else {
      showEmpty(mainContent, 'ไม่สามารถโหลดข้อมูลได้');
      showToast(result.error?.message || 'เกิดข้อผิดพลาด', 'error');
    }
  } catch (error) {
    // If API not configured, show demo data
    console.warn('API error, showing empty state:', error.message);
    dashboardData = {
      daily: [],
      districts: [],
      policy: { drunkDriving: 0, noSeatbelt: 0, noHelmet: 0, speeding: 0, daily: [] },
      casualties: [],
      config: { province: 'สุโขทัย' }
    };
    renderDashboard();
  }
}

// ========== Render Functions ==========

function renderDashboard() {
  const mainContent = document.getElementById('mainContent');
  const { daily, districts, policy, casualties, config } = dashboardData;
  const fest = FESTIVALS[currentFestival];
  const province = config?.province || 'สุโขทัย';

  // Calculate totals
  const totalAccidents = daily.reduce((s, r) => s + (Number(r.accidents) || 0), 0);
  const totalInjuries = daily.reduce((s, r) => s + (Number(r.injuries) || 0), 0);
  const totalDeaths = daily.reduce((s, r) => s + (Number(r.deaths) || 0), 0);

  // Today's data (last entry)
  const today = daily.length > 0 ? daily[daily.length - 1] : null;
  const todayAccidents = today ? Number(today.accidents) || 0 : 0;
  const todayInjuries = today ? Number(today.injuries) || 0 : 0;
  const todayDeaths = today ? Number(today.deaths) || 0 : 0;

  // Total casualties
  const totalCasualties = casualties ? casualties.length : 0;

  mainContent.innerHTML = `
    <!-- Page Header -->
    <div class="page-header">
      <h1>🚦 สถิติอุบัติเหตุทางถนน จังหวัด${province}</h1>
      <div class="subtitle">
        ศูนย์ปฏิบัติการป้องกันและลดอุบัติเหตุทางถนน ช่วงเทศกาล${fest.name} พ.ศ. ${currentYear}
      </div>
      <div class="report-date">
        📅 ข้อมูล ณ วันที่ ${today ? formatDate(today.date) : '-'} | สะสม ${daily.length} วัน
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card summary-card accidents">
        <div class="card-header">
          <span class="card-title">อุบัติเหตุ (ครั้ง)</span>
          <div class="card-icon accidents">🚗</div>
        </div>
        <div class="summary-value accidents">${formatNumber(totalAccidents)}</div>
        <div class="summary-sub">
          วันนี้ <span>${formatNumber(todayAccidents)}</span> ครั้ง | สะสม <span>${formatNumber(totalAccidents)}</span> ครั้ง
        </div>
      </div>

      <div class="card summary-card injuries">
        <div class="card-header">
          <span class="card-title">บาดเจ็บ (ราย)</span>
          <div class="card-icon injuries">🏥</div>
        </div>
        <div class="summary-value injuries">${formatNumber(totalInjuries)}</div>
        <div class="summary-sub">
          วันนี้ <span>${formatNumber(todayInjuries)}</span> ราย | สะสม <span>${formatNumber(totalInjuries)}</span> ราย
        </div>
      </div>

      <div class="card summary-card deaths">
        <div class="card-header">
          <span class="card-title">เสียชีวิต (ราย)</span>
          <div class="card-icon deaths">✝️</div>
        </div>
        <div class="summary-value deaths">${formatNumber(totalDeaths)}</div>
        <div class="summary-sub">
          วันนี้ <span>${formatNumber(todayDeaths)}</span> ราย | สะสม <span>${formatNumber(totalDeaths)}</span> ราย
        </div>
      </div>
    </div>

    <!-- Daily Table + Trend Chart -->
    <div class="grid-2 mb-xl">
      <div class="card">
        <h3 class="section-title">📊 สถิติรายวัน 7 วัน ช่วงควบคุมเข้มข้น</h3>
        <div class="table-wrapper" id="dailyTable"></div>
      </div>
      <div class="card">
        <h3 class="section-title">📈 กราฟแนวโน้ม</h3>
        <div class="chart-container">
          <canvas id="trendChart"></canvas>
        </div>
      </div>
    </div>

    <!-- District Cards Section -->
    <div class="card mb-xl">
      <div class="district-cards-header">
        <h3 class="section-title" style="margin-bottom: 0;">📍 สถิติรายอำเภอ</h3>
        <div class="district-sort-control">
          <label class="form-label" style="margin-bottom: 0;">เรียงตาม:</label>
          <select class="form-control" id="districtSortSelect" style="width: auto; padding-top: 4px; padding-bottom: 4px;">
            <option value="name">🔤 ชื่ออำเภอ</option>
            <option value="accidents_desc">🚗 อุบัติเหตุ (มากไปน้อย)</option>
            <option value="injuries_desc">🏥 บาดเจ็บ (มากไปน้อย)</option>
            <option value="deaths_desc">✝️ เสียชีวิต (มากไปน้อย)</option>
          </select>
        </div>
      </div>
      <div class="district-cards-grid" id="districtCardsGrid"></div>
    </div>

    <!-- Policy Stats -->
    <div class="card mb-xl">
      <h3 class="section-title">⚠️ นโยบายเน้นหนัก (คดีสะสม)</h3>
      <div class="policy-cards" id="policyCards"></div>
    </div>
  `;

  // Render sub-components
  renderDailyTable(daily);
  renderTrendChart(daily);
  renderDistrictCards(districts, 'name');
  initDistrictSorting(districts);
  renderPolicyCards(policy);
}

/**
 * Render daily statistics table
 */
function renderDailyTable(daily) {
  const container = document.getElementById('dailyTable');
  if (!daily || daily.length === 0) {
    showEmpty(container, 'ยังไม่มีข้อมูลรายวัน');
    return;
  }

  const totalA = daily.reduce((s, r) => s + (Number(r.accidents) || 0), 0);
  const totalI = daily.reduce((s, r) => s + (Number(r.injuries) || 0), 0);
  const totalD = daily.reduce((s, r) => s + (Number(r.deaths) || 0), 0);

  let html = `
    <table>
      <thead>
        <tr>
          <th>วันที่</th>
          <th>อุบัติเหตุ (ครั้ง)</th>
          <th>บาดเจ็บ (ราย)</th>
          <th>เสียชีวิต (ราย)</th>
        </tr>
      </thead>
      <tbody>
  `;

  daily.forEach(row => {
    const deaths = Number(row.deaths) || 0;
    const injuries = Number(row.injuries) || 0;
    html += `
      <tr>
        <td>${formatDate(row.date)}</td>
        <td>${formatNumber(row.accidents)}</td>
        <td class="${injuries > 0 ? 'text-warning' : ''}">${formatNumber(injuries)}</td>
        <td class="${deaths > 0 ? 'text-danger' : ''}">${formatNumber(deaths)}</td>
      </tr>
    `;
  });

  html += `
      <tr class="table-total">
        <td>รวม</td>
        <td>${formatNumber(totalA)}</td>
        <td>${formatNumber(totalI)}</td>
        <td>${formatNumber(totalD)}</td>
      </tr>
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

/**
 * Render trend line chart
 */
function renderTrendChart(daily) {
  if (trendChart) trendChart.destroy();
  const ctx = document.getElementById('trendChart');
  if (!ctx || !daily || daily.length === 0) return;

  const labels = daily.map(r => formatDateShort(r.date));

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'อุบัติเหตุ',
          data: daily.map(r => Number(r.accidents) || 0),
          borderColor: '#4f7cff',
          backgroundColor: 'rgba(79,124,255,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8
        },
        {
          label: 'บาดเจ็บ',
          data: daily.map(r => Number(r.injuries) || 0),
          borderColor: '#ffd740',
          backgroundColor: 'rgba(255,215,64,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8
        },
        {
          label: 'เสียชีวิต',
          data: daily.map(r => Number(r.deaths) || 0),
          borderColor: '#ff5252',
          backgroundColor: 'rgba(255,82,82,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: '#9fa8da', font: { family: 'Prompt' } }
        }
      },
      scales: {
        x: {
          ticks: { color: '#5c6bc0', font: { family: 'Prompt' } },
          grid: { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#5c6bc0', stepSize: 1, font: { family: 'Prompt' } },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}


/**
 * Render district cards grid
 */
function renderDistrictCards(districts, sortBy = 'name') {
  const container = document.getElementById('districtCardsGrid');
  if (!container) return;

  const districtMap = {};
  if (districts) {
    districts.forEach(d => { districtMap[d.district] = d; });
  }

  // Create array of 9 districts with complete data
  let cardsData = DISTRICTS.map(name => {
    const d = districtMap[name] || { accidents: 0, injuries: 0, deaths: 0 };
    return {
      name,
      accidents: Number(d.accidents) || 0,
      injuries: Number(d.injuries) || 0,
      deaths: Number(d.deaths) || 0
    };
  });

  // Sorting logic
  if (sortBy === 'accidents_desc') {
    cardsData.sort((a, b) => b.accidents - a.accidents);
  } else if (sortBy === 'injuries_desc') {
    cardsData.sort((a, b) => b.injuries - a.injuries);
  } else if (sortBy === 'deaths_desc') {
    cardsData.sort((a, b) => b.deaths - a.deaths);
  }

  container.innerHTML = cardsData.map(d => {
    let cardClass = 'district-card';
    if (d.deaths > 0) cardClass += ' has-death';
    else if (d.injuries > 0) cardClass += ' has-injury';
    else if (d.accidents > 0) cardClass += ' has-data';

    return `
      <div class="${cardClass}">
        <div class="district-card-header">
          <div class="district-card-title">อ.${d.name}</div>
        </div>
        <div class="district-stats-container">
          <div class="district-stat-row">
            <span class="district-stat-label">🚗 อุบัติเหตุ</span>
            <span class="district-stat-value accidents">${d.accidents}</span>
          </div>
          <div class="district-stat-row">
            <span class="district-stat-label">🏥 บาดเจ็บ</span>
            <span class="district-stat-value injuries">${d.injuries}</span>
          </div>
          <div class="district-stat-row">
            <span class="district-stat-label">✝️ เสียชีวิต</span>
            <span class="district-stat-value deaths">${d.deaths}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Initialize district sorting control
 */
function initDistrictSorting(districts) {
  const select = document.getElementById('districtSortSelect');
  if (!select) return;
  
  const newSelect = select.cloneNode(true);
  select.parentNode.replaceChild(newSelect, select);
  
  newSelect.addEventListener('change', (e) => {
    renderDistrictCards(districts, e.target.value);
  });
}

/**
 * Render policy enforcement cards
 */
function renderPolicyCards(policy) {
  const container = document.getElementById('policyCards');
  if (!container) return;

  const items = [
    { icon: '🍺', label: 'ดื่มแล้วขับ', value: policy.drunkDriving || 0, color: 'var(--accent-red)', bg: 'rgba(255,82,82,0.12)' },
    { icon: '🚫', label: 'ไม่คาดเข็มขัด', value: policy.noSeatbelt || 0, color: 'var(--accent-orange)', bg: 'rgba(255,152,0,0.12)' },
    { icon: '⛑️', label: 'ไม่สวมหมวกนิรภัย', value: policy.noHelmet || 0, color: 'var(--accent-gold)', bg: 'rgba(255,215,64,0.12)' },
    { icon: '🏎️', label: 'ขับรถเร็วเกินกำหนด', value: policy.speeding || 0, color: 'var(--accent-purple)', bg: 'rgba(179,136,255,0.12)' }
  ];

  container.innerHTML = items.map(item => `
    <div class="card policy-card">
      <div class="policy-icon" style="background:${item.bg}; color:${item.color}">
        ${item.icon}
      </div>
      <div>
        <div class="policy-value" style="color:${item.color}">${formatNumber(item.value)}</div>
        <div class="policy-label">${item.label}</div>
        <div class="policy-unit">คน</div>
      </div>
    </div>
  `).join('');
}

/**
 * Print report
 */
function printReport() {
  window.print();
}

/**
 * Secret Admin Login Triggers
 * - วิธีที่ 1: พิมพ์คำว่า "admin" ที่คีย์บอร์ด (สำหรับคอมพิวเตอร์)
 * - วิธีที่ 2: กดคลิกที่โลโก้ 🚦 5 ครั้งติดกัน (สำหรับมือถือ)
 */

// 1. Keyboard trigger
let secretKeys = '';
document.addEventListener('keydown', (e) => {
  secretKeys += e.key.toLowerCase();
  if (secretKeys.length > 10) {
    secretKeys = secretKeys.slice(-10);
  }
  if (secretKeys.includes('admin')) {
    window.location.href = 'admin.html';
  }
});

// 2. Click trigger (Mobile support)
document.addEventListener('DOMContentLoaded', () => {
  let logoClickCount = 0;
  let logoClickTimer = null;
  
  // แนบ Event ไปที่ไอคอน 🚦 (ส่วนใหญ่จะมีคลาส .emoji อยู่ใน .navbar-brand)
  const logoEmoji = document.querySelector('.navbar-brand .emoji') || document.querySelector('.navbar-brand');
  
  if (logoEmoji) {
    logoEmoji.addEventListener('click', (e) => {
      // ถ้าเป็นลิงก์ ไม่ต้องหยุด default ก็ได้ เผื่อ user กดทีเดียวจะได้ไปหน้าแรกปกติ
      // แต่เรานับเผื่อไว้
      
      logoClickCount++;
      if (logoClickTimer) clearTimeout(logoClickTimer);
      
      if (logoClickCount >= 5) {
        e.preventDefault(); // กันเด้งไปหน้าแรกถ้าคลิกถึง 5
        window.location.href = 'admin.html';
      } else {
        // จำกัดเวลาคลิกให้ต่อเนื่องภายใน 2 วินาที
        logoClickTimer = setTimeout(() => {
          logoClickCount = 0;
        }, 2000); 
      }
    });
  }
});
