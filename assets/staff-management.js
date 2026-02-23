// Staff Management Functions

const STAFF_STORAGE_KEY = 'lingap_staff_v1';
let staffMembers = [];
let staffPage = 1;
const STAFF_PAGE_SIZE = 5;

// Initialize staff from database
async function initStaff() {
  // Try Supabase first
  if (window.db) {
    try {
      console.log('[staff] Loading from Supabase...');
      const data = await window.db.getStaff();
      if (data && data.length > 0) {
        staffMembers = data;
        localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffMembers));
        console.log('[staff] Loaded', data.length, 'staff members from Supabase');
        renderStaffList();
        return;
      }
    } catch (e) {
      console.warn('[staff] Supabase load failed:', e);
    }
  }

  // Fallback: try localStorage
  const stored = localStorage.getItem(STAFF_STORAGE_KEY);
  if (stored) {
    try {
      staffMembers = JSON.parse(stored);
      console.log('[staff] Loaded', staffMembers.length, 'staff members from localStorage');
    } catch (e) {
      console.error('[staff] Failed to parse localStorage:', e);
      staffMembers = [];
    }
  } else {
    // No data available
    staffMembers = [];
    console.log('[staff] No staff data available - database is empty');
  }
  
  renderStaffList();
}

function saveStaffData() {
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffMembers));
}

// Password validation
function validatePassword() {
  const password = document.getElementById('staffPassword').value;
  const strengthDiv = document.getElementById('passwordStrength');
  const strengthText = document.getElementById('strengthText');
  
  if(!password || password.length === 0) {
    strengthDiv.style.display = 'none';
    return;
  }
  
  strengthDiv.style.display = 'block';
  
  // Check requirements
  const hasLength = password.length >= 6;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  // Update requirement checkmarks
  document.getElementById('req-length').innerHTML = hasLength ? '✅ At least 6 characters' : '❌ At least 6 characters';
  document.getElementById('req-upper').innerHTML = hasUpper ? '✅ One uppercase letter' : '❌ One uppercase letter';
  document.getElementById('req-lower').innerHTML = hasLower ? '✅ One lowercase letter' : '❌ One lowercase letter';
  document.getElementById('req-number').innerHTML = hasNumber ? '✅ One number' : '❌ One number';
  
  // Calculate strength
  let strength = 0;
  if(hasLength) strength++;
  if(hasUpper) strength++;
  if(hasLower) strength++;
  if(hasNumber) strength++;
  
  // Reset bars
  for(let i = 1; i <= 4; i++) {
    document.getElementById('strength' + i).style.background = 'var(--border)';
  }
  
  // Update strength bars and text
  if(strength === 1) {
    document.getElementById('strength1').style.background = '#ef4444';
    strengthText.textContent = 'Weak';
    strengthText.style.color = '#ef4444';
  } else if(strength === 2) {
    document.getElementById('strength1').style.background = '#f59e0b';
    document.getElementById('strength2').style.background = '#f59e0b';
    strengthText.textContent = 'Fair';
    strengthText.style.color = '#f59e0b';
  } else if(strength === 3) {
    document.getElementById('strength1').style.background = '#eab308';
    document.getElementById('strength2').style.background = '#eab308';
    document.getElementById('strength3').style.background = '#eab308';
    strengthText.textContent = 'Good';
    strengthText.style.color = '#eab308';
  } else if(strength === 4) {
    document.getElementById('strength1').style.background = '#10b981';
    document.getElementById('strength2').style.background = '#10b981';
    document.getElementById('strength3').style.background = '#10b981';
    document.getElementById('strength4').style.background = '#10b981';
    strengthText.textContent = 'Strong';
    strengthText.style.color = '#10b981';
  }
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById('staffPassword');
  const eyeIcon = document.getElementById('eyeIcon');
  
  if(passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    passwordInput.type = 'password';
    eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function toggleConfirmPasswordVisibility() {
  const confirmInput = document.getElementById('staffConfirmPassword');
  const eyeIcon = document.getElementById('eyeIconConfirm');
  
  if(confirmInput.type === 'password') {
    confirmInput.type = 'text';
    eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
  } else {
    confirmInput.type = 'password';
    eyeIcon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  }
}

function validatePasswordMatch() {
  const password = document.getElementById('staffPassword').value;
  const confirmPassword = document.getElementById('staffConfirmPassword').value;
  const msg = document.getElementById('passwordMatchMsg');
  const confirmInput = document.getElementById('staffConfirmPassword');
  
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

function generateStaffId() {
  const count = staffMembers.length + 1;
  return `STAFF-${String(count).padStart(3, '0')}`;
}

function getInitials(name) {
  const parts = name.trim().split(' ');
  if(parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderStaffList() {
  const container = document.getElementById('staffList');
  if(!container) return;
  container.innerHTML = '';

  // Update summary stats
  const totalEl = document.getElementById('statTotalStaff');
  const oscaEl  = document.getElementById('statOscaStaff');
  const merEl   = document.getElementById('statMerchants');
  if(totalEl) totalEl.textContent = staffMembers.length;
  if(oscaEl)  oscaEl.textContent  = staffMembers.filter(s => s.role === 'osca').length;
  if(merEl)   merEl.textContent   = staffMembers.filter(s => s.role === 'merchant').length;

  if(staffMembers.length === 0) {
    container.innerHTML = `
      <div style="padding:56px 20px;background:#fff;border:1px solid var(--border);border-radius:8px;text-align:center">
        <div style="width:64px;height:64px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
        </div>
        <p style="margin:0;font-size:15px;font-weight:700;color:#374151">No staff members yet</p>
        <p style="margin:6px 0 0;font-size:13px;color:#6b7280">Add your first staff member or merchant to get started</p>
      </div>`;
    return;
  }

  const avatarColors = [
    '#22c55e','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#06b6d4'
  ];
  const roleMeta = {
    osca:     { label: 'OSCA Staff',  bg: '#dcfce7', color: '#15803d', border: '#22c55e' },
    merchant: { label: 'Merchant',    bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
    admin:    { label: 'Admin',       bg: '#eff6ff', color: '#1d4ed8', border: '#3b82f6' },
  };

  const totalPages = Math.max(1, Math.ceil(staffMembers.length / STAFF_PAGE_SIZE));
  staffPage = Math.min(Math.max(1, staffPage), totalPages);
  const start = (staffPage - 1) * STAFF_PAGE_SIZE;
  const pageItems = staffMembers.slice(start, start + STAFF_PAGE_SIZE);

  pageItems.forEach((staff, pageIdx) => {
    const idx = start + pageIdx;
    const initials = getInitials(staff.name);
    const avatarBg = avatarColors[idx % avatarColors.length];
    const role = roleMeta[staff.role] || { label: staff.role, bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border:1px solid var(--border);border-radius:8px;padding:18px 20px;transition:box-shadow 0.2s';
    card.onmouseover = () => card.style.boxShadow = '0 3px 10px rgba(0,0,0,0.07)';
    card.onmouseout  = () => card.style.boxShadow = 'none';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="display:flex;gap:14px;align-items:center;flex:1;min-width:220px">
          <!-- Avatar -->
          <div style="width:52px;height:52px;background:${avatarBg};border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;flex-shrink:0;letter-spacing:-1px">${initials}</div>
          <!-- Info -->
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px">
              <h4 style="margin:0;font-size:15px;font-weight:800;color:#1f2937">${staff.name}</h4>
              <span style="padding:2px 10px;background:${role.bg};color:${role.color};border:1px solid ${role.border};border-radius:12px;font-size:11px;font-weight:700;white-space:nowrap">${role.label}</span>
            </div>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              <span style="font-size:12px;color:#6b7280;font-family:monospace">@${staff.username}</span>
              ${staff.contact ? `<span style="font-size:12px;color:#6b7280;display:flex;align-items:center;gap:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.47 13 19.79 19.79 0 0 1 1.29 4.31 2 2 0 0 1 3.26 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.4a16 16 0 0 0 6.29 6.29l.77-.77a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/></svg>${staff.contact}</span>` : ''}
              ${staff.email ? `<span style="font-size:12px;color:#6b7280;display:flex;align-items:center;gap:4px"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${staff.email}</span>` : ''}
            </div>
          </div>
        </div>
        <!-- Actions -->
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn ghost" onclick="editStaffMember(${idx})" style="padding:7px 14px;font-size:13px;display:flex;align-items:center;gap:6px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="btn ghost" onclick="deleteStaffMember(${idx})" style="padding:7px 14px;font-size:13px;color:#ef4444;border-color:#fca5a5;display:flex;align-items:center;gap:6px">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Remove
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  renderPagination(document.getElementById('staffPagination'), staffPage, totalPages, 'goToStaffPage');
}

function goToStaffPage(p) {
  const totalPages = Math.max(1, Math.ceil(staffMembers.length / STAFF_PAGE_SIZE));
  if (p < 1 || p > totalPages) return;
  staffPage = p;
  renderStaffList();
}

function openAddStaffModal() {
  const modal = document.getElementById('staffModal');
  if(!modal) return;
  
  document.getElementById('staffModalTitle').textContent = 'Add Staff Member';
  document.getElementById('staffIndex').value = '';
  document.getElementById('staffName').value = '';
  document.getElementById('staffUsername').value = '';
  document.getElementById('staffPassword').value = '';
  document.getElementById('staffConfirmPassword').value = '';
  document.getElementById('staffRole').value = '';
  document.getElementById('staffContact').value = '';
  document.getElementById('staffEmail').value = '';
  
  // Password is required for new staff
  document.getElementById('staffPassword').required = true;
  document.getElementById('staffConfirmPassword').required = true;
  document.getElementById('passwordRequired').style.display = 'inline';
  document.getElementById('confirmPasswordRequired').style.display = 'inline';
  document.getElementById('passwordHint').textContent = 'Minimum 6 characters';
  document.getElementById('passwordMatchMsg').style.display = 'none';
  document.getElementById('passwordStrength').style.display = 'none';
  
  modal.style.display = 'flex';
}

function editStaffMember(idx) {
  const staff = staffMembers[idx];
  if(!staff) return;
  
  const modal = document.getElementById('staffModal');
  if(!modal) return;
  
  document.getElementById('staffModalTitle').textContent = 'Edit Staff Member';
  document.getElementById('staffIndex').value = idx;
  document.getElementById('staffName').value = staff.name;
  document.getElementById('staffUsername').value = staff.username;
  document.getElementById('staffPassword').value = '';
  document.getElementById('staffConfirmPassword').value = '';
  document.getElementById('staffRole').value = staff.role;
  document.getElementById('staffContact').value = staff.contact || '';
  document.getElementById('staffEmail').value = staff.email || '';
  
  // Password is optional when editing
  document.getElementById('staffPassword').required = false;
  document.getElementById('staffConfirmPassword').required = false;
  document.getElementById('passwordRequired').style.display = 'none';
  document.getElementById('confirmPasswordRequired').style.display = 'none';
  document.getElementById('passwordHint').textContent = 'Leave blank to keep current password';
  document.getElementById('passwordMatchMsg').style.display = 'none';
  document.getElementById('passwordStrength').style.display = 'none';
  
  modal.style.display = 'flex';
}

function closeStaffModal() {
  const modal = document.getElementById('staffModal');
  if(modal) modal.style.display = 'none';
}

function saveStaff(event) {
  if(event) event.preventDefault();
  
  const idx = document.getElementById('staffIndex').value;
  const name = document.getElementById('staffName').value.trim();
  const username = document.getElementById('staffUsername').value.trim();
  const password = document.getElementById('staffPassword').value;
  const confirmPassword = document.getElementById('staffConfirmPassword').value;
  const role = document.getElementById('staffRole').value;
  const contact = document.getElementById('staffContact').value.trim();
  const email = document.getElementById('staffEmail').value.trim();
  
  if(!name || !username || !role) {
    alert('Please fill in all required fields');
    return;
  }
  
  // Check password match if password is provided
  if(password && password !== confirmPassword) {
    alert('Passwords do not match. Please check and try again.');
    return;
  }
  
  // Check if username already exists (except for current user when editing)
  const existingIdx = staffMembers.findIndex(s => s.username === username);
  if(existingIdx !== -1 && existingIdx !== parseInt(idx)) {
    alert('Username already exists. Please choose a different username.');
    return;
  }
  
  if(idx === '') {
    // Adding new staff
    if(!password || password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    // Validate password strength
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if(!hasUpper || !hasLower || !hasNumber) {
      alert('Password must contain at least one uppercase letter, one lowercase letter, and one number for security.');
      return;
    }
    
    const newStaff = {
      id: generateStaffId(),
      name,
      username,
      password, // In production, hash this
      role,
      contact,
      email,
      dateAdded: new Date().toISOString().split('T')[0]
    };
    
    staffMembers.push(newStaff);
    if (window.db) window.db.addStaff(newStaff).catch(e => console.error('[staff addStaff]', e));
    alert(`${name} added successfully!`);
  } else {
    // Editing existing staff
    const i = parseInt(idx);
    staffMembers[i].name = name;
    staffMembers[i].username = username;
    if(password) {
      if(password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      
      // Validate password strength
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      
      if(!hasUpper || !hasLower || !hasNumber) {
        alert('Password must contain at least one uppercase letter, one lowercase letter, and one number for security.');
        return;
      }
      
      staffMembers[i].password = password; // In production, hash this
    }
    staffMembers[i].role = role;
    staffMembers[i].contact = contact;
    staffMembers[i].email = email;

    if (window.db) {
      window.db.updateStaff(staffMembers[i].id, {
        name, username, role, contact, email,
        ...(password ? { password } : {})
      }).catch(e => console.error('[staff updateStaff]', e));
    }

    alert(`${name} updated successfully!`);
  }
  
  saveStaffData();
  renderStaffList();
  closeStaffModal();
}

// Delete Staff Modal
let currentDeleteStaffIndex = null;

function deleteStaffMember(idx) {
  const staff = staffMembers[idx];
  if(!staff) return;
  
  const modal = document.getElementById('deleteStaffModal');
  if(!modal) {
    // Fallback to confirm dialog
    if(confirm(`Are you sure you want to remove ${staff.name}?\n\nThey will no longer be able to access the system.`)) {
      staffMembers.splice(idx, 1);
      saveStaffData();
      renderStaffList();
      alert(`${staff.name} has been removed.`);
    }
    return;
  }
  
  const nameEl = document.getElementById('deleteStaffName');
  const detailsEl = document.getElementById('deleteStaffDetails');
  
  if(nameEl) nameEl.textContent = staff.name;
  if(detailsEl) detailsEl.textContent = `@${staff.username} • ${staff.role === 'staff' ? 'OSCA Staff' : 'Merchant'}`;
  
  currentDeleteStaffIndex = idx;
  modal.style.display = 'flex';
}

function closeDeleteStaffModal() {
  const modal = document.getElementById('deleteStaffModal');
  if(modal) modal.style.display = 'none';
  currentDeleteStaffIndex = null;
}

function confirmDeleteStaff() {
  if(currentDeleteStaffIndex === null || currentDeleteStaffIndex < 0 || currentDeleteStaffIndex >= staffMembers.length) {
    closeDeleteStaffModal();
    return;
  }
  
  const staff = staffMembers[currentDeleteStaffIndex];
  const name = staff.name;
  const staffId = staff.id;

  staffMembers.splice(currentDeleteStaffIndex, 1);
  saveStaffData();
  renderStaffList();
  if (window.db) window.db.deleteStaff(staffId).catch(e => console.error('[staff deleteStaff]', e));
  closeDeleteStaffModal();

  alert(`${name} has been removed from the system.`);
}

// Initialize staff when page loads
if(document.getElementById('staffList')) {
  initStaff();
}
