// Global variables
let currentUser = null;
let userPapers = new Set(); // Store IDs of papers uploaded by current user
let allPapers = []; // Store all papers for filtering

// Check authentication status
function checkAuth() {
    if (window.Auth) {
        currentUser = window.Auth.getCurrentUser();
        console.log('Current user:', currentUser);
    }
}

// Delete question paper function
async function deleteQuestionPaper(paperId, event) {
    // Stop event propagation to prevent any parent handlers
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    // Check if paperId is valid
    if (!paperId) {
        console.error('Invalid paper ID');
        alert('Invalid paper ID');
        return;
    }
    
    try {
        if (!window.Auth || !window.Auth.isLoggedIn()) {
            alert('You must be logged in to delete question papers');
            return;
        }
        
        // Show confirmation
        if (!confirm('Are you sure you want to delete this question paper? This action cannot be undone.')) {
            return;
        }
        
        console.log('Deleting question paper:', paperId);
        console.log('Auth headers:', window.Auth.getAuthHeaders());
        
        const response = await fetch(`/api/question-papers/${paperId}`, {
            method: 'DELETE',
            headers: window.Auth.getAuthHeaders()
        });
        
        console.log('Delete response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Delete successful:', data);
            
            // Remove the paper card from UI
            const paperElement = document.querySelector(`.paper-card[data-id="${paperId}"]`);
            if (paperElement) {
                paperElement.remove();
            }
            
            // Remove from userPapers Set
            userPapers.delete(paperId);
            
            // Remove from allPapers array
            allPapers = allPapers.filter(p => p._id !== paperId);
            
            // Show success message
            if (window.showAlert) {
                window.showAlert('Question paper deleted successfully!', 'success');
            } else {
                alert('Question paper deleted successfully!');
            }
            
            // Check if there are no papers left
            const list = document.getElementById("list");
            if (list && list.children.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <h3>No question papers found</h3>
                        <p>Try adjusting your filters or upload the first paper!</p>
                    </div>
                `;
            }
        } else {
            const errorData = await response.json();
            console.error('Failed to delete paper:', errorData);
            
            // More specific error message
            if (response.status === 404) {
                alert('Question paper not found. It may have been already deleted.');
            } else if (response.status === 403) {
                alert('You can only delete your own question papers.');
            } else if (response.status === 401) {
                alert('Your session has expired. Please login again.');
                // Redirect to login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } else {
                alert('Failed to delete question paper: ' + (errorData.error || 'Unknown error'));
            }
        }
    } catch (error) {
        console.error('Error deleting question paper:', error);
        alert('Error deleting question paper. Please check console for details.');
    }
}

// Load papers function
async function loadPapers() {
    const params = new URLSearchParams();

    const year = document.getElementById("year")?.value;
    const semester = document.getElementById("semester")?.value;
    const branch = document.getElementById("branch")?.value;
    const subject = document.getElementById("subject")?.value;
    const subjectCode = document.getElementById("subjectCode")?.value;

    if (year) params.append("year", year);
    if (semester) params.append("semester", semester);
    if (branch) params.append("branch", branch);
    if (subject) params.append("subject", subject);
    if (subjectCode) params.append("subjectCode", subjectCode);

    showLoading(true);

    try {
        const res = await fetch(`/api/question-papers?${params.toString()}`);
        
        if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
        }
        
        allPapers = await res.json();

        const list = document.getElementById("list");
        if (!list) return;
        
        renderPapers(allPapers);
    } catch (error) {
        console.error('Error loading papers:', error);
        const list = document.getElementById("list");
        if (list) {
            list.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error loading papers</h3>
                    <p>${error.message}</p>
                    <button onclick="loadPapers()" class="retry-btn">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Helper function to get Cloudinary download URL
function getCloudinaryDownloadUrl(pdfUrl, fileName) {
    if (!pdfUrl) return pdfUrl;
    
    // Check if it's a Cloudinary URL
    if (pdfUrl.includes('cloudinary')) {
        // Add fl_attachment flag to force download
        let downloadUrl = pdfUrl;
        
        // Handle different Cloudinary URL formats
        if (pdfUrl.includes('?')) {
            // URL already has parameters
            downloadUrl = pdfUrl + '&fl_attachment';
        } else {
            // URL has no parameters
            downloadUrl = pdfUrl + '?fl_attachment';
        }
        
        // Add filename if provided (optional)
        if (fileName) {
            downloadUrl += `&filename=${encodeURIComponent(fileName)}`;
        }
        
        return downloadUrl;
    }
    
    // Not a Cloudinary URL, return as is
    return pdfUrl;
}

// Render papers function - UPDATED with Cloudinary download flag
function renderPapers(papers) {
    const list = document.getElementById("list");
    if (!list) return;
    
    list.innerHTML = "";

    if (papers.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No question papers found</h3>
                <p>Try adjusting your filters or upload the first paper!</p>
            </div>
        `;
        return;
    }

    // Check authentication status
    checkAuth();
    
    // Clear userPapers Set and add IDs of papers owned by current user
    userPapers.clear();
    if (currentUser) {
        papers.forEach(paper => {
            if (paper.userId === currentUser.id) {
                userPapers.add(paper._id);
            }
        });
    }

    papers.forEach(p => {
        const isOwner = currentUser && p.userId === currentUser.id;
        
        // Create paper card with delete button if owner
        const paperCard = document.createElement('div');
        paperCard.className = 'card paper-card';
        paperCard.setAttribute('data-id', p._id);
        
        // Create header with title and delete button
        const header = document.createElement('div');
        header.className = 'card-header';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-start';
        header.style.marginBottom = '10px';
        
        const title = document.createElement('h3');
        title.className = 'card-title';
        title.style.margin = '0';
        title.style.flex = '1';
        title.style.paddingRight = '10px';
        title.innerHTML = `${p.subject} (${p.subjectCode})`;
        
        header.appendChild(title);
        
        // Add delete button if user owns this paper
        if (isOwner) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-paper-btn';
            deleteBtn.setAttribute('onclick', `deleteQuestionPaper('${p._id}', event)`);
            deleteBtn.setAttribute('title', 'Delete this question paper');
            deleteBtn.style.background = 'rgba(239, 68, 68, 0.1)';
            deleteBtn.style.color = 'var(--accent-danger)';
            deleteBtn.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            deleteBtn.style.borderRadius = '50%';
            deleteBtn.style.width = '36px';
            deleteBtn.style.height = '36px';
            deleteBtn.style.display = 'flex';
            deleteBtn.style.alignItems = 'center';
            deleteBtn.style.justifyContent = 'center';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.transition = 'var(--transition)';
            deleteBtn.style.fontSize = '16px';
            deleteBtn.style.flexShrink = '0';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            
            // Add hover effect
            deleteBtn.addEventListener('mouseenter', function() {
                this.style.background = 'var(--accent-danger)';
                this.style.color = 'white';
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = 'var(--shadow-sm)';
            });
            deleteBtn.addEventListener('mouseleave', function() {
                this.style.background = 'rgba(239, 68, 68, 0.1)';
                this.style.color = 'var(--accent-danger)';
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
            
            header.appendChild(deleteBtn);
        }
        
        paperCard.appendChild(header);
        
        // Add paper details
        const details = document.createElement('div');
        details.className = 'paper-details';
        details.style.margin = '10px 0';
        details.innerHTML = `
            <p style="margin: 5px 0; font-size: 14px;"><b style="color: var(--text-primary);">Year:</b> ${p.year}</p>
            <p style="margin: 5px 0; font-size: 14px;"><b style="color: var(--text-primary);">Semester:</b> ${p.semester}</p>
            <p style="margin: 5px 0; font-size: 14px;"><b style="color: var(--text-primary);">Branch:</b> ${p.branch}</p>
        `;
        paperCard.appendChild(details);
        
        // Add uploader info
        const uploaderInfo = document.createElement('div');
        uploaderInfo.className = 'uploader-info';
        uploaderInfo.style.display = 'flex';
        uploaderInfo.style.flexWrap = 'wrap';
        uploaderInfo.style.gap = '15px';
        uploaderInfo.style.margin = '10px 0';
        uploaderInfo.style.padding = '10px 0';
        uploaderInfo.style.borderTop = '1px solid var(--border-color)';
        uploaderInfo.style.borderBottom = '1px solid var(--border-color)';
        uploaderInfo.style.fontSize = '13px';
        uploaderInfo.style.color = 'var(--text-secondary)';
        
        let uploaderHtml = '';
        if (p.uploadedBy) {
            uploaderHtml += `<span style="display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-user" style="color: var(--accent-primary); font-size: 12px;"></i> ${p.uploadedBy}</span>`;
        }
        if (p.uploadedByRegistration) {
            uploaderHtml += `<span style="display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-id-card" style="color: var(--accent-primary); font-size: 12px;"></i> ${p.uploadedByRegistration}</span>`;
        }
        if (p.uploadedAt) {
            uploaderHtml += `<span style="display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-calendar" style="color: var(--accent-primary); font-size: 12px;"></i> ${new Date(p.uploadedAt).toLocaleDateString()}</span>`;
        }
        
        uploaderInfo.innerHTML = uploaderHtml;
        paperCard.appendChild(uploaderInfo);
        
        // Create filename for download
        const fileName = `${p.subject || 'Paper'}_${p.subjectCode || ''}_${p.year || ''}.pdf`.replace(/\s+/g, '_');
        
        // Get Cloudinary download URL
        const downloadUrl = getCloudinaryDownloadUrl(p.pdf, fileName);
        
        // Add action buttons container
        const actionButtons = document.createElement('div');
        actionButtons.className = 'pdf-actions';
        actionButtons.style.display = 'flex';
        actionButtons.style.gap = '10px';
        actionButtons.style.marginTop = '15px';
        actionButtons.style.flexWrap = 'wrap';
        
        // View button (opens in our PDF viewer)
        const viewBtn = document.createElement('a');
        viewBtn.href = `/pdf-viewer.html?file=${encodeURIComponent(p.pdf)}&name=${encodeURIComponent(p.subject || 'Paper')}`;
        viewBtn.className = 'btn';
        viewBtn.setAttribute('target', '_blank');
        viewBtn.style.flex = '1';
        viewBtn.style.minWidth = '120px';
        viewBtn.style.background = 'var(--accent-primary)';
        viewBtn.style.color = 'white';
        viewBtn.style.textDecoration = 'none';
        viewBtn.style.padding = '12px';
        viewBtn.style.borderRadius = 'var(--radius-sm)';
        viewBtn.style.display = 'inline-flex';
        viewBtn.style.alignItems = 'center';
        viewBtn.style.justifyContent = 'center';
        viewBtn.style.gap = '8px';
        viewBtn.style.fontWeight = '600';
        viewBtn.style.fontSize = '14px';
        viewBtn.style.cursor = 'pointer';
        viewBtn.style.transition = 'var(--transition)';
        viewBtn.style.border = 'none';
        viewBtn.innerHTML = '<i class="fas fa-eye"></i> View PDF';
        
        // Download button - using Cloudinary download flag
        const downloadBtn = document.createElement('a');
        downloadBtn.href = downloadUrl;
        downloadBtn.className = 'btn';
        // Note: We don't use download attribute because Cloudinary handles it
        downloadBtn.setAttribute('target', '_blank');
        downloadBtn.style.flex = '1';
        downloadBtn.style.minWidth = '120px';
        downloadBtn.style.background = 'var(--accent-success)';
        downloadBtn.style.color = 'white';
        downloadBtn.style.textDecoration = 'none';
        downloadBtn.style.padding = '12px';
        downloadBtn.style.borderRadius = 'var(--radius-sm)';
        downloadBtn.style.display = 'inline-flex';
        downloadBtn.style.alignItems = 'center';
        downloadBtn.style.justifyContent = 'center';
        downloadBtn.style.gap = '8px';
        downloadBtn.style.fontWeight = '600';
        downloadBtn.style.fontSize = '14px';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.transition = 'var(--transition)';
        downloadBtn.style.border = 'none';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download PDF';
        
        // Add hover effects
        viewBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = 'var(--shadow-md)';
        });
        viewBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        downloadBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = 'var(--shadow-md)';
        });
        downloadBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        actionButtons.appendChild(viewBtn);
        actionButtons.appendChild(downloadBtn);
        paperCard.appendChild(actionButtons);
        
        list.appendChild(paperCard);
    });
}

// Load only papers uploaded by current user
window.loadMyPapersFromJS = async function() {
    if (!window.Auth || !window.Auth.isLoggedIn()) {
        alert('Please login to view your papers');
        return;
    }
    
    // If allPapers is empty, load papers first
    if (allPapers.length === 0) {
        await loadPapers();
    }
    
    // Filter papers by current user
    const myPapers = allPapers.filter(paper => paper.userId === currentUser?.id);
    renderPapers(myPapers);
};

// Show all papers
window.showAllPapersFromJS = function() {
    renderPapers(allPapers);
};

// Show loading state
function showLoading(show = true) {
    const list = document.getElementById("list");
    if (!list) return;
    
    if (show) {
        list.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading question papers...</p>
            </div>
        `;
    }
}

// Reset filters function
function resetFilters() {
    document.querySelectorAll(".filters input").forEach(i => (i.value = ""));
    loadPapers();
}

// Add loading state to filter button
document.addEventListener('DOMContentLoaded', function() {
    // Check auth on load
    checkAuth();
    
    const filterBtn = document.querySelector('button[onclick="loadPapers()"]');
    if (filterBtn) {
        filterBtn.addEventListener('click', async function(e) {
            const originalText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            await loadPapers();
            this.disabled = false;
            this.innerHTML = originalText;
        });
    }
    
    // Load papers
    loadPapers();
    
    // Listen for auth state changes
    window.addEventListener('authStateChanged', function() {
        checkAuth();
        loadPapers(); // Reload papers to update delete buttons
    });
});

// Make functions globally available
window.deleteQuestionPaper = deleteQuestionPaper;
window.loadPapers = loadPapers;
window.resetFilters = resetFilters;
window.loadMyPapers = window.loadMyPapersFromJS;
window.showAllPapers = window.showAllPapersFromJS;

/* AUTO LOAD */
loadPapers();
