document.addEventListener('DOMContentLoaded', function() {
  console.log('Auth debug:');
  console.log('Token exists:', !!localStorage.getItem('token'));
  console.log('User exists:', !!localStorage.getItem('user'));
  
  if (window.Auth) {
    console.log('Auth module loaded');
    console.log('Is logged in:', window.Auth.isLoggedIn());
    console.log('Current user:', window.Auth.getCurrentUser());
  } else {
    console.log('Auth module NOT loaded');
  }
});