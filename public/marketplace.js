// Socket.io client setup
let socket = null;

// Notification Manager
const NotificationManager = {
    socket: null,
    unreadCount: 0,
    notifications: [],
    currentPage: 1,
    
    // Initialize socket connection
    init() {
        if (!window.Auth || !window.Auth.isLoggedIn()) {
            console.log('User not logged in, skipping notification init');
            return;
        }
        
        const currentUser = window.Auth.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            console.log('No user ID found');
            return;
        }
        
        const currentUserId = currentUser.id;
        console.log('Initializing notifications for user:', currentUserId);
        
        // Connect to socket
        this.socket = io('http://localhost:5000');
        
        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.socket.emit('user-connected', currentUserId);
            this.loadUnreadCount();
        });
        
        this.socket.on('notification', (notification) => {
            console.log('New notification received:', notification);
            this.showToast(notification);
            this.addToNotificationList(notification);
            this.updateUnreadCount(1);
        });
        
        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    },
    
    // Load unread count
    async loadUnreadCount() {
        try {
            if (!window.Auth || !window.Auth.isLoggedIn()) return;
            
            const response = await fetch('/api/notifications/unread-count', {
                headers: window.Auth.getAuthHeaders()
            });
            const data = await response.json();
            this.unreadCount = data.count || 0;
            this.updateBadge();
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    },
    
    // Update badge count
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    },
    
    // Update unread count
    updateUnreadCount(increment = 0) {
        if (increment > 0) {
            this.unreadCount += increment;
        }
        this.updateBadge();
    },
    
    // Show toast notification
    showToast(notification) {
        let container = document.getElementById('notification-container');
        if (!container) {
            // Create container if it doesn't exist
            container = document.createElement('div');
            container.id = 'notification-container';
            document.body.appendChild(container);
        }
        
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type || 'info'}`;
        toast.innerHTML = `
            <div class="notification-icon ${notification.type || 'info'}">
                <i class="fas ${this.getIconForType(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <h4>${notification.title || 'Notification'}</h4>
                <p>${notification.message || ''}</p>
                <small class="notification-time">${notification.createdAt ? new Date(notification.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString()}</small>
            </div>
            <button onclick="this.parentElement.remove()" class="toast-close">×</button>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    },
    
    // Get icon for notification type
    getIconForType(type) {
        const icons = {
            'lost': 'fa-search',
            'found': 'fa-check-circle',
            'buy': 'fa-shopping-cart',
            'sell': 'fa-tag',
            'service': 'fa-cog',
            'rental': 'fa-bicycle',
            'info': 'fa-bell'
        };
        return icons[type] || 'fa-bell';
    },
    
    // Load notifications
    async loadNotifications(page = 1, unreadOnly = false) {
        try {
            if (!window.Auth || !window.Auth.isLoggedIn()) return;
            
            let url = `/api/notifications?page=${page}&limit=20`;
            if (unreadOnly) url += '&unreadOnly=true';
            
            const response = await fetch(url, {
                headers: window.Auth.getAuthHeaders()
            });
            const data = await response.json();
            
            this.notifications = data.notifications || [];
            this.currentPage = data.page || 1;
            this.renderNotificationsList();
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    },
    
    // Render notifications list
    renderNotificationsList() {
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        if (!this.notifications || this.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <h4>No notifications yet</h4>
                    <p>You're all caught up!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.notifications.map(notification => {
            // Safely access notification properties
            const notificationId = notification._id || '';
            const type = notification.type || 'info';
            const title = notification.title || 'Notification';
            const message = notification.message || '';
            const createdAt = notification.createdAt || new Date().toISOString();
            const isRead = notification.read || false;
            
            return `
                <div class="notification-item ${isRead ? 'read' : 'unread'}" 
                     data-id="${notificationId}">
                    <div class="notification-icon ${type}">
                        <i class="fas ${this.getIconForType(type)}"></i>
                    </div>
                    <div class="notification-details" onclick="NotificationManager.markAsRead('${notificationId}')">
                        <h5>
                            ${title}
                            <div class="notification-actions">
                                <button class="notification-delete-btn" 
                                        onclick="NotificationManager.deleteNotification('${notificationId}', event)"
                                        title="Delete notification">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </h5>
                        <p>${message}</p>
                        <span class="notification-time-small">
                            <i class="fas fa-clock"></i> ${new Date(createdAt).toLocaleString()}
                        </span>
                    </div>
                    ${!isRead ? '<span class="unread-dot"></span>' : ''}
                </div>
            `;
        }).join('');
    },
    
    // Add single notification to list
    addToNotificationList(notification) {
        if (!notification || !notification._id) {
            console.error('Invalid notification received:', notification);
            return;
        }
        
        this.notifications.unshift(notification);
        if (this.notifications.length > 50) {
            this.notifications.pop();
        }
        
        const container = document.getElementById('notifications-list');
        if (!container) return;
        
        // Check if empty state is showing
        const emptyState = container.querySelector('.empty-notifications');
        if (emptyState) {
            this.renderNotificationsList();
            return;
        }
        
        // Add new notification to top of list
        const notificationId = notification._id || '';
        const type = notification.type || 'info';
        const title = notification.title || 'Notification';
        const message = notification.message || '';
        const createdAt = notification.createdAt || new Date().toISOString();
        
        const html = `
            <div class="notification-item unread" 
                 data-id="${notificationId}">
                <div class="notification-icon ${type}">
                    <i class="fas ${this.getIconForType(type)}"></i>
                </div>
                <div class="notification-details" onclick="NotificationManager.markAsRead('${notificationId}')">
                    <h5>
                        ${title}
                        <div class="notification-actions">
                            <button class="notification-delete-btn" 
                                    onclick="NotificationManager.deleteNotification('${notificationId}', event)"
                                    title="Delete notification">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </h5>
                    <p>${message}</p>
                    <span class="notification-time-small">
                        <i class="fas fa-clock"></i> ${new Date(createdAt).toLocaleString()}
                    </span>
                </div>
                <span class="unread-dot"></span>
            </div>
        `;
        
        // Insert at the beginning
        container.insertAdjacentHTML('afterbegin', html);
    },
    
    // Mark notification as read
    async markAsRead(notificationId) {
        // Check if notificationId is valid
        if (!notificationId || notificationId === 'undefined' || notificationId === 'null') {
            console.error('Invalid notification ID:', notificationId);
            return;
        }
        
        try {
            if (!window.Auth || !window.Auth.isLoggedIn()) return;
            
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: window.Auth.getAuthHeaders()
            });
            
            if (response.ok) {
                const element = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
                if (element) {
                    element.classList.remove('unread');
                    element.classList.add('read');
                    const dot = element.querySelector('.unread-dot');
                    if (dot) dot.remove();
                }
                
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge();
                
                // Update in-memory notifications
                const notification = this.notifications.find(n => n._id === notificationId);
                if (notification) {
                    notification.read = true;
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    },
    
    // Delete single notification
    async deleteNotification(notificationId, event) {
        // Stop event propagation to prevent triggering the parent click (mark as read)
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        // Check if notificationId is valid
        if (!notificationId || notificationId === 'undefined' || notificationId === 'null') {
            console.error('Invalid notification ID:', notificationId);
            return;
        }
        
        try {
            if (!window.Auth || !window.Auth.isLoggedIn()) return;
            
            // Show confirmation
            if (!confirm('Delete this notification?')) {
                return;
            }
            
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: window.Auth.getAuthHeaders()
            });
            
            if (response.ok) {
                // Remove from DOM
                const element = document.querySelector(`.notification-item[data-id="${notificationId}"]`);
                if (element) {
                    // Check if this was an unread notification
                    const wasUnread = element.classList.contains('unread');
                    
                    element.remove();
                    
                    // Update unread count if needed
                    if (wasUnread) {
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                        this.updateBadge();
                    }
                }
                
                // Remove from in-memory notifications
                const index = this.notifications.findIndex(n => n._id === notificationId);
                if (index !== -1) {
                    this.notifications.splice(index, 1);
                }
                
                // Check if notifications list is empty and show empty state
                const container = document.getElementById('notifications-list');
                if (container && container.children.length === 0) {
                    container.innerHTML = `
                        <div class="empty-notifications">
                            <i class="fas fa-bell-slash"></i>
                            <h4>No notifications yet</h4>
                            <p>You're all caught up!</p>
                        </div>
                    `;
                }
                
                console.log('Notification deleted successfully');
            } else {
                console.error('Failed to delete notification');
                alert('Failed to delete notification. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            alert('Error deleting notification. Please try again.');
        }
    },
    
    // Delete all notifications
    async deleteAllNotifications() {
        try {
            if (!window.Auth || !window.Auth.isLoggedIn()) return;
            
            // Show confirmation
            if (!confirm('Delete all notifications? This action cannot be undone.')) {
                return;
            }
            
            const response = await fetch('/api/notifications', {
                method: 'DELETE',
                headers: window.Auth.getAuthHeaders()
            });
            
            if (response.ok) {
                // Clear the list
                const container = document.getElementById('notifications-list');
                if (container) {
                    container.innerHTML = `
                        <div class="empty-notifications">
                            <i class="fas fa-bell-slash"></i>
                            <h4>No notifications yet</h4>
                            <p>All notifications deleted</p>
                        </div>
                    `;
                }
                
                // Clear in-memory notifications
                this.notifications = [];
                this.unreadCount = 0;
                this.updateBadge();
                
                console.log('All notifications deleted successfully');
            } else {
                console.error('Failed to delete all notifications');
                alert('Failed to delete notifications. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting all notifications:', error);
            alert('Error deleting notifications. Please try again.');
        }
    },
    
    // Mark all as read
    async markAllAsRead() {
        try {
            if (!window.Auth || !window.Auth.isLoggedIn()) return;
            
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'PUT',
                headers: window.Auth.getAuthHeaders()
            });
            
            if (response.ok) {
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                    item.classList.add('read');
                    const dot = item.querySelector('.unread-dot');
                    if (dot) dot.remove();
                });
                
                this.unreadCount = 0;
                this.updateBadge();
                
                // Update in-memory notifications
                this.notifications.forEach(n => { n.read = true; });
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    },
    
    // Toggle notifications dropdown
    toggleDropdown(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        const dropdown = document.getElementById('notification-dropdown');
        if (!dropdown) return;
        
        // Toggle the dropdown
        dropdown.classList.toggle('show');
        
        if (dropdown.classList.contains('show')) {
            this.loadNotifications();
            
            // Close when clicking outside (with slight delay to avoid immediate closing)
            setTimeout(() => {
                document.addEventListener('click', this.handleOutsideClick);
            }, 100);
        } else {
            document.removeEventListener('click', this.handleOutsideClick);
        }
    },
    
    // Handle outside click to close dropdown
    handleOutsideClick(event) {
        const dropdown = document.getElementById('notification-dropdown');
        const bell = document.getElementById('notificationBell');
        
        if (dropdown && bell && !bell.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove('show');
            document.removeEventListener('click', NotificationManager.handleOutsideClick);
        }
    },
    
    // Close dropdown
    closeDropdown() {
        const dropdown = document.getElementById('notification-dropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
        document.removeEventListener('click', this.handleOutsideClick);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Set up notification bell click handler
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        // Remove any existing event listeners
        notificationBell.removeEventListener('click', NotificationManager.toggleDropdown.bind(NotificationManager));
        // Add click event listener
        notificationBell.addEventListener('click', (event) => {
            NotificationManager.toggleDropdown(event);
        });
        
        // Add touch event for mobile devices
        notificationBell.addEventListener('touchstart', (event) => {
            event.preventDefault();
            NotificationManager.toggleDropdown(event);
        }, { passive: false });
    }
    
    // Set up mark all as read button
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            NotificationManager.markAllAsRead();
        });
        
        markAllReadBtn.addEventListener('touchstart', (event) => {
            event.preventDefault();
            event.stopPropagation();
            NotificationManager.markAllAsRead();
        }, { passive: false });
    }
    
    // Set up delete all button
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            NotificationManager.deleteAllNotifications();
        });
        
        deleteAllBtn.addEventListener('touchstart', (event) => {
            event.preventDefault();
            event.stopPropagation();
            NotificationManager.deleteAllNotifications();
        }, { passive: false });
    }
    
    // Check if we're on a page with socket.io
    if (typeof io !== 'undefined') {
        // Wait for Auth to be ready
        const checkAuth = setInterval(() => {
            if (window.Auth && window.Auth.isLoggedIn()) {
                clearInterval(checkAuth);
                // Small delay to ensure everything is loaded
                setTimeout(() => {
                    NotificationManager.init();
                }, 500);
            }
        }, 100);
        
        // Clear interval after 10 seconds to prevent infinite loop
        setTimeout(() => clearInterval(checkAuth), 10000);
    }
});

// Make NotificationManager globally available
window.NotificationManager = NotificationManager;

// Global toggle function for backward compatibility
function toggleNotifications(event) {
    if (window.NotificationManager) {
        window.NotificationManager.toggleDropdown(event);
    }
}

// Global mark all as read function for backward compatibility
function markAllAsRead() {
    if (window.NotificationManager) {
        window.NotificationManager.markAllAsRead();
    }
}
