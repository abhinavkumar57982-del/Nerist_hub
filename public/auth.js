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
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
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

  // Get auth headers for FormData (IMPORTANT: No Content-Type header)
  getAuthHeadersFormData: () => {
    const token = localStorage.getItem('token');
    return token ? { 
      'Authorization': token
      // DO NOT set Content-Type header - browser will set it with boundary
    } : {};
  },

  // Logout
  logout: async () => {
    const token = localStorage.getItem('token');
    
    // Call logout API
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': token }
        });
      } catch (error) {
        console.error('Logout API error:', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Dispatch auth state change event
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Redirect to home or login
    if (!window.location.pathname.includes('index.html') && 
        !window.location.pathname.includes('/')) {
      window.location.href = 'index.html';
    } else {
      window.location.reload();
    }
  },

  // Redirect to login if not authenticated
  requireAuth: (redirectUrl = 'login.html') => {
    if (!Auth.isLoggedIn()) {
      Auth.showAlert('Please login to access this feature', 'error');
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
      if (!token) {
        localStorage.removeItem('user');
        return false;
      }

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
      
      // Token is invalid
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
      window.dispatchEvent(new Event('authStateChanged'));
    });
  },

  // Show alert function
  showAlert: (message, type = 'success') => {
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
};

// Initialize auth on load
document.addEventListener('DOMContentLoaded', () => {
  Auth.initAuth();
});

// Export for use in other scripts
window.Auth = Auth;
window.showAlert = Auth.showAlert;
