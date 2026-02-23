// Age-Based Benefits Management - Integrates with benefits-management.js
const AGE_BENEFITS_STORAGE_KEY = 'lingap_age_benefits_v1';
let ageBenefits = {};
let editingAgeBenefit = null;

// Default age-based benefits
const DEFAULT_AGE_BENEFITS = {
  90: { age: 90, amount: 3000, description: 'Birthday cake and cheque' },
  91: { age: 91, amount: 5000, description: 'Birthday cake and cheque' },
  92: { age: 92, amount: 7000, description: 'Birthday cake and cheque' },
  93: { age: 93, amount: 8500, description: 'Birthday cake and cheque' },
  94: { age: 94, amount: 10000, description: 'Birthday incentive for ages 94-99' },
  100: { age: 100, amount: 100000, description: 'Centenarian Award - One-time' },
  'medical': { id: 'medical', name: 'Medical Assistance', description: 'Healthcare support and medical services', active: true },
  'burial': { id: 'burial', name: 'Burial Assistance', description: 'Financial support for funeral services', active: true },
  'pension': { id: 'pension', name: 'Localized Social Pension Program', description: 'Limited slots (165 total, 1 per barangay yearly)', active: true }
};

// Initialize age benefits
async function initAgeBenefits() {
  // Try Supabase first
  if (window.db) {
    try {
      const raw = await window.db.getAgeBenefits();
      if (raw && Object.keys(raw).length > 0) {
        ageBenefits = raw;  // getAgeBenefits() already returns the keyed object format
        localStorage.setItem(AGE_BENEFITS_STORAGE_KEY, JSON.stringify(ageBenefits));
        return;
      }
    } catch (e) {
      console.warn('[ageBenefits] Supabase load failed, using localStorage/defaults', e);
    }
  }

  // Fallback: localStorage
  const stored = localStorage.getItem(AGE_BENEFITS_STORAGE_KEY);
  if (stored) {
    ageBenefits = JSON.parse(stored);
  } else {
    ageBenefits = { ...DEFAULT_AGE_BENEFITS };
    saveAgeBenefits();
  }
}

// Save age benefits to localStorage + Supabase
function saveAgeBenefits() {
  localStorage.setItem(AGE_BENEFITS_STORAGE_KEY, JSON.stringify(ageBenefits));
  if (window.db) {
    Object.keys(ageBenefits).forEach(key => {
      window.db.upsertAgeBenefit(key, ageBenefits[key]).catch(e => console.error('[ageBenefits upsert]', e));
    });
  }
}

// Get all numeric (age) keys sorted
function getNumericAgeKeys() {
  return Object.keys(ageBenefits)
    .map(k => parseInt(k))
    .filter(k => !isNaN(k))
    .sort((a, b) => a - b);
}

// Get birthday incentive ages (60-99)
function getBirthdayAges() {
  return getNumericAgeKeys().filter(k => k < 100);
}

// Render birthday incentive cards dynamically (ages < 100)
function renderBirthdayIncentiveCards() {
  const container = document.getElementById('birthdayIncentiveCards');
  if (!container) return;

  const ages = getBirthdayAges();
  if (ages.length === 0) {
    container.innerHTML = '<p style="color:var(--text-light);font-size:14px;padding:16px 0">No birthday incentive tiers yet. Click "Add Age Tier" to create one.</p>';
    return;
  }

  container.innerHTML = ages.map(age => {
    const b = ageBenefits[age];
    return `
      <div style="padding:12px;background:#fef3c7;border:1px solid #fcd34d;border-left:4px solid #f59e0b;border-radius:8px;cursor:pointer;transition:border-color 0.2s"
           onclick="editAgeBenefit(${age})"
           onmouseover="this.style.borderColor='#f59e0b'"
           onmouseout="this.style.borderColor='#fcd34d'">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:13px;color:#92400e;font-weight:700;text-transform:uppercase">Age ${age}</div>
          <button onclick="event.stopPropagation();deleteAgeTier(${age})"
                  style="width:22px;height:22px;background:transparent;border:none;cursor:pointer;color:#b45309;display:flex;align-items:center;justify-content:center;border-radius:4px;padding:0"
                  title="Delete age tier">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style="font-size:24px;font-weight:800;color:#b45309" id="amount-${age}">₱${b.amount.toLocaleString()}</div>
        <div style="font-size:12px;color:#d97706;margin-top:3px">${b.description}</div>
        <button style="margin-top:8px;padding:4px 10px;background:rgba(245,158,11,0.2);border:none;border-radius:4px;color:#b45309;font-size:11px;font-weight:600;cursor:pointer">Edit</button>
      </div>
    `;
  }).join('');
}

// Render centenarian card dynamically (age 100)
function renderCentenarianCard() {
  const container = document.getElementById('centenarianCard');
  if (!container) return;

  const b = ageBenefits[100];
  if (!b) {
    container.innerHTML = '<p style="color:var(--text-light);font-size:14px">No centenarian award configured.</p>';
    return;
  }

  container.innerHTML = `
    <div style="background:#fff7ed;padding:20px;border-radius:8px;border:1px solid #fed7aa;cursor:pointer;transition:border-color 0.2s"
         onclick="editAgeBenefit(100)"
         onmouseover="this.style.borderColor='#f97316'"
         onmouseout="this.style.borderColor='#fed7aa'">
      <div style="display:flex;align-items:center;gap:20px">
        <div style="font-size:56px;width:80px;text-align:center">🎉</div>
        <div style="flex:1">
          <h4 style="margin:0;font-size:20px;font-weight:800;color:#92400e">Centenarian Achievement Award</h4>
          <p style="margin:8px 0 0;color:#b45309;font-size:18px;font-weight:700">One-time award of <span style="font-size:28px;font-weight:900" id="amount-100">₱${b.amount.toLocaleString()}</span></p>
          <p style="margin:6px 0 0;color:#d97706;font-size:14px">${b.description}</p>
          <button style="margin-top:12px;padding:6px 14px;background:#f97316;border:none;border-radius:6px;color:#fff;font-size:12px;font-weight:700;cursor:pointer">Edit</button>
        </div>
      </div>
    </div>
  `;
}

// Render all dynamic age sections
function renderAgeBenefitSections() {
  renderBirthdayIncentiveCards();
  renderCentenarianCard();
}

// Update display of age benefit amounts (legacy support)
function updateAgeBenefitsDisplay() {
  getNumericAgeKeys().forEach(age => {
    const el = document.getElementById(`amount-${age}`);
    if (el && ageBenefits[age]) {
      el.textContent = `₱${ageBenefits[age].amount.toLocaleString()}`;
    }
  });
  renderAgeBenefitSections();
}

// Delete an age tier
function deleteAgeTier(age) {
  if (!confirm(`Remove the Age ${age} benefit tier? This cannot be undone.`)) return;
  delete ageBenefits[age];
  saveAgeBenefits();
  if (window.db) window.db.deleteAgeBenefit(String(age)).catch(e => console.error('[ageBenefits deleteAgeBenefit]', e));
  renderAgeBenefitSections();
  if (window.renderBenefitsList) renderBenefitsList();
  if (window.showSuccessToast) showSuccessToast(`Age ${age} tier removed`);
}

// Prepare form to add a brand-new age tier
function addNewAgeTier() {
  editingAgeBenefit = null;
  const nameInput = document.getElementById('benefitName');
  const descInput = document.getElementById('benefitDescription');
  const amountInput = document.getElementById('benefitAmount');
  const freqSelect = document.getElementById('benefitFrequency');
  const ageInput = document.getElementById('benefitAge');

  if (nameInput) nameInput.value = '';
  if (descInput) descInput.value = 'Birthday cake and cheque';
  if (amountInput) amountInput.value = '';
  if (freqSelect) freqSelect.value = 'Annually';
  if (ageInput) ageInput.value = '';

  const addBtn = document.getElementById('addBenefit');
  if (addBtn) addBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    Add Age Tier
  `;

  if (ageInput) {
    ageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ageInput.focus();
  }
  if (window.showSuccessToast) showSuccessToast('Fill in the Age field and benefit details to add a new age tier');
}

// Get age-based benefits for the Active Programs list (dynamic)
function getAgeBasedBenefitsForList() {
  const baseBenefits = [
    {
      id: 'medical',
      name: ageBenefits.medical?.name || 'Medical Assistance',
      description: ageBenefits.medical?.description || 'Healthcare support and medical services',
      amount: ageBenefits.medical?.amount || 0,
      frequency: 'As needed',
      active: true,
      isAgeBase: true,
      ageGroup: 'Base (60+)',
      dateCreated: '2025-01-01'
    },
    {
      id: 'burial',
      name: ageBenefits.burial?.name || 'Burial Assistance',
      description: ageBenefits.burial?.description || 'Financial support for funeral services',
      amount: ageBenefits.burial?.amount || 0,
      frequency: 'As needed',
      active: true,
      isAgeBase: true,
      ageGroup: 'Base (60+)',
      dateCreated: '2025-01-01'
    },
    {
      id: 'pension',
      name: ageBenefits.pension?.name || 'Localized Social Pension Program',
      description: ageBenefits.pension?.description || 'Limited slots, 1 per barangay yearly',
      amount: ageBenefits.pension?.amount || 0,
      frequency: 'Yearly',
      active: true,
      isAgeBase: true,
      ageGroup: 'Base (60+)',
      dateCreated: '2025-01-01'
    }
  ];

  // Dynamically add all numeric age entries
  getNumericAgeKeys().forEach(age => {
    const b = ageBenefits[age];
    if (!b) return;
    baseBenefits.push({
      id: age === 100 ? 'centenarian' : `birthday-${age}`,
      name: age === 100 ? 'Centenarian Award' : `Birthday Incentive - Age ${age}`,
      description: b.description,
      amount: b.amount,
      frequency: age === 100 ? 'One-time' : 'Annually',
      active: true,
      isAgeBase: true,
      ageGroup: age === 100 ? '100+ years' : `${age} years`,
      dateCreated: '2025-01-01'
    });
  });

  return baseBenefits;
}

// Edit age benefit (for any numeric age)
function editAgeBenefit(age) {
  const benefit = ageBenefits[age];
  if (!benefit) return;

  editingAgeBenefit = age;

  const nameInput = document.getElementById('benefitName');
  const descInput = document.getElementById('benefitDescription');
  const amountInput = document.getElementById('benefitAmount');
  const freqSelect = document.getElementById('benefitFrequency');
  const ageInput = document.getElementById('benefitAge');

  if (ageInput) ageInput.value = age;
  if (age === 100) {
    if (nameInput) nameInput.value = 'Centenarian Award';
    if (freqSelect) freqSelect.value = 'One-time';
  } else {
    if (nameInput) nameInput.value = `Birthday Incentive Program - Age ${age}`;
    if (freqSelect) freqSelect.value = 'Annually';
  }
  if (descInput) descInput.value = benefit.description;
  if (amountInput) amountInput.value = benefit.amount;

  const addBtn = document.getElementById('addBenefit');
  if (addBtn) addBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
    Update Age Benefit
  `;

  if (nameInput) {
    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameInput.focus();
  }
  if (window.showSuccessToast) showSuccessToast(`Editing Age ${age} Benefit — you can change the age too`);
}

// Edit base benefit (Medical, Burial, Pension)
function editBaseBenefit(benefitId) {
  const benefit = ageBenefits[benefitId];
  if (!benefit) return;

  editingAgeBenefit = benefitId;

  const nameInput = document.getElementById('benefitName');
  const descInput = document.getElementById('benefitDescription');
  const amountInput = document.getElementById('benefitAmount');
  const freqSelect = document.getElementById('benefitFrequency');
  const ageInput = document.getElementById('benefitAge');

  if (nameInput) nameInput.value = benefit.name;
  if (descInput) descInput.value = benefit.description;
  if (amountInput) amountInput.value = benefit.amount || '';
  if (freqSelect) freqSelect.value = 'Annually';
  if (ageInput) ageInput.value = ''; // base benefits don't have an age

  const addBtn = document.getElementById('addBenefit');
  if (addBtn) addBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
    Update Benefit
  `;

  if (nameInput) {
    nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameInput.focus();
  }
  if (window.showSuccessToast) showSuccessToast(`Editing ${benefit.name}`);
}

// Hook into benefits-management.js's addBenefit function
const originalAddBenefit = window.addBenefit;
window.addBenefit = function() {
  const ageInput = document.getElementById('benefitAge');
  const ageVal = ageInput ? parseInt(ageInput.value) : NaN;
  const hasAge = !isNaN(ageVal) && ageVal > 0;

  if (editingAgeBenefit !== null || hasAge) {
    const name = document.getElementById('benefitName').value.trim();
    const description = document.getElementById('benefitDescription').value.trim();
    const amount = parseFloat(document.getElementById('benefitAmount').value);

    if (!name || !description || isNaN(amount) || amount <= 0) {
      if (window.showErrorToast) showErrorToast('Please fill in Name, Description, and a valid Amount');
      return;
    }

    if (typeof editingAgeBenefit === 'string') {
      // Base benefit update (medical, burial, pension) — no age change allowed
      ageBenefits[editingAgeBenefit] = {
        ...ageBenefits[editingAgeBenefit],
        name,
        description,
        amount: amount || undefined
      };
    } else if (editingAgeBenefit !== null) {
      // Age benefit update — handle optional age change
      const oldAge = editingAgeBenefit;
      const newAge = hasAge ? ageVal : oldAge;

      if (newAge !== oldAge) {
        // Age key changed — remove old, add under new key
        delete ageBenefits[oldAge];
      }

      ageBenefits[newAge] = {
        age: newAge,
        amount,
        description
      };
    } else if (hasAge) {
      // New age tier creation
      if (ageBenefits[ageVal]) {
        if (!confirm(`Age ${ageVal} already exists. Overwrite it?`)) return;
      }
      ageBenefits[ageVal] = { age: ageVal, amount, description };
    }

    saveAgeBenefits();
    renderAgeBenefitSections();

    editingAgeBenefit = null;
    const addBtn = document.getElementById('addBenefit');
    if (addBtn) addBtn.innerHTML = 'Add Benefit';

    if (window.clearBenefitForm) clearBenefitForm();
    if (window.showSuccessToast) showSuccessToast('Age benefit saved successfully');
    if (window.renderBenefitsList) renderBenefitsList();
  } else {
    // Call original addBenefit for custom benefits (no age set)
    if (originalAddBenefit) originalAddBenefit.call(this);
  }
};

// Hook into renderBenefitsList to add age benefits to the list
const originalRenderBenefitsList = window.renderBenefitsList;
window.renderBenefitsList = function() {
  const container = document.getElementById('benefitsList');
  if (!container) return;

  const customBenefits = window.benefits || [];
  const allBenefits = [...getAgeBasedBenefitsForList(), ...customBenefits];

  if (allBenefits.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-light)">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;opacity:0.3;display:block">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <p style="margin:0;font-size:16px;font-weight:600">No benefits added yet</p>
      </div>
    `;
    renderPagination(document.getElementById('benefitsPagination'), 1, 1, 'goToBenefitsPage');
    return;
  }

  container.innerHTML = '';
  const bp = window.BENEFITS_PAGE_SIZE || 5;
  const totalPages = Math.max(1, Math.ceil(allBenefits.length / bp));
  window.benefitsPage = Math.min(Math.max(1, window.benefitsPage || 1), totalPages);
  const start = (window.benefitsPage - 1) * bp;
  const pageItems = allBenefits.slice(start, start + bp);

  pageItems.forEach((benefit) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding:16px;background:#fff;border:1px solid var(--border);transition:all 0.2s';

    const statusColor = benefit.active ? '#10b981' : '#9ca3af';
    const statusText = benefit.active ? 'Active' : 'Inactive';
    const badge = benefit.isAgeBase
      ? `<span style="display:inline-block;margin-left:8px;padding:2px 8px;background:#f0fdf4;color:#16a34a;border-radius:12px;font-size:10px;font-weight:600;text-transform:uppercase">Age-Based</span>` : '';

    let editHandler = '';
    let deleteBtn = '';

    if (benefit.isAgeBase) {
      if (benefit.id.startsWith('birthday')) {
        const ageMatch = benefit.id.match(/\d+/);
        const age = ageMatch ? parseInt(ageMatch[0]) : 90;
        editHandler = `onclick="editAgeBenefit(${age})"`;
      } else if (benefit.id === 'centenarian') {
        editHandler = `onclick="editAgeBenefit(100)"`;
      } else {
        editHandler = `onclick="editBaseBenefit('${benefit.id}')"`;
      }
    } else {
      const customIndex = customBenefits.findIndex(b => b.id === benefit.id);
      if (customIndex >= 0) {
        editHandler = `onclick="editBenefit(${customIndex})"`;
        deleteBtn = `<button class="btn ghost" style="padding:6px 12px;font-size:13px;color:#ef4444" onclick="deleteBenefit(${customIndex})" title="Delete benefit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>`;
      }
    }

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <h4 style="margin:0;font-size:15px;font-weight:700;color:var(--text)">${benefit.name}</h4>
            <span style="padding:2px 8px;background:${benefit.active ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)'};color:${statusColor};border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${statusText}</span>
            ${badge}
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <p class="small" style="margin:0;font-weight:600;color:var(--primary)">₱${(benefit.amount || 0).toLocaleString()}</p>
            <span style="color:var(--text-light);font-size:13px">•</span>
            <p class="small" style="margin:0;color:var(--text-light)">${benefit.frequency}</p>
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn ghost" style="padding:6px 12px;font-size:13px" ${editHandler} title="Edit benefit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          ${deleteBtn}
        </div>
      </div>
      <p class="small" style="margin:0;color:var(--text-light);line-height:1.5">${benefit.description}</p>
    `;

    container.appendChild(card);
  });

  renderPagination(document.getElementById('benefitsPagination'), window.benefitsPage, totalPages, 'goToBenefitsPage');

  // Update benefits count badge
  const countEl = document.querySelector('#benefitsTab .badge');
  if (countEl) {
    const activeCount = allBenefits.filter(b => b.active).length;
    countEl.textContent = `${activeCount} Program${activeCount !== 1 ? 's' : ''}`;
  }
};

function goToBenefitsPage(p) {
  const customBenefits = window.benefits || [];
  const allBenefits = [...getAgeBasedBenefitsForList(), ...customBenefits];
  const bp = window.BENEFITS_PAGE_SIZE || 5;
  const totalPages = Math.max(1, Math.ceil(allBenefits.length / bp));
  if (p < 1 || p > totalPages) return;
  window.benefitsPage = p;
  if (window.renderBenefitsList) renderBenefitsList();
}
// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
  await initAgeBenefits();
  renderAgeBenefitSections();
});