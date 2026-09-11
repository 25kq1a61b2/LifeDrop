/**
 * LifeDrop – Emergency Requests & Management Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Page 6: Emergency Request Submission Form
  if (document.getElementById('emergency-request-form')) {
    initEmergencyRequestForm();
  }

  // Page 7: Emergency Requests Directory
  if (document.getElementById('requests-container')) {
    initEmergencyRequestsPage();
  }

  // Page 8: Hospital Dashboard
  if (document.getElementById('hospital-dashboard-view')) {
    initHospitalDashboard();
  }

  // Page 9: Admin Dashboard
  if (document.getElementById('admin-dashboard-view')) {
    initAdminDashboard();
  }

  // Patient Dashboard
  if (document.getElementById('patient-dashboard-view')) {
    initPatientDashboard();
  }
});

/* ==========================================================================
   PAGE 6: Emergency Request Form
   ========================================================================== */
function initEmergencyRequestForm() {
  const form = document.getElementById('emergency-request-form');
  if (!form) return;

  // Pre-fill hospital name if hospital user is logged in
  const user = AuthState.getUser();
  if (user && user.role === 'hospital' && user.hospitalName) {
    const hospInput = document.getElementById('req-hospital-name');
    if (hospInput && !hospInput.value) hospInput.value = user.hospitalName;
    const cityInput = document.getElementById('req-city');
    if (cityInput && !cityInput.value) cityInput.value = user.city;
    const phoneInput = document.getElementById('req-contact-phone');
    if (phoneInput && !phoneInput.value) phoneInput.value = user.phone;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Broadcasting Emergency...';
    submitBtn.disabled = true;

    const payload = {
      patientName: document.getElementById('req-patient-name').value.trim(),
      bloodGroup: document.getElementById('req-blood-group').value,
      hospitalName: document.getElementById('req-hospital-name').value.trim(),
      city: document.getElementById('req-city').value.trim(),
      requiredUnits: Number(document.getElementById('req-units').value),
      emergencyLevel: document.getElementById('req-emergency-level').value,
      contactNumber: document.getElementById('req-contact-phone').value.trim(),
      notes: document.getElementById('req-notes')?.value.trim() || '',
    };

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (AuthState.getToken()) {
        headers['Authorization'] = `Bearer ${AuthState.getToken()}`;
      }

      const res = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit emergency request');
      }

      const matchedDonors = data.matchingAvailableDonors || 0;
      showToast(`Request Broadcasted! Found ${matchedDonors} available ${payload.bloodGroup} donors nearby.`, 'success');

      setTimeout(() => {
        window.location.href = 'emergency-requests.html';
      }, 1200);
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

/* ==========================================================================
   PAGE 7: Emergency Requests Directory
   ========================================================================== */
function initEmergencyRequestsPage() {
  const container = document.getElementById('requests-container');
  const countEl = document.getElementById('requests-count');
  const urgencyFilter = document.getElementById('filter-urgency');
  const bloodFilter = document.getElementById('filter-blood-group');
  const statusFilter = document.getElementById('filter-status');
  const resetBtn = document.getElementById('btn-reset-requests');

  async function fetchRequests() {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px;">
        <div class="stat-icon icon-red" style="margin: 0 auto 16px auto;">🚨</div>
        <h3>Fetching emergency requests...</h3>
      </div>
    `;

    const urgency = urgencyFilter ? urgencyFilter.value : '';
    const bloodGroup = bloodFilter ? bloodFilter.value : '';
    const status = statusFilter ? statusFilter.value : 'Active';

    const params = new URLSearchParams();
    if (urgency && urgency !== 'All') params.append('emergencyLevel', urgency);
    if (bloodGroup && bloodGroup !== 'All') params.append('bloodGroup', bloodGroup);
    if (status && status !== 'All') params.append('status', status);

    try {
      const res = await fetch(`${API_BASE}/requests?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to retrieve requests');
      }

      renderRequests(data.requests);
      if (countEl) countEl.textContent = `${data.requests.length} Requests Found`;
    } catch (err) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: white; border-radius: var(--radius-lg);">
          <p style="color: var(--critical-red); font-weight: 600;">Error: ${err.message}</p>
        </div>
      `;
    }
  }

  function renderRequests(requests) {
    if (!requests || requests.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 64px 20px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <div style="font-size: 3rem; margin-bottom: 12px;">✅</div>
          <h3>No matching emergency requests found</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Currently there are no active blood requests for this criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const isCritical = req.emergencyLevel === 'Critical';
      const isFulfilled = req.status === 'Fulfilled';
      const isCancelled = req.status === 'Cancelled';

      let badgeClass = 'badge-low';
      if (isCritical) badgeClass = 'badge-critical';
      else if (req.emergencyLevel === 'High') badgeClass = 'badge-high';
      else if (req.emergencyLevel === 'Medium') badgeClass = 'badge-medium';

      let statusBadge = `<span class="badge badge-available">● Active</span>`;
      if (isFulfilled) statusBadge = `<span class="badge" style="background:#E0E7FF; color:#4338CA;">✓ Fulfilled</span>`;
      if (isCancelled) statusBadge = `<span class="badge badge-unavailable">✕ Cancelled</span>`;

      return `
        <div class="request-card ${isCritical && req.status === 'Active' ? 'is-critical' : ''}">
          <div class="request-card-header">
            <div class="request-headline">
              <h4>${escapeHtml(req.patientName)}</h4>
              <div class="request-hospital">🏥 ${escapeHtml(req.hospitalName)}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
              <span class="badge ${badgeClass}">${escapeHtml(req.emergencyLevel)}</span>
              ${statusBadge}
            </div>
          </div>

          <div class="request-details-grid">
            <div class="request-metric">
              <small>Required</small>
              <strong style="color: var(--primary-red);">${req.requiredUnits} Units</strong>
            </div>
            <div class="request-metric">
              <small>Blood Group</small>
              <strong class="badge-blood" style="display: inline-block; font-size: 1rem; padding: 2px 8px;">${escapeHtml(req.bloodGroup)}</strong>
            </div>
            <div class="request-metric">
              <small>City</small>
              <strong>${escapeHtml(req.city)}</strong>
            </div>
          </div>

          ${req.notes ? `
            <p style="font-size: 0.88rem; color: var(--text-muted); background: var(--bg-main); padding: 8px 12px; border-radius: var(--radius-sm); border-left: 3px solid var(--border-medium);">
              "${escapeHtml(req.notes)}"
            </p>
          ` : ''}

          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid var(--border-light); font-size: 0.82rem;">
            <span style="color: var(--text-muted);">🕒 ${formatDate(req.createdAt)} (${formatRelativeTime(req.createdAt)})</span>
            <a href="tel:${req.contactNumber}" class="btn btn-sm ${isCritical ? 'btn-danger btn-pulse' : 'btn-primary'}">
              📞 Call: ${escapeHtml(req.contactNumber)}
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  if (urgencyFilter) urgencyFilter.addEventListener('change', fetchRequests);
  if (bloodFilter) bloodFilter.addEventListener('change', fetchRequests);
  if (statusFilter) statusFilter.addEventListener('change', fetchRequests);
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (urgencyFilter) urgencyFilter.value = 'All';
      if (bloodFilter) bloodFilter.value = 'All';
      if (statusFilter) statusFilter.value = 'Active';
      fetchRequests();
    });
  }

  fetchRequests();
}

/* ==========================================================================
   PAGE 8: Hospital Dashboard Logic
   ========================================================================= */
async function initHospitalDashboard() {
  const user = requireAuth(['hospital', 'admin']);
  if (!user) return;

  document.getElementById('hospital-name-display').textContent = user.hospitalName || user.name;
  document.getElementById('hospital-city-display').textContent = `${user.city}, ${user.state}`;

  // Pre-fill hospital name in the embedded create request modal/form
  const formHospName = document.getElementById('hosp-req-hospital-name');
  if (formHospName) formHospName.value = user.hospitalName || user.name;
  const formCity = document.getElementById('hosp-req-city');
  if (formCity) formCity.value = user.city;
  const formPhone = document.getElementById('hosp-req-phone');
  if (formPhone) formPhone.value = user.phone;

  // Load hospital specific requests
  loadHospitalRequests();
  loadNearbyDonors(user.city);

  // Quick blood request submission
  const quickReqForm = document.getElementById('hospital-create-request-form');
  if (quickReqForm) {
    quickReqForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const payload = {
          patientName: document.getElementById('hosp-req-patient').value.trim(),
          bloodGroup: document.getElementById('hosp-req-blood-group').value,
          hospitalName: user.hospitalName || user.name,
          city: user.city,
          requiredUnits: Number(document.getElementById('hosp-req-units').value),
          emergencyLevel: document.getElementById('hosp-req-emergency-level').value,
          contactNumber: document.getElementById('hosp-req-phone').value.trim(),
          notes: document.getElementById('hosp-req-notes').value.trim(),
        };

        const res = await fetch(`${API_BASE}/requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AuthState.getToken()}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to submit request');
        }

        showToast('Emergency request broadcasted successfully!', 'success');
        quickReqForm.reset();
        closeModal('create-request-modal');
        loadHospitalRequests();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

async function loadHospitalRequests() {
  const tableBody = document.getElementById('hospital-requests-tbody');
  if (!tableBody) return;

  try {
    const res = await fetch(`${API_BASE}/requests`);
    const data = await res.json();

    if (!res.ok || !data.success) return;

    const user = AuthState.getUser();
    // Filter requests matching hospital name or city
    const requests = data.requests.filter(r =>
      (user.hospitalName && r.hospitalName.toLowerCase().includes(user.hospitalName.toLowerCase())) ||
      r.hospitalName.toLowerCase().includes(user.name.toLowerCase()) ||
      r.city.toLowerCase() === user.city.toLowerCase()
    );

    const activeCount = requests.filter(r => r.status === 'Active').length;
    const fulfilledCount = requests.filter(r => r.status === 'Fulfilled').length;

    const activeStat = document.getElementById('stat-hospital-active');
    if (activeStat) activeStat.textContent = activeCount;
    const fulfilledStat = document.getElementById('stat-hospital-fulfilled');
    if (fulfilledStat) fulfilledStat.textContent = fulfilledCount;

    if (requests.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding: 32px; color: var(--text-muted);">
            No requests posted yet. Click "+ Create Emergency Request" above to broadcast.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = requests.map(req => {
      let badgeClass = req.emergencyLevel === 'Critical' ? 'badge-critical' :
                       req.emergencyLevel === 'High' ? 'badge-high' : 'badge-medium';

      return `
        <tr>
          <td><strong>${escapeHtml(req.patientName)}</strong></td>
          <td><span class="badge-blood" style="font-size: 0.95rem; padding: 2px 8px;">${escapeHtml(req.bloodGroup)}</span></td>
          <td><strong>${req.requiredUnits}</strong> units</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(req.emergencyLevel)}</span></td>
          <td>${formatDate(req.createdAt)}</td>
          <td>
            <select class="form-control" style="padding: 4px 8px; font-size: 0.85rem;" onchange="updateRequestStatus('${req._id}', this.value)">
              <option value="Active" ${req.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="Fulfilled" ${req.status === 'Fulfilled' ? 'selected' : ''}>Fulfilled</option>
              <option value="Cancelled" ${req.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <a href="tel:${req.contactNumber}" class="btn btn-sm btn-outline">📞 Call</a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Error loading hospital requests:', err);
  }
}

async function loadNearbyDonors(city) {
  const container = document.getElementById('hospital-donors-tbody');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/donors/search?city=${encodeURIComponent(city)}&availability=Available`);
    const data = await res.json();

    if (!res.ok || !data.success) return;

    const availStat = document.getElementById('stat-hospital-donors');
    if (availStat) availStat.textContent = data.donors.length;

    if (data.donors.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="5" class="text-center" style="padding: 24px; color: var(--text-muted);">
            No currently available donors in ${city}. Check nearby cities via <a href="find-donor.html">Find Donors</a>.
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = data.donors.slice(0, 5).map(donor => `
      <tr>
        <td><strong>${escapeHtml(donor.name)}</strong></td>
        <td><span class="badge-blood" style="font-size: 0.95rem; padding: 2px 8px;">${donor.bloodGroup}</span></td>
        <td>${donor.phone}</td>
        <td><span class="badge badge-available">Available</span></td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="openContactModal('${donor._id}', '${escapeJs(donor.name)}', '${escapeJs(donor.bloodGroup)}', '${escapeJs(donor.phone)}', '${escapeJs(donor.email)}', '${escapeJs(donor.city)}')">
            Reach Out
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

window.updateRequestStatus = async (requestId, newStatus) => {
  try {
    const res = await fetch(`${API_BASE}/requests/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AuthState.getToken()}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Status update failed');
    }

    showToast(`Request marked as ${newStatus}`, 'success');
    loadHospitalRequests();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

/* ==========================================================================
   PAGE 9: Admin Dashboard Logic
   ========================================================================== */
async function initAdminDashboard() {
  const user = requireAuth(['admin']);
  if (!user) return;

  loadAdminStatistics();
  loadAdminUsers();

  const searchInput = document.getElementById('admin-search-users');
  const roleSelect = document.getElementById('admin-filter-role');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => loadAdminUsers(), 300));
  }
  if (roleSelect) {
    roleSelect.addEventListener('change', () => loadAdminUsers());
  }
}

async function loadAdminStatistics() {
  try {
    const res = await fetch(`${API_BASE}/admin/statistics`, {
      headers: { 'Authorization': `Bearer ${AuthState.getToken()}` },
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to load stats');
    }

    const s = data.statistics;
    document.getElementById('stat-total-users').textContent = s.totalUsers;
    document.getElementById('stat-total-donors').textContent = s.totalDonors;
    document.getElementById('stat-available-donors').textContent = s.availableDonors;
    document.getElementById('stat-total-hospitals').textContent = s.totalHospitals;
    document.getElementById('stat-total-requests').textContent = s.emergencyRequests;
    document.getElementById('stat-active-requests').textContent = s.activeRequests;

    // Render blood group breakdown chart/chips
    const distroContainer = document.getElementById('blood-group-distribution');
    if (distroContainer && s.bloodGroupDistribution) {
      distroContainer.innerHTML = s.bloodGroupDistribution.map(item => `
        <div class="blood-tag-card">
          <div class="blood-tag-type">${item._id}</div>
          <div class="blood-tag-status">${item.count} Donors</div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Admin stats error:', err);
  }
}

async function loadAdminUsers() {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  const role = document.getElementById('admin-filter-role')?.value || 'All';
  const search = document.getElementById('admin-search-users')?.value.trim() || '';

  const params = new URLSearchParams();
  if (role !== 'All') params.append('role', role);
  if (search) params.append('search', search);

  try {
    const res = await fetch(`${API_BASE}/admin/users?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${AuthState.getToken()}` },
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.message);
    }

    if (data.users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding: 24px; color: var(--text-muted);">
            No users found matching query.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.users.map(u => `
      <tr>
        <td><strong>${escapeHtml(u.name)}</strong></td>
        <td>${escapeHtml(u.email)}</td>
        <td>
          <span class="sidebar-role-badge" style="background:#E2E8F0; color:#334155;">
            ${escapeHtml(u.role)}
          </span>
        </td>
        <td><span class="badge-blood" style="font-size: 0.9rem; padding: 2px 6px;">${escapeHtml(u.bloodGroup || '—')}</span></td>
        <td>${escapeHtml(u.city)}, ${escapeHtml(u.state)}</td>
        <td>
          <select class="form-control" style="padding: 2px 6px; font-size: 0.8rem;" onchange="updateUserStatus('${u._id}', this.value)">
            <option value="active" ${u.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="inactive" ${u.status === 'inactive' ? 'selected' : ''}>Inactive</option>
            <option value="suspended" ${u.status === 'suspended' ? 'selected' : ''}>Suspended</option>
          </select>
        </td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteUserAccount('${u._id}', '${escapeJs(u.name)}')">
            🗑 Delete
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

window.deleteUserAccount = async (userId, userName) => {
  if (!confirm(`Are you sure you want to permanently delete the account of "${userName}"?`)) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${AuthState.getToken()}` },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Delete failed');
    }

    showToast(`Account "${userName}" deleted.`, 'success');
    loadAdminUsers();
    loadAdminStatistics();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.updateUserStatus = async (userId, newStatus) => {
  try {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AuthState.getToken()}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message);

    showToast('User status updated', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

/* ==========================================================================
   Patient Dashboard Logic
   ========================================================================== */
async function initPatientDashboard() {
  const user = requireAuth(['patient', 'admin']);
  if (!user) return;

  document.getElementById('patient-name-display').textContent = user.name;
  document.getElementById('patient-blood-display').textContent = user.bloodGroup || 'O+';
  document.getElementById('patient-city-display').textContent = `${user.city}, ${user.state}`;

  // Load requests created by this patient
  const tbody = document.getElementById('patient-requests-tbody');
  if (tbody) {
    try {
      const res = await fetch(`${API_BASE}/requests`);
      const data = await res.json();

      if (data.success) {
        const myRequests = data.requests.filter(r =>
          r.patientName.toLowerCase().includes(user.name.toLowerCase()) ||
          (r.requestedBy && (r.requestedBy._id === user._id || r.requestedBy === user._id))
        );

        if (myRequests.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" class="text-center" style="padding: 24px; color: var(--text-muted);">
                You have not submitted any emergency requests yet.
              </td>
            </tr>
          `;
        } else {
          tbody.innerHTML = myRequests.map(r => `
            <tr>
              <td><strong>${escapeHtml(r.hospitalName)}</strong></td>
              <td><span class="badge-blood" style="font-size: 0.9rem; padding: 2px 6px;">${r.bloodGroup}</span></td>
              <td>${r.requiredUnits} Units</td>
              <td><span class="badge ${r.emergencyLevel === 'Critical' ? 'badge-critical' : 'badge-high'}">${r.emergencyLevel}</span></td>
              <td>${formatDate(r.createdAt)}</td>
              <td>
                <span class="badge ${r.status === 'Active' ? 'badge-available' : 'badge-unavailable'}">${r.status}</span>
              </td>
            </tr>
          `).join('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
}

// Debounce helper
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(text) {
  if (!text) return '';
  return String(text).replace(/'/g, "\\'").replace(/"/g, '\\"');
}
