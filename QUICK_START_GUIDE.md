# Quick Start Guide - Admin Interface

## 🚀 How to Use

### Access Admin Panel
1. Open `admin.html` in your browser
2. Default tab: **Dashboard** with analytics

## 📋 Main Features

### 1. Dashboard Tab
- View 4 key metrics (Total Seniors, Active This Month, Transactions, Benefits)
- 3 interactive charts (Gender Distribution, Age Distribution, Transaction Activity)
- Refreshes automatically when you switch to this tab

### 2. Manage Seniors Tab
#### Search & Filter
- Search by name, ID, contact, or address
- Filter by Gender (All/Male/Female)
- Filter by Benefit Type
- Sort by Name or Date

#### Senior Table Actions
Click the icon buttons on each row:
- 👁️ **View** - See full senior profile with transaction history
- ✏️ **Edit** - Modify senior information in a form
- 📱 **QR** - Generate and download QR code
- 🗑️ **Delete** - Remove senior (with confirmation)

### 3. Registrations Tab
- View all 5 pending applications
- Each card shows: Name, ID, Age, Gender, Contact, Address, Benefits, Documents
- Actions per application:
  - ✅ **Approve** - Add to system
  - 👁️ **View Details** - See full application
  - ❌ **Reject** - Remove application

## 💡 Modal Features

### Senior Details Modal
Opens when you click 👁️ View
- Shows all senior information
- Displays recent transaction history
- Has "Edit Senior" button for quick editing

### Edit Senior Modal
Opens when you click ✏️ Edit
- All fields editable except ID
- Required fields: Name, Birth Date
- Click "Save Changes" to update
- Changes save to localStorage immediately

### QR Code Modal
Opens when you click 📱 QR
- Displays 256x256 QR code
- Shows senior name and ID
- Click "Download QR Code" to save as PNG
- QR contains senior ID for scanning

## 🔄 Data Flow

### When you approve a registration:
1. Application moves to main seniors list
2. Removed from pending registrations
3. Gets assigned all information from application
4. Can be managed like any other senior

### When you edit a senior:
1. Changes save to `lingap_profiles_v3` in localStorage
2. Table refreshes automatically
3. Stats update if gender or other fields changed
4. All views show updated information

### When you delete a senior:
1. Confirmation prompt appears
2. If confirmed, removed from localStorage
3. Table and stats refresh automatically
4. Cannot be undone (permanent)

## 📊 Current Mock Data

### 15 Senior Profiles in System
All with complete information including addresses in Floridablanca, Pampanga barangays

### 5 Pending Registrations
1. Maria Santos Cruz - Female, Age 69
2. Roberto Diaz Reyes - Male, Age 72
3. Elena Flores Mendoza - Female, Age 66
4. Carlos Bautista Garcia - Male, Age 74
5. Teresita Reyes Santos - Female, Age 65

## 🎯 Tips

- **Click outside modal** to close it quickly
- **Use search** to find seniors instantly
- **Download QR codes** for printing ID cards
- **View details** before editing to verify information
- **Dashboard updates** automatically when switching tabs
- **All changes persist** in localStorage (refresh safe)

## 🐛 Troubleshooting

**Registrations not showing?**
1. Switch to another tab, then back to Registrations
2. Check browser console (F12) for errors
3. Verify you see "loadPendingRegistrations called" in console

**Modals not opening?**
1. Check that `admin-modals.js` loaded (Network tab in DevTools)
2. Verify no JavaScript errors in console
3. Refresh the page

**QR codes not generating?**
1. Verify QRCode.js library loaded (check console)
2. Try a different browser
3. Check internet connection (library loads from CDN)

**Edit not saving?**
1. Make sure Name and Birth Date are filled
2. Check console for validation errors
3. Verify localStorage is enabled in browser

## 📱 Mobile Use

All modals are mobile-responsive:
- Forms stack into single column
- Buttons remain touch-friendly
- Tables scroll horizontally
- Cards stack vertically

## 🔒 Security Notes

- Admin access only (checked on page load)
- All data stored in browser localStorage
- No backend server (pure client-side)
- Clear session on logout

## 📞 Need Help?

Check the full implementation details in:
`ADMIN_IMPLEMENTATION_SUMMARY.md`
