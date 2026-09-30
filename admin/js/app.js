/**
 * GramSetu — Administration Application Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Support browsing when opened directly from local filesystem (file://)
  if (window.location.protocol === 'file:') {
    const banner = document.createElement('div');
    banner.style.cssText = 'background:#fef3c7; color:#92400e; padding:8px 16px; font-size:12px; font-weight:600; text-align:center; border-bottom:1px solid #fde68a; position:sticky; top:0; z-index:99999;';
    banner.innerHTML = '⚡ <strong>Local File Mode:</strong> Connected to GramSetu Cloud API. (To run locally offline, double-click <code>run-windows.bat</code> or run <code>npm run dev</code> at <code>http://localhost:3000</code>)';
    document.body.prepend(banner);

    document.querySelectorAll('a[href^="/admin/"]').forEach(a => {
      a.href = a.getAttribute('href').replace('/admin/', './');
    });
    document.querySelectorAll('a[href^="/citizen/"]').forEach(a => {
      a.href = a.getAttribute('href').replace('/citizen/', '../citizen/');
    });
  }

  // Check system health
  checkAdminSystemHealth();

  const page = document.body.dataset.adminPage;
  if (page === 'login') {
    initAdminLoginPage();
  } else if (page === 'register') {
    initAdminRegisterPage();
  } else if (page === 'dashboard') {
    if (window.adminAuth.requireAuth()) initAdminDashboardPage();
  } else if (page === 'complaints') {
    if (window.adminAuth.requireAuth()) initAdminComplaintsPage();
  } else if (page === 'complaint-details') {
    if (window.adminAuth.requireAuth()) initAdminComplaintDetailsPage();
  } else if (page === 'profile') {
    if (window.adminAuth.requireAuth()) initAdminProfilePage();
  }

  // Logout button handler
  const logoutBtn = document.getElementById('adminLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.adminAuth.logout();
    });
  }
});

async function checkAdminSystemHealth() {
  const banner = document.getElementById('adminHealthBanner');
  if (!banner) return;

  try {
    const health = await window.adminApi.getHealth();
    if (health.database !== 'connected') {
      banner.innerHTML = `
        <div class="alert alert-warning" style="margin-bottom: 0; border-radius: 0;">
          <strong>Database Notice:</strong> MongoDB Atlas is not connected. 
          Configure <code>MONGODB_URI</code> in <code>.env</code> to load and update real grievance records.
        </div>
      `;
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
    }
  } catch {
    banner.innerHTML = `
      <div class="alert alert-danger" style="margin-bottom: 0; border-radius: 0;">
        <strong>Backend Disconnected:</strong> Cannot contact API server.
      </div>
    `;
    banner.style.display = 'block';
  }
}

/**
 * 1. Admin Login Page
 */
function initAdminLoginPage() {
  window.adminAuth.redirectIfAuthenticated();

  const form = document.getElementById('adminLoginForm');
  const alertBox = document.getElementById('adminLoginAlert');
  const submitBtn = document.getElementById('adminLoginSubmitBtn');

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('loggedOut')) {
    alertBox.className = 'alert alert-success';
    alertBox.textContent = 'Administrative session closed.';
    alertBox.style.display = 'block';
  } else if (urlParams.has('expired')) {
    alertBox.className = 'alert alert-warning';
    alertBox.textContent = 'Session expired. Please re-authenticate.';
    alertBox.style.display = 'block';
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const username = form.username.value.trim();
    const password = form.password.value;

    if (!username) {
      showError(alertBox, 'Please enter official username or officer name.');
      return;
    }

    if (!password) {
      showError(alertBox, 'Please enter the administrative key.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying with Backend...';

    try {
      const res = await window.adminApi.login(username, password);
      if (res.success && res.token) {
        window.adminAuth.setSession(res.token, res.admin);
        const redirect = urlParams.get('redirect') || '/admin/dashboard.html';
        window.location.href = redirect;
      } else {
        showError(alertBox, res.error || 'Authentication denied.');
      }
    } catch (err) {
      showError(alertBox, err.message || 'Login failed. Invalid administrative credentials.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Access Administration Console';
    }
  });
}

/**
 * 1.5 Admin Officer Registration Page
 */
function initAdminRegisterPage() {
  window.adminAuth.redirectIfAuthenticated();

  const form = document.getElementById('adminRegisterForm');
  const alertBox = document.getElementById('adminRegisterAlert');
  const submitBtn = document.getElementById('adminRegisterBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.style.display = 'none';

    const fullName = form.fullName.value.trim();
    const designation = form.designation.value;
    const mobile = form.mobile.value.trim();
    const email = form.email.value.trim();
    const adminPasscode = form.adminPasscode.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (!fullName) {
      showError(alertBox, 'Please enter your Full Name.');
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      showError(alertBox, 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!adminPasscode) {
      showError(alertBox, 'Please enter the master authorization passcode.');
      return;
    }

    if (password.length < 6) {
      showError(alertBox, 'Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      showError(alertBox, 'Passwords do not match.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enrolling Officer in MongoDB...';

    try {
      const res = await window.adminApi.register({
        fullName,
        designation,
        mobile,
        email: email || undefined,
        adminPasscode,
        password,
        confirmPassword,
      });

      if (res.success && res.token) {
        window.adminAuth.setSession(res.token, res.admin);
        window.location.href = '/admin/dashboard.html?registered=1';
      } else {
        showError(alertBox, res.error || 'Failed to register officer.');
      }
    } catch (err) {
      showError(alertBox, err.message || 'Error communicating with server.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register Panchayat Officer in MongoDB';
    }
  });
}

/**
 * 2. Admin Dashboard Page
 */
async function initAdminDashboardPage() {
  const adminUser = window.adminAuth.getUser();
  const officerNameEl = document.getElementById('adminOfficerName');
  if (officerNameEl && adminUser) {
    officerNameEl.textContent = adminUser.username;
  }

  const statTotal = document.getElementById('statTotal');
  const statSubmitted = document.getElementById('statSubmitted');
  const statUnderReview = document.getElementById('statUnderReview');
  const statInProgress = document.getElementById('statInProgress');
  const statResolved = document.getElementById('statResolved');
  const statRejected = document.getElementById('statRejected');
  const recentTableBody = document.getElementById('adminRecentTableBody');
  const emptyState = document.getElementById('adminDashboardEmptyState');

  try {
    const res = await window.adminApi.getDashboard();
    if (res.success && res.stats) {
      if (statTotal) statTotal.textContent = res.stats.total;
      if (statSubmitted) statSubmitted.textContent = res.stats.submitted;
      if (statUnderReview) statUnderReview.textContent = res.stats.underReview;
      if (statInProgress) statInProgress.textContent = res.stats.inProgress;
      if (statResolved) statResolved.textContent = res.stats.resolved;
      if (statRejected) statRejected.textContent = res.stats.rejected;

      if (res.recentComplaints && res.recentComplaints.length > 0) {
        if (emptyState) emptyState.style.display = 'none';
        if (recentTableBody) {
          recentTableBody.innerHTML = res.recentComplaints
            .map((c) => renderAdminComplaintRow(c))
            .join('');
        }
      } else {
        if (emptyState) emptyState.style.display = 'block';
        if (recentTableBody) recentTableBody.innerHTML = '';
      }
    }
  } catch (err) {
    console.error('Failed to load admin dashboard metrics:', err);
  }
}

/**
 * 3. Admin Complaints List Page
 */
async function initAdminComplaintsPage() {
  const tableBody = document.getElementById('adminComplaintsTableBody');
  const emptyState = document.getElementById('adminComplaintsEmptyState');
  const statusFilter = document.getElementById('adminStatusFilter');
  const categoryFilter = document.getElementById('adminCategoryFilter');
  const searchInput = document.getElementById('adminSearchInput');
  const countBadge = document.getElementById('adminComplaintsCount');

  let debounceTimer = null;

  async function loadComplaints() {
    const params = {
      status: statusFilter ? statusFilter.value : '',
      category: categoryFilter ? categoryFilter.value : '',
      search: searchInput ? searchInput.value.trim() : '',
    };

    try {
      const res = await window.adminApi.getComplaints(params);
      if (res.success && Array.isArray(res.complaints)) {
        if (countBadge) countBadge.textContent = `${res.complaints.length} records`;

        if (res.complaints.length === 0) {
          if (emptyState) emptyState.style.display = 'block';
          if (tableBody) tableBody.innerHTML = '';
        } else {
          if (emptyState) emptyState.style.display = 'none';
          if (tableBody) {
            tableBody.innerHTML = res.complaints.map((c) => renderAdminComplaintRow(c)).join('');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load complaints for admin:', err);
    }
  }

  if (statusFilter) statusFilter.addEventListener('change', loadComplaints);
  if (categoryFilter) categoryFilter.addEventListener('change', loadComplaints);

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadComplaints, 300);
    });
  }

  // Initial load
  loadComplaints();
}

/**
 * Helper to render admin complaint row with citizen details
 */
function renderAdminComplaintRow(c) {
  const dateStr = new Date(c.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const statusClass = 'status-' + c.status.toLowerCase().replace(/\s+/g, '-');
  const citizenName = c.citizenId ? c.citizenId.fullName : 'Resident';
  const citizenMobile = c.citizenId ? c.citizenId.mobile : '';

  return `
    <tr>
      <td>
        <strong style="color: var(--primary-dark);">${c.complaintId}</strong>
      </td>
      <td>
        <strong>${escapeHtml(citizenName)}</strong>
        <div style="font-size: 0.8rem; color: var(--text-light);">${citizenMobile}</div>
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
        <a href="/admin/complaint-details.html?id=${c.complaintId}" class="btn btn-primary" style="padding: 4px 10px; font-size: 0.8rem;">
          Review & Update →
        </a>
      </td>
    </tr>
  `;
}

/**
 * 4. Admin Complaint Details Page
 */
async function initAdminComplaintDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get('id');

  const container = document.getElementById('adminComplaintDetailsContent');
  const alertBox = document.getElementById('adminDetailsAlert');

  if (!complaintId) {
    showError(alertBox, 'No Complaint ID specified.');
    return;
  }

  let currentComplaint = null;

  try {
    const res = await window.adminApi.getComplaintById(complaintId);
    if (!res.success || !res.complaint) {
      showError(alertBox, res.error || 'Complaint not found in database.');
      return;
    }

    currentComplaint = res.complaint;
    renderDetails(currentComplaint);
  } catch (err) {
    showError(alertBox, err.message || 'Failed to load grievance details.');
  }

  function renderDetails(c) {
    const submittedDate = new Date(c.createdAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const updatedDate = new Date(c.updatedAt).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const citizen = c.citizenId || {};
    const statusClass = 'status-' + c.status.toLowerCase().replace(/\s+/g, '-');

    container.innerHTML = `
      <div class="admin-dossier-grid">
        <!-- Main dossier details -->
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 14px;">
            <div>
              <span class="detail-label">Official Grievance Case Record</span>
              <h2 style="font-size: 1.5rem; color: var(--primary-dark);">${c.complaintId}</h2>
            </div>
            <div>
              <span class="status-indicator ${statusClass}" style="font-size: 1rem;">
                <span class="status-dot" style="width: 10px; height: 10px;"></span>
                <span id="currentStatusBadge">${c.status}</span>
              </span>
            </div>
          </div>

          <div class="detail-label">Complaint Title</div>
          <div class="detail-value" style="font-size: 1.15rem; font-weight: 700;">
            ${escapeHtml(c.title)}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <div class="detail-label">Category</div>
              <div class="detail-value">${escapeHtml(c.category)}</div>
            </div>
            <div>
              <div class="detail-label">Lodged Date</div>
              <div class="detail-value">${submittedDate}</div>
            </div>
          </div>

          <div class="detail-label">Exact Location / Landmark</div>
          <div class="detail-value">${escapeHtml(c.location)}</div>

          <div class="detail-label">Jurisdiction</div>
          <div class="detail-value" style="color: var(--primary-dark); font-weight: 600;">
            ${c.gramPanchayat}, ${c.district}, ${c.state}
          </div>

          <div class="detail-label">Citizen's Detailed Description</div>
          <div class="detail-value" style="background: #f8fafc; padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border); white-space: pre-wrap; line-height: 1.6;">
            ${escapeHtml(c.description)}
          </div>

          <!-- Citizen Contact Information Box -->
          <div style="background: #f1f5f9; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; margin-top: 20px;">
            <div class="detail-label" style="margin-bottom: 8px;">Complainant Details</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.92rem;">
              <div><strong>Name:</strong> ${escapeHtml(citizen.fullName || 'Citizen')}</div>
              <div><strong>Mobile:</strong> <a href="tel:${citizen.mobile || ''}" style="color: var(--primary); font-weight: 600;">${citizen.mobile || 'N/A'}</a></div>
              <div><strong>Email:</strong> ${escapeHtml(citizen.email || 'None provided')}</div>
              <div><strong>Resident Since:</strong> ${citizen.createdAt ? new Date(citizen.createdAt).toLocaleDateString('en-IN') : 'N/A'}</div>
            </div>
          </div>

          <div style="font-size: 0.78rem; color: var(--text-light); margin-top: 16px;" id="lastUpdatedNotice">
            Last Updated in Database: ${updatedDate}
          </div>
        </div>

        <!-- Right Side: Official Administrative Action & Photo -->
        <div>
          <!-- Status & Remark Form -->
          <div class="card" style="margin-bottom: 20px; border-top: 4px solid var(--primary);">
            <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; color: var(--text-main);">
              Administrative Action Desk
            </h3>

            <div id="updateAlert" class="alert alert-success" style="display: none;"></div>

            <form id="adminUpdateForm">
              <div class="form-group">
                <label class="form-label" for="actionStatus">Update Status</label>
                <select id="actionStatus" name="status" class="form-control" style="font-weight: 600;">
                  <option value="Submitted" ${c.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
                  <option value="Under Review" ${c.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                  <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                  <option value="Rejected" ${c.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="adminRemark">Official Panchayat Remark</label>
                <textarea id="adminRemark" name="adminRemark" class="form-control" rows="4" placeholder="Enter official findings, work order details, or resolution update...">${escapeHtml(c.adminRemark || '')}</textarea>
                <div style="font-size: 0.78rem; color: var(--text-light); margin-top: 4px;">
                  This remark will be visible to the citizen on their portal immediately upon saving.
                </div>
              </div>

              <button type="submit" id="saveUpdateBtn" class="btn btn-primary btn-block" style="padding: 10px;">
                Save Changes to MongoDB
              </button>
            </form>
          </div>

          <!-- Photo Card -->
          <div class="card">
            <div class="detail-label" style="margin-bottom: 10px;">Attached Photographic Evidence</div>
            ${
              c.photoUrl
                ? `
                  <div>
                    <a href="${c.photoUrl}" target="_blank" rel="noopener noreferrer">
                      <img src="${c.photoUrl}" alt="Complaint Photo" style="width: 100%; max-height: 260px; object-fit: cover; border-radius: var(--radius-md); border: 1px solid var(--border);">
                    </a>
                    <small style="display: block; text-align: center; color: var(--text-light); margin-top: 6px;">
                      🔍 Click image to view full resolution on Cloudinary
                    </small>
                  </div>
                `
                : `
                  <div style="background: #f8fafc; border: 1px dashed var(--border); padding: 32px 16px; text-align: center; border-radius: var(--radius-md); color: var(--text-light); font-size: 0.9rem;">
                    No photo attached with this grievance.
                  </div>
                `
            }
          </div>
        </div>
      </div>
    `;

    // Hook up update form
    const updateForm = document.getElementById('adminUpdateForm');
    const updateAlert = document.getElementById('updateAlert');
    const saveBtn = document.getElementById('saveUpdateBtn');

    updateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      updateAlert.style.display = 'none';

      const newStatus = updateForm.status.value;
      const newRemark = updateForm.adminRemark.value;

      saveBtn.disabled = true;
      saveBtn.textContent = 'Updating MongoDB...';

      try {
        const res = await window.adminApi.updateComplaint(c.complaintId, {
          status: newStatus,
          adminRemark: newRemark,
        });

        if (res.success && res.complaint) {
          updateAlert.className = 'alert alert-success';
          updateAlert.textContent = 'Grievance updated successfully in MongoDB.';
          updateAlert.style.display = 'block';

          // Update DOM badges
          const statusBadge = document.getElementById('currentStatusBadge');
          if (statusBadge) statusBadge.textContent = res.complaint.status;

          const updatedNotice = document.getElementById('lastUpdatedNotice');
          if (updatedNotice) {
            updatedNotice.textContent = `Last Updated in Database: ${new Date(res.complaint.updatedAt).toLocaleString('en-IN')}`;
          }
        } else {
          updateAlert.className = 'alert alert-danger';
          updateAlert.textContent = res.error || 'Failed to update grievance.';
          updateAlert.style.display = 'block';
        }
      } catch (err) {
        updateAlert.className = 'alert alert-danger';
        updateAlert.textContent = err.message || 'Database update failed.';
        updateAlert.style.display = 'block';
      } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes to MongoDB';
      }
    });
  }
}

/**
 * 5. Admin Profile Page
 */
function initAdminProfilePage() {
  const admin = window.adminAuth.getUser();
  const nameEl = document.getElementById('adminProfileName');
  if (nameEl && admin) {
    nameEl.textContent = admin.username;
  }
}

function showError(el, msg) {
  if (!el) return;
  el.className = 'alert alert-danger';
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
