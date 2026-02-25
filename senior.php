<?php
session_start();
if (empty($_SESSION['role']) || $_SESSION['role'] !== 'senior') {
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
    <title>LingapApu — Senior Citizen Portal</title>
    <link rel="manifest" href="manifest.webmanifest">
    <meta name="theme-color" content="#22c55e">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="LingapApu">
    <link rel="apple-touch-icon" href="assets/pics/logo.png">
    <link rel="stylesheet" href="assets/style.css">
    <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <script>
        // Setup tabs
        function setupTabs() {
            document.querySelectorAll('[data-tab]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabName = link.getAttribute('data-tab');
                    
                    // Update active states
                    document.querySelectorAll('.navlink').forEach(l => l.classList.remove('active'));
                    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                    
                    link.classList.add('active');
                    document.getElementById(tabName + 'Tab').classList.add('active');
                });
            });
        }

        // Setup mobile nav toggle with swipe gestures
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
          
          // Function to close nav
          const closeNav = () => {
            nav.classList.remove('open', 'active');
            toggle.setAttribute('aria-expanded', 'false');
            if(overlay) overlay.classList.remove('open', 'active');
            document.body.style.overflow = '';
            nav.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          };
          
          // Function to open nav
          const openNav = () => {
            nav.classList.add('open', 'active');
            toggle.setAttribute('aria-expanded', 'true');
            if(overlay) overlay.classList.add('open', 'active');
            document.body.style.overflow = 'hidden';
            nav.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
          };
          
          // Toggle button click
          toggle.addEventListener('click', ()=>{
            const isOpen = nav.classList.contains('open') || nav.classList.contains('active');
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
            if(e.key === 'Escape' && (nav.classList.contains('open') || nav.classList.contains('active'))) closeNav();
          });
          
          // Swipe from left edge to open
          document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            
            if(touchStartX < 30 && !nav.classList.contains('active') && !nav.classList.contains('open')){
              isDragging = true;
              startTranslateX = -280;
              nav.style.transition = 'none';
            }
            else if((nav.classList.contains('active') || nav.classList.contains('open')) && touchStartX < 280){
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
                overlay.classList.add('active', 'open');
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

        document.addEventListener('DOMContentLoaded', () => {
            setupTabs();
            setupNavToggle();
            initSeniorPortal();
        });
    </script>
</head>
<body>
<header class="header">
  <div class="brand">
    <img src="assets/pics/logo.png" alt="LingapApu" style="height:32px;width:auto;margin-right:8px">
    <div>
      <div class="logo">LingapApu</div>
      <div class="small">Floridablanca, Pampanga</div>
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
        <div class="small" style="color:var(--text-light)">Senior Portal</div>
      </div>
    </div>
    <a href="#dashboard" class="navlink active" data-tab="dashboard">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
      Dashboard
    </a>
    <a href="#benefits" class="navlink" data-tab="benefits">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
      Benefits & Discounts
    </a>
    <a href="#qrcode" class="navlink" data-tab="qrcode">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/><path d="M17 17h4v4h-4z"/><path d="M13 17h1v4h-1z"/>
      </svg>
      QR Code
    </a>
    <a href="#transactions" class="navlink" data-tab="transactions">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
      Transactions
    </a>
    <a href="#profile" class="navlink" data-tab="profile">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      My Profile
    </a>
  </nav>
</header>
<main class="container" style="max-width:100%;padding:0 20px">
  <div class="card" style="max-width:100%">
    
    <!-- Dashboard Tab -->
    <div class="tab-panel active" id="dashboardTab">
      <!-- Welcome Banner -->
      <div style="background:#22c55e;padding:28px 32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
            <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.5px">Welcome Back, <span id="dashGreetingName">Senior</span>!</h1>
          </div>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:13px" id="welcomeMessage">Loading your dashboard...</p>
        </div>
        <div style="text-align:right">
          <div style="color:#fff;font-size:22px;font-weight:700;font-variant-numeric:tabular-nums" id="dashClock">--:--</div>
          <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:2px" id="dashDate">--</div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:24px">
        <div class="card" style="background:#ffffff;border:1px solid var(--border);border-left:4px solid #22c55e;padding:20px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p style="margin:0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Active Benefits</p>
              <h2 style="margin:6px 0 0;font-size:32px;font-weight:700;color:#1f2937" id="dashBenefitsCount">0</h2>
              <p style="margin:4px 0 0;font-size:12px;color:#22c55e;font-weight:500">Programs enrolled</p>
            </div>
            <div style="width:44px;height:44px;background:#dcfce7;border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
          </div>
        </div>

        <div class="card" style="background:#ffffff;border:1px solid var(--border);border-left:4px solid #3b82f6;padding:20px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p style="margin:0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Total Transactions</p>
              <h2 style="margin:6px 0 0;font-size:32px;font-weight:700;color:#1f2937" id="dashTransactionsCount">0</h2>
              <p style="margin:4px 0 0;font-size:12px;color:#3b82f6;font-weight:500">All-time records</p>
            </div>
            <div style="width:44px;height:44px;background:#eff6ff;border:1px solid #3b82f6;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
        </div>

        <div class="card" style="background:#ffffff;border:1px solid var(--border);border-left:4px solid #f59e0b;padding:20px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p style="margin:0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Last Activity</p>
              <h2 style="margin:6px 0 0;font-size:16px;font-weight:700;color:#1f2937;line-height:1.3" id="dashLastActivity">No activity</h2>
              <p style="margin:4px 0 0;font-size:12px;color:#f59e0b;font-weight:500" id="dashLastActivityType">—</p>
            </div>
            <div style="width:44px;height:44px;background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
        </div>

        <div class="card" style="background:#ffffff;border:1px solid var(--border);border-left:4px solid #8b5cf6;padding:20px">
          <div style="display:flex;align-items:center;justify-content:space-between">
            <div>
              <p style="margin:0;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Senior ID</p>
              <h2 style="margin:6px 0 0;font-size:14px;font-weight:700;color:#1f2937;font-family:monospace" id="dashSeniorId">---</h2>
              <p style="margin:4px 0 0;font-size:12px;color:#8b5cf6;font-weight:500" id="dashMemberSince">—</p>
            </div>
            <div style="width:44px;height:44px;background:#f5f3ff;border:1px solid #8b5cf6;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px">
        <button onclick="document.querySelector('[data-tab=qrcode]').click()" style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:16px 12px;cursor:pointer;text-align:center;transition:all 0.2s" onmouseover="this.style.borderColor='#22c55e';this.style.background='#f0fdf4'" onmouseout="this.style.borderColor='var(--border)';this.style.background='#fff'">
          <div style="width:36px;height:36px;background:#dcfce7;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/><path d="M17 17h4v4h-4z"/><path d="M13 17h1v4h-1z"/></svg>
          </div>
          <div style="font-size:12px;font-weight:600;color:#374151">My QR Code</div>
        </button>
        <button onclick="document.querySelector('[data-tab=benefits]').click()" style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:16px 12px;cursor:pointer;text-align:center;transition:all 0.2s" onmouseover="this.style.borderColor='#22c55e';this.style.background='#f0fdf4'" onmouseout="this.style.borderColor='var(--border)';this.style.background='#fff'">
          <div style="width:36px;height:36px;background:#dcfce7;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div style="font-size:12px;font-weight:600;color:#374151">Benefits</div>
        </button>
        <button onclick="document.querySelector('[data-tab=transactions]').click()" style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:16px 12px;cursor:pointer;text-align:center;transition:all 0.2s" onmouseover="this.style.borderColor='#22c55e';this.style.background='#f0fdf4'" onmouseout="this.style.borderColor='var(--border)';this.style.background='#fff'">
          <div style="width:36px;height:36px;background:#dcfce7;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div style="font-size:12px;font-weight:600;color:#374151">Transactions</div>
        </button>
        <button onclick="document.querySelector('[data-tab=profile]').click()" style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:16px 12px;cursor:pointer;text-align:center;transition:all 0.2s" onmouseover="this.style.borderColor='#22c55e';this.style.background='#f0fdf4'" onmouseout="this.style.borderColor='var(--border)';this.style.background='#fff'">
          <div style="width:36px;height:36px;background:#dcfce7;border-radius:8px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div style="font-size:12px;font-weight:600;color:#374151">My Profile</div>
        </button>
      </div>

      <!-- Recent Activity -->
      <div class="card" style="background:#ffffff;border:1px solid var(--border);padding:24px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
          <div style="width:36px;height:36px;background:#dcfce7;border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <h3 style="margin:0;font-size:16px;font-weight:700">Recent Activity</h3>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7280">Your latest transactions and events</p>
          </div>
        </div>
        <div id="dashRecentActivity" style="max-height:320px;overflow-y:auto"></div>
      </div>
    </div>

    <!-- Benefits & Discounts Tab -->
    <div class="tab-panel" id="benefitsTab">
      <!-- Header Banner -->
      <div style="background:#22c55e;padding:28px 32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div>
              <h2 style="margin:0;color:#fff;font-size:22px;font-weight:700">My Benefits &amp; Discounts</h2>
              <p style="margin:3px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Programs and entitlements you are enrolled in</p>
            </div>
          </div>
          <span id="benefitsCountBadge" style="background:rgba(255,255,255,0.2);color:#fff;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;white-space:nowrap">0 Programs</span>
        </div>
      </div>

      <!-- Info bar -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:10px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p style="margin:0;font-size:13px;color:#166534">Benefits are assigned by the OSCA office. Contact them to enroll in additional programs or for inquiries.</p>
      </div>

      <div id="benefitsList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px"></div>
      <div id="benefitsListPagination"></div>
    </div>

    <!-- My Profile Tab -->
    <div class="tab-panel" id="profileTab">
      <!-- Header Banner -->
      <div style="background:#22c55e;padding:28px 32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden" id="profileBannerAvatar">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h2 style="margin:0;color:#fff;font-size:22px;font-weight:700" id="profileBannerName">My Profile</h2>
              <p style="margin:3px 0 0;color:rgba(255,255,255,0.85);font-size:13px" id="profileBannerSub">Loading...</p>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:10px 16px;text-align:center">
              <div style="color:rgba(255,255,255,0.8);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Age</div>
              <div style="color:#fff;font-size:18px;font-weight:800" id="profileBannerAge">—</div>
            </div>
            <div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:10px 16px;text-align:center">
              <div style="color:rgba(255,255,255,0.8);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Senior ID</div>
              <div style="color:#fff;font-size:14px;font-weight:800;font-family:monospace" id="profileBannerId">—</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info chips row -->
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px" id="profileInfoChips"></div>

      <div class="grid2" style="gap:20px">
        <!-- Government ID Card - Philippine OSCA Style -->
        <div style="padding:16px 0">
          <!-- Card wrapper with aspect ratio like a real ID -->
          <div id="govIdCard" style="width:100%;max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1.5px solid #d1d5db;font-family:'Arial',sans-serif;position:relative;">
            
            <!-- TOP STRIPE — Republic Header -->
            <div style="background:#1a3a2f;padding:6px 14px;display:flex;align-items:center;gap:10px">
              <!-- PH Sun/Star Seal placeholder -->
              <div style="width:36px;height:36px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
                <img src="assets/pics/logo.png" alt="Seal" style="width:30px;height:30px;object-fit:contain;filter:brightness(0) saturate(100%) invert(35%) sepia(80%) saturate(600%) hue-rotate(100deg)">
              </div>
              <div style="flex:1;text-align:center">
                <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:#d4af37;text-transform:uppercase">Republic of the Philippines</div>
                <div style="font-size:7px;color:rgba(255,255,255,0.75);letter-spacing:0.5px">Office for Senior Citizens Affairs (OSCA)</div>
              </div>
              <div style="width:36px;height:36px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <span style="color:#fff;font-size:16px;font-weight:900">★</span>
              </div>
            </div>

            <!-- GREEN ACCENT BAR -->
            <div style="height:4px;background:linear-gradient(90deg,#22c55e 0%,#16a34a 50%,#d4af37 100%)"></div>

            <!-- CARD TITLE -->
            <div style="background:#f0fdf4;border-bottom:1px solid #bbf7d0;padding:5px 14px;text-align:center">
              <div style="font-size:12px;font-weight:900;letter-spacing:2px;color:#166534;text-transform:uppercase">Senior Citizen Identification Card</div>
            </div>

            <!-- MAIN BODY -->
            <div style="display:flex;gap:0;padding:14px;background:#fff">
              
              <!-- LEFT: Photo -->
              <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;margin-right:14px">
                <div id="idPhoto" style="width:110px;height:135px;background:#e5e7eb;border:2px solid #1a3a2f;overflow:hidden;position:relative;flex-shrink:0">
                  <img src="assets/pics/prof.jpg" alt="Photo" style="width:100%;height:100%;object-fit:cover">
                  <button onclick="openPhotoUploadModal()" style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.55);border:none;color:#fff;font-size:9px;padding:3px;cursor:pointer;font-weight:700" onmouseover="this.style.background='rgba(34,197,94,0.85)'" onmouseout="this.style.background='rgba(0,0,0,0.55)'">✎ Edit</button>
                </div>
                <!-- Signature line -->
                <div style="margin-top:10px;width:110px;border-top:1px solid #374151;padding-top:3px;text-align:center">
                  <div style="font-size:7px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Signature</div>
                </div>
              </div>

              <!-- RIGHT: Info -->
              <div style="flex:1;display:flex;flex-direction:column;gap:7px">
                <!-- ID Number badge -->
                <div style="background:#1a3a2f;color:#d4af37;font-size:11px;font-weight:900;letter-spacing:2px;padding:4px 8px;text-align:center;border-radius:2px;font-family:monospace" id="idCardNumber">ID: -----------</div>

                <!-- Name -->
                <div style="border-bottom:1px solid #e5e7eb;padding-bottom:5px">
                  <div style="font-size:7px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px">Full Name</div>
                  <div style="font-size:13px;font-weight:900;color:#111827;text-transform:uppercase;letter-spacing:0.5px;line-height:1.2" id="idCardName">---</div>
                </div>

                <!-- DOB / Age / Sex row -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                  <div>
                    <div style="font-size:7px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Date of Birth</div>
                    <div style="font-size:10px;font-weight:700;color:#1f2937;font-family:monospace" id="idCardBirth">---</div>
                  </div>
                  <div>
                    <div style="font-size:7px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Age</div>
                    <div style="font-size:10px;font-weight:700;color:#1f2937" id="idCardAge">---</div>
                  </div>
                </div>

                <!-- Address -->
                <div>
                  <div style="font-size:7px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Address</div>
                  <div style="font-size:9px;font-weight:600;color:#374151;line-height:1.4" id="idCardAddress">---</div>
                </div>

                <!-- Contact -->
                <div>
                  <div style="font-size:7px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Contact No.</div>
                  <div style="font-size:9px;font-weight:600;color:#374151" id="idCardContact">---</div>
                </div>
              </div>
            </div>

            <!-- BOTTOM STRIP -->
            <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:8px 14px;display:flex;align-items:flex-end;justify-content:space-between">
              <!-- Registered date + authority -->
              <div>
                <div style="font-size:7px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">Date Issued</div>
                <div style="font-size:9px;font-weight:700;color:#1f2937;font-family:monospace" id="idCardRegistered">---</div>
                <div style="margin-top:6px;font-size:7px;color:#9ca3af;font-style:italic">Authorized by LINGAPAPU</div>
              </div>

              <!-- QR Code lower right -->
              <div style="display:flex;flex-direction:column;align-items:center;margin-right:4px">
                <div style="background:#dcfce7;padding:6px;border:2px solid #22c55e">
                  <div id="idCardQR" style="width:80px;height:80px;display:flex;align-items:center;justify-content:center"></div>
                </div>
                <div style="font-size:7px;color:#22c55e;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">Scan to Verify</div>
              </div>
            </div>

            <!-- BOTTOM COLOR BAR -->
            <div style="height:5px;background:linear-gradient(90deg,#d4af37 0%,#22c55e 50%,#1a3a2f 100%)"></div>
          </div>

          <!-- Download button below card -->
          <div style="text-align:center;margin-top:12px">
            <button class="btn ghost" onclick="downloadIDCard()" style="font-size:12px;padding:6px 18px;border-color:#22c55e;color:#22c55e">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px;vertical-align:middle"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download ID Card
            </button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px">
          <!-- Update Profile Card -->
          <div class="card" style="background:#ffffff;border:1px solid var(--border);padding:24px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
              <div style="width:36px;height:36px;background:#dcfce7;border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div>
                <h3 style="margin:0;font-size:16px;font-weight:700">Update Profile</h3>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280">Keep your contact details up to date</p>
              </div>
            </div>
            <form id="updateProfileForm">
              <div class="input-group" style="margin-bottom:14px">
                <label style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;display:block">Contact Number</label>
                <input type="tel" id="updateContact" class="input" placeholder="09XX XXX XXXX" required style="font-size:14px">
              </div>
              <div class="input-group" style="margin-bottom:14px">
                <label style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;display:block">Address / City</label>
                <input type="text" id="updateAddress" class="input" placeholder="Complete address" required style="font-size:14px">
              </div>
              <div class="input-group" style="margin-bottom:14px">
                <label style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;display:block">Barangay</label>
                <input type="text" id="updateBarangay" class="input" placeholder="e.g. Poblacion" style="font-size:14px">
              </div>
              <div class="input-group" style="margin-bottom:14px">
                <label style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;display:block">Civil Status</label>
                <select id="updateCivilStatus" class="input" style="font-size:14px">
                  <option value="">Select Civil Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                  <option value="Annulled">Annulled</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div class="input-group" style="margin-bottom:18px">
                <label style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;display:block">Notes / Medical History</label>
                <textarea id="updateNotes" class="input" rows="3" placeholder="Any important notes..." style="font-size:14px;resize:vertical"></textarea>
              </div>
              <button type="submit" class="btn" style="width:100%;justify-content:center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Changes
              </button>
            </form>
          </div>

          <!-- Personal Info Summary -->
          <div class="card" style="background:#f9fafb;border:1px solid var(--border);padding:20px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
              <div style="width:36px;height:36px;background:#dcfce7;border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <h3 style="margin:0;font-size:15px;font-weight:700">Personal Information</h3>
                <p style="margin:2px 0 0;font-size:12px;color:#6b7280">Read-only fields managed by OSCA</p>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px" id="profileInfoGrid"></div>
          </div>

          <!-- Sign Out Card -->
          <div class="card" style="background:#fff;border:1px solid #fca5a5;padding:20px">
            <div style="display:flex;align-items:start;gap:12px">
              <div style="width:36px;height:36px;background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </div>
              <div style="flex:1">
                <h4 style="margin:0 0 4px;font-size:15px;font-weight:700;color:#991b1b">Sign Out</h4>
                <p style="margin:0 0 14px;font-size:13px;color:#7f1d1d">End your current session and return to the login page.</p>
                <button id="logoutBtn" class="btn" style="background:#dc2626;border-color:#dc2626;font-size:13px;padding:8px 20px">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:7px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- QR Code Tab -->
    <div class="tab-panel" id="qrcodeTab">
      <!-- Header Banner -->
      <div style="background:#22c55e;padding:28px 32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/><path d="M17 17h4v4h-4z"/><path d="M13 17h1v4h-1z"/></svg>
          </div>
          <div>
            <h2 style="margin:0;color:#fff;font-size:22px;font-weight:700">My QR Code</h2>
            <p style="margin:3px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Present this for identification, verification &amp; transactions</p>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start">
        <!-- QR Card -->
        <div class="card" style="background:#ffffff;border:1px solid var(--border);text-align:center;padding:28px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;justify-content:center">
            <div style="width:32px;height:32px;background:#dcfce7;border:1px solid #22c55e;border-radius:6px;display:flex;align-items:center;justify-content:center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/></svg>
            </div>
            <h3 style="margin:0;font-size:16px;font-weight:700">Universal QR Code</h3>
          </div>
          <div style="display:inline-block;padding:16px;background:#f0fdf4;border-radius:10px;border:2px solid #22c55e;margin-bottom:16px">
            <div id="universalQR"></div>
          </div>
          <div style="margin-bottom:16px">
            <div style="font-size:13px;font-weight:700;color:#1f2937" id="qrNameLabel">—</div>
            <div style="font-size:11px;color:#6b7280;font-family:monospace;margin-top:2px" id="qrIdLabel">—</div>
          </div>
          <div style="display:flex;gap:10px;margin-top:4px">
            <button class="btn" style="flex:1;justify-content:center" id="downloadUniversalQR">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </button>
            <button class="btn" style="flex:1;justify-content:center;background:#3b82f6;border-color:#3b82f6" id="shareUniversalQR">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share / Save
            </button>
          </div>
        </div>

        <!-- Instructions + tips -->
        <div style="display:flex;flex-direction:column;gap:14px">
          <!-- How to use -->
          <div class="card" style="background:#fff;border:1px solid var(--border);padding:20px">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
              <div style="width:36px;height:36px;background:#dcfce7;border:1px solid #22c55e;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h4 style="margin:0;font-size:15px;font-weight:700">How to Use</h4>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;gap:12px;align-items:start">
                <div style="width:24px;height:24px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:800;color:#16a34a">1</div>
                <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">Show this QR code to OSCA staff for identification and verification.</p>
              </div>
              <div style="display:flex;gap:12px;align-items:start">
                <div style="width:24px;height:24px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:800;color:#16a34a">2</div>
                <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">Staff will scan it to pull up your complete profile and process services.</p>
              </div>
              <div style="display:flex;gap:12px;align-items:start">
                <div style="width:24px;height:24px;background:#dcfce7;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:800;color:#16a34a">3</div>
                <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">Download and print your QR for offline use at OSCA offices.</p>
              </div>
            </div>
          </div>

          <!-- Security note -->
          <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:14px 16px;display:flex;gap:10px;align-items:start">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="flex-shrink:0;margin-top:1px"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <p style="margin:0;font-size:13px;color:#78350f"><strong>Keep it secure</strong> — your QR contains personal identification data. Do not share screenshots with unknown individuals.</p>
          </div>

          <!-- QR contains -->
          <div class="card" style="background:#f9fafb;border:1px solid var(--border);padding:16px">
            <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px">This QR contains</p>
            <div style="display:flex;flex-direction:column;gap:6px" id="qrContentsInfo"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transactions Tab -->
    <div class="tab-panel" id="transactionsTab">
      <!-- Header Banner -->
      <div style="background:#22c55e;padding:28px 32px;border-radius:8px;margin-bottom:24px;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <h2 style="margin:0;color:#fff;font-size:22px;font-weight:700">Transaction History</h2>
              <p style="margin:3px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Your benefit claims and service records</p>
            </div>
          </div>
          <span id="txCountBadge" style="background:rgba(255,255,255,0.2);color:#fff;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:700;white-space:nowrap">0 Records</span>
        </div>
      </div>

      <!-- Summary stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px" id="txSummaryStats"></div>

      <!-- Cards list -->
      <div id="transactionsTable" style="display:flex;flex-direction:column;gap:10px"></div>
      <div id="txPagination"></div>
    </div>

  </div>
</main>

<!-- Photo Upload Modal -->
<div id="photoUploadModal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;align-items:center;justify-content:center">
  <div style="background:#fff;border-radius:8px;max-width:500px;width:90%;padding:28px;border:1px solid var(--border)">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h3 style="margin:0;font-size:18px;font-weight:700">Change Profile Picture</h3>
      <button onclick="closePhotoUploadModal()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-light);">×</button>
    </div>
    
    <div style="margin-bottom:20px">
      <label style="display:block;margin-bottom:10px;font-weight:500;color:var(--text)">Capture New Photo</label>
      
      <div id="profileCameraContainer" style="position:relative;border-radius:8px;overflow:hidden;background:#000;margin-bottom:10px;aspect-ratio:1;border:1px solid var(--border)">
        <video id="profileCameraVideo" autoplay muted playsinline style="width:100%;height:100%;display:none;background:#000;object-fit:cover;"></video>
        
        <!-- Start Camera Button -->
        <div id="profileCameraStartButton" style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:#ffffff">
          <button type="button" onclick="initializeProfileCamera()" style="background:#22c55e;color:#fff;border:none;padding:10px 22px;border-radius:6px;font-weight:600;font-size:14px;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;gap:10px" onmouseover="this.style.background='#16a34a'" onmouseout="this.style.background='#22c55e'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3.5"/><path d="M12 4c4.418 0 8 1.79 8 4v8c0 2.21-3.582 4-8 4s-8-1.79-8-4V8c0-2.21 3.582-4 8-4m0-2C6.477 2 2 4.686 2 8v8c0 3.314 4.477 6 10 6s10-2.686 10-6V8c0-3.314-4.477-6-10-6z"/>
            </svg>
            Start Camera
          </button>
        </div>
        
        <!-- Camera Guide Overlay -->
        <div id="profileCameraGuideOverlay" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;display:none">
          <!-- Face Frame Guide -->
          <svg style="position:absolute;top:0;left:0;width:100%;height:100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
            <!-- Darkened corners -->
            <defs>
              <mask id="profileFaceMask">
                <rect width="400" height="400" fill="white"/>
                <!-- Circular face frame -->
                <circle cx="200" cy="200" r="150" fill="black"/>
              </mask>
            </defs>
            <rect width="400" height="400" fill="rgba(0,0,0,0.4)" mask="url(#profileFaceMask)"/>
            
            <!-- Face guide border -->
            <circle cx="200" cy="200" r="150" fill="none" stroke="#667eea" stroke-width="2" stroke-dasharray="5,5" opacity="0.8"/>
            
            <!-- Center line -->
            <line x1="200" y1="50" x2="200" y2="350" stroke="#667eea" stroke-width="1" opacity="0.5" stroke-dasharray="3,3"/>
            <line x1="50" y1="200" x2="350" y2="200" stroke="#667eea" stroke-width="1" opacity="0.5" stroke-dasharray="3,3"/>
            
            <!-- Eye guide -->
            <circle cx="160" cy="160" r="15" fill="none" stroke="#10b981" stroke-width="2" opacity="0.6"/>
            <circle cx="240" cy="160" r="15" fill="none" stroke="#10b981" stroke-width="2" opacity="0.6"/>
            
            <!-- Tips text -->
            <text x="200" y="370" font-size="14" font-weight="bold" fill="#10b981" text-anchor="middle" opacity="0.9">Position face in circle frame</text>
          </svg>
          
          <!-- Tips Bar at bottom -->
          <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.5);padding:20px 16px 12px;color:#fff;font-size:12px;text-align:center">
            <div id="profileCameraHint" style="color:#10b981;font-weight:600;margin-bottom:4px">Center your face</div>
            <div style="color:#cbd5e1;font-size:11px;line-height:1.4">
              📸 Look straight at camera • Ensure face is well-lit
            </div>
          </div>
        </div>
        
        <div id="profileCameraNotSupported" style="display:none;padding:28px 16px;text-align:center;background:#fef2f2;border-radius:8px;border:1px solid #fec2c2;position:absolute;top:0;left:0;right:0;bottom:0;flex-direction:column;align-items:center;justify-content:center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" style="margin:0 auto 10px;display:block">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style="margin:0;font-size:13px;color:#7f1d1d;font-weight:600">Camera not available</p>
          <p style="margin:3px 0 0;font-size:12px;color:#9f1239">Please enable camera access</p>
        </div>
        
        <div id="profilePhotoPreview" style="display:none;position:absolute;top:0;left:0;right:0;bottom:0;text-align:center;padding:10px;background:#fff;border-radius:8px;flex-direction:column;align-items:center;justify-content:center">
          <canvas id="profileCapturedPhotoCanvas" style="max-width:calc(100% - 20px);aspect-ratio:1;border-radius:6px;object-fit:contain;background:#f3f4f6;margin:0 auto;border:1px solid var(--border);"></canvas>
          <p style="margin:10px 0 0;font-size:12px;color:#6b7280;"></p>
        </div>
      </div>

      <div style="display:flex;gap:8px">
        <button type="button" id="profileCapturePhotoBtn" class="btn" style="flex:1;display:none" onclick="captureProfilePhoto()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle">
            <circle cx="12" cy="12" r="1"/><circle cx="12" cy="12" r="8"/>
          </svg>
          Capture Photo
        </button>
        <button type="button" id="profileRetakePhotoBtn" class="btn ghost" style="flex:1;display:none" onclick="retakeProfilePhoto()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Retake
        </button>
      </div>
    </div>
    
    <div style="display:flex;gap:12px">
      <button onclick="closePhotoUploadModal()" class="btn ghost" style="flex:1">Cancel</button>
      <button onclick="saveProfilePhoto()" class="btn" style="flex:1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:middle">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        Save Photo
      </button>
    </div>
  </div>
</div>

<style>
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

<footer class="footer">
  <div style="max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">
    <div class="small">Made for: Office for Senior Citizens Affairs — Floridablanca</div>
    <div class="small">Contact: (045) 123-4567 · osca@floridablanca.gov.ph</div>
  </div>
</footer>

<!-- Toast Notification -->
<div id="toast" style="position:fixed;bottom:24px;right:24px;background:#22c55e;color:#fff;padding:12px 20px;border-radius:6px;border:1px solid #16a34a;display:none;z-index:10000;font-weight:500;font-size:14px"></div>

<!-- Supabase -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/dist/umd/supabase.js"></script>
<script src="assets/supabase-config.js"></script>
<script src="assets/db.js"></script>
<!-- face-api removed; biometric login uses WebAuthn (no ML models needed) -->
<script src="assets/senior-portal.js"></script>
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
</script>
</body>
</html>



