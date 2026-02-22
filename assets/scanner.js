// QR Scanner Implementation
let scanner = null;

async function initializeScanner() {
    const reader = document.getElementById('reader');
    if (!reader) return;

    try {
        scanner = new Html5Qrcode("reader", {
            verbose: false,
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
        });
    } catch (err) {
        console.error("Scanner initialization failed:", err);
        setCameraStatus("Scanner initialization failed");
    }
}

async function populateCameras() {
    const select = document.getElementById('cameraSelect');
    const log = document.getElementById('scanLog');
    
    if (!select) return;
    
    // Default options
    select.innerHTML = `
        <option value="environment">Back Camera</option>
        <option value="user">Front Camera</option>
    `;
    
    try {
        const devices = await Html5Qrcode.getCameras();
        console.log('Available cameras:', devices);
        
        if (devices && devices.length) {
            // Add separator
            select.add(new Option('──────────', '', false, false)).disabled = true;
            
            // Add each device
            devices.forEach(device => {
                const option = new Option(
                    device.label || `Camera ${devices.indexOf(device) + 1}`,
                    device.id
                );
                select.add(option);
            });
            
            setCameraStatus(`${devices.length} camera(s) found`);
        }
    } catch (err) {
        console.warn('Camera enumeration error:', err);
        setCameraStatus('Using default camera options');
    }
}

function setCameraStatus(message) {
    const status = document.getElementById('cameraStatus');
    if (status) status.textContent = message || '';
}

function setButtonsDisabled(disabled) {
    const startBtn = document.getElementById('startScan');
    const stopBtn = document.getElementById('stopScan');
    if (startBtn) startBtn.disabled = disabled;
    if (stopBtn) stopBtn.disabled = !disabled;
}

function showCameraSpinner(show = true) {
    const spinner = document.getElementById('camSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
        spinner.setAttribute('aria-hidden', (!show).toString());
    }
}

async function startScan() {
    if (!scanner) {
        await initializeScanner();
        if (!scanner) return;
    }
    
    const select = document.getElementById('cameraSelect');
    const log = document.getElementById('scanLog');
    
    // If already scanning, ignore
    if (scanner.isScanning) {
        if (log) log.textContent = 'Scanner already running';
        return;
    }
    
    // Show starting state
    showCameraSpinner(true);
    setCameraStatus('Starting camera...');
    setButtonsDisabled(true);
    
    try {
        const selectedValue = select?.value || 'environment';
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 4/3
        };
        
        // Configure camera
        let cameraConfig;
        if (selectedValue === 'environment' || selectedValue === 'user') {
            cameraConfig = { facingMode: selectedValue };
        } else {
            cameraConfig = selectedValue; // Device ID
        }
        
        await scanner.start(
            cameraConfig,
            config,
            (decodedText) => {
                handleSuccessfulScan(decodedText);
            },
            (errorMessage) => {
                // Only log critical errors
                if (
                    errorMessage.includes('NotReadableError') ||
                    errorMessage.includes('NotAllowedError') ||
                    errorMessage.includes('NotFoundError')
                ) {
                    console.error('Camera error:', errorMessage);
                }
            }
        );
        
        setCameraStatus('Scanner ready');
        setButtonsDisabled(true);
        if (log) log.textContent = 'Scanner started';
        
    } catch (err) {
        console.error('Failed to start scanner:', err);
        setCameraStatus(`Camera error: ${err.message}`);
        setButtonsDisabled(false);
        if (log) log.textContent = `Failed to start scanner: ${err.message}`;
    } finally {
        showCameraSpinner(false);
    }
}

async function stopScan() {
    if (!scanner) return;
    
    try {
        if (scanner.isScanning) {
            await scanner.stop();
            setCameraStatus('Scanner stopped');
            setButtonsDisabled(false);
        }
    } catch (err) {
        console.error('Error stopping scanner:', err);
    }
}

function handleSuccessfulScan(decodedText) {
    // Show success animation
    const successEl = document.createElement('div');
    successEl.className = 'scan-success';
    successEl.innerHTML = `
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    `;
    
    const frame = document.querySelector('.scan-frame');
    if (frame) {
        frame.appendChild(successEl);
        setTimeout(() => successEl.remove(), 1000);
    }
    
    // Process the scan
    handleAdminScan(decodedText);
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html')) {
        initializeScanner();
        populateCameras();
        
        // Wire up refresh button
        const refreshBtn = document.getElementById('refreshCams');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                setCameraStatus('Refreshing camera list...');
                await populateCameras();
            });
        }
    }
});