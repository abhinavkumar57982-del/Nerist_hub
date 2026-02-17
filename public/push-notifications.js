// public/push-notifications.js - Only shows when PWA is launched from home screen

const PushManager = {
  vapidPublicKey: null,
  
  // Initialize
  async init() {
    console.log('🔔 Initializing Push Manager...');
    
    if (!this.isSupported()) {
      console.log('❌ Push notifications not supported in this browser');
      return false;
    }
    
    // Check if this is a launched PWA (from home screen)
    const isLaunchedPWA = this.isLaunchedPWA();
    
    if (!isLaunchedPWA) {
      console.log('🌐 Not launched as PWA - no notification UI');
      this.hideButton();
      return false;
    }
    
    console.log('📱 Launched as PWA from home screen - managing notifications');
    
    // Get VAPID public key from server
    const keyObtained = await this.getVapidKey();
    if (!keyObtained) {
      return false;
    }
    
    // Check current permission state
    await this.checkPermissionAndUpdateUI();
    
    return true;
  },
  
  // Check permission and update UI accordingly
  async checkPermissionAndUpdateUI() {
    console.log('📱 Current notification permission:', Notification.permission);
    
    // Handle based on permission state
    if (Notification.permission === 'granted') {
      console.log('✅ Permission granted, subscribing...');
      await this.subscribe();
      this.hideButton();
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.log('❌ Permission is denied');
      this.showButton(true);
      return false;
    }
    
    // If default (not asked yet), request permission automatically
    if (Notification.permission === 'default') {
      console.log('🔔 PWA launched, requesting notification permission...');
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        this.attemptPermissionRequest();
      }, 1000);
    }
    
    return true;
  },
  
  // Check if this is a launched PWA (from home screen)
  isLaunchedPWA() {
    // Check if in standalone mode (installed to home screen and launched)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    
    // Also check if it's been launched after installation
    const hasLaunchedBefore = sessionStorage.getItem('pwa-launched') === 'true';
    
    if (isStandalone && !hasLaunchedBefore) {
      // First time launch after installation
      sessionStorage.setItem('pwa-launched', 'true');
      console.log('📱 First launch of installed PWA');
      return true;
    }
    
    return isStandalone;
  },
  
  // Check if push notifications are supported
  isSupported() {
    const supported = 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
    
    console.log('🔧 Push notifications supported:', supported);
    return supported;
  },
  
  // Get VAPID public key from server
  async getVapidKey() {
    try {
      const response = await fetch('/api/push/vapid-public-key');
      if (!response.ok) {
        throw new Error('Failed to get VAPID key');
      }
      const data = await response.json();
      this.vapidPublicKey = data.publicKey;
      console.log('✅ Got VAPID public key');
      return true;
    } catch (error) {
      console.error('❌ Failed to get VAPID key:', error);
      return false;
    }
  },
  
  // Attempt to request permission
  async attemptPermissionRequest() {
    try {
      console.log('🔔 Requesting notification permission (PWA launched)...');
      
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permission granted, subscribing...');
        await this.subscribe();
        this.hideButton();
      } else if (permission === 'denied') {
        console.log('❌ Permission denied by user');
        this.showButton(true);
      }
    } catch (error) {
      console.error('❌ Error during permission request:', error);
    }
  },
  
  // Subscribe to push notifications
  async subscribe() {
    if (!this.vapidPublicKey) {
      console.log('❌ Cannot subscribe: missing VAPID key');
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Convert VAPID public key to Uint8Array
        const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
        
        // Subscribe
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        
        console.log('✅ Subscribed to push notifications');
      } else {
        console.log('✅ Already subscribed to push notifications');
        return true;
      }
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return true;
    } catch (error) {
      console.error('❌ Push subscription error:', error);
      return false;
    }
  },
  
  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });
      
      if (response.ok) {
        console.log('✅ Subscription sent to server');
        return true;
      } else {
        console.error('❌ Server returned error:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      return false;
    }
  },
  
  // Helper: Convert base64 string to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
  
  // Show the enable button
  showButton(isPermanentlyDenied = false) {
    // Double-check we're in launched PWA mode
    if (!this.isLaunchedPWA()) {
      console.log('🌐 Not launched as PWA - not showing button');
      return;
    }
    
    const btn = document.getElementById('notification-enable-btn');
    if (!btn) {
      console.log('❌ Enable button not found in DOM');
      return;
    }
    
    if (isPermanentlyDenied) {
      btn.innerHTML = '<i class="fas fa-cog"></i> <span>Notification Settings</span>';
      btn.title = 'Click to see how to enable notifications';
      btn.classList.add('settings-mode');
      
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showInstructions();
      };
    } else {
      btn.innerHTML = '<i class="fas fa-bell"></i> <span>Enable Notifications</span>';
      btn.title = 'Click to enable notifications';
      btn.classList.remove('settings-mode');
      
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleButtonClick();
      };
    }
    
    btn.style.display = 'inline-flex';
    console.log('🔔 Showing button in launched PWA' + (isPermanentlyDenied ? ' (settings mode)' : ''));
  },
  
  // Hide the enable button
  hideButton() {
    const btn = document.getElementById('notification-enable-btn');
    if (btn) {
      btn.style.display = 'none';
      console.log('🔔 Hiding button');
    }
  },
  
  // Handle button click for normal mode
  async handleButtonClick() {
    console.log('👆 Enable button clicked in PWA');
    
    this.hideButton();
    
    try {
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      
      if (permission === 'granted') {
        await this.subscribe();
        if (window.showAlert) {
          window.showAlert('✅ Notifications enabled!', 'success');
        }
      } else if (permission === 'denied') {
        console.log('❌ User denied again');
        this.showButton(true);
        if (window.showAlert) {
          window.showAlert('❌ Notifications blocked permanently. Click the settings button for instructions.', 'error');
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
      this.showButton(true);
    }
  },
  
  // Manual permission request (called from welcome popup)
  async requestPermission() {
    console.log('🔔 Manual permission request triggered from welcome popup');
    
    try {
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      
      if (permission === 'granted') {
        await this.subscribe();
        this.hideButton();
        if (window.showAlert) {
          window.showAlert('✅ Notifications enabled!', 'success');
        }
        return true;
      } else if (permission === 'denied') {
        console.log('❌ Permission denied');
        this.showButton(true);
        if (window.showAlert) {
          window.showAlert('❌ Notifications blocked. You can enable them in browser settings.', 'error');
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Error in requestPermission:', error);
      if (window.showAlert) {
        window.showAlert('❌ Failed to enable notifications', 'error');
      }
      return false;
    }
  },
  
  // Show instructions for permanently denied state
  showInstructions() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;
    
    // Detect browser
    const isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
    const isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
    const isSafari = navigator.userAgent.indexOf("Safari") !== -1 && !isChrome;
    const isEdge = navigator.userAgent.indexOf("Edg") !== -1;
    
    let browserInstructions = '';
    
    if (isSafari) {
      browserInstructions = `
        <div style="margin-bottom: 15px; padding: 10px; background: #2d2d2d; border-radius: 8px;">
          <p><strong>For iOS Safari (PWA):</strong></p>
          <p>1. Go to <strong>Settings</strong> app on your iPhone/iPad</p>
          <p>2. Scroll down and tap <strong>NERIST Hub</strong> (or Safari > Notifications)</p>
          <p>3. Tap <strong>Notifications</strong></p>
          <p>4. Toggle <strong>Allow Notifications</strong> ON</p>
          <p>5. Return to the app and refresh</p>
        </div>
        <div style="margin-top: 15px; padding: 10px; background: #2d2d2d; border-radius: 8px;">
          <p><strong>Note:</strong> On iPhone, notifications for PWAs work like regular apps once installed to home screen.</p>
        </div>
      `;
    } else if (isChrome || isEdge) {
      browserInstructions = `
        <div style="margin-bottom: 15px; padding: 10px; background: #2d2d2d; border-radius: 8px;">
          <p><strong>For Chrome/Edge (PWA):</strong></p>
          <p>1. Click the <strong>lock icon</strong> (🔒) in the browser's address bar</p>
          <p>2. Click <strong>Site settings</strong></p>
          <p>3. Find <strong>Notifications</strong></p>
          <p>4. Change from "Block" to "Allow"</p>
          <p>5. Close and reopen the app from your home screen</p>
        </div>
      `;
    } else if (isFirefox) {
      browserInstructions = `
        <div style="margin-bottom: 15px; padding: 10px; background: #2d2d2d; border-radius: 8px;">
          <p><strong>For Firefox (PWA):</strong></p>
          <p>1. Click the <strong>shield icon</strong> in the address bar</p>
          <p>2. Click the <strong>gear/settings icon</strong></p>
          <p>3. Find <strong>Notifications</strong></p>
          <p>4. Change to "Allow"</p>
          <p>5. Close and reopen the app from your home screen</p>
        </div>
      `;
    } else {
      browserInstructions = `
        <div style="margin-bottom: 15px; padding: 10px; background: #2d2d2d; border-radius: 8px;">
          <p><strong>General Instructions:</strong></p>
          <p>1. Go to your browser <strong>Settings</strong></p>
          <p>2. Find <strong>Site Permissions</strong> or <strong>Notifications</strong></p>
          <p>3. Look for "NERIST Hub" in the list</p>
          <p>4. Change permission to <strong>Allow</strong></p>
          <p>5. Close and reopen the app from your home screen</p>
        </div>
      `;
    }
    
    modal.innerHTML = `
      <div style="
        background: var(--bg-card, #1e1e1e);
        color: var(--text-primary, white);
        padding: 30px;
        border-radius: 16px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        border: 1px solid var(--border-color, #2d2d2d);
      ">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <i class="fas fa-bell-slash" style="color: #ef4444; font-size: 24px;"></i>
          <h2 style="color: #6366f1; margin: 0;">Notifications Blocked</h2>
        </div>
        
        <p style="margin-bottom: 20px; line-height: 1.6; color: var(--text-secondary);">
          You've blocked notifications for this app. To enable them:
        </p>
        
        ${browserInstructions}
        
        <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: flex-end;">
          <button onclick="this.closest('div[style*=\\'fixed\\']').remove()" style="
            background: transparent;
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Close</button>
          <button onclick="location.reload()" style="
            background: #6366f1;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">Refresh App</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add animation style if not exists
    if (!document.getElementById('modal-animation-style')) {
      const style = document.createElement('style');
      style.id = 'modal-animation-style';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Remove on click outside
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, initializing push manager...');
  
  // Small delay to ensure everything is ready
  setTimeout(() => {
    PushManager.init();
  }, 1500);
});

// Listen for visibility change (when user returns to the app after changing settings)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('👁️ App became visible, checking permission...');
    // Small delay to ensure everything is ready
    setTimeout(() => {
      if (PushManager.isLaunchedPWA()) {
        PushManager.checkPermissionAndUpdateUI();
      }
    }, 500);
  }
});

// Listen for app installed event
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed - will show notification popup on next launch');
  localStorage.setItem('pwa-installed', 'true');
});

// Make PushManager globally available
window.PushManager = PushManager;
