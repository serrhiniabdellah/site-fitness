/**
 * Auth UI Manager
 * Provides consistent UI updates across all pages based on authentication state
 */

// Global function to update UI elements based on auth state
function updateAuthUI() {
    const isLoggedIn = FitZoneAuth.isLoggedIn();
    const user = FitZoneAuth.getCurrentUser();
    const loginLinks = document.querySelectorAll('a[href="login.html"]');

    loginLinks.forEach(link => {
        if (isLoggedIn && user) {
            link.textContent = user.first_name || 'My Account';
            link.href = 'profile.html';
        } else {
            link.textContent = 'Login';
            link.href = 'login.html';
        }
    });
    
    console.log('Auth UI: Updating - logged in:', isLoggedIn, user ? user.prenom : 'no user data');
    
    loginLinks.forEach(link => {
        // Skip if it's inside the mobile menu close button
        if (link.closest('#close')) return;
        
        if (isLoggedIn && user) {
            // Change login link to account link
            link.textContent = user.prenom || 'My Account';
            link.href = 'profile.html';
            
            // Find the parent li element
            const parentLi = link.closest('li');
            if (!parentLi) return;
            
            // Add logged-in class to parent
            parentLi.classList.add('logged-in');
            
            // Add logout link if it doesn't exist yet
            const logoutLinks = document.querySelectorAll('.logout-link');
            if (logoutLinks.length === 0 && parentLi.parentNode) {
                const logoutLi = document.createElement('li');
                logoutLi.classList.add('logout-item');
                logoutLi.innerHTML = '<a href="#" class="logout-link">Logout</a>';
                
                // Insert after the account link
                parentLi.parentNode.insertBefore(logoutLi, parentLi.nextSibling);
                
                // Add event listener to logout link
                const newLogoutLink = logoutLi.querySelector('.logout-link');
                if (newLogoutLink) {
                    newLogoutLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        console.log('Logout clicked, logging out user');
                        if (typeof FitZoneAuth !== 'undefined') {
                            FitZoneAuth.logout();
                            window.location.href = 'index.html';
                        }
                    });
                }
            }
        } else {
            // Reset to login link
            link.textContent = 'Login';
            link.href = 'login.html';
            
            // Find parent li and remove logged-in class
            const parentLi = link.closest('li');
            if (parentLi) {
                parentLi.classList.remove('logged-in');
            }
            
            // Remove any logout links
            document.querySelectorAll('.logout-item').forEach(el => {
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
            });
        }
    });
    
    // Update user profile elements if present
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = isLoggedIn && user ? user.prenom : '';
    });
    
    document.querySelectorAll('.user-email').forEach(el => {
        el.textContent = isLoggedIn && user ? user.email : '';
    });
    
    document.querySelectorAll('#user-initials').forEach(el => {
        if (isLoggedIn && user && user.prenom && user.nom) {
            const initials = (user.prenom.charAt(0) + user.nom.charAt(0)).toUpperCase();
            el.textContent = initials;
        } else {
            el.textContent = '';
        }
    });
    
    // Toggle element visibility based on auth state
    if (isLoggedIn) {
        // Add logged-in class to body
        document.body.classList.add('logged-in');
        
        // Show elements that require authentication
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            el.style.display = '';
        });
        
        // Hide elements for guests only
        document.querySelectorAll('[data-guest-only]').forEach(el => {
            el.style.display = 'none';
        });
    } else {
        // Remove logged-in class from body
        document.body.classList.remove('logged-in');
        
        // Hide elements that require authentication
        document.querySelectorAll('[data-auth-required]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show elements for guests only
        document.querySelectorAll('[data-guest-only]').forEach(el => {
            el.style.display = '';
        });
    }
    
    // Additional page-specific logic
    const currentPage = window.location.pathname.split('/').pop();
    
    // Protect restricted pages (redirect to login if not logged in)
    const restrictedPages = ['profile.html', 'checkout.html', 'orders.html'];
    if (restrictedPages.includes(currentPage) && !isLoggedIn) {
        console.log('Restricted page accessed while not logged in, redirecting to login');
        window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
    }
}

// Listen for all authentication events
function setupAuthEventListeners() {
    // Standard auth events
    window.addEventListener('user:login', updateAuthUI);
    window.addEventListener('user:logout', updateAuthUI);
    
    // Custom auth events from browser-patches.js
    document.addEventListener('auth:login', updateAuthUI);
    document.addEventListener('auth:logout', updateAuthUI);
    document.addEventListener('auth:storageChange', updateAuthUI);
    
    // Listen for visibility changes (user returns to page)
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            updateAuthUI();
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Run initial UI update
    if (typeof FitZoneAuth !== 'undefined') {
        updateAuthUI();
        setupAuthEventListeners();
    } else {
        console.warn('Auth UI: FitZoneAuth module not loaded, UI updates will be delayed');
        
        // Try again after a short delay (for slow script loading)
        setTimeout(function() {
            if (typeof FitZoneAuth !== 'undefined') {
                updateAuthUI();
                setupAuthEventListeners();
            }
        }, 1000);
    }
});

console.log('Auth UI manager initialized');

document.addEventListener('DOMContentLoaded', function() {
    // Update UI elements based on authentication state
    function updateAuthUI() {
        const isLoggedIn = FitZoneAuth.isLoggedIn();
        const user = FitZoneAuth.getCurrentUser();

        console.log('Auth state changed - User logged in:', isLoggedIn);

        // Declare loginLinks only once
        const loginLinks = document.querySelectorAll('a[href="login.html"]');

        loginLinks.forEach(link => {
            const parentLi = link.closest('li');
            if (!parentLi) return;

            if (isLoggedIn && user) {
                // Change login link to account link
                link.textContent = user.first_name || 'My Account';
                link.href = 'profile.html';

                // Add logout link if it doesn't exist
                const existingLogout = parentLi.parentNode.querySelector('.logout-link');
                if (!existingLogout) {
                    const logoutItem = document.createElement('li');
                    logoutItem.innerHTML = `<a href="#" class="logout-link">Logout</a>`;
                    parentLi.parentNode.appendChild(logoutItem);

                    // Add logout functionality
                    logoutItem.querySelector('.logout-link').addEventListener('click', function(e) {
                        e.preventDefault();
                        FitZoneAuth.logout();
                        window.location.href = 'index.html';
                    });
                }
            } else {
                // Reset to login link
                link.textContent = 'Login';
                link.href = 'login.html';

                // Remove any logout links
                const logoutLinks = parentLi.parentNode.querySelectorAll('.logout-link');
                logoutLinks.forEach(logoutLink => {
                    const logoutLi = logoutLink.closest('li');
                    if (logoutLi) logoutLi.remove();
                });
            }
        });
    }

    // Listen for auth events
    updateAuthUI();
    window.addEventListener('user:login', updateAuthUI);
    window.addEventListener('user:logout', updateAuthUI);
});
