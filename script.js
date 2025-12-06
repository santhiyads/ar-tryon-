// ============================================
// DOM ELEMENTS
// ============================================
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusText = document.getElementById('status-text');
const statusDot = document.querySelector('.status-dot');
const spinner = document.getElementById('spinner');
const infoPanel = document.getElementById('info-panel');
const errorBanner = document.getElementById('error-banner');
const startBtn = document.getElementById('start-btn');
const snapBtn = document.getElementById('snap-btn');
const helpBtn = document.getElementById('help-btn');
const dressCarousel = document.getElementById('dress-carousel');

// ============================================
// STATE
// ============================================
let poseDetector = null;
let camera = null;
let isRunning = false;
let currentDressIndex = 0;
let lastPoseTime = Date.now();
let poseTimeout = null;

// Dress configurations - now with image support
let dressConfigs = [
    { 
        name: 'Red Dress', 
        color: '#ef4444',
        emoji: '👗',
        image: null
    },
    { 
        name: 'Blue Dress', 
        color: '#3b82f6',
        emoji: '💙',
        image: null
    },
    { 
        name: 'Green Dress', 
        color: '#10b981',
        emoji: '💚',
        image: null
    },
    { 
        name: 'Purple Dress', 
        color: '#a855f7',
        emoji: '💜',
        image: null
    },
    { 
        name: 'Black Dress', 
        color: '#1f2937',
        emoji: '🖤',
        image: null
    },
];

// Load dress images on startup
const dressImages = ['assets/dress1.png', 'assets/dress2.png', 'assets/dress3.png', 'assets/dress4.png', 'assets/dress5.png'];

dressConfigs.forEach((config, index) => {
    if (dressImages[index]) {
        const img = new Image();
        img.onload = () => {
            dressConfigs[index].image = img;

            // update button thumbnail
            const btn = document.querySelector(`#dress-carousel [data-id="${index}"]`);
            if (btn) {
                btn.innerHTML = '';
                const thumbImg = document.createElement('img');
                thumbImg.src = img.src;
                thumbImg.style.width = '100%';
                thumbImg.style.height = '100%';
                thumbImg.style.objectFit = 'cover';
                thumbImg.style.borderRadius = '10px';
                btn.appendChild(thumbImg);
                btn.title = config.name;
            }
        };
        img.src = dressImages[index];
    }
});



// ============================================
// UTILITY FUNCTIONS
// ============================================
function setStatus(text, isActive) {
    statusText.textContent = text;
    statusDot.classList.toggle('active', isActive);
}

function showSpinner(show) {
    spinner.classList.toggle('show', show);
}

function showInfo(show) {
    infoPanel.classList.toggle('show', show);
}

function showError(message, duration = 3000) {
    errorBanner.textContent = message;
    errorBanner.classList.add('show');
    setTimeout(() => {
        errorBanner.classList.remove('show');
    }, duration);
}

function resizeCanvas() {
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

function normalizedToPixel(normalized) {
    return {
        x: normalized.x * canvas.width,
        y: normalized.y * canvas.height,
    };
}

function distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// ============================================
// DRAWING FUNCTIONS
// ============================================
function drawDressOverlay(landmarks) {
    if (!landmarks || landmarks.length < 25) return;

    // Key body points
    const leftShoulder = normalizedToPixel(landmarks[11]);
    const rightShoulder = normalizedToPixel(landmarks[12]);
    const leftHip = normalizedToPixel(landmarks[23]);
    const rightHip = normalizedToPixel(landmarks[24]);
    const leftElbow = normalizedToPixel(landmarks[13]);
    const rightElbow = normalizedToPixel(landmarks[14]);
    const leftWrist = normalizedToPixel(landmarks[15]);
    const rightWrist = normalizedToPixel(landmarks[16]);

    // Center and dimensions - start from neck area
    const neck = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (Math.min(leftShoulder.y, rightShoulder.y) - 55),
    };

    const hip = {
        x: (leftHip.x + rightHip.x) / 2,
        y: (leftHip.y + rightHip.y) / 2,
    };

    const shoulderWidth = distance(leftShoulder, rightShoulder);
    const torsoHeight = distance(neck, hip);

    // Dress dimensions - starts at neck
    const dressWidth = shoulderWidth * 1.6;
    const dressHeight = torsoHeight * 1.6;
    const dressX = neck.x - dressWidth / 2;
    const dressY = neck.y;

    // If PNG image exists, draw it; otherwise draw colored overlay
    const dressImage = dressConfigs[currentDressIndex].image;
    
    if (dressImage) {
        // Draw the PNG outfit image
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        // Draw image scaled to dress dimensions
        ctx.drawImage(dressImage, dressX, dressY, dressWidth, dressHeight);
        
        ctx.restore();
    } else {
        // Fallback: Draw colored dress
        ctx.fillStyle = dressConfigs[currentDressIndex].color + '60';
        ctx.beginPath();
        ctx.moveTo(dressX + dressWidth * 0.1, dressY);
        ctx.lineTo(dressX + dressWidth * 0.9, dressY);
        ctx.quadraticCurveTo(
            dressX + dressWidth,
            dressY + dressHeight * 0.3,
            dressX + dressWidth * 0.95,
            dressY + dressHeight
        );
        ctx.lineTo(dressX + dressWidth * 0.05, dressY + dressHeight);
        ctx.quadraticCurveTo(
            dressX,
            dressY + dressHeight * 0.3,
            dressX + dressWidth * 0.1,
            dressY
        );
        ctx.closePath();
        ctx.fill();

        // Draw dress outline
        ctx.strokeStyle = dressConfigs[currentDressIndex].color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw sleeves
        ctx.fillStyle = dressConfigs[currentDressIndex].color + '40';

        // Left sleeve
        ctx.beginPath();
        ctx.moveTo(leftShoulder.x, leftShoulder.y);
        ctx.lineTo(leftElbow.x, leftElbow.y);
        ctx.lineTo(leftElbow.x - 15, leftElbow.y + 10);
        ctx.lineTo(leftShoulder.x - 20, leftShoulder.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right sleeve
        ctx.beginPath();
        ctx.moveTo(rightShoulder.x, rightShoulder.y);
        ctx.lineTo(rightElbow.x, rightElbow.y);
        ctx.lineTo(rightElbow.x + 15, rightElbow.y + 10);
        ctx.lineTo(rightShoulder.x + 20, rightShoulder.y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Center line for depth
        ctx.strokeStyle = dressConfigs[currentDressIndex].color + '80';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(neck.x, neck.y);
        ctx.lineTo(hip.x, hip.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

// ============================================
// MEDIAPIPE POSE DETECTION
// ============================================
function initPose() {
    poseDetector = new Pose({
        locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`,
    });

    poseDetector.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
    });

    poseDetector.onResults(onPoseResults);
}

function onPoseResults(results) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);


    // Track pose detection
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
        lastPoseTime = Date.now();
        clearTimeout(poseTimeout);
        drawDressOverlay(results.poseLandmarks);
        
        // Reset timeout warning
        poseTimeout = setTimeout(() => {
            if (isRunning) {
                showError('Person not detected. Please face the camera.');
            }
        }, 2000);
    }
}

function startCamera() {
    if (camera || !video) return;

    showSpinner(true);
    setStatus('Initializing...', false);
    showInfo(false);

    camera = new Camera(video, {
        onFrame: async () => {
            if (!poseDetector) return;
            try {
                await poseDetector.send({ image: video });
            } catch (e) {
                console.error('Pose detection error:', e);
            }
        },
        width: 1280,
        height: 720,
    });

    camera
        .start()
        .then(() => {
            showSpinner(false);
            setStatus('Tracking...', true);
            isRunning = true;
            startBtn.textContent = 'Stop';
        })
        .catch((error) => {
            console.error('Camera error:', error);
            showSpinner(false);
            setStatus('Camera Error', false);
            showError('Camera is already in use. Close other apps using camera & refresh.');
            camera = null;
        });
}

function stopCamera() {
    if (camera) {
        camera.stop();
        camera = null;
        isRunning = false;
        setStatus('Ready', false);
        startBtn.textContent = 'Start';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        clearTimeout(poseTimeout);
        showInfo(true);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
window.addEventListener('resize', resizeCanvas);
video.addEventListener('loadedmetadata', resizeCanvas);

startBtn.addEventListener('click', () => {
    if (!isRunning) {
        if (!poseDetector) initPose();
        startCamera();
    } else {
        stopCamera();
    }
});

snapBtn.addEventListener('click', () => {
    if (canvas.width === 0 || canvas.height === 0) {
        showError('Start camera first to take a snapshot!');
        return;
    }
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `ar-tryon-${Date.now()}.png`;
    link.click();
});

helpBtn.addEventListener('click', () => {
    showInfo(!infoPanel.classList.contains('show'));
});

dressCarousel.addEventListener('click', (e) => {
    const btn = e.target.closest('.dress-btn');
    if (!btn) return;

    dressCarousel
        .querySelectorAll('.dress-btn')
        .forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    currentDressIndex = parseInt(btn.dataset.id, 10);
});

// File upload handler
const outfitUpload = document.getElementById('outfit-upload');
const clearBtn = document.getElementById('clear-btn');

outfitUpload.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach((file, index) => {
        if (index >= dressConfigs.length) return; // Don't exceed dress slots

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                dressConfigs[index].image = img;
                dressConfigs[index].name = file.name.replace(/\.[^/.]+$/, '');
                
                // Update button with thumbnail image preview
                const btn = dressCarousel.querySelector(`[data-id="${index}"]`);
                if (btn) {
                    btn.innerHTML = '';
                    const thumbImg = document.createElement('img');
                    thumbImg.src = event.target.result;
                    thumbImg.style.width = '100%';
                    thumbImg.style.height = '100%';
                    thumbImg.style.objectFit = 'cover';
                    thumbImg.style.borderRadius = '10px';
                    btn.appendChild(thumbImg);
                    btn.title = dressConfigs[index].name;
                }
                
                showError(`✓ ${dressConfigs[index].name} loaded!`, 2000);
            };
            img.onerror = () => {
                showError(`✗ Failed to load ${file.name}`, 3000);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
});

clearBtn.addEventListener('click', () => {
    dressConfigs.forEach((config, index) => {
        config.image = null;
        const btn = dressCarousel.querySelector(`[data-id="${index}"]`);
        if (btn) {
            btn.innerHTML = `<span class="dress-btn-emoji">${config.emoji}</span>`;
        }
    });
    outfitUpload.value = '';
    showError('✓ All outfits cleared!', 2000);
});

// ============================================
// INITIALIZATION
// ============================================
window.addEventListener('load', () => {
    resizeCanvas();
    setStatus('Ready', false);
    showInfo(true);
});