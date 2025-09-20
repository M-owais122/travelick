// Enhanced Hotspot Editor for Tour Creation

class HotspotEditor {
    constructor() {
        this.currentScene = null;
        this.hotspots = [];
        this.isPlacementMode = false;
        this.selectedHotspotType = 'scene';
        this.previewContainer = null;
        this.hotspotOverlay = null;
        this.init();
    }

    init() {
        this.previewContainer = document.getElementById('scenePreview');
        this.hotspotOverlay = document.getElementById('hotspotOverlay');
        this.setupEventListeners();
        console.log('Enhanced Hotspot Editor initialized');
    }

    setupEventListeners() {
        // Click to place hotspots
        if (this.hotspotOverlay) {
            this.hotspotOverlay.addEventListener('click', (e) => {
                if (this.isPlacementMode) {
                    this.placeHotspot(e);
                }
            });
        }

        // Update hotspot type selector
        const hotspotTypeSelect = document.getElementById('hotspotType');
        if (hotspotTypeSelect) {
            // Clear existing options and add enhanced types
            hotspotTypeSelect.innerHTML = `
                <option value="scene">🟢 Scene Navigation</option>
                <option value="info">🔵 Information Point</option>
                <option value="media">🟠 Media Gallery</option>
                <option value="interactive">🟣 Interactive Element</option>
                <option value="video">🎥 Video Content</option>
                <option value="audio">🔊 Audio Content</option>
            `;

            hotspotTypeSelect.addEventListener('change', (e) => {
                this.selectedHotspotType = e.target.value;
                this.updateHotspotForm();
            });
        }
    }

    loadScene(sceneData) {
        this.currentScene = sceneData;
        this.hotspots = sceneData.hotspots || [];
        this.renderHotspots();
        this.updateHotspotsList();
    }

    enablePlacementMode() {
        this.isPlacementMode = true;
        this.hotspotOverlay.style.cursor = 'crosshair';

        // Update button to show placement mode
        const addButton = document.querySelector('[onclick="addHotspot()"]');
        if (addButton) {
            addButton.innerHTML = '<i class="fas fa-times mr-2"></i>Cancel Placement';
            addButton.onclick = () => this.disablePlacementMode();
            addButton.className = 'mt-3 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition';
        }

        // Show instructions
        this.showPlacementInstructions();
    }

    disablePlacementMode() {
        this.isPlacementMode = false;
        this.hotspotOverlay.style.cursor = 'default';

        // Reset button
        const addButton = document.querySelector('[onclick*="disablePlacementMode"]');
        if (addButton) {
            addButton.innerHTML = '<i class="fas fa-plus mr-2"></i>Add Hotspot';
            addButton.onclick = () => this.enablePlacementMode();
            addButton.className = 'mt-3 bg-primary text-gray-900 px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition';
        }

        this.hidePlacementInstructions();
    }

    placeHotspot(event) {
        const rect = this.hotspotOverlay.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert pixel coordinates to panorama coordinates
        const coords = this.pixelToPanoramaCoords(x, y, rect.width, rect.height);

        // Show hotspot configuration modal
        this.showHotspotConfigModal(coords);
    }

    pixelToPanoramaCoords(x, y, width, height) {
        // Convert pixel position to panorama yaw/pitch coordinates
        const yaw = ((x / width) * 360) - 180; // -180 to 180
        const pitch = ((y / height) * 180) - 90; // -90 to 90

        return { yaw, pitch };
    }

    panoramaToPixelCoords(yaw, pitch, width, height) {
        // Convert panorama coordinates to pixel position
        const x = ((yaw + 180) / 360) * width;
        const y = ((pitch + 90) / 180) * height;

        return { x, y };
    }

    showHotspotConfigModal(coords) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Configure Hotspot</h3>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                        <select id="modalHotspotType" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                            <option value="scene">🟢 Scene Navigation</option>
                            <option value="info">🔵 Information Point</option>
                            <option value="media">🟠 Media Gallery</option>
                            <option value="interactive">🟣 Interactive Element</option>
                            <option value="video">🎥 Video Content</option>
                            <option value="audio">🔊 Audio Content</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                        <input type="text" id="modalHotspotTitle" placeholder="Hotspot title"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description/Text</label>
                        <textarea id="modalHotspotText" rows="3" placeholder="Hotspot description or navigation text"
                                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"></textarea>
                    </div>

                    <div id="modalSceneSelector" style="display: none;">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Scene</label>
                        <select id="modalTargetScene" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                            <option value="">Select target scene...</option>
                        </select>
                    </div>

                    <div id="modalMediaGallery" style="display: none;">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gallery Images (URLs, one per line)</label>
                        <textarea id="modalGalleryUrls" rows="3" placeholder="https://example.com/image1.jpg"
                                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"></textarea>
                    </div>

                    <div id="modalVideoUrl" style="display: none;">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Video URL</label>
                        <input type="url" id="modalVideo" placeholder="https://example.com/video.mp4"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    </div>

                    <div id="modalAudioUrl" style="display: none;">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio URL</label>
                        <input type="url" id="modalAudio" placeholder="https://example.com/audio.mp3"
                               class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Yaw (°)</label>
                            <input type="number" id="modalYaw" value="${coords.yaw.toFixed(1)}" step="0.1" min="-180" max="180"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pitch (°)</label>
                            <input type="number" id="modalPitch" value="${coords.pitch.toFixed(1)}" step="0.1" min="-90" max="90"
                                   class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 mt-6">
                    <button onclick="this.closest('.fixed').remove()"
                            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                        Cancel
                    </button>
                    <button onclick="hotspotEditor.createHotspotFromModal(this)"
                            class="px-4 py-2 bg-primary text-gray-900 rounded-lg hover:bg-opacity-90">
                        Create Hotspot
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup modal event listeners
        const typeSelect = modal.querySelector('#modalHotspotType');
        typeSelect.addEventListener('change', () => this.updateModalFields(modal));
        typeSelect.value = this.selectedHotspotType;
        this.updateModalFields(modal);
        this.populateSceneSelector(modal);
    }

    updateModalFields(modal) {
        const type = modal.querySelector('#modalHotspotType').value;

        // Hide all optional fields
        modal.querySelector('#modalSceneSelector').style.display = 'none';
        modal.querySelector('#modalMediaGallery').style.display = 'none';
        modal.querySelector('#modalVideoUrl').style.display = 'none';
        modal.querySelector('#modalAudioUrl').style.display = 'none';

        // Show relevant fields based on type
        switch (type) {
            case 'scene':
                modal.querySelector('#modalSceneSelector').style.display = 'block';
                break;
            case 'media':
                modal.querySelector('#modalMediaGallery').style.display = 'block';
                break;
            case 'video':
                modal.querySelector('#modalVideoUrl').style.display = 'block';
                break;
            case 'audio':
                modal.querySelector('#modalAudioUrl').style.display = 'block';
                break;
        }
    }

    populateSceneSelector(modal) {
        const selector = modal.querySelector('#modalTargetScene');

        // Clear existing options
        selector.innerHTML = '<option value="">Select target scene...</option>';

        // Add all uploaded scenes
        if (typeof uploadedFiles !== 'undefined' && uploadedFiles.length > 0) {
            uploadedFiles.forEach((file, index) => {
                // Skip current scene to avoid self-navigation
                if (this.currentScene && file.id === this.currentScene.id) return;

                const option = document.createElement('option');
                option.value = `scene-${index + 1}`;
                // Use more user-friendly names
                const sceneName = file.title.replace(/DJI_\d+_\d+_/, '').replace(/\.\w+$/, '');
                option.textContent = `Scene ${index + 1}: ${sceneName}`;
                selector.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No other scenes available";
            option.disabled = true;
            selector.appendChild(option);
        }
    }

    createHotspotFromModal(button) {
        const modal = button.closest('.fixed');

        const type = modal.querySelector('#modalHotspotType').value;
        const title = modal.querySelector('#modalHotspotTitle').value.trim();
        const text = modal.querySelector('#modalHotspotText').value.trim();
        const yaw = parseFloat(modal.querySelector('#modalYaw').value);
        const pitch = parseFloat(modal.querySelector('#modalPitch').value);

        if (!title || !text) {
            alert('Please fill in both title and description/text fields.');
            return;
        }

        const hotspot = {
            id: this.generateId(),
            category: type,
            type: type,
            title: title,
            text: text,
            description: text,
            yaw: yaw,
            pitch: pitch,
            translations: {
                en: { title, text, description: text }
            }
        };

        // Add type-specific properties
        switch (type) {
            case 'scene':
                const targetScene = modal.querySelector('#modalTargetScene').value;
                if (!targetScene) {
                    alert('Please select a target scene for navigation.');
                    return;
                }
                hotspot.sceneId = targetScene;
                break;

            case 'media':
                const galleryUrls = modal.querySelector('#modalGalleryUrls').value.trim();
                if (galleryUrls) {
                    hotspot.gallery = galleryUrls.split('\n').filter(url => url.trim()).map(url => ({
                        url: url.trim(),
                        caption: `Gallery Image`
                    }));
                }
                break;

            case 'video':
                const videoUrl = modal.querySelector('#modalVideo').value.trim();
                if (videoUrl) {
                    hotspot.video = videoUrl;
                }
                break;

            case 'audio':
                const audioUrl = modal.querySelector('#modalAudio').value.trim();
                if (audioUrl) {
                    hotspot.audioUrl = audioUrl;
                }
                break;

            case 'interactive':
                hotspot.interactionType = 'custom';
                break;
        }

        this.addHotspot(hotspot);
        modal.remove();
        this.disablePlacementMode();
    }

    addHotspot(hotspot) {
        if (!this.currentScene) return;

        this.hotspots.push(hotspot);
        this.currentScene.hotspots = this.hotspots;

        this.renderHotspots();
        this.updateHotspotsList();

        console.log('Hotspot added:', hotspot);

        // Call callback if provided
        if (this.onHotspotAdd && typeof this.onHotspotAdd === 'function') {
            this.onHotspotAdd(hotspot);
        }
    }

    removeHotspot(hotspotId) {
        this.hotspots = this.hotspots.filter(h => h.id !== hotspotId);
        if (this.currentScene) {
            this.currentScene.hotspots = this.hotspots;
        }

        this.renderHotspots();
        this.updateHotspotsList();

        // Call callback if provided
        if (this.onHotspotRemove && typeof this.onHotspotRemove === 'function') {
            this.onHotspotRemove(hotspotId);
        }
    }

    renderHotspots() {
        if (!this.hotspotOverlay || !this.previewContainer) return;

        // Clear existing hotspots
        this.hotspotOverlay.querySelectorAll('.hotspot-marker').forEach(el => el.remove());

        const rect = this.hotspotOverlay.getBoundingClientRect();

        this.hotspots.forEach(hotspot => {
            const coords = this.panoramaToPixelCoords(hotspot.yaw, hotspot.pitch, rect.width, rect.height);

            const hotspotEl = document.createElement('div');
            hotspotEl.className = 'hotspot-marker absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2';
            hotspotEl.style.left = coords.x + 'px';
            hotspotEl.style.top = coords.y + 'px';

            // Set hotspot appearance based on type
            const typeStyles = {
                'scene': { bg: '#39FF14', icon: 'fa-arrow-right', size: '40px' },
                'info': { bg: '#00bfff', icon: 'fa-info', size: '35px' },
                'media': { bg: '#ffa500', icon: 'fa-images', size: '35px' },
                'interactive': { bg: '#ff1493', icon: 'fa-cube', size: '35px' },
                'video': { bg: '#ff6600', icon: 'fa-play', size: '35px' },
                'audio': { bg: '#9932cc', icon: 'fa-volume-up', size: '35px' }
            };

            const style = typeStyles[hotspot.category] || typeStyles['info'];

            hotspotEl.innerHTML = `
                <div style="
                    width: ${style.size};
                    height: ${style.size};
                    background: radial-gradient(circle, ${style.bg}dd 0%, ${style.bg}88 100%);
                    border: 2px solid ${style.bg};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 20px ${style.bg}99;
                    animation: pulse 2s infinite;
                    cursor: pointer;
                ">
                    <i class="fas ${style.icon}" style="color: white; font-size: 14px; text-shadow: 0 0 10px rgba(255,255,255,0.8);"></i>
                </div>
            `;

            hotspotEl.title = hotspot.title;
            hotspotEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.editHotspot(hotspot);
            });

            this.hotspotOverlay.appendChild(hotspotEl);
        });
    }

    editHotspot(hotspot) {
        // Show edit modal with pre-filled data
        const coords = { yaw: hotspot.yaw, pitch: hotspot.pitch };
        this.showHotspotConfigModal(coords);

        // Pre-fill the modal with existing data
        setTimeout(() => {
            const modal = document.querySelector('.fixed');
            if (modal) {
                modal.querySelector('#modalHotspotType').value = hotspot.category || 'info';
                modal.querySelector('#modalHotspotTitle').value = hotspot.title || '';
                modal.querySelector('#modalHotspotText').value = hotspot.text || '';
                modal.querySelector('#modalYaw').value = hotspot.yaw;
                modal.querySelector('#modalPitch').value = hotspot.pitch;

                if (hotspot.sceneId) {
                    modal.querySelector('#modalTargetScene').value = hotspot.sceneId;
                }

                if (hotspot.gallery) {
                    const urls = hotspot.gallery.map(img => img.url).join('\n');
                    modal.querySelector('#modalGalleryUrls').value = urls;
                }

                if (hotspot.video) {
                    modal.querySelector('#modalVideo').value = hotspot.video;
                }

                if (hotspot.audioUrl) {
                    modal.querySelector('#modalAudio').value = hotspot.audioUrl;
                }

                this.updateModalFields(modal);

                // Change button to update instead of create
                const button = modal.querySelector('button[onclick*="createHotspotFromModal"]');
                button.textContent = 'Update Hotspot';
                button.onclick = () => {
                    this.removeHotspot(hotspot.id);
                    this.createHotspotFromModal(button);
                };
            }
        }, 100);
    }

    updateHotspotsList() {
        const list = document.getElementById('hotspotsList');
        if (!list) return;

        list.innerHTML = this.hotspots.map((hotspot, index) => `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                <div class="flex items-center">
                    <div class="w-8 h-8 rounded-full mr-3 flex items-center justify-center" style="background: ${this.getHotspotColor(hotspot.category)};">
                        <i class="fas ${this.getHotspotIcon(hotspot.category)} text-white text-xs"></i>
                    </div>
                    <div>
                        <span class="font-semibold text-gray-900 dark:text-white">${hotspot.title}</span>
                        <div class="text-sm text-gray-600 dark:text-gray-400">
                            ${this.getHotspotTypeLabel(hotspot.category)} • ${hotspot.yaw.toFixed(1)}°, ${hotspot.pitch.toFixed(1)}°
                        </div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="hotspotEditor.editHotspot(${JSON.stringify(hotspot).replace(/"/g, '&quot;')})"
                            class="text-blue-500 hover:text-blue-700 transition">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="hotspotEditor.removeHotspot('${hotspot.id}')"
                            class="text-red-500 hover:text-red-700 transition">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    getHotspotColor(category) {
        const colors = {
            'scene': '#39FF14',
            'info': '#00bfff',
            'media': '#ffa500',
            'interactive': '#ff1493',
            'video': '#ff6600',
            'audio': '#9932cc'
        };
        return colors[category] || colors['info'];
    }

    getHotspotIcon(category) {
        const icons = {
            'scene': 'fa-arrow-right',
            'info': 'fa-info',
            'media': 'fa-images',
            'interactive': 'fa-cube',
            'video': 'fa-play',
            'audio': 'fa-volume-up'
        };
        return icons[category] || icons['info'];
    }

    getHotspotTypeLabel(category) {
        const labels = {
            'scene': '🟢 Scene Navigation',
            'info': '🔵 Information',
            'media': '🟠 Media Gallery',
            'interactive': '🟣 Interactive',
            'video': '🎥 Video',
            'audio': '🔊 Audio'
        };
        return labels[category] || labels['info'];
    }

    showPlacementInstructions() {
        const instructions = document.createElement('div');
        instructions.id = 'placementInstructions';
        instructions.className = 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg p-3 mb-4';
        instructions.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                <span class="text-blue-700 dark:text-blue-300 text-sm">
                    Click anywhere on the panorama preview to place a hotspot at that location.
                </span>
            </div>
        `;

        const hotspotControls = document.querySelector('#step3Content .bg-gray-50');
        if (hotspotControls) {
            hotspotControls.parentNode.insertBefore(instructions, hotspotControls);
        }
    }

    hidePlacementInstructions() {
        const instructions = document.getElementById('placementInstructions');
        if (instructions) {
            instructions.remove();
        }
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Methods expected by upload.js
    initialize(options) {
        console.log('HotspotEditor.initialize() called with options:', options);

        if (options.imageElement) {
            this.previewContainer = options.imageElement;
        }
        if (options.overlayElement) {
            this.hotspotOverlay = options.overlayElement;
        }
        if (options.onHotspotAdd) {
            this.onHotspotAdd = options.onHotspotAdd;
        }
        if (options.onHotspotRemove) {
            this.onHotspotRemove = options.onHotspotRemove;
        }

        this.setupEventListeners();
        console.log('HotspotEditor initialized with options');
    }

    showCreateModal(options = {}) {
        console.log('HotspotEditor.showCreateModal() called with options:', options);

        // Set default values from options
        this.selectedHotspotType = options.category || this.selectedHotspotType;

        // Show the configuration modal
        const coords = { yaw: 0, pitch: 0 }; // Default position
        this.showHotspotConfigModal(coords);

        // Pre-fill modal with provided options
        setTimeout(() => {
            const modal = document.querySelector('.fixed.inset-0');
            if (modal) {
                const typeSelect = modal.querySelector('#modalHotspotType');
                const titleInput = modal.querySelector('#modalHotspotTitle');
                const textArea = modal.querySelector('#modalHotspotText');

                if (typeSelect && options.category) {
                    typeSelect.value = options.category;
                }
                if (titleInput && options.title) {
                    titleInput.value = options.title;
                }
                if (textArea && options.description) {
                    textArea.value = options.description;
                }
            }
        }, 100);
    }

    loadHotspots(hotspots) {
        console.log('HotspotEditor.loadHotspots() called with:', hotspots);
        this.hotspots = hotspots || [];
        this.renderHotspots();
    }
}

// Initialize enhanced hotspot editor
const hotspotEditor = new HotspotEditor();

// Override the existing addHotspot function
function addHotspot() {
    hotspotEditor.enablePlacementMode();
}

// Integration with existing upload.js
function loadSceneForEditing(fileId) {
    const fileData = uploadedFiles.find(f => f.id === fileId);
    if (!fileData) return;

    currentEditingScene = fileData;

    const preview = document.getElementById('scenePreview');
    const placeholder = document.getElementById('previewPlaceholder');

    preview.src = fileData.preview;
    preview.classList.remove('hidden');
    placeholder.classList.add('hidden');

    // Load scene into enhanced editor
    hotspotEditor.loadScene(fileData);
}

console.log('Enhanced Hotspot Editor loaded');