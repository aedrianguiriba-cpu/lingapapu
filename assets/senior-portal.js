// Senior Portal - Main JavaScript
const PROFILES_KEY = 'lingap_profiles_v3';
const TRANSACTIONS_KEY = 'lingap_transactions';
const BENEFITS_KEY = 'lingap_benefits_v1';

let currentUser = null;

// Initialize portal
function initSeniorPortal() {
    console.log('Initializing senior portal...');
    
    // Ensure profiles are loaded first
    const profilesRaw = localStorage.getItem(PROFILES_KEY);
    if (!profilesRaw) {
        console.log('No profiles found, redirecting to login');
        alert('No profiles found in system. Please contact administrator.');
        window.location.href = 'index.html';
        return;
    }
    
    // Check if user is logged in
    const sessionRaw = sessionStorage.getItem('currentUser');
    console.log('Session raw:', sessionRaw);
    
    if (!sessionRaw) {
        console.log('No session found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    const session = JSON.parse(sessionRaw);
    console.log('Session data:', session);
    
    if (!session.id || session.role !== 'senior') {
        console.log('Invalid session, redirecting to login');
        window.location.href = 'index.html';
        return;
    }

    // Load user data
    const profiles = JSON.parse(profilesRaw);
    console.log('Loaded profiles:', profiles.length);
    console.log('Looking for ID:', session.id);
    
    currentUser = profiles.find(p => p.id === session.id);
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
        console.log('User not found in profiles');
        console.log('Available IDs:', profiles.map(p => p.id));
        console.log('Looking for:', session.id);
        alert('Your profile was not found. Please contact administrator.');
        window.location.href = 'index.html';
        return;
    }

    console.log('User found, initializing sections...');
    
    // Initialize all sections
    try {
        loadDashboard();
        loadBenefits();
        loadProfile();
        loadTransactions();
        
        // Load QR codes with increased delay
        setTimeout(() => {
            console.log('=== Starting QR Code Generation ===');
            console.log('QRCode library check:', typeof QRCode);
            if (typeof QRCode !== 'undefined') {
                console.log('QRCode.toCanvas available:', typeof QRCode.toCanvas);
            }
            loadQRCodes();
        }, 500);
        
        console.log('All sections loaded successfully');
    } catch(error) {
        console.error('Error loading sections:', error);
    }

    // Setup event listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
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
    document.getElementById('welcomeMessage').textContent = `${currentUser.name} - ID: ${currentUser.id}`;

    // Stats
    const transactions = getTransactions();
    const benefits = currentUser.benefits || [];

    document.getElementById('dashBenefitsCount').textContent = benefits.length;
    document.getElementById('dashTransactionsCount').textContent = transactions.length;

    // Last activity
    if (transactions.length > 0) {
        const last = transactions[transactions.length - 1];
        const date = new Date(last.timestamp);
        document.getElementById('dashLastActivity').textContent = formatDate(date);
    }

    // Recent activity
    const recentActivity = document.getElementById('dashRecentActivity');
    if (transactions.length === 0) {
        recentActivity.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No recent activity</p>';
    } else {
        recentActivity.innerHTML = transactions.slice(-5).reverse().map(t => `
            <div style="padding:12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                <div>
                    <strong>${t.type || 'Transaction'}</strong>
                    <div style="font-size:13px;color:var(--text-muted);margin-top:4px">${t.note || 'No details'}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:13px;color:var(--text-muted)">${formatDateTime(new Date(t.timestamp))}</div>
                </div>
            </div>
        `).join('');
    }
}

// Load Benefits
function loadBenefits() {
    const allBenefits = JSON.parse(localStorage.getItem(BENEFITS_KEY) || '[]');
    const userBenefitIds = currentUser.benefits || [];
    const userBenefits = allBenefits.filter(b => userBenefitIds.includes(b.name));

    const benefitsList = document.getElementById('benefitsList');

    if (userBenefits.length === 0) {
        benefitsList.innerHTML = `
            <div class="card" style="grid-column:1/-1;text-align:center;padding:60px">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="margin:0 auto 16px">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
                <p style="color:var(--text-muted);font-size:16px">You are not enrolled in any benefits yet</p>
                <p style="color:var(--text-muted);font-size:14px;margin-top:8px">Contact the OSCA office to enroll in available programs</p>
            </div>
        `;
        return;
    }

    benefitsList.innerHTML = userBenefits.map(b => `
        <div class="card" style="background:linear-gradient(to bottom,#fff,var(--bg));border:2px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
                <h3 style="margin:0;font-size:18px;font-weight:700">${b.name}</h3>
                <span style="padding:4px 12px;background:${b.status === 'Active' ? '#d1fae5' : '#fee2e2'};color:${b.status === 'Active' ? '#059669' : '#dc2626'};border-radius:12px;font-size:12px;font-weight:600">${b.status}</span>
            </div>
            <p style="margin:0 0 12px;color:var(--text-muted);font-size:14px">${b.description || 'No description available'}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid var(--border)">
                <div>
                    <div style="font-size:12px;color:var(--text-muted)">Amount</div>
                    <div style="font-size:20px;font-weight:700;color:#667eea">₱${b.amount ? b.amount.toLocaleString() : '0'}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-size:12px;color:var(--text-muted)">Frequency</div>
                    <div style="font-size:14px;font-weight:600">${b.frequency || 'One-time'}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Profile
function loadProfile() {
    console.log('Loading profile...');
    
    // Load ID Card Design
    document.getElementById('idCardNumber').textContent = currentUser.id;
    document.getElementById('idCardName').textContent = currentUser.name;
    document.getElementById('idCardBirth').textContent = currentUser.birth;
    document.getElementById('idCardAge').textContent = `${currentUser.age} years`;
    document.getElementById('idCardContact').textContent = currentUser.contact || 'Not provided';
    document.getElementById('idCardAddress').textContent = currentUser.address || 'Not provided';
    document.getElementById('idCardRegistered').textContent = formatDate(new Date(currentUser.registrationDate));
    
    // Load QR code on ID card after delay
    setTimeout(() => {
        console.log('=== Loading ID Card QR ===');
        loadIDCardQR();
    }, 300);

    // Fill update form
    document.getElementById('updateContact').value = currentUser.contact || '';
    document.getElementById('updateAddress').value = currentUser.address || '';
    document.getElementById('updateNotes').value = currentUser.notes || '';
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
    
    // Always regenerate QR code for now (for debugging)
    if (typeof QRCode !== 'undefined') {
        // Generate QR with same format as admin (id, name, birth, contact)
        console.log('Generating QR for ID card (admin format)...');
        const qrData = JSON.stringify({
            id: currentUser.id,
            name: currentUser.name,
            birth: currentUser.birth,
            contact: currentUser.contact
        });
        
        console.log('QR Data:', qrData);
        
        const canvas = document.createElement('canvas');
        console.log('Canvas created, calling QRCode.toCanvas...');
        
        QRCode.toCanvas(canvas, qrData, {
            width: 150,
            margin: 1,
            color: {
                dark: '#667eea',
                light: '#ffffff'
            }
        }, (error) => {
            if (error) {
                console.error('Error generating QR:', error);
                idCardQRContainer.innerHTML = '<div style="font-size:12px;color:#ef4444;text-align:center;padding:20px">QR Error: ' + error.message + '</div>';
            } else {
                console.log('QR generated successfully for ID card');
                idCardQRContainer.innerHTML = '';
                idCardQRContainer.appendChild(canvas);
                const qrDataURL = canvas.toDataURL();
                localStorage.setItem(`universal_qr_${currentUser.id}`, qrDataURL);
                console.log('QR appended to container and saved');
            }
        });
    } else {
        console.error('QRCode library not loaded');
        idCardQRContainer.innerHTML = '<div style="font-size:12px;color:#ef4444;text-align:center;padding:20px">QRCode library not available</div>';
    }
}

// Download ID Card as image
function downloadIDCard() {
    const idCard = document.querySelector('#profileTab .card');
    
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
function updateProfile() {
    const contact = document.getElementById('updateContact').value.trim();
    const address = document.getElementById('updateAddress').value.trim();
    const notes = document.getElementById('updateNotes').value.trim();

    if (!contact || !address) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    // Update current user
    currentUser.contact = contact;
    currentUser.address = address;
    currentUser.notes = notes;

    // Save to storage
    const profiles = JSON.parse(localStorage.getItem(PROFILES_KEY) || '[]');
    const index = profiles.findIndex(p => p.id === currentUser.id);
    if (index !== -1) {
        profiles[index] = currentUser;
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        
        showToast('Profile updated successfully!', 'success');
        loadProfile();
    }
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
    
    // Show loading
    universalQRContainer.innerHTML = '<div style="padding:40px;color:#667eea">Generating QR...</div>';
    
    // Always regenerate for debugging
    console.log('Generating QR code (admin format)');
    const qrData = JSON.stringify({
        id: currentUser.id,
        name: currentUser.name,
        birth: currentUser.birth,
        contact: currentUser.contact
    });
    
    console.log('QR Data:', qrData);
    
    const canvas = document.createElement('canvas');
    console.log('Canvas created, calling QRCode.toCanvas...');
    
    QRCode.toCanvas(canvas, qrData, {
        width: 200,
        margin: 2,
        color: {
            dark: '#667eea',
            light: '#ffffff'
        }
    }, (error) => {
        if (error) {
            console.error('Error generating QR:', error);
            universalQRContainer.innerHTML = '<p style="color:red;padding:40px">Error: ' + error.message + '</p>';
        } else {
            console.log('QR generated successfully');
            universalQRContainer.innerHTML = '';
            universalQRContainer.appendChild(canvas);
            const qrDataURL = canvas.toDataURL();
            localStorage.setItem(`universal_qr_${currentUser.id}`, qrDataURL);
            console.log('QR saved to storage');
        }
    });
}

// Download QR Code (universal QR)
function downloadQR(containerId, filename) {
    const container = document.getElementById(containerId);
    const canvas = container.querySelector('canvas');
    const img = container.querySelector('img');
    
    let dataURL;
    if (canvas) {
        dataURL = canvas.toDataURL();
    } else if (img) {
        dataURL = img.src;
    } else {
        showToast('No QR code to download', 'error');
        return;
    }

    const link = document.createElement('a');
    link.download = `${filename}-${currentUser.id}.png`;
    link.href = dataURL;
    link.click();
    
    showToast('QR Code downloaded!', 'success');
}

// Load Transactions
function loadTransactions() {
    const transactions = getTransactions();
    const transactionsTable = document.getElementById('transactionsTable');

    if (transactions.length === 0) {
        transactionsTable.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;padding:40px;color:var(--text-muted)">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin:0 auto 12px;display:block;opacity:0.3">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    No transactions yet
                </td>
            </tr>
        `;
        return;
    }

    transactionsTable.innerHTML = transactions.reverse().map(t => `
        <tr>
            <td>${formatDateTime(new Date(t.timestamp))}</td>
            <td><strong>${t.type || 'General Transaction'}</strong></td>
            <td>${t.note || 'No details provided'}</td>
            <td><span style="padding:4px 12px;background:#d1fae5;color:#059669;border-radius:12px;font-size:12px;font-weight:600">Completed</span></td>
        </tr>
    `).join('');
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
