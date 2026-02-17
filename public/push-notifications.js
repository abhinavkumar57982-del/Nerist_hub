// public/push-notifications.js - Auto-request notifications on page load

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
    
    // AUTO-REQUEST permission on page load (no button needed)
    console.log('🔔 Auto-requesting notification permission...');
    await this.autoRequestPermission();
    
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
  
  // Auto-request permission without button
  async autoRequestPermission() {
    if (!this.isSupported()) return false;
    
    // Only request if permission is not already granted or denied
    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      await this.subscribe();
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.log('❌ Notification permission previously denied');
      // Optionally show a small message that notifications are blocked
      this.showNotificationBlockedMessage();
      return false;
    }
    
    // Permission is 'default' - ask automatically
    try {
      console.log('🔔 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('📱 Notification permission result:', permission);
      
      if (permission === 'granted') {
        await this.subscribe();
        
        // Show welcome message
        if (window.showAlert) {
          window.showAlert('✅ Notifications enabled! You will receive alerts for new posts.', 'success');
        }
        return true;
      } else {
        console.log('❌ Notification permission denied by user');
        // Optionally show a small message that notifications were denied
        this.showNotificationBlockedMessage();
        return false;
      }
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
      
      // Send subscription to server (no auth required)
      const sent = await this.sendSubscriptionToServer(subscription);
      
      if (sent) {
        console.log('✅ Subscription sent to server');
      }
      
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
  },
  
  // Show a small message if notifications are blocked
  showNotificationBlockedMessage() {
    // Create a small non-intrusive banner
    const banner = document.createElement('div');
    banner.id = 'notification-blocked-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: #ff4757;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease;
      max-width: 300px;
    `;
    
    banner.innerHTML = `
      <i class="fas fa-bell-slash"></i>
      <span>Notifications are blocked. Enable them in browser settings to get alerts.</span>
      <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: auto;">&times;</button>
    `;
    
    document.body.appendChild(banner);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (banner.parentElement) {
        banner.remove();
      }
    }, 8000);
  }
};

// Initialize when DOM is ready (no button needed)
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure service worker is registered
  setTimeout(() => {
    PushManager.init();
  }, 1500); // Slightly longer delay to ensure everything is ready
});

// Make PushManager globally available
window.PushManager = PushManager;
