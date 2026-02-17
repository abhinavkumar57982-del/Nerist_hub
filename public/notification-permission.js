// public/notification-permission.js - Handle notification permissions and push subscriptions

const PushNotificationManager = {
  // VAPID public key from your server
  vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY_HERE', // Get this from your server
  
  // Check if push notifications are supported
  isSupported() {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  },
  
  // Request notification permission
  async requestPermission() {
    if (!this.isSupported()) {
      console.log('Push notifications not supported');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  },
  
  // Subscribe to push notifications
  async subscribeToPush() {
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
      }
      
      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('❌ Push subscription error:', error);
      return null;
    }
  },
  
  // Unsubscribe from push notifications
  async unsubscribeFromPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Unsubscribed from push notifications');
        
        // Tell server to remove subscription
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: window.Auth?.getAuthHeaders() || {}
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ Unsubscribe error:', error);
      return false;
    }
  },
  
  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    if (!window.Auth?.isLoggedIn()) return false;
    
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: window.Auth.getAuthHeaders(),
        body: JSON.stringify({ subscription })
      });
      
      return response.ok;
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
  
  // Initialize - call this when user logs in
  async init() {
    if (!this.isSupported() || !window.Auth?.isLoggedIn()) return;
    
    const permission = await this.requestPermission();
    if (permission) {
      await this.subscribeToPush();
    }
    
    // Add notification button to UI
    this.addNotificationButton();
  },
  
  // Add notification permission button to navbar
  addNotificationButton() {
    // Check if button already exists
    if (document.getElementById('push-permission-btn')) return;
    
    const navRight = document.querySelector('.nav-right');
    if (!navRight) return;
    
    const btn = document.createElement('button');
    btn.id = 'push-permission-btn';
    btn.className = 'notification-permission-btn';
    btn.innerHTML = '<i class="fas fa-bell"></i>';
    btn.title = 'Enable push notifications';
    
    btn.addEventListener('click', async () => {
      const granted = await this.requestPermission();
      if (granted) {
        await this.subscribeToPush();
        btn.innerHTML = '<i class="fas fa-bell" style="color: var(--accent-success);"></i>';
        btn.title = 'Notifications enabled';
        
        if (window.showAlert) {
          window.showAlert('✅ Push notifications enabled!', 'success');
        }
      }
    });
    
    // Insert before theme toggle
    const themeToggle = navRight.querySelector('.theme-toggle');
    if (themeToggle) {
      navRight.insertBefore(btn, themeToggle);
    } else {
      navRight.appendChild(btn);
    }
    
    // Check if already subscribed
    this.checkSubscriptionStatus();
  },
  
  // Check if already subscribed
  async checkSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      const btn = document.getElementById('push-permission-btn');
      if (btn && subscription) {
        btn.innerHTML = '<i class="fas fa-bell" style="color: var(--accent-success);"></i>';
        btn.title = 'Notifications enabled';
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  }
};

// Initialize on login
document.addEventListener('DOMContentLoaded', () => {
  // Check every second until Auth is ready
  const checkAuth = setInterval(() => {
    if (window.Auth && window.Auth.isLoggedIn()) {
      clearInterval(checkAuth);
      PushNotificationManager.init();
    }
  }, 500);
  
  // Clear after 10 seconds
  setTimeout(() => clearInterval(checkAuth), 10000);
});

// Export
window.PushNotificationManager = PushNotificationManager;
