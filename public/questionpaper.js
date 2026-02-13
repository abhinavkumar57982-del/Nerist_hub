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

const list = document.getElementById("list");

async function loadPapers() {
  const params = new URLSearchParams();

  const year = document.getElementById("year").value;
  const semester = document.getElementById("semester").value;
  const branch = document.getElementById("branch").value;
  const subject = document.getElementById("subject").value;
  const subjectCode = document.getElementById("subjectCode").value;

  if (year) params.append("year", year);
  if (semester) params.append("semester", semester);
  if (branch) params.append("branch", branch);
  if (subject) params.append("subject", subject);
  if (subjectCode) params.append("subjectCode", subjectCode);

  const res = await fetch(`/api/question-papers?${params.toString()}`);
  const papers = await res.json();

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

  papers.forEach(p => {
    list.innerHTML += `
      <div class="card">
        <h3>${p.subject} (${p.subjectCode})</h3>
        <p><b>Year:</b> ${p.year}</p>
        <p><b>Semester:</b> ${p.semester}</p>
        <p><b>Branch:</b> ${p.branch}</p>
        ${p.uploadedBy ? `<p><i class="fas fa-user"></i> Uploaded by: ${p.uploadedBy}</p>` : ''}
        ${p.uploadedByRegistration ? `<p><i class="fas fa-id-card"></i> Reg No: ${p.uploadedByRegistration}</p>` : ''}
        ${p.uploadDate ? `<p><i class="fas fa-calendar"></i> Uploaded: ${new Date(p.uploadDate).toLocaleDateString()}</p>` : ''}

        <a href="/uploads/question-papers/${p.pdf}" download class="btn" style="margin-top: 12px;">
          <i class="fas fa-download"></i> Download PDF
        </a>
      </div>
    `;
  });
}

function resetFilters() {
  document.querySelectorAll(".filters input").forEach(i => (i.value = ""));
  loadPapers();
}

/* AUTO LOAD */
loadPapers();