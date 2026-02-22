// Registration Modals Management
let currentRegistrationIndex = null;
let currentTransactionId = null;

// View Registration Details Modal
function viewRegistrationDetails(index) {
  const reg = pendingRegistrations[index];
  if (!reg) return;
  
  currentRegistrationIndex = index;
  
  document.getElementById('viewRegSubtitle').textContent = `Application submitted ${reg.dateApplied}`;
  
  const content = document.getElementById('viewRegistrationContent');
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px">
      <div style="grid-column:1/-1;padding:20px;background:linear-gradient(to bottom,var(--bg),#fff);border-radius:12px;border:2px solid var(--border);display:flex;align-items:center;gap:16px">
        <div style="width:80px;height:80px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;flex-shrink:0">
          ${reg.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
        </div>
        <div style="flex:1">
          <h4 style="margin:0 0 8px;font-size:24px;font-weight:700;color:var(--text)">${reg.name}</h4>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <span style="display:flex;align-items:center;gap:6px;font-size:14px;color:var(--text-light)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              ${reg.age} years old
            </span>
            <span style="display:flex;align-items:center;gap:6px;font-size:14px;color:var(--text-light)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Born ${reg.birthday}
            </span>
          </div>
        </div>
        <div style="padding:8px 16px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#fff;border-radius:8px;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.5px">
          Pending
        </div>
      </div>
      
      <div>
        <label style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-light);margin-bottom:8px;font-weight:600">Contact Number</label>
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span style="font-size:15px;color:var(--text);font-weight:500">${reg.contact}</span>
        </div>
      </div>
      
      <div>
        <label style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-light);margin-bottom:8px;font-weight:600">Application Date</label>
        <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span style="font-size:15px;color:var(--text);font-weight:500">${reg.dateApplied}</span>
        </div>
      </div>
      
      <div style="grid-column:1/-1">
        <label style="display:block;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-light);margin-bottom:8px;font-weight:600">Residential Address</label>
        <div style="display:flex;align-items:start;gap:10px;padding:12px;background:var(--bg);border-radius:8px;border:1px solid var(--border)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="2" style="flex-shrink:0;margin-top:2px">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span style="font-size:15px;color:var(--text);font-weight:500;line-height:1.5">${reg.address}</span>
        </div>
      </div>
    </div>
    
    <div style="margin-top:24px;padding:20px;background:linear-gradient(to bottom,#dbeafe,#fff);border-radius:12px;border:2px solid #93c5fd">
      <div style="display:flex;gap:10px;align-items:start">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="flex-shrink:0">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
        <div>
          <p style="margin:0 0 6px;font-size:15px;font-weight:600;color:var(--text)">Application Review</p>
          <p style="margin:0;font-size:14px;color:var(--text-light);line-height:1.6">Please verify all information is accurate before approving this registration. Approved applicants will be immediately added to the senior citizens database.</p>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('viewRegistrationModal').style.display = 'flex';
}

function closeViewRegistrationModal() {
  document.getElementById('viewRegistrationModal').style.display = 'none';
  currentRegistrationIndex = null;
}

function approveFromViewModal() {
  closeViewRegistrationModal();
  if (currentRegistrationIndex !== null) {
    openApproveRegistrationModal(currentRegistrationIndex);
  }
}

// Approve Registration Modal
function openApproveRegistrationModal(index) {
  const reg = pendingRegistrations[index];
  if (!reg) return;
  
  currentRegistrationIndex = index;
  
  document.getElementById('approveRegName').textContent = reg.name;
  document.getElementById('approveRegDetails').textContent = `${reg.age} years old • ${reg.address}`;
  
  document.getElementById('approveRegistrationModal').style.display = 'flex';
}

function closeApproveRegistrationModal() {
  document.getElementById('approveRegistrationModal').style.display = 'none';
  currentRegistrationIndex = null;
}

function confirmApproveRegistration() {
  if (currentRegistrationIndex === null) return;
  
  const reg = pendingRegistrations[currentRegistrationIndex];
  
  // Add to profiles
  const newProfile = {
    name: reg.name,
    age: reg.age,
    birthday: reg.birthday,
    address: reg.address,
    contact: reg.contact,
    id: `SC${String(profiles.length + 1).padStart(5, '0')}`,
    memberSince: new Date().toISOString().split('T')[0],
    status: 'Active',
    balance: 0,
    transactions: []
  };
  
  profiles.push(newProfile);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  
  // Remove from pending
  pendingRegistrations.splice(currentRegistrationIndex, 1);
  
  // Update displays
  filterSeniors();
  loadPendingRegistrations();
  updateDashboardStats();
  updateSeniorStats();
  
  closeApproveRegistrationModal();
  
  // Show success feedback
  showSuccessToast(`${reg.name} has been approved and added to the registry`);
}

// Reject Registration Modal
function openRejectRegistrationModal(index) {
  const reg = pendingRegistrations[index];
  if (!reg) return;
  
  currentRegistrationIndex = index;
  
  document.getElementById('rejectRegName').textContent = reg.name;
  document.getElementById('rejectRegDetails').textContent = `${reg.age} years old • ${reg.address}`;
  
  document.getElementById('rejectRegistrationModal').style.display = 'flex';
}

function closeRejectRegistrationModal() {
  document.getElementById('rejectRegistrationModal').style.display = 'none';
  currentRegistrationIndex = null;
}

function confirmRejectRegistration() {
  if (currentRegistrationIndex === null) return;
  
  const reg = pendingRegistrations[currentRegistrationIndex];
  
  // Remove from pending
  pendingRegistrations.splice(currentRegistrationIndex, 1);
  
  // Update display
  loadPendingRegistrations();
  updateDashboardStats();
  
  closeRejectRegistrationModal();
  
  // Show success feedback
  showSuccessToast(`${reg.name}'s application has been rejected`);
}

// Success Toast Notification
function showSuccessToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;
  
  toast.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Error Toast Notification
function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;
  
  toast.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Import Confirmation Modal
function openImportConfirmModal(count, fileName) {
  document.getElementById('importCount').textContent = count;
  document.getElementById('importFileName').textContent = fileName;
  document.getElementById('importConfirmModal').style.display = 'flex';
}

function closeImportConfirmModal() {
  document.getElementById('importConfirmModal').style.display = 'none';
  window.pendingImportData = null;
  window.pendingImportFileName = null;
}

function confirmImport() {
  if (!window.pendingImportData) return;
  
  const imported = window.pendingImportData;
  
  // Merge: update existing by ID, add new ones
  imported.forEach(imp => {
    const idx = profiles.findIndex(p => p.id === imp.id);
    if(idx > -1){
      profiles[idx] = {...profiles[idx], ...imp};
    } else {
      profiles.push(imp);
    }
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  filterSeniors();
  updateDashboardStats();
  updateSeniorStats();
  
  closeImportConfirmModal();
  showSuccessToast(`Successfully imported ${imported.length} profiles!`);
}

// Delete Transaction Modal
function openDeleteTransactionModal(txnId) {
  currentTransactionId = txnId;
  
  // Get transaction details
  const transactions = JSON.parse(localStorage.getItem('lingap_transactions') || '[]');
  const txn = transactions.find(t => t.id === txnId);
  
  if (!txn) return;
  
  const dateStr = new Date(txn.timestamp).toLocaleString();
  const detailsHtml = `
    <div><strong>Date:</strong> ${dateStr}</div>
    <div><strong>Senior:</strong> ${txn.seniorName} (${txn.seniorId})</div>
    <div><strong>Type:</strong> ${txn.type}</div>
    ${txn.amount ? `<div><strong>Amount:</strong> ₱${txn.amount}</div>` : ''}
    ${txn.note ? `<div><strong>Note:</strong> ${txn.note}</div>` : ''}
  `;
  
  document.getElementById('deleteTransactionDetails').innerHTML = detailsHtml;
  document.getElementById('deleteTransactionModal').style.display = 'flex';
}

function closeDeleteTransactionModal() {
  document.getElementById('deleteTransactionModal').style.display = 'none';
  currentTransactionId = null;
}

function confirmDeleteTransaction() {
  if (!currentTransactionId) return;
  
  const txnId = currentTransactionId;
  
  // Remove from transactions store
  const transactions = JSON.parse(localStorage.getItem('lingap_transactions') || '[]');
  const txnIndex = transactions.findIndex(t => t.id === txnId);
  if (txnIndex === -1) return;
  
  const txn = transactions[txnIndex];
  transactions.splice(txnIndex, 1);
  localStorage.setItem('lingap_transactions', JSON.stringify(transactions));
  
  // Remove from senior's profile
  const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const seniorIdx = profiles.findIndex(p => p.id === txn.seniorId);
  if (seniorIdx !== -1) {
    profiles[seniorIdx].transactions = profiles[seniorIdx].transactions.filter(t => t.id !== txnId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }
  
  // Refresh displays
  const filterEl = document.getElementById('transactionFilter');
  refreshTransactionsTable(filterEl ? filterEl.value : 'all');
  if (document.querySelector('.tab-btn[data-tab="reports"].active')) {
    populateReports();
  }
  
  closeDeleteTransactionModal();
  showSuccessToast('Transaction deleted successfully');
}

// Add CSS animations
if (!document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Update existing registration functions to use modals
function approveRegistration(index) {
  openApproveRegistrationModal(index);
}

function rejectRegistration(index) {
  openRejectRegistrationModal(index);
}
