/**
 * api.js - API Service Layer
 * จัดการการสื่อสารกับ Google Apps Script Backend
 */

// ========== CONFIGURATION ==========
// NOTE: เปลี่ยน URL นี้เป็น URL ของ Google Apps Script ที่ Deploy แล้ว
const API_CONFIG = {
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyxbjX3UDBQYwoUejXMlJy7Ve4jQGb_g_Vvkvka-MbwTRfg-bwexapWiGekg86ECN2jrg/exec',
  TIMEOUT: 30000
};

// ========== Festival Config ==========
const FESTIVALS = {
  songkran: {
    name: 'สงกรานต์',
    emoji: '🎉',
    dateRange: '10-16 เมษายน',
    dates: ['04-10', '04-11', '04-12', '04-13', '04-14', '04-15', '04-16'],
    cssClass: 'songkran'
  },
  newyear: {
    name: 'ปีใหม่',
    emoji: '🎄',
    dateRange: '29 ธ.ค. - 4 ม.ค.',
    dates: ['12-29', '12-30', '12-31', '01-01', '01-02', '01-03', '01-04'],
    cssClass: 'newyear'
  }
};

// ========== District Config ==========
const DISTRICTS = [
  'เมืองสุโขทัย',
  'ศรีสำโรง',
  'สวรรคโลก',
  'ศรีนคร',
  'ทุ่งเสลี่ยม',
  'ศรีสัชนาลัย',
  'กงไกรลาศ',
  'คีรีมาศ',
  'บ้านด่านลานหอย'
];

// ========== Policy Definitions (10 รสขม) ==========
const POLICY_DEFS = [
  { key: 'speeding', label: 'ขับรถเร็วเกินกำหนด', emoji: '🏎️', color: 'var(--accent-purple)', bg: 'rgba(179,136,255,0.12)' },
  { key: 'wrongSide', label: 'ขับรถย้อนศร', emoji: '↩️', color: '#ff7043', bg: 'rgba(255,112,67,0.12)' },
  { key: 'redLight', label: 'ฝ่าไฟแดง', emoji: '🚥', color: '#ef5350', bg: 'rgba(239,83,80,0.12)' },
  { key: 'noSeatbelt', label: 'ไม่คาดเข็มขัด', emoji: '🚫', color: 'var(--accent-orange)', bg: 'rgba(255,152,0,0.12)' },
  { key: 'noLicense', label: 'ไม่มีใบขับขี่', emoji: '🆔', color: '#42a5f5', bg: 'rgba(66,165,245,0.12)' },
  { key: 'dangerousOvertaking', label: 'แซงในที่คับขัน', emoji: '⚠️', color: '#ffa726', bg: 'rgba(255,167,38,0.12)' },
  { key: 'drunkDriving', label: 'เมาสุรา', emoji: '🍺', color: 'var(--accent-red)', bg: 'rgba(255,82,82,0.12)' },
  { key: 'noHelmet', label: 'ไม่สวมหมวกนิรภัย', emoji: '⛑️', color: 'var(--accent-gold)', bg: 'rgba(255,215,64,0.12)' },
  { key: 'unsafeVehicle', label: 'รถไม่ปลอดภัย', emoji: '🛠️', color: '#78909c', bg: 'rgba(120,144,156,0.12)' },
  { key: 'mobilePhone', label: 'ใช้โทรศัพท์มืิอถือ', emoji: '📱', color: '#26a69a', bg: 'rgba(38,166,154,0.12)' }
];

// ========== API Functions ==========

/**
 * Generic GET request
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>}
 */
async function apiGet(params) {
  const url = new URL(API_CONFIG.SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      url.searchParams.append(k, v);
    }
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - กรุณาลองใหม่');
    }
    throw error;
  }
}

/**
 * Generic POST request
 * @param {Object} data - Request body
 * @returns {Promise<Object>}
 */
async function apiPost(data) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(API_CONFIG.SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data),
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - กรุณาลองใหม่');
    }
    throw error;
  }
}

// ========== READ Operations ==========

/**
 * ดึงข้อมูล Dashboard ทั้งหมด
 */
async function fetchDashboard(year, festival) {
  return apiGet({ action: 'getDashboard', year, festival });
}

/**
 * ดึงข้อมูลรายวัน
 */
async function fetchDailyStats(year, festival) {
  return apiGet({ action: 'getDaily', year, festival });
}

/**
 * ดึงข้อมูลรายอำเภอ
 */
async function fetchDistrictStats(year, festival) {
  return apiGet({ action: 'getDistricts', year, festival });
}

/**
 * ดึงข้อมูลนโยบาย
 */
async function fetchPolicyStats(year, festival) {
  return apiGet({ action: 'getPolicy', year, festival });
}

/**
 * ดึงรายละเอียดบาดเจ็บ/เสียชีวิต
 */
async function fetchCasualties(year, festival) {
  return apiGet({ action: 'getCasualties', year, festival });
}

/**
 * ดึงข้อมูลเปรียบเทียบ
 */
async function fetchComparison(year1, year2, festival) {
  return apiGet({ action: 'getCompare', year1, year2, festival });
}

/**
 * ดึงปีที่มีข้อมูล
 */
async function fetchAvailableYears() {
  return apiGet({ action: 'getYears' });
}

/**
 * ดึง config
 */
async function fetchConfig() {
  return apiGet({ action: 'getConfig' });
}

// ========== WRITE Operations ==========

/**
 * Login admin
 */
async function loginAdmin(password) {
  return apiPost({ action: 'login', password });
}

/**
 * บันทึกข้อมูลรายวัน
 */
async function saveDailyData(payload, token) {
  return apiPost({ action: 'saveDaily', payload, token });
}

/**
 * บันทึกข้อมูลรายอำเภอ
 */
async function saveDistrictData(payload, token) {
  return apiPost({ action: 'saveDistrict', payload, token });
}

/**
 * บันทึกข้อมูลนโยบาย
 */
async function savePolicyData(payload, token) {
  return apiPost({ action: 'savePolicy', payload, token });
}

/**
 * บันทึกรายละเอียดบาดเจ็บ/เสียชีวิต
 */
async function saveCasualtyData(payload, token) {
  return apiPost({ action: 'saveCasualty', payload, token });
}

/**
 * ลบรายละเอียดบาดเจ็บ/เสียชีวิต
 */
async function deleteCasualtyData(id, token) {
  return apiPost({ action: 'deleteCasualty', id, token });
}

/**
 * ลบข้อมูลรายวัน
 */
async function deleteDailyData(payload, token) {
  return apiPost({ action: 'deleteDaily', payload, token });
}

/**
 * ลบข้อมูลรายอำเภอ
 */
async function deleteDistrictData(payload, token) {
  return apiPost({ action: 'deleteDistrict', payload, token });
}

// ========== UTILITY ==========

/**
 * แสดง toast notification
 */
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  // Auto-remove after 4s
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Show loading spinner
 */
function showLoading(container) {
  if (typeof container === 'string') {
    container = document.getElementById(container);
  }
  if (container) {
    container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  }
}

/**
 * Show empty state
 */
function showEmpty(container, message = 'ยังไม่มีข้อมูล') {
  if (typeof container === 'string') {
    container = document.getElementById(container);
  }
  if (container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>${message}</p>
      </div>
    `;
  }
}

/**
 * Format number with commas
 */
function formatNumber(n) {
  return Number(n || 0).toLocaleString('th-TH');
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = String(dateStr);
  // Handle YYYY-MM-DD or MM-DD format
  const parts = d.split('-');
  if (parts.length === 3) {
    const months = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                     'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const m = parseInt(parts[1]);
    const day = parseInt(parts[2]);
    return `${day} ${months[m]} ${parts[0]}`;
  }
  return d;
}

/**
 * Get short date (without year)
 */
function formatDateShort(dateStr) {
  if (!dateStr) return '-';
  const parts = String(dateStr).split('-');
  if (parts.length >= 2) {
    const months = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                     'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const m = parseInt(parts.length === 3 ? parts[1] : parts[0]);
    const day = parseInt(parts.length === 3 ? parts[2] : parts[1]);
    return `${day} ${months[m]}`;
  }
  return dateStr;
}

/**
 * Get festival dates for a given year
 */
function getFestivalDates(festival, year) {
  const config = FESTIVALS[festival];
  if (!config) return [];

  return config.dates.map(d => {
    if (festival === 'newyear' && d.startsWith('01-')) {
      // New year dates in January are next year
      return `${Number(year) + 1}-${d}`;
    }
    return `${year}-${d}`;
  });
}

/**
 * Calculate percentage change
 */
function calcChange(current, previous) {
  if (!previous || previous === 0) {
    return current > 0 ? { pct: 100, direction: 'increase' } : { pct: 0, direction: 'neutral' };
  }
  const pct = ((current - previous) / previous * 100).toFixed(1);
  if (pct > 0) return { pct: `+${pct}`, direction: 'increase' };
  if (pct < 0) return { pct, direction: 'decrease' };
  return { pct: '0', direction: 'neutral' };
}
