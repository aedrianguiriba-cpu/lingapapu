// LingapApu v2 - Transaction QR system
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('loginBtn')) initLogin();
  if(document.getElementById('seniorTable')) initAdmin();
  if(document.getElementById('bookletContent')) initSenior();
  // highlight nav and wire up mobile toggle
  highlightActiveNav();
  setupNavToggle();
  
  // Set up transaction modal if it exists
  if(document.getElementById('transactionModal')) {
    // Wait for form elements to be ready
    setTimeout(() => {
      setupTransactionModal();
      modalDebug('Modal setup complete - delayed initialization');
    }, 0);
  }
});

// Setup tabs
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  const navLinks = document.querySelectorAll('.navlink[data-tab]');
  
  function switchTab(target) {
    // Update tab buttons if they exist
    tabs.forEach(t => t.classList.remove('active'));
    tabs.forEach(t => { if(t.dataset.tab === target) t.classList.add('active'); });
    
    // Update nav links if they exist
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => { if(l.dataset.tab === target) l.classList.add('active'); });
    
    // Update panels
    panels.forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById(target + 'Tab');
    if(targetPanel) targetPanel.classList.add('active');
    
    // Refresh analytics when switching to dashboard tab
    if(target === 'dashboard') {
      populateReports();
    }
    
    // Load registrations when switching to registrations tab
    if(target === 'registrations' && typeof loadPendingRegistrations === 'function') {
      loadPendingRegistrations();
    }
  }
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });
  
  // Initial tab state from URL hash or default
  const hash = window.location.hash.replace('#', '');
  
  // Determine default tab based on page
  const isMerchantPage = window.location.pathname.includes('merchant.html');
  const isOSCAPage = window.location.pathname.includes('osca.html');
  const merchantTabs = ['scanner', 'history', 'profile'];
  const oscaTabs = ['verify', 'update', 'transactions', 'eligibility', 'profile'];
  const adminTabs = ['dashboard', 'seniors', 'registrations', 'benefits', 'staff', 'profile'];
  
  if(isMerchantPage) {
    // Merchant portal - default to scanner
    if(hash && merchantTabs.includes(hash)) {
      switchTab(hash);
    } else {
      switchTab('scanner');
    }
  } else if(isOSCAPage) {
    // OSCA portal - default to verify
    if(hash && oscaTabs.includes(hash)) {
      switchTab(hash);
    } else {
      switchTab('verify');
    }
  } else {
    // Admin portal - default to dashboard
    if(hash && adminTabs.includes(hash)) {
      switchTab(hash);
    } else {
      switchTab('dashboard');
    }
  }
}

function highlightActiveNav(){
  const current = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.navlink').forEach(a=>{
    const href = (a.getAttribute('href')||'').split('/').pop().toLowerCase();
    if(href === current) a.classList.add('active'); else a.classList.remove('active');
  });
}

// Transaction modal handling
function setupTransactionModal() {
  try {
    const modal = document.getElementById('transactionModal');
    if (!modal) {
      console.warn('setupTransactionModal: #transactionModal not found');
      return;
    }
    const overlay = modal.querySelector('.modal-overlay');
    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('[data-action="cancel"]');
    const form = document.getElementById('transactionForm');
    const typeEl = document.getElementById('transactionType');
    const typeErr = document.getElementById('transactionTypeError');
    const saveBtn = document.getElementById('saveTransaction') || modal.querySelector('button[type="submit"][form="transactionForm"]');

  console.debug('setupTransactionModal: modal elements', { overlay: !!overlay, closeBtn: !!closeBtn, cancelBtn: !!cancelBtn, form: !!form });
  modalDebug('setupTransactionModal: elements - overlay:' + !!overlay + ' closeBtn:' + !!closeBtn + ' cancelBtn:' + !!cancelBtn + ' form:' + !!form);

    // Close handlers (robust: check existence)
  if (overlay) {
    overlay.addEventListener('click', () => {
      modalDebug('overlay click -> close');
      closeModal();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modalDebug('close button click -> close');
      closeModal();
    });
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      modalDebug('cancel button click -> close');
      closeModal();
    });
  }

      // Clear inline error when user changes type
      if (typeEl) {
        typeEl.addEventListener('change', () => {
          modalDebug('transactionType change -> ' + typeEl.value);
          if (typeEl.value) {
            if (typeErr) typeErr.textContent = '';
          }
        });
      }

    // Focus management: trap focus inside modal while open and restore focus on close
    let focusableSelectors = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    function getFocusable() {
      return Array.from(modal.querySelectorAll(focusableSelectors)).filter(el => el.offsetParent !== null);
    }

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusable = getFocusable();
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    // When a transaction is saved, close the modal and navigate back to the Scanner tab
    modal.addEventListener('transactionSaved', (ev) => {
      // small delay to allow UI update (optional)
      setTimeout(() => {
        try { closeModal(); } catch (e) { /* ignore */ }

        // Switch to the scanner tab so the user can continue scanning
        const scanBtn = document.querySelector('.tab-btn[data-tab="scan"]');
        if (scanBtn) {
          scanBtn.click();
        }

        // Start or resume the scanner if available
        try {
          if (window.currentScanner) {
            if (typeof window.currentScanner.start === 'function') window.currentScanner.start();
            else if (typeof window.currentScanner.resume === 'function') window.currentScanner.resume();
          }
        } catch (e) { /* ignore scanner start errors */ }
      }, 10);
    });

    // Form submit handler
    if (form) {
      form.addEventListener('submit', (e) => {
      e.preventDefault();
      modalDebug('form submit triggered');
    
    // Validate required fields (inline)
    const type = (typeEl && typeEl.value) || document.getElementById('transactionType').value;
    if (!type) {
      if (typeErr) typeErr.textContent = 'Please select a transaction type';
      if (typeEl) typeEl.focus();
      return;
    }
    
    const seniorId = modal.dataset.seniorId;
    const timestamp = new Date().toISOString();
    
    // Get current merchant info
    const currentUser = JSON.parse(sessionStorage.getItem('lingap_user') || '{}');
    const merchantId = currentUser.username || 'unknown';
    
    // Load senior's profile
    const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const seniorIdx = profiles.findIndex(p => p.id === seniorId);
    
    if (seniorIdx === -1) {
      if (typeErr) typeErr.textContent = 'Senior profile not found';
      document.getElementById('scanLog').textContent = 'Senior profile not found';
      return;
    }
    
    // Create transaction record
    const transaction = {
      id: `TXN-${Date.now()}`, // Unique transaction ID
      timestamp,
      seniorId,
      seniorName: profiles[seniorIdx].name,
      type,
      amount: document.getElementById('transactionAmount').value,
      note: document.getElementById('transactionNote').value || type,
      merchantId: merchantId, // Track which merchant processed this
      scanDate: new Date().toLocaleDateString('en-US') // Track the scan date
    };
    
    // Add to senior's transactions
    if (!profiles[seniorIdx].transactions) {
      profiles[seniorIdx].transactions = [];
    }
    profiles[seniorIdx].transactions.unshift(transaction);
    
    // Save updated profiles
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    
    // Save to transactions store
    const allTransactions = JSON.parse(localStorage.getItem('lingap_transactions') || '[]');
    allTransactions.unshift(transaction);
    localStorage.setItem('lingap_transactions', JSON.stringify(allTransactions));
    
    // Update recent scans display
    const wrap = document.getElementById('recentScans');
    if (wrap) {
      const el = document.createElement('div');
      el.className = 'scan-entry';
      
      const timeStr = new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      el.innerHTML = `
        <div class="flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="#059669" stroke-width="2" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div>
            <div class="font-bold text-green-600">${profiles[seniorIdx].name}</div>
            <div class="text-sm text-gray-500">
              <span class="text-primary font-bold">${type}</span>
              ${transaction.amount ? `<span class="mx-1">·</span>₱${transaction.amount}` : ''}
              ${transaction.note ? `<span class="mx-1">·</span>${transaction.note}` : ''}
              <span class="mx-1">·</span>
              ${timeStr}
            </div>
          </div>
        </div>
      `;
      
      wrap.insertBefore(el, wrap.firstChild);
      while (wrap.children.length > 10) {
        wrap.removeChild(wrap.lastChild);
      }
    }
    
    // Update transactions table if visible
    if (document.getElementById('transactionsTab').classList.contains('active')) {
      refreshTransactionsTable();
    }
    
    // Update scan log
    const log = document.getElementById('scanLog');
    if (log) {
      log.textContent = `Transaction recorded for ${profiles[seniorIdx].name}`;
    }
    
    // Refresh reports if we're on that tab
    if (document.querySelector('.tab-btn[data-tab="reports"].active')) {
      populateReports();
    }
      
      // Notify listeners that a transaction was saved (pass the record)
        modal.dispatchEvent(new CustomEvent('transactionSaved', { detail: transaction }));
        modalDebug('transaction saved: ' + transaction.id + ' for ' + transaction.seniorId);

        // Clear pending flag (daily merchant tracking is automatic via transaction record)
        try {
          if (transaction && transaction.seniorId) {
            pendingTransactions.delete(transaction.seniorId);
            modalDebug('Pending cleared: ' + transaction.seniorId);
          }
        } catch (e) { /* ignore */ }
    });
    } else {
      modalDebug('setupTransactionModal: form element not found', 'error');
    }
  
    // Wire up quick action buttons
    try {
      const quickBtns = modal.querySelectorAll('.quick-actions button[data-note]');
      quickBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const note = e.currentTarget.getAttribute('data-note');
          modalDebug('quick action click -> ' + note);
          const noteEl = document.getElementById('transactionNote');
          if (noteEl) noteEl.value = note;
        });
      });
      modalDebug('Quick action buttons wired: ' + quickBtns.length);
    } catch (err) {
      modalDebug('Error wiring quick actions: ' + err.message, 'error');
    }

  } catch (err) {
    console.error('setupTransactionModal failed', err);
    modalDebug('setupTransactionModal failed: ' + (err && err.message));
  }

  // Escape key to close (guarded: look up modal at runtime)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const m = document.getElementById('transactionModal');
      if (m && m.classList.contains('active')) closeModal();
    }
  });
}

// Simple on-page modal debug helper (visible when present)
function modalDebug(msg, level = 'info') {
  try {
    let box = document.getElementById('modalDebugBox');
    if (!box) {
      box = document.createElement('div');
      box.id = 'modalDebugBox';
      box.style.position = 'fixed';
      box.style.right = '12px';
      box.style.bottom = '12px';
      box.style.maxWidth = '320px';
      box.style.maxHeight = '240px';
      box.style.overflow = 'auto';
      box.style.background = 'rgba(0,0,0,0.75)';
      box.style.color = '#fff';
      box.style.fontSize = '12px';
      box.style.padding = '8px';
      box.style.borderRadius = '8px';
      box.style.zIndex = '2000';
      box.style.display = 'none';
      document.body.appendChild(box);
      // Click to toggle visibility
      box.addEventListener('click', () => { box.style.display = box.style.display === 'none' ? 'block' : 'none'; });
    }
    // Always show when debug messages are produced
    box.style.display = 'block';
    const entry = document.createElement('div');
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${msg}`;
    entry.style.marginBottom = '6px';
    if (level === 'error') entry.style.color = '#ffb4b4';
    box.appendChild(entry);
    // keep last 40 lines
    while (box.children.length > 40) box.removeChild(box.firstChild);
  } catch (e) {
    /* ignore */
  }
}

function showTransactionModal(seniorData) {
  const modal = document.getElementById('transactionModal');
  if (!modal) return;
  modalDebug('showTransactionModal: ' + (seniorData && seniorData.id));
  modal.dataset.seniorId = seniorData.id;

  // Save previously focused element to restore later
  try { window._lastModalFocus = document.activeElement; } catch (e) { window._lastModalFocus = null; }
  // Prevent background scroll
  document.body.classList.add('modal-open');

  // Update senior info
  document.getElementById('seniorName').textContent = seniorData.name;
  document.getElementById('seniorId').textContent = `ID: ${seniorData.id}`;

  // Reset form
  document.getElementById('transactionForm').reset();
  // Clear previous inline errors and ensure Save is enabled (we'll validate on submit)
  const saveBtn = document.getElementById('saveTransaction');
  const typeErr = document.getElementById('transactionTypeError');
  if (typeErr) typeErr.textContent = '';
  if (saveBtn) saveBtn.disabled = false;
  
  // Load senior's profile to verify benefits
  const profiles = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const senior = profiles.find(p => p.id === seniorData.id);
  
  if (senior) {
    // Pre-populate transaction type based on benefits
    const typeSelect = document.getElementById('transactionType');
    const benefits = (senior.benefits || '').split(',').map(b => b.trim());
    
    // Filter options based on benefits
    Array.from(typeSelect.options).forEach(opt => {
      if (opt.value && !benefits.some(b => opt.value.includes(b))) {
        opt.disabled = true;
      } else {
        opt.disabled = false;
      }
    });

    // If filtering disabled all options, restore them (so user can still select)
    const available = Array.from(typeSelect.options).filter(o => o.value && !o.disabled);
    if (available.length === 0) {
      // nothing matched — enable all options so the user can choose freely
      Array.from(typeSelect.options).forEach(opt => { opt.disabled = false; });
    } else if (available.length === 1) {
      // If exactly one applicable option, preselect it and enable Save
      typeSelect.value = available[0].value;
      const saveBtn = document.getElementById('saveTransaction');
      if (saveBtn) saveBtn.disabled = false;
    }
  }

  // Update additional display elements in the redesigned modal (if present)
  try {
    const nameCard = document.getElementById('seniorNameCard');
    const idCard = document.getElementById('seniorIdCard');
    const subtitle = document.getElementById('modalSubtitle');
    if (nameCard) nameCard.textContent = seniorData.name;
    if (idCard) idCard.textContent = `ID: ${seniorData.id}`;
    if (subtitle) subtitle.textContent = `${seniorData.name} · ID: ${seniorData.id}`;
  } catch (e) { /* ignore */ }
  
  // Show modal
  modal.classList.add('active');
  modalDebug('modal opened for ' + seniorData.id);
  // Focus first input for accessibility
  const first = document.getElementById('transactionType') || modal.querySelector('input, select, textarea, button');
  if (first && typeof first.focus === 'function') {
    setTimeout(() => first.focus(), 10);
  } else {
    modal.focus();
  }

  // Wire quick action buttons to prefill note (remove previous listeners first)
  try {
    const quicks = modal.querySelectorAll('.quick-actions [data-note]');
    quicks.forEach(btn => {
      btn.removeEventListener('click', handleQuickNote);
      btn.addEventListener('click', handleQuickNote);
    });
  } catch (e) { /* ignore */ }
}

function handleQuickNote(e) {
  const note = e.currentTarget.getAttribute('data-note');
  const noteEl = document.getElementById('transactionNote');
  if (noteEl) noteEl.value = note;
}

function closeModal() {
  const modal = document.getElementById('transactionModal');
  if (!modal) return;
  try {
    modal.classList.remove('active');
  } catch (err) {
    console.error('closeModal error', err);
  }
  
  // Resume scanner if we're on the scan tab
  const scanTab = document.getElementById('scanTab');
  if (scanTab?.classList.contains('active') && window.currentScanner) {
    window.currentScanner.resume();
  }
  
  // Re-enable all transaction type options for next scan
  const typeSelect = document.getElementById('transactionType');
  if (typeSelect && typeSelect.options) {
    Array.from(typeSelect.options).forEach(opt => opt.disabled = false);
  }
  // Restore background scrolling
  document.body.classList.remove('modal-open');
  // Restore previous focus
  try { if (window._lastModalFocus && typeof window._lastModalFocus.focus === 'function') window._lastModalFocus.focus(); } catch (e) { /* ignore */ }
}

// Transaction management
function refreshTransactionsTable(filterType = 'all') {
  const tbody = document.getElementById('transactionsTable');
  if (!tbody) return;
  
  const transactions = JSON.parse(localStorage.getItem('lingap_transactions') || '[]');
  tbody.innerHTML = '';
  
  transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .forEach(t => {
      const tr = document.createElement('tr');
      const dateStr = new Date(t.timestamp).toLocaleString();
      
      tr.innerHTML = `
        <td>${dateStr}</td>
        <td>${t.seniorId}</td>
        <td>${t.seniorName}</td>
        <td><span class="badge ${t.type.toLowerCase()}">${t.type}</span></td>
        <td>${t.amount ? `₱${t.amount}` : '-'}</td>
        <td>${t.note || '-'}</td>
        <td>
          <button class="btn ghost small" onclick="deleteTransaction('${t.id}')" title="Delete transaction">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </td>
      `;
      
      tbody.appendChild(tr);
    });
}

function deleteTransaction(txnId) {
  // Handled by registration-modals.js
  openDeleteTransactionModal(txnId);
}

function exportTransactionsCSV() {
  const transactions = JSON.parse(localStorage.getItem('lingap_transactions') || '[]');
  if (!transactions.length) {
    showErrorToast('No transactions to export');
    return;
  }
  
  const csvRows = [
    ['Date', 'Time', 'Transaction ID', 'Senior ID', 'Senior Name', 'Type', 'Amount', 'Notes']
  ];
  
  transactions.forEach(t => {
    const date = new Date(t.timestamp);
    csvRows.push([
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      t.id,
      t.seniorId,
      t.seniorName,
      t.type,
      t.amount || '',
      t.note || ''
    ]);
  });
  
  const csvContent = csvRows.map(row => row.map(cell => 
    typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
  ).join(',')).join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function setupNavToggle(){
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  const overlay = document.getElementById('navOverlay');
  if(!toggle || !nav) return;
  
  // Function to close nav
  const closeNav = () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    if(overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };
  
  // Function to open nav
  const openNav = () => {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    if(overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  
  // Toggle button click
  toggle.addEventListener('click', ()=>{
    const isOpen = nav.classList.contains('open');
    if(isOpen) closeNav(); else openNav();
  });
  
  // Overlay click to close
  if(overlay) {
    overlay.addEventListener('click', closeNav);
  }
  
  // Close when a link is clicked (mobile)
  nav.querySelectorAll('.navlink').forEach(a=> a.addEventListener('click', closeNav));
  
  // Close on escape
  document.addEventListener('keydown', (e)=>{ 
    if(e.key === 'Escape' && nav.classList.contains('open')) closeNav();
  });
}

const DEMO_USERS = [
  {role:'admin', username:'admin', password:'1234'},
  {role:'osca', username:'osca', password:'1234'},
  {role:'osca', username:'maria', password:'1234'},
  {role:'merchant', username:'merchant', password:'1234'},
  {role:'merchant', username:'store1', password:'1234'},
  {role:'merchant', username:'pharmacy', password:'1234'},
  {role:'senior', username:'sofia', password:'1234', id:'LGAPU-021'},
  {role:'senior', username:'miguel', password:'1234', id:'LGAPU-022'},
  {role:'senior', username:'rosa', password:'1234', id:'LGAPU-004'},
  {role:'senior', username:'manuel', password:'1234', id:'LGAPU-005'},
  {role:'senior', username:'elena', password:'1234', id:'LGAPU-006'}
];
const STORAGE_KEY = 'lingap_profiles_v3';
const TRANSACTIONS_KEY = 'lingap_transactions';
let profiles = [];

// seed with 15 seniors and recent transactions
function seedProfiles(){
  const now = new Date();
  profiles = [
    {"id":"LGAPU-021","name":"Sofia Delgado","birth":"1958-08-20","age":67,"gender":"Female","contact":"09171234567","address":"Brgy. San Nicolas, Floridablanca","username":"sofia","password":"1234","benefits":["Monthly Pension","Medical Subsidy","Grocery Voucher","20% Senior Discount"],"notes":"Hypertension, Diabetes","registrationDate":"2021-08-15T08:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*2).toISOString(),"note":"Monthly checkup"},
      {"timestamp":new Date(now - 1000*60*60*24*15).toISOString(),"note":"Flu vaccine"}
    ]},
    {"id":"LGAPU-002","name":"Maria Santos","birth":"1960-07-22","age":65,"gender":"Female","contact":"09187654321","address":"Brgy. Dela Paz Norte, Floridablanca","username":"maria","password":"1234","benefits":["Medical Subsidy","Transport Allowance","20% Senior Discount"],"notes":"Diabetes","registrationDate":"2020-02-20T09:30:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24).toISOString(),"note":"Blood sugar check"},
      {"timestamp":new Date(now - 1000*60*60*24*10).toISOString(),"note":"Transportation allowance"}
    ]},
    {"id":"LGAPU-022","name":"Miguel Fernandez","birth":"1952-05-14","age":73,"gender":"Male","contact":"09234567890","address":"Brgy. Santa Rita, Floridablanca","username":"miguel","password":"1234","benefits":["Monthly Pension","Transport Allowance","20% Senior Discount"],"notes":"Mild arthritis","registrationDate":"2021-09-10T10:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*5).toISOString(),"note":"Pension collection"}
    ]},
    {"id":"LGAPU-004","name":"Rosa Garcia","birth":"1965-04-18","age":60,"gender":"Female","contact":"09345678901","address":"Brgy. San Jose, Floridablanca","username":"rosa","password":"1234","benefits":["Medical Subsidy","20% Senior Discount"],"notes":"Arthritis","registrationDate":"2020-04-05T11:15:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*3).toISOString(),"note":"Physical therapy"}
    ]},
    {"id":"LGAPU-005","name":"Manuel Cruz","birth":"1945-09-25","age":80,"gender":"Male","contact":"09456789012","address":"Brgy. Mabical, Floridablanca","username":"manuel","password":"1234","benefits":["Monthly Pension","Medical Subsidy","Transport Allowance","20% Senior Discount"],"notes":"","registrationDate":"2019-12-01T08:30:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60).toISOString(),"note":"Monthly benefits claim"}
    ]},
    {"id":"LGAPU-006","name":"Elena Ramos","birth":"1958-12-03","age":67,"gender":"Female","contact":"09567890123","address":"Brgy. Cabetican, Floridablanca","username":"elena","password":"1234","benefits":["Medical Subsidy","20% Senior Discount"],"notes":"Regular checkup","registrationDate":"2020-05-18T09:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*7).toISOString(),"note":"Blood pressure monitoring"}
    ]},
    {"id":"LGAPU-007","name":"Francisco Tan","birth":"1953-06-11","age":72,"gender":"Male","contact":"09678901234","address":"Brgy. Valdez, Floridablanca","username":"francisco","password":"1234","benefits":["Monthly Pension","20% Senior Discount"],"notes":"","registrationDate":"2020-06-22T10:30:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*4).toISOString(),"note":"Document renewal"}
    ]},
    {"id":"LGAPU-008","name":"Carmen Lopez","birth":"1963-01-28","age":62,"gender":"Female","contact":"09789012345","address":"Brgy. San Isidro, Floridablanca","username":"carmen","password":"1234","benefits":["Transport Allowance","20% Senior Discount"],"notes":"","registrationDate":"2020-07-30T11:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*6).toISOString(),"note":"Transport card renewal"}
    ]},
    {"id":"LGAPU-009","name":"Antonio Lim","birth":"1948-08-07","age":77,"gender":"Male","contact":"09890123456","address":"Brgy. Poblacion, Floridablanca","username":"antonio","password":"1234","benefits":["Monthly Pension","Medical Subsidy","20% Senior Discount"],"notes":"Heart condition","registrationDate":"2019-11-12T08:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date().toISOString(),"note":"Emergency consultation"}
    ]},
    {"id":"LGAPU-010","name":"Isabella Santos","birth":"1957-05-19","age":68,"gender":"Female","contact":"09901234567","address":"Brgy. San Pedro, Floridablanca","username":"isabella","password":"1234","benefits":["Medical Subsidy","Transport Allowance","20% Senior Discount"],"notes":"","registrationDate":"2020-08-14T09:30:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*30).toISOString(),"note":"Medical certificate request"}
    ]},
    {"id":"LGAPU-011","name":"Roberto Mendoza","birth":"1952-08-14","age":73,"gender":"Male","contact":"09912345678","address":"Brgy. Lubao, Floridablanca","username":"roberto","password":"1234","benefits":["Monthly Pension","Medical Subsidy","20% Senior Discount"],"notes":"","registrationDate":"2020-09-20T10:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*8).toISOString(),"note":"Dental checkup"}
    ]},
    {"id":"LGAPU-012","name":"Luisa Villanueva","birth":"1961-03-27","age":64,"gender":"Female","contact":"09923456789","address":"Brgy. Apalit, Floridablanca","username":"luisa","password":"1234","benefits":["Medical Subsidy","20% Senior Discount"],"notes":"Osteoporosis","registrationDate":"2020-10-05T11:15:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*12).toISOString(),"note":"Bone density scan"}
    ]},
    {"id":"LGAPU-013","name":"Felipe Torres","birth":"1949-12-05","age":76,"gender":"Male","contact":"09934567890","address":"Brgy. Minalin, Floridablanca","username":"felipe","password":"1234","benefits":["Monthly Pension","Transport Allowance","20% Senior Discount"],"notes":"","registrationDate":"2020-11-18T08:30:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*9).toISOString(),"note":"Benefits orientation"}
    ]},
    {"id":"LGAPU-014","name":"Victoria Flores","birth":"1956-10-31","age":69,"gender":"Female","contact":"09945678901","address":"Brgy. Macabebe, Floridablanca","username":"victoria","password":"1234","benefits":["Medical Subsidy","20% Senior Discount"],"notes":"Regular monitoring","registrationDate":"2021-01-10T09:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*11).toISOString(),"note":"Vaccination"}
    ]},
    {"id":"LGAPU-015","name":"Ricardo Bautista","birth":"1954-02-23","age":71,"gender":"Male","contact":"09956789012","address":"Brgy. San Miguel, Floridablanca","username":"ricardo","password":"1234","benefits":["Monthly Pension","Medical Subsidy","20% Senior Discount"],"notes":"","registrationDate":"2021-02-14T10:30:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*14).toISOString(),"note":"General consultation"}
    ]},
    {"id":"LGAPU-016","name":"Josefina Aquino","birth":"1959-06-12","age":66,"gender":"Female","contact":"09961234567","address":"Brgy. Santo Niño, Floridablanca","username":"josefina","password":"1234","benefits":["Medical Subsidy","Grocery Voucher","20% Senior Discount"],"notes":"High cholesterol","registrationDate":"2021-03-20T09:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*20).toISOString(),"note":"Health screening"}
    ]},
    {"id":"LGAPU-017","name":"Emilio Fernandez","birth":"1947-11-08","age":78,"gender":"Male","contact":"09972345678","address":"Brgy. San Antonio, Floridablanca","username":"emilio","password":"1234","benefits":["Monthly Pension","Medical Subsidy","Transport Allowance","20% Senior Discount"],"notes":"Stroke survivor, wheelchair user","registrationDate":"2019-08-15T10:30:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*1).toISOString(),"note":"Home visit checkup"}
    ]},
    {"id":"LGAPU-018","name":"Gloria Valdez","birth":"1962-03-29","age":63,"gender":"Female","contact":"09983456789","address":"Brgy. Santa Monica, Floridablanca","username":"gloria","password":"1234","benefits":["Transport Allowance","Grocery Voucher","20% Senior Discount"],"notes":"","registrationDate":"2021-05-10T11:00:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*16).toISOString(),"note":"Grocery voucher claim"}
    ]},
    {"id":"LGAPU-019","name":"Bernardo Castillo","birth":"1951-09-14","age":74,"gender":"Male","contact":"09994567890","address":"Brgy. Del Carmen, Floridablanca","username":"bernardo","password":"1234","benefits":["Monthly Pension","Birthday Gift","20% Senior Discount"],"notes":"","registrationDate":"2020-12-05T08:45:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*25).toISOString(),"note":"Birthday cash gift received"}
    ]},
    {"id":"LGAPU-020","name":"Luz Mercado","birth":"1964-01-07","age":61,"gender":"Female","contact":"09915678901","address":"Brgy. San Rafael, Floridablanca","username":"luz","password":"1234","benefits":["Medical Subsidy","20% Senior Discount"],"notes":"Asthma, allergies","registrationDate":"2021-06-18T09:15:00.000Z","status":"active","transactions":[
      {"timestamp":new Date(now - 1000*60*60*24*8).toISOString(),"note":"Nebulizer treatment"}
    ]}
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  
  // Also seed transactions and benefits
  seedTransactions();
  seedBenefits();
}

function seedTransactions() {
  const now = new Date();
  const transactions = [
    {"seniorId":"LGAPU-021","timestamp":new Date(now - 1000*60*60*24*2).toISOString(),"type":"Medical Checkup","note":"Monthly health checkup at OSCA clinic","amount":"₱200","status":"Completed"},
    {"seniorId":"LGAPU-021","timestamp":new Date(now - 1000*60*60*24*15).toISOString(),"type":"Vaccination","note":"Seasonal flu vaccine administered","amount":"Free","status":"Completed"},
    {"seniorId":"LGAPU-021","timestamp":new Date(now - 1000*60*60*24*30).toISOString(),"type":"Monthly Pension","note":"Cash assistance received","amount":"₱1,500","status":"Completed"},
    {"seniorId":"LGAPU-021","timestamp":new Date(now - 1000*60*60*24*45).toISOString(),"type":"Grocery Voucher","note":"Grocery assistance claim","amount":"₱2,000","status":"Completed"},
    {"seniorId":"LGAPU-021","timestamp":new Date(now - 1000*60*60*24*60).toISOString(),"type":"Medical Subsidy","note":"Quarterly medical assistance","amount":"₱5,000","status":"Completed"},
    {"seniorId":"LGAPU-002","timestamp":new Date(now - 1000*60*60*24).toISOString(),"type":"Medical Checkup","note":"Blood sugar monitoring","amount":"₱150","status":"Completed"},
    {"seniorId":"LGAPU-002","timestamp":new Date(now - 1000*60*60*24*10).toISOString(),"type":"Transport Allowance","note":"Monthly transportation support","amount":"₱500","status":"Completed"},
    {"seniorId":"LGAPU-022","timestamp":new Date(now - 1000*60*60*24*5).toISOString(),"type":"Monthly Pension","note":"Monthly pension claim","amount":"₱1,500","status":"Completed"},
    {"seniorId":"LGAPU-022","timestamp":new Date(now - 1000*60*60*24*35).toISOString(),"type":"Birthday Gift","note":"Senior citizen birthday assistance","amount":"₱1,000","status":"Completed"},
    {"seniorId":"LGAPU-022","timestamp":new Date(now - 1000*60*60*24*70).toISOString(),"type":"Medical Subsidy","note":"Healthcare financial assistance","amount":"₱5,000","status":"Completed"},
    {"seniorId":"LGAPU-004","timestamp":new Date(now - 1000*60*60*24*3).toISOString(),"type":"Medical Service","note":"Physical therapy session","amount":"₱300","status":"Completed"},
    {"seniorId":"LGAPU-005","timestamp":new Date(now - 1000*60*60).toISOString(),"type":"Benefits Claim","note":"Multiple benefits processed","amount":"₱7,000","status":"Completed"},
    {"seniorId":"LGAPU-006","timestamp":new Date(now - 1000*60*60*24*7).toISOString(),"type":"Medical Checkup","note":"Blood pressure monitoring","amount":"₱100","status":"Completed"},
    {"seniorId":"LGAPU-007","timestamp":new Date(now - 1000*60*60*24*4).toISOString(),"type":"Document Service","note":"ID card renewal","amount":"Free","status":"Completed"},
    {"seniorId":"LGAPU-008","timestamp":new Date(now - 1000*60*60*24*6).toISOString(),"type":"Transport Allowance","note":"Public transport card reload","amount":"₱500","status":"Completed"},
    {"seniorId":"LGAPU-009","timestamp":new Date().toISOString(),"type":"Emergency Care","note":"Emergency medical consultation","amount":"₱500","status":"Completed"},
    {"seniorId":"LGAPU-010","timestamp":new Date(now - 1000*60*30).toISOString(),"type":"Document Service","note":"Medical certificate issuance","amount":"Free","status":"Completed"},
    {"seniorId":"LGAPU-011","timestamp":new Date(now - 1000*60*60*24*8).toISOString(),"type":"Dental Service","note":"Dental checkup and cleaning","amount":"₱400","status":"Completed"},
    {"seniorId":"LGAPU-012","timestamp":new Date(now - 1000*60*60*24*12).toISOString(),"type":"Medical Test","note":"Bone density screening","amount":"₱800","status":"Completed"},
    {"seniorId":"LGAPU-013","timestamp":new Date(now - 1000*60*60*24*9).toISOString(),"type":"Orientation","note":"New benefits program briefing","amount":"Free","status":"Completed"},
    {"seniorId":"LGAPU-014","timestamp":new Date(now - 1000*60*60*24*11).toISOString(),"type":"Vaccination","note":"COVID-19 booster shot","amount":"Free","status":"Completed"},
    {"seniorId":"LGAPU-015","timestamp":new Date(now - 1000*60*60*24*14).toISOString(),"type":"Medical Checkup","note":"General health consultation","amount":"₱250","status":"Completed"},
    {"seniorId":"LGAPU-016","timestamp":new Date(now - 1000*60*60*24*20).toISOString(),"type":"Medical Test","note":"Cholesterol screening","amount":"₱600","status":"Completed"},
    {"seniorId":"LGAPU-016","timestamp":new Date(now - 1000*60*60*24*50).toISOString(),"type":"Grocery Voucher","note":"Quarterly grocery assistance","amount":"₱2,000","status":"Completed"},
    {"seniorId":"LGAPU-017","timestamp":new Date(now - 1000*60*60*24*1).toISOString(),"type":"Medical Checkup","note":"Home visit health monitoring","amount":"Free","status":"Completed"},
    {"seniorId":"LGAPU-017","timestamp":new Date(now - 1000*60*60*24*28).toISOString(),"type":"Monthly Pension","note":"Cash assistance for elderly care","amount":"₱1,500","status":"Completed"},
    {"seniorId":"LGAPU-017","timestamp":new Date(now - 1000*60*60*24*55).toISOString(),"type":"Medical Subsidy","note":"Physical therapy subsidy","amount":"₱5,000","status":"Completed"},
    {"seniorId":"LGAPU-018","timestamp":new Date(now - 1000*60*60*24*16).toISOString(),"type":"Grocery Voucher","note":"Food assistance claim","amount":"₱2,000","status":"Completed"},
    {"seniorId":"LGAPU-018","timestamp":new Date(now - 1000*60*60*24*44).toISOString(),"type":"Transport Allowance","note":"Monthly transport support","amount":"₱500","status":"Completed"},
    {"seniorId":"LGAPU-019","timestamp":new Date(now - 1000*60*60*24*25).toISOString(),"type":"Birthday Gift","note":"Birthday cash assistance","amount":"₱1,000","status":"Completed"},
    {"seniorId":"LGAPU-019","timestamp":new Date(now - 1000*60*60*24*32).toISOString(),"type":"Monthly Pension","note":"Pension collection","amount":"₱1,500","status":"Completed"},
    {"seniorId":"LGAPU-020","timestamp":new Date(now - 1000*60*60*24*8).toISOString(),"type":"Medical Service","note":"Respiratory therapy treatment","amount":"₱350","status":"Completed"},
    {"seniorId":"LGAPU-020","timestamp":new Date(now - 1000*60*60*24*38).toISOString(),"type":"Medical Subsidy","note":"Asthma medication assistance","amount":"₱5,000","status":"Completed"}
  ];
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

function loadProfiles(){
  const raw = localStorage.getItem(STORAGE_KEY);
  
  // Force refresh - clear old data and reseed
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TRANSACTIONS_KEY);
  localStorage.removeItem('lingap_benefits_v1');
  seedProfiles();
  
  profiles = JSON.parse(localStorage.getItem(STORAGE_KEY));
}

function seedBenefits() {
  const benefits = [
    {
      name: 'Monthly Pension', 
      description: 'Monthly financial assistance for senior citizens aged 60 and above', 
      amount: 1500, 
      frequency: 'Monthly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All registered senior citizens',
      coverage: 'Cash assistance for daily living expenses'
    },
    {
      name: 'Medical Subsidy', 
      description: 'Comprehensive medical and healthcare financial assistance program', 
      amount: 5000, 
      frequency: 'Quarterly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'Seniors with medical needs',
      coverage: 'Hospital bills, medications, laboratory tests, consultations'
    },
    {
      name: 'Transport Allowance', 
      description: 'Transportation support for seniors to access government services', 
      amount: 500, 
      frequency: 'Monthly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All active seniors',
      coverage: 'Public transport fare, tricycle/jeep subsidy'
    },
    {
      name: 'Birthday Gift', 
      description: 'Special birthday cash gift for senior citizens', 
      amount: 1000, 
      frequency: 'Yearly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'Birthday celebrants (birth month)',
      coverage: 'One-time birthday cash assistance'
    },
    {
      name: 'Grocery Voucher', 
      description: 'Grocery assistance vouchers for basic food items and necessities', 
      amount: 2000, 
      frequency: 'Quarterly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All registered seniors',
      coverage: 'Rice, canned goods, toiletries, basic commodities'
    },
    {
      name: '20% Senior Discount', 
      description: 'Mandatory 20% discount on purchases and services nationwide', 
      amount: 0, 
      frequency: 'Always Available', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All senior citizens with valid ID',
      coverage: 'Restaurants, drugstores, groceries, hotels, transportation, recreation'
    },
    {
      name: 'Free Medical Checkup', 
      description: 'Regular health monitoring and preventive care services', 
      amount: 0, 
      frequency: 'Monthly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All registered seniors',
      coverage: 'Blood pressure, blood sugar, general consultation, vitamins'
    },
    {
      name: 'Dental Services', 
      description: 'Basic dental care and oral health services', 
      amount: 0, 
      frequency: 'Bi-Annual', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All seniors needing dental care',
      coverage: 'Cleaning, extraction, dentures subsidy'
    },
    {
      name: 'Eye Care Assistance', 
      description: 'Vision care and eyeglasses support program', 
      amount: 1500, 
      frequency: 'Yearly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'Seniors needing vision correction',
      coverage: 'Eye examination, prescription eyeglasses, cataract screening'
    },
    {
      name: 'Emergency Assistance Fund', 
      description: 'Immediate financial aid for urgent needs and emergencies', 
      amount: 3000, 
      frequency: 'As Needed', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'Seniors facing emergencies',
      coverage: 'Medical emergencies, natural disasters, fire, hospitalization'
    },
    {
      name: 'Senior Learning Program', 
      description: 'Educational and skills training workshops for lifelong learning', 
      amount: 0, 
      frequency: 'Monthly', 
      status: 'Active', 
      createdAt: '2021-03-01',
      eligibility: 'All interested seniors',
      coverage: 'Computer literacy, arts & crafts, health seminars, livelihood training'
    },
    {
      name: 'Burial Assistance', 
      description: 'Financial assistance for funeral and burial expenses', 
      amount: 10000, 
      frequency: 'One-Time', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'Immediate family of deceased senior',
      coverage: 'Casket, funeral services, burial plot, memorial services'
    },
    {
      name: 'Home Repair Assistance', 
      description: 'Housing support for minor repairs and improvements', 
      amount: 5000, 
      frequency: 'Yearly', 
      status: 'Active', 
      createdAt: '2021-06-01',
      eligibility: 'Low-income seniors owning homes',
      coverage: 'Roof repair, electrical, plumbing, painting, flooring'
    },
    {
      name: 'Nutrition Program', 
      description: 'Free meals and dietary supplements for malnourished seniors', 
      amount: 0, 
      frequency: 'Weekly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'Seniors with nutritional needs',
      coverage: 'Hot meals, vitamins, milk supplements, nutrition counseling'
    },
    {
      name: 'Recreation & Socialization', 
      description: 'Activities, trips, and social events for senior wellness', 
      amount: 800, 
      frequency: 'Quarterly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All registered seniors',
      coverage: 'Field trips, parties, exercise programs, hobby clubs, tournaments'
    },
    {
      name: 'Utility Subsidy', 
      description: 'Assistance for electricity and water bills', 
      amount: 600, 
      frequency: 'Monthly', 
      status: 'Active', 
      createdAt: '2021-09-01',
      eligibility: 'Low-income seniors',
      coverage: 'Electricity, water, internet subsidy for senior households'
    },
    {
      name: 'Mobility Assistance', 
      description: 'Support for mobility aids and assistive devices', 
      amount: 4000, 
      frequency: 'As Needed', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'Seniors with mobility challenges',
      coverage: 'Wheelchairs, canes, walkers, hearing aids, prosthetics subsidy'
    },
    {
      name: 'Legal Aid Services', 
      description: 'Free legal assistance and consultation for seniors', 
      amount: 0, 
      frequency: 'As Needed', 
      status: 'Active', 
      createdAt: '2021-01-01',
      eligibility: 'All seniors requiring legal help',
      coverage: 'Document notarization, contracts, property disputes, consultations'
    },
    {
      name: 'Holiday Cash Gift', 
      description: 'Special cash assistance during Christmas season', 
      amount: 2000, 
      frequency: 'Yearly', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All registered seniors (December)',
      coverage: 'Christmas bonus, holiday grocery assistance'
    },
    {
      name: 'Physical Therapy Subsidy', 
      description: 'Rehabilitation and physical therapy support', 
      amount: 2500, 
      frequency: 'As Needed', 
      status: 'Active', 
      createdAt: '2021-04-01',
      eligibility: 'Seniors post-surgery or with chronic conditions',
      coverage: 'Physical therapy sessions, rehabilitation equipment, home care'
    },
    {
      name: 'Memory Care Program', 
      description: 'Support for seniors with dementia and cognitive decline', 
      amount: 3000, 
      frequency: 'Quarterly', 
      status: 'Active', 
      createdAt: '2022-01-01',
      eligibility: 'Seniors diagnosed with memory disorders',
      coverage: 'Memory screening, caregiver training, medications, support groups'
    },
    {
      name: 'Immunization Drive', 
      description: 'Free vaccines and preventive immunizations', 
      amount: 0, 
      frequency: 'Seasonal', 
      status: 'Active', 
      createdAt: '2020-01-01',
      eligibility: 'All seniors',
      coverage: 'Flu shots, pneumonia vaccine, COVID-19 boosters, tetanus'
    }
  ];
  localStorage.setItem('lingap_benefits_v1', JSON.stringify(benefits));
}

// ===== LOGIN =====
function initLogin(){
  console.log('Initializing login...');
  loadProfiles();
  console.log('Profiles loaded:', profiles.length);
  console.log('Sample profile IDs:', profiles.slice(0, 5).map(p => ({id: p.id, username: p.username})));
  
  document.getElementById('loginBtn').addEventListener('click', handleLogin);
  
  // Add Enter key support for login
  const passwordInput = document.getElementById('password');
  if(passwordInput) {
    passwordInput.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') handleLogin();
    });
  }
  
  sessionStorage.removeItem('lingap_user');
  sessionStorage.removeItem('currentUser');
}
function handleLogin(){
  const username = document.getElementById('username').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();
  
  console.log('Login attempt:', username, '/', password);
  console.log('Available DEMO_USERS:', DEMO_USERS);
  
  // Auto-detect role based on username
  const user = DEMO_USERS.find(u=>u.username===username && u.password===password);
  console.log('Found user:', user);
  
  const msg = document.getElementById('loginMsg');
  if(!user){ 
    msg.textContent='Invalid username or password.';
    msg.classList.add('show');
    return; 
  }
  msg.classList.remove('show');
  
  // For senior citizens, set session with their profile ID
  if(user.role === 'senior') {
    const session = {role: 'senior', username: user.username, id: user.id};
    sessionStorage.setItem('currentUser', JSON.stringify(session));
    console.log('Senior login session created:', session);
    console.log('Redirecting to senior.html...');
    window.location.href='senior.html';
  } else if(user.role === 'merchant') {
    const session = {role: 'merchant', username: user.username};
    sessionStorage.setItem('currentUser', JSON.stringify(session));
    console.log('Merchant login session created:', session);
    window.location.href='merchant.html';
  } else if(user.role === 'osca') {
    const session = {role: 'osca', username: user.username};
    sessionStorage.setItem('currentUser', JSON.stringify(session));
    console.log('OSCA login session created:', session);
    window.location.href='osca.html';
  } else if(user.role === 'admin') {
    const session = {role: 'admin', username: user.username};
    sessionStorage.setItem('currentUser', JSON.stringify(session));
    window.location.href='admin.html';
  } else {
    const session = {role:user.role, username:user.username, seniorId:user.id||null};
    sessionStorage.setItem('lingap_user', JSON.stringify(session));
    window.location.href='senior.html';
  }
}

// ===== ADMIN =====
let hq=null;

// Mock pending registrations data
const pendingRegistrations = [
  {
    id: 'SC-2025-001',
    name: 'Maria Santos Cruz',
    birth: '1955-03-15',
    gender: 'Female',
    contact: '0912-345-6789',
    address: 'Brgy. San Jose, Floridablanca, Pampanga',
    email: 'maria.cruz@email.com',
    benefits: 'Pension, Medical',
    documents: ['Valid ID', 'Birth Certificate', 'Proof of Residency'],
    dateApplied: '2025-11-15',
    status: 'pending'
  },
  {
    id: 'SC-2025-002',
    name: 'Roberto Diaz Reyes',
    birth: '1952-08-22',
    gender: 'Male',
    contact: '0923-456-7890',
    address: 'Brgy. Santa Rita, Floridablanca, Pampanga',
    email: 'roberto.reyes@email.com',
    benefits: 'Transport, Medical',
    documents: ['Valid ID', 'Birth Certificate'],
    dateApplied: '2025-11-16',
    status: 'pending'
  },
  {
    id: 'SC-2025-003',
    name: 'Elena Flores Mendoza',
    birth: '1958-12-05',
    gender: 'Female',
    contact: '0945-678-9012',
    address: 'Brgy. Dela Paz, Floridablanca, Pampanga',
    email: 'elena.mendoza@email.com',
    benefits: 'Pension, Transport, Medical',
    documents: ['Valid ID', 'Birth Certificate', 'Proof of Residency', 'Medical Records'],
    dateApplied: '2025-11-17',
    status: 'pending'
  },
  {
    id: 'SC-2025-004',
    name: 'Carlos Bautista Garcia',
    birth: '1950-06-18',
    gender: 'Male',
    contact: '0918-234-5678',
    address: 'Brgy. Mabical, Floridablanca, Pampanga',
    email: 'carlos.garcia@email.com',
    benefits: 'Pension, Medical',
    documents: ['Valid ID', 'Birth Certificate', 'Medical Records'],
    dateApplied: '2025-11-18',
    status: 'pending'
  },
  {
    id: 'SC-2025-005',
    name: 'Teresita Reyes Santos',
    birth: '1959-09-30',
    gender: 'Female',
    contact: '0927-890-1234',
    address: 'Brgy. Cabetican, Floridablanca, Pampanga',
    email: 'teresita.santos@email.com',
    benefits: 'Medical, Transport',
    documents: ['Valid ID', 'Birth Certificate', 'Proof of Residency'],
    dateApplied: '2025-11-18',
    status: 'pending'
  }
];

function initAdmin(){
  const s = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if(!s || s.role!=='admin'){ location.href='index.html'; return; }
  loadProfiles(); 
  filterSeniors(); // Use filterSeniors instead of refreshAdminTable to enable filtering
  populateReports(); 
  loadPendingRegistrations();
  updateSeniorStats();
  
  // Admin panel buttons
  document.getElementById('logoutBtn').addEventListener('click', ()=>{ sessionStorage.removeItem('currentUser'); location.href='index.html'; });
  
  const saveSeniorBtn = document.getElementById('saveSenior');
  if(saveSeniorBtn) {
    saveSeniorBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Save button clicked');
      saveSeniorFromForm();
    });
    console.log('Save senior button listener attached');
  }
  
  const clearSeniorBtn = document.getElementById('clearSenior');
  if(clearSeniorBtn) {
    clearSeniorBtn.addEventListener('click', clearSeniorForm);
  }
  
  const exportCSVBtn = document.getElementById('exportCSV');
  if(exportCSVBtn) {
    exportCSVBtn.addEventListener('click', exportCSV);
  }
  
  const exportJSONBtn = document.getElementById('exportJSON');
  if(exportJSONBtn) {
    exportJSONBtn.addEventListener('click', exportJSON);
  }
  
  const importJSONBtn = document.getElementById('importJSON');
  if(importJSONBtn) {
    importJSONBtn.addEventListener('click', importJSON);
  }
  
  // Search and filter functionality
  const searchInput = document.getElementById('searchSenior');
  if(searchInput) {
    searchInput.addEventListener('input', filterSeniors);
  }
  
  const filterGender = document.getElementById('filterGender');
  if(filterGender) {
    filterGender.addEventListener('change', filterSeniors);
  }
  
  const filterBenefit = document.getElementById('filterBenefit');
  if(filterBenefit) {
    filterBenefit.addEventListener('change', filterSeniors);
  }
  
  const sortSenior = document.getElementById('sortSenior');
  if(sortSenior) {
    sortSenior.addEventListener('change', filterSeniors);
  }
  
  const clearFiltersBtn = document.getElementById('clearFilters');
  if(clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      if(searchInput) searchInput.value = '';
      if(filterGender) filterGender.value = '';
      if(filterBenefit) filterBenefit.value = '';
      if(sortSenior) sortSenior.value = 'name';
      filterSeniors();
    });
  }
  
  // Transaction management
  const transactionFilter = document.getElementById('transactionFilter');
  if (transactionFilter) {
    transactionFilter.addEventListener('change', (e) => refreshTransactionsTable(e.target.value));
  }
  
  const exportTransactionsBtn = document.getElementById('exportTransactions');
  if (exportTransactionsBtn) {
    exportTransactionsBtn.addEventListener('click', exportTransactionsCSV);
  }
  
  // Setup tabs and handle transaction tab
  setupTabs();
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tab === 'transactions') {
        refreshTransactionsTable(transactionFilter?.value || 'all');
      }
    });
  });
  
  // Update dashboard stats
  updateDashboardStats();
}

function filterSeniors() {
  const searchInput = document.getElementById('searchSenior');
  const filterGender = document.getElementById('filterGender');
  const filterBenefit = document.getElementById('filterBenefit');
  const sortSenior = document.getElementById('sortSenior');
  
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const genderFilter = filterGender ? filterGender.value : '';
  const benefitFilter = filterBenefit ? filterBenefit.value : '';
  const sortBy = sortSenior ? sortSenior.value : 'name';
  
  let filtered = profiles.filter(p => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm) || 
      p.id.toLowerCase().includes(searchTerm);
    const matchesGender = !genderFilter || p.gender === genderFilter;
    const matchesBenefit = !benefitFilter || (p.benefits && p.benefits.includes(benefitFilter));
    
    return matchesSearch && matchesGender && matchesBenefit;
  });
  
  // Sort
  if(sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if(sortBy === 'id') {
    filtered.sort((a, b) => a.id.localeCompare(b.id));
  } else if(sortBy === 'age') {
    filtered.sort((a, b) => calculateAge(b.birth) - calculateAge(a.birth));
  } else if(sortBy === 'recent') {
    filtered.reverse();
  }
  
  // Render filtered results
  const tbody = document.getElementById('seniorTable');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="9" style="text-align:center;padding:40px;color:var(--text-light)">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;opacity:0.3">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <p style="margin:0;font-size:16px;font-weight:600">No seniors found</p>
        <p style="margin:8px 0 0;font-size:14px">Try adjusting your search or filter criteria</p>
      </td>
    `;
    tbody.appendChild(tr);
  } else {
    filtered.forEach((p) => {
      const idx = profiles.indexOf(p);
      const age = p.birth ? calculateAge(p.birth) : 'N/A';
      const gender = p.gender || 'N/A';
      const contact = p.contact || p.phone || 'N/A';
      const address = p.address || 'N/A';
      const benefits = p.benefits || 'N/A';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.id}</td>
        <td style="font-weight:600">${p.name}</td>
        <td>${p.birth}</td>
        <td>${age}</td>
        <td>${gender}</td>
        <td>${contact}</td>
        <td>${address}</td>
        <td>${benefits}</td>
        <td style="text-align:center">
          <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
            <button class="btn ghost small" onclick="viewSeniorDetails(${idx})" title="View Details">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
            <button class="btn ghost small" onclick="editSenior(${idx})" title="Edit">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn small" onclick="showSeniorQRCode('${p.id}')" title="Show QR">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button class="btn ghost small" onclick="deleteSenior(${idx})" title="Delete" style="color:#ef4444">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
  }
  
  // Update showing count
  const showingEl = document.getElementById('showingCount');
  const totalCountEl = document.getElementById('totalCount');
  if(showingEl) showingEl.textContent = filtered.length;
  if(totalCountEl) totalCountEl.textContent = profiles.length;
}

function loadPendingRegistrations() {
  console.log('loadPendingRegistrations called');
  console.log('pendingRegistrations array:', pendingRegistrations);
  
  const container = document.getElementById('pendingRegistrations');
  console.log('Container found:', container);
  
  if(!container) {
    console.error('pendingRegistrations container not found!');
    return;
  }
  
  container.innerHTML = '';
  
  if(pendingRegistrations.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding:40px;background:#f8fafc;border:2px dashed var(--border);text-align:center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;color:var(--text-light)">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p style="margin:0;font-size:15px;color:var(--text-light)">No pending registrations</p>
        <p class="small" style="margin-top:8px;color:var(--text-light)">New applications will appear here for review</p>
      </div>`;
    return;
  }
  
  pendingRegistrations.forEach((reg, idx) => {
    const age = calculateAge(reg.birth);
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'border:2px solid var(--border);background:#fff;transition:all 0.2s';
    card.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr auto;gap:24px">
        <div>
          <div style="display:flex;align-items:start;gap:16px;margin-bottom:16px">
            <div style="width:60px;height:60px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div style="flex:1">
              <h4 style="margin:0;font-size:20px;font-weight:700;color:var(--text)">${reg.name}</h4>
              <p class="small" style="margin:4px 0;color:var(--text-light)">ID: ${reg.id}</p>
              <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
                <span style="padding:4px 10px;background:var(--bg);border-radius:6px;font-size:12px;font-weight:600;color:var(--text-light)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Age: ${age}
                </span>
                <span style="padding:4px 10px;background:${reg.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#db2777)' : 'linear-gradient(135deg,#06b6d4,#0891b2)'};border-radius:6px;font-size:12px;font-weight:600;color:#fff">
                  ${reg.gender}
                </span>
                <span style="padding:4px 10px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:6px;font-size:12px;font-weight:600;color:#fff">
                  Applied: ${new Date(reg.dateApplied).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
            <div>
              <div class="small" style="color:var(--text-light);margin-bottom:4px;font-weight:600">Contact</div>
              <div style="font-size:14px">${reg.contact}</div>
              <div style="font-size:13px;color:var(--text-light)">${reg.email}</div>
            </div>
            <div>
              <div class="small" style="color:var(--text-light);margin-bottom:4px;font-weight:600">Address</div>
              <div style="font-size:14px">${reg.address}</div>
            </div>
            <div>
              <div class="small" style="color:var(--text-light);margin-bottom:4px;font-weight:600">Requested Benefits</div>
              <div style="font-size:14px">${reg.benefits}</div>
            </div>
            <div>
              <div class="small" style="color:var(--text-light);margin-bottom:4px;font-weight:600">Documents Submitted</div>
              <div style="font-size:13px">${reg.documents.join(', ')}</div>
            </div>
          </div>
        </div>
        
        <div style="display:flex;flex-direction:column;gap:8px;min-width:140px">
          <button class="btn" onclick="approveRegistration(${idx})" style="white-space:nowrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Approve
          </button>
          <button class="btn ghost" onclick="viewRegistrationDetails(${idx})" style="white-space:nowrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            View Details
          </button>
          <button class="btn ghost" onclick="rejectRegistration(${idx})" style="white-space:nowrap;color:#ef4444">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Reject
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  
  // Update pending count
  const countEl = document.getElementById('pendingCount');
  if(countEl) countEl.textContent = pendingRegistrations.length;
}

function approveRegistration(idx) {
  // Handled by registration-modals.js
  openApproveRegistrationModal(idx);
}

function rejectRegistration(idx) {
  // Handled by registration-modals.js
  openRejectRegistrationModal(idx);
}

// viewRegistrationDetails is defined in registration-modals.js

function updateDashboardStats(){
  // Total seniors
  const totalEl = document.getElementById('totalSeniors');
  if(totalEl) totalEl.textContent = profiles.length;
  
  // Get all transactions
  const allTransactions = [];
  profiles.forEach(p => {
    if(p.transactions && Array.isArray(p.transactions)){
      allTransactions.push(...p.transactions);
    }
  });
  
  // Today's transactions
  const today = new Date().toDateString();
  const todayCount = allTransactions.filter(t => {
    const txDate = new Date(t.timestamp).toDateString();
    return txDate === today;
  }).length;
  
  const todayEl = document.getElementById('todayTransactions');
  if(todayEl) todayEl.textContent = todayCount;
  
  // This month's transactions
  const now = new Date();
  const thisMonth = allTransactions.filter(t => {
    const txDate = new Date(t.timestamp);
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  }).length;
  
  const monthEl = document.getElementById('monthTransactions');
  if(monthEl) monthEl.textContent = thisMonth;
}

function refreshAdminTable(){
  const tbody=document.getElementById('seniorTable'); 
  if(!tbody) return;
  tbody.innerHTML='';
  
  profiles.forEach((p,idx)=>{
    const age = p.birth ? calculateAge(p.birth) : 'N/A';
    const gender = p.gender || 'N/A';
    const contact = p.contact || p.phone || 'N/A';
    const address = p.address || 'N/A';
    const benefits = p.benefits || 'N/A';
    
    const tr=document.createElement('tr');
    tr.innerHTML=`
      <td>${p.id}</td>
      <td style="font-weight:600">${p.name}</td>
      <td>${p.birth}</td>
      <td>${age}</td>
      <td>${gender}</td>
      <td>${contact}</td>
      <td>${address}</td>
      <td>${benefits}</td>
      <td style="text-align:center">
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
          <button class="btn ghost small" onclick="viewSeniorDetails(${idx})" title="View Details">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="btn ghost small" onclick="editSenior(${idx})" title="Edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn small" onclick="showSeniorQRCode('${p.id}')" title="Show QR">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button class="btn ghost small" onclick="deleteSenior(${idx})" title="Delete" style="color:#ef4444">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
  
  // Update stats
  updateSeniorStats();
  populateReports();
  updateDashboardStats();
}

function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function updateSeniorStats() {
  const totalEl = document.getElementById('totalSeniorsCount');
  const femaleEl = document.getElementById('femaleCount');
  const maleEl = document.getElementById('maleCount');
  const activeEl = document.getElementById('activeCount');
  const showingEl = document.getElementById('showingCount');
  const totalCountEl = document.getElementById('totalCount');
  
  if(totalEl) totalEl.textContent = profiles.length;
  if(totalCountEl) totalCountEl.textContent = profiles.length;
  if(showingEl) showingEl.textContent = profiles.length;
  
  const femaleCount = profiles.filter(p => p.gender === 'Female').length;
  const maleCount = profiles.filter(p => p.gender === 'Male').length;
  
  if(femaleEl) femaleEl.textContent = femaleCount;
  if(maleEl) maleEl.textContent = maleCount;
  
  // Count active this month (those with transactions this month)
  const now = new Date();
  let activeCount = 0;
  profiles.forEach(p => {
    if(p.transactions && Array.isArray(p.transactions)) {
      const hasThisMonth = p.transactions.some(t => {
        const txDate = new Date(t.timestamp);
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      });
      if(hasThisMonth) activeCount++;
    }
  });
  
  if(activeEl) activeEl.textContent = activeCount;
}

// Note: viewSeniorDetails, editSenior, showSeniorQRCode, and deleteSenior
// are now defined in admin-modals.js for modal-based interactions

// Clear form helper
function clearSeniorForm(){ ['sId','sName','sBirth','sContact','sBenefits','sGender'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; }); }
function saveSeniorFromForm(){
  console.log('saveSeniorFromForm called');
  
  // Ensure profiles is loaded
  if(!profiles || profiles.length === 0) {
    console.log('Profiles empty, loading...');
    loadProfiles();
  }
  
  const id=document.getElementById('sId').value.trim();
  const name=document.getElementById('sName').value.trim();
  const birth=document.getElementById('sBirth').value;
  const contact=document.getElementById('sContact').value.trim();
  const benefits=document.getElementById('sBenefits').value.trim();
  const gender=document.getElementById('sGender').value;
  
  console.log('Form values:', {id, name, birth, contact, benefits, gender});
  
  if(!id||!name){ alert('Provide ID and name'); return; }
  
  const existing=profiles.findIndex(p=>p.id===id);
  const isUpdate = existing > -1;
  
  // Show confirmation modal
  const message = isUpdate 
    ? `Update existing senior?\n\nID: ${id}\nName: ${name}\nBirth: ${birth}\nGender: ${gender}\nContact: ${contact}\nBenefits: ${benefits}`
    : `Save new senior?\n\nID: ${id}\nName: ${name}\nBirth: ${birth}\nGender: ${gender}\nContact: ${contact}\nBenefits: ${benefits}`;
  
  if(!confirm(message)) {
    console.log('Save cancelled by user');
    return;
  }
  
  const rec={id,name,birth,gender,contact,benefits,notes:profiles.find(p=>p.id===id)?.notes||'',transactions:profiles.find(p=>p.id===id)?.transactions||[]};
  
  console.log('Existing index:', existing, 'Record:', rec);
  
  if(isUpdate){ 
    profiles[existing]=Object.assign(profiles[existing],rec); 
    console.log('Updated existing profile');
  } else { 
    profiles.push(rec); 
    console.log('Added new profile');
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); 
  console.log('Saved to localStorage, total profiles:', profiles.length);
  
  alert(isUpdate ? 'Senior updated successfully!' : 'Senior saved successfully!');
  refreshAdminTable();
  clearSeniorForm();
}

// Note: editSenior and deleteSenior are now in admin-modals.js

// Export/Import functions
function exportCSV(){
  if(!profiles || profiles.length === 0){ 
    showErrorToast('No data to export');
    return; 
  }
  
  const headers = ['ID','Name','Birth Date','Gender','Contact','Benefits','Notes'];
  const rows = profiles.map(p => [
    p.id,
    p.name,
    p.birth || '',
    p.gender || '',
    p.contact || '',
    p.benefits || '',
    (p.notes || '').replace(/\n/g, ' ')
  ]);
  
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seniors_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showSuccessToast('CSV exported successfully!');
}

function exportJSON(){
  if(!profiles || profiles.length === 0){ 
    showErrorToast('No data to export');
    return; 
  }
  
  const data = JSON.stringify(profiles, null, 2);
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seniors_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showSuccessToast('JSON exported successfully!');
}

function importJSON(){
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if(!Array.isArray(imported)){ 
          showErrorToast('Invalid JSON format');
          return; 
        }
        
        // Store import data and show modal
        window.pendingImportData = imported;
        window.pendingImportFileName = file.name;
        openImportConfirmModal(imported.length, file.name);
        
      } catch(err) {
        showErrorToast('Error parsing JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };
  
  input.click();
}

// Scanner functions
// Track pending transaction modals
const pendingTransactions = new Set(); // senior IDs with an open/pending transaction modal

// Check if senior was already scanned by current merchant today
function wasSeniorScannedByMerchantToday(seniorId) {
  const currentUser = JSON.parse(sessionStorage.getItem('lingap_user') || '{}');
  const merchantId = currentUser.username || 'unknown';
  const today = new Date().toLocaleDateString('en-US');
  
  const allTransactions = JSON.parse(localStorage.getItem('lingap_transactions') || '[]');
  
  // Check if there's any transaction for this senior by this merchant today
  return allTransactions.some(txn => 
    txn.seniorId === seniorId && 
    txn.merchantId === merchantId && 
    txn.scanDate === today
  );
}

// Admin scan handler
function handleAdminScan(decodedText) {
    try {
        const now = new Date();
        let id, timestamp;
        
        // Try to parse as JSON first (for our QR format)
        try {
            const obj = JSON.parse(atob(decodedText));
            id = obj.id;
            timestamp = obj.timestamp || now.toISOString();
        } catch {
            // If not JSON, treat as raw ID
            id = decodedText.trim();
            timestamp = now.toISOString();
        }

    // Check if this senior was already scanned by current merchant today
    if (wasSeniorScannedByMerchantToday(id)) {
            // Show already scanned message
            const el = document.createElement('div');
            el.className = 'scan-error';
            el.innerHTML = `
                <svg viewBox="0 0 24 24" width="48" height="48" stroke="#f59e0b" stroke-width="2" fill="none">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12" y2="16"/>
                </svg>
            `;
            document.querySelector('.scan-frame')?.appendChild(el);
            setTimeout(() => el.remove(), 1000);
            
            // Get senior name if available
            const p = profiles.find(x => x.id === id);
            const seniorName = p ? p.name : id;
            
            document.getElementById('scanLog').textContent = `${seniorName} already scanned today by your establishment`;
            return;
        }
        
    // If we already have an open pending modal for this senior, ignore duplicate scans
    if (pendingTransactions.has(id)) {
      document.getElementById('scanLog').textContent = `${id} - transaction pending`; 
      return;
    }

    // Find senior profile
        const p = profiles.find(x => x.id === id);
        
        // Create scan entry
        const scanLog = document.getElementById('recentScans');
        const el = document.createElement('div');
        el.className = 'scan-entry';
        
        if (!p) {
            el.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="#ef4444" stroke-width="2" fill="none">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    <div>
                        <div class="font-bold text-red-500">Unknown ID Scanned</div>
                        <div class="text-sm text-gray-500">${id}</div>
                    </div>
                </div>
            `;
            document.getElementById('scanLog').textContent = 'Profile not found: ' + id;
    } else {
      // Use centralized modal flow: populate modal and show it. The global modal handlers
      // will manage saving the transaction and updating stores.
      try {
        // Mark as pending so duplicate scanner events don't re-open modal
        pendingTransactions.add(id);
        showTransactionModal({ id: p.id, name: p.name });
        document.getElementById('scanLog').textContent = `Scanned ${p.name}`;
        // Provide a simple summary entry while awaiting modal save
        el.innerHTML = `
          <div class="flex items-center gap-2">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="#059669" stroke-width="2" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div>
              <div class="font-bold text-green-600">${p.name}</div>
              <div class="text-sm text-gray-500">Awaiting transaction details...</div>
            </div>
          </div>
        `;
      } catch (err) {
        console.error('Error showing transaction modal:', err);
        document.getElementById('scanLog').textContent = 'Error opening transaction modal';
      }
    }
        
        if (scanLog) {
            scanLog.insertBefore(el, scanLog.firstChild);
            // Keep max 10 entries
            if (scanLog.children.length > 10) {
                scanLog.removeChild(scanLog.lastChild);
            }
        }
        
    } catch (err) {
        console.error('Scan processing error:', err);
        document.getElementById('scanLog').textContent = 'Error processing scan';
    }
}



// reports
function populateReports(){
  const el = document.getElementById('reportsArea');
  if(!el) return;
  loadProfiles();

  // total and simple stats
  const total = profiles.length;
  const genders = profiles.reduce((acc,p)=>{
    const g = (p.gender || 'Unknown');
    acc[g] = (acc[g]||0) + 1;
    return acc;
  },{});

  // benefits frequency (split comma lists)
  const benefitsMap = {};
  profiles.forEach(p=>{
    (p.benefits || '').split(',').map(s=>s.trim()).filter(Boolean).forEach(b=>{
      benefitsMap[b] = (benefitsMap[b]||0) + 1;
    });
  });

  // Calculate additional stats
  const totalTxns = profiles.reduce((sum, p) => sum + (p.transactions || []).length, 0);
  const recentTxns = profiles.reduce((sum, p) => 
    sum + ((p.transactions || [])
      .filter(t => new Date(t.timestamp) >= thirtyDaysAgo).length), 0);
  const avgAge = Math.round(profiles.reduce((sum, p) => {
    const age = p.birth ? Math.floor((new Date() - new Date(p.birth)) / 31557600000) : 0;
    return sum + age;
  }, 0) / (profiles.length || 1));

  // Find most common benefits
  const allBenefits = profiles.reduce((acc, p) => {
    (p.benefits || '').split(',').map(b => b.trim()).filter(Boolean)
      .forEach(b => acc[b] = (acc[b] || 0) + 1);
    return acc;
  }, {});
  const topBenefits = Object.entries(allBenefits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => `${name} (${count})`);

  // Render enhanced reports
  el.innerHTML = `
    <div class="stats-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-bottom:24px">
      <div class="stat-card" style="background:#f7faf9;padding:16px;border-radius:8px;border:1px solid #e6efe3">
        <div style="color:var(--muted);font-size:13px;margin-bottom:4px">Total Seniors</div>
        <div style="font-size:24px;font-weight:700;color:var(--primary)">${total}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:4px">Average age: ${avgAge} years</div>
      </div>
      <div class="stat-card" style="background:#f7faf9;padding:16px;border-radius:8px;border:1px solid #e6efe3">
        <div style="color:var(--muted);font-size:13px;margin-bottom:4px">Recent Activity</div>
        <div style="font-size:24px;font-weight:700;color:var(--primary)">${recentTxns}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:4px">Transactions in 30 days</div>
      </div>
      <div class="stat-card" style="background:#f7faf9;padding:16px;border-radius:8px;border:1px solid #e6efe3">
        <div style="color:var(--muted);font-size:13px;margin-bottom:4px">All Time</div>
        <div style="font-size:24px;font-weight:700;color:var(--primary)">${totalTxns}</div>
        <div style="font-size:13px;color:var(--muted);margin-top:4px">Total transactions</div>
      </div>
      <div class="stat-card" style="background:#f7faf9;padding:16px;border-radius:8px;border:1px solid #e6efe3">
        <div style="color:var(--muted);font-size:13px;margin-bottom:4px">Popular Benefits</div>
        <div style="font-size:15px;font-weight:600;color:var(--text)">${topBenefits.join(', ') || 'None recorded'}</div>
      </div>
    </div>

    <div class="charts-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:24px;margin-bottom:24px">
      <div class="chart-card" style="background:white;padding:20px;border-radius:12px;border:1px solid #e6efe3">
        <h3 style="margin:0 0 16px;font-size:16px">Gender Distribution</h3>
        <canvas id="genderChart" height="240" aria-label="Gender distribution chart"></canvas>
      </div>
      <div class="chart-card" style="background:white;padding:20px;border-radius:12px;border:1px solid #e6efe3">
        <h3 style="margin:0 0 16px;font-size:16px">Transaction Activity (Last 30 Days)</h3>
        <canvas id="activityChart" height="240" aria-label="Transaction activity chart"></canvas>
      </div>
    </div>

    <div class="summary-card" style="background:white;padding:20px;border-radius:12px;border:1px solid #e6efe3">
      <h3 style="margin:0 0 16px;font-size:16px">Recent Transactions</h3>
      <div class="recent-txns" style="max-height:200px;overflow-y:auto">
        ${profiles.reduce((html, p) => {
          const recent = (p.transactions || [])
            .filter(t => new Date(t.timestamp) >= thirtyDaysAgo)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 2)
            .map(t => `
              <div style="display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #f0f0f0">
                <div>
                  <div style="font-weight:600">${p.name}</div>
                  <div style="font-size:13px;color:var(--muted)">${t.note || 'No details'}</div>
                </div>
                <div style="font-size:13px;color:var(--muted);text-align:right">
                  ${new Date(t.timestamp).toLocaleDateString()}
                </div>
              </div>
            `).join('');
          return html + recent;
        }, '') || '<div style="text-align:center;padding:20px;color:var(--muted)">No recent transactions</div>'}
      </div>
    </div>
  `;

  // If Chart.js isn't loaded, show fallback
  if(typeof Chart === 'undefined'){
    el.insertAdjacentHTML('beforeend','<div class="small" style="color:crimson;margin-top:8px">Charts unavailable (Chart.js not loaded)</div>');
    return;
  }

  // destroy previous charts if present (avoid duplicates)
  try{ if(window._genderChart) { window._genderChart.destroy(); window._genderChart = null; } }catch(e){}
  try{ if(window._activityChart) { window._activityChart.destroy(); window._activityChart = null; } }catch(e){}

  // Gender pie chart
  const genderLabels = Object.keys(genders);
  const genderData = genderLabels.map(l => genders[l]);
  const genderCtx = document.getElementById('genderChart').getContext('2d');
  window._genderChart = new Chart(genderCtx, {
    type: 'pie',
    data: {
      labels: genderLabels,
      datasets: [{
        data: genderData,
        backgroundColor: genderLabels.map((_,i)=>['#0c8c47','#facc15','#6b7280','#60a5fa','#fb7185'][i % 5])
      }]
    },
    options: {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: { size: 13 }
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: 10 }
    }
  });

  // Transaction activity line chart (last 30 days)
  const now = new Date();
  now.setHours(23,59,59,999); // End of today
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29); // Include today, so go back 29 days
  thirtyDaysAgo.setHours(0,0,0,0); // Start of that day
  
  // Generate all dates in range first
  const dateList = [];
  const dateMap = {};
  for(let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dateList.push(dateStr);
    dateMap[dateStr] = 0; // Initialize all dates with 0
  }

  // Count transactions per date
  profiles.forEach(p => {
    (p.transactions || []).forEach(t => {
      const txDate = new Date(t.timestamp);
      if(txDate >= thirtyDaysAgo && txDate <= now) {
        const dateStr = txDate.toISOString().split('T')[0];
        if(dateMap[dateStr] !== undefined) { // Only count if in our range
          dateMap[dateStr]++;
        }
      }
    });
  });

  // Use consistent date list for labels and map to counts
  const activityLabels = dateList;
  const activityData = dateList.map(d => dateMap[d]);

  const actCtx = document.getElementById('activityChart').getContext('2d');
  window._activityChart = new Chart(actCtx, {
    type: 'line',
    data: {
      labels: activityLabels.map(d => new Date(d).toLocaleDateString()),
      datasets: [{
        label: 'Transactions',
        data: activityData,
        borderColor: '#0c8c47',
        backgroundColor: 'rgba(12,140,71,0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 3,
        pointHoverRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750 // Smoother animation
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (ctx) => new Date(activityLabels[ctx[0].dataIndex]).toLocaleDateString(),
            label: (ctx) => `${ctx.parsed.y} transaction${ctx.parsed.y !== 1 ? 's' : ''}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { 
            maxTicksLimit: 7,
            callback: value => new Date(activityLabels[value]).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })
          }
        },
        y: {
          beginAtZero: true,
          ticks: { 
            precision: 0,
            stepSize: 1,
            maxTicksLimit: 6
          },
          suggestedMax: Math.max(5, Math.max(...activityData) + 1) // Always show at least 0-5 range
        }
      }
    }
  });
}

// ===== SENIOR =====
function initSenior(){
  const s = getSession(); if(!s || s.role!=='senior'){ location.href='index.html'; return; }
  loadProfiles();
  const myId = s.seniorId || 'LGAPU-001';
  const me = profiles.find(p=>p.id===myId);
  if(!me){ alert('Profile not found'); location.href='index.html'; return; }
  renderSenior(me);
  document.getElementById('logoutSenior').addEventListener('click', ()=>{ sessionStorage.removeItem('lingap_user'); location.href='index.html'; });
  document.getElementById('saveNotes').addEventListener('click', ()=>{ me.notes = document.getElementById('seniorNotes').value.trim(); localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); alert('Notes saved'); renderSenior(me); });
  document.getElementById('genTxnQR').addEventListener('click', ()=>{ generateTxnQR(me); });
  document.getElementById('downloadSeniorQR').addEventListener('click', ()=>{ const c=document.querySelector('#seniorQR canvas'); if(!c){ alert('No QR'); return; } c.toBlob(b=>{ const url=URL.createObjectURL(b); const a=document.createElement('a'); a.href=url; a.download=`${me.id}_txn_qr.png`; a.click(); URL.revokeObjectURL(url); }); });
}

function renderSenior(me){
  const cont=document.getElementById('bookletContent');
  cont.innerHTML=`<div><strong>${me.name}</strong> · ${me.id}</div><div class="small">Birth: ${me.birth} · Gender: ${me.gender}</div><div style="margin-top:8px"><strong>Benefits:</strong> ${me.benefits||''}</div><div style="margin-top:8px"><strong>Contact:</strong> ${me.contact||''}</div><div style="margin-top:8px"><strong>Notes:</strong> <div class="small">${me.notes||''}</div></div>`;
  document.getElementById('seniorNotes').value = me.notes || '';
  refreshTxnTable(me);
  // generate initial QR if none
  if(!me.lastGeneratedTxn) generateTxnQR(me);
  else {
    const payload = btoa(JSON.stringify({id:me.id,name:me.name,timestamp:me.lastGeneratedTxn}));
    QRCode.toCanvas(createCanvas(), payload, {width:180}).then(canvas=>{ const wr=document.getElementById('seniorQR'); wr.innerHTML=''; wr.appendChild(canvas); });
  }
}

function refreshTxnTable(me){
  const tbody=document.getElementById('txnTable'); tbody.innerHTML='';
  (me.transactions||[]).forEach(tx=>{
    const tr=document.createElement('tr'); tr.innerHTML=`<td>${new Date(tx.timestamp).toLocaleString()}</td><td>${tx.note||''}</td>`; tbody.appendChild(tr);
  });
}

function createCanvas(){ return document.createElement('canvas'); }

async function generateTxnQR(me){
  const ts = new Date().toISOString();
  me.lastGeneratedTxn = ts;
  const payload = btoa(JSON.stringify({id:me.id,name:me.name,timestamp:ts}));
  const canvas = document.createElement('canvas');
  await QRCode.toCanvas(canvas, payload, {width:180});
  const wr=document.getElementById('seniorQR'); wr.innerHTML=''; wr.appendChild(canvas);
  // persist lastGeneratedTxn so QR remains if page reloads
  const idx = profiles.findIndex(p=>p.id===me.id); if(idx>-1){ profiles[idx].lastGeneratedTxn = ts; localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles)); }
  alert('New transaction QR generated. Show this to Admin to scan.');
}

// ===== helpers =====
function getSession(){ try{ return JSON.parse(sessionStorage.getItem('lingap_user')); }catch(e){return null;} }
