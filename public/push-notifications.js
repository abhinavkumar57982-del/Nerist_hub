// public/push-notifications.js - Smart notification manager with working button

const PushManager = {
  vapidPublicKey: null,
  permissionRequested: false,
  
  // Initialize
  async init() {
    console.log('🔔 Initializing Push Manager...');
    
    if (!this.isSupported()) {
      console.log('❌ Push notifications not supported in this browser');
      return false;
    }
    
    // Get VAPID public key from server
    const keyObtained = await this.getVapidKey();
    if (!keyObtained) {
      return false;
    }
    
    // Check current permission state
    console.log('📱 Current notification permission:', Notification.permission);
    
    // Handle based on permission state
    if (Notification.permission === 'granted') {
      console.log('✅ Permission already granted, subscribing...');
      await this.subscribe();
      this.hideButton();
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.log('❌ Permission was denied by user');
      // Show button with special handling for denied state
      this.showButton(true); // Pass true to indicate permanently denied
      return false;
    }
    
    // If default (not asked yet), request permission
    if (Notification.permission === 'default') {
      console.log('🔔 Permission not yet requested, will request...');
      this.requestPermissionWithRetry();
    }
    
    return true;
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
  
  // Request permission with multiple retry attempts
  requestPermissionWithRetry() {
    // Try immediately
    this.attemptPermissionRequest();
    
    // Try again after 1 second
    setTimeout(() => {
      if (Notification.permission === 'default') {
        console.log('🔄 Retry 1: Permission still default, trying again...');
        this.attemptPermissionRequest();
      }
    }, 1000);
    
    // Try again after 3 seconds
    setTimeout(() => {
      if (Notification.permission === 'default') {
        console.log('🔄 Retry 2: Permission still default, trying again...');
        this.attemptPermissionRequest();
      }
    }, 3000);
    
    // Final try after 5 seconds
    setTimeout(() => {
      if (Notification.permission === 'default') {
        console.log('🔄 Retry 3: Permission still default, trying again...');
        this.attemptPermissionRequest();
        
        // If still default after all retries, show button
        setTimeout(() => {
          if (Notification.permission === 'default') {
            console.log('⚠️ Auto-request failed after multiple attempts, showing button');
            this.showButton(false);
          }
        }, 1000);
      }
    }, 5000);
  },
  
  // Attempt to request permission
  async attemptPermissionRequest() {
    // Don't try if already requested
    if (this.permissionRequested && Notification.permission !== 'default') {
      return;
    }
    
    // Mark that we've attempted
    this.permissionRequested = true;
    
    try {
      console.log('🔔 Requesting notification permission NOW...');
      
      // Use the raw Notification.requestPermission
      const permission = await Notification.requestPermission();
      
      console.log('📱 Permission result:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permission granted, subscribing...');
        await this.subscribe();
        this.hideButton();
      } else if (permission === 'denied') {
        console.log('❌ Permission denied by user');
        this.showButton(true); // Pass true to indicate permanently denied
      } else {
        console.log('⏸️ Permission dismissed by user');
        // If dismissed, we'll try again later via retry mechanism
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
  
  // Show the enable button (only when needed)
  showButton(isPermanentlyDenied = false) {
    const btn = document.getElementById('notification-enable-btn');
    if (!btn) return;
    
    if (isPermanentlyDenied) {
      // Change button to show instructions instead
      btn.innerHTML = '<i class="fas fa-cog"></i> <span>Fix Notifications</span>';
      btn.title = 'Click to see how to enable notifications in browser settings';
      btn.style.display = 'inline-flex';
      
      // Change click handler temporarily
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showInstructions();
      };
    } else {
      // Normal button
      btn.innerHTML = '<i class="fas fa-bell"></i> <span>Enable Notifications</span>';
      btn.title = 'Click to enable notifications';
      btn.style.display = 'inline-flex';
      
      // Restore normal click handler
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleButtonClick();
      };
    }
    
    console.log('🔔 Showing enable button' + (isPermanentlyDenied ? ' (permanently denied)' : ''));
  },
  
  // Hide the enable button
  hideButton() {
    const btn = document.getElementById('notification-enable-btn');
    if (btn) {
      btn.style.display = 'none';
      console.log('🔔 Hiding enable button');
    }
  },
  
  // Show instructions for permanently denied state
  showInstructions() {
    // Create a modal with instructions
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
    
    const isChrome = navigator.userAgent.indexOf("Chrome") !== -1;
    const isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
    const isSafari = navigator.userAgent.indexOf("Safari") !== -1;
    
    let browserInstructions = '';
    if (isChrome) {
      browserInstructions = `
        <p>1. Click the <strong>lock icon</strong> (🔒) in the address bar</p>
        <p>2. Find "Notifications" in the site settings</p>
        <p>3. Change from "Block" to "Allow"</p>
        <p>4. Refresh the page</p>
      `;
    } else if (isFirefox) {
      browserInstructions = `
        <p>1. Click the <strong>shield icon</strong> in the address bar</p>
        <p>2. Click the gear/settings icon</p>
        <p>3. Find "Notifications" and change to "Allow"</p>
        <p>4. Refresh the page</p>
      `;
    } else if (isSafari) {
      browserInstructions = `
        <p>1. Go to <strong>Safari > Settings</strong> (or Preferences)</p>
        <p>2. Click on "Websites" tab</p>
        <p>3. Select "Notifications" from the left sidebar</p>
        <p>4. Find this site and change to "Allow"</p>
        <p>5. Refresh the page</p>
      `;
    } else {
      browserInstructions = `
        <p>1. Click the <strong>site info icon</strong> (lock/i) in the address bar</p>
        <p>2. Find "Notifications" in the site permissions</p>
        <p>3. Change from "Block" to "Allow"</p>
        <p>4. Refresh the page</p>
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
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        border: 1px solid var(--border-color, #2d2d2d);
      ">
        <h2 style="color: #6366f1; margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
          <i class="fas fa-bell-slash"></i> Notifications Blocked
        </h2>
        <p style="margin-bottom: 20px; line-height: 1.6;">
          You've permanently blocked notifications for this site. 
          To enable them, you need to change your browser settings:
        </p>
        <div style="background: var(--bg-secondary, #2d2d2d); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
          ${browserInstructions}
        </div>
        <p style="margin-bottom: 25px; color: var(--text-secondary, #a0a0a0); font-size: 14px;">
          <i class="fas fa-info-circle"></i> After changing the setting, refresh this page.
        </p>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
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
          ">Refresh Page</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Remove on click outside
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  },
  
  // Handle button click
  async handleButtonClick() {
    console.log('👆 Enable button clicked');
    
    // Check if already permanently denied
    if (Notification.permission === 'denied') {
      this.showInstructions();
      return;
    }
    
    this.hideButton();
    
    // Reset permission requested flag so we can try again
    this.permissionRequested = false;
    
    // Request permission again
    try {
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      
      if (permission === 'granted') {
        await this.subscribe();
        // Button stays hidden
        if (window.showAlert) {
          window.showAlert('✅ Notifications enabled!', 'success');
        }
      } else if (permission === 'denied') {
        console.log('❌ User denied again');
        // Show button with instructions
        this.showButton(true);
        if (window.showAlert) {
          window.showAlert('❌ Notifications blocked permanently. Click the button for instructions.', 'error');
        }
      } else {
        // Dismissed - show button again
        this.showButton(false);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      this.showButton(false);
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, initializing push manager...');
  
  // Try immediately
  setTimeout(() => {
    PushManager.init();
  }, 500);
  
  // Try on user interaction (for browsers that require it)
  document.addEventListener('click', function onClick() {
    console.log('👆 User clicked, checking permission...');
    if (Notification.permission === 'default') {
      PushManager.attemptPermissionRequest();
    }
    document.removeEventListener('click', onClick);
  }, { once: true });
});

// Make PushManager globally available
window.PushManager = PushManager;
