<?php
header('Content-Type: application/manifest+json; charset=utf-8');
header('Cache-Control: public, max-age=604800');
echo '{
  "name": "LingapApu Senior",
  "short_name": "LingapApu",
  "description": "Senior Citizen ID, QR Code & Transaction Portal",
  "start_url": "./senior-mobile.php",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#16a34a",
  "background_color": "#16a34a",
  "lang": "en",
  "categories": ["government", "health", "lifestyle"],
  "icons": [
    {
      "src": "assets/pics/logo.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/pics/logo.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/pics/logo.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/pics/logo.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/pics/logo.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "assets/pics/logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "assets/pics/logo.png",
      "sizes": "512x512",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Senior ID & QR Code"
    }
  ],
  "shortcuts": [
    {
      "name": "My QR Code",
      "short_name": "QR Code",
      "description": "Show my senior QR code",
      "url": "./senior-mobile.php#qr",
      "icons": [{ "src": "assets/pics/logo.png", "sizes": "96x96" }]
    },
    {
      "name": "My Transactions",
      "short_name": "Transactions",
      "description": "View my transaction history",
      "url": "./senior-mobile.php#tx",
      "icons": [{ "src": "assets/pics/logo.png", "sizes": "96x96" }]
    }
  ]
}';
