// Responsive JavaScript functionality
// Hamburger menu and mobile navigation

document.addEventListener('DOMContentLoaded', function() {
    initResponsiveNavigation();
    initMobileOptimizations();
    handleResize();
    
    // Listen for window resize events
    window.addEventListener('resize', handleResize);
});

// Initialize responsive navigation
function initResponsiveNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (hamburger && navMenu) {
        // Toggle menu on hamburger click
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                closeMobileMenu();
            }
        });

        // Close menu when clicking on nav links (mobile)
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 768) {
                    closeMobileMenu();
                }
            });
        });

        // Handle escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMobileMenu();
            }
        });
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        const isOpen = navMenu.classList.contains('active');
        
        if (isOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }
}

// Open mobile menu
function openMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.classList.add('active');
        navMenu.classList.add('active');
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        navMenu.setAttribute('aria-expanded', 'true');
        hamburger.setAttribute('aria-expanded', 'true');
        
        // Focus first nav link
        const firstNavLink = navMenu.querySelector('.nav-link');
        if (firstNavLink) {
            setTimeout(() => firstNavLink.focus(), 100);
        }
    }
}

// Close mobile menu
function closeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    
    if (hamburger && navMenu) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Update ARIA attributes
        navMenu.setAttribute('aria-expanded', 'false');
        hamburger.setAttribute('aria-expanded', 'false');
    }
}

// Handle window resize
function handleResize() {
    const navMenu = document.getElementById('navMenu');
    
    // Close mobile menu on desktop resize
    if (window.innerWidth >= 768 && navMenu) {
        closeMobileMenu();
    }
    
    // Adjust grid layout based on screen size
    adjustGridLayout();
}

// Adjust grid layout based on screen size
function adjustGridLayout() {
    const grids = document.querySelectorAll('.grid');
    
    grids.forEach(grid => {
        // Reset classes
        grid.className = 'grid';
        
        if (window.innerWidth >= 1024) {
            // Desktop: 3 columns
            grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        } else if (window.innerWidth >= 768) {
            // Tablet: 2 columns
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            // Mobile: 1 column
            grid.style.gridTemplateColumns = '1fr';
        }
    });
}

// Initialize mobile-specific optimizations
function initMobileOptimizations() {
    // Touch-friendly interactions
    addTouchSupport();
    
    // Optimize images for mobile
    optimizeImagesForMobile();
    
    // Add smooth scrolling for anchor links
    addSmoothScrolling();
}

// Add touch support for interactive elements
function addTouchSupport() {
    const interactiveElements = document.querySelectorAll('button, .card, .filter-btn');
    
    interactiveElements.forEach(element => {
        element.addEventListener('touchstart', function() {
            this.style.transform = 'scale(0.98)';
        });
        
        element.addEventListener('touchend', function() {
            this.style.transform = '';
        });
    });
}

// Optimize images for mobile devices
function optimizeImagesForMobile() {
    if (window.innerWidth <= 768) {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" for better performance
            img.setAttribute('loading', 'lazy');
            
            // Ensure images are responsive
            if (!img.style.maxWidth) {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }
        });
    }
}

// Add smooth scrolling for internal links
function addSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility function to check if device is mobile
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Add viewport height fix for mobile browsers
function fixMobileViewportHeight() {
    if (isMobileDevice()) {
        const setVH = () => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
    }
}

// Initialize mobile viewport fix
fixMobileViewportHeight();

// Export functions for use in other scripts
window.ResponsiveUtils = {
    toggleMobileMenu,
    openMobileMenu,
    closeMobileMenu,
    isMobileDevice,
    adjustGridLayout
};