// Staff Management Functions

const STAFF_STORAGE_KEY = 'lingap_staff_v1';
let staffMembers = [];

// Initialize staff with mock data
function initStaff() {
  const stored = localStorage.getItem(STAFF_STORAGE_KEY);
  if(stored) {
    staffMembers = JSON.parse(stored);
  } else {
    // Default staff members
    staffMembers = [
      {
        id: 'STAFF-001',
        name: 'Maria Santos',
        username: 'maria',
        password: 'staff123', // In production, this should be hashed
        role: 'staff',
        contact: '0912-345-6789',
        email: 'maria@floridablanca.gov.ph',
        dateAdded: '2025-01-15'
      },
      {
        id: 'STAFF-002',
        name: 'Store 1',
        username: 'store1',
        password: 'merchant123',
        role: 'merchant',
        contact: '0923-456-7890',
        email: 'store1@example.com',
        dateAdded: '2025-02-10'
      },
      {
        id: 'STAFF-003',
        name: 'Pharmacy',
        username: 'pharmacy',
        password: 'merchant123',
        role: 'merchant',
        contact: '0934-567-8901',
        email: 'pharmacy@example.com',
        dateAdded: '2025-03-05'
      }
    ];
    saveStaffData();
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
  
  if(staffMembers.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding:40px;background:#f8fafc;border:2px dashed var(--border);text-align:center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;color:var(--text-light)">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
        </svg>
        <p style="margin:0;font-size:15px;color:var(--text-light)">No staff members yet</p>
        <p class="small" style="margin-top:8px;color:var(--text-light)">Add your first staff member or merchant to get started</p>
      </div>`;
    return;
  }
  
  staffMembers.forEach((staff, idx) => {
    const initials = getInitials(staff.name);
    const colors = [
      'linear-gradient(135deg,var(--primary),var(--accent))',
      'linear-gradient(135deg,#10b981,#059669)',
      'linear-gradient(135deg,#f59e0b,#d97706)',
      'linear-gradient(135deg,#ec4899,#db2777)',
      'linear-gradient(135deg,#06b6d4,#0891b2)',
      'linear-gradient(135deg,#8b5cf6,#7c3aed)'
    ];
    const color = colors[idx % colors.length];
    
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding:20px;background:#fff;border:1px solid var(--border)';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;gap:16px;flex-wrap:wrap">
        <div style="display:flex;gap:16px;align-items:center;flex:1;min-width:250px">
          <div style="width:56px;height:56px;background:${color};border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;flex-shrink:0">${initials}</div>
          <div style="flex:1">
            <h4 style="margin:0;font-size:17px;font-weight:700">${staff.name}</h4>
            <p class="small" style="margin:6px 0 0;color:var(--text-light)">@${staff.username} • ${staff.role === 'staff' ? 'OSCA Staff' : 'Merchant'}</p>
            ${staff.contact ? `<p class="small" style="margin:4px 0 0;color:var(--text-light)">${staff.contact}</p>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-shrink:0">
          <button class="btn ghost" onclick="editStaffMember(${idx})" style="padding:8px 16px;font-size:14px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit
          </button>
          <button class="btn ghost" onclick="deleteStaffMember(${idx})" style="padding:8px 16px;font-size:14px;color:#ef4444">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Remove
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
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
  
  staffMembers.splice(currentDeleteStaffIndex, 1);
  saveStaffData();
  renderStaffList();
  closeDeleteStaffModal();
  
  alert(`${name} has been removed from the system.`);
}

// Initialize staff when page loads
if(document.getElementById('staffList')) {
  initStaff();
}
