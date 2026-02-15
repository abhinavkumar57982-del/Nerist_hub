// Theme initialization for all pages
document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('nerist-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  }
});

// Alert function for all pages
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

// Check authentication
function checkAuth() {
  return window.Auth && window.Auth.isLoggedIn();
}

// Get current user
function getCurrentUser() {
  return window.Auth ? window.Auth.getCurrentUser() : null;
}

// Image Preview Functions for Rentals
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

// Toggle service fields based on selection
function toggleServiceFields() {
  const serviceType = document.getElementById('serviceType').value;
  const otherServiceGroup = document.getElementById('otherServiceGroup');
  const bikeScootyFields = document.getElementById('bikeScootyFields');
  
  // Show/hide other service input
  if (serviceType === 'other') {
    otherServiceGroup.style.display = 'block';
    document.getElementById('otherServiceType').required = true;
  } else {
    otherServiceGroup.style.display = 'none';
    document.getElementById('otherServiceType').required = false;
  }
  
  // Show/hide bike/scooty specific fields
  if (serviceType === 'bike-scooty') {
    bikeScootyFields.style.display = 'block';
    // Make these fields required
    const vehicleType = document.querySelector('select[name="vehicleType"]');
    const brand = document.querySelector('input[name="brand"]');
    if (vehicleType) vehicleType.required = true;
    if (brand) brand.required = true;
  } else {
    bikeScootyFields.style.display = 'none';
    // Make these fields not required
    const vehicleType = document.querySelector('select[name="vehicleType"]');
    const brand = document.querySelector('input[name="brand"]');
    if (vehicleType) vehicleType.required = false;
    if (brand) brand.required = false;
  }
}

const form = document.getElementById("rentalForm");
const container = document.getElementById("rentalItems");

async function loadRentals() {
  try {
    const res = await fetch("/api/rentals");
    const items = await res.json();

    container.innerHTML = "";

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-info-circle"></i>
          <p>No rental services available yet. Be the first to post!</p>
        </div>
      `;
      return;
    }

    items.forEach(r => {
      // Determine service display name
      let serviceName = "";
      switch(r.serviceType) {
        case 'bike-scooty':
          serviceName = `🚲 ${r.vehicleType || 'Bike/Scooty'}`;
          break;
        case 'drawing':
          serviceName = '🎨 Drawing/Design Service';
          break;
        case 'printing':
          serviceName = '🖨️ Printing Service';
          break;
        case 'washing-machine':
          serviceName = '🧺 Washing Machine';
          break;
        case 'other':
          serviceName = `🔧 ${r.otherServiceType || 'Other Service'}`;
          break;
        default:
          serviceName = 'Rental Service';
      }

      const isLoggedIn = checkAuth();
      const currentUser = getCurrentUser();
      const canEdit = isLoggedIn && currentUser && 
                     (currentUser.registrationNumber === r.postedByRegistration);

      // Create price display
      const priceDisplay = r.price || r.rentPerDay || 'N/A';
      const priceUnit = r.serviceType === 'bike-scooty' ? '/ day' : '/ use';

      container.innerHTML += `
        <div class="card rental-card">
          <div class="service-badge ${r.serviceType}">
            ${serviceName}
          </div>
          <h3>${r.title || r.brand || 'Rental Service'}</h3>
          
          ${r.description ? `<p class="description">${r.description}</p>` : ''}
          
          ${r.serviceType === 'bike-scooty' && r.brand ? 
            `<p><i class="fas fa-tag"></i> ${r.brand}</p>` : ''}
          
          <p><i class="fas fa-rupee-sign"></i> ₹${priceDisplay} ${priceUnit}</p>
          <p><i class="fas fa-map-marker-alt"></i> ${r.location || 'Location not specified'}</p>
          <p><i class="fas fa-phone"></i> ${r.contact || 'Contact not provided'}</p>
          
          ${r.postedBy ? `<p><i class="fas fa-user"></i> Posted by: ${r.postedBy}</p>` : ''}
          ${r.postedByRegistration ? `<p><i class="fas fa-id-card"></i> Reg No: ${r.postedByRegistration}</p>` : ''}
          
          <div class="availability-status">
            Status: <span class="status ${r.availability === 'available' ? 'available' : 'rented'}">
              ${r.availability === 'available' ? 'Available' : 'Currently Rented'}
            </span>
          </div>

          ${r.image ?
            `<div class="rental-image">
              <img src="${r.image}" alt="${r.title || 'Rental Service'}" 
                   class="clickable-image"
                   onclick="openImagePreview('${r.image}', '${r.title || r.brand || 'Rental Service'} - ₹${priceDisplay}')"
                   style="max-width: 100%; max-height: 200px; object-fit: cover; border-radius: 4px; cursor: pointer;"
                   onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found';" />
            </div>` : ''
          }

          <div class="card-actions">
            ${
              r.availability === "available" && canEdit
                ? `<button onclick="markRented('${r._id}')" class="rent-btn success">
                    <i class="fas fa-check-circle"></i> Mark as Rented
                  </button>`
                : ""
            }

            ${
              canEdit
                ? `<button onclick="deleteRental('${r._id}')" class="delete-btn danger">
                    <i class="fas fa-trash"></i> Delete
                  </button>`
                : ""
            }
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error('Error loading rentals:', error);
    container.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load rental services. Please try again later.</p>
      </div>
    `;
  }
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  
  if (!checkAuth()) {
    showAlert('Please login to post rental services', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  // Disable submit button and show loading state
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
  
  try {
    const formData = new FormData(form);
    
    const response = await fetch("/api/rentals", {
      method: "POST",
      headers: window.Auth.getAuthHeadersFormData(),
      body: formData
    });
    
    if (response.ok) {
      showAlert('Rental service posted successfully!', 'success');
      form.reset();
      toggleServiceFields(); // Reset field visibility
      loadRentals();
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to post rental service', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showAlert('Network error. Please try again.', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

async function markRented(id) {
  if (!checkAuth()) {
    showAlert('Please login to mark services as rented', 'error');
    return;
  }
  
  if (!confirm('Mark this service as rented?')) return;
  
  try {
    const response = await fetch(`/api/rentals/${id}/rented`, { 
      method: "PUT",
      headers: window.Auth.getAuthHeaders()
    });
    
    if (response.ok) {
      showAlert('Service marked as rented!', 'success');
      loadRentals();
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to update status', 'error');
    }
  } catch (error) {
    console.error('Error marking rented:', error);
    showAlert('Failed to update status', 'error');
  }
}

async function deleteRental(id) {
  if (!checkAuth()) {
    showAlert('Please login to delete rental services', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this rental service?')) return;
  
  try {
    const response = await fetch(`/api/rentals/${id}`, { 
      method: "DELETE",
      headers: window.Auth.getAuthHeaders()
    });
    
    if (response.ok) {
      showAlert('Rental service deleted!', 'success');
      loadRentals();
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to delete service', 'error');
    }
  } catch (error) {
    console.error('Error deleting rental:', error);
    showAlert('Failed to delete service', 'error');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadRentals();
  toggleServiceFields();
});
