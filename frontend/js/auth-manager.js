/**
 * Authentication Manager
 * Centralizes authentication state management across the application
 */
const FitZoneAuthManager = (function() {
    // Verify the auth module is loaded
    if (typeof FitZoneAuth === 'undefined') {
        console.error('FitZoneAuth module not found! Make sure auth.js is loaded first.');
        return {};
    }
    
    // State
    let navbarUpdated = false;
    
    /**
     * Initialize the auth manager
     */
    function init() {
        // Update UI on page load
        document.addEventListener('DOMContentLoaded', function() {
            updateAuthUI();
            
            // Add protection to restricted pages
            protectRestrictedPages();
        });
        
        // Listen for auth events
        window.addEventListener('user:login', () => {
            updateAuthUI();
            protectRestrictedPages();
        });
        window.addEventListener('user:logout', () => {
            updateAuthUI();
            // if desired, redirect to home or login
        });
    }
    
    /**
     * Update all UI elements based on authentication state
     */
    function updateAuthUI() {
        const isLoggedIn = FitZoneAuth.isLoggedIn();
        const user = FitZoneAuth.getCurrentUser();
        
        // Update navigation bar
        updateNavbar(isLoggedIn, user);
        
        // Update user info displays
        updateUserInfo(isLoggedIn, user);
        
        // Toggle visibility of elements based on auth state
        updateElementVisibility(isLoggedIn);
    }
    
    /**
     * Update navbar links based on authentication status
     */
    function updateNavbar(isLoggedIn, user) {
        // Avoid duplicate updates in the same page load
        if (navbarUpdated) return;
        
        // Find the login menu item
        const loginLink = document.querySelector('a[href="login.html"]');
        if (!loginLink) return;
        
        const parentLi = loginLink.closest('li');
        if (!parentLi) return;
        
        if (isLoggedIn && user) {
            // Change login link to account link
            loginLink.textContent = user.prenom || 'My Account';
            loginLink.href = 'profile.html';
            parentLi.className = parentLi.className + ' has-dropdown';
            
            // Create dropdown menu for logged-in user
            const dropdownDiv = document.createElement('div');
            dropdownDiv.className = 'dropdown-menu';
            dropdownDiv.innerHTML = `
                <a href="profile.html">My Profile</a>
                <a href="orders.html">My Orders</a>
                <a href="#" id="logout-btn">Logout</a>
            `;
            parentLi.appendChild(dropdownDiv);
            
            // Add logout functionality
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    FitZoneAuth.logout();
                    window.location.href = 'index.html';
                });
            }
        }
        
        navbarUpdated = true;
    }
    
    /**
     * Update user information displays
     */
    function updateUserInfo(isLoggedIn, user) {
        // Update user name displays
        document.querySelectorAll('.user-name').forEach(el => {
            if (isLoggedIn && user) {
                el.textContent = user.prenom || 'User';
            } else {
                el.textContent = '';
            }
        });
        
        // Update user email displays
        document.querySelectorAll('.user-email').forEach(el => {
            if (isLoggedIn && user) {
                el.textContent = user.email || '';
            } else {
                el.textContent = '';
            }
        });
        
        // Update user initials for avatars
        document.querySelectorAll('#user-initials').forEach(el => {
            if (isLoggedIn && user) {
                const initials = getInitials(user.prenom, user.nom);
                el.textContent = initials;
            } else {
                el.textContent = '';
            }
        });
    }
    
    /**
     * Update element visibility based on auth state
     */
    function updateElementVisibility(isLoggedIn) {
        // Show/hide elements that should only appear when logged in
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            el.style.display = isLoggedIn ? '' : 'none';
        });
        
        // Show/hide elements that should only appear when logged out
        document.querySelectorAll('[data-guest-only]').forEach(el => {
            el.style.display = isLoggedIn ? 'none' : '';
        });
    }
    
    /**
     * Protect restricted pages from unauthorized access
     */
    function protectRestrictedPages() {
        const restrictedPages = ['profile.html', 'orders.html', 'checkout.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (restrictedPages.includes(currentPage) && !FitZoneAuth.isLoggedIn()) {
            // Redirect to login with return URL
            window.location.href = `login.html?redirect=${currentPage}`;
        }
        
        // Special case for the login page - redirect if already logged in
        if (currentPage === 'login.html' && FitZoneAuth.isLoggedIn()) {
            const params = new URLSearchParams(window.location.search);
            const redirect = params.get('redirect') || 'index.html';
            window.location.href = redirect;
        }
    }
    
    /**
     * Get initials from first and last name
     */
    function getInitials(firstName, lastName) {
        let initials = '';
        if (firstName) initials += firstName.charAt(0);
        if (lastName) initials += lastName.charAt(0);
        return initials.toUpperCase();
    }
    
    // Initialize the auth manager
    init();
    
    // Public API
    return {
        updateAuthUI,
        protectRestrictedPages
    };
})();

// Log initialization
console.log('FitZoneAuthManager initialized');
