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

/**
 * Utility: Get current theme colors from CSS
 */
function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    blue: style.getPropertyValue('--accent-blue').trim() || '#4f7cff',
    gold: style.getPropertyValue('--accent-gold').trim() || '#ffd740',
    red: style.getPropertyValue('--accent-red').trim() || '#df1b41',
    purple: style.getPropertyValue('--accent-purple').trim() || '#b388ff',
    text: style.getPropertyValue('--text-primary').trim() || '#ffffff',
    secondary: style.getPropertyValue('--text-secondary').trim() || '#9fa8da',
    muted: style.getPropertyValue('--text-muted').trim() || '#5c6bc0',
    grid: 'rgba(255,255,255,0.05)'
  };
}

/**
 * Utility: Get class for value contrast/dimming
 */
function valClass(v) {
  return Number(v || 0) > 0 ? 'v-active' : 'v-zero';
}

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
    <div class="compare-cards mb-xl animate-slide-up">
      ${renderCompareCard('🚗 อุบัติเหตุ', year1.totals.accidents, year2.totals.accidents, year1.year, year2.year, 'accidents')}
      ${renderCompareCard('🏥 บาดเจ็บ', year1.totals.injuries, year2.totals.injuries, year1.year, year2.year, 'injuries')}
      ${renderCompareCard('✝️ เสียชีวิต', year1.totals.deaths, year2.totals.deaths, year1.year, year2.year, 'deaths')}
      ${renderCompareCard('🎯 ดัชนีความรุนแรง (%)',
    year1.totals.accidents > 0 ? (year1.totals.deaths / year1.totals.accidents * 100).toFixed(1) : 0,
    year2.totals.accidents > 0 ? (year2.totals.deaths / year2.totals.accidents * 100).toFixed(1) : 0,
    year1.year, year2.year, 'safe')}
    </div>

    <!-- Daily Comparison Chart -->
    <div class="card mb-xl animate-slide-up delay-1">
      <h3 class="section-title">📊 เปรียบเทียบรายวัน</h3>
      <div class="chart-container" style="min-height:350px">
        <canvas id="compareBarChart"></canvas>
      </div>
    </div>

    <!-- District Comparison -->
    <div class="card mb-xl animate-slide-up delay-2">
      <h3 class="section-title">🏘️ เปรียบเทียบรายอำเภอ</h3>
      <div class="table-wrapper" id="districtCompareTable"></div>
    </div>

    <!-- Policy Comparison -->
    <div class="card mb-xl animate-slide-up delay-3">
      <h3 class="section-title">⚠️ เปรียบเทียบนโยบายเน้นหนัก (ภาพรวม)</h3>
      <div class="grid-2">
        <div class="chart-container" style="min-height:300px">
          <canvas id="comparePolicyChart"></canvas>
        </div>
        <div id="policyCompareCards" class="compare-desktop-only"></div>
      </div>
      
      <h3 class="section-title mt-xl">📅 เปรียบเทียบนโยบายรายวัน (10 รสขม)</h3>
      <div class="table-wrapper animate-slide-up" id="policyDailyTable"></div>
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
  const icon = change.direction === 'increase' ? '🔺' : change.direction === 'decrease' ? '🔽' : '➖';
  // For accidents/injuries/deaths: decrease is good, increase is bad
  const goodDirection = change.direction === 'decrease';

  return `
    <div class="card compare-card">
      <div class="card-title mb-md">${title}</div>
      <div class="compare-values">
        <div class="year-value">
          <div class="value ${type} ${valClass(val1)}">${formatNumber(val1)}</div>
          <div class="year-label">พ.ศ. ${yr1}</div>
        </div>
        <div class="vs-divider">VS</div>
        <div class="year-value">
          <div class="value ${valClass(val2)}" style="color:var(--text-secondary)">${formatNumber(val2)}</div>
          <div class="year-label">พ.ศ. ${yr2}</div>
        </div>
      </div>
      <div class="text-center">
        <span class="change-badge ${change.direction}">
          ${icon} ${change.pct}${change.pct === 'N/A' ? '' : '%'}
        </span>
        <div class="font-sm text-muted mt-sm">
          ${goodDirection ? '✅ ลดลง' : change.direction === 'increase' ? '🔴 เพิ่มขึ้น' : '— เท่าเดิม'}
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
  const colors = getThemeColors();

  compareBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: `อุบัติเหตุ ${year1.year}`,
          data: data1.map(r => Number(r.accidents) || 0),
          backgroundColor: colors.blue,
          borderRadius: 4
        },
        {
          label: `อุบัติเหตุ ${year2.year}`,
          data: data2.map(r => Number(r.accidents) || 0),
          backgroundColor: colors.blue + '44', // 0.3 alpha
          borderRadius: 4
        },
        {
          label: `บาดเจ็บ ${year1.year}`,
          data: data1.map(r => Number(r.injuries) || 0),
          backgroundColor: colors.gold,
          borderRadius: 4
        },
        {
          label: `บาดเจ็บ ${year2.year}`,
          data: data2.map(r => Number(r.injuries) || 0),
          backgroundColor: colors.gold + '44',
          borderRadius: 4
        },
        {
          label: `เสียชีวิต ${year1.year}`,
          data: data1.map(r => Number(r.deaths) || 0),
          backgroundColor: colors.red,
          borderRadius: 4
        },
        {
          label: `เสียชีวิต ${year2.year}`,
          data: data2.map(r => Number(r.deaths) || 0),
          backgroundColor: colors.red + '44',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: colors.secondary, font: { family: 'Prompt' } } }
      },
      scales: {
        x: {
          ticks: { color: colors.muted, font: { family: 'Prompt' } },
          grid: { color: colors.grid }
        },
        y: {
          beginAtZero: true,
          ticks: { color: colors.muted, stepSize: 1, font: { family: 'Prompt' } },
          grid: { color: colors.grid }
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

  let desktopHtml = `
    <table class="compare-table compare-desktop-only">
      <thead>
        <tr>
          <th rowspan="2" class="text-left">ชื่ออำเภอ</th>
          <th colspan="3">พ.ศ. ${year1.year} (ปีปัจจุบัน)</th>
          <th colspan="3" style="background: rgba(255,255,255,0.03)">พ.ศ. ${year2.year} (ปีก่อนหน้า)</th>
          <th rowspan="2">เปลี่ยนเเปลง</th>
        </tr>
        <tr>
          <th>อุบัติเหตุ</th><th>บาดเจ็บ</th><th>เสียชีวิต</th>
          <th style="background: rgba(255,255,255,0.03)">อุบัติเหตุ</th>
          <th style="background: rgba(255,255,255,0.03)">บาดเจ็บ</th>
          <th style="background: rgba(255,255,255,0.03)">เสียชีวิต</th>
        </tr>
      </thead>
      <tbody>
  `;

  let mobileHtml = `
    <div class="compare-mobile-only compare-card-grid">
      <div class="district-compare-card">
        <div class="mobile-metric-row header">
          <div class="mobile-metric-label">อำเภอ / ข้อมูล</div>
          <div class="mobile-metric-value v1">${year1.year}</div>
          <div class="mobile-metric-value v2">${year2.year}</div>
          <div class="mobile-metric-value">แนวโน้ม</div>
        </div>
      </div>
  `;

  DISTRICTS.forEach(name => {
    const d1 = map1[name] || { accidents: 0, injuries: 0, deaths: 0 };
    const d2 = map2[name] || { accidents: 0, injuries: 0, deaths: 0 };
    const total1 = (d1.accidents || 0) + (d1.injuries || 0) + (d1.deaths || 0);
    const total2 = (d2.accidents || 0) + (d2.injuries || 0) + (d2.deaths || 0);
    const change = calcChange(total1, total2);

    desktopHtml += `
      <tr>
        <td class="text-left font-bold">${name}</td>
        <td class="${valClass(d1.accidents)}">${d1.accidents || 0}</td>
        <td class="${d1.injuries > 0 ? 'text-warning' : ''} ${valClass(d1.injuries)} font-bold">${d1.injuries || 0}</td>
        <td class="${d1.deaths > 0 ? 'text-danger' : ''} ${valClass(d1.deaths)} font-bold">${d1.deaths || 0}</td>
        <td style="background: rgba(255,255,255,0.01)" class="${valClass(d2.accidents)}">${d2.accidents || 0}</td>
        <td style="background: rgba(255,255,255,0.01)" class="${d2.injuries > 0 ? 'text-warning' : ''} ${valClass(d2.injuries)}">${d2.injuries || 0}</td>
        <td style="background: rgba(255,255,255,0.01)" class="${d2.deaths > 0 ? 'text-danger' : ''} ${valClass(d2.deaths)}">${d2.deaths || 0}</td>
        <td><span class="change-badge ${change.direction} mini">${change.pct}${change.pct === 'N/A' ? '' : '%'}</span></td>
      </tr>
    `;

    // Mobile Section
    const metrics = [
      { label: 'อุบัติเหตุ', v1: d1.accidents, v2: d2.accidents, c: calcChange(d1.accidents, d2.accidents) },
      { label: 'บาดเจ็บ', v1: d1.injuries, v2: d2.injuries, c: calcChange(d1.injuries, d2.injuries) },
      { label: 'เสียชีวิต', v1: d1.deaths, v2: d2.deaths, c: calcChange(d1.deaths, d2.deaths) }
    ];

    mobileHtml += `
      <div class="district-compare-card active">
        <div class="district-name">
          <span>${name}</span>
          <span class="change-badge ${change.direction} mini">${change.pct}${change.pct === 'N/A' ? '' : '%'}</span>
        </div>
        ${metrics.map(m => `
          <div class="mobile-metric-row">
            <div class="mobile-metric-label">${m.label}</div>
            <div class="mobile-metric-value v1 ${valClass(m.v1)}">${m.v1 || 0}</div>
            <div class="mobile-metric-value v2">${m.v2 || 0}</div>
            <div class="mobile-metric-value">
              <span class="trend-icon ${m.c.direction}">${m.c.direction === 'increase' ? '🔺' : m.c.direction === 'decrease' ? '🔽' : '—'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  });

  desktopHtml += '</tbody></table>';
  mobileHtml += '</div>';
  container.innerHTML = desktopHtml + mobileHtml;
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
  const colors = getThemeColors();

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
          borderColor: colors.blue,
          backgroundColor: colors.blue + '33',
          pointBackgroundColor: colors.blue
        },
        {
          label: `พ.ศ. ${year2.year}`,
          data: data2,
          borderColor: colors.purple,
          backgroundColor: colors.purple + '33',
          pointBackgroundColor: colors.purple
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: colors.secondary, font: { family: 'Prompt' } } }
      },
      scales: {
        r: {
          beginAtZero: true,
          ticks: { color: colors.muted, backdropColor: 'transparent', font: { family: 'Prompt', size: 10 } },
          grid: { color: colors.grid },
          pointLabels: { color: colors.secondary, font: { family: 'Prompt', size: 10 } }
        }
      }
    }
  });

  // Policy compare list (Fixed Alignment & Sorted)
  const cardsContainer = document.getElementById('policyCompareCards');
  if (cardsContainer) {
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
          <span class="stat-number ${valClass(item.v1)}">${formatNumber(item.v1)}</span>
          <span class="stat-vs">vs</span>
          <span class="stat-number text-secondary ${valClass(item.v2)}">${formatNumber(item.v2)}</span>
          <div class="stat-badge-wrap">
            <span class="change-badge ${change.direction} mini">${change.pct}${change.pct === 'N/A' ? '' : '%'}</span>
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
  const daily1 = (year1.policy && year1.policy.daily) ? year1.policy.daily : [];
  const daily2 = (year2.policy && year2.policy.daily) ? year2.policy.daily : [];

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

  let desktopHtml = `
    <table class="compare-table policy-daily-table compare-desktop-only">
      <thead>
        <tr>
          <th class="text-left">หัวข้อ / วันที่</th>
          ${fest.dates.map(d => `<th>${formatDateShort(`2000-${d}`)}</th>`).join('')}
          <th class="total-cell">รวม</th>
        </tr>
      </thead>
      <tbody>
  `;

  let mobileHtml = `<div class="compare-mobile-only">`;

  // Sort policies by total (year1) descending
  const sortedPolicies = [...POLICY_DEFS].sort((a, b) => {
    const valA = (year1.policy && year1.policy[a.key]) || 0;
    const valB = (year1.policy && year1.policy[b.key]) || 0;
    return valB - valA;
  });

  sortedPolicies.forEach(p => {
    let rowTotal1 = (year1.policy && year1.policy[p.key]) || 0;
    let rowTotal2 = (year2.policy && year2.policy[p.key]) || 0;
    const totalChange = calcChange(rowTotal1, rowTotal2);

    desktopHtml += `
      <tr>
        <td class="policy-name text-left font-bold">${p.emoji} ${p.label}</td>
        ${fest.dates.map((d, idx) => {
      const v1 = map1[d] ? (Number(map1[d][p.key]) || 0) : 0;
      const v2 = map2[d] ? (Number(map2[d][p.key]) || 0) : 0;

      let dayTrendHtml = '';
      let changeDayText = '(ไม่มีข้อมูลวันก่อนหน้า)';
      if (idx > 0) {
        const prevD = fest.dates[idx - 1];
        const v1Prev = map1[prevD] ? (Number(map1[prevD][p.key]) || 0) : 0;
        const changeDay = calcChange(v1, v1Prev);
        const iconDay = changeDay.direction === 'increase' ? '↑' : changeDay.direction === 'decrease' ? '↓' : '-';
        dayTrendHtml = `<span class="trend-icon ${changeDay.direction}">${iconDay}</span>`;
        changeDayText = `เทียบวันก่อนหน้า (${v1Prev}): ${iconDay} ${changeDay.pct}${changeDay.pct === 'N/A' ? '' : '%'}`;
      }

      const changeYear = calcChange(v1, v2);
      const iconYear = changeYear.direction === 'increase' ? '▲' : changeYear.direction === 'decrease' ? '▼' : '•';
      const yearTrendHtml = `<span class="trend-icon ${changeYear.direction}">${iconYear}</span>`;

      const tooltipText = `ปี ${year1.year}: ${v1} | ปี ${year2.year}: ${v2}\nเทียบปี ${year2.year}: ${iconYear} ${changeYear.pct}${changeYear.pct === 'N/A' ? '' : '%'}\n${changeDayText}`;

      return `
            <td class="daily-cell" title="${tooltipText}">
              <div class="cell-main">
                <span class="v1 ${valClass(v1)}">${v1}</span>
                <div class="trends">
                  ${dayTrendHtml}
                  ${yearTrendHtml}
                </div>
              </div>
            </td>
          `;
    }).join('')}
        <td class="total-cell" title="รวมปี ${year1.year}: ${rowTotal1} | รวมปี ${year2.year}: ${rowTotal2}\nเปลี่ยนแปลง: ${totalChange.pct}${totalChange.pct === 'N/A' ? '' : '%'}">
          <div class="cell-main">
            <span class="v1 strong ${valClass(rowTotal1)}">${rowTotal1}</span>
            <div class="trends">
              <span class="trend-icon ${totalChange.direction}">
                ${totalChange.direction === 'increase' ? '▲' : totalChange.direction === 'decrease' ? '▼' : '•'}
              </span>
            </div>
          </div>
        </td>
      </tr>
    `;

    // Mobile Section
    let dailyDetailsHtml = '<div class="policy-mobile-details" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--glass-border);">';
    fest.dates.forEach((d, idx) => {
      const v1 = map1[d] ? (Number(map1[d][p.key]) || 0) : 0;
      const v2 = map2[d] ? (Number(map2[d][p.key]) || 0) : 0;
      const changeYear = calcChange(v1, v2);
      const icon = changeYear.direction === 'increase' ? '🔺' : changeYear.direction === 'decrease' ? '🔽' : '—';

      dailyDetailsHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px dashed var(--glass-border); font-size: 0.85rem;">
          <div style="color: var(--text-secondary);">${formatDateShort(`2000-${d}`)}</div>
          <div style="display: flex; gap: 16px; align-items: center; justify-content: flex-end; width: 60%;">
             <span class="${valClass(v1)}" style="font-weight:600; width: 30%; text-align:right;">${v1}</span>
             <span style="color:var(--text-muted); width: 30%; text-align:right;">${v2}</span>
             <span style="width: 20%; text-align:right;" class="${changeYear.direction === 'increase' ? 'text-danger' : changeYear.direction === 'decrease' ? 'text-success' : 'text-muted'}">${icon}</span>
          </div>
        </div>
      `;
    });
    dailyDetailsHtml += '</div>';

    mobileHtml += `
      <div class="policy-mobile-item" style="border-left-color: ${p.color}">
        <div class="policy-mobile-header" style="cursor: pointer;" onclick="const d = this.parentElement.querySelector('.policy-mobile-details'); const i = this.querySelector('.toggle-icon'); if(d.style.display==='none'){d.style.display='block'; i.style.transform='rotate(180deg)';}else{d.style.display='none'; i.style.transform='rotate(0deg)';}">
          <div class="policy-mobile-title">
            ${p.emoji} ${p.label}
            <svg class="toggle-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.3s; margin-left: 4px; color: var(--text-muted);"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
          <span class="change-badge ${totalChange.direction} mini">${totalChange.pct}${totalChange.pct === 'N/A' ? '' : '%'}</span>
        </div>
        <div class="policy-mobile-grid">
          <div class="policy-mobile-val-box">
            <span class="val v1 ${valClass(rowTotal1)}">${rowTotal1}</span>
            <span class="lbl">ปี ${year1.year}</span>
          </div>
          <div class="policy-mobile-val-box">
            <span class="val v2">${rowTotal2}</span>
            <span class="lbl">ปี ${year2.year}</span>
          </div>
          <div class="policy-mobile-val-box">
            <span class="val trend ${totalChange.direction}">
              ${totalChange.direction === 'increase' ? '🔺' : totalChange.direction === 'decrease' ? '🔽' : '—'}
            </span>
            <span class="lbl">แนวโน้ม</span>
          </div>
        </div>
        ${dailyDetailsHtml}
      </div>
    `;
  });

  desktopHtml += '</tbody></table>';
  mobileHtml += '</div>';
  container.innerHTML = desktopHtml + mobileHtml;
}
