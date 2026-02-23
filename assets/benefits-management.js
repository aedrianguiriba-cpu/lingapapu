// Benefits Management System
const BENEFITS_STORAGE_KEY = 'lingap_benefits_v1';
let benefits = [];
let editingBenefitIndex = null;
let benefitsPage = 1;
const BENEFITS_PAGE_SIZE = 5;

// Initialize benefits with default data
async function initBenefits() {
  // Try Supabase first
  if (window.db) {
    try {
      const data = await window.db.getBenefits();
      if (data && data.length > 0) {
        benefits = data;
        localStorage.setItem(BENEFITS_STORAGE_KEY, JSON.stringify(benefits));
        renderBenefitsList();
        return;
      }
    } catch (e) {
      console.warn('[benefits] Supabase load failed, using localStorage/defaults', e);
    }
  }

  // Fallback: localStorage
  const stored = localStorage.getItem(BENEFITS_STORAGE_KEY);
  if (stored) {
    benefits = JSON.parse(stored);
  } else {
    // Default benefits
    benefits = [
      {
        id: 'BEN001',
        name: 'Monthly Pension',
        description: 'Monthly cash assistance for eligible senior citizens',
        amount: 1500,
        frequency: 'Monthly',
        active: true,
        dateCreated: '2025-01-15'
      },
      {
        id: 'BEN002',
        name: 'Medical Subsidy',
        description: 'Annual medical assistance and healthcare subsidy',
        amount: 5000,
        frequency: 'Annually',
        active: true,
        dateCreated: '2025-01-15'
      },
      {
        id: 'BEN003',
        name: 'Transport Allowance',
        description: 'Transportation support for seniors',
        amount: 500,
        frequency: 'Monthly',
        active: true,
        dateCreated: '2025-01-15'
      },
      {
        id: 'BEN004',
        name: 'Birthday Cash Gift',
        description: 'Special birthday gift for senior citizens',
        amount: 1000,
        frequency: 'Annually',
        active: true,
        dateCreated: '2025-01-15'
      },
      {
        id: 'BEN005',
        name: 'Grocery Voucher',
        description: 'Quarterly grocery assistance vouchers',
        amount: 2000,
        frequency: 'Quarterly',
        active: true,
        dateCreated: '2025-01-15'
      }
    ];
    saveBenefits();
    // Upload defaults to Supabase
    if (window.db) {
      benefits.forEach(b => window.db.addBenefit(b).catch(() => {}));
    }
  }
  renderBenefitsList();
}

// Save benefits to localStorage
function saveBenefits() {
  localStorage.setItem(BENEFITS_STORAGE_KEY, JSON.stringify(benefits));
}

// Render benefits list
function renderBenefitsList() {
  const container = document.getElementById('benefitsList');
  if (!container) return;

  if (benefits.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-light)">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;opacity:0.3">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <p style="margin:0;font-size:16px;font-weight:600">No benefits added yet</p>
        <p style="margin:8px 0 0;font-size:14px">Use the form to add your first benefit program</p>
      </div>
    `;
    updateBenefitsCount();
    return;
  }

  container.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(benefits.length / BENEFITS_PAGE_SIZE));
  benefitsPage = Math.min(Math.max(1, benefitsPage), totalPages);
  const start = (benefitsPage - 1) * BENEFITS_PAGE_SIZE;
  const pageItems = benefits.slice(start, start + BENEFITS_PAGE_SIZE);

  pageItems.forEach((benefit, pageIdx) => {
    const index = start + pageIdx;
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding:16px;background:#fff;border:1px solid var(--border);transition:all 0.2s';
    const statusColor = benefit.active ? '#10b981' : '#9ca3af';
    const statusText = benefit.active ? 'Active' : 'Inactive';
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--text)">${benefit.name}</h4>
            <span style="padding:2px 8px;background:${benefit.active ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)'};color:${statusColor};border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${statusText}</span>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <p class="small" style="margin:0;font-weight:600;color:var(--primary)">₱${benefit.amount.toLocaleString()}</p>
            <span style="color:var(--text-light);font-size:13px">•</span>
            <p class="small" style="margin:0;color:var(--text-light)">${benefit.frequency}</p>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn ghost" style="padding:6px 12px;font-size:13px" onclick="editBenefit(${index})" title="Edit benefit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn ghost" style="padding:6px 12px;font-size:13px;color:#ef4444" onclick="deleteBenefit(${index})" title="Delete benefit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      <p class="small" style="margin:0;color:var(--text-light);line-height:1.5">${benefit.description}</p>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span style="font-size:12px;color:var(--text-light)">Created: ${new Date(benefit.dateCreated).toLocaleDateString()}</span>
      </div>
    `;
    container.appendChild(card);
  });

  renderPagination(document.getElementById('benefitsPagination'), benefitsPage, totalPages, 'goToBenefitsPage');
  updateBenefitsCount();
}

function goToBenefitsPage(p) {
  const totalPages = Math.max(1, Math.ceil((window.benefits || []).length / BENEFITS_PAGE_SIZE));
  if (p < 1 || p > totalPages) return;
  benefitsPage = p;
  renderBenefitsList();
}

// Update benefits count badge
function updateBenefitsCount() {
  const countEl = document.querySelector('#benefitsTab .badge');
  if (countEl) {
    const activeCount = benefits.filter(b => b.active).length;
    countEl.textContent = `${activeCount} Program${activeCount !== 1 ? 's' : ''}`;
  }
}

// Add new benefit
function addBenefit() {
  const name = document.getElementById('benefitName').value.trim();
  const description = document.getElementById('benefitDescription').value.trim();
  const amount = parseFloat(document.getElementById('benefitAmount').value);
  const frequency = document.getElementById('benefitFrequency').value;
  
  // Validation
  if (!name) {
    showErrorToast('Please enter a benefit name');
    return;
  }
  
  if (!description) {
    showErrorToast('Please enter a description');
    return;
  }
  
  if (!amount || amount <= 0) {
    showErrorToast('Please enter a valid amount');
    return;
  }
  
  if (editingBenefitIndex !== null) {
    // Update existing benefit
    benefits[editingBenefitIndex] = {
      ...benefits[editingBenefitIndex],
      name,
      description,
      amount,
      frequency
    };
    const updated = benefits[editingBenefitIndex];
    if (window.db) window.db.updateBenefit(updated.id, { name, description, amount, frequency }).catch(e => console.error('[benefits updateBenefit]', e));
    showSuccessToast('Benefit updated successfully');
    editingBenefitIndex = null;
    document.getElementById('addBenefit').innerHTML = 'Add Benefit';
  } else {
    // Add new benefit
    const newBenefit = {
      id: `BEN${String(benefits.length + 1).padStart(3, '0')}`,
      name,
      description,
      amount,
      frequency,
      active: true,
      dateCreated: new Date().toISOString().split('T')[0]
    };
    benefits.push(newBenefit);
    if (window.db) window.db.addBenefit(newBenefit).catch(e => console.error('[benefits addBenefit]', e));
    showSuccessToast('Benefit added successfully');
  }
  
  saveBenefits();
  renderBenefitsList();
  clearBenefitForm();
}

// Edit benefit
function editBenefit(index) {
  const benefit = benefits[index];
  if (!benefit) return;
  
  editingBenefitIndex = index;
  
  document.getElementById('benefitName').value = benefit.name;
  document.getElementById('benefitDescription').value = benefit.description;
  document.getElementById('benefitAmount').value = benefit.amount;
  document.getElementById('benefitFrequency').value = benefit.frequency;
  
  document.getElementById('addBenefit').innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
    Update Benefit
  `;
  
  // Scroll to form
  document.getElementById('benefitName').scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('benefitName').focus();
}

// Delete benefit
function deleteBenefit(index) {
  const benefit = benefits[index];
  if (!benefit) return;
  
  openDeleteBenefitModal(index);
}

// Clear form
function clearBenefitForm() {
  document.getElementById('benefitName').value = '';
  document.getElementById('benefitDescription').value = '';
  document.getElementById('benefitAmount').value = '';
  document.getElementById('benefitFrequency').value = 'Monthly';
  editingBenefitIndex = null;
  document.getElementById('addBenefit').innerHTML = 'Add Benefit';
}

// Delete Benefit Modal
let deletingBenefitIndex = null;

function openDeleteBenefitModal(index) {
  const benefit = benefits[index];
  if (!benefit) return;
  
  deletingBenefitIndex = index;
  
  document.getElementById('deleteBenefitName').textContent = benefit.name;
  document.getElementById('deleteBenefitDetails').textContent = `₱${benefit.amount.toLocaleString()} • ${benefit.frequency}`;
  document.getElementById('deleteBenefitModal').style.display = 'flex';
}

function closeDeleteBenefitModal() {
  document.getElementById('deleteBenefitModal').style.display = 'none';
  deletingBenefitIndex = null;
}

function confirmDeleteBenefit() {
  if (deletingBenefitIndex === null) return;
  
  const benefit = benefits[deletingBenefitIndex];
  const benefitId = benefit.id;
  benefits.splice(deletingBenefitIndex, 1);
  
  saveBenefits();
  renderBenefitsList();
  if (window.db) window.db.deleteBenefit(benefitId).catch(e => console.error('[benefits deleteBenefit]', e));
  closeDeleteBenefitModal();
  
  showSuccessToast(`${benefit.name} has been deleted`);
}

// Initialize when benefits tab exists
if (document.getElementById('benefitsTab')) {
  initBenefits();
  
  const addBtn = document.getElementById('addBenefit');
  if (addBtn) {
    addBtn.addEventListener('click', addBenefit);
  }
}
