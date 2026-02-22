// Simple QR Scanner using jsQR
class QRScanner {
    constructor(videoElement, onScanSuccess, onScanError) {
        this.video = videoElement;
        this.onScanSuccess = onScanSuccess;
        this.onScanError = onScanError;
        this.isScanning = false;
        this.stream = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    pause() {
    this.isScanning = false;
  }
  
  resume() {
    if (!this.isScanning) {
      this.isScanning = true;
      this.scan();
    }
  }

  async setupCamera(deviceId = null) {
        try {
            const constraints = {
                video: deviceId ? 
                    { deviceId: { exact: deviceId } } : 
                    { facingMode: 'environment' },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    // Set canvas size to match video
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    resolve();
                };
            });
        } catch (error) {
            console.error('Camera setup failed:', error);
            throw error;
        }
    }
    
    async start(deviceId = null) {
        if (this.isScanning) return;
        
        try {
            await this.setupCamera(deviceId);
            this.isScanning = true;
            this.scan();
        } catch (error) {
            this.onScanError(error);
        }
    }
    
    scan() {
        if (!this.isScanning) return;

        try {
            // Draw video frame onto canvas
            this.ctx.drawImage(this.video, 0, 0);
            
            // Get image data for QR detection
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Try to find QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            
            if (code) {
                this.onScanSuccess(code.data);
            }
        } catch (error) {
            // Ignore single frame errors
            console.debug('Frame scan error:', error);
        }
        
        // Continue scanning
        requestAnimationFrame(() => this.scan());
    }
    
    stop() {
        this.isScanning = false;
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.video) {
            this.video.srcObject = null;
        }
    }
    
    static async getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error enumerating devices:', error);
            return [];
        }
    }
}

// Scanner UI Controller
class ScannerUI {
    constructor() {
        this.scanner = null;
        this.videoElement = null;
        this.setupUI();
    }
    
    setupUI() {
        // Create video element for camera feed
        this.videoElement = document.createElement('video');
        this.videoElement.className = 'scanner-video';
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        
        // Add video element to the reader container
        const reader = document.getElementById('reader');
        if (reader) {
            reader.innerHTML = '';
            reader.appendChild(this.videoElement);
            
            // Add scanning frame overlay
            const overlay = document.createElement('div');
            overlay.className = 'scanner-overlay';
            overlay.innerHTML = '<div class="scan-frame"></div>';
            reader.appendChild(overlay);
        }
        
        // Initialize scanner
        this.scanner = new QRScanner(
            this.videoElement,
            result => {
                // QR code detected
                try {
                    // Decode base64 and parse JSON
                    const decoded = atob(result);
                    const data = JSON.parse(decoded);
                    console.log('Scanned:', data);
                    
                    // Check QR timestamp to prevent duplicate scans
                    const qrTimestamp = new Date(data.timestamp);
                    const now = new Date();
                    const timeDiff = now - qrTimestamp;
                    
                    // If QR code is older than 5 minutes, consider it expired
                    if (timeDiff > 5 * 60 * 1000) {
                        const el = document.createElement('div');
                        el.className = 'scan-error';
                        el.innerHTML = `
                            <svg viewBox="0 0 24 24" width="48" height="48" stroke="#ef4444" stroke-width="2" fill="none">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12" y2="16"/>
                            </svg>
                        `;
                        document.querySelector('.scan-frame')?.appendChild(el);
                        setTimeout(() => el.remove(), 1000);
                        
                        // Show expired message
                        const log = document.getElementById('scanLog');
                        if (log) log.textContent = `QR code has expired. Ask senior to generate a new one.`;
                        return;
                    }
                    
                    // Show transaction modal
                    showTransactionModal({
                        id: data.id,
                        name: data.name
                    });
                    
                    // Store scanner instance globally so we can resume it
                    window.currentScanner = this.scanner;
                    
                    // Pause scanning while modal is open
                    this.scanner.pause();
                    
                    // Show success animation
                    const successEl = document.createElement('div');
                    successEl.className = 'scan-success';
                    successEl.innerHTML = `
                        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                    `;
                    document.querySelector('.scan-frame')?.appendChild(successEl);
                    setTimeout(() => successEl.remove(), 1000);
                } catch (err) {
                    console.error('Invalid QR format:', err);
                    const log = document.getElementById('scanLog');
                    if (log) log.textContent = 'Invalid QR code format';
                }
            },
            this.handleError.bind(this)
        );
        
        // Setup camera selection and buttons
        this.populateCameras();
        
        // Wire up buttons
        document.getElementById('startScan')?.addEventListener('click', () => this.startScanner());
        document.getElementById('stopScan')?.addEventListener('click', () => this.stopScanner());
        document.getElementById('refreshCams')?.addEventListener('click', () => this.populateCameras());
    }
    
    async populateCameras() {
        const select = document.getElementById('cameraSelect');
        if (!select) return;
        
        try {
            setCameraStatus('Looking for cameras...');
            const cameras = await QRScanner.getCameras();
            
            select.innerHTML = '<option value="">Default Camera</option>';
            
            cameras.forEach(camera => {
                const option = document.createElement('option');
                option.value = camera.deviceId;
                option.text = camera.label || `Camera ${cameras.indexOf(camera) + 1}`;
                select.appendChild(option);
            });
            
            setCameraStatus(cameras.length ? `Found ${cameras.length} cameras` : 'Using default camera');
        } catch (error) {
            console.error('Camera enumeration failed:', error);
            setCameraStatus('Camera detection failed');
        }
    }
    
    async startScanner() {
        const select = document.getElementById('cameraSelect');
        const deviceId = select?.value || null;
        
        try {
            showCameraSpinner(true);
            setCameraStatus('Starting camera...');
            setButtonsDisabled(true);
            
            await this.scanner.start(deviceId);
            
            setCameraStatus('Scanner ready');
            setButtonsDisabled(true);
        } catch (error) {
            console.error('Failed to start scanner:', error);
            setCameraStatus(`Camera error: ${error.message}`);
            setButtonsDisabled(false);
        } finally {
            showCameraSpinner(false);
        }
    }
    
    stopScanner() {
        this.scanner?.stop();
        setCameraStatus('Scanner stopped');
        setButtonsDisabled(false);
    }
    
    handleScan(result) {
        // Show success animation
        const successEl = document.createElement('div');
        successEl.className = 'scan-success';
        successEl.innerHTML = `
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
        `;
        
        document.querySelector('.scan-frame')?.appendChild(successEl);
        setTimeout(() => successEl.remove(), 1000);
        
        // Process the scan
        handleAdminScan(result);
    }
    
    handleError(error) {
        console.error('Scanner error:', error);
        setCameraStatus(`Error: ${error.message}`);
    }
}

// Helper functions
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

// Initialize scanner when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('admin.html')) {
        new ScannerUI();
    }
});