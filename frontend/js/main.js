/**
 * LifeDrop – Blood Shortage Management System
 * Core Client Library & Utilities
 */

// Determine API Base URL automatically
const API_BASE = window.location.origin.includes(':5000')
  ? `${window.location.origin}/api`
  : 'http://localhost:5000/api';

// Current session helpers
const AuthState = {
  getToken() {
    return localStorage.getItem('lifedrop_token');
  },
  getUser() {
    try {
      const user = localStorage.getItem('lifedrop_user');
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },
  setSession(token, user) {
    localStorage.setItem('lifedrop_token', token);
    localStorage.setItem('lifedrop_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('lifedrop_token');
    localStorage.removeItem('lifedrop_user');
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },
  getDashboardUrl(role) {
    switch (role) {
      case 'donor':
        return 'donor-dashboard.html';
      case 'hospital':
        return 'hospital-dashboard.html';
      case 'admin':
        return 'admin-dashboard.html';
      case 'patient':
        return 'patient-dashboard.html';
      default:
        return 'index.html';
    }
  }
};

// Toast Notification Manager
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓ ' : type === 'error' ? '⚠ ' : 'ℹ ';
  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Modal dialog helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Format date nicely
function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / (60 * 1000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Render dynamic navbar state
function updateNavigation() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const user = AuthState.getUser();

  if (user) {
    const dashboardUrl = AuthState.getDashboardUrl(user.role);
    navActions.innerHTML = `
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 0.88rem; color: var(--text-muted);">
          Hello, <strong style="color: var(--text-dark);">${user.name.split(' ')[0]}</strong> (${user.role})
        </span>
        <a href="${dashboardUrl}" class="btn btn-sm btn-outline">Dashboard</a>
        <button id="nav-logout-btn" class="btn btn-sm btn-outline-danger">Logout</button>
      </div>
    `;

    document.getElementById('nav-logout-btn')?.addEventListener('click', () => {
      AuthState.clearSession();
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 600);
    });
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-sm btn-outline">Login</a>
      <a href="register.html" class="btn btn-sm btn-primary">Register</a>
    `;
  }
}

// Fetch live critical requests count to show ticker
async function initEmergencyTicker() {
  const tickerElement = document.getElementById('emergency-ticker-text');
  if (!tickerElement) return;

  try {
    const res = await fetch(`${API_BASE}/requests?status=Active`);
    const data = await res.json();

    if (data.success && data.requests.length > 0) {
      const criticalCount = data.requests.filter(r => r.emergencyLevel === 'Critical').length;
      const totalActive = data.requests.length;

      tickerElement.innerHTML = `
        <span><strong>${totalActive} Active Emergency Requests</strong> across hospitals</span>
        ${criticalCount > 0 ? `<span style="background: rgba(0,0,0,0.25); padding: 2px 8px; border-radius: 4px; margin-left: 8px;">🔥 ${criticalCount} Critical Urgency</span>` : ''}
        <a href="emergency-requests.html" class="ticker-link">View All Urgent Cases &rarr;</a>
      `;
    } else {
      tickerElement.innerHTML = `
        <span>All emergency requirements currently met. Donors ready on standby.</span>
        <a href="find-donor.html" class="ticker-link">Search Donors &rarr;</a>
      `;
    }
  } catch (err) {
    tickerElement.innerHTML = `
      <span>Connect directly with available blood donors across major hospitals.</span>
      <a href="find-donor.html" class="ticker-link">Search Donors &rarr;</a>
    `;
  }
}

// Close modals when clicking backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  updateNavigation();
  initEmergencyTicker();
});
