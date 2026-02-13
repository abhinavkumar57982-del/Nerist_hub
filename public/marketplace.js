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

const form = document.getElementById("sellForm");
const itemsDiv = document.getElementById("items");

/* ---------------- POST ITEM ---------------- */
form.addEventListener("submit", async e => {
  e.preventDefault();
  
  if (!checkAuth()) {
    showAlert('Please login to sell items', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
    return;
  }
  
  const data = new FormData(form);

  try {
    const response = await fetch("/api/marketplace", {
      method: "POST",
      headers: window.Auth.getAuthHeadersFormData(),
      body: data
    });

    if (response.ok) {
      showAlert('Item posted successfully!', 'success');
      form.reset();
      loadItems();
    } else {
      const error = await response.json();
      showAlert(error.error || 'Upload failed', 'error');
    }
  } catch (error) {
    console.error('Error posting item:', error);
    showAlert('Network error. Please try again.', 'error');
  }
});

/* ---------------- LOAD ITEMS ---------------- */
async function loadItems() {
  try {
    const res = await fetch("/api/marketplace");
    const items = await res.json();

    itemsDiv.innerHTML = "";

    if (items.length === 0) {
      itemsDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-store"></i>
          <h3>No items for sale</h3>
          <p>Be the first to post an item!</p>
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
          ${item.image ? `<img src="/uploads/marketplace/${item.image}" alt="${item.title}" />` : ''}
          <h3>${item.title}</h3>
          <p>${item.description || ""}</p>
          <p><b>₹${item.price}</b></p>
          <p>Status: ${item.status}</p>
          <p>Contact: ${item.contact}</p>
          ${item.postedBy ? `<p><i class="fas fa-user"></i> Posted by: ${item.postedBy}</p>` : ''}
          ${item.postedByRegistration ? `<p><i class="fas fa-id-card"></i> Reg No: ${item.postedByRegistration}</p>` : ''}

          <div class="card-actions">
            ${
              item.status === "available" && canEdit
                ? `<button onclick="markSold('${item._id}')" class="success">
                     <i class="fas fa-check"></i> Mark Sold
                   </button>`
                : ""
            }
            ${
              canEdit
                ? `<button class="danger" onclick="deleteItem('${item._id}')">
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
    itemsDiv.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error loading items</h3>
        <p>Please try again later</p>
      </div>
    `;
  }
}

/* ---------------- ACTIONS ---------------- */
async function markSold(id) {
  if (!checkAuth()) {
    showAlert('Please login to mark items as sold', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/marketplace/${id}/sold`, { 
      method: "PUT",
      headers: window.Auth.getAuthHeaders()
    });
    
    if (response.ok) {
      showAlert('Item marked as sold!', 'success');
      loadItems();
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to update item', 'error');
    }
  } catch (error) {
    console.error('Error marking sold:', error);
    showAlert('Failed to update item', 'error');
  }
}

async function deleteItem(id) {
  if (!checkAuth()) {
    showAlert('Please login to delete items', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to delete this item?')) return;
  
  try {
    const response = await fetch(`/api/marketplace/${id}`, { 
      method: "DELETE",
      headers: window.Auth.getAuthHeaders()
    });
    
    if (response.ok) {
      showAlert('Item deleted successfully!', 'success');
      loadItems();
    } else {
      const error = await response.json();
      showAlert(error.error || 'Failed to delete item', 'error');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    showAlert('Failed to delete item', 'error');
  }
}

loadItems();