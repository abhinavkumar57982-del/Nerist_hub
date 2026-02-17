// public/push-notifications.js - Simple Push Notification Manager (Enable Only)

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
    
    // Only add button if not already subscribed
    if (!isSubscribed) {
      this.addPermissionButton();
    } else {
      console.log('✅ Already subscribed to push notifications');
    }
    
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
  
  // Request permission
  async requestPermission() {
    if (!this.isSupported()) return false;
    
    try {
      const permission = await Notification.requestPermission();
      console.log('📱 Notification permission:', permission);
      return permission === 'granted';
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
        // Remove the button after successful subscription
        this.removePermissionButton();
        
        // Show success message
        if (window.showAlert) {
          window.showAlert('✅ Notifications enabled! You will receive alerts for new posts.', 'success');
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Push subscription error:', error);
      return false;
    }
  },
  
  // Send subscription to server (no auth headers)
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
  
  // Add notification permission button to navbar
  addPermissionButton() {
    // Check if button already exists
    if (document.getElementById('push-permission-btn')) return;
    
    const navRight = document.querySelector('.nav-right');
    if (!navRight) {
      console.log('Navbar not found, cannot add button');
      return;
    }
    
    const btn = document.createElement('button');
    btn.id = 'push-permission-btn';
    btn.className = 'push-permission-btn';
    btn.innerHTML = '<i class="fas fa-bell"></i> <span>Enable Notifications</span>';
    btn.title = 'Click to enable push notifications';
    
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Show loading state
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Asking...';
      btn.disabled = true;
      
      const granted = await this.requestPermission();
      if (granted) {
        await this.subscribe();
      } else {
        // Reset button if permission denied
        btn.innerHTML = '<i class="fas fa-bell"></i> <span>Enable Notifications</span>';
        btn.disabled = false;
        
        if (window.showAlert) {
          window.showAlert('❌ Notification permission denied. You can enable it later from browser settings.', 'error');
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
    
    console.log('🔔 Push notification button added to navbar');
  },
  
  // Remove the button after successful subscription
  removePermissionButton() {
    const btn = document.getElementById('push-permission-btn');
    if (btn) {
      btn.remove();
      console.log('✅ Notification button removed - user is subscribed');
    }
  }
};

// Initialize when DOM is ready (no login required)
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure service worker is registered
  setTimeout(() => {
    PushManager.init();
  }, 1000);
});

// Make PushManager globally available
window.PushManager = PushManager;
