/**
 * LifeDrop – Authentication & Session Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initRegisterPage();
  initLoginPage();
});

// Setup Registration Form
function initRegisterPage() {
  const registerForm = document.getElementById('register-form');
  const roleSelect = document.getElementById('reg-role');
  const donorFields = document.getElementById('donor-specific-fields');
  const hospitalFields = document.getElementById('hospital-specific-fields');

  if (!registerForm) return;

  // Role change conditional fields
  if (roleSelect) {
    const handleRoleChange = () => {
      const selectedRole = roleSelect.value;
      if (donorFields) {
        donorFields.style.display = selectedRole === 'donor' ? 'block' : 'none';
      }
      if (hospitalFields) {
        hospitalFields.style.display = selectedRole === 'hospital' ? 'block' : 'none';
      }
    };

    roleSelect.addEventListener('change', handleRoleChange);
    handleRoleChange(); // trigger initial state
  }

  // Handle Form Submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Registering Account...';
    submitBtn.disabled = true;

    const role = document.getElementById('reg-role').value;
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const city = document.getElementById('reg-city').value.trim();
    const state = document.getElementById('reg-state').value.trim();
    const gender = document.getElementById('reg-gender').value;
    const age = document.getElementById('reg-age').value;

    // Validation
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      return;
    }

    const payload = {
      name,
      email,
      phone,
      password,
      confirmPassword,
      city,
      state,
      gender,
      age: age ? Number(age) : undefined,
      role,
    };

    if (role === 'donor') {
      payload.bloodGroup = document.getElementById('reg-blood-group').value;
      payload.availability = document.getElementById('reg-availability').value;
      payload.lastDonationDate = document.getElementById('reg-last-donation').value || null;
    } else if (role === 'hospital') {
      payload.hospitalName = document.getElementById('reg-hospital-name')?.value.trim() || name;
    } else if (role === 'patient') {
      payload.bloodGroup = document.getElementById('reg-patient-blood-group')?.value || 'O+';
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      showToast('Registration successful! Redirecting to your dashboard...', 'success');
      AuthState.setSession(data.token, data.user);

      setTimeout(() => {
        const dest = AuthState.getDashboardUrl(data.user.role);
        window.location.href = dest;
      }, 1000);
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

// Setup Login Form & Demo Quick-Fill
function initLoginPage() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  // Demo auto-fill buttons
  window.fillDemoAccount = (role) => {
    const emailInput = document.getElementById('login-email');
    const passInput = document.getElementById('login-password');

    switch (role) {
      case 'admin':
        emailInput.value = 'admin@lifedrop.org';
        passInput.value = 'Admin@123';
        break;
      case 'hospital':
        emailInput.value = 'cityhospital@lifedrop.org';
        passInput.value = 'Hospital@123';
        break;
      case 'donor':
        emailInput.value = 'alex.hayes@example.com';
        passInput.value = 'Donor@123';
        break;
      case 'patient':
        emailInput.value = 'patient@lifedrop.org';
        passInput.value = 'Patient@123';
        break;
    }
    showToast(`Filled credentials for ${role.toUpperCase()} account`, 'info');
  };

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Signing In...';
    submitBtn.disabled = true;

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid email or password');
      }

      showToast(`Welcome back, ${data.user.name}!`, 'success');
      AuthState.setSession(data.token, data.user);

      setTimeout(() => {
        const dest = AuthState.getDashboardUrl(data.user.role);
        window.location.href = dest;
      }, 700);
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });
}

// Protected route guard helper
function requireAuth(allowedRoles = []) {
  const token = AuthState.getToken();
  const user = AuthState.getUser();

  if (!token || !user) {
    showToast('Please log in to access this dashboard', 'error');
    window.location.href = 'login.html';
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    showToast(`Access restricted: Available only for ${allowedRoles.join(' or ')}`, 'error');
    window.location.href = AuthState.getDashboardUrl(user.role);
    return null;
  }

  return user;
}
