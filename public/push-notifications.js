// public/push-notifications.js - Force notification popup to show

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
    
    // If already granted, subscribe
    if (Notification.permission === 'granted') {
      console.log('✅ Permission already granted, subscribing...');
      await this.subscribe();
      return true;
    }
    
    // If denied, we can't do anything
    if (Notification.permission === 'denied') {
      console.log('❌ Permission was denied by user previously');
      return false;
    }
    
    // If default (not asked yet), request permission
    if (Notification.permission === 'default') {
      console.log('🔔 Permission not yet requested, will request...');
      
      // Try multiple times to ensure popup shows
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
        
        // Show a small thank you (optional)
        this.showThankYouMessage();
      } else if (permission === 'denied') {
        console.log('❌ Permission denied by user');
      } else {
        console.log('⏸️ Permission dismissed by user');
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
  
  // Optional: Show a small thank you message (can be removed if you want)
  showThankYouMessage() {
    // You can remove this entire function if you don't want any message
    console.log('🙏 Thank you for enabling notifications!');
    
    // Optional: Create a small toast that disappears
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: fadeInOut 3s ease forwards;
    `;
    toast.textContent = '✅ Notifications enabled! You\'ll receive alerts.';
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
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

// Initialize with multiple triggers to ensure popup shows
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded, will request notifications soon...');
  
  // Try immediately
  setTimeout(() => {
    PushManager.init();
  }, 500);
  
  // Try again after user interacts with the page (some browsers require user gesture)
  document.addEventListener('click', function onClick() {
    console.log('👆 User clicked, trying notification request...');
    PushManager.init();
    document.removeEventListener('click', onClick);
  }, { once: true });
  
  // Try on scroll as well
  document.addEventListener('scroll', function onScroll() {
    console.log('📜 User scrolled, trying notification request...');
    PushManager.init();
    document.removeEventListener('scroll', onScroll);
  }, { once: true });
});

// Make PushManager globally available
window.PushManager = PushManager;
