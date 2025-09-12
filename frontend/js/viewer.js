// Viewer JavaScript for 360° Tour Platform
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

// Global state
let currentTour = null;
let currentScene = null;
let viewer = null;
let isVRMode = false;
let autoRotateEnabled = false;
let soundEnabled = true;
let isEmbedMode = false;
let mapVisible = false;


// Initialize viewer
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('tour');
    isEmbedMode = urlParams.get('embed') === 'true';
    
    if (isEmbedMode) {
        document.body.classList.add('embed-mode');
    }
    
    if (tourId) {
        loadTour(tourId);
    } else {
        showError('No tour specified');
    }
    
    initKeyboardControls();
    initVRButton();
});

// Load tour data
async function loadTour(tourId) {
    try {
        const response = await fetch(`${API_BASE}/tours/${tourId}`);
        const data = await response.json();
        
        if (data.success) {
            currentTour = data.tour;
            initializeTour();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error loading tour:', error);
        
        // Fallback to demo data for development
        if (tourId === 'demo-tour-1') {
            loadDemoTour();
        } else {
            showError('Failed to load tour: ' + error.message);
        }
    }
}

// Load demo tour data
function loadDemoTour() {
    currentTour = {
        id: "demo-tour-1",
        title: "Modern Apartment Demo Tour",
        description: "Experience a beautiful modern apartment with 360° views",
        scenes: [
            {
                id: "scene-1",
                title: "Living Room",
                image: "https://pannellum.org/images/alma.jpg",
                preview: "https://pannellum.org/images/alma.jpg", 
                hotspots: [
                    {
                        pitch: -5,
                        yaw: 90,
                        type: "scene",
                        text: "Go to Kitchen",
                        sceneId: "scene-2"
                    },
                    {
                        pitch: 15,
                        yaw: 180,
                        type: "info", 
                        text: "Modern living space with natural lighting"
                    }
                ]
            },
            {
                id: "scene-2", 
                title: "Kitchen",
                image: "https://pannellum.org/images/cerro-toco-0.jpg",
                preview: "https://pannellum.org/images/cerro-toco-0.jpg",
                hotspots: [
                    {
                        pitch: -5,
                        yaw: -90,
                        type: "scene", 
                        text: "Back to Living Room",
                        sceneId: "scene-1"
                    },
                    {
                        pitch: -20,
                        yaw: 0,
                        type: "info",
                        text: "State-of-the-art kitchen appliances"
                    }
                ]
            },
            {
                id: "scene-3",
                title: "Mountain View", 
                image: "https://pannellum.org/images/bma-0.jpg",
                preview: "https://pannellum.org/images/bma-0.jpg",
                hotspots: [
                    {
                        pitch: -10,
                        yaw: 180,
                        type: "scene",
                        text: "Back to Living Room", 
                        sceneId: "scene-1"
                    },
                    {
                        pitch: 10,
                        yaw: 90,
                        type: "info",
                        text: "Beautiful mountain landscape view"
                    }
                ]
            }
        ]
    };
    
    initializeTour();
}

// Initialize tour
function initializeTour() {
    if (!currentTour || !currentTour.scenes || currentTour.scenes.length === 0) {
        showError('Tour has no scenes');
        return;
    }
    
    // Set tour info
    document.getElementById('tourTitle').textContent = currentTour.title;
    
    // Load first scene
    loadScene(currentTour.scenes[0].id);
    
    // Generate scene thumbnails
    generateSceneThumbs();
    
    // Set up share modal
    setupShareModal();
    
    // Hide loading overlay
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Load specific scene
function loadScene(sceneId) {
    const scene = currentTour.scenes.find(s => s.id === sceneId);
    if (!scene) {
        console.error('Scene not found:', sceneId);
        return;
    }
    
    currentScene = scene;
    document.getElementById('sceneTitle').textContent = scene.title;
    
    // Update active thumbnail
    updateActiveThumbnail(sceneId);
    
    // Initialize or update Pannellum viewer
    const config = {
        type: "equirectangular",
        panorama: scene.image,
        autoLoad: true,
        autoRotate: autoRotateEnabled ? -2 : 0,
        compass: true,
        northOffset: 0,
        showControls: true,
        mouseZoom: true,
        preview: scene.preview,
        // Enhanced VR Configuration
        vr: {
            buttonSelector: "#vrBtn",
            enabled: true
        },
        orientationOnByDefault: checkMobileVR(),
        hotSpots: scene.hotspots.map(hotspot => ({
            pitch: hotspot.pitch,
            yaw: hotspot.yaw,
            type: hotspot.type === 'scene' ? 'scene' : 'info',
            text: hotspot.text,
            sceneId: hotspot.sceneId,
            clickHandlerFunc: hotspot.type === 'scene' ? 
                () => loadScene(hotspot.sceneId) : 
                () => showInfoTooltip(hotspot.text),
            createTooltipFunc: (hotSpotDiv) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'hotspot-tooltip';
                tooltip.innerHTML = hotspot.text;
                hotSpotDiv.appendChild(tooltip);
                return tooltip;
            }
        })),
        onLoad: function() {
            console.log('Scene loaded:', scene.title);
        },
        onError: function(error) {
            console.error('Error loading scene:', error);
            showError('Failed to load scene');
        }
    };
    
    if (viewer) {
        viewer.destroy();
    }
    
    viewer = pannellum.viewer('panorama', config);
    
    // Debug VR methods available on viewer
    console.log('=== VIEWER CREATED ===');
    console.log('Viewer object:', viewer);
    console.log('Available methods:', Object.getOwnPropertyNames(viewer));
    console.log('Available methods (including prototype):', Object.getOwnPropertyNames(Object.getPrototypeOf(viewer)));
    console.log('VR support check - toggleVR method:', typeof viewer.toggleVR);
    console.log('VR support check - startVR method:', typeof viewer.startVR);
    console.log('VR support check - stopVR method:', typeof viewer.stopVR);
    console.log('Pannellum version:', pannellum.version || 'unknown');
    console.log('=== END VIEWER DEBUG ===');
}

// Generate scene thumbnails
function generateSceneThumbs() {
    const container = document.getElementById('sceneThumbs');
    container.innerHTML = currentTour.scenes.map(scene => `
        <div class="scene-thumb cursor-pointer rounded-lg overflow-hidden" 
             data-scene-id="${scene.id}"
             onclick="loadScene('${scene.id}')"
             title="${scene.title}">
            <img src="${scene.preview}" alt="${scene.title}" class="w-full h-16 object-cover">
            <div class="text-xs text-center mt-1 truncate">${scene.title}</div>
        </div>
    `).join('');
}

// Update active thumbnail
function updateActiveThumbnail(activeSceneId) {
    document.querySelectorAll('.scene-thumb').forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.dataset.sceneId === activeSceneId) {
            thumb.classList.add('active');
        }
    });
}

// Control functions
function toggleAutoRotate() {
    autoRotateEnabled = !autoRotateEnabled;
    const btn = document.getElementById('autoRotateBtn');
    
    if (viewer) {
        viewer.setAutoRotate(autoRotateEnabled ? -2 : 0);
    }
    
    btn.classList.toggle('active', autoRotateEnabled);
    btn.title = autoRotateEnabled ? 'Stop Auto Rotate' : 'Start Auto Rotate';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.body.requestFullscreen().catch(err => {
            console.error('Error entering fullscreen:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

function toggleVR() {
    console.log('=== VR BUTTON CLICKED ===');
    
    if (!viewer) {
        console.log('No viewer available - panorama may not be loaded yet');
        showNotification('Please wait for the panorama to load', 'error');
        return;
    }

    // Check WebXR support first
    if (checkWebXRSupport()) {
        console.log('WebXR supported, attempting WebXR VR');
        startWebXRSession();
    } 
    // Check Pannellum VR support
    else if (typeof viewer.toggleVR === 'function') {
        console.log('Using Pannellum toggleVR method');
        try {
            viewer.toggleVR();
            isVRMode = !isVRMode;
            updateVRUI();
            showNotification(isVRMode ? 'VR Mode Activated!' : 'VR Mode Deactivated', 'success');
        } catch (error) {
            console.error('Pannellum VR error:', error);
            enterFallbackVR();
        }
    }
    // Use mobile orientation or fullscreen fallback
    else {
        console.log('No native VR support, using fallback');
        enterFallbackVR();
    }
}

// Update VR UI elements
function updateVRUI() {
    const vrBtn = document.querySelector('[title="VR Mode"], [title="Exit VR Mode"]');
    const vrStatus = document.getElementById('vrStatus');
    
    if (vrBtn) {
        vrBtn.classList.toggle('active', isVRMode);
        vrBtn.title = isVRMode ? 'Exit VR Mode' : 'VR Mode';
    }
    
    if (vrStatus) {
        vrStatus.classList.toggle('active', isVRMode);
    }
    
    // Hide/show UI for VR
    const controlPanel = document.getElementById('controlPanel');
    if (controlPanel) {
        controlPanel.style.display = isVRMode ? 'none' : 'block';
    }
}

// Basic VR mode (fullscreen + orientation)
function enterBasicVRMode() {
    console.log('Entering basic VR mode');
    isVRMode = !isVRMode;
    
    if (isVRMode) {
        // Enter fullscreen
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().then(() => {
                console.log('Fullscreen activated for VR');
            }).catch(err => {
                console.log('Fullscreen failed:', err);
            });
        }
        
        // Try to enable device orientation on mobile
        if (checkMobileVR()) {
            enableDeviceOrientation();
        }
        
        showNotification('Basic VR Mode - Use fullscreen and device rotation', 'info');
    } else {
        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        showNotification('VR Mode Deactivated', 'success');
    }
    
    updateVRUI();
}

// Check VR support
function checkVRSupport() {
    // Check for WebXR support (modern standard)
    if ('xr' in navigator) {
        return true;
    }
    
    // Check for older WebVR support
    if ('getVRDisplays' in navigator) {
        return true;
    }
    
    // Check if we're on a mobile device (can use device orientation)
    if (checkMobileVR()) {
        return true;
    }
    
    return false;
}

// Check WebXR support specifically
function checkWebXRSupport() {
    return 'xr' in navigator && navigator.xr;
}

// Start WebXR VR session
async function startWebXRSession() {
    if (!navigator.xr) {
        console.log('WebXR not supported');
        enterFallbackVR();
        return;
    }
    
    try {
        // Check if immersive VR is supported
        const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
        if (!isSupported) {
            console.log('Immersive VR not supported');
            enterFallbackVR();
            return;
        }
        
        if (isVRMode) {
            // Exit VR session
            if (window.vrSession) {
                await window.vrSession.end();
                window.vrSession = null;
            }
            isVRMode = false;
            showNotification('VR Mode Deactivated', 'success');
        } else {
            // Start VR session
            const session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor']
            });
            
            window.vrSession = session;
            isVRMode = true;
            
            // Set up WebXR with the panorama canvas
            setupWebXRRendering(session);
            
            session.addEventListener('end', () => {
                isVRMode = false;
                window.vrSession = null;
                updateVRUI();
                showNotification('VR Session Ended', 'info');
            });
            
            showNotification('WebXR VR Mode Activated!', 'success');
        }
        
        updateVRUI();
        
    } catch (error) {
        console.error('WebXR session error:', error);
        showNotification('WebXR not available, using fallback', 'info');
        enterFallbackVR();
    }
}

// Setup WebXR rendering
function setupWebXRRendering(session) {
    // This is a simplified WebXR setup
    // In a full implementation, you'd need to integrate with Three.js or similar
    console.log('Setting up WebXR rendering for session:', session);
    
    // For now, we'll use the existing Pannellum viewer
    if (viewer && typeof viewer.toggleVR === 'function') {
        try {
            viewer.toggleVR();
        } catch (e) {
            console.log('Pannellum VR fallback failed:', e);
        }
    }
}

// Check mobile VR support (device orientation)
function checkMobileVR() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
           'DeviceOrientationEvent' in window;
}

// Show VR unsupported message
function showVRUnsupportedMessage() {
    const message = `
        <div style="text-align: left;">
            <strong>VR Mode Not Available</strong><br>
            <small>Requirements:</small><br>
            • HTTPS connection<br>
            • VR headset or mobile device<br>
            • Chrome, Firefox, or Edge browser<br>
            • Enable device sensors (mobile)
        </div>
    `;
    
    showNotification('VR not supported on this device/browser', 'error');
    
    // Show detailed info in console
    console.log('VR Support Check:', {
        hasWebXR: 'xr' in navigator,
        hasWebVR: 'getVRDisplays' in navigator,
        isMobile: checkMobileVR(),
        isHTTPS: location.protocol === 'https:',
        userAgent: navigator.userAgent,
        pannellumVR: viewer && typeof viewer.toggleVR === 'function'
    });
    
    // Show requirements info
    showVRRequirements();
}

// Fallback VR mode for devices without native VR support
function enterFallbackVR() {
    isVRMode = !isVRMode;
    
    if (isVRMode) {
        if (checkMobileVR()) {
            // Enable device orientation controls
            enableDeviceOrientation();
            // Enter fullscreen for mobile VR
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
            showNotification('Mobile VR activated! Rotate your device to look around', 'success');
        } else {
            // Desktop fallback - just fullscreen with enhanced controls
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
            showNotification('Fullscreen VR mode activated', 'success');
        }
    } else {
        // Exit fallback VR
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        showNotification('VR Mode Deactivated', 'success');
    }
    
    updateVRUI();
}

// Enable device orientation for mobile VR
function enableDeviceOrientation() {
    if (typeof viewer.setOrientationOnByDefault === 'function') {
        viewer.setOrientationOnByDefault(true);
    }
    
    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response == 'granted') {
                    // Permission granted
                    console.log('Device orientation permission granted');
                }
            })
            .catch(error => {
                console.error('Device orientation permission error:', error);
            });
    }
}

// Show VR requirements modal
function showVRRequirements() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
            <h3 class="text-xl font-bold mb-4">VR Mode Requirements</h3>
            <div class="text-sm space-y-2">
                <div class="flex items-center">
                    <span class="w-4">${location.protocol === 'https:' ? '✅' : '❌'}</span>
                    <span class="ml-2">HTTPS connection</span>
                </div>
                <div class="flex items-center">
                    <span class="w-4">${checkMobileVR() ? '✅' : '❌'}</span>
                    <span class="ml-2">Mobile device or VR headset</span>
                </div>
                <div class="flex items-center">
                    <span class="w-4">${'xr' in navigator || 'getVRDisplays' in navigator ? '✅' : '❌'}</span>
                    <span class="ml-2">WebXR/WebVR support</span>
                </div>
                <div class="flex items-center">
                    <span class="w-4">${/Chrome|Firefox|Edge/i.test(navigator.userAgent) ? '✅' : '❌'}</span>
                    <span class="ml-2">Compatible browser</span>
                </div>
            </div>
            <div class="mt-4 text-xs text-gray-600 dark:text-gray-400">
                <p><strong>For best VR experience:</strong></p>
                <p>• Use Chrome, Firefox, or Edge browser</p>
                <p>• Enable "WebXR Device API" in browser flags</p>
                <p>• Connect VR headset or use mobile device</p>
                <p>• Allow device sensor permissions</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    class="mt-4 bg-primary text-black px-4 py-2 rounded-lg w-full">
                Got it
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    }, 10000);
}

function toggleMap() {
    mapVisible = !mapVisible;
    const mapOverlay = document.getElementById('mapOverlay');
    const mapBtn = document.getElementById('mapBtn');
    
    mapOverlay.classList.toggle('active', mapVisible);
    mapBtn.classList.toggle('active', mapVisible);
    
    if (mapVisible) {
        drawMiniMap();
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundBtn');
    const icon = btn.querySelector('i');
    
    btn.classList.toggle('active', soundEnabled);
    icon.className = soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    btn.title = soundEnabled ? 'Mute Sound' : 'Unmute Sound';
}

// Mini map functionality
function drawMiniMap() {
    const canvas = document.getElementById('miniMap');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple floor plan
    ctx.strokeStyle = '#39FF14';
    ctx.lineWidth = 2;
    
    // Draw rooms (simplified representation)
    const rooms = [
        { x: 10, y: 20, w: 50, h: 30, name: 'Living Room', id: 'scene-1' },
        { x: 70, y: 20, w: 40, h: 30, name: 'Kitchen', id: 'scene-2' },
        { x: 120, y: 20, w: 45, h: 30, name: 'Bedroom', id: 'scene-3' }
    ];
    
    rooms.forEach(room => {
        ctx.strokeRect(room.x, room.y, room.w, room.h);
        
        // Highlight current scene
        if (currentScene && currentScene.id === room.id) {
            ctx.fillStyle = 'rgba(57, 255, 20, 0.3)';
            ctx.fillRect(room.x, room.y, room.w, room.h);
        }
        
        // Add room labels
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(room.name, room.x + 5, room.y + 15);
    });
}

// Share functionality
function setupShareModal() {
    const baseUrl = window.location.origin;
    const tourUrl = `${baseUrl}/viewer.html?tour=${currentTour.id}`;
    const embedCode = `<iframe src="${tourUrl}&embed=true" width="100%" height="600" frameborder="0" allowfullscreen allow="vr; xr; accelerometer; gyroscope"></iframe>`;
    
    document.getElementById('shareLink').value = tourUrl;
    document.getElementById('embedCode').value = embedCode;
}

function showShareModal() {
    document.getElementById('shareModal').classList.add('active');
}

function closeShareModal() {
    document.getElementById('shareModal').classList.remove('active');
}

function copyLink() {
    const input = document.getElementById('shareLink');
    input.select();
    document.execCommand('copy');
    showNotification('Link copied to clipboard!');
}

function copyEmbed() {
    const textarea = document.getElementById('embedCode');
    textarea.select();
    document.execCommand('copy');
    showNotification('Embed code copied to clipboard!');
}

function shareToSocial(platform) {
    const url = document.getElementById('shareLink').value;
    const text = `Check out this amazing 360° virtual tour: ${currentTour.title}`;
    
    let shareUrl = '';
    
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// Initialize VR button event listener
function initVRButton() {
    console.log('Initializing VR button...');
    
    const vrBtn = document.getElementById('vrBtn');
    if (vrBtn) {
        console.log('VR button found, adding event listener');
        
        // Remove any existing onclick to avoid conflicts
        vrBtn.onclick = null;
        
        // Add event listener
        vrBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('VR button clicked via event listener!');
            toggleVR();
        });
        
        console.log('VR button event listener added successfully');
    } else {
        console.error('VR button not found with ID vrBtn');
        
        // Try to find it by other selectors
        const vrBtnAlt = document.querySelector('[title="VR Mode"]');
        if (vrBtnAlt) {
            console.log('Found VR button by title selector');
            vrBtnAlt.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('VR button clicked via alternative selector!');
                toggleVR();
            });
        } else {
            console.error('VR button not found by any selector');
        }
    }
}

// Keyboard controls
function initKeyboardControls() {
    document.addEventListener('keydown', function(e) {
        switch(e.key.toLowerCase()) {
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'v':
                e.preventDefault();
                toggleVR();
                break;
            case 'r':
                e.preventDefault();
                toggleAutoRotate();
                break;
            case 'm':
                e.preventDefault();
                toggleMap();
                break;
            case 's':
                e.preventDefault();
                showShareModal();
                break;
            case 'escape':
                closeShareModal();
                break;
            case 'arrowleft':
                // Previous scene
                navigateScene(-1);
                break;
            case 'arrowright':
                // Next scene
                navigateScene(1);
                break;
            case '+':
            case '=':
                e.preventDefault();
                zoomIn();
                break;
            case '-':
            case '_':
                e.preventDefault();
                zoomOut();
                break;
            case '0':
                e.preventDefault();
                resetZoom();
                break;
        }
    });
}

// Navigate between scenes
function navigateScene(direction) {
    if (!currentTour || !currentScene) return;
    
    const currentIndex = currentTour.scenes.findIndex(s => s.id === currentScene.id);
    let newIndex = currentIndex + direction;
    
    if (newIndex < 0) newIndex = currentTour.scenes.length - 1;
    if (newIndex >= currentTour.scenes.length) newIndex = 0;
    
    loadScene(currentTour.scenes[newIndex].id);
}

// Show info tooltip
function showInfoTooltip(text) {
    showNotification(text, 'info');
}

// Utility functions
function showError(message) {
    document.getElementById('loadingOverlay').innerHTML = `
        <div class="text-center">
            <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h2 class="text-xl text-white mb-2">Error</h2>
            <p class="text-gray-300 mb-4">${message}</p>
            <button onclick="window.location.href='/'" class="bg-primary text-black px-4 py-2 rounded-lg">
                Go Back
            </button>
        </div>
    `;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'info' ? 'bg-blue-500' : 'bg-red-500';
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-white font-semibold ${bgColor}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Responsive handling
function handleResize() {
    if (viewer) {
        viewer.resize();
    }
}

window.addEventListener('resize', handleResize);

// Touch gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    if (!touchStartX || !touchStartY) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Horizontal swipe for scene navigation
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
            // Swipe left - next scene
            navigateScene(1);
        } else {
            // Swipe right - previous scene  
            navigateScene(-1);
        }
    }
    
    touchStartX = 0;
    touchStartY = 0;
});

// Klapty-inspired features

// QR Code Generation
function generateQRCode() {
    const currentURL = window.location.href;
    const shortURL = generateShortLink(currentURL);
    
    // Show QR modal
    document.getElementById('qrModal').classList.add('active');
    
    // Generate QR code using QR Server API
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const qrCodeImg = document.createElement('img');
    qrCodeImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentURL)}`;
    qrCodeImg.alt = 'QR Code for Tour';
    qrCodeImg.className = 'mx-auto';
    
    qrCodeContainer.innerHTML = '';
    qrCodeContainer.appendChild(qrCodeImg);
    
    // Set short link
    document.getElementById('shortLink').value = shortURL;
}

function closeQRModal() {
    document.getElementById('qrModal').classList.remove('active');
}

function generateShortLink(url) {
    // Simple short link generation (you can integrate with bit.ly or similar service)
    const tourId = new URLSearchParams(new URL(url).search).get('tour');
    return `${window.location.origin}/t/${tourId}`;
}

function copyShortLink() {
    const shortLink = document.getElementById('shortLink');
    shortLink.select();
    document.execCommand('copy');
    showNotification('Short link copied to clipboard!');
}

function downloadQRCode() {
    const qrImg = document.querySelector('#qrCodeContainer img');
    if (qrImg) {
        const link = document.createElement('a');
        link.download = `tour-${currentTour?.id || 'qr'}.png`;
        link.href = qrImg.src;
        link.click();
        showNotification('QR Code downloaded!');
    }
}

// Tour Information Modal
function showTourInfo() {
    document.getElementById('tourInfoModal').classList.add('active');
    populateTourInfo();
    loadComments();
}

function closeTourInfoModal() {
    document.getElementById('tourInfoModal').classList.remove('active');
}

function populateTourInfo() {
    if (!currentTour) return;
    
    const tourInfoContent = document.getElementById('tourInfoContent');
    tourInfoContent.innerHTML = `
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 class="font-semibold text-lg mb-2">${currentTour.title}</h4>
            <p class="text-gray-600 dark:text-gray-400 mb-3">${currentTour.description}</p>
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="font-medium">Scenes:</span> ${currentTour.scenes?.length || 0}
                </div>
                <div>
                    <span class="font-medium">Created:</span> ${new Date(currentTour.created).toLocaleDateString()}
                </div>
                <div>
                    <span class="font-medium">Views:</span> ${Math.floor(Math.random() * 1000 + 100)}
                </div>
                <div>
                    <span class="font-medium">Category:</span> ${currentTour.category || 'General'}
                </div>
            </div>
            
            <div class="mt-4 flex flex-wrap gap-2">
                <span class="px-2 py-1 bg-primary bg-opacity-20 text-primary text-xs rounded-full">360° VR</span>
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Interactive</span>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">HD Quality</span>
            </div>
        </div>
    `;
}

// Comments System
let tourComments = [];

function loadComments() {
    // Load comments from localStorage or API
    const storedComments = localStorage.getItem(`comments_${currentTour?.id}`);
    if (storedComments) {
        tourComments = JSON.parse(storedComments);
    }
    
    displayComments();
}

function displayComments() {
    const commentsList = document.getElementById('commentsList');
    
    if (tourComments.length === 0) {
        commentsList.innerHTML = '<p class="text-gray-500 text-center py-4">No comments yet. Be the first to share your thoughts!</p>';
        return;
    }
    
    commentsList.innerHTML = tourComments.map(comment => `
        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-primary bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                        <i class="fas fa-user text-primary text-sm"></i>
                    </div>
                    <span class="font-medium text-sm">${comment.author}</span>
                </div>
                <span class="text-xs text-gray-500">${new Date(comment.timestamp).toLocaleDateString()}</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300">${comment.text}</p>
        </div>
    `).join('');
}

function addComment() {
    const commentText = document.getElementById('newComment').value.trim();
    if (!commentText) return;
    
    const newComment = {
        id: Date.now(),
        text: commentText,
        author: 'Anonymous User', // You can implement user authentication
        timestamp: new Date().toISOString()
    };
    
    tourComments.unshift(newComment);
    
    // Save to localStorage
    localStorage.setItem(`comments_${currentTour?.id}`, JSON.stringify(tourComments));
    
    // Clear input and refresh display
    document.getElementById('newComment').value = '';
    displayComments();
    
    showNotification('Comment added successfully!');
}

// Enhanced Search and Filter Functions for Main Page
function initializeSearch() {
    const searchInput = document.getElementById('tourSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performSearch, 300));
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function performSearch() {
    const searchTerm = document.getElementById('tourSearch')?.value.toLowerCase() || '';
    const activeFilter = document.querySelector('.filter-btn.active')?.textContent.trim().toLowerCase() || 'all';
    
    // Filter tours based on search and category
    filterToursWithSearch(searchTerm, activeFilter);
}

function filterToursWithSearch(searchTerm, category) {
    // This would integrate with your existing tour loading logic
    console.log('Filtering tours:', { searchTerm, category });
    // Implementation would depend on how tours are loaded and displayed
}

// Initialize enhanced features when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});