/**
 * LifeDrop – Donor Management & Search Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('donors-container')) {
    initFindDonorPage();
  }
  if (document.getElementById('donor-dashboard-view')) {
    initDonorDashboard();
  }
});

/* ==========================================================================
   1. Find Donor Page Logic
   ========================================================================== */
function initFindDonorPage() {
  const container = document.getElementById('donors-container');
  const countEl = document.getElementById('results-count');
  const bloodFilter = document.getElementById('filter-blood-group');
  const cityFilter = document.getElementById('filter-city');
  const availFilter = document.getElementById('filter-availability');
  const searchBtn = document.getElementById('btn-filter-search');
  const resetBtn = document.getElementById('btn-filter-reset');

  // Load Donors from backend
  async function fetchDonors() {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px;">
        <div class="stat-icon icon-red" style="margin: 0 auto 16px auto;">🩸</div>
        <h3>Searching available blood donors...</h3>
      </div>
    `;

    const bloodGroup = bloodFilter ? bloodFilter.value : '';
    const city = cityFilter ? cityFilter.value.trim() : '';
    const availability = availFilter ? availFilter.value : '';

    const params = new URLSearchParams();
    if (bloodGroup && bloodGroup !== 'All') params.append('bloodGroup', bloodGroup);
    if (city) params.append('city', city);
    if (availability && availability !== 'All') params.append('availability', availability);

    try {
      const res = await fetch(`${API_BASE}/donors/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch donors');
      }

      renderDonorsList(data.donors);
      if (countEl) countEl.textContent = `${data.donors.length} Donors Found`;
    } catch (err) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: white; border-radius: var(--radius-lg);">
          <p style="color: var(--critical-red); font-weight: 600;">Error: ${err.message}</p>
          <p style="color: var(--text-muted); margin-top: 8px;">Make sure the backend server is running and MongoDB is connected.</p>
        </div>
      `;
    }
  }

  function renderDonorsList(donors) {
    if (!donors || donors.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 64px 20px; background: white; border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
          <h3>No matching donors found</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Try adjusting your blood group, city, or availability filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = donors.map(donor => {
      const isAvail = donor.availability === 'Available';
      const badgeClass = isAvail ? 'badge-available' : 'badge-unavailable';
      const lastDonated = donor.lastDonationDate ? formatDate(donor.lastDonationDate) : 'Not recorded';

      return `
        <div class="donor-card">
          <div class="donor-card-top">
            <div class="donor-avatar-wrapper">
              <div class="donor-avatar">
                ${donor.name.charAt(0)}
              </div>
              <div class="donor-details">
                <h4>${escapeHtml(donor.name)}</h4>
                <div class="donor-location">
                  <span>📍</span> ${escapeHtml(donor.city)}, ${escapeHtml(donor.state)}
                </div>
              </div>
            </div>
            <div class="badge-blood">${escapeHtml(donor.bloodGroup)}</div>
          </div>

          <ul class="donor-meta-list">
            <li class="donor-meta-item">
              <strong>Status</strong>
              <span class="badge ${badgeClass}">${escapeHtml(donor.availability)}</span>
            </li>
            <li class="donor-meta-item">
              <strong>Age / Gender</strong>
              <span>${donor.age || 'N/A'} yrs • ${escapeHtml(donor.gender || 'N/A')}</span>
            </li>
            <li class="donor-meta-item" style="grid-column: span 2;">
              <strong>Last Donation Date</strong>
              <span>${lastDonated}</span>
            </li>
          </ul>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-outline-danger" style="flex: 1;" onclick="openContactModal('${donor._id}', '${escapeJs(donor.name)}', '${escapeJs(donor.bloodGroup)}', '${escapeJs(donor.phone)}', '${escapeJs(donor.email)}', '${escapeJs(donor.city)}')">
              📞 Contact Donor
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Filter actions
  if (searchBtn) searchBtn.addEventListener('click', fetchDonors);
  if (bloodFilter) bloodFilter.addEventListener('change', fetchDonors);
  if (availFilter) availFilter.addEventListener('change', fetchDonors);
  if (cityFilter) {
    cityFilter.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') fetchDonors();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (bloodFilter) bloodFilter.value = 'All';
      if (cityFilter) cityFilter.value = '';
      if (availFilter) availFilter.value = 'All';
      fetchDonors();
    });
  }

  // Initial load
  fetchDonors();
}

/* ==========================================================================
   2. Contact Modal Popup
   ========================================================================== */
window.openContactModal = (id, name, bloodGroup, phone, email, city) => {
  let modal = document.getElementById('contact-donor-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'contact-donor-modal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" onclick="closeModal('contact-donor-modal')">&times;</button>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <div class="stat-icon icon-red" style="margin: 0 auto 12px auto;">🩸</div>
        <h3 style="font-size: 1.4rem;">Contact Donor</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">LifeDrop Emergency Donor Connection</p>
      </div>

      <div style="background: var(--bg-main); padding: 18px; border-radius: var(--radius-md); margin-bottom: 20px; border: 1px solid var(--border-light);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h4 style="font-size: 1.15rem;">${name}</h4>
          <span class="badge-blood">${bloodGroup}</span>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-muted);">📍 Location: <strong>${city}</strong></p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <a href="tel:${phone}" class="btn btn-primary" style="width: 100%;">
          📞 Call Phone: ${phone}
        </a>
        <a href="mailto:${email}?subject=Urgent Blood Donation Request - LifeDrop&body=Hello ${name},%0D%0A%0D%0AWe found your donor profile on LifeDrop. We urgently require ${bloodGroup} blood. Please let us know if you are available to donate.%0D%0A%0D%0AThank you!" class="btn btn-outline" style="width: 100%;">
          ✉ Send Direct Email
        </a>
      </div>

      <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-light); font-size: 0.82rem; color: var(--text-muted); text-align: center;">
        🔒 LifeDrop respects privacy. Donor communications are logged for safety.
      </div>
    </div>
  `;

  openModal('contact-donor-modal');
};

/* ==========================================================================
   3. Donor Dashboard Logic
   ========================================================================== */
async function initDonorDashboard() {
  const user = requireAuth(['donor', 'admin']);
  if (!user) return;

  // Render donor header info
  document.getElementById('donor-name').textContent = user.name;
  document.getElementById('donor-blood-group').textContent = user.bloodGroup || 'O+';
  document.getElementById('donor-city').textContent = `${user.city}, ${user.state}`;
  document.getElementById('donor-last-donation').textContent = user.lastDonationDate
    ? formatDate(user.lastDonationDate)
    : 'No record yet';

  // Render current availability toggle switch
  const availSwitch = document.getElementById('donor-availability-switch');
  const availStatusText = document.getElementById('donor-availability-status');

  const isAvail = user.availability === 'Available';
  if (availSwitch) availSwitch.checked = isAvail;
  if (availStatusText) {
    availStatusText.textContent = user.availability;
    availStatusText.className = isAvail ? 'badge badge-available' : 'badge badge-unavailable';
  }

  // Handle Switch change
  if (availSwitch) {
    availSwitch.addEventListener('change', async () => {
      const newStatus = availSwitch.checked ? 'Available' : 'Not Available';
      try {
        const res = await fetch(`${API_BASE}/donors/${user._id || user.id}/availability`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AuthState.getToken()}`,
          },
          body: JSON.stringify({ availability: newStatus }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to update status');
        }

        user.availability = newStatus;
        AuthState.setSession(AuthState.getToken(), user);

        availStatusText.textContent = newStatus;
        availStatusText.className = newStatus === 'Available' ? 'badge badge-available' : 'badge badge-unavailable';
        showToast(`Availability changed to: ${newStatus}`, 'success');
      } catch (err) {
        availSwitch.checked = !availSwitch.checked; // revert
        showToast(err.message, 'error');
      }
    });
  }

  // Load relevant emergency requests matching donor's blood group
  loadDonorMatchingRequests(user.bloodGroup, user.city);

  // Profile Update Form
  const profileForm = document.getElementById('donor-profile-form');
  if (profileForm) {
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-city').value = user.city || '';
    document.getElementById('profile-state').value = user.state || '';
    document.getElementById('profile-blood-group').value = user.bloodGroup || 'O+';

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const updates = {
          name: document.getElementById('profile-name').value.trim(),
          phone: document.getElementById('profile-phone').value.trim(),
          city: document.getElementById('profile-city').value.trim(),
          state: document.getElementById('profile-state').value.trim(),
          bloodGroup: document.getElementById('profile-blood-group').value,
          lastDonationDate: document.getElementById('profile-last-donation').value || undefined,
        };

        const res = await fetch(`${API_BASE}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AuthState.getToken()}`,
          },
          body: JSON.stringify(updates),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to update profile');
        }

        AuthState.setSession(AuthState.getToken(), data.user);
        showToast('Profile updated successfully!', 'success');
        setTimeout(() => window.location.reload(), 800);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }
}

async function loadDonorMatchingRequests(bloodGroup, city) {
  const container = document.getElementById('matching-requests-container');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE}/requests?status=Active`);
    const data = await res.json();

    if (!res.ok || !data.success) return;

    // Filter requests where blood matches or is urgent
    const matching = data.requests.filter(r => r.bloodGroup === bloodGroup || r.bloodGroup === 'All');

    if (matching.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 32px; background: white; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
          <p style="color: var(--success-green); font-weight: 600;">No immediate urgent shortages for your blood group (${bloodGroup}).</p>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Thank you for remaining on standby to save lives!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = matching.slice(0, 4).map(req => `
      <div class="request-card ${req.emergencyLevel === 'Critical' ? 'is-critical' : ''}">
        <div class="request-card-header">
          <div class="request-headline">
            <h4>${escapeHtml(req.patientName)}</h4>
            <div class="request-hospital">🏥 ${escapeHtml(req.hospitalName)}</div>
          </div>
          <span class="badge ${req.emergencyLevel === 'Critical' ? 'badge-critical' : 'badge-high'}">${req.emergencyLevel}</span>
        </div>
        <div class="request-details-grid">
          <div class="request-metric">
            <small>Needed</small>
            <strong>${req.requiredUnits} Units</strong>
          </div>
          <div class="request-metric">
            <small>Group</small>
            <strong style="color: var(--primary-red);">${escapeHtml(req.bloodGroup)}</strong>
          </div>
          <div class="request-metric">
            <small>City</small>
            <strong>${escapeHtml(req.city)}</strong>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <small style="color: var(--text-muted);">Posted ${formatRelativeTime(req.createdAt)}</small>
          <a href="tel:${req.contactNumber}" class="btn btn-sm btn-primary">📞 Call Hospital</a>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading matching requests:', err);
  }
}

// Security sanitization helpers
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
