// public/push-notifications.js - Only shows in PWA mode

const PushManager = {
  vapidPublicKey: null,
  
  // Initialize
  async init() {
    console.log('🔔 Initializing Push Manager...');
    
    if (!this.isSupported()) {
      console.log('❌ Push notifications not supported in this browser');
      return false;
    }
    
    // Check if in PWA mode
    const isPWA = localStorage.getItem('pwa-mode') === 'true' || 
                   window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
    
    if (!isPWA) {
      console.log('🌐 Not in PWA mode - hiding notification UI');
      this.hideButton(); // Ensure button is hidden in website mode
      return false;
    }
    
    console.log('📱 PWA mode detected - managing notifications');
    
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
      // Show button in PWA mode only when denied
      this.showButton();
      return false;
    }
    
    // If default (not asked yet), request permission automatically in PWA mode
    if (Notification.permission === 'default') {
      console.log('🔔 PWA detected, requesting notification permission...');
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        this.attemptPermissionRequest();
      }, 1000);
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
  
  // Attempt to request permission
  async attemptPermissionRequest() {
    try {
      console.log('🔔 Requesting notification permission (PWA mode)...');
      
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      
      if (permission === 'granted') {
        console.log('✅ Permission granted, subscribing...');
        await this.subscribe();
        this.hideButton();
      } else if (permission === 'denied') {
        console.log('❌ Permission denied by user');
        this.showButton();
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
  
  // Show the enable button (only in PWA mode when denied)
  showButton() {
    // Double-check we're in PWA mode
    const isPWA = localStorage.getItem('pwa-mode') === 'true' || 
                   window.matchMedia('(display-mode: standalone)').matches || 
                   window.navigator.standalone === true;
    
    if (!isPWA) {
      console.log('🌐 Not in PWA mode - not showing button');
      return;
    }
    
    const btn = document.getElementById('notification-enable-btn');
    if (btn) {
      btn.style.display = 'inline-flex';
      console.log('🔔 Showing enable button in PWA');
    } else {
      console.log('❌ Enable button not found in DOM');
    }
  },
  
  // Hide the enable button
  hideButton() {
    const btn = document.getElementById('notification-enable-btn');
    if (btn) {
      btn.style.display = 'none';
      console.log('🔔 Hiding enable button');
    }
  },
  
  // Handle button click
  async handleButtonClick() {
    console.log('👆 Enable button clicked in PWA');
    
    this.hideButton();
    
    // Request permission again
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
        this.showButton();
        if (window.showAlert) {
          window.showAlert('❌ Notifications blocked. Enable in browser settings.', 'error');
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
      this.showButton();
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, initializing push manager...');
  
  // Try immediately with a delay
  setTimeout(() => {
    PushManager.init();
  }, 1500);
});

// Also listen for app installed event
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed - reinitializing push manager');
  localStorage.setItem('pwa-mode', 'true');
  
  // Small delay then try to request notifications
  setTimeout(() => {
    PushManager.init();
  }, 2000);
});

// Make PushManager globally available
window.PushManager = PushManager;
