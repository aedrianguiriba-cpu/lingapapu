// Modal Functions for Admin Page

let currentSeniorForEdit = null;
let currentQRSeniorId = null;

// Senior Details Modal
function viewSeniorDetails(idx) {
  const p = profiles[idx];
  if(!p) return;
  
  const modal = document.getElementById('seniorDetailsModal');
  if(!modal) {
    // Fallback to alert if modal doesn't exist
    alert(`Senior Details:\n\nID: ${p.id}\nName: ${p.name}\nBirth Date: ${p.birth}\nAge: ${calculateAge(p.birth)}\nGender: ${p.gender || 'N/A'}\nContact: ${p.contact || 'N/A'}\nEmail: ${p.email || 'N/A'}\nAddress: ${p.address || 'N/A'}\nBenefits: ${p.benefits || 'N/A'}\nNotes: ${p.notes || 'N/A'}`);
    return;
  }
  
  const age = calculateAge(p.birth);
  const subtitle = document.getElementById('detailsModalSubtitle');
  const content = document.getElementById('seniorDetailsContent');
  
  if(subtitle) subtitle.textContent = `ID: ${p.id}`;
  
  if(content) {
    content.innerHTML = `
      <div style="display:grid;gap:24px">
        <div style="display:flex;align-items:start;gap:20px">
          <div style="width:80px;height:80px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div style="flex:1">
            <h2 style="margin:0;font-size:24px;font-weight:700">${p.name}</h2>
            <p style="margin:8px 0 0;color:var(--text-light);font-size:15px">${p.id}</p>
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
              <span style="padding:6px 12px;background:${p.gender === 'Female' ? 'linear-gradient(135deg,#ec4899,#db2777)' : 'linear-gradient(135deg,#06b6d4,#0891b2)'};border-radius:8px;font-size:13px;font-weight:600;color:#fff">
                ${p.gender || 'N/A'}
              </span>
              <span style="padding:6px 12px;background:var(--bg);border-radius:8px;font-size:13px;font-weight:600;color:var(--text)">
                Age: ${age}
              </span>
              <span style="padding:6px 12px;background:var(--bg);border-radius:8px;font-size:13px;font-weight:600;color:var(--text)">
                Born: ${p.birth}
              </span>
            </div>
          </div>
        </div>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px">
          <div style="padding:20px;background:var(--bg);border-radius:12px;border:2px solid var(--border)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div style="width:40px;height:40px;background:linear-gradient(135deg,#10b981,#059669);border-radius:10px;display:flex;align-items:center;justify-content:center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <div style="font-size:12px;font-weight:600;color:var(--text-light);text-transform:uppercase">Contact</div>
                <div style="font-size:15px;font-weight:600;margin-top:4px">${p.contact || 'N/A'}</div>
                <div style="font-size:13px;color:var(--text-light);margin-top:2px">${p.email || ''}</div>
              </div>
            </div>
          </div>
          
          <div style="padding:20px;background:var(--bg);border-radius:12px;border:2px solid var(--border)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <div style="width:40px;height:40px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:10px;display:flex;align-items:center;justify-content:center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <div style="font-size:12px;font-weight:600;color:var(--text-light);text-transform:uppercase">Address</div>
                <div style="font-size:14px;font-weight:600;margin-top:4px">${p.address || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style="padding:20px;background:linear-gradient(to bottom,#fff,var(--bg));border-radius:12px;border:2px solid var(--border)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,var(--accent),var(--primary));border-radius:10px;display:flex;align-items:center;justify-content:center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div style="font-size:16px;font-weight:700">Benefits Enrolled</div>
          </div>
          <div style="font-size:15px">${p.benefits || 'None'}</div>
        </div>
        
        ${p.notes ? `
        <div style="padding:20px;background:var(--bg);border-radius:12px;border:2px solid var(--border)">
          <div style="font-size:14px;font-weight:600;color:var(--text-light);margin-bottom:8px">Notes</div>
          <div style="font-size:14px">${p.notes}</div>
        </div>
        ` : ''}
        
        <div style="padding:20px;background:linear-gradient(to bottom,#fff,var(--bg));border-radius:12px;border:2px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <div style="font-size:16px;font-weight:700">Transaction History</div>
            <div style="padding:6px 12px;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:8px;color:#fff;font-size:13px;font-weight:700">
              ${p.transactions ? p.transactions.length : 0} Total
            </div>
          </div>
          ${p.transactions && p.transactions.length > 0 ? `
            <div style="display:grid;gap:12px;max-height:300px;overflow-y:auto">
              ${p.transactions.slice(0, 10).map(t => `
                <div style="padding:16px;background:#fff;border-radius:10px;border:1px solid var(--border)">
                  <div style="display:flex;justify-content:space-between;align-items:start">
                    <div>
                      <div style="font-size:14px;font-weight:600">${t.note || 'Transaction'}</div>
                      <div style="font-size:13px;color:var(--text-light);margin-top:4px">
                        ${new Date(t.timestamp).toLocaleString()}
                      </div>
                    </div>
                    ${t.amount ? `<div style="font-size:16px;font-weight:700;color:var(--primary)">₱${t.amount}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : '<div style="text-align:center;padding:40px;color:var(--text-light)">No transactions recorded yet</div>'}
        </div>
      </div>
    `;
  }
  
  currentSeniorForEdit = idx;
  modal.style.display = 'flex';
}

function closeSeniorDetailsModal() {
  const modal = document.getElementById('seniorDetailsModal');
  if(modal) modal.style.display = 'none';
}

function editSeniorFromModal() {
  closeSeniorDetailsModal();
  if(currentSeniorForEdit !== null) {
    editSenior(currentSeniorForEdit);
  }
}

// Edit Senior Modal
function editSenior(idx) {
  const p = profiles[idx];
  if(!p) return;
  
  const modal = document.getElementById('editSeniorModal');
  if(!modal) {
    alert('Edit modal not available');
    return;
  }
  
  const subtitle = document.getElementById('editModalSubtitle');
  if(subtitle) subtitle.textContent = `Editing: ${p.name}`;
  
  document.getElementById('editSeniorIndex').value = idx;
  document.getElementById('editSeniorId').value = p.id;
  document.getElementById('editSeniorName').value = p.name;
  document.getElementById('editSeniorBirth').value = p.birth;
  document.getElementById('editSeniorGender').value = p.gender || '';
  document.getElementById('editSeniorContact').value = p.contact || '';
  document.getElementById('editSeniorEmail').value = p.email || '';
  document.getElementById('editSeniorAddress').value = p.address || '';
  document.getElementById('editSeniorBenefits').value = p.benefits || '';
  document.getElementById('editSeniorNotes').value = p.notes || '';
  
  modal.style.display = 'flex';
}

function closeEditSeniorModal() {
  const modal = document.getElementById('editSeniorModal');
  if(modal) modal.style.display = 'none';
}

function saveEditedSenior(event) {
  if(event) event.preventDefault();
  
  const idx = parseInt(document.getElementById('editSeniorIndex').value);
  if(isNaN(idx) || idx < 0 || idx >= profiles.length) return;
  
  profiles[idx].name = document.getElementById('editSeniorName').value.trim();
  profiles[idx].birth = document.getElementById('editSeniorBirth').value;
  profiles[idx].gender = document.getElementById('editSeniorGender').value;
  profiles[idx].contact = document.getElementById('editSeniorContact').value.trim();
  profiles[idx].email = document.getElementById('editSeniorEmail').value.trim();
  profiles[idx].address = document.getElementById('editSeniorAddress').value.trim();
  profiles[idx].benefits = document.getElementById('editSeniorBenefits').value.trim();
  profiles[idx].notes = document.getElementById('editSeniorNotes').value.trim();
  
  saveProfiles();
  filterSeniors();
  updateSeniorStats();
  closeEditSeniorModal();
  
  showSuccessToast(`${profiles[idx].name} updated successfully!`);
}

// QR Code Modal
function showSeniorQRCode(seniorId) {
  const modal = document.getElementById('qrModal');
  if(!modal) {
    console.error('QR modal not found');
    showErrorToast('QR modal not available');
    return;
  }
  
  const senior = profiles.find(p => p.id === seniorId);
  if(!senior) {
    showErrorToast('Senior not found');
    return;
  }
  
  const subtitle = document.getElementById('qrModalSubtitle');
  if(subtitle) subtitle.textContent = `${senior.name} - ${seniorId}`;
  
  const container = document.getElementById('qrCodeContainer');
  if(container) {
    container.innerHTML = '';
    
    // Check if QRCode library is available (qrcode.js from CDN)
    if(typeof QRCode !== 'undefined' && typeof QRCode.toCanvas === 'function') {
      try {
        // Create QR code with senior's full information as JSON
        const qrData = JSON.stringify({
          id: senior.id,
          name: senior.name,
          birth: senior.birth,
          contact: senior.contact
        });
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        
        // Generate QR code using qrcode.js toCanvas method
        QRCode.toCanvas(canvas, qrData, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'H'
        }, function(error) {
          if(error) {
            console.error('QR generation error:', error);
            container.innerHTML = `<div style="padding:40px;color:#ef4444;text-align:center">Error generating QR code</div>`;
          } else {
            console.log('QR Code generated successfully for:', seniorId);
          }
        });
      } catch(error) {
        console.error('QR generation error:', error);
        container.innerHTML = `<div style="padding:40px;color:#ef4444;text-align:center">Error generating QR code</div>`;
      }
    } else {
      console.error('QRCode library not loaded');
      container.innerHTML = '<div style="padding:40px;color:var(--text-light);text-align:center">QR Code library not loaded. Please refresh the page.</div>';
    }
  }
  
  currentQRSeniorId = seniorId;
  modal.style.display = 'flex';
}

function closeQRModal() {
  const modal = document.getElementById('qrModal');
  if(modal) modal.style.display = 'none';
  currentQRSeniorId = null;
}

function downloadQRCode() {
  if(!currentQRSeniorId) return;
  
  const container = document.getElementById('qrCodeContainer');
  const canvas = container ? container.querySelector('canvas') : null;
  
  if(canvas) {
    const link = document.createElement('a');
    link.download = `QR_${currentQRSeniorId}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }
}

// Delete Senior Modal
let currentDeleteIndex = null;

function deleteSenior(idx) {
  const p = profiles[idx];
  if(!p) return;
  
  const modal = document.getElementById('deleteSeniorModal');
  if(!modal) {
    // Fallback to confirm dialog
    if(confirm(`Are you sure you want to delete ${p.name}?\n\nThis action cannot be undone.`)) {
      profiles.splice(idx, 1);
      saveProfiles();
      filterSeniors();
      updateSeniorStats();
      showSuccessToast(`${p.name} has been removed from the system.`);
    }
    return;
  }
  
  const nameEl = document.getElementById('deleteSeniorName');
  const detailsEl = document.getElementById('deleteSeniorDetails');
  
  if(nameEl) nameEl.textContent = p.name;
  if(detailsEl) detailsEl.textContent = `ID: ${p.id} • Age: ${calculateAge(p.birth)} • ${p.gender || 'N/A'}`;
  
  currentDeleteIndex = idx;
  modal.style.display = 'flex';
}

function closeDeleteSeniorModal() {
  const modal = document.getElementById('deleteSeniorModal');
  if(modal) modal.style.display = 'none';
  currentDeleteIndex = null;
}

function confirmDeleteSenior() {
  if(currentDeleteIndex === null || currentDeleteIndex < 0 || currentDeleteIndex >= profiles.length) {
    closeDeleteSeniorModal();
    return;
  }
  
  const p = profiles[currentDeleteIndex];
  const name = p.name;
  
  profiles.splice(currentDeleteIndex, 1);
  saveProfiles();
  filterSeniors();
  updateSeniorStats();
  closeDeleteSeniorModal();
  
  showSuccessToast(`${name} has been removed from the system.`);
}
