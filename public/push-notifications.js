// public/push-notifications.js - Silent notification request (no UI elements)

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
    
    // Check if already subscribed
    const isSubscribed = await this.checkSubscriptionStatus();
    
    if (isSubscribed) {
      console.log('✅ Already subscribed to push notifications');
      return true;
    }
    
    // Auto-request permission (silent - no UI elements)
    await this.requestPermission();
    
    return true;
  },
  
  // Check if push notifications are supported
  isSupported() {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
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
  
  // Request permission silently
  async requestPermission() {
    if (!this.isSupported()) return false;
    
    // Only request if permission is default (not granted or denied)
    if (Notification.permission !== 'default') {
      console.log(`📱 Notification permission already: ${Notification.permission}`);
      return false;
    }
    
    try {
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('📱 Notification permission result:', permission);
      
      if (permission === 'granted') {
        await this.subscribe();
      }
      // No else - silently ignore if denied
      
      return true;
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
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
  
  // Check subscription status
  async checkSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
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
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure service worker is registered
  setTimeout(() => {
    PushManager.init();
  }, 1500);
});

// Make PushManager globally available
window.PushManager = PushManager;
