// Convert.js - Photo to 360° Panorama Conversion
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

// Global state
let selectedFile = null;
let selectedMethod = 'perspective';
let conversionMethods = [];
let convertedPanorama = null;
let darkMode = localStorage.getItem('darkMode') === 'true';

// Zoom state for different images
let previewZoom = 1;
let originalResultZoom = 1;
let panoramaResultZoom = 1;
const minZoom = 0.5;
const maxZoom = 5;
const zoomStep = 0.25;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initEventListeners();
    loadConversionMethods();
    initImageZoom();
});

// Dark mode functionality
function initDarkMode() {
    if (darkMode) {
        document.documentElement.classList.add('dark');
        updateDarkModeIcon();
    }
}

function toggleDarkMode() {
    darkMode = !darkMode;
    localStorage.setItem('darkMode', darkMode);
    document.documentElement.classList.toggle('dark');
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    const icon = document.querySelector('#darkModeToggle i');
    icon.className = darkMode ? 'fas fa-sun text-xl' : 'fas fa-moon text-xl';
}

// Initialize event listeners
function initEventListeners() {
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // File upload
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    dropZone.addEventListener('click', () => fileInput.click());
    
    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files[0]);
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'd' && e.ctrlKey) {
            e.preventDefault();
            toggleDarkMode();
        }
    });
}

// Load available conversion methods
async function loadConversionMethods() {
    try {
        const response = await fetch(`${API_BASE}/conversion/methods`);
        const data = await response.json();
        
        if (data.success) {
            conversionMethods = data.methods;
            renderConversionMethods();
        }
    } catch (error) {
        console.error('Failed to load conversion methods:', error);
        showError('Failed to load conversion methods');
    }
}

// Handle file selection
async function handleFileSelect(file) {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        showError('Please select a valid image file (JPG, PNG, or WebP)');
        return;
    }
    
    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
        showError('File size too large. Maximum 50MB allowed.');
        return;
    }
    
    selectedFile = file;
    await previewPhoto(file);
    await analyzePhoto(file);
}

// Preview selected photo
async function previewPhoto(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('photoPreview');
        const img = document.getElementById('originalPhoto');
        
        img.src = e.target.result;
        preview.classList.remove('hidden');
        
        // Show conversion section
        document.getElementById('conversionSection').classList.remove('hidden');
        document.getElementById('panoramaTitle').value = file.name.split('.')[0] + ' - 360° Panorama';
    };
    reader.readAsDataURL(file);
}

// Analyze photo and show details
async function analyzePhoto(file) {
    try {
        const formData = new FormData();
        formData.append('photo', file);
        
        const response = await fetch(`${API_BASE}/conversion/validate`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayPhotoInfo(data.validation, data.recommendations);
            updateMethodRecommendations(data.recommendations);
        }
    } catch (error) {
        console.error('Photo analysis failed:', error);
    }
}

// Display photo information
function displayPhotoInfo(validation, recommendations) {
    const infoContainer = document.getElementById('photoInfo');
    const metadata = validation.metadata;
    
    if (!metadata) return;
    
    infoContainer.innerHTML = `
        <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Resolution</span>
            <p class="text-gray-600 dark:text-gray-400">${metadata.width} × ${metadata.height}</p>
        </div>
        <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Format</span>
            <p class="text-gray-600 dark:text-gray-400">${metadata.format.toUpperCase()}</p>
        </div>
        <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">File Size</span>
            <p class="text-gray-600 dark:text-gray-400">${formatFileSize(metadata.size)}</p>
        </div>
        <div>
            <span class="font-medium text-gray-700 dark:text-gray-300">Quality Score</span>
            <p class="text-gray-600 dark:text-gray-400">${getQualityScore(metadata)}</p>
        </div>
    `;
    
    // Show issues if any
    if (validation.issues.length > 0) {
        const issuesHtml = validation.issues.map(issue => 
            `<p class="text-sm text-yellow-600 dark:text-yellow-400"><i class="fas fa-exclamation-triangle mr-1"></i>${issue}</p>`
        ).join('');
        
        infoContainer.innerHTML += `
            <div class="col-span-4 mt-3 p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
                <h5 class="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Potential Issues:</h5>
                ${issuesHtml}
            </div>
        `;
    }
}

// Render conversion methods
function renderConversionMethods() {
    const grid = document.getElementById('methodsGrid');
    
    grid.innerHTML = conversionMethods.map(method => `
        <div class="method-card bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 ${method.recommended ? 'border-primary' : ''}" 
             onclick="selectMethod('${method.id}')" 
             data-method="${method.id}">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">${method.name}</h4>
                <div class="flex items-center">
                    ${method.recommended ? '<span class="bg-primary text-black text-xs px-2 py-1 rounded-full">Recommended</span>' : ''}
                    ${method.premium ? '<span class="bg-purple-500 text-white text-xs px-2 py-1 rounded-full ml-1">Premium</span>' : ''}
                </div>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${method.description}</p>
            
            <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Quality:</span>
                    <span class="text-gray-600 dark:text-gray-400">${method.quality}</span>
                </div>
                <div>
                    <span class="font-medium text-gray-700 dark:text-gray-300">Speed:</span>
                    <span class="text-gray-600 dark:text-gray-400">${method.speed}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Select recommended method by default
    const recommended = conversionMethods.find(m => m.recommended);
    if (recommended) {
        selectMethod(recommended.id);
    }
}

// Select conversion method
function selectMethod(methodId) {
    selectedMethod = methodId;
    
    // Update visual selection
    document.querySelectorAll('.method-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.method === methodId) {
            card.classList.add('selected');
        }
    });
}

// Update method recommendations based on photo analysis
function updateMethodRecommendations(recommendations) {
    recommendations.forEach(rec => {
        const methodCard = document.querySelector(`[data-method="${rec.method}"]`);
        if (methodCard && !methodCard.querySelector('.recommendation-badge')) {
            const badge = document.createElement('span');
            badge.className = 'recommendation-badge bg-blue-500 text-white text-xs px-2 py-1 rounded-full ml-1';
            badge.textContent = 'Suggested';
            badge.title = rec.reason;
            
            const header = methodCard.querySelector('.flex.items-center.justify-between div');
            header.appendChild(badge);
        }
    });
}

// Convert photo to panorama
async function convertPhoto() {
    if (!selectedFile) {
        showError('Please select a photo first');
        return;
    }
    
    const title = document.getElementById('panoramaTitle').value.trim();
    if (!title) {
        showError('Please enter a title for your panorama');
        return;
    }
    
    try {
        // Show progress section
        showConversionProgress();
        
        const formData = new FormData();
        formData.append('photo', selectedFile);
        formData.append('method', selectedMethod);
        formData.append('title', title);
        
        // Simulate progress updates
        updateProgress(20, 'Uploading photo...');
        
        const response = await fetch(`${API_BASE}/conversion/convert`, {
            method: 'POST',
            body: formData
        });
        
        updateProgress(60, 'Converting to 360°...');
        
        const data = await response.json();
        
        if (data.success) {
            updateProgress(100, 'Conversion complete!');
            
            setTimeout(() => {
                showConversionResult(data);
            }, 1000);
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('Conversion failed:', error);
        hideConversionProgress();
        showError('Conversion failed: ' + error.message);
    }
}

// Show conversion progress
function showConversionProgress() {
    document.getElementById('conversionSection').classList.add('hidden');
    document.getElementById('progressSection').classList.remove('hidden');
    updateProgress(10, 'Starting conversion...');
}

// Hide conversion progress
function hideConversionProgress() {
    document.getElementById('progressSection').classList.add('hidden');
    document.getElementById('conversionSection').classList.remove('hidden');
}

// Update progress
function updateProgress(percent, message) {
    document.getElementById('progressBar').style.width = percent + '%';
    document.getElementById('progressPercent').textContent = percent + '%';
    document.getElementById('progressText').textContent = message;
}

// Show conversion result
function showConversionResult(data) {
    convertedPanorama = data.panorama;
    
    // Hide progress, show result
    document.getElementById('progressSection').classList.add('hidden');
    document.getElementById('resultSection').classList.remove('hidden');
    
    // Set images
    const originalImg = document.getElementById('originalResult');
    const panoramaImg = document.getElementById('panoramaResult');
    
    originalImg.src = URL.createObjectURL(selectedFile);
    panoramaImg.src = data.panorama.image;
    
    // Show conversion details
    const method = conversionMethods.find(m => m.id === data.panorama.method);
    document.getElementById('conversionDetails').textContent = 
        `Converted using ${method?.name || data.panorama.method} method. ` +
        `Original: ${data.panorama.originalValidation.metadata.width}×${data.panorama.originalValidation.metadata.height}, ` +
        `Panorama: ${data.conversion.dimensions.width}×${data.conversion.dimensions.height}`;
}

// Preview panorama in VR viewer
function previewPanorama() {
    if (!convertedPanorama) return;
    
    // Create temporary tour data for preview
    const previewData = {
        id: 'preview-' + Date.now(),
        title: convertedPanorama.title,
        scenes: [{
            id: 'preview-scene',
            title: convertedPanorama.title,
            image: convertedPanorama.image,
            preview: convertedPanorama.thumbnail,
            hotspots: []
        }]
    };
    
    // Store in sessionStorage for preview
    sessionStorage.setItem('previewTour', JSON.stringify(previewData));
    
    // Open in new tab
    window.open(`/viewer.html?tour=preview&preview=true`, '_blank');
}

// Download converted panorama
function downloadPanorama() {
    if (!convertedPanorama) return;
    
    const link = document.createElement('a');
    link.href = convertedPanorama.image;
    link.download = convertedPanorama.title + '.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add panorama to existing tour
async function addToTour() {
    if (!convertedPanorama) return;
    
    try {
        // Get available tours
        const response = await fetch(`${API_BASE}/tours`);
        const data = await response.json();
        
        if (data.success && data.tours.length > 0) {
            // Show tour selection modal
            showTourSelectionModal(data.tours);
        } else {
            // Create new tour
            const tourTitle = prompt('Enter tour title:');
            if (tourTitle) {
                await createNewTourWithPanorama(tourTitle);
            }
        }
    } catch (error) {
        console.error('Failed to add to tour:', error);
        showError('Failed to add to tour');
    }
}

// Create new tour with panorama
async function createNewTourWithPanorama(tourTitle) {
    try {
        // Create tour
        const tourResponse = await fetch(`${API_BASE}/tours`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: tourTitle,
                description: 'Tour created with converted panorama'
            })
        });
        
        const tourData = await tourResponse.json();
        
        if (tourData.success) {
            showSuccess(`Panorama added to new tour "${tourTitle}"`);
            // Optionally redirect to tour viewer
            setTimeout(() => {
                window.location.href = `/viewer.html?tour=${tourData.tour.id}`;
            }, 2000);
        }
    } catch (error) {
        console.error('Failed to create tour:', error);
        showError('Failed to create new tour');
    }
}

// Convert another photo
function convertAnother() {
    // Reset state
    selectedFile = null;
    selectedMethod = 'perspective';
    convertedPanorama = null;
    
    // Hide all sections except upload
    document.getElementById('photoPreview').classList.add('hidden');
    document.getElementById('conversionSection').classList.add('hidden');
    document.getElementById('progressSection').classList.add('hidden');
    document.getElementById('resultSection').classList.add('hidden');
    
    // Reset form
    document.getElementById('fileInput').value = '';
    document.getElementById('panoramaTitle').value = '';
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getQualityScore(metadata) {
    const pixels = metadata.width * metadata.height;
    if (pixels >= 8000000) return 'Excellent'; // 8MP+
    if (pixels >= 4000000) return 'Very Good'; // 4MP+
    if (pixels >= 2000000) return 'Good';      // 2MP+
    if (pixels >= 1000000) return 'Fair';      // 1MP+
    return 'Low';
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-white font-semibold bg-red-500 animate-pulse';
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
    }, 5000);
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 z-50 px-4 py-2 rounded-lg text-white font-semibold bg-green-500';
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

// Initialize image zoom functionality
function initImageZoom() {
    // Add click-to-zoom for all zoomable images
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('zoomable-image')) {
            toggleImageZoom(e.target);
        }
    });
    
    // Add mouse wheel zoom
    document.addEventListener('wheel', function(e) {
        if (e.target.classList.contains('zoomable-image')) {
            e.preventDefault();
            
            const img = e.target;
            let currentZoom = getCurrentZoom(img.id);
            
            if (e.deltaY < 0) {
                // Zoom in
                currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
            } else {
                // Zoom out  
                currentZoom = Math.max(minZoom, currentZoom - zoomStep);
            }
            
            setImageZoom(img, currentZoom);
        }
    }, { passive: false });
    
    // Initialize pan functionality
    initImagePan();
}

// Toggle zoom on image click
function toggleImageZoom(img) {
    const currentZoom = getCurrentZoom(img.id);
    
    if (currentZoom === 1) {
        setImageZoom(img, 2); // Zoom to 2x on click
    } else {
        setImageZoom(img, 1); // Reset zoom
    }
}

// Get current zoom level for specific image
function getCurrentZoom(imageId) {
    switch (imageId) {
        case 'originalPhoto':
            return previewZoom;
        case 'originalResult':
            return originalResultZoom;
        case 'panoramaResult':
            return panoramaResultZoom;
        default:
            return 1;
    }
}

// Set zoom level for specific image
function setImageZoom(img, zoom) {
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    
    // Update state
    switch (img.id) {
        case 'originalPhoto':
            previewZoom = zoom;
            break;
        case 'originalResult':
            originalResultZoom = zoom;
            break;
        case 'panoramaResult':
            panoramaResultZoom = zoom;
            break;
    }
    
    // Apply zoom
    img.style.transform = `scale(${zoom})`;
    
    // Update cursor
    if (zoom === 1) {
        img.classList.remove('zoomed');
        img.classList.add('zoomable-image');
    } else {
        img.classList.add('zoomed');
    }
    
    // Update parent container overflow
    const container = img.closest('.image-zoom-container');
    if (container) {
        if (zoom > 1) {
            container.style.overflow = 'auto';
            container.style.cursor = 'grab';
        } else {
            container.style.overflow = 'hidden';
            container.style.cursor = 'default';
        }
    }
}

// Preview image zoom controls
function zoomPreviewIn() {
    const img = document.getElementById('originalPhoto');
    const newZoom = Math.min(maxZoom, previewZoom + zoomStep);
    setImageZoom(img, newZoom);
}

function zoomPreviewOut() {
    const img = document.getElementById('originalPhoto');
    const newZoom = Math.max(minZoom, previewZoom - zoomStep);
    setImageZoom(img, newZoom);
}

function resetPreviewZoom() {
    const img = document.getElementById('originalPhoto');
    setImageZoom(img, 1);
}

// Original result zoom controls
function zoomResultOriginalIn() {
    const img = document.getElementById('originalResult');
    const newZoom = Math.min(maxZoom, originalResultZoom + zoomStep);
    setImageZoom(img, newZoom);
}

function zoomResultOriginalOut() {
    const img = document.getElementById('originalResult');
    const newZoom = Math.max(minZoom, originalResultZoom - zoomStep);
    setImageZoom(img, newZoom);
}

function resetResultOriginalZoom() {
    const img = document.getElementById('originalResult');
    setImageZoom(img, 1);
}

// Panorama result zoom controls
function zoomResultPanoramaIn() {
    const img = document.getElementById('panoramaResult');
    const newZoom = Math.min(maxZoom, panoramaResultZoom + zoomStep);
    setImageZoom(img, newZoom);
}

function zoomResultPanoramaOut() {
    const img = document.getElementById('panoramaResult');
    const newZoom = Math.max(minZoom, panoramaResultZoom - zoomStep);
    setImageZoom(img, newZoom);
}

function resetResultPanoramaZoom() {
    const img = document.getElementById('panoramaResult');
    setImageZoom(img, 1);
}

// Enable pan functionality for zoomed images
function initImagePan() {
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    let activeContainer = null;
    
    document.addEventListener('mousedown', function(e) {
        const container = e.target.closest('.image-zoom-container');
        const img = container ? container.querySelector('img') : null;
        
        if (container && img && getCurrentZoom(img.id) > 1) {
            isDragging = true;
            activeContainer = container;
            container.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            startY = e.pageY - container.offsetTop;
            scrollLeft = container.scrollLeft;
            scrollTop = container.scrollTop;
            e.preventDefault();
        }
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging || !activeContainer) return;
        e.preventDefault();
        
        const x = e.pageX - activeContainer.offsetLeft;
        const y = e.pageY - activeContainer.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        activeContainer.scrollLeft = scrollLeft - walkX;
        activeContainer.scrollTop = scrollTop - walkY;
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging && activeContainer) {
            isDragging = false;
            activeContainer.style.cursor = 'grab';
            activeContainer = null;
        }
    });
}

