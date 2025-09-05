// auth.js
// This function checks if a user is logged in.
// If they are not, it redirects them to the login page.
// We will call this on any page we want to protect (like dashboard.html).
function checkAuth() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        // Prevents infinite loop if we are already on the login page
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
    }
}

// This function handles user logout.
// It clears the login status from storage.
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}