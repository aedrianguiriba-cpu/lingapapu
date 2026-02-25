<?php session_start(); ?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <link rel="icon" type="image/png" href="assets/pics/logo.png">
  <link rel="apple-touch-icon" href="assets/pics/logo.png">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"/>
  <title>LingapApu — Senior</title>
  <link rel="manifest" href="senior-manifest.php">
  <meta name="theme-color" content="#16a34a">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="LingapApu">
  <link rel="apple-touch-icon" href="assets/pics/logo.png">
  <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --green:   #16a34a;
      --green-l: #22c55e;
      --green-bg:#dcfce7;
      --gold:    #d4af37;
      --surface: #ffffff;
      --bg:      #f3f4f6;
      --border:  #e5e7eb;
      --text:    #111827;
      --muted:   #6b7280;
      --nav-h:   64px;
      --safe-b:  env(safe-area-inset-bottom, 0px);
    }

    html, body {
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
    }

    /* ── Status bar area ── */
    .status-bar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      height: env(safe-area-inset-top, 0px);
      background: var(--green);
    }

    /* ── Top app bar ── */
    .app-bar {
      position: fixed; top: env(safe-area-inset-top, 0px); left: 0; right: 0; z-index: 99;
      height: 56px;
      background: var(--green);
      display: flex; align-items: center; padding: 0 16px; gap: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.18);
    }
    .app-bar img { width: 28px; height: 28px; border-radius: 6px; }
    .app-bar-title { flex: 1; }
    .app-bar-title .app-name { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -.3px; }
    .app-bar-title .app-sub  { font-size: 11px; color: rgba(255,255,255,.75); margin-top: 1px; }
    .app-bar-logout {
      background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
      color: #fff; border-radius: 8px; padding: 6px 12px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 5px;
    }

    /* ── Scrollable content area ── */
    .app-content {
      position: fixed;
      top: calc(env(safe-area-inset-top, 0px) + 56px);
      left: 0; right: 0;
      bottom: calc(var(--nav-h) + var(--safe-b));
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* ── Tab panels ── */
    .tab-panel { display: none; padding: 16px; min-height: 100%; }
    .tab-panel.active { display: block; }

    /* ── Bottom navigation ── */
    .bottom-nav {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
      height: calc(var(--nav-h) + var(--safe-b));
      padding-bottom: var(--safe-b);
      background: #fff;
      border-top: 1px solid var(--border);
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      box-shadow: 0 -2px 12px rgba(0,0,0,.08);
    }
    .nav-item {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 4px; cursor: pointer;
      color: var(--muted); border: none; background: transparent;
      padding: 8px 4px; transition: color .15s;
      -webkit-tap-highlight-color: transparent;
      position: relative;
    }
    .nav-item.active { color: var(--green); }
    .nav-item .nav-indicator {
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 32px; height: 3px; background: var(--green);
      border-radius: 0 0 4px 4px; opacity: 0; transition: opacity .15s;
    }
    .nav-item.active .nav-indicator { opacity: 1; }
    .nav-icon {
      width: 24px; height: 24px;
      display: flex; align-items: center; justify-content: center;
    }
    .nav-label { font-size: 11px; font-weight: 600; letter-spacing: .2px; }

    /* ── Cards ── */
    .card {
      background: var(--surface); border-radius: 16px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 4px rgba(0,0,0,.06);
      overflow: hidden;
    }
    .card + .card, .card + div { margin-top: 14px; }

    /* ── Section header ── */
    .section-header {
      background: linear-gradient(135deg, var(--green) 0%, #15803d 100%);
      border-radius: 16px; padding: 20px; margin-bottom: 14px;
      color: #fff;
    }
    .section-header h1 { font-size: 20px; font-weight: 800; }
    .section-header p  { font-size: 13px; color: rgba(255,255,255,.8); margin-top: 4px; }

    /* ══════════════════════════════
       ID CARD
    ══════════════════════════════ */
    .id-card-wrap {
      background: var(--surface); border-radius: 16px;
      border: 1.5px solid var(--border); overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,.1);
    }
    .id-top-stripe {
      background: #1a3a2f; padding: 8px 14px;
      display: flex; align-items: center; gap: 10px;
    }
    .id-seal {
      width: 36px; height: 36px; border-radius: 50%;
      background: #fff; overflow: hidden; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .id-seal img { width: 28px; height: 28px; object-fit: contain;
      filter: brightness(0) saturate(100%) invert(35%) sepia(80%) saturate(600%) hue-rotate(100deg); }
    .id-gov-text { flex: 1; text-align: center; }
    .id-gov-text div:first-child {
      font-size: 8px; font-weight: 700; letter-spacing: 1.5px;
      color: var(--gold); text-transform: uppercase;
    }
    .id-gov-text div:last-child { font-size: 7px; color: rgba(255,255,255,.7); margin-top: 1px; }
    .id-star {
      width: 36px; height: 36px; border-radius: 50%;
      background: var(--green-l); display: flex; align-items: center;
      justify-content: center; color: #fff; font-size: 18px; font-weight: 900;
      flex-shrink: 0;
    }
    .id-accent { height: 4px; background: linear-gradient(90deg, #22c55e, #16a34a, var(--gold)); }
    .id-title-bar {
      background: #f0fdf4; border-bottom: 1px solid #bbf7d0;
      padding: 5px 14px; text-align: center;
      font-size: 11px; font-weight: 900; letter-spacing: 2px;
      color: #166534; text-transform: uppercase;
    }
    .id-body { display: flex; gap: 0; padding: 14px; background: #fff; }
    .id-photo-col {
      display: flex; flex-direction: column; align-items: center;
      flex-shrink: 0; margin-right: 14px;
    }
    .id-photo-box {
      width: 90px; height: 115px;
      background: #e5e7eb; border: 2px solid #1a3a2f; overflow: hidden;
      position: relative; flex-shrink: 0;
    }
    .id-photo-box img { width: 100%; height: 100%; object-fit: cover; }
    .id-sig-line {
      margin-top: 8px; width: 90px; border-top: 1px solid #374151;
      padding-top: 3px; text-align: center;
    }
    .id-sig-line span { font-size: 7px; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; }
    .id-info-col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .id-num-badge {
      background: #1a3a2f; color: var(--gold);
      font-size: 10px; font-weight: 900; letter-spacing: 2px;
      padding: 4px 8px; text-align: center; border-radius: 2px;
      font-family: monospace;
    }
    .id-field { border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .id-field-label {
      font-size: 7px; font-weight: 700; color: #6b7280;
      text-transform: uppercase; letter-spacing: .8px;
    }
    .id-field-value {
      font-size: 12px; font-weight: 900; color: #111827;
      text-transform: uppercase; letter-spacing: .3px; line-height: 1.2;
    }
    .id-field-value.mono { font-family: monospace; }
    .id-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
    .id-qr-row {
      display: flex; align-items: center; gap: 8px;
      border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 4px;
    }
    .id-qr-box {
      width: 60px; height: 60px; background: #fff;
      border: 1px solid #1a3a2f; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; overflow: hidden;
    }
    .id-validity { text-align: right; flex: 1; }
    .id-validity div:first-child { font-size: 7px; color: #6b7280; text-transform: uppercase; letter-spacing: .5px; }
    .id-validity div:last-child  { font-size: 8px; font-weight: 700; color: #374151; margin-top: 2px; }
    .id-bottom-stripe {
      background: #1a3a2f; padding: 6px 14px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .id-bottom-stripe span { font-size: 7px; color: rgba(255,255,255,.65); }
    .id-bottom-stripe strong { font-size: 7px; color: var(--gold); font-weight: 700; }

    /* Download button */
    .btn-primary {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: var(--green); color: #fff; border: none; border-radius: 12px;
      padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer;
      width: 100%; margin-top: 12px;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
    }
    .btn-primary:active { background: #15803d; }
    .btn-outline {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #fff; color: var(--green); border: 1.5px solid var(--green);
      border-radius: 12px; padding: 14px; font-size: 15px; font-weight: 700;
      cursor: pointer; width: 100%; margin-top: 10px;
      -webkit-tap-highlight-color: transparent;
      transition: background .15s;
    }
    .btn-outline:active { background: #f0fdf4; }

    /* ══════════════════════════════
       QR CODE
    ══════════════════════════════ */
    .qr-display {
      display: flex; flex-direction: column; align-items: center;
      padding: 24px 16px;
    }
    .qr-ring {
      width: 220px; height: 220px; border-radius: 20px;
      background: #f0fdf4; border: 3px solid var(--green-l);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 20px rgba(34,197,94,.2);
    }
    .qr-name { font-size: 17px; font-weight: 800; color: var(--text); text-align: center; }
    .qr-id   { font-size: 13px; color: var(--muted); font-family: monospace; margin-top: 4px; text-align: center; }

    .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }

    .qr-info-card { background: #f9fafb; border-radius: 12px; padding: 14px 16px; margin-top: 14px; }
    .qr-info-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f3f4f6;
    }
    .qr-info-row:last-child { border-bottom: none; }
    .qr-info-row .label { color: var(--muted); font-weight: 500; }
    .qr-info-row .value { color: var(--text); font-weight: 700; }

    .security-notice {
      background: #fffbeb; border: 1px solid #fbbf24;
      border-radius: 12px; padding: 12px 14px;
      display: flex; gap: 10px; align-items: start; margin-top: 14px;
    }
    .security-notice p { font-size: 12px; color: #78350f; line-height: 1.5; }

    /* ══════════════════════════════
       TRANSACTIONS
    ══════════════════════════════ */
    .tx-stats {
      display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;
    }
    .tx-stat-card {
      background: var(--surface); border-radius: 12px;
      padding: 14px; border: 1px solid var(--border);
      display: flex; align-items: center; gap: 12px;
    }
    .tx-stat-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .tx-stat-num { font-size: 24px; font-weight: 800; line-height: 1; }
    .tx-stat-lbl { font-size: 11px; color: var(--muted); font-weight: 500; margin-top: 3px; }

    .tx-list { display: flex; flex-direction: column; gap: 10px; }
    .tx-item {
      background: var(--surface); border-radius: 14px;
      border: 1px solid var(--border); padding: 14px;
      display: flex; align-items: flex-start; gap: 12px;
      flex-wrap: nowrap;
    }
    .tx-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: 1px;
    }
    .tx-info { flex: 1; min-width: 0; }
    .tx-type { font-size: 14px; font-weight: 700; color: var(--text); }
    .tx-note { font-size: 12px; color: var(--muted); margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tx-amounts {
      display: flex; gap: 5px; margin-top: 7px; flex-wrap: wrap;
    }
    .tx-amt-chip {
      font-size: 11px; font-weight: 700; padding: 3px 8px;
      border-radius: 6px; white-space: nowrap;
    }
    .tx-meta {
      text-align: right; flex-shrink: 0;
      display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
      padding-top: 1px;
    }
    .tx-date { font-size: 12px; font-weight: 600; color: #374151; white-space: nowrap; }
    .tx-time { font-size: 11px; color: var(--muted); white-space: nowrap; }

    .empty-state {
      text-align: center; padding: 60px 20px;
    }
    .empty-icon {
      width: 72px; height: 72px; background: #f3f4f6; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
    }
    .empty-title { font-size: 16px; font-weight: 700; color: #374151; }
    .empty-sub   { font-size: 13px; color: var(--muted); margin-top: 6px; }

    /* Pagination */
    .pagination { display: flex; justify-content: center; gap: 6px; padding: 16px 0 4px; flex-wrap: wrap; }
    .pg-btn {
      min-width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border);
      background: #fff; color: #374151; font-size: 13px; font-weight: 600;
      display: inline-flex; align-items: center; justify-content: center; cursor: pointer; padding: 0 10px;
    }
    .pg-btn.active { background: var(--green); color: #fff; border-color: var(--green); }
    .pg-btn:disabled { color: #9ca3af; cursor: not-allowed; background: #f9fafb; }

    /* Toast */
    #toast {
      position: fixed; bottom: calc(var(--nav-h) + var(--safe-b) + 16px); left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: #1f2937; color: #fff; padding: 10px 20px;
      border-radius: 20px; font-size: 13px; font-weight: 600;
      pointer-events: none; opacity: 0; transition: all .3s; z-index: 9999;
      white-space: nowrap;
    }
    #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
    #toast.success { background: var(--green); }
    #toast.error   { background: #ef4444; }

    /* Ripple on nav items */
    .nav-item:active { opacity: .7; }

    /* ── LOGIN SCREEN ── */
    #loginScreen {
      position: fixed; inset: 0; z-index: 1000;
      display: flex; overflow-y: auto;
      background: #f4f7f6; font-family: 'Inter', system-ui, sans-serif;
    }
    #loginScreen.hidden { display: none; }
    .login-wrapper { display: flex; min-height: 100%; width: 100%; }

    .brand-panel {
      width: 42%; flex-shrink: 0;
      background: linear-gradient(160deg, #166534 0%, #22c55e 60%, #4ade80 100%);
      display: flex; flex-direction: column; justify-content: center;
      padding: 56px 48px; position: relative; overflow: hidden;
    }
    .brand-panel::before {
      content: ''; position: absolute; width: 360px; height: 360px;
      background: rgba(255,255,255,0.06); border-radius: 50%; top: -120px; right: -100px;
    }
    .brand-panel::after {
      content: ''; position: absolute; width: 280px; height: 280px;
      background: rgba(255,255,255,0.05); border-radius: 50%; bottom: -80px; left: -80px;
    }
    .brand-logo-wrap { display: flex; align-items: center; gap: 14px; margin-bottom: 52px; position: relative; z-index: 2; }
    .brand-logo-icon {
      width: 52px; height: 52px; background: rgba(255,255,255,0.2);
      border: 1.5px solid rgba(255,255,255,0.35); border-radius: 14px;
      display: flex; align-items: center; justify-content: center; padding: 10px;
    }
    .brand-logo-icon img { width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1); }
    .brand-logo-text { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
    .brand-logo-sub { font-size: 11px; color: rgba(255,255,255,0.75); font-weight: 500; letter-spacing: 0.3px; margin-top: 2px; }
    .brand-headline { font-size: 32px; font-weight: 800; color: #fff; line-height: 1.2; letter-spacing: -0.8px; margin: 0 0 14px; position: relative; z-index: 2; }
    .brand-tagline { font-size: 15px; color: rgba(255,255,255,0.82); line-height: 1.6; margin: 0 0 44px; font-weight: 400; position: relative; z-index: 2; }
    .brand-features { display: flex; flex-direction: column; gap: 18px; position: relative; z-index: 2; }
    .brand-feature { display: flex; align-items: flex-start; gap: 14px; }
    .brand-feature-icon {
      width: 38px; height: 38px; background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25); border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .brand-feature-text strong { display: block; font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px; }
    .brand-feature-text span { font-size: 12px; color: rgba(255,255,255,0.72); line-height: 1.5; }
    .brand-footer { margin-top: 52px; font-size: 12px; color: rgba(255,255,255,0.55); position: relative; z-index: 2; }

    .form-panel {
      flex: 1; display: flex; align-items: center; justify-content: center;
      padding: 40px 24px; overflow-y: auto; background: #f4f7f6;
    }
    .login-card {
      background: #ffffff; border-radius: 16px; padding: 44px 40px;
      width: 100%; max-width: 440px; border: 1px solid #e5e7eb;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06); animation: loginFadeUp 0.35s ease-out both;
    }
    @keyframes loginFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .card-logo {
      display: none; width: 48px; height: 48px;
      background: #22c55e; border-radius: 12px;
      align-items: center; justify-content: center; padding: 10px; margin: 0 auto 20px;
    }
    .card-logo img { width: 100%; height: 100%; object-fit: contain; filter: brightness(0) invert(1); }
    .login-title { font-size: 26px; font-weight: 800; color: #111827; margin: 0 0 6px; letter-spacing: -0.5px; }
    .login-subtitle { font-size: 14px; color: #6b7280; margin: 0 0 32px; font-weight: 400; }
    .login-input-group { position: relative; margin-bottom: 18px; }
    .login-input-group label { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.5px; }
    .login-input {
      width: 100%; padding: 11px 14px; border: 1.5px solid #e5e7eb;
      border-radius: 10px; font-size: 14px; background: #f9fafb; color: #111827;
      font-weight: 500; transition: border-color 0.2s, background 0.2s;
    }
    .login-input::placeholder { color: #9ca3af; font-weight: 400; }
    .login-input:hover { border-color: #d1d5db; background: #fff; }
    .login-input:focus { outline: none; border-color: #22c55e; background: #fff; box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }
    .login-btn {
      width: 100%; padding: 13px; background: #22c55e; color: #fff;
      border: none; border-radius: 10px; font-size: 15px; font-weight: 700;
      cursor: pointer; transition: background 0.2s, transform 0.1s; margin-top: 6px;
      display: flex; align-items: center; justify-content: center; gap: 8px; letter-spacing: 0.1px;
    }
    .login-btn:hover { background: #16a34a; }
    .login-btn:active { background: #15803d; transform: scale(0.99); }
    .login-btn:disabled { background: #9ca3af; cursor: not-allowed; transform: none; }
    .login-error {
      margin-bottom: 16px; padding: 12px 14px; background: #fef2f2;
      border: 1.5px solid #fca5a5; border-radius: 10px;
      color: #991b1b; font-size: 13px; font-weight: 600; display: none;
    }
    .login-error.show { display: block; }
    .login-info { font-size: 13px; color: #6b7280; line-height: 1.5; text-align: center; margin-top: 22px; padding-top: 18px; border-top: 1.5px solid #f3f4f6; }
    .face-login-divider {
      display: flex; align-items: center; gap: 10px; margin: 14px 0 12px;
      font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .face-login-divider::before, .face-login-divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
    .face-login-btn {
      width: 100%; padding: 13px; background: #fff; color: #16a34a;
      border: 2px solid #22c55e; border-radius: 10px; font-size: 15px; font-weight: 700;
      cursor: pointer; transition: all 0.2s; margin-bottom: 2px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .face-login-btn:hover { background: #f0fdf4; }
    .face-login-btn:active { background: #dcfce7; transform: scale(0.99); }

    /* ── Biometric Login Modal ── */
    #faceLoginModal {
      display: none; position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,0.7); align-items: center; justify-content: center; padding: 20px;
    }
    #faceLoginModal.open { display: flex; }
    .face-modal-card { background: #fff; border-radius: 20px; width: 100%; max-width: 320px; padding: 32px 24px; text-align: center; }
    .bio-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: #f0fdf4; border: 2px solid #22c55e;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px; animation: bioPulse 1.6s ease-in-out infinite;
    }
    @keyframes bioPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
      50%       { box-shadow: 0 0 0 12px rgba(34,197,94,0); }
    }
    .bio-icon.success { background: #dcfce7; border-color: #16a34a; animation: none; }
    .bio-icon.error   { background: #fef2f2; border-color: #ef4444; animation: none; }
    #faceStatusMsg { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 6px; }
    #faceStatusSub { font-size: 13px; color: #6b7280; margin-bottom: 20px; line-height: 1.5; }
    #faceCancelBtn { width: 100%; padding: 12px; background: #f3f4f6; color: #374151; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
    #faceCancelBtn:hover { background: #e5e7eb; }

    @media (max-width: 860px) {
      .brand-panel { display: none; }
      .form-panel { background: #f0fdf4; padding: 28px 16px; align-items: flex-start; padding-top: 40px; }
      .login-card { padding: 36px 28px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
      .card-logo { display: flex; }
      .login-title, .login-subtitle { text-align: center; }
    }
    @media (max-width: 480px) {
      .login-card { padding: 28px 20px; border-radius: 14px; }
      .face-login-btn, .face-login-divider { display: none; }
    }
  </style>
</head>
<body>

<!-- Login Screen -->
<div id="loginScreen">
  <div class="login-wrapper">

    <!-- Left brand panel -->
    <div class="brand-panel">
      <div class="brand-logo-wrap">
        <div class="brand-logo-icon">
          <img src="assets/pics/logo.png" alt="LingapApu">
        </div>
        <div>
          <div class="brand-logo-text">LingapApu</div>
          <div class="brand-logo-sub">Floridablanca, Pampanga</div>
        </div>
      </div>
      <h2 class="brand-headline">Your benefits,<br>in your hands</h2>
      <p class="brand-tagline">Access your senior citizen ID, benefits history, and QR code — all from your phone.</p>
      <div class="brand-features">
        <div class="brand-feature">
          <div class="brand-feature-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <div class="brand-feature-text">
            <strong>Digital Senior ID</strong>
            <span>Carry your official ID on your phone, always ready</span>
          </div>
        </div>
        <div class="brand-feature">
          <div class="brand-feature-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/></svg>
          </div>
          <div class="brand-feature-text">
            <strong>QR Merchant Discounts</strong>
            <span>Scan to verify your 20% senior discount at merchants</span>
          </div>
        </div>
        <div class="brand-feature">
          <div class="brand-feature-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div class="brand-feature-text">
            <strong>Benefits &amp; Transactions</strong>
            <span>Track all your benefit claims and transaction history</span>
          </div>
        </div>
      </div>
      <div class="brand-footer">&copy; 2026 LingapApu &mdash; MSWD Floridablanca</div>
    </div>

    <!-- Right form panel -->
    <div class="form-panel">
      <div class="login-card">
        <div class="card-logo"><img src="assets/pics/logo.png" alt="LingapApu"></div>
        <h1 class="login-title">Welcome back</h1>
        <p class="login-subtitle">Sign in to your LingapApu Senior account</p>
        <div class="login-error" id="loginError"></div>
        <form id="loginForm" onsubmit="handleMobileLogin(event); return false;">
          <div class="login-input-group">
            <label>Username</label>
            <input type="text" class="login-input" id="loginId" placeholder="Enter your username" autocomplete="username" required>
          </div>
          <div class="login-input-group">
            <label>Password</label>
            <input type="password" class="login-input" id="loginPass" placeholder="••••••••" autocomplete="current-password" required>
          </div>
          <button type="submit" class="login-btn" id="mobileLoginBtn">
            Sign In
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <div class="face-login-divider">or</div>
          <button type="button" class="face-login-btn" onclick="openFaceLogin()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="3.5"/>
              <path d="M6.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/>
              <circle cx="12" cy="12" r="10" stroke-dasharray="3 2"/>
            </svg>
            Sign In with Face
          </button>
        </form>
        <p class="login-info">Enter your username and password to access your senior account</p>
      </div>
    </div>

  </div>
</div>

<!-- Biometric Login Modal (WebAuthn) -->
<div id="faceLoginModal">
  <div class="face-modal-card">
    <div class="bio-icon" id="bioIcon">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.8">
        <path d="M12 3C8.7 3 6 5.7 6 9v2a6 6 0 0 0 12 0V9c0-3.3-2.7-6-6-6z"/>
        <path d="M9 12c0 1.66 1.34 3 3 3s3-1.34 3-3"/>
        <line x1="9" y1="9" x2="9.01" y2="9" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="15" y1="9" x2="15.01" y2="9" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
    <div id="faceStatusMsg">Verifying identity...</div>
    <div id="faceStatusSub">Use your device biometric (face or fingerprint)</div>
    <button id="faceCancelBtn">Cancel</button>
  </div>
</div>

<!-- App Content (Hidden until logged in) -->
<div id="appContainer" style="display: none; height: 100%;">

<!-- Status bar spacer -->
<div class="status-bar"></div>

<!-- Top App Bar -->
<header class="app-bar">
  <img src="assets/pics/logo.png" alt="Logo">
  <div class="app-bar-title">
    <div class="app-name">LingapApu</div>
    <div class="app-sub" id="appBarSub">Senior Citizen Portal</div>
  </div>
  <button class="app-bar-logout" id="logoutBtn">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
    Logout
  </button>
</header>

<!-- Main scrollable content -->
<div class="app-content">

  <!-- ── ID CARD TAB ── -->
  <div class="tab-panel active" id="tab-id">
    <div class="section-header">
      <h1>My Senior ID</h1>
      <p>Official OSCA Identification Card</p>
    </div>

    <!-- ID Card -->
    <div class="id-card-wrap" id="govIdCard">
      <!-- Top stripe -->
      <div class="id-top-stripe">
        <div class="id-seal">
          <img src="assets/pics/logo.png" alt="Seal">
        </div>
        <div class="id-gov-text">
          <div>Republic of the Philippines</div>
          <div>Office for Senior Citizens Affairs (OSCA)</div>
        </div>
        <div class="id-star">★</div>
      </div>
      <!-- Accent bar -->
      <div class="id-accent"></div>
      <!-- Title bar -->
      <div class="id-title-bar">Senior Citizen Identification Card</div>
      <!-- Body -->
      <div class="id-body">
        <!-- Photo col -->
        <div class="id-photo-col">
          <div class="id-photo-box">
            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 130'%3E%3Crect fill='%23e5e7eb' width='100' height='130'/%3E%3Ccircle cx='50' cy='30' r='15' fill='%239ca3af'/%3E%3Cellipse cx='50' cy='90' rx='25' ry='20' fill='%239ca3af'/%3E%3C/svg%3E" alt="Photo" id="idCardPhotoImg">
          </div>
          <div class="id-sig-line"><span>Signature</span></div>
        </div>
        <!-- Info col -->
        <div class="id-info-col">
          <div class="id-num-badge" id="idCardNumber">ID: -----------</div>
          <div class="id-field">
            <div class="id-field-label">Full Name</div>
            <div class="id-field-value" id="idCardName">---</div>
          </div>
          <div class="id-row2">
            <div class="id-field">
              <div class="id-field-label">Date of Birth</div>
              <div class="id-field-value mono" id="idCardBirth">---</div>
            </div>
            <div class="id-field">
              <div class="id-field-label">Age</div>
              <div class="id-field-value" id="idCardAge">---</div>
            </div>
          </div>
          <div class="id-field">
            <div class="id-field-label">Address</div>
            <div class="id-field-value" style="font-size:10px" id="idCardAddress">---</div>
          </div>
          <div class="id-field">
            <div class="id-field-label">Contact Number</div>
            <div class="id-field-value mono" style="font-size:11px" id="idCardContact">---</div>
          </div>
          <!-- QR + validity row -->
          <div class="id-qr-row">
            <div class="id-qr-box" id="idCardQR">
              <span style="font-size:9px;color:#9ca3af;text-align:center">QR</span>
            </div>
            <div class="id-validity">
              <div>Date Registered</div>
              <div id="idCardRegistered">---</div>
            </div>
          </div>
        </div>
      </div>
      <!-- Bottom stripe -->
      <div class="id-bottom-stripe">
        <span>Floridablanca, Pampanga · OSCA</span>
        <strong>GENUINE &amp; VALID</strong>
      </div>
    </div>

    <button class="btn-primary" id="downloadIdBtn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Download ID Card
    </button>
    <button class="btn-outline" id="shareIdBtn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
      Share ID Card
    </button>

    <!-- Biometric Registration -->
    <div style="margin-top:16px;padding:16px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:36px;height:36px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M12 3C8.7 3 6 5.7 6 9v2a6 6 0 0 0 12 0V9c0-3.3-2.7-6-6-6z"/>
            <path d="M9 12c0 1.66 1.34 3 3 3s3-1.34 3-3"/>
            <line x1="9" y1="9" x2="9.01" y2="9" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="15" y1="9" x2="15.01" y2="9" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#15803d">Quick Login Setup</div>
          <div style="font-size:12px;color:#16a34a" id="bioRegStatus">Register your face/fingerprint to skip typing your password</div>
        </div>
      </div>
      <button class="btn-primary" id="registerBioBtn" onclick="registerBiometric()" style="font-size:13px;padding:10px 16px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 3C8.7 3 6 5.7 6 9v2a6 6 0 0 0 12 0V9c0-3.3-2.7-6-6-6z"/>
          <line x1="12" y1="19" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/>
        </svg>
        Register Biometric Login
      </button>
    </div>
  </div>

  <!-- ── QR CODE TAB ── -->
  <div class="tab-panel" id="tab-qr">
    <div class="section-header">
      <h1>My QR Code</h1>
      <p>Present for identification &amp; transactions</p>
    </div>

    <div class="card">
      <div class="qr-display">
        <div class="qr-ring" id="universalQRWrap">
          <div id="universalQR" style="display:flex;align-items:center;justify-content:center;width:190px;height:190px;color:#9ca3af;font-size:13px">
            Loading...
          </div>
        </div>
        <div class="qr-name" id="qrNameLabel">—</div>
        <div class="qr-id"   id="qrIdLabel">—</div>

        <div class="btn-row" style="width:100%">
          <button class="btn-primary" id="downloadUniversalQR">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
          <button class="btn-outline" id="shareUniversalQR">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>
      </div>

      <!-- QR info -->
      <div style="padding:0 16px 16px">
        <div class="qr-info-card" id="qrContentsInfo"></div>
      </div>
    </div>

    <!-- Security notice -->
    <div class="security-notice">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="flex-shrink:0;margin-top:1px">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <p><strong>Keep it secure</strong> — your QR contains personal identification data. Do not share screenshots with unknown individuals.</p>
    </div>

    <!-- How to use -->
    <div class="card" style="padding:16px;margin-top:14px">
      <p style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px">How to use</p>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;gap:10px;align-items:start">
          <div style="width:24px;height:24px;background:var(--green-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:800;color:var(--green)">1</div>
          <p style="font-size:13px;color:#374151;line-height:1.5">Show this QR code to OSCA staff for identification and verification.</p>
        </div>
        <div style="display:flex;gap:10px;align-items:start">
          <div style="width:24px;height:24px;background:var(--green-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:800;color:var(--green)">2</div>
          <p style="font-size:13px;color:#374151;line-height:1.5">Staff will scan it to pull up your complete profile and process services.</p>
        </div>
        <div style="display:flex;gap:10px;align-items:start">
          <div style="width:24px;height:24px;background:var(--green-bg);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;font-weight:800;color:var(--green)">3</div>
          <p style="font-size:13px;color:#374151;line-height:1.5">Download and show your QR at participating establishments for 20% senior discount.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ── TRANSACTIONS TAB ── -->
  <div class="tab-panel" id="tab-tx">
    <div class="section-header" style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:8px">
      <div>
        <h1>Transactions</h1>
        <p>Your benefit claims and service records</p>
      </div>
      <span id="txCountBadge" style="background:rgba(255,255,255,.2);color:#fff;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;white-space:nowrap;align-self:center">0 Records</span>
    </div>

    <!-- Stats row -->
    <div class="tx-stats" id="txSummaryStats"></div>

    <!-- Export button -->
    <button class="btn-outline" id="exportExcelBtn" onclick="exportToExcel()" style="margin-bottom:14px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9 15 12 18 15 15"/>
      </svg>
      Export All to Excel
    </button>

    <!-- TX list -->
    <div class="tx-list" id="transactionsTable"></div>
    <div class="pagination" id="txPagination"></div>
  </div>

</div><!-- end .app-content -->

<!-- Bottom Navigation -->
<nav class="bottom-nav">
  <button class="nav-item active" data-tab="id" onclick="switchTab('id')">
    <div class="nav-indicator"></div>
    <div class="nav-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    </div>
    <span class="nav-label">My ID</span>
  </button>
  <button class="nav-item" data-tab="qr" onclick="switchTab('qr')">
    <div class="nav-indicator"></div>
    <div class="nav-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <rect x="3" y="13" width="8" height="8" rx="1"/>
        <rect x="13" y="3" width="8" height="8" rx="1"/>
        <path d="M13 13h3v3h-3z"/>
        <path d="M17 17h4v4h-4z"/>
        <path d="M13 17h1v4h-1z"/>
      </svg>
    </div>
    <span class="nav-label">QR Code</span>
  </button>
  <button class="nav-item" data-tab="tx" onclick="switchTab('tx')">
    <div class="nav-indicator"></div>
    <div class="nav-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    </div>
    <span class="nav-label">Transactions</span>
  </button>
</nav>


<!-- Toast -->
<div id="toast"></div>

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.47.10/dist/umd/supabase.js"></script>
<script src="assets/supabase-config.js"></script>
<script src="assets/db.js"></script>
<script>
// ── Service Worker Registration ──────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Hash-based tab routing from app shortcuts
  const hash = location.hash.replace('#', '');
  if (hash === 'qr' || hash === 'tx') switchTab(hash);
});

// ── WebAuthn Biometric Registration ────────────────────────────────────────────
const WEBAUTHN_CREDS_KEY = 'lingap_webauthn_creds';

function _bufToB64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

async function registerBiometric() {
  if (!window.PublicKeyCredential) {
    showToast('Biometric login not supported on this device.', 'error');
    return;
  }
  const btn = document.getElementById('registerBioBtn');
  const status = document.getElementById('bioRegStatus');
  try {
    btn.disabled = true;
    btn.textContent = 'Waiting for biometric...';
    const seniorId = currentUser.id;
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'LingapApu' },
        user: {
          id: new TextEncoder().encode(String(seniorId)),
          name: currentUser.username || String(seniorId),
          displayName: currentUser.name || 'Senior'
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 }
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000
      }
    });
    const creds = JSON.parse(localStorage.getItem(WEBAUTHN_CREDS_KEY) || '{}');
    const credId = _bufToB64url(credential.rawId);
    creds[credId] = seniorId;
    localStorage.setItem(WEBAUTHN_CREDS_KEY, JSON.stringify(creds));
    if (status) status.textContent = '\u2713 Biometric registered! Use \u201cSign In with Face\u201d next time.';
    showToast('Biometric registered successfully!', 'success');
  } catch(e) {
    if (e.name === 'NotAllowedError') {
      showToast('Biometric registration cancelled.', '');
    } else if (e.name === 'InvalidStateError') {
      if (status) status.textContent = '\u2713 Already registered on this device.';
      showToast('Already registered on this device.', '');
    } else {
      showToast('Registration failed: ' + e.message, 'error');
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 3C8.7 3 6 5.7 6 9v2a6 6 0 0 0 12 0V9c0-3.3-2.7-6-6-6z"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/></svg> Register Biometric Login`;
  }
}

// Show registered status on load
document.addEventListener('DOMContentLoaded', () => {
  const status = document.getElementById('bioRegStatus');
  if (!status) return;
  const creds = JSON.parse(localStorage.getItem(WEBAUTHN_CREDS_KEY) || '{}');
  if (Object.keys(creds).length > 0) {
    status.textContent = '\u2713 Biometric registered on this device';
  }
});
</script>
<script>
// ═══════════════════════════════════════════════
//  MOBILE SENIOR APP — core JS
// ═══════════════════════════════════════════════

let currentUser  = null;
let transactions = [];  // loaded from Supabase
let txPage       = 1;
const TX_PAGE_SIZE = 10;
let qrCanvas    = null;   // keep reference for download/share

// ── Routing ──────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${name}"]`).classList.add('active');

  // Lazy-generate QR on first visit to that tab
  if (name === 'qr' && !qrCanvas && typeof QRCode !== 'undefined') {
    generateQR();
  }
}

// ── Toast ─────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = ''; }, 2800);
}

// ── Helpers ───────────────────────────────────
function formatDate(d) {
  if (!d || isNaN(d)) return '—';
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}
function fmtTime(d) {
  if (!d || isNaN(d)) return '';
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}
async function loadTransactions() {
  transactions = [];
  if (!currentUser || !window.db) return;
  try {
    const txns = await window.db.getTransactions(currentUser.id);
    transactions = (txns || []).map(t => ({
      ...t,
      seniorId:   t.senior_id   || t.seniorId,
      seniorName: t.senior_name || t.seniorName,
      merchantId: t.merchant_id || t.merchantId,
      scanDate:   t.scan_date   || t.scanDate
    })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch(e) {}
}

function getTransactions() {
  return transactions;
}

// ── Init ──────────────────────────────────────
async function init() {
  // currentUser is already set by login handler or checkMobileLoginState
  if (!currentUser) return;

  // Cache transactions from Supabase — MERGE with local, don't replace
  // Load transactions from Supabase
  await loadTransactions();

  // App bar
  const firstName = (currentUser.name || 'Senior').split(' ')[0];
  document.getElementById('appBarSub').textContent = `Hi, ${firstName}! · ID: ${currentUser.id}`;

  // Render sections
  renderIDCard();
  renderTransactions();

  // QR will be generated when user navigates to QR tab
  // but also pre-generate if QRCode is ready
  if (typeof QRCode !== 'undefined') generateQR();
}

// ── ID Card ───────────────────────────────────
function renderIDCard() {
  if (!currentUser) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
  set('idCardNumber', 'ID: ' + (currentUser.id || '---'));
  set('idCardName', currentUser.name || '---');
  set('idCardBirth', currentUser.birth || '---');
  set('idCardAge', currentUser.age ? currentUser.age + ' years' : '---');
  set('idCardContact', currentUser.contact || 'Not provided');
  set('idCardAddress', currentUser.address || currentUser.barangay || 'Not provided');

  const reg = currentUser.registrationDate || currentUser.dateRegistered || currentUser.createdAt;
  set('idCardRegistered', reg ? formatDate(new Date(reg)) : 'Not registered');

  // Profile photo
  const photoEl = document.getElementById('idCardPhotoImg');
  if (photoEl && currentUser.photo) {
    photoEl.src = currentUser.photo;
  }

  // QR on ID card
  setTimeout(renderIDCardQR, 400);
}

function renderIDCardQR() {
  const box = document.getElementById('idCardQR');
  if (!box || typeof QRCode === 'undefined') return;

  if (currentUser.qr_code) {
    const img = document.createElement('img');
    img.src = currentUser.qr_code;
    img.style.cssText = 'width:56px;height:56px;display:block';
    box.innerHTML = '';
    box.appendChild(img);
    return;
  }

  const qrData = JSON.stringify({
    id: currentUser.id, name: currentUser.name,
    birth: currentUser.birth, contact: currentUser.contact
  });
  const c = document.createElement('canvas');
  QRCode.toCanvas(c, qrData, { width: 56, margin: 1, color: { dark: '#22c55e', light: '#ffffff' } }, err => {
    if (!err) { box.innerHTML = ''; box.appendChild(c); }
  });
}

// Download / Share ID Card
document.getElementById('downloadIdBtn').addEventListener('click', () => {
  const card = document.getElementById('govIdCard');
  if (typeof html2canvas === 'undefined') {
    showToast('Download module not ready', 'error'); return;
  }
  html2canvas(card, { scale: 3, useCORS: true, backgroundColor: '#fff',
    onclone: cloned => {
      const qc = cloned.querySelector('#idCardQR canvas');
      if (qc) {
        const img = cloned.createElement('img');
        img.src = qc.toDataURL();
        img.style.cssText = qc.style.cssText;
        qc.parentNode.replaceChild(img, qc);
      }
    }
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = `LingapApu-ID-${currentUser.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('ID Card downloaded!', 'success');
  }).catch(() => showToast('Error downloading', 'error'));
});

document.getElementById('shareIdBtn').addEventListener('click', async () => {
  const card = document.getElementById('govIdCard');
  if (typeof html2canvas === 'undefined') {
    showToast('Share not ready', 'error'); return;
  }
  try {
    const canvas = await html2canvas(card, { scale: 3, useCORS: true, backgroundColor: '#fff' });
    const blob   = await new Promise(res => canvas.toBlob(res, 'image/png'));
    const file   = new File([blob], `LingapApu-ID-${currentUser.id}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My LingapApu Senior ID' });
      showToast('Shared!', 'success');
    } else {
      document.getElementById('downloadIdBtn').click();
    }
  } catch(e) {
    if (e.name !== 'AbortError') showToast('Could not share — try Download', 'error');
  }
});

// ── QR Code ───────────────────────────────────
function generateQR() {
  const wrap = document.getElementById('universalQR');
  if (!wrap || typeof QRCode === 'undefined') return;

  // Labels
  const nl = document.getElementById('qrNameLabel');
  const il = document.getElementById('qrIdLabel');
  if (nl) nl.textContent = currentUser.name || '—';
  if (il) il.textContent = 'ID: ' + (currentUser.id || '—');

  // Contents info
  const ci = document.getElementById('qrContentsInfo');
  if (ci) {
    const rows = [
      { label: 'Senior ID',     value: currentUser.id },
      { label: 'Full Name',     value: currentUser.name },
      { label: 'Date of Birth', value: currentUser.birth },
      { label: 'Contact',       value: currentUser.contact || '—' },
    ];
    ci.innerHTML = rows.map(r => `
      <div class="qr-info-row">
        <span class="label">${r.label}</span>
        <span class="value" style="${r.label==='Senior ID'?'font-family:monospace':''}">${r.value || '—'}</span>
      </div>`).join('');
  }

  // Use stored QR if available
  if (currentUser.qr_code) {
    wrap.innerHTML = '';
    const img = document.createElement('img');
    img.src = currentUser.qr_code;
    img.style.cssText = 'width:190px;height:190px;border-radius:8px;display:block';
    wrap.appendChild(img);
    wireQRButtons(null, currentUser.qr_code);
    return;
  }

  wrap.innerHTML = `<span style="color:#9ca3af;font-size:13px">Generating...</span>`;

  const qrData = JSON.stringify({
    id: currentUser.id, name: currentUser.name,
    birth: currentUser.birth, contact: currentUser.contact
  });
  const c = document.createElement('canvas');
  QRCode.toCanvas(c, qrData, {
    width: 190, margin: 2, color: { dark: '#22c55e', light: '#ffffff' }
  }, err => {
    if (err) { wrap.innerHTML = `<span style="color:#ef4444;font-size:12px">Error generating QR</span>`; return; }
    wrap.innerHTML = '';
    wrap.appendChild(c);
    qrCanvas = c;
    const dataURL = c.toDataURL();
    if (window.db) {
      window.db.saveQRCode(currentUser.id, dataURL)
        .then(() => { currentUser.qr_code = dataURL; })
        .catch(() => {});
    }
    wireQRButtons(c, null);
  });
}

function wireQRButtons(canvas, dataUrl) {
  const dlBtn = document.getElementById('downloadUniversalQR');
  const shBtn = document.getElementById('shareUniversalQR');

  dlBtn.onclick = () => {
    const link = document.createElement('a');
    link.download = `LingapApu-QR-${currentUser.id}.png`;
    link.href = dataUrl || canvas.toDataURL();
    link.click();
    showToast('QR downloaded!', 'success');
  };

  shBtn.onclick = async () => {
    try {
      let blob;
      if (dataUrl) {
        const res = await fetch(dataUrl);
        blob = await res.blob();
      } else {
        blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      }
      const file = new File([blob], `LingapApu-QR-${currentUser.id}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My LingapApu QR Code' });
        showToast('QR shared!', 'success');
      } else {
        dlBtn.click();
      }
    } catch(e) {
      if (e.name !== 'AbortError') showToast('Could not share — try Download', 'error');
    }
  };
}

// ── Transactions ──────────────────────────────
function renderTransactions() {
  const txns = getTransactions();
  const countBadge = document.getElementById('txCountBadge');
  if (countBadge) countBadge.textContent = `${txns.length} Record${txns.length !== 1 ? 's' : ''}`;

  // Stats
  const statsEl = document.getElementById('txSummaryStats');
  if (statsEl) {
    const typeCount = {};
    txns.forEach(t => { const k = t.type || 'General'; typeCount[k] = (typeCount[k] || 0) + 1; });

    // Group types into semantic buckets for stats
    const MERCHANT_TYPES = ['discount','service','medicine','grocery','QR Scan'];
    const BENEFIT_TYPES  = ['Pension','Medical','Transport','Food','Discount','Benefit Claim',
                            'Monthly Pension','Medical Subsidy','Transport Allowance'];
    let merchantCount = 0, benefitCount = 0, otherCount = 0;
    Object.entries(typeCount).forEach(([k, v]) => {
      if (MERCHANT_TYPES.includes(k))      merchantCount += v;
      else if (BENEFIT_TYPES.includes(k)) benefitCount  += v;
      else                                 otherCount    += v;
    });

    const stats = [
      { label: 'Total',           value: txns.length,   color: '#22c55e', bg: '#dcfce7', icon: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
      { label: 'Merchant Visits', value: merchantCount, color: '#3b82f6', bg: '#eff6ff', icon: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/>' },
      { label: 'Benefits Used',   value: benefitCount,  color: '#8b5cf6', bg: '#f5f3ff', icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' },
      { label: 'Other',           value: otherCount,    color: '#f59e0b', bg: '#fffbeb', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
    ];
    statsEl.innerHTML = stats.map(s => `
      <div class="tx-stat-card">
        <div class="tx-stat-icon" style="background:${s.bg}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2">${s.icon}</svg>
        </div>
        <div>
          <div class="tx-stat-num" style="color:${s.color}">${s.value}</div>
          <div class="tx-stat-lbl">${s.label}</div>
        </div>
      </div>`).join('');
  }

  const container = document.getElementById('transactionsTable');
  if (!container) return;

  if (txns.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="empty-title">No transactions yet</div>
        <div class="empty-sub">Your benefit claims and QR scan records will appear here.</div>
      </div>`;
    document.getElementById('txPagination').innerHTML = '';
    return;
  }

  const totalPages = Math.max(1, Math.ceil(txns.length / TX_PAGE_SIZE));
  txPage = Math.min(Math.max(1, txPage), totalPages);
  const page = txns.slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE);

  const typeColors = {
    // Merchant types (from merchant.html recordTransaction)
    'discount':       { color: '#3b82f6', bg: '#eff6ff' },
    'service':        { color: '#10b981', bg: '#d1fae5' },
    'medicine':       { color: '#ef4444', bg: '#fee2e2' },
    'grocery':        { color: '#f59e0b', bg: '#fffbeb' },
    // OSCA types (from osca.html scanner)
    'Pension':        { color: '#8b5cf6', bg: '#f5f3ff' },
    'Medical':        { color: '#ef4444', bg: '#fee2e2' },
    'Transport':      { color: '#10b981', bg: '#d1fae5' },
    'Food':           { color: '#f59e0b', bg: '#fffbeb' },
    'Discount':       { color: '#3b82f6', bg: '#eff6ff' },
    'Other':          { color: '#6b7280', bg: '#f3f4f6' },
    // Legacy / admin types
    'QR Scan':        { color: '#3b82f6', bg: '#eff6ff' },
    'Benefit Claim':  { color: '#8b5cf6', bg: '#f5f3ff' },
    'Registration':   { color: '#10b981', bg: '#d1fae5' },
    'Verification':   { color: '#f59e0b', bg: '#fffbeb' },
  };
  const DISCOUNT_ICON = '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>';
  const BENEFIT_ICON  = '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>';
  const QR_ICON       = '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><path d="M13 13h3v3h-3z"/>';
  const PILL_ICON     = '<path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/><circle cx="17" cy="17" r="3"/><path d="m21 21-1.5-1.5"/>';
  const CART_ICON     = '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>';
  const BUS_ICON      = '<rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>';
  const FOOD_ICON     = '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>';
  const PENSION_ICON  = '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>';
  const CLOCK_ICON    = '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>';
  const typeIcons = {
    'discount':      DISCOUNT_ICON,
    'service':       CLOCK_ICON,
    'medicine':      PILL_ICON,
    'grocery':       CART_ICON,
    'Pension':       PENSION_ICON,
    'Medical':       PILL_ICON,
    'Transport':     BUS_ICON,
    'Food':          FOOD_ICON,
    'Discount':      DISCOUNT_ICON,
    'QR Scan':       QR_ICON,
    'Benefit Claim': BENEFIT_ICON,
    'Registration':  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    'Verification':  '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    'default':       CLOCK_ICON,
  };
  // Friendly display labels for raw type values
  const typeLabels = {
    'discount': 'Senior Discount',
    'service':  'Service Availed',
    'medicine': 'Medicine Purchase',
    'grocery':  'Grocery Purchase',
  };

  container.innerHTML = page.map(t => {
    const style    = typeColors[t.type] || { color: '#6b7280', bg: '#f3f4f6' };
    const icon     = typeIcons[t.type]  || typeIcons['default'];
    const d        = new Date(t.timestamp);
    const dispType = typeLabels[t.type] || t.type || 'Transaction';

    // Resolve amount fields — support both camelCase (localStorage) and snake_case (Supabase)
    const _pf = v => { const n = parseFloat(String(v).replace(/[^0-9.-]/g, '')); return isNaN(n) ? null : n; };
    const origAmt  = _pf(t.originalAmount  ?? t.original_amount);
    const discPct  = _pf(t.discountPercent ?? t.discount_percent);
    const discAmt  = _pf(t.discountAmount  ?? t.discount_amount);
    const rawFinal = t.finalAmount ?? t.final_amount ?? t.amount ?? null;
    const finalAmt = rawFinal != null ? _pf(rawFinal) : null;

    const hasAmounts = origAmt != null || discAmt != null || (finalAmt != null && finalAmt > 0);
    const amountsHtml = hasAmounts ? `
      <div class="tx-amounts">
        ${origAmt  != null ? `<span class="tx-amt-chip" style="background:#f3f4f6;color:#374151">Orig: &#8369;${origAmt.toFixed(2)}</span>` : ''}
        ${discPct  != null && discAmt != null ? `<span class="tx-amt-chip" style="background:#fef3c7;color:#b45309">${discPct}% off &minus;&#8369;${discAmt.toFixed(2)}</span>` : ''}
        ${finalAmt != null && finalAmt > 0 ? `<span class="tx-amt-chip" style="background:#dcfce7;color:#15803d">&#8369;${finalAmt.toFixed(2)}</span>` : ''}
      </div>` : '';

    const noteText = t.note || t.notes || '';
    const merchantText = t.merchantId || t.merchant_id ? ` · Merchant: ${t.merchantId || t.merchant_id}` : '';

    return `
      <div class="tx-item">
        <div class="tx-icon" style="background:${style.bg}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${style.color}" stroke-width="2">${icon}</svg>
        </div>
        <div class="tx-info">
          <div class="tx-type">${dispType}</div>
          <div class="tx-note">${noteText || ('Processed' + merchantText) || 'No details'}</div>
          ${amountsHtml}
        </div>
        <div class="tx-meta">
          <div class="tx-date">${formatDate(d)}</div>
          <div class="tx-time">${fmtTime(d)}</div>
        </div>
      </div>`;
  }).join('');

  // Pagination
  const pgEl = document.getElementById('txPagination');
  if (totalPages <= 1) { pgEl.innerHTML = ''; return; }
  let html = `<button class="pg-btn" ${txPage <= 1 ? 'disabled' : ''} onclick="goTxPage(${txPage - 1})">‹ Prev</button>`;
  let prev = 0;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= txPage - 1 && i <= txPage + 1)) {
      if (prev && i - prev > 1) html += `<span style="display:inline-flex;align-items:center;padding:0 4px;color:#9ca3af">…</span>`;
      html += `<button class="pg-btn ${i === txPage ? 'active' : ''}" onclick="goTxPage(${i})">${i}</button>`;
      prev = i;
    }
  }
  html += `<button class="pg-btn" ${txPage >= totalPages ? 'disabled' : ''} onclick="goTxPage(${txPage + 1})">Next ›</button>`;
  pgEl.innerHTML = html;
}

function goTxPage(p) {
  txPage = p;
  renderTransactions();
  document.getElementById('tab-tx').scrollTop = 0;
}

// ── Export to Excel ───────────────────────────
function exportToExcel() {
  if (typeof XLSX === 'undefined') {
    showToast('Export library not ready. Please try again.', 'error');
    return;
  }

  const txns = getTransactions();
  if (txns.length === 0) {
    showToast('No transactions to export.', 'error');
    return;
  }

  const TYPE_LABELS = { discount:'Senior Discount', service:'Service Availed', medicine:'Medicine Purchase', grocery:'Grocery Purchase' };
  // Build worksheet rows
  const rows = txns.map((t, i) => {
    const _pf = v => { const n = parseFloat(String(v ?? '').replace(/[^0-9.-]/g, '')); return isNaN(n) ? null : n; };
    const origAmt  = _pf(t.originalAmount  ?? t.original_amount);
    const discPct  = _pf(t.discountPercent ?? t.discount_percent);
    const discAmt  = _pf(t.discountAmount  ?? t.discount_amount);
    const finalAmt = _pf(t.finalAmount ?? t.final_amount ?? t.amount);
    return {
      '#':                  i + 1,
      'Date':               new Date(t.timestamp).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }),
      'Time':               new Date(t.timestamp).toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' }),
      'Type':               TYPE_LABELS[t.type] || t.type || 'Transaction',
      'Details / Note':     t.note || t.notes || '',
      'Original Amount':    origAmt  != null ? origAmt  : '',
      'Discount %':         discPct  != null ? discPct + '%' : '',
      'Discount Amount':    discAmt  != null ? discAmt  : '',
      'Final Amount':       finalAmt != null ? finalAmt : '',
      'Merchant':           t.merchantName || t.merchant_id || t.merchantId || '',
      'Senior ID':          t.seniorId || t.senior_id || (currentUser && currentUser.id) || '',
      'Senior Name':        t.seniorName || t.senior_name || (currentUser && currentUser.name) || '',
      'Status':             t.status || 'Completed',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 16 },  // Date
    { wch: 10 },  // Time
    { wch: 18 },  // Type
    { wch: 32 },  // Details
    { wch: 16 },  // Original Amount
    { wch: 12 },  // Discount %
    { wch: 16 },  // Discount Amount
    { wch: 16 },  // Final Amount
    { wch: 20 },  // Merchant
    { wch: 16 },  // Senior ID
    { wch: 24 },  // Senior Name
    { wch: 12 },  // Status
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  // Add a summary sheet
  const typeCount = {};
  txns.forEach(t => { const k = t.type || 'General'; typeCount[k] = (typeCount[k] || 0) + 1; });
  const summaryRows = [
    { 'Field': 'Senior Name',      'Value': currentUser ? currentUser.name  : '' },
    { 'Field': 'Senior ID',        'Value': currentUser ? currentUser.id    : '' },
    { 'Field': 'Export Date',      'Value': new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' }) },
    { 'Field': 'Total Transactions','Value': txns.length },
    ...Object.entries(typeCount).map(([k, v]) => ({ 'Field': k, 'Value': v })),
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 22 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const filename = `LingapApu-Transactions-${currentUser ? currentUser.id : 'senior'}-${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  showToast('Excel file downloaded!', 'success');
}

// ── Mobile Login ──────────────────────────────
async function handleMobileLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginId').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('mobileLoginBtn');

  errorEl.classList.remove('show');
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }

  try {
    // Authenticate against users table via db.login()
    let user = null;
    if (window.db) {
      user = await window.db.login(username, password);
    }

    if (!user) {
      errorEl.textContent = 'Invalid username or password.';
      errorEl.classList.add('show');
      if (btn) { btn.disabled = false; btn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'; }
      return;
    }

    if (user.role !== 'senior') {
      errorEl.textContent = 'This portal is for senior citizens only.';
      errorEl.classList.add('show');
      if (btn) { btn.disabled = false; btn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'; }
      return;
    }

    // Fetch the senior's full profile
    const seniorId = user.senior_id || user.id;
    let profile = null;
    if (window.db) {
      // 1. Try by senior_id from the users table
      if (seniorId) profile = await window.db.getSeniorById(seniorId);
      // 2. Fall back to matching by username in the seniors table
      if (!profile) profile = await window.db.getSeniorByUsername(username);
    }
    if (!profile) {
      errorEl.textContent = 'Account found but senior profile is missing. Contact the OSCA office.';
      errorEl.classList.add('show');
      if (btn) { btn.disabled = false; btn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'; }
      return;
    }
  
  // Login successful - store in sessionStorage, set PHP session, and show app
  sessionStorage.setItem('mobileSeniorId', profile.id);
  currentUser = profile;
  // Persist PHP session
  try {
    await fetch('set-session.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'senior', username: username, id: profile.id })
    });
  } catch(e) { /* non-fatal */ }
  
  // Hide login, show app
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appContainer').style.display = '';
  
  // Initialize app
  renderIDCard();
  await loadTransactions();
  renderTransactions();
  if (typeof QRCode !== 'undefined') generateQR();
  
  const firstName = (profile.name || 'Senior').split(' ')[0];
  document.getElementById('appBarSub').textContent = `Hi, ${firstName}! · ID: ${profile.id}`;
  } catch(e) {
    errorEl.textContent = 'Login error: ' + (e.message || 'Unknown error occurred');
    errorEl.classList.add('show');
    if (btn) { btn.disabled = false; btn.innerHTML = 'Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'; }
  }
}

// Check if already logged in on page load
async function checkMobileLoginState() {
  const mobileId = sessionStorage.getItem('mobileSeniorId');
  if (!mobileId) return;

  let profile = null;
  if (window.db) {
    try { profile = await window.db.getSeniorById(mobileId); } catch(e) { profile = null; }
  }
  if (profile) {
    currentUser = profile;
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appContainer').style.display = '';
    renderIDCard();
    await loadTransactions();
    renderTransactions();
    if (typeof QRCode !== 'undefined') generateQR();
    const firstName = (profile.name || 'Senior').split(' ')[0];
    document.getElementById('appBarSub').textContent = `Hi, ${firstName}! · ID: ${profile.id}`;
  } else {
    // Session ID no longer valid — clear it and show login
    sessionStorage.removeItem('mobileSeniorId');
  }
}

// ── Logout ────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('mobileSeniorId');
  currentUser = null;
  window.location.href = 'logout.php';
});

// ── Biometric Login (WebAuthn) ──────────────────────────────────────────────

function _bufferToBase64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function _base64urlToBuffer(b64) {
  const b64pad = b64.replace(/-/g,'+').replace(/_/g,'/').padEnd(b64.length + (4 - b64.length%4)%4, '=');
  const bin = atob(b64pad);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function _setBioState(state) {
  const icon = document.getElementById('bioIcon');
  const msg  = document.getElementById('faceStatusMsg');
  const sub  = document.getElementById('faceStatusSub');
  if (!icon) return;
  icon.className = 'bio-icon' + (state ? ' ' + state : '');
  if (state === 'success') {
    msg.textContent = '✓ Identity verified!';
    msg.style.color = '#16a34a';
    sub.textContent = 'Logging you in...';
  } else if (state === 'error') {
    msg.style.color = '#dc2626';
  } else {
    msg.textContent = 'Verifying identity...';
    msg.style.color = '#111827';
    sub.textContent = 'Approve the biometric prompt on your device';
  }
}

function _showBioModal(state, msgText, subText) {
  document.getElementById('faceLoginModal').classList.add('open');
  const msg = document.getElementById('faceStatusMsg');
  const sub = document.getElementById('faceStatusSub');
  msg.textContent = msgText || 'Loading...';
  sub.textContent = subText || '';
  _setBioState(state);
}

function closeFaceLogin() {
  document.getElementById('faceLoginModal').classList.remove('open');
}

async function openFaceLogin() {
  if (!window.PublicKeyCredential) {
    const m = document.getElementById('loginError');
    m.textContent = 'Biometric login is not supported on this browser.';
    m.classList.add('show');
    return;
  }
  const creds = JSON.parse(localStorage.getItem(WEBAUTHN_CREDS_KEY) || '{}');
  const credKeys = Object.keys(creds);
  if (credKeys.length === 0) {
    _showBioModal('error', 'No biometric registered',
      'Log in with your password first, then tap "Register Biometric" in the app to set it up.');
    return;
  }
  _showBioModal('', 'Verifying identity...', 'Approve the biometric prompt on your device');
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const allowCredentials = credKeys.map(id => ({ id: _base64urlToBuffer(id), type: 'public-key' }));
    const assertion = await navigator.credentials.get({
      publicKey: { challenge, allowCredentials, userVerification: 'required', timeout: 60000 }
    });
    const credId = _bufferToBase64url(assertion.rawId);
    const seniorId = creds[credId];
    if (!seniorId) {
      _showBioModal('error', 'Not recognized', 'Re-register your biometric in the app and try again.');
      return;
    }
    _setBioState('success');
    // Auto-login
    try {
      let profile = null;
      if (window.db) profile = await window.db.getSeniorById(seniorId);
      if (!profile && window.db) profile = await window.db.getSeniorByUsername(seniorId);
      if (!profile) { _showBioModal('error', 'Profile not found', 'Please use password login.'); return; }
      currentUser = profile;
      sessionStorage.setItem('mobileSeniorId', profile.id);
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appContainer').style.display = '';
      renderIDCard();
      await loadTransactions();
      renderTransactions();
      if (typeof QRCode !== 'undefined') generateQR();
      const firstName = (profile.name || 'Senior').split(' ')[0];
      document.getElementById('appBarSub').textContent = `Hi, ${firstName}! · ID: ${profile.id}`;
    } catch(e) { _showBioModal('error', 'Login error', 'Please use password login.'); }
  } catch(e) {
    if (e.name === 'NotAllowedError') {
      _showBioModal('error', 'Cancelled', 'Biometric verification was cancelled.');
    } else {
      _showBioModal('error', 'Error', e.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('faceCancelBtn')?.addEventListener('click', closeFaceLogin);
});

// ── Boot ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkMobileLoginState();
  if (currentUser) {
    init();
  }
});
</script>
</body>
</html>
