// Profile Management Functions

function loadProfileInfo() {
  const session = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if(!session || !session.username) return;
  
  // Get initials from username
  const initials = session.username.substring(0, 2).toUpperCase();
  const initialsEl = document.getElementById('profileInitials');
  if(initialsEl) initialsEl.textContent = initials;
  
  // Set profile info
  const displayNameEl = document.getElementById('profileDisplayName');
  if(displayNameEl) displayNameEl.textContent = session.username === 'admin' ? 'Administrator' : session.username;
  
  const roleEl = document.getElementById('profileRole');
  if(roleEl) {
    if(session.role === 'admin') roleEl.textContent = 'System Admin';
    else if(session.role === 'staff' || session.role === 'osca') roleEl.textContent = 'OSCA Staff';
    else if(session.role === 'merchant') roleEl.textContent = 'Merchant';
    else roleEl.textContent = session.role || 'User';
  }
  
  const usernameEl = document.getElementById('profileUsername');
  if(usernameEl) usernameEl.textContent = session.username;
  
  const emailEl = document.getElementById('profileEmail');
  if(emailEl) emailEl.textContent = session.email || `${session.username}@floridablanca.gov.ph`;
}

// Change Password Modal
function openChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if(!modal) return;
  
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmNewPassword').value = '';
  document.getElementById('newPasswordStrength').style.display = 'none';
  document.getElementById('newPasswordMatchMsg').style.display = 'none';
  
  modal.style.display = 'flex';
}

function closeChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if(modal) modal.style.display = 'none';
}

function toggleCurrentPasswordVisibility() {
  const input = document.getElementById('currentPassword');
  const icon = document.getElementById('eyeIconCurrent');
  
  if(input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function toggleNewPasswordVisibility() {
  const input = document.getElementById('newPassword');
  const icon = document.getElementById('eyeIconNew');
  
  if(input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function toggleConfirmNewPasswordVisibility() {
  const input = document.getElementById('confirmNewPassword');
  const icon = document.getElementById('eyeIconConfirmNew');
  
  if(input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    input.type = 'password';
    icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function validateNewPassword() {
  const password = document.getElementById('newPassword').value;
  const strengthDiv = document.getElementById('newPasswordStrength');
  const strengthText = document.getElementById('newStrengthText');
  
  if(!password || password.length === 0) {
    strengthDiv.style.display = 'none';
    return;
  }
  
  strengthDiv.style.display = 'block';
  
  const hasLength = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  let strength = 0;
  if(hasLength) strength++;
  if(hasUpper) strength++;
  if(hasLower) strength++;
  if(hasNumber) strength++;
  
  // Reset bars
  for(let i = 1; i <= 4; i++) {
    document.getElementById('newStrength' + i).style.background = 'var(--border)';
  }
  
  // Update strength bars and text
  if(strength === 1) {
    document.getElementById('newStrength1').style.background = '#ef4444';
    strengthText.textContent = 'Weak';
    strengthText.style.color = '#ef4444';
  } else if(strength === 2) {
    document.getElementById('newStrength1').style.background = '#f59e0b';
    document.getElementById('newStrength2').style.background = '#f59e0b';
    strengthText.textContent = 'Fair';
    strengthText.style.color = '#f59e0b';
  } else if(strength === 3) {
    document.getElementById('newStrength1').style.background = '#eab308';
    document.getElementById('newStrength2').style.background = '#eab308';
    document.getElementById('newStrength3').style.background = '#eab308';
    strengthText.textContent = 'Good';
    strengthText.style.color = '#eab308';
  } else if(strength === 4) {
    document.getElementById('newStrength1').style.background = '#10b981';
    document.getElementById('newStrength2').style.background = '#10b981';
    document.getElementById('newStrength3').style.background = '#10b981';
    document.getElementById('newStrength4').style.background = '#10b981';
    strengthText.textContent = 'Strong';
    strengthText.style.color = '#10b981';
  }
}

function validateNewPasswordMatch() {
  const password = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  const msg = document.getElementById('newPasswordMatchMsg');
  const confirmInput = document.getElementById('confirmNewPassword');
  
  if(!confirmPassword || confirmPassword.length === 0) {
    msg.style.display = 'none';
    confirmInput.style.borderColor = 'var(--border)';
    return;
  }
  
  msg.style.display = 'block';
  
  if(password === confirmPassword) {
    msg.textContent = '✅ Passwords match';
    msg.style.color = '#10b981';
    confirmInput.style.borderColor = '#10b981';
  } else {
    msg.textContent = '❌ Passwords do not match';
    msg.style.color = '#ef4444';
    confirmInput.style.borderColor = '#ef4444';
  }
}

function changePassword(event) {
  if(event) event.preventDefault();
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmNewPassword').value;
  
  if(!currentPassword || !newPassword || !confirmPassword) {
    alert('Please fill in all fields');
    return;
  }
  
  if(newPassword !== confirmPassword) {
    alert('New passwords do not match');
    return;
  }
  
  if(newPassword.length < 6) {
    alert('New password must be at least 6 characters');
    return;
  }
  
  // Validate password strength
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  
  if(!hasUpper || !hasLower || !hasNumber) {
    alert('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    return;
  }
  
  // Get current user
  const session = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if(!session || !session.username) {
    alert('Session expired. Please login again.');
    location.href = '/';
    return;
  }
  
  // Persist to Supabase
  if (window.db && session.id) {
    window.db.updateStaff(session.id, { password: newPassword })
      .then(() => console.log('[changePassword] Password updated in Supabase'))
      .catch(e => console.error('[changePassword] Failed to update password:', e));
  }

  alert('Password updated successfully!');
  closeChangePasswordModal();
}

// Setup logout button in profile tab
function setupProfileLogout() {
  const logoutBtn = document.getElementById('logoutBtnProfile');
  if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      openLogoutModal();
    });
  }
}

// Logout Modal
function openLogoutModal() {
  document.getElementById('logoutModal').style.display = 'flex';
}

function closeLogoutModal() {
  document.getElementById('logoutModal').style.display = 'none';
}

function confirmLogout() {
  if (window._Session) { window._Session.clear(); } else { sessionStorage.removeItem('lingap_user'); localStorage.removeItem('lingap_session'); }
  location.href = 'logout.php';
}

// Initialize profile when page loads
if(document.getElementById('profileTab')) {
  loadProfileInfo();
  setupProfileLogout();
}
