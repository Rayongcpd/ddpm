/**
 * auth.js - Admin Authentication Manager
 * จัดการ Login/Logout และ Session
 */

const AUTH_STORAGE_KEY = 'ddpm_admin_token';
const AUTH_EXPIRY_KEY = 'ddpm_admin_expiry';

/**
 * Login admin
 * @param {string} password - Raw password
 * @returns {Promise<boolean>}
 */
async function adminLogin(password) {
  try {
    const result = await loginAdmin(password);

    if (result.success && result.data) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, result.data.token);
      sessionStorage.setItem(AUTH_EXPIRY_KEY, result.data.expiresAt);
      return true;
    }

    const msg = result.error?.message || 'เข้าสู่ระบบไม่สำเร็จ';
    showToast(msg, 'error');
    return false;
  } catch (error) {
    showToast('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', 'error');
    console.error('Login error:', error);
    return false;
  }
}

/**
 * Logout admin
 */
function adminLogout() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_EXPIRY_KEY);
  showToast('ออกจากระบบสำเร็จ', 'success');
}

/**
 * Check if admin is logged in
 * @returns {boolean}
 */
function isAdminLoggedIn() {
  const token = sessionStorage.getItem(AUTH_STORAGE_KEY);
  const expiry = sessionStorage.getItem(AUTH_EXPIRY_KEY);

  if (!token || !expiry) return false;

  // Check expiry
  if (Number(expiry) < Date.now()) {
    adminLogout();
    return false;
  }

  return true;
}

/**
 * Get auth token
 * @returns {string|null}
 */
function getAuthToken() {
  if (!isAdminLoggedIn()) return null;
  return sessionStorage.getItem(AUTH_STORAGE_KEY);
}

/**
 * Update UI based on auth state
 */
function updateAuthUI() {
  const loggedIn = isAdminLoggedIn();

  // Toggle login/logout elements
  document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
    el.style.display = loggedIn ? '' : 'none';
  });

  document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
    el.style.display = loggedIn ? 'none' : '';
  });

  // Toggle edit buttons
  document.querySelectorAll('[data-auth="admin-only"]').forEach(el => {
    el.style.display = loggedIn ? '' : 'none';
  });
}
