// pwa.js - Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('✅ Service Worker registered with scope:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', function() {
          console.log('🔄 New service worker installing...');
        });
      })
      .catch(function(error) {
        console.log('❌ Service Worker registration failed:', error);
      });
      
    // Check for updates on page load
    navigator.serviceWorker.ready.then(function(registration) {
      registration.update();
    });
  });
  
  // Handle controller change (new service worker activated)
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    console.log('🔄 New service worker activated');
  });
}

// Check if running as PWA and store in localStorage
const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
              window.navigator.standalone === true;

if (isPWA) {
  console.log('📱 Running as standalone PWA');
  document.body.classList.add('pwa-mode');
  localStorage.setItem('pwa-mode', 'true');
  
  // Set a flag for first launch detection
  // This will be used by push-notifications.js
  if (!sessionStorage.getItem('pwa-launched')) {
    console.log('📱 First launch of PWA detected');
    sessionStorage.setItem('pwa-launched', 'true');
    // Store a flag that this is first launch
    localStorage.setItem('pwa-first-launch', 'true');
  } else {
    console.log('📱 Subsequent PWA launch');
    localStorage.setItem('pwa-first-launch', 'false');
  }
} else {
  localStorage.setItem('pwa-mode', 'false');
  localStorage.setItem('pwa-first-launch', 'false');
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
          localStorage.setItem('pwa-mode', 'true');
          // Don't set first launch flag here - will be set when they actually open the app
        }
        deferredPrompt = null;
      });
    });
  }
});

window.addEventListener('appinstalled', (evt) => {
  console.log('✅ PWA was installed - notifications will be requested on next launch');
  localStorage.setItem('pwa-mode', 'true');
  // Clear session storage to ensure first launch detection works
  sessionStorage.removeItem('pwa-launched');
  localStorage.setItem('pwa-first-launch', 'false'); // Reset for next launch
  
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
