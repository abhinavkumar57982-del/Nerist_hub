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

const form = document.getElementById("buyForm");
const list = document.getElementById("list");

/* LOAD REQUESTS */
async function loadRequests() {
  try {
    const res = await fetch("/api/buy-requests");
    const data = await res.json();

    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-shopping-cart"></i>
          <h3>No buy requests yet</h3>
          <p>Be the first to post a buy request!</p>
        </div>
      `;
      return;
    }

    data.forEach(r => {
      const isLoggedIn = checkAuth();
      const currentUser = getCurrentUser();
      const canEdit = isLoggedIn && currentUser && 
                     (currentUser.registrationNumber === r.postedByRegistration);
      
      list.innerHTML += `
        <div class="card">
          <h3>${r.itemName}</h3>
          <p>${r.description || ""}</p>

          <p><b>Price:</b>
            ₹${r.minPrice || "Any"} – ₹${r.maxPrice || "Any"}
          </p>

          <p><b>Model:</b> ${r.model || "Any"}</p>
          <p><b>Category:</b> ${r.category || "Any"}</p>
          <p><b>Contact:</b> ${r.contact}</p>
          <p><b>Status:</b> ${r.status}</p>
          ${r.postedBy ? `<p><i class="fas fa-user"></i> Posted by: ${r.postedBy}</p>` : ''}
          ${r.postedByRegistration ? `<p><i class="fas fa-id-card"></i> Reg No: ${r.postedByRegistration}</p>` : ''}

          <div class="card-actions">
            ${
              r.status === "open" && canEdit
                ? `<button onclick="markFulfilled('${r._id}')" class="success">
                     <i class="fas fa-check"></i> Mark Fulfilled
                   </button>`
                : ""
            }

            ${
              canEdit
                ? `<button class="danger" onclick="deleteRequest('${r._id}')">
                     <i class="fas fa-trash"></i> Delete
                   </button>`
                : ""
            }
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error('Error loading buy requests:', error);
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading buy requests</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}

/* SUBMIT FORM */
form.addEventListener("submit", async e => {
  e.preventDefault();
  
  if (!checkAuth()) {
    showAlert('Please login to post buy requests', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }

  const formData = new FormData(form);
  
  try {
    const response = await fetch("/api/buy-requests", {
      method: "POST",
      headers: window.Auth.getAuthHeaders('application/x-www-form-urlencoded'),
      body: new URLSearchParams(formData)
    });

    if (response.ok) {
      showAlert('Buy request posted successfully!', 'success');
      form.reset();
      loadRequests();
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to post buy request', 'error');
    }
  } catch (error) {
    console.error('Error posting buy request:', error);
    showAlert('Network error. Please try again.', 'error');
  }
});

/* ACTIONS */
async function markFulfilled(id) {
  if (!checkAuth()) {
    showAlert('Please login to mark requests as fulfilled', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/buy-requests/${id}/fulfilled`, { 
      method: "PUT",
      headers: window.Auth.getAuthHeaders()
    });
    
    if (response.ok) {
      showAlert('Request marked as fulfilled!', 'success');
      loadRequests();
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to update request', 'error');
    }
  } catch (error) {
    console.error('Error marking fulfilled:', error);
    showAlert('Failed to update request', 'error');
  }
}

async function deleteRequest(id) {
  if (!checkAuth()) {
    showAlert('Please login to delete requests', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this request?')) return;
  
  try {
    const response = await fetch(`/api/buy-requests/${id}`, { 
      method: "DELETE",
      headers: window.Auth.getAuthHeaders()
    });
    
    if (response.ok) {
      showAlert('Request deleted successfully!', 'success');
      loadRequests();
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to delete request', 'error');
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    showAlert('Failed to delete request', 'error');
  }
}

loadRequests();