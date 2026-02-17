// public/push-notifications.js - Smart notification manager
// Shows button ONLY when user has blocked notifications

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
      // Show button to let them enable
      this.showButton();
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
            this.showButton();
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
        this.showButton();
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
  showButton() {
    const btn = document.getElementById('notification-enable-btn');
    if (btn) {
      btn.style.display = 'inline-flex';
      console.log('🔔 Showing enable button');
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
    console.log('👆 Enable button clicked');
    this.hideButton();
    
    // Request permission again
    try {
      const permission = await Notification.requestPermission();
      console.log('📱 Permission result:', permission);
      
      if (permission === 'granted') {
        await this.subscribe();
        // Button stays hidden
      } else if (permission === 'denied') {
        // If denied again, maybe show a message?
        console.log('❌ User denied again');
      }
    } catch (error) {
      console.error('❌ Error:', error);
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
