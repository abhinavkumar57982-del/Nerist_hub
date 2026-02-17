// public/push-notifications.js - Only request notifications after PWA installation

const PushManager = {
  vapidPublicKey: null,
  
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
    
    // Check if running as installed PWA
    const isInstalledPWA = this.isRunningAsPWA();
    console.log('📱 Running as installed PWA:', isInstalledPWA);
    
    // Only proceed if this is an installed PWA
    if (!isInstalledPWA) {
      console.log('📱 Not running as installed PWA - skipping notification request');
      return false;
    }
    
    console.log('✅ Running as installed PWA - will request notifications');
    
    // Check current permission state
    console.log('📱 Current notification permission:', Notification.permission);
    
    // Handle based on permission state
    if (Notification.permission === 'granted') {
      console.log('✅ Permission already granted, subscribing...');
      await this.subscribe();
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.log('❌ Permission was denied by user');
      // Optionally show a small message that they can enable in settings
      return false;
    }
    
    // If default (not asked yet), request permission
    if (Notification.permission === 'default') {
      console.log('🔔 PWA detected, requesting notification permission...');
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        this.attemptPermissionRequest();
      }, 1000);
    }
    
    return true;
  },
  
  // Check if running as installed PWA
  isRunningAsPWA() {
    // Check if in standalone mode (installed to home screen)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    
    // Also check if it's been installed (you can add a flag in localStorage)
    const wasInstalled = localStorage.getItem('pwa-installed') === 'true';
    
    return isStandalone || wasInstalled;
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
        
        // Show a small toast (optional)
        this.showToast('✅ Notifications enabled!');
      } else if (permission === 'denied') {
        console.log('❌ Permission denied by user');
        this.showToast('❌ Notifications blocked. Enable in settings.', 'error');
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
  
  // Show a small toast message (optional)
  showToast(message, type = 'success') {
    // You can remove this if you don't want any UI
    console.log('Toast:', message);
    
    // Optional: Create a small toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 10px 20px;
      border-radius: 30px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeInOut 3s ease forwards;
    `;
    toast.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, 20px); }
        10% { opacity: 1; transform: translate(-50%, 0); }
        90% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -20px); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 3000);
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, initializing push manager...');
  
  // Try immediately with a delay
  setTimeout(() => {
    PushManager.init();
  }, 1000);
});

// Also listen for app installed event
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA was installed');
  localStorage.setItem('pwa-installed', 'true');
  
  // Small delay then try to request notifications
  setTimeout(() => {
    PushManager.init();
  }, 2000);
});

// Make PushManager globally available
window.PushManager = PushManager;
