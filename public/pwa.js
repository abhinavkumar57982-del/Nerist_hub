// pwa.js - Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('✅ Service Worker registered with scope:', registration.scope);
      })
      .catch(function(error) {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Check if running as PWA
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) {
  console.log('📱 Running as standalone PWA');
  document.body.classList.add('pwa-mode');
}

// Install prompt
let deferredPrompt;
const installButton = document.getElementById('installPWA');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  if (installButton) {
    installButton.style.display = 'flex';
    
    installButton.addEventListener('click', (e) => {
      installButton.style.display = 'none';
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('✅ User accepted the install prompt');
        }
        deferredPrompt = null;
      });
    });
  }
});

window.addEventListener('appinstalled', (evt) => {
  console.log('✅ PWA was installed');
  if (installButton) {
    installButton.style.display = 'none';
  }
});

// Network status monitoring
function updateOnlineStatus() {
  const statusElement = document.getElementById('online-status');
  if (statusElement) {
    if (navigator.onLine) {
      statusElement.textContent = 'Online';
      statusElement.className = 'online';
    } else {
      statusElement.textContent = 'Offline - Some features may be limited';
      statusElement.className = 'offline';
    }
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();
