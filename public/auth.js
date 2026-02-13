// Authentication utilities for frontend
const Auth = {
  // Check if user is logged in
  isLoggedIn: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get auth headers for JSON requests
  getAuthHeaders: (contentType = 'application/json') => {
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers['Authorization'] = token;
    }
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    return headers;
  },

  // Get auth headers for FormData (no Content-Type header)
  getAuthHeadersFormData: () => {
    const token = localStorage.getItem('token');
    return token ? { 
      'Authorization': token
    } : {};
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch auth state change event
    window.dispatchEvent(new Event('authStateChanged'));
    
    window.location.href = 'login.html';
  },

  // Redirect to login if not authenticated
  requireAuth: (redirectUrl = 'login.html') => {
    if (!Auth.isLoggedIn()) {
      showAlert('Please login to access this feature', 'error');
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
      return false;
    }
    return true;
  },

  // Check auth status with server
  checkAuthStatus: async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;

      const response = await fetch('/api/auth/check', {
        headers: { 'Authorization': token }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.loggedIn && data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          return true;
        }
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return false;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  },

  // Initialize auth for fetch requests
  initAuth: () => {
    Auth.checkAuthStatus().then(isAuthenticated => {
      console.log('Auth status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    });
  }
};

// Show alert function
function showAlert(message, type = 'success') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
    ${message}
  `;
  
  document.body.insertBefore(alert, document.body.firstChild);
  
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

// Initialize auth on load
Auth.initAuth();

// Export for use in other scripts
window.Auth = Auth;
window.showAlert = showAlert;