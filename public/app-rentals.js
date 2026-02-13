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

      container.innerHTML += `
        <div class="card rental-card">
          <div class="service-badge ${r.serviceType}">
            ${serviceName}
          </div>
          <h3>${r.title || r.brand || 'Rental Service'}</h3>
          
          ${r.description ? `<p class="description">${r.description}</p>` : ''}
          
          ${r.serviceType === 'bike-scooty' && r.brand ? 
            `<p><i class="fas fa-tag"></i> ${r.brand}</p>` : ''}
          
          <p><i class="fas fa-rupee-sign"></i> ₹${r.price || r.rentPerDay} ${r.serviceType === 'bike-scooty' ? '/ day' : '/ use'}</p>
          <p><i class="fas fa-map-marker-alt"></i> ${r.location}</p>
          <p><i class="fas fa-phone"></i> ${r.contact}</p>
          
          ${r.postedBy ? `<p><i class="fas fa-user"></i> Posted by: ${r.postedBy}</p>` : ''}
          ${r.postedByRegistration ? `<p><i class="fas fa-id-card"></i> Reg No: ${r.postedByRegistration}</p>` : ''}
          
          <div class="availability-status">
            Status: <span class="status ${r.availability === 'available' ? 'available' : 'rented'}">
              ${r.availability === 'available' ? 'Available' : 'Currently Rented'}
            </span>
          </div>

          ${r.image ?
            `<div class="rental-image">
              <img src="/uploads/rentals/${r.image}" alt="${r.title || 'Rental Service'}" />
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
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to post rental service', 'error');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    showAlert('Network error. Please try again.', 'error');
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