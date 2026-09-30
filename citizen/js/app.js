/**
 * GramSetu — Citizen Application Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Support browsing when opened directly from local filesystem (file://)
  if (window.location.protocol === 'file:') {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#fef3c7; color:#92400e; padding:8px 16px; font-size:12px; font-weight:600; text-align:center; border-bottom:1px solid #fde68a; position:sticky; top:0; z-index:99999;';
    banner.innerHTML = '⚡ <strong>Local File Mode:</strong> Connected to GramSetu Cloud API. (To run locally offline, double-click <code>run-windows.bat</code> or run <code>npm run dev</code> at <code>http://localhost:3000</code>)';
    document.body.prepend(banner);

    document.querySelectorAll('a[href^="/citizen/"]').forEach(a => {
      a.href = a.getAttribute('href').replace('/citizen/', './');
    });
    document.querySelectorAll('a[href^="/admin/"]').forEach(a => {
      a.href = a.getAttribute('href').replace('/admin/', '../admin/');
    });
  }

  // Mobile navigation toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Update navigation state
  if (window.auth) {
    window.auth.renderNav();
  }

  // Check Database & System Health on page load
  checkSystemHealth();

  // Route page specific logic
  const pageId = document.body.dataset.page;
  if (pageId === 'home') {
    initHomePage();
  } else if (pageId === 'register') {
    initRegisterPage();
  } else if (pageId === 'login') {
    initLoginPage();
  } else if (pageId === 'dashboard') {
    if (window.auth.requireAuth()) initDashboardPage();
  } else if (pageId === 'submit-complaint') {
    if (window.auth.requireAuth()) initSubmitComplaintPage();
  } else if (pageId === 'complaints') {
    if (window.auth.requireAuth()) initComplaintsPage();
  } else if (pageId === 'complaint-details') {
    if (window.auth.requireAuth()) initComplaintDetailsPage();
  } else if (pageId === 'profile') {
    if (window.auth.requireAuth()) initProfilePage();
  }
});

/**
 * Health check & diagnostic banner
 */
async function checkSystemHealth() {
  const healthBanner = document.getElementById('systemHealthBanner');
  if (!healthBanner) return;

  try {
    const health = await window.api.getHealth();
    if (health.database !== 'connected') {
      healthBanner.innerHTML = `
        <div class="alert alert-warning" style="margin-bottom: 0; border-radius: 0;">
          <strong>Database Notice:</strong> MongoDB Atlas is currently not connected. 
          Please configure <code>MONGODB_URI</code> in <code>.env</code> to enable live citizen registration, complaint submission, and administrative actions.
        </div>
      `;
      healthBanner.style.display = 'block';
    } else {
      healthBanner.style.display = 'none';
    }
  } catch (err) {
    // Backend unreachable
    healthBanner.innerHTML = `
      <div class="alert alert-danger" style="margin-bottom: 0; border-radius: 0;">
        <strong>Backend Disconnected:</strong> Unable to connect to GramSetu API service. Please verify server status.
      </div>
    `;
    healthBanner.style.display = 'block';
  }
}

/**
 * 1. Home Page Initialization
 */
async function initHomePage() {
  const ctaBtn = document.getElementById('homeCtaBtn');
  if (ctaBtn) {
    if (window.auth.isAuthenticated()) {
      ctaBtn.textContent = 'Go to Citizen Dashboard →';
      ctaBtn.href = '/citizen/dashboard.html';
    } else {
      ctaBtn.textContent = 'Register Grievance Now →';
      ctaBtn.href = '/citizen/register.html';
    }
  }
}

/**
 * 2. Registration Page
 */
function initRegisterPage() {
  window.auth.redirectIfAuthenticated();

  const form = document.getElementById('registerForm');
  const alertBox = document.getElementById('registerAlert');
  const submitBtn = document.getElementById('registerSubmitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const fullName = form.fullName.value.trim();
    const mobile = form.mobile.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Client-side validations
    if (!fullName) {
      showAlert(alertBox, 'Please enter your Full Name.');
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      showAlert(alertBox, 'Please enter a valid 10-digit Indian mobile number (starting with 6-9).');
      return;
    }

    if (password.length < 6) {
      showAlert(alertBox, 'Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert(alertBox, 'Passwords do not match. Please verify your password confirmation.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering with Gram Panchayat...';

    try {
      const res = await window.api.register({
        fullName,
        mobile,
        email: email || undefined,
        password,
        confirmPassword,
      });

      if (res.success && res.token) {
        window.auth.setSession(res.token, res.user);
        window.location.href = '/citizen/dashboard.html?registered=1';
      } else {
        showAlert(alertBox, res.error || 'Registration failed.');
      }
    } catch (err) {
      showAlert(alertBox, err.message || 'Server error during registration.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete Citizen Registration';
    }
  });
}

/**
 * 3. Login Page
 */
function initLoginPage() {
  window.auth.redirectIfAuthenticated();

  const form = document.getElementById('loginForm');
  const alertBox = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('loginSubmitBtn');

  // Check URL params for loggedOut or expired
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('loggedOut')) {
    showSuccess(alertBox, 'You have been successfully logged out.');
  } else if (urlParams.has('expired')) {
    showAlert(alertBox, 'Your session expired. Please sign in again.');
  }

  if (!form) return;

  const fillDemoBtn = document.getElementById('fillDemoCitizenBtn');
  if (fillDemoBtn) {
    fillDemoBtn.addEventListener('click', () => {
      form.identifier.value = '9876543210';
      form.password.value = 'password123';
      alertBox.style.display = 'none';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const identifier = form.identifier.value.trim();
    const password = form.password.value;

    if (!identifier) {
      showAlert(alertBox, 'Please enter your registered Mobile Number or Email.');
      return;
    }

    if (!password) {
      showAlert(alertBox, 'Please enter your password.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    try {
      const res = await window.api.login({ identifier, password });
      if (res.success && res.token) {
        window.auth.setSession(res.token, res.user);
        const redirect = urlParams.get('redirect') || '/citizen/dashboard.html';
        window.location.href = redirect;
      } else {
        showAlert(alertBox, res.error || 'Authentication failed.');
      }
    } catch (err) {
      showAlert(alertBox, err.message || 'Login failed. Please check credentials.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In to Citizen Portal';
    }
  });
}

/**
 * 4. Dashboard Page
 */
async function initDashboardPage() {
  const user = window.auth.getUser();
  const userNameEl = document.getElementById('dashUserName');
  const userMobileEl = document.getElementById('dashUserMobile');

  if (userNameEl && user) userNameEl.textContent = user.fullName;
  if (userMobileEl && user) userMobileEl.textContent = user.mobile;

  // Real MongoDB statistics
  const statTotal = document.getElementById('statTotal');
  const statSubmitted = document.getElementById('statSubmitted');
  const statInProgress = document.getElementById('statInProgress');
  const statResolved = document.getElementById('statResolved');
  const recentTableBody = document.getElementById('recentComplaintsTableBody');
  const emptyState = document.getElementById('dashboardEmptyState');

  try {
    const res = await window.api.getDashboard();
    if (res.success && res.stats) {
      if (statTotal) statTotal.textContent = res.stats.total;
      if (statSubmitted) statSubmitted.textContent = res.stats.submitted;
      if (statInProgress) statInProgress.textContent = res.stats.inProgress;
      if (statResolved) statResolved.textContent = res.stats.resolved;

      if (res.recentComplaints && res.recentComplaints.length > 0) {
        if (emptyState) emptyState.style.display = 'none';
        if (recentTableBody) {
          recentTableBody.innerHTML = res.recentComplaints
            .map((c) => renderComplaintRow(c))
            .join('');
        }
      } else {
        if (emptyState) emptyState.style.display = 'block';
        if (recentTableBody) recentTableBody.innerHTML = '';
      }
    }
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
}

/**
 * 5. Submit Complaint Page
 */
function initSubmitComplaintPage() {
  const form = document.getElementById('submitComplaintForm');
  const alertBox = document.getElementById('submitAlert');
  const submitBtn = document.getElementById('submitBtn');
  const fileInput = document.getElementById('photoInput');
  const uploadArea = document.getElementById('uploadArea');
  const previewContainer = document.getElementById('uploadPreview');
  const previewImage = document.getElementById('previewImg');
  const removePhotoBtn = document.getElementById('removePhotoBtn');

  // Success Modal
  const successModal = document.getElementById('complaintSuccessModal');
  const modalComplaintId = document.getElementById('modalComplaintId');
  const modalViewBtn = document.getElementById('modalViewBtn');

  let selectedFile = null;

  // Drag and drop & file selection handlers
  if (uploadArea && fileInput) {
    uploadArea.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach((eventName) => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      uploadArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
      });
    });

    uploadArea.addEventListener('drop', (e) => {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        handleFileSelect(fileInput.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      showAlert(alertBox, 'Invalid file format. Please upload JPG, JPEG, PNG, or WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert(alertBox, 'Image size exceeds maximum limit of 5 MB.');
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
    alertBox.style.display = 'none';
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFile = null;
      fileInput.value = '';
      previewContainer.style.display = 'none';
      previewImage.src = '';
    });
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const title = form.title.value.trim();
    const category = form.category.value;
    const location = form.location.value.trim();
    const description = form.description.value.trim();

    if (!title) {
      showAlert(alertBox, 'Please enter a title for your complaint.');
      return;
    }

    if (!category) {
      showAlert(alertBox, 'Please select a grievance category.');
      return;
    }

    if (!location) {
      showAlert(alertBox, 'Please enter the exact location or landmark.');
      return;
    }

    if (!description) {
      showAlert(alertBox, 'Please provide a clear description of the issue.');
      return;
    }

    // Build real FormData
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('location', location);
    formData.append('description', description);
    if (selectedFile) {
      formData.append('photo', selectedFile);
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading to Cloudinary & Submitting to MongoDB...';

    try {
      const res = await window.api.submitComplaint(formData);
      if (res.success && res.complaint) {
        if (successModal && modalComplaintId) {
          modalComplaintId.textContent = res.complaint.complaintId;
          modalViewBtn.href = `/citizen/complaint-details.html?id=${res.complaint.complaintId}`;
          successModal.style.display = 'flex';
        } else {
          window.location.href = `/citizen/complaint-details.html?id=${res.complaint.complaintId}`;
        }
      } else {
        showAlert(alertBox, res.error || 'Failed to submit complaint.');
      }
    } catch (err) {
      showAlert(alertBox, err.message || 'Submission error. Please check database & Cloudinary setup.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Grievance to Gram Panchayat';
    }
  });
}

/**
 * 6. My Complaints Page
 */
async function initComplaintsPage() {
  const tableBody = document.getElementById('myComplaintsTableBody');
  const emptyState = document.getElementById('complaintsEmptyState');
  const filterSelect = document.getElementById('statusFilter');

  let allComplaints = [];

  try {
    const res = await window.api.getComplaints();
    if (res.success && Array.isArray(res.complaints)) {
      allComplaints = res.complaints;
      renderList(allComplaints);
    }
  } catch (err) {
    console.error('Failed to fetch citizen complaints:', err);
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.innerHTML = `<p class="alert alert-danger">${err.message}</p>`;
    }
  }

  function renderList(list) {
    if (!list || list.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      if (tableBody) tableBody.innerHTML = '';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (tableBody) {
      tableBody.innerHTML = list.map((c) => renderComplaintRow(c)).join('');
    }
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      const val = filterSelect.value;
      if (!val) {
        renderList(allComplaints);
      } else {
        const filtered = allComplaints.filter((c) => c.status === val);
        renderList(filtered);
      }
    });
  }
}

/**
 * Helper to render table row for complaint
 */
function renderComplaintRow(c) {
  const dateStr = new Date(c.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const statusClass = 'status-' + c.status.toLowerCase().replace(/\s+/g, '-');

  return `
    <tr>
      <td>
        <strong style="color: var(--primary-dark);">${c.complaintId}</strong>
      </td>
      <td>
        <div><strong>${escapeHtml(c.title)}</strong></div>
        <small style="color: var(--text-light);">${escapeHtml(c.location || '')}</small>
      </td>
      <td>${escapeHtml(c.category)}</td>
      <td>${dateStr}</td>
      <td>
        <span class="status-indicator ${statusClass}">
          <span class="status-dot"></span>
          ${c.status}
        </span>
      </td>
      <td>
        <a href="/citizen/complaint-details.html?id=${c.complaintId}" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;">
          View Details
        </a>
      </td>
    </tr>
  `;
}

/**
 * 7. Complaint Details Page
 */
async function initComplaintDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get('id');

  const container = document.getElementById('complaintDetailsContent');
  const alertBox = document.getElementById('detailsAlert');

  if (!complaintId) {
    showAlert(alertBox, 'No Complaint ID specified.');
    return;
  }

  try {
    const res = await window.api.getComplaintById(complaintId);
    if (!res.success || !res.complaint) {
      showAlert(alertBox, res.error || 'Complaint not found.');
      return;
    }

    const c = res.complaint;
    const submittedDate = new Date(c.createdAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const updatedDate = new Date(c.updatedAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const statusClass = 'status-' + c.status.toLowerCase().replace(/\s+/g, '-');

    container.innerHTML = `
      <div class="dossier-grid">
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
            <div>
              <span style="font-size: 0.85rem; color: var(--text-light); text-transform: uppercase; font-weight: 600;">Complaint Record</span>
              <h2 style="font-size: 1.5rem; color: var(--primary-dark); margin-top: 2px;">${c.complaintId}</h2>
            </div>
            <span class="status-indicator ${statusClass}" style="font-size: 1rem;">
              <span class="status-dot" style="width: 10px; height: 10px;"></span>
              ${c.status}
            </span>
          </div>

          <div class="detail-item">
            <div class="detail-label">Grievance Title</div>
            <div class="detail-value" style="font-size: 1.15rem; font-weight: 600;">${escapeHtml(c.title)}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="detail-item">
              <div class="detail-label">Category</div>
              <div class="detail-value">${escapeHtml(c.category)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Submitted On</div>
              <div class="detail-value">${submittedDate}</div>
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Exact Location / Landmark</div>
            <div class="detail-value">${escapeHtml(c.location)}</div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Jurisdiction</div>
            <div class="detail-value" style="color: var(--primary-dark); font-weight: 600;">
              ${c.gramPanchayat}, ${c.district}, ${c.state}
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-label">Grievance Description</div>
            <div class="detail-value" style="white-space: pre-wrap; line-height: 1.6; background: #f8fafc; padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border);">
              ${escapeHtml(c.description)}
            </div>
          </div>

          <!-- Official Admin Remark Section -->
          <div class="detail-item" style="margin-top: 24px;">
            <div class="detail-label">Panchayat Administration Remark</div>
            <div class="detail-value" style="background: ${c.adminRemark ? '#ecfdf5' : '#f8fafc'}; border: 1px solid ${c.adminRemark ? '#a7f3d0' : 'var(--border)'}; padding: 14px; border-radius: var(--radius-md);">
              ${
                c.adminRemark
                  ? `<strong style="color: #065f46;">Officer Note:</strong> ${escapeHtml(c.adminRemark)}`
                  : `<span style="color: var(--text-light); font-style: italic;">No official remark added by administration yet.</span>`
              }
            </div>
          </div>

          <div style="font-size: 0.78rem; color: var(--text-light); margin-top: 16px;">
            Last Updated in Database: ${updatedDate}
          </div>
        </div>

        <div>
          <!-- Photo Evidence Card -->
          <div class="card" style="margin-bottom: 20px;">
            <div class="detail-label" style="margin-bottom: 12px;">Photographic Evidence</div>
            ${
              c.photoUrl
                ? `
                  <div style="cursor: pointer;" onclick="openImageModal('${c.photoUrl}')">
                    <img src="${c.photoUrl}" alt="Complaint Photo" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    <small style="display: block; text-align: center; color: var(--text-light); margin-top: 6px;">
                      🔍 Click photo to enlarge (Cloudinary)
                    </small>
                  </div>
                `
                : `
                  <div style="background: #f8fafc; border: 1px dashed var(--border); padding: 32px 16px; text-align: center; border-radius: var(--radius-md); color: var(--text-light);">
                    No photo uploaded for this grievance.
                  </div>
                `
            }
          </div>

          <!-- Quick Navigation -->
          <div class="card">
            <a href="/citizen/complaints.html" class="btn btn-outline btn-block" style="margin-bottom: 10px;">
              ← Back to My Complaints
            </a>
            <a href="/citizen/submit-complaint.html" class="btn btn-primary btn-block">
              + Submit Another Grievance
            </a>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    showAlert(alertBox, err.message || 'Failed to load grievance details.');
  }
}

/**
 * 8. Profile Page
 */
async function initProfilePage() {
  const nameEl = document.getElementById('profileFullName');
  const mobileEl = document.getElementById('profileMobile');
  const emailEl = document.getElementById('profileEmail');
  const regDateEl = document.getElementById('profileRegDate');
  const countEl = document.getElementById('profileTotalComplaints');

  try {
    const res = await window.api.getProfile();
    if (res.success && res.profile) {
      const p = res.profile;
      if (nameEl) nameEl.textContent = p.fullName;
      if (mobileEl) mobileEl.textContent = p.mobile;
      if (emailEl) emailEl.textContent = p.email || 'Not provided';
      if (countEl) countEl.textContent = p.totalComplaints;
      if (regDateEl) {
        regDateEl.textContent = new Date(p.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      }
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

/**
 * Global Photo Zoom Modal
 */
window.openImageModal = function (url) {
  let modal = document.getElementById('imageZoomModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'imageZoomModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-card" style="max-width: 800px;">
        <div class="modal-header">
          <strong style="color: var(--text-main);">Evidence Image Preview</strong>
          <button onclick="closeImageModal()" style="background: none; border: none; font-size: 1.4rem; cursor: pointer;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 12px; text-align: center; max-height: 80vh; overflow: auto;">
          <img id="zoomModalImg" src="" style="max-width: 100%; height: auto; border-radius: var(--radius-sm);" alt="Zoomed Evidence">
        </div>
        <div class="modal-footer">
          <a id="zoomModalDirectLink" href="" target="_blank" class="btn btn-outline" style="font-size: 0.85rem;">Open Cloudinary Original</a>
          <button onclick="closeImageModal()" class="btn btn-primary" style="font-size: 0.85rem;">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('zoomModalImg').src = url;
  document.getElementById('zoomModalDirectLink').href = url;
  modal.style.display = 'flex';
};

window.closeImageModal = function () {
  const modal = document.getElementById('imageZoomModal');
  if (modal) modal.style.display = 'none';
};

/**
 * UI Utilities
 */
function showAlert(el, msg) {
  if (!el) return;
  el.className = 'alert alert-danger';
  el.textContent = msg;
  el.style.display = 'block';
}

function showSuccess(el, msg) {
  if (!el) return;
  el.className = 'alert alert-success';
  el.textContent = msg;
  el.style.display = 'block';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
