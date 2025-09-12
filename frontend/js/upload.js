// Upload JavaScript for VR Tour Platform
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

// Global state
let currentStep = 1;
let tourData = {
    title: '',
    description: '',
    scenes: []
};
let uploadedFiles = [];
let currentEditingScene = null;
let darkMode = localStorage.getItem('darkMode') === 'true';

// Initialize upload page
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initEventListeners();
    initFileUpload();
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
    
    // Form validation
    document.getElementById('tourTitle').addEventListener('input', validateStep1);
}

// Initialize file upload functionality
function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    // Click to select files
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
        handleFiles(e.dataTransfer.files);
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });
}

// Handle selected files
function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (validateFile(file)) {
            const fileData = {
                id: generateId(),
                file: file,
                title: file.name.split('.')[0],
                preview: null,
                hotspots: []
            };
            
            // Generate preview
            generatePreview(file).then(preview => {
                fileData.preview = preview;
                updateFilePreview(fileData.id);
            });
            
            uploadedFiles.push(fileData);
            addFileToList(fileData);
        }
    });
}

// Validate file
function validateFile(file) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        showError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        return false;
    }
    
    if (file.size > maxSize) {
        showError('File size too large. Maximum 50MB allowed.');
        return false;
    }
    
    return true;
}

// Generate image preview
function generatePreview(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}

// Add file to list UI
function addFileToList(fileData) {
    const filesList = document.getElementById('filesList');
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-between';
    fileItem.id = `file-${fileData.id}`;
    
    fileItem.innerHTML = `
        <div class="flex items-center">
            <div class="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-lg mr-4 overflow-hidden">
                <div id="preview-${fileData.id}" class="w-full h-full flex items-center justify-center">
                    <i class="fas fa-image text-gray-400"></i>
                </div>
            </div>
            <div>
                <input type="text" value="${fileData.title}" 
                       onchange="updateFileTitle('${fileData.id}', this.value)"
                       class="font-semibold bg-transparent border-none outline-none text-gray-900 dark:text-white">
                <p class="text-sm text-gray-500 dark:text-gray-400">${formatFileSize(fileData.file.size)}</p>
            </div>
        </div>
        <div class="flex items-center space-x-2">
            <button onclick="removeFile('${fileData.id}')" 
                    class="text-red-500 hover:text-red-700 transition">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    filesList.appendChild(fileItem);
}

// Update file preview
function updateFilePreview(fileId) {
    const fileData = uploadedFiles.find(f => f.id === fileId);
    if (fileData && fileData.preview) {
        const previewEl = document.getElementById(`preview-${fileId}`);
        previewEl.innerHTML = `<img src="${fileData.preview}" alt="Preview" class="w-full h-full object-cover">`;
    }
}

// Update file title
function updateFileTitle(fileId, newTitle) {
    const fileData = uploadedFiles.find(f => f.id === fileId);
    if (fileData) {
        fileData.title = newTitle;
    }
}

// Remove file
function removeFile(fileId) {
    uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
    const fileElement = document.getElementById(`file-${fileId}`);
    if (fileElement) {
        fileElement.remove();
    }
}

// Step navigation
function nextStep() {
    if (currentStep === 1) {
        if (!validateStep1()) return;
        tourData.title = document.getElementById('tourTitle').value;
        tourData.description = document.getElementById('tourDescription').value;
    } else if (currentStep === 2) {
        if (uploadedFiles.length === 0) {
            showError('Please upload at least one panorama image.');
            return;
        }
    }
    
    currentStep++;
    updateStepIndicator();
    showStep(currentStep);
    
    if (currentStep === 3) {
        setupHotspotEditor();
    }
}

function prevStep() {
    currentStep--;
    updateStepIndicator();
    showStep(currentStep);
}

// Validate step 1
function validateStep1() {
    const title = document.getElementById('tourTitle').value.trim();
    if (!title) {
        showError('Tour title is required.');
        return false;
    }
    return true;
}

// Update step indicator
function updateStepIndicator() {
    for (let i = 1; i <= 3; i++) {
        const stepEl = document.getElementById(`step${i}`);
        if (i <= currentStep) {
            stepEl.className = 'step-circle bg-primary text-black w-10 h-10 rounded-full flex items-center justify-center font-bold';
        } else {
            stepEl.className = 'step-circle bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 w-10 h-10 rounded-full flex items-center justify-center font-bold';
        }
    }
}

// Show specific step
function showStep(step) {
    for (let i = 1; i <= 3; i++) {
        const content = document.getElementById(`step${i}Content`);
        content.classList.toggle('hidden', i !== step);
    }
}

// Setup hotspot editor
function setupHotspotEditor() {
    const sceneSelector = document.getElementById('sceneSelector');
    sceneSelector.innerHTML = '<option>Select a scene...</option>';
    
    uploadedFiles.forEach((file, index) => {
        const option = document.createElement('option');
        option.value = file.id;
        option.textContent = `${index + 1}. ${file.title}`;
        sceneSelector.appendChild(option);
    });
    
    sceneSelector.addEventListener('change', function() {
        if (this.value !== 'Select a scene...') {
            loadSceneForEditing(this.value);
        }
    });
}

// Load scene for hotspot editing
function loadSceneForEditing(fileId) {
    const fileData = uploadedFiles.find(f => f.id === fileId);
    if (!fileData) return;
    
    currentEditingScene = fileData;
    
    const preview = document.getElementById('scenePreview');
    const placeholder = document.getElementById('previewPlaceholder');
    
    preview.src = fileData.preview;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');
    
    updateHotspotsList();
    renderHotspots();
}

// Add hotspot
function addHotspot() {
    if (!currentEditingScene) {
        showError('Please select a scene first.');
        return;
    }
    
    const type = document.getElementById('hotspotType').value;
    const target = document.getElementById('hotspotTarget').value.trim();
    
    if (!target) {
        showError('Please enter hotspot text or target scene ID.');
        return;
    }
    
    const hotspot = {
        id: generateId(),
        type: type,
        text: target,
        sceneId: type === 'scene' ? target : null,
        pitch: Math.random() * 20 - 10, // Random position for demo
        yaw: Math.random() * 360 - 180
    };
    
    currentEditingScene.hotspots.push(hotspot);
    updateHotspotsList();
    renderHotspots();
    
    // Clear form
    document.getElementById('hotspotTarget').value = '';
}

// Update hotspots list
function updateHotspotsList() {
    if (!currentEditingScene) return;
    
    const list = document.getElementById('hotspotsList');
    list.innerHTML = currentEditingScene.hotspots.map((hotspot, index) => `
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center">
            <div>
                <span class="font-semibold">${hotspot.type === 'scene' ? 'Scene Link' : 'Info'}</span>
                <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">${hotspot.text}</span>
            </div>
            <button onclick="removeHotspot('${hotspot.id}')" 
                    class="text-red-500 hover:text-red-700 transition">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Remove hotspot
function removeHotspot(hotspotId) {
    if (!currentEditingScene) return;
    
    currentEditingScene.hotspots = currentEditingScene.hotspots.filter(h => h.id !== hotspotId);
    updateHotspotsList();
    renderHotspots();
}

// Render hotspots on preview
function renderHotspots() {
    if (!currentEditingScene) return;
    
    const overlay = document.getElementById('hotspotOverlay');
    overlay.innerHTML = '';
    
    currentEditingScene.hotspots.forEach(hotspot => {
        const hotspotEl = document.createElement('div');
        hotspotEl.className = 'hotspot-marker';
        hotspotEl.style.left = '50%'; // Simplified positioning for demo
        hotspotEl.style.top = '50%';
        hotspotEl.innerHTML = '<i class="fas fa-info text-black text-xs"></i>';
        hotspotEl.title = hotspot.text;
        
        overlay.appendChild(hotspotEl);
    });
}

// Create tour
async function createTour() {
    if (uploadedFiles.length === 0) {
        showError('Please upload at least one panorama.');
        return;
    }
    
    try {
        showLoading(true);
        
        // First create the tour
        const tourResponse = await fetch(`${API_BASE}/tours`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: tourData.title,
                description: tourData.description
            })
        });
        
        const tourResult = await tourResponse.json();
        if (!tourResult.success) {
            throw new Error(tourResult.error);
        }
        
        const tourId = tourResult.tour.id;
        
        // Upload each scene
        for (let i = 0; i < uploadedFiles.length; i++) {
            const fileData = uploadedFiles[i];
            const formData = new FormData();
            formData.append('panorama', fileData.file);
            formData.append('title', fileData.title);
            formData.append('hotspots', JSON.stringify(fileData.hotspots));
            
            const uploadResponse = await fetch(`${API_BASE}/tours/${tourId}/upload`, {
                method: 'POST',
                body: formData
            });
            
            const uploadResult = await uploadResponse.json();
            if (!uploadResult.success) {
                throw new Error(`Failed to upload ${fileData.title}: ${uploadResult.error}`);
            }
        }
        
        showSuccess(tourId);
        
    } catch (error) {
        console.error('Error creating tour:', error);
        showError('Failed to create tour: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// Utility functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    document.getElementById('errorText').textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => errorEl.classList.add('hidden'), 5000);
}

function showSuccess(tourId) {
    const successEl = document.getElementById('successMessage');
    const viewLink = document.getElementById('viewTourLink');
    viewLink.href = `viewer.html?tour=${tourId}`;
    viewLink.textContent = 'View Your Tour';
    successEl.classList.remove('hidden');
    
    // Hide all step content
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`step${i}Content`).classList.add('hidden');
    }
}

function showLoading(show) {
    // Implementation depends on your loading UI preference
    if (show) {
        document.body.style.cursor = 'wait';
    } else {
        document.body.style.cursor = 'default';
    }
}