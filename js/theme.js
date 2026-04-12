/**
 * theme.js - Theme Management (Dark/Light Mode)
 */

(function() {
    // 1. ตรวจสอบค่าที่บันทึกไว้ หรือใช้ระบบปฏิบัติการ
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // กำหนดธีมเริ่มต้น
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    // 2. ฟังก์ชันหลักสำหรับสลับธีม
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        console.log(`Theme switched to: ${newTheme}`);
    }

    // 3. แนบ Event หลังจาก DOM โหลดเสร็จ
    document.addEventListener('DOMContentLoaded', () => {
        const toggleButtons = document.querySelectorAll('.theme-toggle');
        
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleTheme();
            });
        });
    });
})();
