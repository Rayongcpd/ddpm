/**
 * Mobile Navigation Toggle Logic
 * Handles opening and closing the sidebar menu on mobile devices.
 */
document.addEventListener('DOMContentLoaded', () => {
    const mainNav = document.getElementById('mainNav');
    if (!mainNav) return;

    const navContainer = mainNav.querySelector('.container, .container-wide');
    const navList = mainNav.querySelector('.navbar-nav');
    
    if (!navContainer || !navList) return;

    // 1. Create hamburger button if it doesn't exist
    let toggleBtn = mainNav.querySelector('.nav-toggle');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'nav-toggle';
        toggleBtn.id = 'navToggle';
        toggleBtn.setAttribute('aria-label', 'เปิดเมนู');
        toggleBtn.innerHTML = '<span></span><span></span><span></span>';
        
        // Find navbar-nav and insert toggle before or after depending on layout
        // Inserting before navbar-nav for standard flex alignment
        navContainer.insertBefore(toggleBtn, navList);
    }

    // 2. Toggle logic
    const toggleMenu = () => {
        const isActive = navList.classList.toggle('active');
        toggleBtn.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isActive ? 'hidden' : '';
    };

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // 3. Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navList.classList.contains('active') && 
            !navList.contains(e.target) && 
            !toggleBtn.contains(e.target)) {
            toggleMenu();
        }
    });

    // 4. Close menu when clicking on a link
    navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navList.classList.contains('active')) {
                toggleMenu();
            }
        });
    });
});
