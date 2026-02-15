// Wrap everything in an IIFE
(function() {
  // Theme Persistence
  function initTheme() {
    const savedTheme = localStorage.getItem('nerist-theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      updateThemeToggle();
    }
  }

  function toggleTheme() {
    document.body.classList.toggle('light-theme');
    
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('nerist-theme', isLight ? 'light' : 'dark');
    
    updateThemeToggle();
  }

  function updateThemeToggle() {
    const toggleBtn = document.querySelector('.theme-toggle');
    if (!toggleBtn) return;
    
    const icon = toggleBtn.querySelector('i');
    const text = toggleBtn.querySelector('span');
    
    if (document.body.classList.contains('light-theme')) {
      icon.className = 'fas fa-sun';
      text.textContent = 'Light';
    } else {
      icon.className = 'fas fa-moon';
      text.textContent = 'Dark';
    }
  }

  // Initialize theme on page load
  initTheme();

  // ============ FIXED MOBILE NAVIGATION SYSTEM ============
  function initMobileNavigation() {
    // Always check if we're on mobile
    if (window.innerWidth > 768) {
      // Remove mobile elements if they exist
      const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
      const mobileOverlay = document.querySelector('.mobile-menu-overlay');
      const mobileMenu = document.querySelector('.mobile-menu');
      
      if (mobileMenuBtn) mobileMenuBtn.remove();
      if (mobileOverlay) mobileOverlay.remove();
      if (mobileMenu) mobileMenu.remove();
      return;
    }
    
    console.log('Initializing mobile navigation...');
    
    // Add hamburger button if not exists
    if (!document.querySelector('.mobile-menu-btn')) {
      const navLeft = document.querySelector('.nav-left');
      if (navLeft) {
        const hamburger = document.createElement('button');
        hamburger.className = 'mobile-menu-btn';
        hamburger.id = 'mobile-menu-btn';
        hamburger.setAttribute('aria-label', 'Menu');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        navLeft.insertBefore(hamburger, navLeft.firstChild);
        console.log('Hamburger button added');
      }
    }
    
    // Create overlay if not exists
    if (!document.querySelector('.mobile-menu-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'mobile-menu-overlay';
      overlay.id = 'mobile-menu-overlay';
      document.body.appendChild(overlay);
      console.log('Overlay added');
    }
    
    // Create mobile menu if not exists
    if (!document.querySelector('.mobile-menu')) {
      const mobileMenu = document.createElement('div');
      mobileMenu.className = 'mobile-menu';
      mobileMenu.id = 'mobile-menu';
      document.body.appendChild(mobileMenu);
      buildMobileMenuContent(mobileMenu);
      console.log('Mobile menu added');
    }
    
    setupMobileMenuEvents();
  }

  function buildMobileMenuContent(menuElement) {
    const user = window.Auth?.getCurrentUser();
    const currentPath = window.location.pathname;
    
    let menuHTML = `
      <div class="mobile-menu-header">
        <a href="/index.html" class="logo">
          <span class="logo-icon">🧑‍🎓</span>
          <span>NERIST Hub</span>
        </a>
      </div>
    `;
    
    // User info section
    if (user) {
      menuHTML += `
        <div class="mobile-user-info">
          <div class="mobile-user-avatar">
            ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div class="mobile-user-details">
            <div class="mobile-user-name">${user.name || 'Student'}</div>
            <div class="mobile-user-regno">${user.registrationNumber || ''}</div>
          </div>
        </div>
      `;
    }
    
    // Navigation sections
    menuHTML += `
      <div class="mobile-menu-section">
        <div class="mobile-menu-section-title">Campus Services</div>
        
        <div class="mobile-menu-item has-submenu" data-target="lost-found">
          <i class="fas fa-search"></i>
          <span>Lost & Found</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="mobile-submenu" id="lost-found-submenu">
          <a href="/lost.html" class="mobile-submenu-item ${currentPath.includes('lost.html') ? 'active' : ''}">
            <i class="fas fa-question-circle"></i>
            <span>Lost Items</span>
          </a>
          <a href="/found.html" class="mobile-submenu-item ${currentPath.includes('found.html') ? 'active' : ''}">
            <i class="fas fa-check-circle"></i>
            <span>Found Items</span>
          </a>
        </div>
        
        <div class="mobile-menu-item has-submenu" data-target="marketplace">
          <i class="fas fa-store"></i>
          <span>Marketplace</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="mobile-submenu" id="marketplace-submenu">
          <a href="/marketplace.html" class="mobile-submenu-item ${currentPath.includes('marketplace.html') ? 'active' : ''}">
            <i class="fas fa-tag"></i>
            <span>Sell Items</span>
          </a>
          <a href="/buy-requests.html" class="mobile-submenu-item ${currentPath.includes('buy-requests.html') ? 'active' : ''}">
            <i class="fas fa-shopping-cart"></i>
            <span>Buy Requests</span>
          </a>
        </div>
        
        <div class="mobile-menu-item has-submenu" data-target="study">
          <i class="fas fa-file-alt"></i>
          <span>Study</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="mobile-submenu" id="study-submenu">
          <a href="/questionpaper.html" class="mobile-submenu-item ${currentPath.includes('questionpaper.html') ? 'active' : ''}">
            <i class="fas fa-book"></i>
            <span>Question Papers</span>
          </a>
          <a href="/upload-paper.html" class="mobile-submenu-item ${currentPath.includes('upload-paper.html') ? 'active' : ''}">
            <i class="fas fa-upload"></i>
            <span>Upload Papers</span>
          </a>
          <a href="/timetable.html" class="mobile-submenu-item ${currentPath.includes('timetable.html') ? 'active' : ''}">
            <i class="fas fa-calendar-alt"></i>
            <span>Timetable</span>
          </a>
        </div>
        
        <div class="mobile-menu-item has-submenu" data-target="faculty">
          <i class="fas fa-chalkboard-teacher"></i>
          <span>Faculty</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="mobile-submenu" id="faculty-submenu">
          <a href="/teachers.html" class="mobile-submenu-item ${currentPath.includes('teachers.html') ? 'active' : ''}">
            <i class="fas fa-users"></i>
            <span>Teacher Directory</span>
          </a>
        </div>
        
        <div class="mobile-menu-item has-submenu" data-target="services">
          <i class="fa-solid fa-briefcase"></i>
          <span>Services</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="mobile-submenu" id="services-submenu">
          <a href="/rentals.html" class="mobile-submenu-item ${currentPath.includes('rentals.html') ? 'active' : ''}">
            <i class="fa-solid fa-briefcase"></i>
            <span>Services</span>
          </a>
        </div>
        
        <div class="mobile-menu-item has-submenu" data-target="navigation">
          <i class="fas fa-map"></i>
          <span>Navigation</span>
          <i class="fas fa-chevron-right"></i>
        </div>
        <div class="mobile-submenu" id="navigation-submenu">
          <a href="/map.html" class="mobile-submenu-item ${currentPath.includes('map.html') ? 'active' : ''}">
            <i class="fas fa-location-dot"></i>
            <span>Campus Map</span>
          </a>
        </div>
      </div>
    `;
    
    // Auth buttons
    if (user) {
      menuHTML += `
        <div class="mobile-auth-buttons">
          <button class="mobile-auth-btn mobile-logout-btn" onclick="handleMobileLogout()">
            <i class="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      `;
    } else {
      menuHTML += `
        <div class="mobile-auth-buttons">
          <button class="mobile-auth-btn mobile-login-btn" onclick="window.location.href='login.html'">
            <i class="fas fa-sign-in-alt"></i>
            <span>Login / Register</span>
          </button>
        </div>
      `;
    }
    
    menuElement.innerHTML = menuHTML;
  }

  function setupMobileMenuEvents() {
    const hamburger = document.getElementById('mobile-menu-btn') || document.querySelector('.mobile-menu-btn');
    const overlay = document.getElementById('mobile-menu-overlay') || document.querySelector('.mobile-menu-overlay');
    const mobileMenu = document.getElementById('mobile-menu') || document.querySelector('.mobile-menu');
    
    if (!hamburger || !overlay || !mobileMenu) {
      console.log('Mobile elements not found, retrying...');
      setTimeout(setupMobileMenuEvents, 100);
      return;
    }
    
    console.log('Setting up mobile menu events');
    
    // Remove any existing listeners by creating fresh elements
    const newHamburger = hamburger.cloneNode(true);
    hamburger.parentNode.replaceChild(newHamburger, hamburger);
    
    const newOverlay = overlay.cloneNode(true);
    overlay.parentNode.replaceChild(newOverlay, overlay);
    
    const newMobileMenu = mobileMenu.cloneNode(true);
    mobileMenu.parentNode.replaceChild(newMobileMenu, mobileMenu);
    
    // Get fresh references
    const freshHamburger = document.getElementById('mobile-menu-btn') || document.querySelector('.mobile-menu-btn');
    const freshOverlay = document.getElementById('mobile-menu-overlay') || document.querySelector('.mobile-menu-overlay');
    const freshMobileMenu = document.getElementById('mobile-menu') || document.querySelector('.mobile-menu');
    
    // Toggle menu function
    function toggleMobileMenu(open) {
      if (open === undefined) {
        // Toggle
        const isOpen = freshMobileMenu.classList.contains('active');
        if (isOpen) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      } else if (open) {
        openMobileMenu();
      } else {
        closeMobileMenu();
      }
    }
    
    function openMobileMenu() {
      freshMobileMenu.classList.add('active');
      freshOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      const icon = freshHamburger.querySelector('i');
      if (icon) icon.className = 'fas fa-times';
    }
    
    function closeMobileMenu() {
      freshMobileMenu.classList.remove('active');
      freshOverlay.classList.remove('active');
      document.body.style.overflow = '';
      
      const icon = freshHamburger.querySelector('i');
      if (icon) icon.className = 'fas fa-bars';
      
      // Close all submenus
      document.querySelectorAll('.mobile-submenu.active').forEach(sub => {
        sub.classList.remove('active');
      });
      
      // Reset all chevrons
      document.querySelectorAll('.fa-chevron-right').forEach(chevron => {
        chevron.style.transform = '';
      });
    }
    
    // Hamburger click
    freshHamburger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Hamburger clicked');
      toggleMobileMenu();
    });
    
    // Overlay click
    freshOverlay.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeMobileMenu();
    });
    
    // Menu item clicks - FIXED
    freshMobileMenu.addEventListener('click', function(e) {
      // Don't close menu when clicking inside it (handled by specific cases)
      e.stopPropagation();
    });
    
    // Handle submenu toggles
    freshMobileMenu.querySelectorAll('.mobile-menu-item.has-submenu').forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetId = this.dataset.target;
        const submenu = document.getElementById(`${targetId}-submenu`);
        const chevron = this.querySelector('.fa-chevron-right');
        
        if (submenu) {
          // Close other open submenus
          freshMobileMenu.querySelectorAll('.mobile-submenu.active').forEach(menu => {
            if (menu.id !== `${targetId}-submenu`) {
              menu.classList.remove('active');
              const parentChevron = freshMobileMenu.querySelector(`[data-target="${menu.id.replace('-submenu', '')}"] .fa-chevron-right`);
              if (parentChevron) parentChevron.style.transform = '';
            }
          });
          
          submenu.classList.toggle('active');
          if (chevron) {
            chevron.style.transform = submenu.classList.contains('active') ? 'rotate(90deg)' : '';
          }
        }
      });
    });
    
    // Handle submenu item clicks (links) - FIXED
    freshMobileMenu.querySelectorAll('.mobile-submenu-item').forEach(link => {
      link.addEventListener('click', function(e) {
        // Let the link work normally
        // Don't close immediately to allow navigation
        setTimeout(() => {
          closeMobileMenu();
        }, 100);
      });
    });
    
    // Handle auth buttons
    freshMobileMenu.querySelectorAll('.mobile-auth-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        // Don't close immediately - let the onclick handler work
      });
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    });
    
    // Make close function globally available
    window.closeMobileMenu = closeMobileMenu;
  }

  function handleMobileLogout() {
    if (window.Auth) {
      window.Auth.logout();
      // Rebuild menu without user info
      const mobileMenu = document.querySelector('.mobile-menu');
      if (mobileMenu) {
        buildMobileMenuContent(mobileMenu);
        // Re-setup events after content change
        setupMobileMenuEvents();
      }
      updateAuthUI();
      window.location.reload();
    }
  }

  // Make mobile functions global
  window.handleMobileLogout = handleMobileLogout;
  window.toggleTheme = toggleTheme;

  // ============ END MOBILE NAVIGATION ============

  // ============ MAP FIX FOR MOBILE ============
  function fixMapOnMobile() {
    const mapContainer = document.getElementById('map-container');
    const mapElement = document.getElementById('map');
    
    if (mapContainer && mapElement && window.campusMap) {
      // Force map to recalculate its size
      setTimeout(() => {
        window.campusMap.invalidateSize();
        console.log('Map size invalidated for mobile');
      }, 500);
    }
  }

  // Make map fix function global
  window.fixMapOnMobile = fixMapOnMobile;

  // Map resize handlers
  window.addEventListener('orientationchange', function() {
    setTimeout(() => {
      if (window.campusMap) {
        window.campusMap.invalidateSize();
        console.log('Map resized for orientation change');
      }
    }, 300);
  });

  window.addEventListener('resize', function() {
    if (window.innerWidth <= 768 && window.campusMap) {
      setTimeout(() => {
        window.campusMap.invalidateSize();
        console.log('Map resized for window resize');
      }, 300);
    }
  });
  // ============ END MAP FIX ============

  // ============ AUTH UI UPDATE FUNCTION ============
  function updateAuthUI() {
    const user = window.Auth?.getCurrentUser();
    const welcomeMessage = document.getElementById('welcome-message');
    const userName = document.getElementById('user-name');
    const userRegno = document.getElementById('user-regno');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (user) {
      // User is logged in
      if (welcomeMessage) {
        welcomeMessage.style.display = 'flex';
        if (userName) userName.textContent = user.name || 'User';
        if (userRegno) userRegno.textContent = user.registrationNumber || '';
      }
      if (loginBtn) loginBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'flex';
    } else {
      // User is not logged in
      if (welcomeMessage) welcomeMessage.style.display = 'none';
      if (loginBtn) loginBtn.style.display = 'flex';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }

  // Make updateAuthUI globally available
  window.updateAuthUI = updateAuthUI;
  // ============ END AUTH UI UPDATE ============

  // Check authentication status
  function checkAuth() {
    return window.Auth && window.Auth.isLoggedIn();
  }

  // Get current user info
  function getCurrentUser() {
    return window.Auth ? window.Auth.getCurrentUser() : null;
  }

  // Alert notification function
  function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      ${message}
    `;
    
    document.body.insertBefore(alert, document.body.firstChild);
    
    setTimeout(() => {
      alert.remove();
    }, 3000);
  }

  // Make showAlert global
  window.showAlert = showAlert;

  // Image Preview Functions for Lost & Found pages
  function openImagePreview(imageSrc, caption = '') {
    // Check if modal exists, if not create it
    let modal = document.getElementById('imagePreviewModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'imagePreviewModal';
      modal.className = 'image-preview-modal';
      modal.innerHTML = `
        <div class="preview-container">
          <button class="close-preview" onclick="closeImagePreview(event)"><i class="fas fa-times"></i></button>
          <img id="previewImage" class="preview-image" src="" alt="Preview">
          <button class="download-preview" onclick="downloadPreviewImage()"><i class="fas fa-download"></i></button>
          <div id="previewCaption" class="preview-caption"></div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Add styles if not already present
      if (!document.getElementById('preview-styles')) {
        const style = document.createElement('style');
        style.id = 'preview-styles';
        style.textContent = `
          .image-preview-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            backdrop-filter: blur(5px);
          }
          
          .image-preview-modal.active {
            display: flex;
          }
          
          .preview-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }
          
          .preview-image {
            max-width: 100%;
            max-height: 90vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            animation: zoomIn 0.2s ease-out;
          }
          
          .close-preview {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 28px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(5px);
            z-index: 10001;
          }
          
          .close-preview:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
          }
          
          .download-preview {
            position: absolute;
            bottom: 30px;
            right: 30px;
            background: rgba(99, 102, 241, 0.9);
            border: none;
            color: white;
            font-size: 20px;
            width: 55px;
            height: 55px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(5px);
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          
          .download-preview:hover {
            background: rgba(99, 102, 241, 1);
            transform: translateY(-3px);
          }
          
          .preview-caption {
            position: absolute;
            bottom: 30px;
            left: 30px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            font-size: 16px;
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          @keyframes zoomIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          .clickable-image {
            cursor: pointer;
            transition: opacity 0.2s ease;
          }
          
          .clickable-image:hover {
            opacity: 0.9;
          }
          
          @media (max-width: 768px) {
            .close-preview {
              top: 15px;
              right: 15px;
              width: 45px;
              height: 45px;
              font-size: 24px;
            }
            
            .download-preview {
              bottom: 20px;
              right: 20px;
              width: 50px;
              height: 50px;
              font-size: 18px;
            }
            
            .preview-caption {
              bottom: 20px;
              left: 20px;
              font-size: 14px;
              padding: 8px 16px;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }
    
    const previewImage = document.getElementById('previewImage');
    const previewCaption = document.getElementById('previewCaption');
    
    previewImage.src = imageSrc;
    previewCaption.textContent = caption;
    modal.classList.add('active');
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  }

  function closeImagePreview(event) {
    // Don't close if clicking on the image or download button
    if (event && (event.target.closest('.preview-image') || event.target.closest('.download-preview'))) {
      return;
    }
    
    const modal = document.getElementById('imagePreviewModal');
    if (modal) {
      modal.classList.remove('active');
      // Restore body scrolling
      document.body.style.overflow = '';
    }
  }

  function downloadPreviewImage() {
    const previewImage = document.getElementById('previewImage');
    const link = document.createElement('a');
    link.href = previewImage.src;
    link.download = 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Make image preview functions global
  window.openImagePreview = openImagePreview;
  window.closeImagePreview = closeImagePreview;
  window.downloadPreviewImage = downloadPreviewImage;

  // Close modal with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('imagePreviewModal');
      if (modal && modal.classList.contains('active')) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });

  // Lost & Found functionality - ONLY RUN ON LOST/FOUND PAGES
  const lostForm = document.getElementById("lostForm");
  const foundForm = document.getElementById("foundForm");
  const itemsDiv = document.getElementById("items");

  // Show loading state for items
  function showItemsLoading(show = true) {
    if (!itemsDiv) return;
    if (show) {
      itemsDiv.innerHTML = `
        <div class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading items...</p>
        </div>
      `;
    }
  }

  // Only run loadItems if we're on a lost/found page
  if (location.pathname.includes("lost.html") || location.pathname.includes("found.html")) {
    async function loadItems(status) {
      showItemsLoading(true);
      
      try {
        const res = await fetch(`/api/items?status=${status}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        
        const items = await res.json();

        if (!itemsDiv) return;

        itemsDiv.innerHTML = "";

        if (!items.length) {
          itemsDiv.innerHTML = `
            <div class="empty-state">
              <i class="fas fa-inbox"></i>
              <h3>No ${status} items found</h3>
              <p>Be the first to report a ${status} item!</p>
            </div>
          `;
          return;
        }

        items.forEach(item => {
          const isLoggedIn = checkAuth();
          const currentUser = getCurrentUser();
          const canEdit = isLoggedIn && currentUser && 
                         (currentUser.registrationNumber === item.postedByRegistration);
          
          itemsDiv.innerHTML += `
            <div class="card">
              <span class="status ${item.status}">
                <i class="fas fa-${item.status === 'lost' ? 'exclamation-triangle' : 'check-circle'}"></i>
                ${item.status.toUpperCase()}
              </span>
              
              <h3>${item.title}</h3>
              <p><i class="fas fa-align-left"></i> ${item.description}</p>
              <p><i class="fas fa-map-marker-alt"></i> ${item.location}</p>
              <p><i class="fas fa-phone"></i> ${item.contact || "Not provided"}</p>
              <p><i class="fas fa-calendar"></i> ${new Date(item.date).toLocaleDateString()}</p>
              
              ${item.postedBy ? `<p><i class="fas fa-user"></i> Posted by: ${item.postedBy}</p>` : ''}
              ${item.postedByRegistration ? `<p><i class="fas fa-id-card"></i> Reg No: ${item.postedByRegistration}</p>` : ''}

              ${
                item.image
                  ? `<img src="${item.image}" alt="${item.title}" 
                        class="clickable-image"
                        onclick="openImagePreview('${item.image}', '${item.title} - ${item.location}')"
                        style="max-width: 100%; max-height: 200px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                        onerror="this.style.display='none';">`
                  : ""
              }

              <div class="card-actions">
                ${
                  item.status === "lost" && canEdit
                    ? `<button class="success" onclick="markFound('${item._id}', this)">
                         <i class="fas fa-check"></i> Mark Found
                       </button>`
                    : ""
                }
                ${
                  canEdit
                    ? `<button class="danger" onclick="deleteItem('${item._id}', this)">
                         <i class="fas fa-trash"></i> Delete
                       </button>`
                    : ""
                }
              </div>
            </div>
          `;
        });
      } catch (error) {
        console.error('Error loading items:', error);
        if (itemsDiv) {
          itemsDiv.innerHTML = `
            <div class="error-state">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>Error loading items</h3>
              <p>${error.message}</p>
              <button onclick="loadItems('${status}')" class="retry-btn">
                <i class="fas fa-redo"></i> Try Again
              </button>
            </div>
          `;
        }
      }
    }

    async function markFound(id, button) {
      if (!checkAuth()) {
        showAlert('Please login to mark items as found', 'error');
        return;
      }
      
      // Disable button and show loading state
      const originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
      
      try {
        const response = await fetch(`/api/items/${id}/found`, { 
          method: "PUT",
          headers: window.Auth.getAuthHeaders()
        });
        
        if (response.ok) {
          showAlert('Item marked as found!', 'success');
          loadItems("lost");
        } else {
          const error = await response.json();
          showAlert(error.error || 'Failed to mark as found', 'error');
          button.disabled = false;
          button.innerHTML = originalText;
        }
      } catch (error) {
        console.error('Error marking found:', error);
        showAlert('Failed to mark as found', 'error');
        button.disabled = false;
        button.innerHTML = originalText;
      }
    }

    async function deleteItem(id, button) {
      if (!checkAuth()) {
        showAlert('Please login to delete items', 'error');
        return;
      }
      
      if (!confirm('Are you sure you want to delete this item?')) return;
      
      // Disable button and show loading state
      const originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
      
      try {
        const response = await fetch(`/api/items/${id}`, { 
          method: "DELETE",
          headers: window.Auth.getAuthHeaders()
        });
        
        if (response.ok) {
          showAlert('Item deleted successfully!', 'success');
          const s = location.pathname.includes("found") ? "found" : "lost";
          loadItems(s);
        } else {
          const error = await response.json();
          showAlert(error.error || 'Failed to delete item', 'error');
          button.disabled = false;
          button.innerHTML = originalText;
        }
      } catch (error) {
        console.error('Error deleting item:', error);
        showAlert('Failed to delete item', 'error');
        button.disabled = false;
        button.innerHTML = originalText;
      }
    }

    // Make these functions available globally for onclick attributes
    window.markFound = markFound;
    window.deleteItem = deleteItem;

        if (lostForm) {
      lostForm.addEventListener("submit", async e => {
        e.preventDefault();
        
        if (!checkAuth()) {
          showAlert('Please login to report lost items', 'error');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1500);
          return;
        }
        
        // Disable submit button
        const submitBtn = lostForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reporting...';
        
        const formData = new FormData(lostForm);
        
        try {
          const response = await fetch("/api/items", {
            method: "POST",
            headers: window.Auth.getAuthHeadersFormData ? window.Auth.getAuthHeadersFormData() : {},
            body: formData
          });
          
          const result = await response.json();
          
          if (response.ok) {
            showAlert('Lost item reported successfully!', 'success');
            lostForm.reset();
            loadItems("lost");
          } else {
            showAlert(result.error || 'Failed to report item. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error reporting lost item:', error);
          showAlert('Network error: ' + error.message, 'error');
        } finally {
          // Always re-enable the button
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }

    if (foundForm) {
      foundForm.addEventListener("submit", async e => {
        e.preventDefault();
        
        if (!checkAuth()) {
          showAlert('Please login to report found items', 'error');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 1500);
          return;
        }
        
        // Disable submit button
        const submitBtn = foundForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reporting...';
        
        const formData = new FormData(foundForm);
        
        try {
          const response = await fetch("/api/items", {
            method: "POST",
            headers: window.Auth.getAuthHeadersFormData ? window.Auth.getAuthHeadersFormData() : {},
            body: formData
          });
          
          const result = await response.json();
          
          if (response.ok) {
            showAlert('Found item reported successfully!', 'success');
            foundForm.reset();
            loadItems("found");
          } else {
            showAlert(result.error || 'Failed to report item. Please try again.', 'error');
          }
        } catch (error) {
          console.error('Error reporting found item:', error);
          showAlert('Network error: ' + error.message, 'error');
        } finally {
          // Always re-enable the button
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    }
    
    // Load items based on current page
    if (location.pathname.includes("lost.html")) loadItems("lost");
    if (location.pathname.includes("found.html")) loadItems("found");
  }

  // Chatbot functionality - ONLY ON PAGES WITH CHATBOT
  function toggleChat() {
    const box = document.getElementById("chatbot-box");
    if (box) {
      box.style.display = box.style.display === "flex" ? "none" : "flex";
      
      if (box.style.display === "flex") {
        document.getElementById("chat-input").focus();
      }
    }
  }

  async function sendMessage() {
    const input = document.getElementById("chat-input");
    if (!input) return;
    
    const msg = input.value.trim();
    if (!msg) return;

    const messages = document.getElementById("chatbot-messages");
    if (!messages) return;

    // User message
    const userDiv = document.createElement("div");
    userDiv.className = "user-msg";
    userDiv.innerHTML = `<i class="fas fa-user"></i> ${msg}`;
    messages.appendChild(userDiv);

    input.value = "";

    // Loader
    const loader = document.createElement("div");
    loader.className = "loading";
    messages.appendChild(loader);

    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });

      const data = await res.json();
      loader.remove();

      const botDiv = document.createElement("div");
      botDiv.className = "bot-msg";
      botDiv.innerHTML = `<i class="fas fa-robot"></i> ${data.reply || "I couldn't find that information. Try asking about NERIST facilities, departments, or campus events."}`;
      messages.appendChild(botDiv);
    } catch (error) {
      loader.remove();
      const botDiv = document.createElement("div");
      botDiv.className = "bot-msg";
      botDiv.innerHTML = `<i class="fas fa-robot"></i> Sorry, I'm having trouble connecting. Please try again later.`;
      messages.appendChild(botDiv);
    }

    messages.scrollTop = messages.scrollHeight;
  }

  // Allow Enter key to send message
  const chatInput = document.getElementById("chat-input");
  if (chatInput) {
    chatInput.addEventListener("keypress", function(e) {
      if (e.key === "Enter") {
        sendMessage();
      }
    });
  }

  // Make chatbot functions global
  window.toggleChat = toggleChat;
  window.sendMessage = sendMessage;

  // Auto-hide chatbox when clicking outside
  document.addEventListener('click', function(event) {
    const chatbox = document.getElementById('chatbot-box');
    const chatBtn = document.getElementById('chatbot-btn');
    
    if (chatbox && chatbox.style.display === 'flex' &&
        !chatbox.contains(event.target) && 
        !chatBtn.contains(event.target)) {
      toggleChat();
    }
  });

  // Function to set active menu based on current page
  function setActiveMenu() {
    const currentPath = window.location.pathname;
    
    // Desktop active menu
    document.querySelectorAll('.menu > span').forEach(menu => {
      menu.classList.remove('active');
    });
    
    if (currentPath.includes('/lost.html')) {
      const lostMenu = document.querySelector('.menu:has(a[href*="lost.html"]) > span');
      if (lostMenu) lostMenu.classList.add('active');
    } else if (currentPath.includes('/found.html')) {
      const foundMenu = document.querySelector('.menu:has(a[href*="found.html"]) > span');
      if (foundMenu) foundMenu.classList.add('active');
    } else if (currentPath.includes('/marketplace.html')) {
      const marketplaceMenu = document.querySelector('.menu:has(a[href*="marketplace.html"]) > span');
      if (marketplaceMenu) marketplaceMenu.classList.add('active');
    } else if (currentPath.includes('/buy-requests.html')) {
      const buyMenu = document.querySelector('.menu:has(a[href*="buy-requests.html"]) > span');
      if (buyMenu) buyMenu.classList.add('active');
    } else if (currentPath.includes('/questionpaper.html')) {
      const questionMenu = document.querySelector('.menu:has(a[href*="questionpaper.html"]) > span');
      if (questionMenu) questionMenu.classList.add('active');
    } else if (currentPath.includes('/rentals.html')) {
      const rentalMenu = document.querySelector('.menu:has(a[href*="rentals.html"]) > span');
      if (rentalMenu) rentalMenu.classList.add('active');
    } else if (currentPath.includes('/map.html')) {
      const mapMenu = document.querySelector('.menu:has(a[href*="map.html"]) > span');
      if (mapMenu) mapMenu.classList.add('active');
    } else if (currentPath.includes('/teachers.html')) {
      const teachersMenu = document.querySelector('.menu:has(a[href*="teachers.html"]) > span');
      if (teachersMenu) teachersMenu.classList.add('active');
    } else if (currentPath.includes('/timetable.html')) {
      const timetableMenu = document.querySelector('.menu:has(a[href*="timetable.html"]) > span');
      if (timetableMenu) timetableMenu.classList.add('active');
    }
  }

  // Initialize authentication
  function initAuth() {
    if (!window.Auth) {
      console.error('Auth module not loaded');
      return;
    }
    
    // Check auth status on page load
    if (window.Auth.checkAuthStatus) {
      window.Auth.checkAuthStatus().then(isAuthenticated => {
        console.log('User authenticated:', isAuthenticated);
        updateAuthUI(); // Update UI after auth check
        
        const user = window.Auth.getCurrentUser();
        if (user) {
          console.log('Current user:', user);
          // Update mobile menu if it exists
          const mobileMenu = document.querySelector('.mobile-menu');
          if (mobileMenu && window.innerWidth <= 768) {
            buildMobileMenuContent(mobileMenu);
            // Re-setup events after content change
            setupMobileMenuEvents();
          }
        }
      }).catch(err => {
        console.error('Auth check failed:', err);
        updateAuthUI(); // Update UI even if check fails
      });
    } else {
      // Fallback: just check localStorage
      updateAuthUI();
    }
  }

  // Listen for auth state changes
  window.addEventListener('authStateChanged', function() {
    console.log('Auth state changed event received');
    updateAuthUI();
    
    const mobileMenu = document.querySelector('.mobile-menu');
    if (mobileMenu && window.innerWidth <= 768) {
      buildMobileMenuContent(mobileMenu);
      // Re-setup events after content change
      setupMobileMenuEvents();
    }
  });

  // Initialize everything when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    setActiveMenu();
    initAuth();
    updateAuthUI();
    
    // Initialize mobile navigation immediately
    initMobileNavigation();
    
    // Also initialize after a short delay to ensure DOM is fully ready
    setTimeout(() => {
      initMobileNavigation();
      updateAuthUI();
    }, 100);
    
    // Initialize on window load as well
    window.addEventListener('load', function() {
      initMobileNavigation();
      updateAuthUI();
      
      // Fix map on mobile after page load
      if (window.location.pathname.includes('map.html')) {
        setTimeout(() => {
          fixMapOnMobile();
        }, 500);
      }
    });
    
    console.log('Page loaded - Auth status:', window.Auth ? window.Auth.isLoggedIn() : 'Auth not loaded');
  });

  // Re-initialize on resize
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      initMobileNavigation();
      
      // Fix map on resize if on map page
      if (window.location.pathname.includes('map.html') && window.campusMap) {
        window.campusMap.invalidateSize();
      }
    }, 250);
  });
})();


function showComingSoon(platform) {
  const popup = document.getElementById('comingSoonPopup');
  const platformElement = document.getElementById('popupPlatform');
  platformElement.textContent = platform;
  popup.classList.add('show');
  
  // Close when clicking outside
  popup.onclick = function(e) {
    if (e.target === popup) {
      closePopup();
    }
  };
}

function closePopup() {
  const popup = document.getElementById('comingSoonPopup');
  popup.classList.remove('show');
}

// Close with Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closePopup();
  }
});
