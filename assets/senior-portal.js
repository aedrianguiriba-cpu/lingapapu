// Senior Portal - Main JavaScript
const PROFILES_KEY = 'lingap_profiles_v3';
const TRANSACTIONS_KEY = 'lingap_transactions';
const BENEFITS_KEY = 'lingap_benefits_v1';

let currentUser = null;

// ---- Senior Portal Pagination ----
let txPage = 1, seniorBenefitsPage = 1;
const TX_PAGE_SIZE = 8, SP_BENEFITS_PAGE_SIZE = 6;

// Pagination renderer (senior side)
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

// Initialize portal
async function initSeniorPortal() {
    console.log('Initializing senior portal...');

    // Check if user is logged in
    const sessionRaw = sessionStorage.getItem('currentUser');
    if (!sessionRaw) {
        window.location.href = 'index.php';
        return;
    }

    const session = JSON.parse(sessionRaw);
    if (!session.id || session.role !== 'senior') {
        window.location.href = 'index.php';
        return;
    }

    // Try to load from Supabase first
    if (window.db) {
        try {
            currentUser = await window.db.getSeniorById(session.id);
        } catch (e) {
            console.warn('[senior-portal] Supabase fetch failed, trying localStorage', e);
        }
    }

    // Fallback to localStorage if Supabase didn't return data
    if (!currentUser) {
        const profilesRaw = localStorage.getItem(PROFILES_KEY);
        if (!profilesRaw) {
            alert('No profiles found in system. Please contact administrator.');
            window.location.href = 'index.php';
            return;
        }
        const profilesArr = JSON.parse(profilesRaw);
        currentUser = profilesArr.find(p => p.id === session.id) || null;
    }

    if (!currentUser) {
        alert('Your profile was not found. Please contact administrator.');
        window.location.href = 'index.php';
        return;
    }

    // Normalise field names
    currentUser.registrationDate = currentUser.registrationDate || currentUser.registration_date || null;
    currentUser.benefits = Array.isArray(currentUser.benefits) ? currentUser.benefits : [];

    // Load from the dedicated user_benefits table (authoritative source after OSCA acceptance).
    // This overrides the snapshot in seniors.benefits so the portal is always up-to-date.
    if (window.db && currentUser.id) {
        try {
            const ubRows = await window.db.getUserBenefits(currentUser.id);
            if (ubRows && ubRows.length > 0) {
                currentUser.benefits = ubRows.map(r => r.benefit_name);
                currentUser.userBenefitsDetail = ubRows; // keep full rows for display (assigned_by, assigned_at)
                console.log('[senior-portal] Loaded', ubRows.length, 'benefit(s) from user_benefits table');
            } else {
                console.log('[senior-portal] No user_benefits rows found; using seniors.benefits snapshot');
            }
        } catch (e) {
            console.warn('[senior-portal] Could not load user_benefits from Supabase', e);
        }
    }

    // Pre-load transactions from Supabase into localStorage cache for getTransactions()
    if (window.db) {
        try {
            const txns = await window.db.getTransactions(currentUser.id);
            if (txns && txns.length > 0) {
                // Normalise and merge into localStorage so getTransactions() works
                const normalised = txns.map(t => ({
                    ...t,
                    seniorId:   t.senior_id   || t.seniorId,
                    seniorName: t.senior_name || t.seniorName,
                    merchantId: t.merchant_id || t.merchantId,
                    scanDate:   t.scan_date   || t.scanDate
                }));
                localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(normalised));
            }
        } catch (e) {
            console.warn('[senior-portal] Could not load transactions from Supabase', e);
        }
    }

    // Pre-load benefits from Supabase into localStorage cache
    if (window.db) {
        try {
            const bens = await window.db.getBenefits();
            if (bens && bens.length > 0) {
                localStorage.setItem(BENEFITS_KEY, JSON.stringify(bens));
            }
        } catch (e) {
            console.warn('[senior-portal] Could not load benefits from Supabase', e);
        }
    }

    console.log('User loaded:', currentUser);

    // Initialize all sections
    try {
        loadDashboard();
        loadBenefits();
        loadProfile();
        loadTransactions();

        setTimeout(() => {
            if (typeof QRCode !== 'undefined') loadQRCodes();
        }, 500);
    } catch (error) {
        console.error('Error loading sections:', error);
    }

    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (window._Session) { window._Session.clear(); } else { sessionStorage.removeItem('currentUser'); localStorage.removeItem('lingap_session'); }
        window.location.href = 'logout.php';
    });

    // Update profile form
    document.getElementById('updateProfileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        updateProfile();
    });

    // QR generation
    document.getElementById('downloadUniversalQR').addEventListener('click', () => downloadQR('universalQR', 'universal-qr'));

    // Mobile nav toggle
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
            mainNav.classList.toggle('active');
        });
    }
}

// Load Dashboard
function loadDashboard() {
    // Welcome message
    const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Senior';
    const greetingNameEl = document.getElementById('dashGreetingName');
    if (greetingNameEl) greetingNameEl.textContent = firstName;
    document.getElementById('welcomeMessage').textContent = `ID: ${currentUser.id} · Age: ${currentUser.age || '—'} · ${currentUser.barangay || currentUser.address || ''}`.trim().replace(/·\s*$/, '');

    // Live clock
    function updateClock() {
        const now = new Date();
        const clockEl = document.getElementById('dashClock');
        const dateEl = document.getElementById('dashDate');
        if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (dateEl) dateEl.textContent = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Stats
    const transactions = getTransactions();
    const benefits = currentUser.benefits || [];

    document.getElementById('dashBenefitsCount').textContent = benefits.length;
    document.getElementById('dashTransactionsCount').textContent = transactions.length;

    // Senior ID card
    const seniorIdEl = document.getElementById('dashSeniorId');
    if (seniorIdEl) seniorIdEl.textContent = currentUser.id;
    const memberSinceEl = document.getElementById('dashMemberSince');
    if (memberSinceEl) {
        const reg = currentUser.registrationDate || currentUser.dateRegistered || currentUser.createdAt;
        memberSinceEl.textContent = reg ? 'Since ' + new Date(reg).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' }) : 'Registered member';
    }

    // Last activity
    const lastActivityEl = document.getElementById('dashLastActivity');
    const lastActivityTypeEl = document.getElementById('dashLastActivityType');
    if (transactions.length > 0) {
        const last = transactions[transactions.length - 1];
        const date = new Date(last.timestamp);
        if (lastActivityEl) lastActivityEl.textContent = formatDate(date);
        if (lastActivityTypeEl) lastActivityTypeEl.textContent = last.type || 'Transaction';
    }

    // Recent activity
    const recentActivity = document.getElementById('dashRecentActivity');
    if (transactions.length === 0) {
        recentActivity.innerHTML = `
            <div style="text-align:center;padding:48px 20px">
                <div style="width:56px;height:56px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <p style="color:#6b7280;font-size:15px;font-weight:600;margin:0">No recent activity</p>
                <p style="color:#9ca3af;font-size:13px;margin:6px 0 0">Your transactions will appear here</p>
            </div>
        `;
    } else {
        const typeColors = { 'QR Scan': '#22c55e', 'Benefit Claim': '#3b82f6', 'Registration': '#8b5cf6', 'Verification': '#f59e0b' };
        const typeIcons = {
            'QR Scan': '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/><path d="M17 17h4v4h-4z"/><path d="M13 17h1v4h-1z"/>',
            'Benefit Claim': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
            'default': '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
        };
        recentActivity.innerHTML = transactions.slice(-5).reverse().map(t => {
            const color = typeColors[t.type] || '#6b7280';
            const icon = typeIcons[t.type] || typeIcons['default'];
            return `
            <div style="padding:14px 0;border-bottom:1px solid #f3f4f6;display:flex;align-items:center;gap:14px">
                <div style="width:38px;height:38px;background:${color}18;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">${icon}</svg>
                </div>
                <div style="flex:1;min-width:0">
                    <div style="font-size:14px;font-weight:600;color:#1f2937">${t.type || 'Transaction'}</div>
                    <div style="font-size:12px;color:#6b7280;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.note || 'No details'}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:12px;font-weight:600;color:#374151">${formatDate(new Date(t.timestamp))}</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:2px">${new Date(t.timestamp).toLocaleTimeString('en-PH', {hour:'2-digit',minute:'2-digit'})}</div>
                </div>
            </div>
            `;
        }).join('');
    }
}

// Default benefit programs shown when Supabase table is empty
const DEFAULT_BENEFIT_PROGRAMS = [
    { id: 'BEN001', name: 'Social Pension Program', description: 'Monthly financial assistance for indigent senior citizens', amount: 500, frequency: 'Monthly', active: true, eligibility: 'Indigent seniors 60+', coverage: 'Cash assistance' },
    { id: 'BEN002', name: 'Medical/Dental Assistance', description: 'Healthcare support including medicines, laboratory, and dental services', amount: 1000, frequency: 'As needed', active: true, eligibility: 'All senior citizens', coverage: 'Medical and dental services' },
    { id: 'BEN003', name: 'Burial Assistance', description: 'Financial assistance to bereaved families of deceased senior citizens', amount: 2000, frequency: 'One-time', active: true, eligibility: 'Deceased senior citizens', coverage: 'Funeral and burial expenses' },
    { id: 'BEN004', name: 'Food Assistance (Grocery Package)', description: 'Monthly grocery package for indigent senior citizens', amount: 500, frequency: 'Monthly', active: true, eligibility: 'Indigent seniors', coverage: 'Basic food commodities' },
    { id: 'BEN005', name: 'Housing Assistance', description: 'Support for home improvement and repair for indigent seniors', amount: 5000, frequency: 'One-time', active: true, eligibility: 'Indigent seniors with inadequate housing', coverage: 'Home repair materials and labor' },
    { id: 'BEN006', name: '20% Senior Discount', description: 'Mandatory 20% discount on purchases and services nationwide', amount: 0, frequency: 'Always Available', active: true, eligibility: 'All senior citizens with valid ID', coverage: 'Restaurants, drugstores, groceries, hotels, transportation, recreation' },
    { id: 'BEN007', name: 'Free Medical Checkup', description: 'Regular health monitoring and preventive care services', amount: 0, frequency: 'Monthly', active: true, eligibility: 'All registered seniors', coverage: 'Blood pressure, blood sugar, general consultation, vitamins' },
    { id: 'BEN008', name: 'Birthday Gift', description: 'Birthday cash gift or incentive for senior citizens', amount: 1000, frequency: 'Yearly', active: true, eligibility: 'Birthday celebrants (birth month)', coverage: 'One-time birthday cash assistance' },
];

// Load Benefits
function loadBenefits() {
    let allPrograms = JSON.parse(localStorage.getItem(BENEFITS_KEY) || '[]');
    // Fallback: if Supabase table is empty, show default programs so seniors always see something
    if (allPrograms.length === 0) {
        allPrograms = DEFAULT_BENEFIT_PROGRAMS;
    }

    const userBenefitIds = currentUser.benefits || [];

    // Build enrolled cards first — match by name (case-insensitive); synthesize a card if not
    // found in the programs list (handles name mismatches between Supabase tables gracefully)
    const enrolledItems = userBenefitIds.map(name => {
        const match = allPrograms.find(p => (p.name || '').toLowerCase() === (name || '').toLowerCase());
        return match || {
            id: name, name,
            description: 'Assigned benefit program',
            amount: 0, frequency: 'As provided', active: true,
            eligibility: 'Assigned by OSCA', coverage: ''
        };
    });

    // Remaining active programs not already shown in enrolled list
    const enrolledNamesLower = enrolledItems.map(b => (b.name || '').toLowerCase());
    const otherPrograms = allPrograms.filter(b =>
        b.active !== false && !enrolledNamesLower.includes((b.name || '').toLowerCase())
    );

    // Enrolled programs first, then other available programs
    const displayBenefits = [...enrolledItems, ...otherPrograms];
    const enrolledCount = enrolledItems.length;  // direct count — no name-matching needed

    const benefitsList = document.getElementById('benefitsList');
    const countBadge = document.getElementById('benefitsCountBadge');
    if (countBadge) countBadge.textContent = `${enrolledCount} Enrolled · ${displayBenefits.length} Available`;

    const benefitIcons = {
        'medical': '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
        'burial': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'pension': '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
        'discount': '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
        'food': '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
        'housing': '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        'birthday': '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
        'default': '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
    };

    const benefitColors = [
        { border: '#22c55e', bg: '#dcfce7', text: '#15803d' },
        { border: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
        { border: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9' },
        { border: '#f59e0b', bg: '#fffbeb', text: '#b45309' },
        { border: '#ec4899', bg: '#fdf2f8', text: '#be185d' },
        { border: '#14b8a6', bg: '#f0fdfa', text: '#0f766e' },
    ];

    const totalBenefitPages = Math.max(1, Math.ceil(displayBenefits.length / SP_BENEFITS_PAGE_SIZE));
    seniorBenefitsPage = Math.min(Math.max(1, seniorBenefitsPage), totalBenefitPages);
    const bStart = (seniorBenefitsPage - 1) * SP_BENEFITS_PAGE_SIZE;
    const bPageItems = displayBenefits.slice(bStart, bStart + SP_BENEFITS_PAGE_SIZE);

    benefitsList.innerHTML = bPageItems.map((b, i) => {
        const color = benefitColors[(bStart + i) % benefitColors.length];
        const nameLower = (b.name || '').toLowerCase();
        const isEnrolled = enrolledNamesLower.includes((b.name || '').toLowerCase());
        const isAlwaysAvailable = (b.frequency || '').toLowerCase().includes('always') ||
                                  (b.eligibility || '').toLowerCase().includes('all senior');
        let iconPath = benefitIcons['default'];
        if (nameLower.includes('medical') || nameLower.includes('dental')) iconPath = benefitIcons['medical'];
        else if (nameLower.includes('burial')) iconPath = benefitIcons['burial'];
        else if (nameLower.includes('pension')) iconPath = benefitIcons['pension'];
        else if (nameLower.includes('discount')) iconPath = benefitIcons['discount'];
        else if (nameLower.includes('food') || nameLower.includes('grocery')) iconPath = benefitIcons['food'];
        else if (nameLower.includes('housing') || nameLower.includes('home')) iconPath = benefitIcons['housing'];
        else if (nameLower.includes('birthday') || nameLower.includes('incentive') || nameLower.includes('centenarian')) iconPath = benefitIcons['birthday'];

        // Badge: Enrolled (green), Always Available (blue), Available (gray)
        let badgeBg, badgeColor, badgeText;
        if (isEnrolled) {
            badgeBg = '#d1fae5'; badgeColor = '#059669'; badgeText = 'Enrolled';
        } else if (isAlwaysAvailable) {
            badgeBg = '#dbeafe'; badgeColor = '#1d4ed8'; badgeText = 'Available to All';
        } else {
            badgeBg = '#f3f4f6'; badgeColor = '#6b7280'; badgeText = 'Available';
        }

        return `
        <div style="background:#ffffff;border:1px solid var(--border);border-top:3px solid ${color.border};border-radius:8px;padding:20px;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'">
            <div style="display:flex;align-items:start;gap:14px;margin-bottom:14px">
                <div style="width:44px;height:44px;background:${color.bg};border:1px solid ${color.border};border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color.border}" stroke-width="2">${iconPath}</svg>
                </div>
                <div style="flex:1;min-width:0">
                    <h3 style="margin:0;font-size:15px;font-weight:700;color:#1f2937;line-height:1.3">${b.name}</h3>
                    <span style="display:inline-block;margin-top:4px;padding:2px 10px;background:${badgeBg};color:${badgeColor};border-radius:12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px">${badgeText}</span>
                </div>
            </div>
            <p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.5">${b.description || 'No description available'}</p>
            ${b.coverage ? `<p style="margin:0 0 14px;color:#9ca3af;font-size:12px;line-height:1.4"><strong style="color:#6b7280">Covers:</strong> ${b.coverage}</p>` : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:14px;border-top:1px solid #f3f4f6">
                <div style="background:${color.bg};border-radius:6px;padding:10px 12px">
                    <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Amount</div>
                    <div style="font-size:20px;font-weight:800;color:${color.border}">${b.amount > 0 ? '₱' + Number(b.amount).toLocaleString() : 'Varies'}</div>
                </div>
                <div style="background:#f9fafb;border-radius:6px;padding:10px 12px">
                    <div style="font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">Frequency</div>
                    <div style="font-size:14px;font-weight:700;color:#374151">${b.frequency || 'One-time'}</div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    renderPagination(document.getElementById('benefitsListPagination'), seniorBenefitsPage, totalBenefitPages, 'goToSeniorBenefitsPage');
}

function goToSeniorBenefitsPage(p) {
    let allPrograms = JSON.parse(localStorage.getItem(BENEFITS_KEY) || '[]');
    if (allPrograms.length === 0) allPrograms = DEFAULT_BENEFIT_PROGRAMS;
    const userBenefitIds = currentUser.benefits || [];
    const enrolledNamesLower = userBenefitIds.map(n => (n || '').toLowerCase());
    const otherPrograms = allPrograms.filter(b =>
        b.active !== false && !enrolledNamesLower.includes((b.name || '').toLowerCase())
    );
    const displayBenefits = [...userBenefitIds.map(name => {
        const match = allPrograms.find(pr => (pr.name || '').toLowerCase() === (name || '').toLowerCase());
        return match || { id: name, name, description: 'Assigned benefit program', amount: 0, frequency: 'As provided', active: true, eligibility: 'Assigned by OSCA', coverage: '' };
    }), ...otherPrograms];
    const totalPages = Math.max(1, Math.ceil(displayBenefits.length / SP_BENEFITS_PAGE_SIZE));
    if (p < 1 || p > totalPages) return;
    seniorBenefitsPage = p;
    loadBenefits();
}

// Load Profile
function loadProfile() {
    console.log('Loading profile...');

    // --- Banner ---
    const bannerNameEl = document.getElementById('profileBannerName');
    const bannerSubEl  = document.getElementById('profileBannerSub');
    const bannerAgeEl  = document.getElementById('profileBannerAge');
    const bannerIdEl   = document.getElementById('profileBannerId');
    if (bannerNameEl) bannerNameEl.textContent = currentUser.name || 'Senior';
    if (bannerSubEl)  bannerSubEl.textContent  = `${currentUser.barangay || currentUser.address || 'Floridablanca, Pampanga'}`;
    if (bannerAgeEl)  bannerAgeEl.textContent  = currentUser.age ? `${currentUser.age} yrs` : '—';
    if (bannerIdEl)   bannerIdEl.textContent   = currentUser.id || '—';

    // --- Try to show photo in banner avatar ---
    const savedPhoto = localStorage.getItem(`profile_photo_${currentUser.id}`);
    const avatarEl = document.getElementById('profileBannerAvatar');
    if (savedPhoto && avatarEl) {
        avatarEl.innerHTML = `<img src="${savedPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    }

    // --- Info chips ---
    const chipsEl = document.getElementById('profileInfoChips');
    if (chipsEl) {
        const chips = [
            { icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', label: 'Registered', value: currentUser.registrationDate ? formatDate(new Date(currentUser.registrationDate)) : '—' },
            { icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', label: 'Sex', value: currentUser.sex || currentUser.gender || '—' },
            { icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', label: 'Barangay', value: currentUser.barangay || '—' },
            { icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.47 13 19.79 19.79 0 0 1 1.29 4.31 2 2 0 0 1 3.26 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.4a16 16 0 0 0 6.29 6.29l.77-.77a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z"/>', label: 'Contact', value: currentUser.contact || '—' },
        ];
        chipsEl.innerHTML = chips.map(c => `
            <div style="display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--border);border-radius:8px;padding:8px 14px;font-size:13px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" style="flex-shrink:0">${c.icon}</svg>
                <span style="color:#6b7280;font-weight:500">${c.label}:</span>
                <span style="color:#1f2937;font-weight:700">${c.value}</span>
            </div>
        `).join('');
    }

    // --- Personal Info Grid ---
    const infoGrid = document.getElementById('profileInfoGrid');
    if (infoGrid) {
        const fields = [
            { label: 'Full Name',    value: currentUser.name || '—' },
            { label: 'Date of Birth', value: currentUser.birth || '—' },
            { label: 'Age',          value: currentUser.age ? `${currentUser.age} years old` : '—' },
            { label: 'Sex',          value: currentUser.sex || currentUser.gender || '—' },
            { label: 'Barangay',     value: currentUser.barangay || '—' },
            { label: 'Civil Status', value: currentUser.civilStatus || '—' },
        ];
        infoGrid.innerHTML = fields.map(f => `
            <div style="background:#fff;border:1px solid var(--border);border-radius:6px;padding:10px 12px">
                <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${f.label}</div>
                <div style="font-size:13px;font-weight:700;color:#1f2937">${f.value}</div>
            </div>
        `).join('');
    }

    // --- ID Card ---
    document.getElementById('idCardNumber').textContent = currentUser.id;
    document.getElementById('idCardName').textContent = currentUser.name;
    document.getElementById('idCardBirth').textContent = currentUser.birth;
    document.getElementById('idCardAge').textContent = `${currentUser.age} years`;
    document.getElementById('idCardContact').textContent = currentUser.contact || 'Not provided';
    document.getElementById('idCardAddress').textContent = currentUser.address || 'Not provided';
    // Check for registration date in both camelCase and snake_case versions
    const reg = currentUser.registrationDate || currentUser.dateRegistered || 
                currentUser.registration_date || currentUser.createdAt || 
                currentUser.created_at;
    document.getElementById('idCardRegistered').textContent = reg ? formatDate(new Date(reg)) : 'Not registered';

    // Load profile photo
    loadProfilePhoto();

    // Load QR code on ID card after delay
    setTimeout(() => {
        console.log('=== Loading ID Card QR ===');
        loadIDCardQR();
    }, 300);

    // Fill update form
    document.getElementById('updateContact').value = currentUser.contact || '';
    document.getElementById('updateAddress').value = currentUser.address || '';
    document.getElementById('updateNotes').value = currentUser.notes || '';
    const _ub = document.getElementById('updateBarangay');
    if (_ub) _ub.value = currentUser.barangay || '';
    const _ucs = document.getElementById('updateCivilStatus');
    if (_ucs) _ucs.value = currentUser.civilStatus || currentUser.civil_status || '';
}

// Load QR code for ID card (universal QR)
function loadIDCardQR() {
    console.log('Loading Universal QR for ID Card...');
    console.log('QRCode library available:', typeof QRCode !== 'undefined');
    console.log('Current user:', currentUser);
    
    const idCardQRContainer = document.getElementById('idCardQR');
    console.log('ID Card QR container found:', !!idCardQRContainer);
    
    if (!idCardQRContainer) {
        console.error('ID Card QR container not found');
        return;
    }
    
    // Show loading indicator
    idCardQRContainer.innerHTML = '<div style="font-size:12px;color:#fff;text-align:center;padding:20px">Loading...</div>';
    
    // If a stored QR already exists in DB, show it immediately without regenerating
    if (currentUser.qr_code) {
        const img = document.createElement('img');
        img.src = currentUser.qr_code;
        img.style.cssText = 'width:80px;height:80px;border-radius:4px;display:block';
        idCardQRContainer.innerHTML = '';
        idCardQRContainer.appendChild(img);
        console.log('ID card QR loaded from database');
        return;
    }

    if (typeof QRCode !== 'undefined') {
        // Generate QR with same format as admin (id, name, birth, contact)
        console.log('Generating QR for ID card (admin format)...');
        const qrData = JSON.stringify({
            id: currentUser.id,
            name: currentUser.name,
            birth: currentUser.birth,
            contact: currentUser.contact
        });
        
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, qrData, {
            width: 80,
            margin: 1,
            color: { dark: '#22c55e', light: '#ffffff' }
        }, (error) => {
            if (error) {
                console.error('Error generating QR:', error);
                idCardQRContainer.innerHTML = '<div style="font-size:12px;color:#ef4444;text-align:center;padding:20px">QR Error: ' + error.message + '</div>';
            } else {
                idCardQRContainer.innerHTML = '';
                idCardQRContainer.appendChild(canvas);
                const qrDataURL = canvas.toDataURL();
                localStorage.setItem(`universal_qr_${currentUser.id}`, qrDataURL);
                // Persist to Supabase so subsequent loads skip regeneration
                if (window.db) {
                    window.db.saveQRCode(currentUser.id, qrDataURL)
                        .then(() => { currentUser.qr_code = qrDataURL; console.log('[QR] ID card QR saved to database'); })
                        .catch(e => console.warn('[QR] Could not save ID card QR to database:', e));
                }
            }
        });
    } else {
        console.error('QRCode library not loaded');
        idCardQRContainer.innerHTML = '<div style="font-size:12px;color:#ef4444;text-align:center;padding:20px">QRCode library not available</div>';
    }
}

// Download ID Card as image
function downloadIDCard() {
    const idCard = document.querySelector('#govIdCard');
    
    // Use html2canvas if available, otherwise fallback to alert
    if (typeof html2canvas !== 'undefined') {
        console.log('Starting ID card capture with html2canvas...');
        
        html2canvas(idCard, {
            allowTaint: true,
            useCORS: true,
            backgroundColor: null,
            scale: 2, // Higher quality
            logging: false,
            onclone: function(clonedDoc) {
                // Convert QR canvas to image for better capture
                const qrCanvas = clonedDoc.querySelector('#idCardQR canvas');
                if (qrCanvas) {
                    const img = clonedDoc.createElement('img');
                    img.src = qrCanvas.toDataURL();
                    img.style.width = qrCanvas.style.width;
                    img.style.height = qrCanvas.style.height;
                    qrCanvas.parentNode.replaceChild(img, qrCanvas);
                }
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `ID-Card-${currentUser.id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            console.log('ID card downloaded successfully');
            showToast('ID Card downloaded!', 'success');
        }).catch(error => {
            console.error('Error capturing ID card:', error);
            showToast('Error downloading ID card', 'error');
        });
    } else {
        // Fallback: download just the QR code
        const qrImg = document.querySelector('#idCardQR img, #idCardQR canvas');
        if (qrImg) {
            const link = document.createElement('a');
            link.download = `ID-${currentUser.id}.png`;
            link.href = qrImg.tagName === 'CANVAS' ? qrImg.toDataURL() : qrImg.src;
            link.click();
            showToast('QR Code downloaded!', 'success');
        } else {
            showToast('Please wait for QR to load', 'error');
        }
    }
}

// Update Profile
async function updateProfile() {
    const contact = document.getElementById('updateContact').value.trim();
    const address = document.getElementById('updateAddress').value.trim();
    const notes   = document.getElementById('updateNotes').value.trim();
    const barangay    = (document.getElementById('updateBarangay')    || {}).value?.trim() || currentUser.barangay || '';
    const civilStatus = (document.getElementById('updateCivilStatus') || {}).value         || currentUser.civilStatus || currentUser.civil_status || '';

    if (!contact || !address) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    currentUser.contact     = contact;
    currentUser.address     = address;
    currentUser.notes       = notes;
    currentUser.barangay    = barangay;
    currentUser.civilStatus = civilStatus;

    // Persist to localStorage cache
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]');
    const index = profiles.findIndex(p => p.id === currentUser.id);
    if (index !== -1) {
        profiles[index] = currentUser;
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    // Persist to Supabase
    if (window.db) {
        try {
            await window.db.updateSenior(currentUser.id, { contact, address, notes, barangay, civilStatus });
        } catch (e) {
            console.error('[updateProfile]', e);
        }
    }

    showToast('Profile updated successfully!', 'success');
    loadProfile();
}

// Load QR Codes
function loadQRCodes() {
    // Generate universal QR code for QR tab
    generateUniversalQR();
}

// Generate universal QR Code with complete profile data
function generateUniversalQR() {
    console.log('=== generateUniversalQR called ===');
    console.log('Generating universal QR for:', currentUser.id);
    console.log('QRCode library available:', typeof QRCode !== 'undefined');
    
    // Check if QRCode library is loaded
    if (typeof QRCode === 'undefined') {
        console.error('QRCode library not loaded');
        document.getElementById('universalQR').innerHTML = '<p style="color:red;padding:40px">QR library not loaded</p>';
        return;
    }
    
    const universalQRContainer = document.getElementById('universalQR');
    console.log('Universal QR container found:', !!universalQRContainer);
    
    if (!universalQRContainer) {
        console.error('Universal QR container not found');
        return;
    }
    
    // Populate QR name/ID labels
    const qrNameLbl = document.getElementById('qrNameLabel');
    const qrIdLbl   = document.getElementById('qrIdLabel');
    if (qrNameLbl) qrNameLbl.textContent = currentUser.name || '—';
    if (qrIdLbl)   qrIdLbl.textContent   = `ID: ${currentUser.id || '—'}`;

    // Populate QR contents info
    const qrContents = document.getElementById('qrContentsInfo');
    if (qrContents) {
        const fields = [
            { label: 'Senior ID',    value: currentUser.id },
            { label: 'Full Name',    value: currentUser.name },
            { label: 'Date of Birth',value: currentUser.birth },
            { label: 'Contact',      value: currentUser.contact || '—' },
        ];
        qrContents.innerHTML = fields.map(f => `
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;padding:4px 0;border-bottom:1px solid #f3f4f6">
                <span style="color:#6b7280;font-weight:500">${f.label}</span>
                <span style="color:#1f2937;font-weight:700;font-family:${f.label==='Senior ID'?'monospace':'inherit'}">${f.value}</span>
            </div>
        `).join('');
    }

    // Show loading
    universalQRContainer.innerHTML = '<div style="padding:40px;color:#667eea">Generating QR...</div>';
    
    // --- Use stored QR from database if available ---
    if (currentUser.qr_code) {
        console.log('[QR] Loading stored QR code from database');
        universalQRContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = currentUser.qr_code;
        img.style.cssText = 'width:200px;height:200px;border-radius:8px;display:block';
        universalQRContainer.appendChild(img);

        // Wire Download button using the stored data URL
        const dlBtn = document.getElementById('downloadUniversalQR');
        if (dlBtn) {
            dlBtn.onclick = () => {
                const link = document.createElement('a');
                link.download = `LingapApu-QR-${currentUser.id}.png`;
                link.href = currentUser.qr_code;
                link.click();
                showToast('QR Code downloaded!', 'success');
            };
        }
        // Wire Share button using the stored data URL
        const shareBtn = document.getElementById('shareUniversalQR');
        if (shareBtn) {
            shareBtn.onclick = async () => {
                try {
                    const res = await fetch(currentUser.qr_code);
                    const blob = await res.blob();
                    const file = new File([blob], `LingapApu-QR-${currentUser.id}.png`, { type: 'image/png' });
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file], title: 'My LingapApu QR Code' });
                        showToast('QR shared successfully!', 'success');
                    } else {
                        dlBtn && dlBtn.click();
                    }
                } catch(e) { if (e.name !== 'AbortError') showToast('Could not share — try downloading instead.', 'info'); }
            };
        }
        return;
    }

    // --- Generate fresh QR and save to database ---
    const qrData = JSON.stringify({
        id: currentUser.id,
        name: currentUser.name,
        birth: currentUser.birth,
        contact: currentUser.contact
    });
    
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, qrData, {
        width: 200,
        margin: 2,
        color: { dark: '#22c55e', light: '#ffffff' }
    }, (error) => {
        if (error) {
            console.error('Error generating QR:', error);
            universalQRContainer.innerHTML = '<p style="color:red;padding:40px">Error: ' + error.message + '</p>';
        } else {
            universalQRContainer.innerHTML = '';
            universalQRContainer.appendChild(canvas);
            const qrDataURL = canvas.toDataURL();
            localStorage.setItem(`universal_qr_${currentUser.id}`, qrDataURL);

            // Persist to Supabase so next load reads from DB
            if (window.db) {
                window.db.saveQRCode(currentUser.id, qrDataURL)
                    .then(() => { currentUser.qr_code = qrDataURL; console.log('[QR] Universal QR saved to database'); })
                    .catch(e => console.warn('[QR] Could not save QR to database:', e));
            }

            // Wire Download button
            const dlBtn = document.getElementById('downloadUniversalQR');
            if (dlBtn) dlBtn.onclick = () => downloadQRImage(canvas, 'LingapApu-QR');

            // Wire Share button
            const shareBtn = document.getElementById('shareUniversalQR');
            if (shareBtn) shareBtn.onclick = () => shareQRImage(canvas, 'LingapApu-QR');
        }
    });
}

// Download QR Code canvas as PNG
function downloadQRImage(canvas, filename) {
    if (!canvas) {
        showToast('No QR code to download', 'error');
        return;
    }
    const link = document.createElement('a');
    link.download = `${filename}-${currentUser.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('QR Code downloaded!', 'success');
}

// Share QR Code via Web Share API (mobile) or fallback to download
async function shareQRImage(canvas, filename) {
    if (!canvas) {
        showToast('No QR code to share', 'error');
        return;
    }
    const fname = `${filename}-${currentUser.id}.png`;
    try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], fname, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'My LingapApu QR Code',
                text: `LingapApu Senior ID QR — ${currentUser.name} (${currentUser.id})`
            });
            showToast('QR shared successfully!', 'success');
        } else {
            // Fallback: download
            downloadQRImage(canvas, filename);
            showToast('Sharing not supported — file downloaded instead.', 'info');
        }
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error('Share error:', err);
            showToast('Could not share — try downloading instead.', 'error');
        }
    }
}

// Legacy helper kept for any direct calls
function downloadQR(containerId, filename) {
    const canvas = document.querySelector(`#${containerId} canvas`);
    downloadQRImage(canvas, filename);
}

// Load Transactions
function loadTransactions() {
    const transactions = getTransactions();
    const container = document.getElementById('transactionsTable');
    const countBadge = document.getElementById('txCountBadge');
    const statsEl = document.getElementById('txSummaryStats');

    if (countBadge) countBadge.textContent = `${transactions.length} Record${transactions.length !== 1 ? 's' : ''}`;

    // Summary stats
    if (statsEl) {
        const typeCount = {};
        transactions.forEach(t => { const k = t.type || 'General'; typeCount[k] = (typeCount[k] || 0) + 1; });
        const statItems = [
            { label: 'Total Records', value: transactions.length, color: '#22c55e', bg: '#dcfce7', border: '#22c55e' },
            { label: 'QR Scans',      value: typeCount['QR Scan'] || 0,       color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6' },
            { label: 'Benefit Claims',value: typeCount['Benefit Claim'] || 0,  color: '#8b5cf6', bg: '#f5f3ff', border: '#8b5cf6' },
            { label: 'Other',         value: transactions.length - (typeCount['QR Scan'] || 0) - (typeCount['Benefit Claim'] || 0), color: '#f59e0b', bg: '#fffbeb', border: '#f59e0b' },
        ];
        statsEl.innerHTML = statItems.map(s => `
            <div style="background:#fff;border:1px solid var(--border);border-left:3px solid ${s.border};border-radius:8px;padding:14px 16px">
                <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">${s.label}</div>
                <div style="font-size:24px;font-weight:800;color:${s.color}">${s.value}</div>
            </div>
        `).join('');
    }

    if (transactions.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:60px 20px;background:#fff;border:1px solid var(--border);border-radius:8px">
                <div style="width:64px;height:64px;background:#f3f4f6;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <p style="color:#374151;font-size:16px;font-weight:700;margin:0">No transactions yet</p>
                <p style="color:#6b7280;font-size:14px;margin:8px 0 0">Your benefit claims and QR scans will appear here</p>
            </div>
        `;
        return;
    }

    const typeConfig = {
        'QR Scan':      { color:'#3b82f6', bg:'#eff6ff', icon:'<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/>' },
        'Benefit Claim':{ color:'#22c55e', bg:'#dcfce7', icon:'<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' },
        'Registration': { color:'#8b5cf6', bg:'#f5f3ff', icon:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
        'Verification': { color:'#f59e0b', bg:'#fffbeb', icon:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
        'default':      { color:'#6b7280', bg:'#f3f4f6', icon:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
    };

    const reversed = [...transactions].reverse();
    const txTotalPages = Math.max(1, Math.ceil(reversed.length / TX_PAGE_SIZE));
    txPage = Math.min(Math.max(1, txPage), txTotalPages);
    const txStart = (txPage - 1) * TX_PAGE_SIZE;
    const txPageItems = reversed.slice(txStart, txStart + TX_PAGE_SIZE);

    container.innerHTML = txPageItems.map(t => {
        const cfg = typeConfig[t.type] || typeConfig['default'];
        const dt = new Date(t.timestamp);
        return `
        <div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:16px;display:flex;align-items:center;gap:14px;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.07)'" onmouseout="this.style.boxShadow='none'">
            <div style="width:44px;height:44px;background:${cfg.bg};border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${cfg.color}" stroke-width="2">${cfg.icon}</svg>
            </div>
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                    <span style="font-size:14px;font-weight:700;color:#1f2937">${t.type || 'General Transaction'}</span>
                    <span style="padding:2px 10px;background:#d1fae5;color:#059669;border-radius:12px;font-size:11px;font-weight:700">Completed</span>
                </div>
                <div style="font-size:13px;color:#6b7280;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.note || 'No details provided'}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
                <div style="font-size:13px;font-weight:600;color:#374151">${dt.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</div>
                <div style="font-size:11px;color:#9ca3af;margin-top:2px">${dt.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'})}</div>
            </div>
        </div>
        `;
    }).join('');

    renderPagination(document.getElementById('txPagination'), txPage, txTotalPages, 'goToTxPage');
}

function goToTxPage(p) {
    const transactions = getTransactions();
    const totalPages = Math.max(1, Math.ceil(transactions.length / TX_PAGE_SIZE));
    if (p < 1 || p > totalPages) return;
    txPage = p;
    loadTransactions();
}

// Get user transactions
function getTransactions() {
    const allTransactions = JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');
    return allTransactions.filter(t => t.seniorId === currentUser.id);
}

// Format date
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

// Format date and time
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = type === 'success' ? '#10b981' : '#ef4444';
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Photo upload modal functions
function openPhotoUploadModal() {
    document.getElementById('photoUploadModal').style.display = 'flex';
    
    // Reset camera UI
    document.getElementById('profileCameraVideo').style.display = 'none';
    document.getElementById('profileCameraStartButton').style.display = 'flex';
    document.getElementById('profileCameraGuideOverlay').style.display = 'none';
    document.getElementById('profilePhotoPreview').style.display = 'none';
    document.getElementById('profileCapturePhotoBtn').style.display = 'none';
    document.getElementById('profileRetakePhotoBtn').style.display = 'none';
}

// Profile camera variables
let profileCapturedPhotoBase64 = null;
let profileCameraVideo = null;
let profileDetectionActive = false;

function initializeProfileCamera() {
    console.log('Profile camera initialization started...');
    profileCameraVideo = document.getElementById('profileCameraVideo');
    const cameraStartButton = document.getElementById('profileCameraStartButton');
    const captureBtn = document.getElementById('profileCapturePhotoBtn');
    const cameraNotSupported = document.getElementById('profileCameraNotSupported');
    const guideOverlay = document.getElementById('profileCameraGuideOverlay');
    const cameraHint = document.getElementById('profileCameraHint');
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: true,
            audio: false 
        })
        .then(stream => {
            console.log('Profile camera stream obtained');
            profileCameraVideo.srcObject = stream;
            profileCameraVideo.play();
            profileCameraVideo.style.display = 'block';
            cameraStartButton.style.display = 'none';
            cameraNotSupported.style.display = 'none';
            guideOverlay.style.display = 'block';
            cameraHint.textContent = 'Center your face';
            cameraHint.style.color = '#10b981';
            captureBtn.style.display = 'block';
        })
        .catch(err => {
            console.error('Profile camera access error:', err);
            profileCameraVideo.style.display = 'none';
            cameraStartButton.style.display = 'flex';
            cameraNotSupported.style.display = 'flex';
            captureBtn.style.display = 'none';
        });
    } else {
        console.error('getUserMedia not supported');
        profileCameraVideo.style.display = 'none';
        cameraStartButton.style.display = 'flex';
        cameraNotSupported.style.display = 'flex';
        captureBtn.style.display = 'none';
    }
}

function captureProfilePhoto() {
    const canvas = document.createElement('canvas');
    const size = Math.min(profileCameraVideo.videoWidth, profileCameraVideo.videoHeight);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    const offsetX = (profileCameraVideo.videoWidth - size) / 2;
    const offsetY = (profileCameraVideo.videoHeight - size) / 2;
    ctx.drawImage(profileCameraVideo, offsetX, offsetY, size, size, 0, 0, size, size);
    
    profileCapturedPhotoBase64 = canvas.toDataURL('image/jpeg', 0.9);
    
    // Set canvas display size and draw
    const capturedCanvas = document.getElementById('profileCapturedPhotoCanvas');
    capturedCanvas.width = size;
    capturedCanvas.height = size;
    capturedCanvas.getContext('2d').drawImage(canvas, 0, 0, size, size);
    
    profileCameraVideo.style.display = 'none';
    document.getElementById('profileCameraGuideOverlay').style.display = 'none';
    document.getElementById('profilePhotoPreview').style.display = 'flex';
    document.getElementById('profileCapturePhotoBtn').style.display = 'none';
    document.getElementById('profileRetakePhotoBtn').style.display = 'block';
}

function retakeProfilePhoto() {
    profileCapturedPhotoBase64 = null;
    const capturedCanvas = document.getElementById('profileCapturedPhotoCanvas');
    capturedCanvas.getContext('2d').clearRect(0, 0, capturedCanvas.width, capturedCanvas.height);
    profileCameraVideo.style.display = 'block';
    document.getElementById('profileCameraGuideOverlay').style.display = 'block';
    document.getElementById('profilePhotoPreview').style.display = 'none';
    document.getElementById('profileCapturePhotoBtn').style.display = 'block';
    document.getElementById('profileRetakePhotoBtn').style.display = 'none';
    profileDetectionActive = true;
}

function closePhotoUploadModal() {
    document.getElementById('photoUploadModal').style.display = 'none';
    profileCapturedPhotoBase64 = null;
    
    // Stop camera stream
    if (profileCameraVideo && profileCameraVideo.srcObject) {
        profileCameraVideo.srcObject.getTracks().forEach(track => track.stop());
        profileCameraVideo.srcObject = null;
    }
    
    // Reset UI
    document.getElementById('profileCameraVideo').style.display = 'none';
    document.getElementById('profileCameraStartButton').style.display = 'flex';
    document.getElementById('profileCameraGuideOverlay').style.display = 'none';
    document.getElementById('profilePhotoPreview').style.display = 'none';
    document.getElementById('profileCapturePhotoBtn').style.display = 'none';
    document.getElementById('profileRetakePhotoBtn').style.display = 'none';
}

function saveProfilePhoto() {
    if (!profileCapturedPhotoBase64) {
        showToast('Please capture a photo', 'error');
        return;
    }
    
    const photoBase64 = profileCapturedPhotoBase64;
    
    if (currentUser) {
        currentUser.photo = photoBase64;
        
        // Update in localStorage cache
        const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]');
        const index = profiles.findIndex(p => p.id === currentUser.id);
        if (index !== -1) {
            profiles[index] = currentUser;
            localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        }

        // Persist to Supabase
        if (window.db) {
            window.db.updateSenior(currentUser.id, { photo: photoBase64 })
                .catch(e => console.error('[saveProfilePhoto]', e));
        }
        
        const idPhotoImg = document.querySelector('#idPhoto img');
        if (idPhotoImg) idPhotoImg.src = photoBase64;

        showToast('Profile photo updated successfully');
        closePhotoUploadModal();
    }
}

// Load profile photo on page initialization
function loadProfilePhoto() {
    if (currentUser && currentUser.photo) {
        const idPhotoImg = document.querySelector('#idPhoto img');
        if (idPhotoImg) {
            idPhotoImg.src = currentUser.photo;
        }
    }
}

