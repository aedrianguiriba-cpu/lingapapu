# Admin Interface Testing Checklist

## Pre-Testing Setup
- [ ] Open `admin.html` in a modern browser (Chrome, Firefox, Edge)
- [ ] Open Browser DevTools (F12)
- [ ] Check Console tab for any errors
- [ ] Verify Network tab shows all resources loaded (200 status)

## ✅ Files to Verify Loaded
- [ ] `admin.html` (main file)
- [ ] `assets/style.css`
- [ ] `assets/script.js`
- [ ] `assets/admin-modals.js` ⭐ NEW
- [ ] `assets/reports.js`
- [ ] QRCode.js (from CDN)
- [ ] Chart.js (from CDN)

## 📊 Dashboard Tab Tests

### Initial Load
- [ ] Dashboard is the default active tab
- [ ] 4 analytics cards display numbers
- [ ] 3 charts render (Gender, Age, Transactions)
- [ ] No console errors

### Data Verification
- [ ] Total Seniors shows 15
- [ ] Gender distribution matches data
- [ ] Age distribution chart has bars
- [ ] Transaction activity chart displays

## 👥 Manage Seniors Tab Tests

### Table Display
- [ ] Switch to Manage Seniors tab
- [ ] Table shows 15 senior profiles
- [ ] All 9 columns visible: ID, Name, Birth Date, Age, Gender, Contact, Address, Benefits, Actions
- [ ] Age calculated correctly from birth date
- [ ] Addresses show Pampanga locations

### Search Functionality
- [ ] Type in search box
- [ ] Table filters in real-time
- [ ] Search works for: name, ID, contact, address
- [ ] Clear search shows all records

### Filter Functionality
- [ ] Gender filter: Select "Male" → shows only males
- [ ] Gender filter: Select "Female" → shows only females
- [ ] Gender filter: Select "All" → shows all seniors
- [ ] Benefit filter works
- [ ] Sort by Name: A-Z order
- [ ] Sort by Date: Oldest first

### Stats Cards
- [ ] Total Seniors count matches table
- [ ] Male count matches filtered view
- [ ] Female count matches filtered view
- [ ] Active This Month shows correct number

### Action Buttons (4 per row)

#### 👁️ View Button
- [ ] Click View on any senior
- [ ] Senior Details Modal opens
- [ ] Modal shows: Name, ID, Age, Gender
- [ ] Contact info displays with icon
- [ ] Address shows correctly
- [ ] Benefits section populated
- [ ] Transaction history appears (if any)
- [ ] Click "Close" → modal closes
- [ ] Click outside modal → modal closes
- [ ] Click "Edit Senior" → Edit Modal opens

#### ✏️ Edit Button
- [ ] Click Edit on any senior
- [ ] Edit Senior Modal opens
- [ ] Form pre-populated with current data
- [ ] Senior ID field is read-only
- [ ] Name field editable
- [ ] Birth Date picker works
- [ ] Gender dropdown works
- [ ] Contact, Email, Address editable
- [ ] Benefits field editable
- [ ] Notes textarea editable
- [ ] Change some data
- [ ] Click "Save Changes"
- [ ] Success alert appears
- [ ] Modal closes
- [ ] Table shows updated data
- [ ] Click "Cancel" → no changes saved

#### 📱 QR Code Button
- [ ] Click QR on any senior
- [ ] QR Code Modal opens
- [ ] QR code displays (256x256)
- [ ] Senior name shows in header
- [ ] Senior ID displays
- [ ] QR code looks valid (scannable pattern)
- [ ] Click "Download QR Code"
- [ ] PNG file downloads
- [ ] File named correctly (e.g., OSCA-2024-001_qr.png)
- [ ] Click "Close" → modal closes
- [ ] Click outside → modal closes

#### 🗑️ Delete Button
- [ ] Click Delete on any senior
- [ ] Confirmation dialog appears
- [ ] Click "Cancel" → nothing happens
- [ ] Click "OK" → senior removed
- [ ] Table refreshes without that row
- [ ] Stats update (total count decreases)
- [ ] Success alert shows
- [ ] Change persists after page refresh

## 📝 Registrations Tab Tests

### Display
- [ ] Switch to Registrations tab
- [ ] "Pending Registrations" header shows
- [ ] Badge shows "5 Pending"
- [ ] 5 registration cards display in grid

### Card Content (check one card)
- [ ] Card shows senior icon
- [ ] Name displayed prominently
- [ ] ID shown (e.g., OSCA-2025-001)
- [ ] Age badge present
- [ ] Gender badge (colored - pink for Female, blue for Male)
- [ ] Application date badge
- [ ] Contact info section
- [ ] Email displayed
- [ ] Address shown
- [ ] Requested benefits listed
- [ ] Documents submitted listed

### Actions on Each Card

#### ✅ Approve Button
- [ ] Click "Approve" on Maria Santos Cruz
- [ ] Confirmation or immediate action
- [ ] Card removed from Registrations view
- [ ] Pending count decreases to 4
- [ ] Switch to Manage Seniors tab
- [ ] Maria Santos Cruz now in seniors table
- [ ] All her data transferred correctly
- [ ] Success message shown

#### 👁️ View Details Button
- [ ] Click "View Details" on any application
- [ ] Alert or modal shows full details
- [ ] All application information visible
- [ ] Click OK or Close

#### ❌ Reject Button
- [ ] Click "Reject" on Roberto Diaz Reyes
- [ ] Confirmation prompt appears
- [ ] Click OK
- [ ] Card removed from view
- [ ] Pending count decreases
- [ ] Not added to Manage Seniors
- [ ] Success/confirmation message

### After Actions
- [ ] Process all 5 registrations (approve or reject)
- [ ] "No pending registrations" message shows
- [ ] Empty state displays with icon
- [ ] Check Manage Seniors → approved ones there

## 🎁 Benefits & Programs Tab
- [ ] Tab switches successfully
- [ ] Content displays (existing layout)
- [ ] No errors in console

## 👔 Manage Staff Tab
- [ ] Tab switches successfully
- [ ] Content displays (existing layout)
- [ ] No errors in console

## 🔄 Data Persistence Tests

### localStorage Check
- [ ] Open DevTools → Application tab → Local Storage
- [ ] Find `lingap_profiles_v3` key
- [ ] Verify it contains senior data
- [ ] Make an edit to a senior
- [ ] Check localStorage updates immediately
- [ ] Refresh page (F5)
- [ ] Changes still present

### Cross-Tab Functionality
- [ ] Make changes in one tab view
- [ ] Switch to Dashboard
- [ ] Dashboard shows updated stats
- [ ] Switch back to Manage Seniors
- [ ] Changes still visible

## 🎨 UI/UX Tests

### Modal Appearance
- [ ] Gradient headers (blue to purple)
- [ ] Rounded corners (20px)
- [ ] Shadow effects visible
- [ ] Close button in top-right
- [ ] Close button hover effect (brightness change)
- [ ] Modal centered on screen
- [ ] Overlay darkens background

### Responsive Behavior
- [ ] Open DevTools → Toggle device toolbar
- [ ] Test mobile view (375px width)
- [ ] Modals shrink to 90% width
- [ ] Forms stack into single column
- [ ] Tables scroll horizontally
- [ ] Buttons remain touchable (min 40px)
- [ ] Cards stack vertically
- [ ] Test tablet view (768px)
- [ ] Test desktop view (1920px)

### Animations
- [ ] Modal open has smooth appearance
- [ ] Modal close has smooth disappearance
- [ ] Button hover effects work
- [ ] Tab switches smoothly

## 🐛 Error Handling Tests

### Invalid Data
- [ ] Open Edit Modal
- [ ] Clear Name field
- [ ] Try to save
- [ ] Form validation prevents save
- [ ] Required field error shown

### Missing Dependencies
- [ ] Open Network tab
- [ ] Block QRCode.js (if possible)
- [ ] Try to generate QR
- [ ] Fallback or error message shown

### Console Messages
Throughout testing, console should show:
- [ ] "loadPendingRegistrations called"
- [ ] "pendingRegistrations array: [5 items]"
- [ ] "Container found: <div>"
- [ ] No red errors
- [ ] No uncaught exceptions

## 📱 Cross-Browser Tests

### Chrome
- [ ] All features work
- [ ] Modals display correctly
- [ ] QR codes generate

### Firefox
- [ ] All features work
- [ ] Modals display correctly
- [ ] QR codes generate

### Edge
- [ ] All features work
- [ ] Modals display correctly
- [ ] QR codes generate

### Safari (if available)
- [ ] All features work
- [ ] Modals display correctly
- [ ] QR codes generate

## 🔒 Security Tests

### Admin Access
- [ ] Try accessing without session
- [ ] Should redirect to index.html
- [ ] Login as admin
- [ ] Access granted

### Data Validation
- [ ] Try entering invalid dates
- [ ] Try entering malformed email
- [ ] Try XSS in text fields
- [ ] Data sanitized

## Performance Tests

### Page Load
- [ ] Page loads in < 2 seconds
- [ ] Charts render quickly
- [ ] No layout shift

### Interactions
- [ ] Modal opens instantly
- [ ] Search filters in real-time (< 100ms)
- [ ] Table updates smooth
- [ ] No lag when switching tabs

## 📝 Final Checklist

### Core Functionality
- [ ] All 5 tabs accessible
- [ ] All modals open and close
- [ ] All CRUD operations work
- [ ] Data persists correctly
- [ ] No console errors

### User Experience
- [ ] Interface is intuitive
- [ ] Modals are professional
- [ ] Colors and gradients consistent
- [ ] Icons display correctly
- [ ] Text is readable

### Data Integrity
- [ ] Edits save correctly
- [ ] Deletions are permanent
- [ ] Approvals add to profiles
- [ ] Stats update accurately
- [ ] localStorage in sync

## 🎉 Success Criteria

All checkboxes marked = **Admin interface fully functional!**

## 📸 Screenshots to Take (Optional)

1. Dashboard with all charts
2. Manage Seniors table (full view)
3. Senior Details Modal (open)
4. Edit Senior Modal (with data)
5. QR Code Modal (with generated QR)
6. Registrations tab with 5 cards
7. Empty registrations state
8. Mobile view of any modal
9. DevTools console (clean, no errors)
10. localStorage content

## 🆘 If Tests Fail

### Modal Not Opening
1. Check `admin-modals.js` loaded
2. Verify function names match HTML onclick
3. Check console for errors
4. Verify modal IDs correct

### Data Not Saving
1. Check localStorage enabled
2. Verify `saveProfiles()` function exists
3. Check console for save errors
4. Test in incognito mode

### QR Not Generating
1. Verify QRCode.js loaded (Network tab)
2. Check internet connection (CDN)
3. Test with different senior
4. Check browser compatibility

### Registrations Not Showing
1. Check console logs:
   - "loadPendingRegistrations called"
   - "pendingRegistrations array: [...]"
   - "Container found: ..."
2. Verify `pendingRegistrations` array populated
3. Check HTML has `id="pendingRegistrations"`
4. Try switching tabs twice

---

**Tester Name:** _________________
**Date:** _________________
**Browser:** _________________
**Pass/Fail:** _________________
**Notes:** _________________
