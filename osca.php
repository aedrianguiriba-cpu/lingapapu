<?php
session_start();
if (empty($_SESSION['role']) || $_SESSION['role'] !== 'osca') {
    header('Location: index.php');
    exit;
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <link rel="icon" type="image/png" href="assets/pics/logo.png">
    <link rel="apple-touch-icon" href="assets/pics/logo.png">
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <title>LingapApu — OSCA/MSWD Staff</title>
    <link rel="stylesheet" href="assets/style.css">
    <!-- Supabase -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/dist/umd/supabase.js"></script>
    <script src="assets/supabase-config.js"></script>
    <script src="assets/db.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
    <script src="assets/script.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            setupTabs();
            
            // Setup mobile navigation with swipe gestures
            function setupNavToggle(){
                const toggle = document.getElementById('navToggle');
                const nav = document.getElementById('mainNav');
                const overlay = document.getElementById('navOverlay');
                if(!toggle || !nav) return;
                
                let touchStartX = 0;
                let touchEndX = 0;
                let touchStartY = 0;
                let touchEndY = 0;
                let isDragging = false;
                let startTranslateX = 0;
                
                function closeNav(){
                    nav.classList.remove('active');
                    if(overlay) overlay.classList.remove('active');
                    toggle.setAttribute('aria-expanded','false');
                    document.body.style.overflow = '';
                    nav.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                }
                
                function openNav(){
                    nav.classList.add('active');
                    if(overlay) overlay.classList.add('active');
                    toggle.setAttribute('aria-expanded','true');
                    document.body.style.overflow = 'hidden';
                    nav.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                }
                
                toggle.addEventListener('click', function(){
                    if(nav.classList.contains('active')){
                        closeNav();
                    } else {
                        openNav();
                    }
                });
                
                if(overlay){
                    overlay.addEventListener('click', closeNav);
                }
                
                nav.querySelectorAll('a').forEach(link => {
                    link.addEventListener('click', closeNav);
                });
                
                // Swipe from left edge to open
                document.addEventListener('touchstart', (e) => {
                    touchStartX = e.touches[0].clientX;
                    touchStartY = e.touches[0].clientY;
                    
                    if(touchStartX < 30 && !nav.classList.contains('active')){
                        isDragging = true;
                        startTranslateX = -280;
                        nav.style.transition = 'none';
                    }
                    else if(nav.classList.contains('active') && touchStartX < 280){
                        isDragging = true;
                        startTranslateX = 0;
                        nav.style.transition = 'none';
                    }
                });
                
                document.addEventListener('touchmove', (e) => {
                    if(!isDragging) return;
                    
                    touchEndX = e.touches[0].clientX;
                    touchEndY = e.touches[0].clientY;
                    
                    const deltaX = touchEndX - touchStartX;
                    const deltaY = Math.abs(touchEndY - touchStartY);
                    
                    if(deltaY > 30) {
                        isDragging = false;
                        nav.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                        return;
                    }
                    
                    let newTranslateX = startTranslateX + deltaX;
                    newTranslateX = Math.max(-280, Math.min(0, newTranslateX));
                    
                    nav.style.transform = `translateX(${newTranslateX}px)`;
                    
                    if(overlay){
                        const opacity = (newTranslateX + 280) / 280 * 0.5;
                        overlay.style.opacity = opacity;
                        if(opacity > 0){
                            overlay.classList.add('active');
                        }
                    }
                    
                    e.preventDefault();
                });
                
                document.addEventListener('touchend', () => {
                    if(!isDragging) return;
                    
                    isDragging = false;
                    nav.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    const deltaX = touchEndX - touchStartX;
                    
                    if(startTranslateX === -280){
                        if(deltaX > 50){
                            openNav();
                        } else {
                            closeNav();
                        }
                    } else {
                        if(deltaX < -50){
                            closeNav();
                        } else {
                            openNav();
                        }
                    }
                });
            }
            
            setupNavToggle();
            initOSCAPortal();
        });
    </script>
</head>
<body>
<header class="header">
  <div class="brand">
    <img src="assets/pics/logo.png" alt="LingapApu" style="height:32px;width:auto;margin-right:8px">
    <div>
      <div class="logo">LingapApu</div>
      <div class="small">OSCA/MSWD Staff</div>
    </div>
  </div>
  <button id="navToggle" class="nav-toggle" aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
    <span class="hamburger" aria-hidden="true"></span>
  </button>
  <div class="nav-overlay" id="navOverlay"></div>
  <nav class="nav" id="mainNav" aria-label="Primary">
    <div class="nav-header">
      <img src="assets/pics/logo.png" alt="LingapApu">
      <div>
        <div class="logo" style="font-size:18px">LingapApu</div>
        <div class="small" style="color:var(--text-light)">OSCA Staff</div>
      </div>
    </div>
    <a href="#verify" class="navlink active" data-tab="verify">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/>
      </svg>
      Verify QR Code
    </a>
    <a href="#update" class="navlink" data-tab="update">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
      Update Records
    </a>
    <a href="#transactions" class="navlink" data-tab="transactions">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
      Log Transactions
    </a>
    <a href="#eligibility" class="navlink" data-tab="eligibility">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      Check Eligibility
    </a>
    <a href="#profile" class="navlink" data-tab="profile">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      Profile
    </a>
  </nav>
</header>

<main class="container" style="max-width:100%;padding:0 20px">
  <div class="card" style="max-width:100%">
    
    <!-- Verify QR Code Tab -->
    <div class="tab-panel active" id="verifyTab">
      <div style="background:#22c55e;padding:32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="text-align:center">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px">Verify Senior Citizen QR Code</h1>
          <p style="margin:8px 0 0;color:rgba(255, 255, 255, 0.9);font-size:14px">Scan or upload QR code to verify senior citizen identity</p>
        </div>
      </div>

      <div class="scanner-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
        <div class="card" style="background:#fff;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">QR Scanner</h3>
          </div>
          <div id="qr-reader-osca" style="position:relative;border:1px dashed #22c55e;border-radius:8px;overflow:hidden;background:#f0fdf4;min-height:300px;display:flex;align-items:center;justify-content:center">
            <video id="qr-video-osca" style="width:100%;height:auto;display:none" playsinline></video>
            <canvas id="qr-canvas-osca" style="display:none"></canvas>
            <div id="scan-status-osca" style="position:absolute;bottom:12px;left:12px;right:12px;padding:12px;background:rgba(0,0,0,0.8);color:#fff;border-radius:8px;text-align:center;font-size:14px;font-weight:600">Ready to scan</div>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button id="startScanBtnOSCA" class="btn" style="flex:1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start Camera
            </button>
            <button id="stopScanBtnOSCA" class="btn ghost" style="flex:1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
              Stop
            </button>
          </div>
          <div style="text-align:center;margin:16px 0;color:var(--text-light);font-size:14px">OR</div>
          <label class="btn ghost" style="display:block;text-align:center;cursor:pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Upload QR Image
            <input type="file" id="qrImageUploadOSCA" accept="image/*" style="display:none">
          </label>
        </div>

        <div class="card" style="background:#fff;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">Verification Result</h3>
          </div>
          <div id="verificationResult" style="text-align:center;padding:40px 20px">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;color:var(--text-light)">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/>
            </svg>
            <p style="margin:0;color:var(--text-light)">Scan a QR code to verify senior citizen</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Update Records Tab -->
    <div class="tab-panel" id="updateTab">
      <div style="background:#22c55e;padding:32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="text-align:center">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px">Update Senior Citizen Records</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px">Search and update senior citizen information</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:400px 1fr;gap:24px">
        <div class="card" style="background:#fff;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">Scan Senior QR</h3>
          </div>
          <div id="qr-reader-update" style="position:relative;border:1px dashed #22c55e;border-radius:8px;overflow:hidden;background:#f0fdf4;min-height:250px;display:flex;align-items:center;justify-content:center">
            <video id="qr-video-update" style="width:100%;height:auto;display:none" playsinline></video>
            <canvas id="qr-canvas-update" style="display:none"></canvas>
            <div id="scan-status-update" style="position:absolute;bottom:12px;left:12px;right:12px;padding:12px;background:rgba(0,0,0,0.8);color:#fff;border-radius:8px;text-align:center;font-size:14px;font-weight:600">Ready to scan</div>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button id="startScanBtnUpdate" class="btn" style="flex:1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start
            </button>
            <button id="stopScanBtnUpdate" class="btn ghost" style="flex:1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
              Stop
            </button>
          </div>
          <div style="text-align:center;margin:16px 0;color:var(--text-light);font-size:14px">OR</div>
          <label class="btn ghost" style="display:block;text-align:center;cursor:pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Upload QR
            <input type="file" id="qrImageUploadUpdate" accept="image/*" style="display:none">
          </label>
          <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:16px">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Or search by name</label>
              <input id="searchSeniorInput" class="input" placeholder="Enter name...">
            </div>
            <button id="searchSeniorBtn" class="btn" style="width:100%;margin-top:8px">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Search
            </button>
          </div>
          <div id="searchResults" style="margin-top:16px;max-height:300px;overflow-y:auto"></div>
        </div>

        <div class="card" style="background:#fff;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">Update Information</h3>
          </div>
          <div id="updateForm" style="display:none">
            <div class="form-group">
              <label class="form-label">Senior ID</label>
              <input id="updateId" class="input" readonly style="background:var(--bg)">
            </div>
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input id="updateName" class="input">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Birth Date</label>
                <input id="updateBirth" class="input" type="date">
              </div>
              <div class="form-group">
                <label class="form-label">Gender</label>
                <select id="updateGender" class="input">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Number</label>
              <input id="updateContact" class="input">
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <textarea id="updateAddress" class="input" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Medical Notes</label>
              <textarea id="updateNotes" class="input" rows="3"></textarea>
            </div>
            <div style="display:flex;gap:12px;margin-top:24px">
              <button id="saveUpdateBtn" class="btn" style="flex:1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Save Changes
              </button>
              <button id="cancelUpdateBtn" class="btn ghost" style="flex:1">Cancel</button>
            </div>
          </div>
          <div id="updatePlaceholder" style="text-align:center;padding:60px 20px">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;color:var(--text-light)">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <p style="margin:0;color:var(--text-light)">Search for a senior to update their records</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Log Transactions Tab -->
    <div class="tab-panel" id="transactionsTab">
      <div style="background:#22c55e;padding:32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="text-align:center">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px">Log Service or Discount Transaction</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px">Record senior citizen service usage or discount transactions</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:400px 1fr;gap:24px;margin-bottom:24px">
        <div class="card" style="background:#fff;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">Scan Senior QR</h3>
          </div>
          <div id="qr-reader-transaction" style="position:relative;border:1px dashed #22c55e;border-radius:8px;overflow:hidden;background:#f0fdf4;min-height:250px;display:flex;align-items:center;justify-content:center">
            <video id="qr-video-transaction" style="width:100%;height:auto;display:none" playsinline></video>
            <canvas id="qr-canvas-transaction" style="display:none"></canvas>
            <div id="scan-status-transaction" style="position:absolute;bottom:12px;left:12px;right:12px;padding:12px;background:rgba(0,0,0,0.8);color:#fff;border-radius:8px;text-align:center;font-size:14px;font-weight:600">Ready to scan</div>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button id="startScanBtnTransaction" class="btn" style="flex:1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start
            </button>
            <button id="stopScanBtnTransaction" class="btn ghost" style="flex:1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
              Stop
            </button>
          </div>
          <div style="text-align:center;margin:16px 0;color:var(--text-light);font-size:14px">OR</div>
          <label class="btn ghost" style="display:block;text-align:center;cursor:pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Upload QR
            <input type="file" id="qrImageUploadTransaction" accept="image/*" style="display:none">
          </label>
        </div>

        <div class="card" style="background:#fff;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">Selected Senior</h3>
          </div>
          <div id="transactionSeniorInfo" style="text-align:center;padding:40px 20px">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;color:var(--text-light)">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/>
            </svg>
            <p style="margin:0;color:var(--text-light)">Scan QR code to select senior</p>
          </div>
        </div>
      </div>

      <div class="card" style="background:#fff;border:1px solid var(--border);max-width:800px;margin:0 auto">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
          <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3 style="margin:0;font-size:20px;font-weight:700">Transaction Details</h3>
        </div>
        <input type="hidden" id="transactionSeniorId">
        <div class="form-group">
          <label class="form-label">Transaction Type</label>
          <select id="transactionType" class="input">
            <option value="">Select type...</option>
            <option value="Pension">Pension Collection</option>
            <option value="Medical">Medical Service</option>
            <option value="Transport">Transport Allowance</option>
            <option value="Food">Food Assistance</option>
            <option value="Discount">Senior Discount Used</option>
            <option value="Other">Other Service</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Amount (₱)</label>
            <input id="transactionAmount" class="input" type="number" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input id="transactionDate" class="input" type="date">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea id="transactionNotes" class="input" rows="3" placeholder="Additional details..."></textarea>
        </div>
        <div style="display:flex;gap:12px;margin-top:24px">
          <button id="logTransactionBtn" class="btn" style="flex:1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Log Transaction
          </button>
          <button id="clearTransactionBtn" class="btn ghost" style="flex:1">Clear Form</button>
        </div>
      </div>

      <div class="card" style="background:#fff;border:1px solid var(--border);margin-top:24px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 style="margin:0;font-size:18px;font-weight:700">Recent Transactions</h3>
        </div>
        <div id="recentTransactions" style="max-height:400px;overflow-y:auto"></div>
      </div>
    </div>

    <!-- Check Eligibility Tab -->
    <div class="tab-panel" id="eligibilityTab">
      <div style="background:#22c55e;padding:32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="text-align:center">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px">Benefit Eligibility Management</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px">Verify, accept, and reject senior citizen eligibility for benefits</p>
        </div>
      </div>

      <!-- Eligibility List View -->
      <div class="card" style="background:#fff;border:1px solid var(--border);margin-bottom:28px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin:0 0 20px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">Eligibility Requests</h3>
          </div>
          <div style="display:flex;gap:8px">
            <select id="eligibilityFilterStatus" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;cursor:pointer">
              <option value="">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div id="eligibilityListContainer" style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="border-bottom:1px solid var(--border);background:var(--bg)">
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:14px;color:var(--text-light)">Name</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:14px;color:var(--text-light)">ID</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:14px;color:var(--text-light)">Age</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:14px;color:var(--text-light)">Eligibility</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:14px;color:var(--text-light)">Benefits</th>
                <th style="padding:12px 16px;text-align:left;font-weight:700;font-size:14px;color:var(--text-light)">Decision</th>
                <th style="padding:12px 16px;text-align:center;font-weight:700;font-size:14px;color:var(--text-light)">Actions</th>
              </tr>
            </thead>
            <tbody id="eligibilityTableBody">
              <tr>
                <td colspan="7" style="padding:40px;text-align:center;color:var(--text-light)">Loading seniors...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Scan Individual QR -->
      <div style="display:grid;grid-template-columns:400px 1fr;gap:24px">
        <div class="card" style="background:#fff;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">Quick Check — Scan QR</h3>
          </div>
          <div id="qr-reader-eligibility" style="position:relative;border:1px dashed #22c55e;border-radius:8px;overflow:hidden;background:#f0fdf4;min-height:250px;display:flex;align-items:center;justify-content:center">
            <video id="qr-video-eligibility" style="width:100%;height:auto;display:none" playsinline></video>
            <canvas id="qr-canvas-eligibility" style="display:none"></canvas>
            <div id="scan-status-eligibility" style="position:absolute;bottom:12px;left:12px;right:12px;padding:12px;background:rgba(0,0,0,0.8);color:#fff;border-radius:8px;text-align:center;font-size:14px;font-weight:600">Ready to scan</div>
          </div>
          <div style="display:flex;gap:12px;margin-top:16px">
            <button id="startScanBtnEligibility" class="btn" style="flex:1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start
            </button>
            <button id="stopScanBtnEligibility" class="btn ghost" style="flex:1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
              Stop
            </button>
          </div>
          <div style="text-align:center;margin:16px 0;color:var(--text-light);font-size:14px">OR</div>
          <label class="btn ghost" style="display:block;text-align:center;cursor:pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Upload QR
            <input type="file" id="qrImageUploadEligibility" accept="image/*" style="display:none">
          </label>
        </div>

        <div class="card" style="background:#fff;border:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
            <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <h3 style="margin:0;font-size:18px;font-weight:700">Eligibility Details</h3>
          </div>
          <div id="eligibilityResult" style="text-align:center;padding:60px 20px">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 16px;color:var(--text-light)">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p style="margin:0;color:var(--text-light)">Scan a QR code to see details</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Profile Tab -->
    <div class="tab-panel" id="profileTab">

      <!-- Tab Header Banner -->
      <div style="background:#22c55e;padding:32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="text-align:center">
          <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;letter-spacing:-0.5px">My Profile</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px">OSCA/MSWD Staff account information</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:300px 1fr;gap:24px;align-items:start">

        <!-- Left Column: Avatar Card -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <div class="card" style="background:#fff;border:1px solid var(--border);text-align:center">
            <!-- Avatar -->
            <div style="width:120px;height:120px;margin:0 auto 16px;background:#dcfce7;border-radius:8px;border:1px solid #b7e4c7;display:flex;align-items:center;justify-content:center;font-size:44px;font-weight:700;color:#16a34a;letter-spacing:-2px">
              <span id="oscaProfileInitials">OS</span>
            </div>
            <!-- Name & Role -->
            <h2 style="margin:0 0 6px;font-size:20px;font-weight:700;color:var(--text)" id="oscaProfileDisplayName">OSCA Staff</h2>
            <span style="display:inline-block;padding:4px 14px;background:var(--primary-light);color:#16a34a;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:0.3px;border:1px solid #bbf7d0" id="oscaProfileRole">OSCA/MSWD Staff</span>

            <!-- Status indicator -->
            <div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
              <span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0"></span>
              <span style="font-size:13px;color:var(--text-light);font-weight:500">Active Session</span>
            </div>
          </div>

          <!-- Quick Actions Card -->
          <div class="card" style="background:#fff;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
              <div style="width:32px;height:32px;background:var(--primary-light);border:1px solid #22c55e;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>
              </div>
              <h4 style="margin:0;font-size:15px;font-weight:700">Quick Actions</h4>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <a href="#verify" class="navlink" data-tab="verify" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text);background:#fafafa;transition:all 0.15s">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
                <span style="font-size:13px;font-weight:600">Verify QR Code</span>
              </a>
              <a href="#transactions" class="navlink" data-tab="transactions" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text);background:#fafafa;transition:all 0.15s">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span style="font-size:13px;font-weight:600">Log Transaction</span>
              </a>
              <a href="#eligibility" class="navlink" data-tab="eligibility" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text);background:#fafafa;transition:all 0.15s">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span style="font-size:13px;font-weight:600">Check Eligibility</span>
              </a>
            </div>
          </div>

        </div>

        <!-- Right Column -->
        <div style="display:flex;flex-direction:column;gap:16px">

          <!-- Account Information Card -->
          <div class="card" style="background:#fff;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
              <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h3 style="margin:0;font-size:18px;font-weight:700">Account Information</h3>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div>
                <label style="display:block;margin-bottom:6px;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">Username</label>
                <div style="padding:12px 14px;background:var(--bg);border-radius:8px;font-size:15px;font-weight:600;border:1px solid var(--border)" id="oscaProfileUsername">osca</div>
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">Account Type</label>
                <div style="padding:12px 14px;background:var(--primary-light);border-radius:8px;font-size:14px;font-weight:700;color:#16a34a;border:1px solid #bbf7d0">Staff Account</div>
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">Department</label>
                <div style="padding:12px 14px;background:var(--bg);border-radius:8px;font-size:14px;font-weight:600;border:1px solid var(--border)">OSCA / MSWD</div>
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">Location</label>
                <div style="padding:12px 14px;background:var(--bg);border-radius:8px;font-size:14px;font-weight:600;border:1px solid var(--border)">Floridablanca, Pampanga</div>
              </div>
            </div>
          </div>

          <!-- Portal Access Card -->
          <div class="card" style="background:#fff;border:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
              <div style="width:36px;height:36px;background:var(--primary-light);border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 style="margin:0;font-size:18px;font-weight:700">Portal Access</h3>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px">
              <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/></svg>
                <span style="font-size:13px;font-weight:600;color:#166534">QR Verification</span>
              </div>
              <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span style="font-size:13px;font-weight:600;color:#166534">Update Records</span>
              </div>
              <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span style="font-size:13px;font-weight:600;color:#166534">Log Transactions</span>
              </div>
              <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span style="font-size:13px;font-weight:600;color:#166534">Check Eligibility</span>
              </div>
            </div>
          </div>

          <!-- Sign Out Card -->
          <div class="card" style="background:#fef2f2;border:1px solid #fca5a5">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
              <div style="width:36px;height:36px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <h3 style="margin:0;font-size:18px;font-weight:700;color:#991b1b">Sign Out</h3>
            </div>
            <p style="margin:0 0 16px;font-size:14px;color:#7f1d1d">End your current session and return to the login page.</p>
            <button class="btn ghost" id="logoutBtnOSCA" style="color:#dc2626;border-color:#dc2626;width:100%">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px;vertical-align:middle">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>

        </div>
      </div>
    </div>

  </div>
</main>

<footer class="footer">
  <div style="max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
    <div class="small">LingapApu OSCA Portal — Floridablanca, Pampanga</div>
    <div class="small">For assistance: (045) 123-4567</div>
  </div>
</footer>

<script>
// Session check removed

// OSCA Portal Logic
let videoStreamOSCA = null;
let scanningIntervalOSCA = null;
let videoStreamUpdate = null;
let scanningIntervalUpdate = null;
let videoStreamTransaction = null;
let scanningIntervalTransaction = null;
let videoStreamEligibility = null;
let scanningIntervalEligibility = null;
let currentSeniorForUpdate = null;
let currentTransactionSenior = null;

function initOSCAPortal() {
    loadOSCAProfile();
    setupVerifyScanner();
    setupUpdateRecords();
    setupTransactions();
    setupEligibility();
    loadRecentTransactions();
    
    // Set today's date for transaction form
    document.getElementById('transactionDate').valueAsDate = new Date();
}

function loadOSCAProfile() {
    const username = 'osca';
    const initials = username.substring(0, 2).toUpperCase();
    
    document.getElementById('oscaProfileInitials').textContent = initials;
    document.getElementById('oscaProfileDisplayName').textContent = username.charAt(0).toUpperCase() + username.slice(1);
    document.getElementById('oscaProfileUsername').textContent = username;
}

// Verify QR Scanner Functions
function setupVerifyScanner() {
    document.getElementById('startScanBtnOSCA').addEventListener('click', startVerifyScanner);
    document.getElementById('stopScanBtnOSCA').addEventListener('click', stopVerifyScanner);
    document.getElementById('qrImageUploadOSCA').addEventListener('change', handleVerifyImageUpload);
}

function startVerifyScanner() {
    const video = document.getElementById('qr-video-osca');
    const canvas = document.getElementById('qr-canvas-osca');
    const status = document.getElementById('scan-status-osca');
    
    status.textContent = 'Starting camera...';
    status.style.background = 'rgba(34,197,94,0.9)';
    
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
    }).then(stream => {
        videoStreamOSCA = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        video.play();
        
        status.textContent = 'Scanning...';
        
        const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
        
        scanningIntervalOSCA = setInterval(() => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    processVerifyQRCode(code.data);
                    stopVerifyScanner();
                }
            }
        }, 300);
    }).catch(err => {
        status.textContent = 'Camera access denied';
        status.style.background = 'rgba(239,68,68,0.9)';
        console.error('Camera error:', err);
    });
}

function stopVerifyScanner() {
    if (videoStreamOSCA) {
        videoStreamOSCA.getTracks().forEach(track => track.stop());
        videoStreamOSCA = null;
    }
    if (scanningIntervalOSCA) {
        clearInterval(scanningIntervalOSCA);
        scanningIntervalOSCA = null;
    }
    
    const video = document.getElementById('qr-video-osca');
    const status = document.getElementById('scan-status-osca');
    
    video.style.display = 'none';
    status.textContent = 'Ready to scan';
    status.style.background = 'rgba(0,0,0,0.8)';
}

function handleVerifyImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('qr-canvas-osca');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                processVerifyQRCode(code.data);
            } else {
                alert('No QR code found in image');
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function processVerifyQRCode(data) {
    try {
        const qrData = JSON.parse(data);
        const profiles = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
        const senior = profiles.find(p => p.id === qrData.id);
        
        const resultDiv = document.getElementById('verificationResult');
        
        if (senior) {
            const age = calculateAge(senior.birth);
            resultDiv.innerHTML = `
                <div style="padding:24px">
                    <div style="width:80px;height:80px;margin:0 auto 16px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <h3 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#10b981">Verified Senior Citizen</h3>
                    <p style="margin:0 0 24px;color:var(--text-light)">Valid and active registration</p>
                    
                    <div style="background:var(--bg);padding:20px;border-radius:12px;text-align:left">
                        <div style="margin-bottom:12px">
                            <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">ID Number</div>
                            <div style="font-size:16px;font-weight:700">${senior.id}</div>
                        </div>
                        <div style="margin-bottom:12px">
                            <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">Full Name</div>
                            <div style="font-size:16px;font-weight:700">${senior.name}</div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                            <div>
                                <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">Age</div>
                                <div style="font-size:16px;font-weight:700">${age} years</div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">Gender</div>
                                <div style="font-size:16px;font-weight:700">${senior.gender || 'N/A'}</div>
                            </div>
                        </div>
                        <div style="margin-bottom:12px">
                            <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">Contact</div>
                            <div style="font-size:16px">${senior.contact}</div>
                        </div>
                        <div>
                            <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">Address</div>
                            <div style="font-size:14px">${senior.address}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top:20px;padding:16px;background:#f0fdf4;border-radius:8px;border:1px solid #22c55e">
                        <div style="font-size:13px;font-weight:600;color:#22c55e;margin-bottom:8px">Active Benefits</div>
                        <div style="display:flex;flex-wrap:wrap;gap:6px">
                            ${(senior.benefits || []).map(b => `<span style="padding:4px 12px;background:#22c55e;color:#fff;border-radius:6px;font-size:12px;font-weight:600">${b}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="padding:40px 24px">
                    <div style="width:80px;height:80px;margin:0 auto 16px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </div>
                    <h3 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ef4444">Not Found</h3>
                    <p style="margin:0;color:var(--text-light)">Senior citizen not found in database</p>
                    <p style="margin:8px 0 0;font-size:14px;color:var(--text-light)">ID: ${qrData.id}</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('QR parse error:', err);
        alert('Invalid QR code format');
    }
}

// Update Records Functions
function setupUpdateRecords() {
    document.getElementById('startScanBtnUpdate').addEventListener('click', startUpdateScanner);
    document.getElementById('stopScanBtnUpdate').addEventListener('click', stopUpdateScanner);
    document.getElementById('qrImageUploadUpdate').addEventListener('change', handleUpdateImageUpload);
    document.getElementById('searchSeniorBtn').addEventListener('click', searchSenior);
    document.getElementById('saveUpdateBtn').addEventListener('click', saveUpdate);
    document.getElementById('cancelUpdateBtn').addEventListener('click', cancelUpdate);
    
    document.getElementById('searchSeniorInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchSenior();
    });
}

function startUpdateScanner() {
    const video = document.getElementById('qr-video-update');
    const canvas = document.getElementById('qr-canvas-update');
    const status = document.getElementById('scan-status-update');
    
    status.textContent = 'Starting camera...';
    status.style.background = 'rgba(16,185,129,0.9)';
    
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
    }).then(stream => {
        videoStreamUpdate = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        video.play();
        
        status.textContent = 'Scanning...';
        
        const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
        
        scanningIntervalUpdate = setInterval(() => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    processUpdateQRCode(code.data);
                    stopUpdateScanner();
                }
            }
        }, 300);
    }).catch(err => {
        status.textContent = 'Camera access denied';
        status.style.background = 'rgba(239,68,68,0.9)';
        console.error('Camera error:', err);
    });
}

function stopUpdateScanner() {
    if (videoStreamUpdate) {
        videoStreamUpdate.getTracks().forEach(track => track.stop());
        videoStreamUpdate = null;
    }
    if (scanningIntervalUpdate) {
        clearInterval(scanningIntervalUpdate);
        scanningIntervalUpdate = null;
    }
    
    const video = document.getElementById('qr-video-update');
    const status = document.getElementById('scan-status-update');
    
    video.style.display = 'none';
    status.textContent = 'Ready to scan';
    status.style.background = 'rgba(0,0,0,0.8)';
}

function handleUpdateImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('qr-canvas-update');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                processUpdateQRCode(code.data);
            } else {
                alert('No QR code found in image');
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function processUpdateQRCode(data) {
    try {
        const qrData = JSON.parse(data);
        selectSeniorForUpdate(qrData.id);
    } catch (err) {
        console.error('QR parse error:', err);
        alert('Invalid QR code format');
    }
}

function searchSenior() {
    const query = document.getElementById('searchSeniorInput').value.trim().toLowerCase();
    if (!query) {
        alert('Please enter a search term');
        return;
    }
    
    const profiles = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
    const results = profiles.filter(p => 
        p.name.toLowerCase().includes(query)
    );
    
    const resultsDiv = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsDiv.innerHTML = `<div style="padding:16px;text-align:center;color:var(--text-light)">No results found</div>`;
        return;
    }
    
    resultsDiv.innerHTML = results.map(senior => `
        <div class="card" style="padding:12px;margin-bottom:8px;cursor:pointer;transition:all 0.2s" onclick="selectSeniorForUpdate('${senior.id}')">
            <div style="font-weight:700">${senior.name}</div>
            <div style="font-size:13px;color:var(--text-light)">${senior.id}</div>
        </div>
    `).join('');
}

function selectSeniorForUpdate(seniorId) {
    const profiles = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
    const senior = profiles.find(p => p.id === seniorId);
    
    if (!senior) return;
    
    currentSeniorForUpdate = senior;
    
    document.getElementById('updateId').value = senior.id;
    document.getElementById('updateName').value = senior.name;
    document.getElementById('updateBirth').value = senior.birth;
    document.getElementById('updateGender').value = senior.gender || 'Male';
    document.getElementById('updateContact').value = senior.contact;
    document.getElementById('updateAddress').value = senior.address;
    document.getElementById('updateNotes').value = senior.notes || '';
    
    document.getElementById('updatePlaceholder').style.display = 'none';
    document.getElementById('updateForm').style.display = 'block';
}

function saveUpdate() {
    if (!currentSeniorForUpdate) return;
    
    const profiles = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
    const index = profiles.findIndex(p => p.id === currentSeniorForUpdate.id);
    
    if (index === -1) return;
    
    profiles[index] = {
        ...profiles[index],
        name: document.getElementById('updateName').value,
        birth: document.getElementById('updateBirth').value,
        age: calculateAge(document.getElementById('updateBirth').value),
        gender: document.getElementById('updateGender').value,
        contact: document.getElementById('updateContact').value,
        address: document.getElementById('updateAddress').value,
        notes: document.getElementById('updateNotes').value
    };
    
    localStorage.setItem('lingap_profiles_v3', JSON.stringify(profiles));
    
    alert('Record updated successfully!');
    cancelUpdate();
    document.getElementById('searchSeniorInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function cancelUpdate() {
    currentSeniorForUpdate = null;
    document.getElementById('updateForm').style.display = 'none';
    document.getElementById('updatePlaceholder').style.display = 'block';
}

// Transaction Functions
function setupTransactions() {
    document.getElementById('startScanBtnTransaction').addEventListener('click', startTransactionScanner);
    document.getElementById('stopScanBtnTransaction').addEventListener('click', stopTransactionScanner);
    document.getElementById('qrImageUploadTransaction').addEventListener('change', handleTransactionImageUpload);
    document.getElementById('logTransactionBtn').addEventListener('click', logTransaction);
    document.getElementById('clearTransactionBtn').addEventListener('click', clearTransactionForm);
}

function startTransactionScanner() {
    const video = document.getElementById('qr-video-transaction');
    const canvas = document.getElementById('qr-canvas-transaction');
    const status = document.getElementById('scan-status-transaction');
    
    status.textContent = 'Starting camera...';
    status.style.background = 'rgba(245,158,11,0.9)';
    
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
    }).then(stream => {
        videoStreamTransaction = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        video.play();
        
        status.textContent = 'Scanning...';
        
        const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
        
        scanningIntervalTransaction = setInterval(() => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    processTransactionQRCode(code.data);
                    stopTransactionScanner();
                }
            }
        }, 300);
    }).catch(err => {
        status.textContent = 'Camera access denied';
        status.style.background = 'rgba(239,68,68,0.9)';
        console.error('Camera error:', err);
    });
}

function stopTransactionScanner() {
    if (videoStreamTransaction) {
        videoStreamTransaction.getTracks().forEach(track => track.stop());
        videoStreamTransaction = null;
    }
    if (scanningIntervalTransaction) {
        clearInterval(scanningIntervalTransaction);
        scanningIntervalTransaction = null;
    }
    
    const video = document.getElementById('qr-video-transaction');
    const status = document.getElementById('scan-status-transaction');
    
    video.style.display = 'none';
    status.textContent = 'Ready to scan';
    status.style.background = 'rgba(0,0,0,0.8)';
}

function handleTransactionImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('qr-canvas-transaction');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                processTransactionQRCode(code.data);
            } else {
                alert('No QR code found in image');
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function processTransactionQRCode(data) {
    try {
        const qrData = JSON.parse(data);
        const profiles = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
        const senior = profiles.find(p => p.id === qrData.id);
        
        if (senior) {
            currentTransactionSenior = senior;
            document.getElementById('transactionSeniorId').value = senior.id;
            
            const age = calculateAge(senior.birth);
            document.getElementById('transactionSeniorInfo').innerHTML = `
                <div style="padding:20px">
                    <div style="width:60px;height:60px;margin:0 auto 12px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                    <h4 style="margin:0 0 4px;font-size:18px;font-weight:700">${senior.name}</h4>
                    <p style="margin:0 0 12px;color:var(--text-light);font-size:14px">${senior.id}</p>
                    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px">
                        <span style="padding:4px 12px;background:var(--bg);border-radius:6px;font-size:12px;font-weight:600">${age} years old</span>
                        <span style="padding:4px 12px;background:var(--bg);border-radius:6px;font-size:12px;font-weight:600">${senior.gender}</span>
                    </div>
                    <div style="font-size:13px;color:var(--text-light)">
                        ${senior.contact}<br>
                        ${senior.address}
                    </div>
                </div>
            `;
        } else {
            alert('Senior citizen not found');
            document.getElementById('transactionSeniorInfo').innerHTML = `
                <div style="text-align:center;padding:40px 20px">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="margin:0 auto 12px">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    <p style="margin:0;color:#ef4444">Senior not found</p>
                </div>
            `;
        }
    } catch (err) {
        console.error('QR parse error:', err);
        alert('Invalid QR code format');
    }
}

function logTransaction() {
    const seniorId = document.getElementById('transactionSeniorId').value.trim();
    const type = document.getElementById('transactionType').value;
    const amount = document.getElementById('transactionAmount').value;
    const date = document.getElementById('transactionDate').value;
    const notes = document.getElementById('transactionNotes').value.trim();
    
    if (!seniorId) {
        alert('Please scan a senior QR code first');
        return;
    }
    
    if (!type) {
        alert('Please select transaction type');
        return;
    }
    
    if (!currentTransactionSenior) {
        alert('Please scan a senior QR code first');
        return;
    }
    
    const transaction = {
        seniorId: seniorId,
        seniorName: currentTransactionSenior.name,
        type: type,
        amount: amount ? parseFloat(amount) : 0,
        date: date,
        notes: notes,
        timestamp: new Date().toISOString(),
        staff: 'osca'
    };
    
    // Save to transactions storage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    alert('Transaction logged successfully!');
    clearTransactionForm();
    loadRecentTransactions();
}

function clearTransactionForm() {
    currentTransactionSenior = null;
    document.getElementById('transactionSeniorId').value = '';
    document.getElementById('transactionType').value = '';
    document.getElementById('transactionAmount').value = '';
    document.getElementById('transactionDate').valueAsDate = new Date();
    document.getElementById('transactionNotes').value = '';
    document.getElementById('transactionSeniorInfo').innerHTML = `
        <div style="text-align:center;padding:40px 20px">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;color:var(--text-light)">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/>
            </svg>
            <p style="margin:0;color:var(--text-light)">Scan QR code to select senior</p>
        </div>
    `;
}

function loadRecentTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const recent = transactions.slice(0, 10);
    
    const container = document.getElementById('recentTransactions');
    
    if (recent.length === 0) {
        container.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-light)">No recent transactions</div>`;
        return;
    }
    
    container.innerHTML = recent.map(t => `
        <div class="card" style="padding:16px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <div>
                    <div style="font-weight:700;font-size:16px">${t.seniorName}</div>
                    <div style="font-size:13px;color:var(--text-light)">${t.seniorId}</div>
                </div>
                <div style="padding:4px 12px;background:var(--primary-light);border-radius:6px;font-size:12px;font-weight:600;color:var(--primary)">${t.type}</div>
            </div>
            ${t.amount > 0 ? `<div style="font-size:20px;font-weight:700;color:#10b981;margin-bottom:8px">₱${t.amount.toFixed(2)}</div>` : ''}
            ${t.notes ? `<div style="font-size:14px;color:var(--text-light);margin-bottom:8px">${t.notes}</div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-light)">
                <span>${new Date(t.date).toLocaleDateString()}</span>
                <span>By: ${t.staff}</span>
            </div>
        </div>
    `).join('');
}

// Eligibility Functions
function setupEligibility() {
    document.getElementById('startScanBtnEligibility').addEventListener('click', startEligibilityScanner);
    document.getElementById('stopScanBtnEligibility').addEventListener('click', stopEligibilityScanner);
    document.getElementById('qrImageUploadEligibility').addEventListener('change', handleEligibilityImageUpload);
    document.getElementById('eligibilityFilterStatus').addEventListener('change', filterEligibilityList);
    
    // Load and display eligibility list
    loadEligibilityList();
}

async function loadEligibilityList() {
    const tbody = document.getElementById('eligibilityTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-light)">Loading...</td></tr>';

    // Always fetch fresh data from Supabase
    let profiles = [];
    if (window.db && window.supabaseClient) {
        try {
            const data = await window.db.getSeniors();
            if (data && data.length > 0) {
                // Normalise Supabase fields to match expected format
                profiles = data.map(r => ({
                    ...r,
                    birth: r.birth || r.birthday || null,
                }));
                localStorage.setItem('lingap_profiles_v3', JSON.stringify(profiles));
                console.log('[eligibility] Loaded', profiles.length, 'seniors from Supabase');
            }
        } catch(e) {
            console.warn('[eligibility] Supabase fetch failed, using localStorage:', e);
        }
    }
    // Fallback to localStorage if Supabase returned nothing
    if (profiles.length === 0) {
        profiles = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
    }

    const eligibilityStatus = JSON.parse(localStorage.getItem('lingap_eligibility_status') || '{}');
    
    if (profiles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding:40px;text-align:center;color:var(--text-light)">No seniors found</td></tr>';
        return;
    }
    
    let html = '';
    profiles.forEach(senior => {
        const age = calculateAge(senior.birth);
        const isEligible = age >= 60 && (senior.status === 'active' || senior.status === 'pending');
        const status = eligibilityStatus[senior.id] || 'pending';
        const benefits = getAvailableBenefits(age, senior);
        
        const statusColor = status === 'accepted' ? '#10b981' : status === 'rejected' ? '#ef4444' : '#f59e0b';
        const statusBg = status === 'accepted' ? '#d1fae5' : status === 'rejected' ? '#fee2e2' : '#fef3c7';
        
        // Create benefits summary with icons
        const benefitsSummary = benefits.length > 0 
            ? benefits.slice(0, 2).map(b => `<span style="display:inline-block;padding:2px 8px;background:${b.color}15;color:${b.color};border-radius:4px;font-size:11px;font-weight:600;margin:2px 2px 2px 0">${b.name.split(' ')[0]}</span>`).join('') + (benefits.length > 2 ? `<span style="display:inline-block;padding:2px 8px;background:#f3f4f6;color:#64748b;border-radius:4px;font-size:11px;font-weight:600;margin:2px 2px 2px 0">+${benefits.length - 2}</span>` : '')
            : '<span style="color:var(--text-light);font-size:12px">None</span>';
        
        html += `
            <tr style="border-bottom:1px solid var(--border);transition:background 0.2s" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='transparent'">
                <td style="padding:12px 16px;font-weight:600">${senior.name}</td>
                <td style="padding:12px 16px;font-size:13px;color:var(--text-light);font-family:monospace">${senior.id}</td>
                <td style="padding:12px 16px;font-weight:600">${age} years</td>
                <td style="padding:12px 16px">
                    <span style="padding:4px 10px;background:${isEligible ? '#d1fae5' : '#fee2e2'};color:${isEligible ? '#065f46' : '#991b1b'};border-radius:6px;font-size:12px;font-weight:600;text-transform:capitalize">
                        ${isEligible ? 'Eligible' : 'Ineligible'}
                    </span>
                </td>
                <td style="padding:12px 16px;max-width:200px">
                    ${benefitsSummary}
                </td>
                <td style="padding:12px 16px">
                    <span style="padding:4px 10px;background:${statusBg};color:${statusColor};border-radius:6px;font-size:12px;font-weight:600;text-transform:capitalize">
                        ${status}
                    </span>
                </td>
                <td style="padding:12px 16px">
                    <div style="display:flex;gap:8px;justify-content:center">
                        ${status === 'accepted' ? `
                            <span style="padding:6px 12px;background:#d1fae5;color:#065f46;border-radius:6px;font-size:12px;font-weight:600">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display:inline;margin-right:4px;vertical-align:middle"><polyline points="20 6 9 17 4 12"/></svg>
                                Accepted
                            </span>
                        ` : isEligible ? `
                            <button onclick="updateEligibilityDecision('${senior.id}', 'accepted', ${age})" style="padding:6px 12px;background:#10b981;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;margin-right:4px;vertical-align:middle">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Accept
                            </button>
                            <button onclick="updateEligibilityDecision('${senior.id}', 'rejected', ${age})" style="padding:6px 12px;background:#ef4444;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;margin-right:4px;vertical-align:middle">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                Reject
                            </button>
                        ` : `
                            <span style="padding:6px 12px;background:#f3f4f6;color:#9ca3af;border-radius:6px;font-size:12px;font-weight:600">Not Eligible</span>
                        `}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

async function updateEligibilityDecision(seniorId, decision, age) {
    // Save locally immediately
    const eligibilityStatus = JSON.parse(localStorage.getItem('lingap_eligibility_status') || '{}');
    eligibilityStatus[seniorId] = decision;
    localStorage.setItem('lingap_eligibility_status', JSON.stringify(eligibilityStatus));

    if (decision === 'accepted') {
        // If age wasn't passed, look it up from Supabase or localStorage cache
        if (age === undefined || age === null || age === 0) {
            try {
                if (window.db) {
                    const data = await window.db.getSeniorById(seniorId);
                    if (data) {
                        const birth = data.birth || data.birthday || null;
                        age = birth ? calculateAge(birth) : 0;
                    }
                }
                // Fallback: localStorage cache
                if (!age) {
                    const cached = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
                    const found = cached.find(p => p.id === seniorId);
                    if (found) age = calculateAge(found.birth || found.birthday);
                }
            } catch(e) {
                console.warn('[eligibility] Could not look up age for benefit assignment:', e);
            }
        }

        // Compute which benefits this senior qualifies for
        const availableBenefits = typeof getAvailableBenefits === 'function' && age
            ? getAvailableBenefits(age, { id: seniorId })
            : [];
        const benefitNames = availableBenefits.map(b => b.name);

        // Persist to Supabase: activate the senior and assign benefits
        if (window.db) {
            // 1. Update the seniors row (status + benefits snapshot column)
            window.db.updateSenior(seniorId, {
                status: 'active',
                benefits: benefitNames
            }).then(result => {
                if (result) {
                    console.log('[eligibility] Senior row updated:', seniorId, benefitNames);
                } else {
                    console.error('[eligibility] updateSenior returned null for', seniorId);
                }
            }).catch(e => console.error('[eligibility] updateSenior failed:', e));

            // 2. Write individual rows to the user_benefits table
            const assignedBy  = 'osca';
            window.db.addUserBenefits(seniorId, benefitNames, assignedBy).then(rows => {
                if (rows) {
                    console.log('[eligibility] user_benefits rows saved:', rows.length, 'for', seniorId);
                } else {
                    console.error('[eligibility] addUserBenefits returned null for', seniorId);
                    alert('Warning: Benefits accepted but could not write to user_benefits table. Check console.');
                }
            }).catch(e => {
                console.error('[eligibility] addUserBenefits failed:', e);
                alert('Warning: Benefits accepted but failed to sync user_benefits table.');
            });
        }

        loadEligibilityList();
        alert('Eligibility accepted! Senior activated and benefits assigned.');
    } else {
        // Rejection: revoke any previously assigned benefits in user_benefits table
        if (window.db) {
            window.db.revokeAllUserBenefits(seniorId)
                .then(() => console.log('[eligibility] All user_benefits revoked for', seniorId))
                .catch(e => console.warn('[eligibility] revokeAllUserBenefits failed:', e));
        }
        loadEligibilityList();
        alert('Eligibility rejected.');
    }
}

function filterEligibilityList() {
    const filterValue = document.getElementById('eligibilityFilterStatus').value;
    const rows = document.getElementById('eligibilityTableBody').querySelectorAll('tr');
    
    rows.forEach(row => {
        if (filterValue === '') {
            row.style.display = '';
        } else {
            const statusCell = row.cells[5]; // Updated to column 5 (Decision column)
            const statusText = statusCell.textContent.trim().toLowerCase();
            row.style.display = statusText === filterValue ? '' : 'none';
        }
    });
}

function startEligibilityScanner() {
    const video = document.getElementById('qr-video-eligibility');
    const canvas = document.getElementById('qr-canvas-eligibility');
    const status = document.getElementById('scan-status-eligibility');
    
    status.textContent = 'Starting camera...';
    status.style.background = 'rgba(139,92,246,0.9)';
    
    navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
    }).then(stream => {
        videoStreamEligibility = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        video.play();
        
        status.textContent = 'Scanning...';
        
        const canvasContext = canvas.getContext('2d', { willReadFrequently: true });
        
        scanningIntervalEligibility = setInterval(() => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvasContext.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    processEligibilityQRCode(code.data);
                    stopEligibilityScanner();
                }
            }
        }, 300);
    }).catch(err => {
        status.textContent = 'Camera access denied';
        status.style.background = 'rgba(239,68,68,0.9)';
        console.error('Camera error:', err);
    });
}

function stopEligibilityScanner() {
    if (videoStreamEligibility) {
        videoStreamEligibility.getTracks().forEach(track => track.stop());
        videoStreamEligibility = null;
    }
    if (scanningIntervalEligibility) {
        clearInterval(scanningIntervalEligibility);
        scanningIntervalEligibility = null;
    }
    
    const video = document.getElementById('qr-video-eligibility');
    const status = document.getElementById('scan-status-eligibility');
    
    video.style.display = 'none';
    status.textContent = 'Ready to scan';
    status.style.background = 'rgba(0,0,0,0.8)';
}

function handleEligibilityImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.getElementById('qr-canvas-eligibility');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                processEligibilityQRCode(code.data);
            } else {
                alert('No QR code found in image');
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function processEligibilityQRCode(data) {
    try {
        const qrData = JSON.parse(data);
        checkEligibility(qrData.id);
    } catch (err) {
        console.error('QR parse error:', err);
        alert('Invalid QR code format');
    }
}

async function checkEligibility(seniorId) {
    if (!seniorId) {
        alert('Please scan a QR code');
        return;
    }

    const resultDiv = document.getElementById('eligibilityResult');
    resultDiv.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-light)">Looking up senior...</div>';

    // Try Supabase first
    let senior = null;
    if (window.db && window.supabaseClient) {
        try {
            const data = await window.db.getSeniorById(seniorId);
            if (data) {
                senior = { ...data, birth: data.birth || data.birthday || null };
                console.log('[eligibility] Found senior in Supabase:', senior.name, 'birth:', senior.birth, 'status:', senior.status);
            }
        } catch(e) {
            console.warn('[eligibility] Supabase lookup failed:', e);
        }
    }
    // Fallback to localStorage
    if (!senior) {
        const profiles = JSON.parse(localStorage.getItem('lingap_profiles_v3') || '[]');
        senior = profiles.find(p => p.id === seniorId) || null;
    }

    const eligibilityStatus = JSON.parse(localStorage.getItem('lingap_eligibility_status') || '{}');
    
    if (!senior) {
        resultDiv.innerHTML = `
            <div style="padding:40px 24px">
                <div style="width:80px;height:80px;margin:0 auto 16px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </div>
                <h3 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ef4444">Not Found</h3>
                <p style="margin:0;color:var(--text-light)">Senior citizen not found in database</p>
            </div>
        `;
        return;
    }
    
    const age = calculateAge(senior.birth);
    const isEligible = age >= 60 && (senior.status === 'active' || senior.status === 'pending');
    const availableBenefits = getAvailableBenefits(age, senior);
    const currentStatus = eligibilityStatus[senior.id] || 'pending';
    
    resultDiv.innerHTML = `
        <div style="padding:24px">
            <div style="width:80px;height:80px;margin:0 auto 16px;background:${isEligible ? '#10b981' : '#ef4444'};border-radius:50%;display:flex;align-items:center;justify-content:center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    ${isEligible ? '<polyline points="20 6 9 17 4 12"/>' : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'}
                </svg>
            </div>
            <h3 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${isEligible ? '#10b981' : '#ef4444'}">${isEligible ? 'Eligible' : 'Not Eligible'}</h3>
            <p style="margin:0 0 24px;color:var(--text-light)">${isEligible ? age < 90 ? 'Age-qualified beneficiary' : age < 100 ? 'Birthday Incentive eligible' : 'Centenarian Award recipient' : 'Must be 60 years or older to qualify'}</p>
            
            <div style="background:var(--bg);padding:20px;border-radius:12px;text-align:left;margin-bottom:20px">
                <div style="margin-bottom:12px">
                    <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">Senior Citizen</div>
                    <div style="font-size:18px;font-weight:700">${senior.name}</div>
                    <div style="font-size:14px;color:var(--text-light)">${senior.id}</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                    <div>
                        <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">Age</div>
                        <div style="font-size:16px;font-weight:700">${age} years</div>
                    </div>
                    <div>
                        <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:4px">Status</div>
                        <div style="font-size:16px;font-weight:700;text-transform:capitalize">${senior.status || 'Active'}</div>
                    </div>
                </div>
                
                ${isEligible ? `
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border)">
                    <div style="font-size:12px;color:var(--text-light);text-transform:uppercase;font-weight:600;margin-bottom:10px">Available Benefits</div>
                    <div style="display:grid;gap:10px">
                        ${availableBenefits.map(benefit => `
                            <div style="padding:12px;background:white;border-left:4px solid ${benefit.color};border-radius:6px">
                                <div style="font-weight:700;color:#1e293b;font-size:14px;margin-bottom:2px">${benefit.name}</div>
                                <div style="font-size:12px;color:var(--text-light)">${benefit.description}</div>
                                ${benefit.amount ? `<div style="font-size:13px;color:${benefit.color};font-weight:700;margin-top:6px">${benefit.amount}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            
            ${isEligible ? currentStatus === 'accepted' ? `
            <div style="padding:14px 20px;background:#d1fae5;border:2px solid #10b981;border-radius:8px;text-align:center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" style="display:inline;margin-right:8px;vertical-align:middle">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style="font-size:14px;font-weight:700;color:#065f46">Eligibility Accepted</span>
            </div>
            ` : `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <button onclick="updateEligibilityDecision('${senior.id}', 'accepted', ${age})" style="padding:12px 16px;background:#10b981;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;transition:all 0.2s">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;margin-right:6px;vertical-align:middle">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Accept Eligibility
                </button>
                <button onclick="updateEligibilityDecision('${senior.id}', 'rejected', ${age})" style="padding:12px 16px;background:#ef4444;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:700;transition:all 0.2s">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;margin-right:6px;vertical-align:middle">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Reject Eligibility
                </button>
            </div>
            ` : ''}
        </div>
    `;
}

// Get available benefits based on age
// Benefit names MUST match the names in the benefits table / DEFAULT_BENEFIT_PROGRAMS
function getAvailableBenefits(age, senior) {
    const benefits = [];

    // Base benefits for ALL seniors 60+
    if (age >= 60) {
        benefits.push({ name: '20% Senior Discount',      description: 'Mandatory 20% discount on purchases and services nationwide', color: '#22c55e' });
        benefits.push({ name: 'Medical/Dental Assistance', description: 'Healthcare and dental support services', color: '#3b82f6' });
        benefits.push({ name: 'Burial Assistance',         description: 'Financial support for funeral services', color: '#6366f1' });
        benefits.push({ name: 'Social Pension Program',    description: 'Monthly financial assistance from LGU', color: '#10b981' });
        benefits.push({ name: 'Free Medical Checkup',      description: 'Regular health monitoring and preventive care', color: '#06b6d4' });
    }

    // Birthday Incentives Program (90–99)
    if (age >= 90 && age < 100) {
        const amount = getBirthdayIncentiveAmount(age);
        benefits.push({ name: 'Birthday Gift', description: 'Birthday cake and cheque on celebrating birthday', color: '#f59e0b', amount: `₱${amount.toLocaleString()} per birthday` });
    }

    // Centenarian Award + Birthday Incentives (100+)
    if (age >= 100) {
        benefits.push({ name: 'Birthday Gift', description: 'Birthday cake and cheque on celebrating birthday', color: '#f59e0b', amount: '₱100,000 (Centenarian)' });
    }
    
    return benefits;
}

// Calculate birthday incentive amount based on age
function getBirthdayIncentiveAmount(age) {
    if (age >= 100) {
        // Age 100+ gets the highest amount for 94-99
        return 10000;
    } else if (age >= 94) {
        return 10000;
    } else if (age === 93) {
        return 8500;
    } else if (age === 92) {
        return 7000;
    } else if (age === 91) {
        return 5000;
    } else if (age === 90) {
        return 3000;
    }
    return 0;
}

// Logout
document.getElementById('logoutBtnOSCA').addEventListener('click', () => {
    window.location.href = 'logout.php';
});
</script>
<script src="assets/age-benefits-management.js"></script>
</body>
</html>



