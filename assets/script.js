// LingapApu v2 - Transaction QR system

// ── Persistent Session ────────────────────────────────────────────────────────
// Wraps sessionStorage + localStorage so users can stay logged in across tabs
// and browser restarts when "Remember Me" is checked.
const LINGAP_SESSION_KEY  = 'lingap_session';
const LINGAP_SESSION_DAYS = 30;
window._Session = {
  /** Save session data. remember=true persists across restarts (30 days). */
  set(data, remember) {
    sessionStorage.setItem('currentUser', JSON.stringify(data));
    if (remember) {
      localStorage.setItem(LINGAP_SESSION_KEY, JSON.stringify({
        ...data,
        expiry: Date.now() + LINGAP_SESSION_DAYS * 86400000
      }));
    }
  },
  /**
   * Read active session. Falls back to localStorage and restores
   * to sessionStorage so all existing page guards still work.
   */
  get() {
    const ss = sessionStorage.getItem('currentUser');
    if (ss) { try { return JSON.parse(ss); } catch(e) {} }
    const ls = localStorage.getItem(LINGAP_SESSION_KEY);
    if (!ls) return null;
    try {
      const entry = JSON.parse(ls);
      if (!entry || !entry.role) return null;
      if (entry.expiry && Date.now() > entry.expiry) {
        localStorage.removeItem(LINGAP_SESSION_KEY);
        return null;
      }
      // Restore to sessionStorage so page guards work without modification
      sessionStorage.setItem('currentUser', JSON.stringify({ role: entry.role, username: entry.username, id: entry.id }));
      return entry;
    } catch(e) { return null; }
  },
  /** Wipe all session data (call on every logout). */
  clear() {
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('lingap_user');
    localStorage.removeItem(LINGAP_SESSION_KEY);
  }
};

document.addEventListener('DOMContentLoaded', ()=>{
  // Sync persisted session from localStorage → sessionStorage for this tab
  if (window._Session && !document.getElementById('loginBtn')) window._Session.get();
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
  const isMerchantPage = /\/merchant(\.html|\.php)?$/i.test(window.location.pathname);
  const isOSCAPage = /\/osca(\.html|\.php)?$/i.test(window.location.pathname);
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
  // Normalise both sides — strip .html, treat empty path as 'index'
  const rawPage = location.pathname.split('/').pop() || '';
  const current = (rawPage.replace(/\.(html|php)$/i, '') || 'index').toLowerCase();
  document.querySelectorAll('.navlink').forEach(a=>{
    const rawHref = (a.getAttribute('href')||'').split('/').pop() || '';
    const href = (rawHref.replace(/\.(html|php)$/i, '') || 'index').toLowerCase();
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

    // Form submit handler (async to handle database saves)
    if (form) {
      form.addEventListener('submit', async (e) => {
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

    // Save to Supabase - AWAIT the transaction save to ensure it completes
    if (window.db) {
      try {
        const result = await window.db.addTransaction(transaction);
        if (!result) {
          console.warn('[saveTransaction] Transaction save returned null/falsy');
          modalDebug('Warning: Transaction may not have saved to Supabase', 'warn');
        } else {
          modalDebug('Transaction saved successfully: ' + result.id);
        }
      } catch (e) {
        console.error('[saveTransaction] Failed to save transaction to Supabase:', e);
        modalDebug('Error: Transaction failed to save: ' + (e && e.message), 'error');
      }
    }

    // Save to local transactions store
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

// Demo users removed - use Supabase authentication only
const DEMO_USERS = [];
const STORAGE_KEY = 'lingap_profiles_v3';
const TRANSACTIONS_KEY = 'lingap_transactions';
let profiles = [];

// ---- Pagination State ----
let filteredSeniorsCache = [], seniorsPage = 1;
let filteredRegsCache    = [], regsPage    = 1;
const SENIORS_PAGE_SIZE  = 10;
const REGS_PAGE_SIZE     = 5;

// Shared pagination renderer (admin side)
function renderPagination(containerEl, page, totalPages, gotoFn) {
  if (!containerEl) return;
  containerEl.innerHTML = '';
  if (totalPages <= 1) return;
  const mkBtn = (html, p, disabled, active) =>
    `<button onclick="${gotoFn}(${p})" ${disabled ? 'disabled' : ''} style="display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:36px;padding:0 10px;border-radius:8px;border:1px solid ${active ? '#22c55e' : 'var(--border)'};background:${active ? '#22c55e' : disabled ? '#f9fafb' : '#fff'};color:${active ? '#fff' : disabled ? '#9ca3af' : '#374151'};font-size:13px;font-weight:${active ? '700' : '500'};cursor:${disabled ? 'not-allowed' : 'pointer'}">${html}</button>`;
  let nums = '', prev = 0;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      if (prev && i - prev > 1) nums += `<span style="padding:0 4px;color:#9ca3af">…</span>`;
      nums += mkBtn(i, i, false, i === page);
      prev = i;
    }
  }
  containerEl.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;gap:6px;padding-top:18px;flex-wrap:wrap">${mkBtn('&laquo; Prev', page - 1, page <= 1, false)}${nums}${mkBtn('Next &raquo;', page + 1, page >= totalPages, false)}</div>`;
}

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

async function loadProfiles(){
  try {
    // Check if db is available
    if (!window.db) {
      console.error('[loadProfiles] window.db is not initialized');
      throw new Error('Supabase client not initialized - check supabase-config.js');
    }

    if (!window.supabaseClient) {
      console.error('[loadProfiles] Supabase client not available');
      throw new Error('Supabase client not found - CDN may not have loaded');
    }

    console.log('[loadProfiles] Starting data load from Supabase...');
    const rows = await window.db.getSeniors();
    
    if (rows && rows.length > 0) {
      console.log(`[loadProfiles] Loaded ${rows.length} seniors from Supabase`);
      
      // Also fetch all transactions so profile.transactions arrays are populated
      let allTxns = [];
      try { 
        allTxns = await window.db.getTransactions();
        console.log(`[loadProfiles] Loaded ${allTxns.length} transactions from Supabase`);
      } catch(txnErr) {
        console.warn('[loadProfiles] Transaction load failed:', txnErr);
      }

      // Normalise Supabase snake_case fields to the camelCase the UI expects
      profiles = rows.map(r => {
        const seniorTxns = allTxns
          .filter(t => (t.senior_id || t.seniorId) === r.id)
          .map(t => ({
            ...t,
            seniorId:   t.senior_id   || t.seniorId,
            seniorName: t.senior_name || t.seniorName,
            merchantId: t.merchant_id || t.merchantId,
            scanDate:   t.scan_date   || t.scanDate
          }));
        return {
          ...r,
          registrationDate: r.registration_date || r.registrationDate || null,
          benefits: Array.isArray(r.benefits) ? r.benefits : [],
          transactions: seniorTxns.length > 0 ? seniorTxns : (r.transactions || [])
        };
      });
      // Sync local cache so synchronous helpers still work
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      if (allTxns.length) localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(allTxns));
      
      console.log(`[loadProfiles] SUCCESS: Loaded ${profiles.length} seniors with transactions`);
      return;
    } else {
      console.warn('[loadProfiles] Supabase returned no seniors');
    }
  } catch (e) {
    console.error('[loadProfiles] Database error:', e.message || e);
    const statusEl = document.getElementById('dbStatus');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = `<strong>⚠️ Database Error:</strong> ${e.message || 'Failed to connect to database'}. Check console for details.`;
    }
  }
  
  // No data available
  profiles = [];
  console.log('[loadProfiles] No data available - database may be offline or empty');
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
  // Always clear sessionStorage when the login page is reached.
  // This ensures logout always lands on a clean login form regardless of how
  // the user arrived (explicit logout, expired session, back-button, etc.)
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('lingap_user');

// Only auto-redirect if a *persistent* (Remember Me) session exists in localStorage.
// Do NOT rely on sessionStorage here — it may be stale if a page's logout
// failed to clear it before redirecting.
const ls = localStorage.getItem(LINGAP_SESSION_KEY);
if (ls) {
  try {
    const entry = JSON.parse(ls);
    if (entry && entry.role && (!entry.expiry || Date.now() <= entry.expiry)) {
      // Restore into sessionStorage so downstream page guards still work
      sessionStorage.setItem('currentUser', JSON.stringify({ role: entry.role, username: entry.username, id: entry.id }));
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768;
      // Redirect seniors to senior-mobile.php for mobile devices, otherwise senior.php
      if      (entry.role === 'senior')   { window.location.href = isMobile ? 'senior-mobile.php' : 'senior.php'; return; }
      else if (entry.role === 'merchant') { window.location.href = 'merchant.php'; return; }
      else if (entry.role === 'osca')     { window.location.href = 'osca.php'; return; }
      else if (entry.role === 'admin')    { window.location.href = 'admin.php'; return; }
    } else {
      // Expired — clean it up
      localStorage.removeItem(LINGAP_SESSION_KEY);
    }
  } catch(e) { localStorage.removeItem(LINGAP_SESSION_KEY); }
}
  // No valid persistent session — show login form normally
}

async function handleLogin(){
  const username = document.getElementById('username').value.trim().toLowerCase();
  const password = document.getElementById('password').value.trim();
  const msg      = document.getElementById('loginMsg');

  msg.style.display = 'none';

  // Guard: Supabase must be loaded
  if (!window.db || !window.supabaseClient) {
    msg.textContent = '⚠ Cannot connect to the server. Check your internet connection and refresh the page.';
    msg.className = 'error-msg';
    msg.style.display = 'block';
    return;
  }

  // Disable button + show loading
  const btn = document.getElementById('loginBtn');
  const origText = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

  try {
    // 1. Try Supabase users table
    let user = null;
    if (window.db) {
      user = await window.db.login(username, password);
    }

    // 2. Demo users disabled - use Supabase authentication only
    // if (!user) {
    //   const demo = DEMO_USERS.find(u => u.username === username && u.password === password);
    //   if (demo) user = demo;
    // }

    if (!user) {
      // Check if this username is a pending/rejected registration
      let pendingStatus = null;
      if (window.db) {
        const pr = await window.db.checkPendingUsername(username);
        if (pr) pendingStatus = pr.status;
      }
      if (pendingStatus === 'pending') {
        msg.textContent = 'Your account is awaiting admin approval. Please wait for confirmation before logging in.';
      } else if (pendingStatus === 'rejected') {
        msg.textContent = 'Your registration was not approved. Please contact the OSCA office for assistance.';
      } else {
        msg.textContent = 'Invalid username or password.';
      }
      msg.style.display = 'block';
      msg.className = 'error-msg';
      return;
    }

    // 3. Build session and redirect
    const role     = user.role;
    const remember = document.getElementById('rememberMe')?.checked || false;

    // Helper: persist PHP session then redirect
    const goTo = async (dest, sessionData) => {
      window._Session.set(sessionData, remember);
      try {
        await fetch('set-session.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sessionData)
        });
      } catch(e) { /* non-fatal — PHP session best-effort */ }
      window.location.href = dest;
    };

    if (role === 'senior') {
      const seniorId = user.senior_id || user.id || null;
      await goTo('senior.php', { role: 'senior', username, id: seniorId });
    } else if (role === 'merchant') {
      await goTo('merchant.php', { role: 'merchant', username, id: user.id || null });
    } else if (role === 'osca') {
      await goTo('osca.php', { role: 'osca', username, id: user.id || null });
    } else if (role === 'admin') {
      await goTo('admin.php', { role: 'admin', username, id: user.id || null });
    } else {
      const seniorId = user.senior_id || user.id || null;
      await goTo('senior.php', { role, username, id: seniorId });
    }
  } catch (e) {
    console.error('[login]', e);
    msg.textContent = 'Login error. Please try again.';
    msg.style.display = 'block';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = origText; }
  }
}

// ===== ADMIN =====
let hq=null;

// Pending registrations – populated from Supabase at runtime
let pendingRegistrations = [];

// Demo pending registrations removed - use Supabase only
const DEMO_PENDING_REGISTRATIONS = [];

function initAdmin(){
  const s = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
  if(!s || s.role!=='admin'){ location.href='index.php'; return; }
  
  console.log('[initAdmin] Admin session verified, starting dashboard initialization...');
  console.log('[initAdmin] Supabase client available:', !!window.supabaseClient);
  console.log('[initAdmin] DB functions available:', !!window.db);
  
  // Async load then render
  (async () => {
    try {
      console.log('[initAdmin] Loading seniors from database...');
      await loadProfiles();
      console.log('[initAdmin] Profiles loaded:', profiles.length, 'seniors');
      
      filterSeniors();
      populateReports();
      
      console.log('[initAdmin] Loading pending registrations...');
      await loadPendingRegistrations();
      
      updateSeniorStats();
      
      // Hide error message if data loaded successfully
      const statusEl = document.getElementById('dbStatus');
      if (statusEl && profiles.length > 0) {
        statusEl.style.display = 'none';
      }
    } catch (err) {
      console.error('[initAdmin] Failed to initialize:', err);
      const statusEl = document.getElementById('dbStatus');
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.innerHTML = `<strong>⚠️ Dashboard Error:</strong> ${err.message}. Check browser console for details.`;
      }
    }
  })();
  
// Admin panel buttons
const logoutBtnEl = document.getElementById('logoutBtn') || document.getElementById('logoutBtnProfile');
if (logoutBtnEl) logoutBtnEl.addEventListener('click', ()=>{ window._Session.clear(); location.href='logout.php'; });
  
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

  if(sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if(sortBy === 'id') {
    filtered.sort((a, b) => a.id.localeCompare(b.id));
  } else if(sortBy === 'age') {
    filtered.sort((a, b) => calculateAge(b.birth) - calculateAge(a.birth));
  } else if(sortBy === 'recent') {
    filtered.reverse();
  }

  filteredSeniorsCache = filtered;
  seniorsPage = 1;
  renderSeniorsPage();
}

function goToSeniorsPage(p) {
  const totalPages = Math.max(1, Math.ceil(filteredSeniorsCache.length / SENIORS_PAGE_SIZE));
  if (p < 1 || p > totalPages) return;
  seniorsPage = p;
  renderSeniorsPage();
}

function renderSeniorsPage() {
  const tbody = document.getElementById('seniorTable');
  if(!tbody) return;
  tbody.innerHTML = '';

  const total = filteredSeniorsCache.length;
  const totalPages = Math.max(1, Math.ceil(total / SENIORS_PAGE_SIZE));
  const start = (seniorsPage - 1) * SENIORS_PAGE_SIZE;
  const pageItems = filteredSeniorsCache.slice(start, start + SENIORS_PAGE_SIZE);

  if (total === 0) {
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
    pageItems.forEach((p) => {
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
  if (showingEl) showingEl.textContent = total === 0 ? '0' : `${start + 1}–${Math.min(start + SENIORS_PAGE_SIZE, total)}`;
  if (totalCountEl) totalCountEl.textContent = profiles.length;

  renderPagination(document.getElementById('seniorsPagination'), seniorsPage, totalPages, 'goToSeniorsPage');
}

async function loadPendingRegistrations() {
  console.log('loadPendingRegistrations called');
  const container = document.getElementById('pendingRegistrations');
  if (!container) { console.error('pendingRegistrations container not found!'); return; }

  if (window.db) {
    try {
      const rows = await window.db.getPendingRegistrations('pending');
      pendingRegistrations = rows.length > 0 ? rows.map(r => ({
        id:          r.id,
        name:        r.name,
        age:         r.age,
        birth:       r.birth       || r.birthday || null,
        birthday:    r.birthday    || r.birth    || null,
        gender:      r.gender,
        contact:     r.contact,
        address:     r.address,
        email:       r.email       || '',
        username:    r.username    || '',
        password:    r.password    || '',
        photo:       r.photo       || null,
        benefits:    r.notes       || '',
        dateApplied: r.date_applied || r.dateApplied,
        status:      r.status,
        documents:   []
      })) : [];
    } catch (e) {
      console.warn('[loadPendingRegistrations] Supabase error, no demo data available', e);
      pendingRegistrations = [];
    }
  } else {
    pendingRegistrations = [];
  }

  renderFilteredRegistrations(pendingRegistrations);
  const countEl  = document.getElementById('pendingCount');
  if (countEl)  countEl.textContent  = pendingRegistrations.length;
  const countBar = document.getElementById('pendingCountBar');
  if (countBar) countBar.textContent = pendingRegistrations.length;
}

function filterPendingRegistrations(query) {
  const q = (query || '').toLowerCase().trim();
  const filtered = q ? pendingRegistrations.filter(r =>
    (r.name || '').toLowerCase().includes(q) || (r.id || '').toLowerCase().includes(q)
  ) : pendingRegistrations;
  renderFilteredRegistrations(filtered);
}

function renderFilteredRegistrations(list) {
  filteredRegsCache = list;
  regsPage = 1;
  renderRegsPage();
}

function goToRegsPage(p) {
  const totalPages = Math.max(1, Math.ceil(filteredRegsCache.length / REGS_PAGE_SIZE));
  if (p < 1 || p > totalPages) return;
  regsPage = p;
  renderRegsPage();
}

function renderRegsPage() {
  const container = document.getElementById('pendingRegistrations');
  if(!container) return;
  container.innerHTML = '';

  const total = filteredRegsCache.length;
  if(total === 0) {
    container.innerHTML = `
      <div style="padding:56px 20px;background:#fff;border:1px solid var(--border);border-radius:8px;text-align:center">
        <div style="width:64px;height:64px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <p style="margin:0;font-size:15px;font-weight:700;color:#374151">No pending registrations</p>
        <p style="margin:6px 0 0;font-size:13px;color:#6b7280">New applications will appear here for review</p>
      </div>`;
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / REGS_PAGE_SIZE));
  const start = (regsPage - 1) * REGS_PAGE_SIZE;
  const pageItems = filteredRegsCache.slice(start, start + REGS_PAGE_SIZE);

  pageItems.forEach((reg) => {
    const realIdx = pendingRegistrations.indexOf(reg);
    const age = calculateAge(reg.birth);
    const initials = (reg.name || '').split(' ').map(w => w[0]).join('').substring(0,2).toUpperCase();
    const avatarColors = ['#22c55e','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#06b6d4'];
    const avatarBg = avatarColors[realIdx % avatarColors.length];
    const genderBg = (reg.gender||'').toLowerCase() === 'female' ? '#fdf2f8' : '#eff6ff';
    const genderColor = (reg.gender||'').toLowerCase() === 'female' ? '#be185d' : '#1d4ed8';
    const appliedDate = reg.dateApplied ? new Date(reg.dateApplied).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'}) : '—';

    const card = document.createElement('div');
    card.style.cssText = 'background:#fff;border:1px solid var(--border);border-radius:8px;padding:20px;transition:box-shadow 0.2s';
    card.onmouseover = () => card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)';
    card.onmouseout  = () => card.style.boxShadow = 'none';
    card.innerHTML = `
      <div style="display:flex;gap:16px;align-items:start">
        <!-- Avatar -->
        <div style="width:52px;height:52px;background:${avatarBg};border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:18px;flex-shrink:0;letter-spacing:-1px">${initials}</div>

        <!-- Main info -->
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">
            <h4 style="margin:0;font-size:16px;font-weight:800;color:#1f2937">${reg.name}</h4>
            <span style="font-size:11px;font-weight:700;font-family:monospace;color:#6b7280;background:#f3f4f6;border-radius:4px;padding:2px 8px">${reg.id}</span>
          </div>

          <!-- Tags -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
            <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:#dcfce7;color:#15803d;border-radius:6px;font-size:12px;font-weight:700">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Age ${age}
            </span>
            <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:${genderBg};color:${genderColor};border-radius:6px;font-size:12px;font-weight:700">
              ${reg.gender || '—'}
            </span>
            <span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;background:#fef3c7;color:#92400e;border-radius:6px;font-size:12px;font-weight:700">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Applied ${appliedDate}
            </span>
          </div>

          <!-- Details grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;padding:14px;background:#f9fafb;border-radius:8px;border:1px solid #f3f4f6">
            <div>
              <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Contact</div>
              <div style="font-size:13px;font-weight:600;color:#374151">${reg.contact || '—'}</div>
              ${reg.email ? `<div style="font-size:12px;color:#6b7280;margin-top:1px">${reg.email}</div>` : ''}
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Address</div>
              <div style="font-size:13px;font-weight:600;color:#374151">${reg.address || '—'}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Benefits Requested</div>
              <div style="font-size:13px;font-weight:600;color:#374151">${reg.benefits || '—'}</div>
            </div>
            <div>
              <div style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px">Documents</div>
              <div style="font-size:12px;color:#374151">${(reg.documents||[]).join(', ') || '—'}</div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div style="display:flex;flex-direction:column;gap:7px;flex-shrink:0">
          <button class="btn" onclick="approveRegistration(${realIdx})" style="white-space:nowrap;padding:8px 16px;font-size:13px;display:flex;align-items:center;gap:6px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Approve
          </button>
          <button class="btn ghost" onclick="viewRegistrationDetails(${realIdx})" style="white-space:nowrap;padding:8px 16px;font-size:13px;display:flex;align-items:center;gap:6px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View
          </button>
          <button class="btn ghost" onclick="rejectRegistration(${realIdx})" style="white-space:nowrap;padding:8px 16px;font-size:13px;color:#ef4444;border-color:#fca5a5;display:flex;align-items:center;gap:6px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Reject
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Update pending counts
  const countEl = document.getElementById('pendingCount');
  if(countEl) countEl.textContent = pendingRegistrations.length;
  const countBar = document.getElementById('pendingCountBar');
  if(countBar) countBar.textContent = pendingRegistrations.length;

  renderPagination(document.getElementById('regsPagination'), regsPage, totalPages, 'goToRegsPage');
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
  if (!birthDate) return 0;
  const parts = String(birthDate).split('-');
  const birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
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

  // Persist to Supabase
  if (window.db) {
    if (isUpdate) {
      window.db.updateSenior(id, rec).catch(e => console.error('[saveSenior]', e));
    } else {
      window.db.addSenior(rec).catch(e => console.error('[saveSenior]', e));
    }
  }

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
  const currentUser  = JSON.parse(sessionStorage.getItem('lingap_user') || '{}');
  const merchantId   = currentUser.username || 'unknown';
  const today        = new Date().toLocaleDateString('en-US');
  // Check local cache first (fast path)
  const allTransactions = JSON.parse(localStorage.getItem('lingap_transactions') || '[]');
  return allTransactions.some(txn =>
    (txn.seniorId || txn.senior_id) === seniorId &&
    (txn.merchantId || txn.merchant_id) === merchantId &&
    (txn.scanDate   || txn.scan_date)   === today
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
  // Define date range for "last 30 days"
  const now = new Date();
  now.setHours(23,59,59,999);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 29);
  thirtyDaysAgo.setHours(0,0,0,0);

  // ===== UPDATE DASHBOARD METRIC CARDS =====
  const totalSeniorsEl = document.getElementById('reportTotalSeniors');
  const activeSeniorsEl = document.getElementById('reportActiveSeniors');
  const totalTransactionsEl = document.getElementById('reportTotalTransactions');
  
  const total = profiles.length;
  const totalTxns = profiles.reduce((sum, p) => sum + (p.transactions || []).length, 0);
  const recentTxns = profiles.reduce((sum, p) => 
    sum + ((p.transactions || [])
      .filter(t => new Date(t.timestamp) >= thirtyDaysAgo).length), 0);

  if(totalSeniorsEl) totalSeniorsEl.textContent = total;
  if(activeSeniorsEl) activeSeniorsEl.textContent = recentTxns;
  if(totalTransactionsEl) totalTransactionsEl.textContent = totalTxns;
  
  console.log('[populateReports] Updated main dashboard cards - Seniors:', total, 'Recent Txns:', recentTxns, 'Total Txns:', totalTxns);
  
  // ===== CALCULATE GENDER DISTRIBUTION =====
  const genders = profiles.reduce((acc,p)=>{
    const g = (p.gender || 'Unknown');
    acc[g] = (acc[g]||0) + 1;
    return acc;
  },{});

  const femaleCount = genders['Female'] || 0;
  const maleCount = genders['Male'] || 0;
  
  // ===== UPDATE SENIORS TAB STATS =====
  const totalSeniorsCountEl = document.getElementById('totalSeniorsCount');
  const femaleCountEl = document.getElementById('femaleCount');
  const maleCountEl = document.getElementById('maleCount');
  const activeCountEl = document.getElementById('activeCount');
  
  if(totalSeniorsCountEl) totalSeniorsCountEl.textContent = total;
  if(femaleCountEl) femaleCountEl.textContent = femaleCount;
  if(maleCountEl) maleCountEl.textContent = maleCount;
  if(activeCountEl) activeCountEl.textContent = recentTxns;
  
  // ===== CALCULATE AGE GROUPS =====
  const ageGroups = {
    '60-65': 0,
    '66-70': 0,
    '71-75': 0,
    '76-80': 0,
    '81+': 0
  };
  
  profiles.forEach(p => {
    if (p.birth) {
      const age = Math.floor((new Date() - new Date(p.birth)) / 31557600000);
      if (age >= 60 && age <= 65) ageGroups['60-65']++;
      else if (age >= 66 && age <= 70) ageGroups['66-70']++;
      else if (age >= 71 && age <= 75) ageGroups['71-75']++;
      else if (age >= 76 && age <= 80) ageGroups['76-80']++;
      else if (age > 80) ageGroups['81+']++;
    }
  });
  
  // ===== CALCULATE BENEFITS DISTRIBUTED =====
  const benefitsMap = {};
  let totalBenefitsValue = 0;
  profiles.forEach(p=>{
    let benefitsList = [];
    if (Array.isArray(p.benefits)) {
      benefitsList = p.benefits;
    } else if (typeof p.benefits === 'string' && p.benefits) {
      benefitsList = p.benefits.split(',').map(s=>s.trim()).filter(Boolean);
    }
    benefitsList.forEach(b=>{
      benefitsMap[b] = (benefitsMap[b]||0) + 1;
      // Estimate benefit values
      if(b.includes('Medical')) totalBenefitsValue += 5000;
      else if(b.includes('Pension')) totalBenefitsValue += 1500;
      else if(b.includes('Transport')) totalBenefitsValue += 500;
    });
  });
  
  const totalBenefitsEl = document.getElementById('reportTotalBenefits');
  if(totalBenefitsEl) totalBenefitsEl.textContent = totalBenefitsValue.toLocaleString();
  
  console.log('[populateReports] Gender breakdown:', genders, 'Age groups:', ageGroups);

  // ===== RENDER GENDER PIE CHART =====
  try {
    const genderCtx = document.getElementById('genderChart');
    if(genderCtx && typeof Chart !== 'undefined') {
      // Destroy previous chart if exists
      if(window._genderChart) { 
        try { window._genderChart.destroy(); } catch(e) {}
      }
      
      const genderLabels = Object.keys(genders);
      const genderData = genderLabels.map(l => genders[l]);
      
      window._genderChart = new Chart(genderCtx, {
        type: 'doughnut',
        data: {
          labels: genderLabels,
          datasets: [{
            data: genderData,
            backgroundColor: ['#ec4899', '#06b6d4', '#f59e0b', '#6b7280'],
            borderColor: ['#fff', '#fff', '#fff', '#fff'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 20, font: { size: 13 }, usePointStyle: true }
            }
          }
        }
      });
      console.log('[populateReports] Rendered gender chart');
    }
  } catch(e) {
    console.warn('[populateReports] Gender chart error:', e.message);
  }

  // ===== RENDER AGE DISTRIBUTION CHART =====
  try {
    const ageCtx = document.getElementById('ageChart');
    if(ageCtx && typeof Chart !== 'undefined') {
      // Destroy previous chart if exists
      if(window._ageChart) { 
        try { window._ageChart.destroy(); } catch(e) {}
      }
      
      const ageLabels = Object.keys(ageGroups);
      const ageData = ageLabels.map(l => ageGroups[l]);
      
      window._ageChart = new Chart(ageCtx, {
        type: 'bar',
        data: {
          labels: ageLabels,
          datasets: [{
            label: 'Number of Seniors',
            data: ageData,
            backgroundColor: '#22c55e',
            borderColor: '#16a34a',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          }
        }
      });
      console.log('[populateReports] Rendered age chart');
    }
  } catch(e) {
    console.warn('[populateReports] Age chart error:', e.message);
  }

  // ===== RENDER TRANSACTION ACTIVITY CHART =====
  try {
    const activityCtx = document.getElementById('activityChart');
    if(activityCtx && typeof Chart !== 'undefined') {
      // Destroy previous chart if exists
      if(window._activityChart) { 
        try { window._activityChart.destroy(); } catch(e) {}
      }
      
      // Generate dates for last 30 days
      const dateMap = {};
      const dateList = [];
      for(let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateList.push(dateStr);
        dateMap[dateStr] = 0;
      }

      // Count transactions per date
      profiles.forEach(p => {
        (p.transactions || []).forEach(t => {
          const txDate = new Date(t.timestamp);
          if(txDate >= thirtyDaysAgo && txDate <= now) {
            const dateStr = txDate.toISOString().split('T')[0];
            if(dateMap[dateStr] !== undefined) {
              dateMap[dateStr]++;
            }
          }
        });
      });

      const activityLabels = dateList.map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'}));
      const activityData = dateList.map(d => dateMap[d]);

      window._activityChart = new Chart(activityCtx, {
        type: 'line',
        data: {
          labels: activityLabels,
          datasets: [{
            label: 'Transactions',
            data: activityData,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34,197,94,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 3,
            pointHoverRadius: 5,
            pointBackgroundColor: '#22c55e'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { position: 'top' }
          },
          scales: {
            y: { 
              beginAtZero: true,
              ticks: { precision: 0, stepSize: 1 },
              suggestedMax: Math.max(5, Math.max(...activityData) + 1)
            }
          }
        }
      });
      console.log('[populateReports] Rendered activity chart');
    }
  } catch(e) {
    console.warn('[populateReports] Activity chart error:', e.message);
  }
  
  console.log('[populateReports] All dashboard data populated successfully');
}

// Update dashboard statistics cards

// ===== SENIOR =====
function initSenior(){
  const s = getSession(); if(!s || s.role!=='senior'){ location.href='index.php'; return; }
  loadProfiles();
  const myId = s.seniorId || 'LGAPU-001';
  const me = profiles.find(p=>p.id===myId);
  if(!me){ alert('Profile not found'); location.href='index.php'; return; }
  renderSenior(me);
  document.getElementById('logoutSenior').addEventListener('click', ()=>{ window._Session.clear(); location.href='logout.php'; });
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
function getSession(){ 
  try { 
    return JSON.parse(sessionStorage.getItem('currentUser')); 
  } catch(e) { 
    console.warn('[getSession] Failed to parse session:', e);
    return null; 
  } 
}
