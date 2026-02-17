// pwa.js - Complete PWA with installation popup
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('✅ Service Worker registered with scope:', registration.scope);
        
        registration.addEventListener('updatefound', function() {
          console.log('🔄 New service worker installing...');
        });
      })
      .catch(function(error) {
        console.log('❌ Service Worker registration failed:', error);
      });
      
    navigator.serviceWorker.ready.then(function(registration) {
      registration.update();
    });
  });
  
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    console.log('🔄 New service worker activated');
  });
}

// Check if running as PWA
const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
              window.navigator.standalone === true;

if (isPWA) {
  console.log('📱 Running as standalone PWA');
  document.body.classList.add('pwa-mode');
  localStorage.setItem('pwa-mode', 'true');
  
  // Check if first launch after installation
  if (!localStorage.getItem('pwa-first-launch-done')) {
    console.log('📱 First launch after installation');
    localStorage.setItem('pwa-first-launch-done', 'true');
    
    // Show welcome popup after a short delay
    setTimeout(() => {
      showWelcomePopup();
    }, 2000);
  }
} else {
  localStorage.setItem('pwa-mode', 'false');
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
          localStorage.setItem('pwa-installed', 'true');
          // Reset first launch flag for when they open the app
          localStorage.removeItem('pwa-first-launch-done');
        }
        deferredPrompt = null;
      });
    });
  }
});

window.addEventListener('appinstalled', (evt) => {
  console.log('✅ PWA was installed');
  localStorage.setItem('pwa-installed', 'true');
  localStorage.removeItem('pwa-first-launch-done');
  
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  // Show a small toast that installation is complete
  showInstallToast();
});

// Show small toast after installation
function showInstallToast() {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent-success, #10b981);
    color: white;
    padding: 12px 24px;
    border-radius: 30px;
    font-size: 14px;
    font-weight: 600;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
  `;
  toast.innerHTML = '<i class="fas fa-check-circle"></i> App installed! Open from home screen';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove();
    }
  }, 3000);
}

// Show welcome popup on first launch
function showWelcomePopup() {
  // Create popup element
  const popup = document.createElement('div');
  popup.id = 'welcome-popup';
  popup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
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
      max-width: 380px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      border: 1px solid var(--border-color, #2d2d2d);
      animation: slideUp 0.3s ease;
    ">
      <div style="
        width: 70px;
        height: 70px;
        background: var(--gradient-primary);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 15px;
      ">
        <i class="fas fa-bell" style="font-size: 30px; color: white;"></i>
      </div>
      
      <h2 style="color: #6366f1; margin-bottom: 10px; font-size: 22px;">
        Welcome to NERIST Hub!
      </h2>
      
      <p style="margin-bottom: 20px; line-height: 1.5; color: var(--text-secondary); font-size: 14px;">
        Get notified instantly when someone posts lost items, found items, or new services in your campus.
      </p>
      
      <div style="background: var(--bg-secondary, #2d2d2d); padding: 12px; border-radius: 12px; margin-bottom: 20px;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
          <span style="background: rgba(99,102,241,0.15); color: #6366f1; padding: 4px 10px; border-radius: 20px; font-size: 11px;">🔍 Lost Items</span>
          <span style="background: rgba(16,185,129,0.15); color: #10b981; padding: 4px 10px; border-radius: 20px; font-size: 11px;">✅ Found Items</span>
          <span style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 4px 10px; border-radius: 20px; font-size: 11px;">🛒 Marketplace</span>
          <span style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 4px 10px; border-radius: 20px; font-size: 11px;">🚲 Services</span>
        </div>
      </div>
      
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="popup-later" style="
          background: transparent;
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
          flex: 1;
        ">Later</button>
        
        <button id="popup-enable" style="
          background: var(--gradient-primary);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          flex: 1;
        ">Enable</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Add animation styles if not exists
  if (!document.getElementById('popup-styles')) {
    const style = document.createElement('style');
    style.id = 'popup-styles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      #popup-later:hover {
        background: rgba(255,255,255,0.05);
      }
      #popup-enable:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(99,102,241,0.3);
      }
    `;
    document.head.appendChild(style);
  }
  
  // Handle Enable button
  document.getElementById('popup-enable').addEventListener('click', function() {
    popup.remove();
    // Small delay then request permission
    setTimeout(() => {
      if (window.PushManager) {
        window.PushManager.requestPermission();
      } else {
        Notification.requestPermission();
      }
    }, 300);
  });
  
  // Handle Later button
  document.getElementById('popup-later').addEventListener('click', function() {
    popup.remove();
  });
  
  // Close on click outside
  popup.addEventListener('click', function(e) {
    if (e.target === popup) {
      popup.remove();
    }
  });
}

// Network status monitoring
function updateOnlineStatus() {
  const statusElement = document.getElementById('online-status');
  if (statusElement) {
    if (navigator.onLine) {
      statusElement.textContent = 'Online';
      statusElement.className = 'online';
    } else {
      statusElement.textContent = 'Offline';
      statusElement.className = 'offline';
    }
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();
