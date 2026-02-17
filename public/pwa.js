// pwa.js - Service Worker Registration with Welcome Popup
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
  if (!sessionStorage.getItem('pwa-launched')) {
    console.log('📱 First launch of PWA detected');
    sessionStorage.setItem('pwa-launched', 'true');
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
          
          // Set a flag that installation just happened
          localStorage.setItem('just-installed', 'true');
        }
        deferredPrompt = null;
      });
    });
  }
});

window.addEventListener('appinstalled', (evt) => {
  console.log('✅ PWA was installed');
  localStorage.setItem('pwa-mode', 'true');
  localStorage.setItem('just-installed', 'true');
  
  // Clear session storage to ensure first launch detection works
  sessionStorage.removeItem('pwa-launched');
  localStorage.setItem('pwa-first-launch', 'false');
  
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  // Show welcome popup after a short delay
  setTimeout(() => {
    showWelcomePopup();
  }, 1500);
});

// Function to show welcome popup
function showWelcomePopup() {
  // Check if already shown
  if (localStorage.getItem('welcome-popup-shown') === 'true') {
    // If already shown but just installed, maybe show again?
    if (localStorage.getItem('just-installed') !== 'true') {
      return;
    }
  }
  
  // Create popup element
  const popup = document.createElement('div');
  popup.id = 'welcome-popup';
  popup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
  `;
  
  popup.innerHTML = `
    <div style="
      background: var(--bg-card, #1e1e1e);
      color: var(--text-primary, white);
      padding: 30px;
      border-radius: 20px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      border: 1px solid var(--border-color, #2d2d2d);
      animation: slideUp 0.3s ease;
    ">
      <div style="
        width: 80px;
        height: 80px;
        background: var(--gradient-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      ">
        <i class="fas fa-check" style="font-size: 40px; color: white;"></i>
      </div>
      
      <h2 style="color: #6366f1; margin-bottom: 15px; font-size: 24px;">
        🎉 Installation Complete!
      </h2>
      
      <p style="margin-bottom: 20px; line-height: 1.6; color: var(--text-secondary);">
        Thank you for installing NERIST Campus Hub! Would you like to enable notifications to stay updated about new posts, lost items, and campus activities?
      </p>
      
      <div style="background: var(--bg-secondary, #2d2d2d); padding: 15px; border-radius: 12px; margin-bottom: 25px;">
        <p style="margin: 0; font-size: 14px; display: flex; align-items: center; gap: 10px; color: var(--text-primary);">
          <i class="fas fa-bell" style="color: #6366f1; font-size: 18px;"></i>
          <span>Get notified about:</span>
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; justify-content: center;">
          <span style="background: rgba(99,102,241,0.1); color: #6366f1; padding: 4px 12px; border-radius: 20px; font-size: 12px;">🔍 Lost Items</span>
          <span style="background: rgba(16,185,129,0.1); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 12px;">✅ Found Items</span>
          <span style="background: rgba(245,158,11,0.1); color: #f59e0b; padding: 4px 12px; border-radius: 20px; font-size: 12px;">🛒 Marketplace</span>
          <span style="background: rgba(239,68,68,0.1); color: #ef4444; padding: 4px 12px; border-radius: 20px; font-size: 12px;">🚲 Services</span>
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="welcome-later-btn" style="
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          flex: 1;
          transition: all 0.2s ease;
        ">Maybe Later</button>
        
        <button id="welcome-enable-btn" style="
          background: var(--gradient-primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          flex: 1;
          transition: all 0.2s ease;
        ">Enable Notifications</button>
      </div>
      
      <p style="margin-top: 15px; font-size: 12px; color: var(--text-secondary);">
        <i class="fas fa-info-circle"></i> You can always change this later in settings
      </p>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Add animation styles if not exists
  if (!document.getElementById('popup-animation-styles')) {
    const style = document.createElement('style');
    style.id = 'popup-animation-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #welcome-later-btn:hover {
        background: var(--border-color);
      }
      #welcome-enable-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Handle "Enable Notifications" button
  document.getElementById('welcome-enable-btn').addEventListener('click', function() {
    popup.remove();
    localStorage.setItem('welcome-popup-shown', 'true');
    localStorage.removeItem('just-installed');
    
    // Small delay to ensure popup is closed
    setTimeout(() => {
      if (window.PushManager) {
        window.PushManager.requestPermission();
      } else {
        // Fallback
        Notification.requestPermission();
      }
    }, 300);
  });
  
  // Handle "Maybe Later" button
  document.getElementById('welcome-later-btn').addEventListener('click', function() {
    popup.remove();
    localStorage.setItem('welcome-popup-shown', 'true');
    localStorage.removeItem('just-installed');
  });
  
  // Close on click outside
  popup.addEventListener('click', function(e) {
    if (e.target === popup) {
      popup.remove();
      localStorage.setItem('welcome-popup-shown', 'true');
      localStorage.removeItem('just-installed');
    }
  });
  
  // Mark as shown
  localStorage.setItem('welcome-popup-shown', 'true');
}

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
