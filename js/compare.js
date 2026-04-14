/**
 * compare.js - Year-over-Year Comparison Logic
 * เปรียบเทียบข้อมูลสถิติระหว่าง 2 ปี
 */

// ========== State ==========
let compareYear1 = new Date().getFullYear() + 543;
let compareYear2 = compareYear1 - 1;
let compareFestival = 'songkran';
let compareBarChart = null;
let comparePolicyChart = null;

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
  initCompareControls();
});

function initCompareControls() {
  const year1Select = document.getElementById('compareYear1');
  const year2Select = document.getElementById('compareYear2');
  const festivalSelect = document.getElementById('compareFestival');

  const thisYear = new Date().getFullYear() + 543;

  [year1Select, year2Select].forEach((select, idx) => {
    if (!select) return;
    for (let y = thisYear; y >= thisYear - 10; y--) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = `พ.ศ. ${y}`;
      if ((idx === 0 && y === compareYear1) || (idx === 1 && y === compareYear2)) {
        opt.selected = true;
      }
      select.appendChild(opt);
    }
  });

  if (year1Select) {
    year1Select.addEventListener('change', () => {
      compareYear1 = year1Select.value;
      loadComparison();
    });
  }

  if (year2Select) {
    year2Select.addEventListener('change', () => {
      compareYear2 = year2Select.value;
      loadComparison();
    });
  }

  if (festivalSelect) {
    festivalSelect.addEventListener('change', () => {
      compareFestival = festivalSelect.value;
      loadComparison();
    });
  }

  loadComparison();
}

/**
 * Load comparison data
 */
async function loadComparison() {
  const content = document.getElementById('compareContent');
  showLoading(content);

  try {
    const result = await fetchComparison(compareYear1, compareYear2, compareFestival);

    if (result.success) {
      renderComparison(result.data);
    } else {
      showEmpty(content, 'ไม่สามารถโหลดข้อมูลเปรียบเทียบ');
    }
  } catch (error) {
    console.warn('Comparison error:', error);
    // Show empty comparison
    renderComparison({
      year1: { year: compareYear1, totals: { accidents: 0, injuries: 0, deaths: 0 }, daily: [], districts: [], policy: { drunkDriving: 0, noSeatbelt: 0, noHelmet: 0, speeding: 0 }, casualtyCount: 0 },
      year2: { year: compareYear2, totals: { accidents: 0, injuries: 0, deaths: 0 }, daily: [], districts: [], policy: { drunkDriving: 0, noSeatbelt: 0, noHelmet: 0, speeding: 0 }, casualtyCount: 0 }
    });
  }
}

/**
 * Render comparison
 */
function renderComparison(data) {
  const content = document.getElementById('compareContent');
  const { year1, year2 } = data;
  const fest = FESTIVALS[compareFestival];

  content.innerHTML = `
    <!-- Summary Comparison -->
    <div class="compare-cards mb-xl">
      ${renderCompareCard('🚗 อุบัติเหตุ', year1.totals.accidents, year2.totals.accidents, year1.year, year2.year, 'accidents')}
      ${renderCompareCard('🏥 บาดเจ็บ', year1.totals.injuries, year2.totals.injuries, year1.year, year2.year, 'injuries')}
      ${renderCompareCard('✝️ เสียชีวิต', year1.totals.deaths, year2.totals.deaths, year1.year, year2.year, 'deaths')}
      ${renderCompareCard('🎯 ดัชนีความรุนแรง (%)', 
        year1.totals.accidents > 0 ? (year1.totals.deaths / year1.totals.accidents * 100).toFixed(1) : 0, 
        year2.totals.accidents > 0 ? (year2.totals.deaths / year2.totals.accidents * 100).toFixed(1) : 0, 
        year1.year, year2.year, 'safe')}
    </div>

    <!-- Daily Comparison Chart -->
    <div class="card mb-xl">
      <h3 class="section-title">📊 เปรียบเทียบรายวัน</h3>
      <div class="chart-container" style="min-height:350px">
        <canvas id="compareBarChart"></canvas>
      </div>
    </div>

    <!-- District Comparison -->
    <div class="card mb-xl">
      <h3 class="section-title">🏘️ เปรียบเทียบรายอำเภอ</h3>
      <div class="table-wrapper" id="districtCompareTable"></div>
    </div>

    <!-- Policy Comparison -->
    <div class="card mb-xl">
      <h3 class="section-title">⚠️ เปรียบเทียบนโยบายเน้นหนัก (ภาพรวม)</h3>
      <div class="grid-2">
        <div class="chart-container" style="min-height:300px">
          <canvas id="comparePolicyChart"></canvas>
        </div>
        <div id="policyCompareCards"></div>
      </div>
      
      <h3 class="section-title mt-xl">📅 เปรียบเทียบนโยบายรายวัน (10 รสขม)</h3>
      <div class="table-wrapper" id="policyDailyTable"></div>
    </div>
  `;

  renderCompareBarChart(year1, year2);
  renderDistrictCompareTable(year1, year2);
  renderPolicyCompareChart(year1, year2);
  renderPolicyDailyTable(year1, year2);
}

/**
 * Render a single comparison card
 */
function renderCompareCard(title, val1, val2, yr1, yr2, type) {
  const change = calcChange(val1, val2);
  const icon = change.direction === 'increase' ? '📈' : change.direction === 'decrease' ? '📉' : '➡️';
  // For accidents/injuries/deaths: decrease is good, increase is bad
  const goodDirection = change.direction === 'decrease';

  return `
    <div class="card compare-card">
      <div class="card-title mb-md">${title}</div>
      <div class="compare-values">
        <div class="year-value">
          <div class="value ${type}">${formatNumber(val1)}</div>
          <div class="year-label">พ.ศ. ${yr1}</div>
        </div>
        <div class="vs-divider">VS</div>
        <div class="year-value">
          <div class="value" style="color:var(--text-secondary)">${formatNumber(val2)}</div>
          <div class="year-label">พ.ศ. ${yr2}</div>
        </div>
      </div>
      <div class="text-center">
        <span class="change-badge ${change.direction}">
          ${icon} ${change.pct}%
        </span>
        <div class="font-sm text-muted mt-sm">
          ${goodDirection ? '✅ ลดลง' : change.direction === 'increase' ? '⚠️ เพิ่มขึ้น' : '— เท่าเดิม'}
          เทียบกับปี ${yr2}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render comparison bar chart (grouped)
 */
function renderCompareBarChart(year1, year2) {
  if (compareBarChart) compareBarChart.destroy();
  const ctx = document.getElementById('compareBarChart');
  if (!ctx) return;

  const fest = FESTIVALS[compareFestival];
  const labels = fest.dates.map(d => formatDateShort(`2000-${d}`));

  const mapDaily = (daily) => {
    const byDay = {};
    daily.forEach(r => {
      const dayPart = String(r.date).slice(-5);
      byDay[dayPart] = r;
    });
    return fest.dates.map(d => byDay[d] || { accidents: 0, injuries: 0, deaths: 0 });
  };

  const data1 = mapDaily(year1.daily);
  const data2 = mapDaily(year2.daily);

  compareBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: `อุบัติเหตุ ${year1.year}`,
          data: data1.map(r => Number(r.accidents) || 0),
          backgroundColor: 'rgba(79,124,255,0.8)',
          borderRadius: 4
        },
        {
          label: `อุบัติเหตุ ${year2.year}`,
          data: data2.map(r => Number(r.accidents) || 0),
          backgroundColor: 'rgba(79,124,255,0.3)',
          borderRadius: 4
        },
        {
          label: `บาดเจ็บ ${year1.year}`,
          data: data1.map(r => Number(r.injuries) || 0),
          backgroundColor: 'rgba(255,215,64,0.8)',
          borderRadius: 4
        },
        {
          label: `บาดเจ็บ ${year2.year}`,
          data: data2.map(r => Number(r.injuries) || 0),
          backgroundColor: 'rgba(255,215,64,0.3)',
          borderRadius: 4
        },
        {
          label: `เสียชีวิต ${year1.year}`,
          data: data1.map(r => Number(r.deaths) || 0),
          backgroundColor: 'rgba(223,27,65,0.8)',
          borderRadius: 4
        },
        {
          label: `เสียชีวิต ${year2.year}`,
          data: data2.map(r => Number(r.deaths) || 0),
          backgroundColor: 'rgba(223,27,65,0.3)',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#9fa8da', font: { family: 'Prompt' } } }
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
 * Render district comparison table
 */
function renderDistrictCompareTable(year1, year2) {
  const container = document.getElementById('districtCompareTable');
  if (!container) return;

  const map1 = {};
  const map2 = {};
  if (year1.districts) year1.districts.forEach(d => { map1[d.district] = d; });
  if (year2.districts) year2.districts.forEach(d => { map2[d.district] = d; });

  let html = `
    <table>
      <thead>
        <tr>
          <th rowspan="2">อำเภอ</th>
          <th colspan="3">พ.ศ. ${year1.year}</th>
          <th colspan="3">พ.ศ. ${year2.year}</th>
          <th rowspan="2">เปลี่ยนแปลง</th>
        </tr>
        <tr>
          <th>อุบัติเหตุ</th><th>บาดเจ็บ</th><th>เสียชีวิต</th>
          <th>อุบัติเหตุ</th><th>บาดเจ็บ</th><th>เสียชีวิต</th>
        </tr>
      </thead>
      <tbody>
  `;

  DISTRICTS.forEach(name => {
    const d1 = map1[name] || { accidents: 0, injuries: 0, deaths: 0 };
    const d2 = map2[name] || { accidents: 0, injuries: 0, deaths: 0 };
    const total1 = (d1.accidents || 0) + (d1.injuries || 0) + (d1.deaths || 0);
    const total2 = (d2.accidents || 0) + (d2.injuries || 0) + (d2.deaths || 0);
    const change = calcChange(total1, total2);

    html += `
      <tr>
        <td class="text-left">${name}</td>
        <td>${d1.accidents || 0}</td>
        <td class="${d1.injuries > 0 ? 'text-warning' : ''}">${d1.injuries || 0}</td>
        <td class="${d1.deaths > 0 ? 'text-danger' : ''}">${d1.deaths || 0}</td>
        <td>${d2.accidents || 0}</td>
        <td class="${d2.injuries > 0 ? 'text-warning' : ''}">${d2.injuries || 0}</td>
        <td class="${d2.deaths > 0 ? 'text-danger' : ''}">${d2.deaths || 0}</td>
        <td><span class="change-badge ${change.direction}">${change.pct}%</span></td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

/**
 * Render policy comparison chart
 */
function renderPolicyCompareChart(year1, year2) {
  if (comparePolicyChart) comparePolicyChart.destroy();
  const ctx = document.getElementById('comparePolicyChart');
  if (!ctx) return;

  const p1 = year1.policy || {};
  const p2 = year2.policy || {};

  const labels = POLICY_DEFS.map(d => d.label);
  const data1 = POLICY_DEFS.map(d => p1[d.key] || 0);
  const data2 = POLICY_DEFS.map(d => p2[d.key] || 0);

  comparePolicyChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [
        {
          label: `พ.ศ. ${year1.year}`,
          data: data1,
          borderColor: '#4f7cff',
          backgroundColor: 'rgba(79,124,255,0.2)',
          pointBackgroundColor: '#4f7cff'
        },
        {
          label: `พ.ศ. ${year2.year}`,
          data: data2,
          borderColor: '#b388ff',
          backgroundColor: 'rgba(179,136,255,0.2)',
          pointBackgroundColor: '#b388ff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#9fa8da', font: { family: 'Prompt' } } }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: { color: '#5c6bc0', backdropColor: 'transparent', font: { family: 'Prompt', size: 10 } },
          grid: { color: 'rgba(255,255,255,0.1)' },
          pointLabels: { color: '#9fa8da', font: { family: 'Prompt', size: 10 } }
        }
      }
    }
  });

  // Policy compare list (Fixed Alignment & Sorted)
  const cardsContainer = document.getElementById('policyCompareCards');
  if (cardsContainer) {
    // Corrected sort:
    const sortedItems = POLICY_DEFS.map(item => ({
      ...item,
      v1: p1[item.key] || 0,
      v2: p2[item.key] || 0
    })).sort((a, b) => b.v1 - a.v1);

    cardsContainer.innerHTML = sortedItems.map(item => {
      const change = calcChange(item.v1, item.v2);
      
      return `
        <div class="stat-mini mb-md">
          <span class="stat-label">${item.emoji} ${item.label}</span>
          <span class="stat-number">${formatNumber(item.v1)}</span>
          <span class="stat-vs">vs</span>
          <span class="stat-number text-secondary">${formatNumber(item.v2)}</span>
          <div class="stat-badge-wrap">
            <span class="change-badge ${change.direction}">${change.pct}%</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

/**
 * Render policy daily comparison table
 */
function renderPolicyDailyTable(year1, year2) {
  const container = document.getElementById('policyDailyTable');
  if (!container) return;

  const fest = FESTIVALS[compareFestival];
  const daily1 = year1.policy.daily || [];
  const daily2 = year2.policy.daily || [];

  // Map data by [datePart (MM-DD)][policyKey]
  const map1 = {};
  const map2 = {};
  daily1.forEach(r => { 
    const dStr = String(r.date);
    const dayPart = dStr.includes('-') ? dStr.slice(-5) : dStr;
    map1[dayPart] = r; 
  });
  daily2.forEach(r => { 
    const dStr = String(r.date);
    const dayPart = dStr.includes('-') ? dStr.slice(-5) : dStr;
    map2[dayPart] = r; 
  });

  let html = `
    <table class="policy-daily-table">
      <thead>
        <tr>
          <th>หัวข้อ / วันที่</th>
          ${fest.dates.map(d => `<th>${formatDateShort(`2000-${d}`)}</th>`).join('')}
          <th class="total-cell">รวม</th>
        </tr>
      </thead>
      <tbody>
  `;

  POLICY_DEFS.forEach(p => {
    let rowTotal1 = year1.policy[p.key] || 0;
    let rowTotal2 = year2.policy[p.key] || 0;
    const totalChange = calcChange(rowTotal1, rowTotal2);

    html += `
      <tr>
        <td class="policy-name">${p.emoji} ${p.label}</td>
        ${fest.dates.map(d => {
          const v1 = map1[d] ? (Number(map1[d][p.key]) || 0) : 0;
          const v2 = map2[d] ? (Number(map2[d][p.key]) || 0) : 0;
          const change = calcChange(v1, v2);
          const icon = change.direction === 'increase' ? '📈' : change.direction === 'decrease' ? '📉' : '';

          return `
            <td class="daily-cell">
              <div class="cell-vals">
                <span class="v1">${v1}</span>
                <span class="vs">vs</span>
                <span class="v2">${v2}</span>
              </div>
              <span class="change-badge mini ${change.direction}">${icon} ${change.pct}%</span>
            </td>
          `;
        }).join('')}
        <td class="total-cell">
          <div class="cell-vals">
            <span class="v1 strong">${rowTotal1}</span>
            <span class="vs">vs</span>
            <span class="v2">${rowTotal2}</span>
          </div>
          <span class="change-badge ${totalChange.direction}">
            ${totalChange.pct}%
          </span>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>' ;
  container.innerHTML = html;
}
