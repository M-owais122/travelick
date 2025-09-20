/**
 * Modern VR Tour Hotspot Manager
 * Advanced hotspot management with real-time preview and intelligent positioning
 */

class ModernHotspotManager {
    constructor() {
        this.hotspots = new Map();
        this.viewers = new Map();
        this.selectedHotspot = null;
        this.dragMode = false;
        this.tourData = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeUI();
    }

    setupEventListeners() {
        // Global hotspot events
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        document.addEventListener('keydown', this.handleKeydown.bind(this));

        // Hotspot panel events
        this.setupHotspotPanelEvents();
    }

    initializeUI() {
        // Create hotspot management UI if it doesn't exist
        if (!document.getElementById('hotspotManager')) {
            this.createHotspotManagerUI();
        }
    }

    createHotspotManagerUI() {
        const managerHTML = `
            <div id="hotspotManager" class="fixed right-4 top-4 w-80 bg-gray-900 bg-opacity-95 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-2xl z-50 hidden">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-white flex items-center">
                        <i class="fas fa-crosshairs text-green-400 mr-2"></i>
                        Hotspot Manager
                    </h3>
                    <button id="closeHotspotManager" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <!-- Add Hotspot Button -->
                    <button id="addHotspotBtn" class="w-full bg-green-500 hover:bg-green-600 text-black font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center">
                        <i class="fas fa-plus mr-2"></i>
                        Add Navigation Hotspot
                    </button>

                    <!-- Hotspot List -->
                    <div id="hotspotList" class="space-y-2 max-h-60 overflow-y-auto">
                        <!-- Hotspots will be dynamically added here -->
                    </div>

                    <!-- Selected Hotspot Editor -->
                    <div id="hotspotEditor" class="hidden border-t border-gray-700 pt-4">
                        <h4 class="text-lg font-semibold text-white mb-3">Edit Hotspot</h4>

                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Hotspot Text</label>
                                <input type="text" id="hotspotText" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Target Scene</label>
                                <select id="targetScene" class="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-green-400 focus:outline-none">
                                    <option value="">Select target scene...</option>
                                </select>
                            </div>

                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-1">Yaw (H)</label>
                                    <input type="range" id="hotspotYaw" min="-180" max="180" value="0" class="w-full">
                                    <span id="yawValue" class="text-xs text-green-400">0°</span>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-300 mb-1">Pitch (V)</label>
                                    <input type="range" id="hotspotPitch" min="-30" max="30" value="0" class="w-full">
                                    <span id="pitchValue" class="text-xs text-green-400">0°</span>
                                </div>
                            </div>

                            <div class="flex space-x-2">
                                <button id="saveHotspot" class="flex-1 bg-green-500 hover:bg-green-600 text-black font-semibold py-2 px-3 rounded-lg">
                                    Save
                                </button>
                                <button id="deleteHotspot" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-3 rounded-lg">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Smart Suggestions -->
                    <div id="smartSuggestions" class="border-t border-gray-700 pt-4">
                        <h4 class="text-sm font-semibold text-gray-300 mb-2 flex items-center">
                            <i class="fas fa-lightbulb text-yellow-400 mr-2"></i>
                            Smart Suggestions
                        </h4>
                        <div id="suggestionsList" class="space-y-2">
                            <!-- Smart suggestions will appear here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', managerHTML);
        this.setupHotspotPanelEvents();
    }

    setupHotspotPanelEvents() {
        // Add hotspot button
        const addBtn = document.getElementById('addHotspotBtn');
        if (addBtn) {
            addBtn.addEventListener('click', this.addHotspot.bind(this));
        }

        // Close manager
        const closeBtn = document.getElementById('closeHotspotManager');
        if (closeBtn) {
            closeBtn.addEventListener('click', this.hideManager.bind(this));
        }

        // Hotspot editor events
        const yawSlider = document.getElementById('hotspotYaw');
        const pitchSlider = document.getElementById('hotspotPitch');

        if (yawSlider) {
            yawSlider.addEventListener('input', this.updateHotspotPosition.bind(this));
        }
        if (pitchSlider) {
            pitchSlider.addEventListener('input', this.updateHotspotPosition.bind(this));
        }

        // Save and delete buttons
        const saveBtn = document.getElementById('saveHotspot');
        const deleteBtn = document.getElementById('deleteHotspot');

        if (saveBtn) {
            saveBtn.addEventListener('click', this.saveSelectedHotspot.bind(this));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', this.deleteSelectedHotspot.bind(this));
        }
    }

    // Main Methods
    showManager() {
        document.getElementById('hotspotManager').classList.remove('hidden');
        this.updateHotspotList();
        this.generateSmartSuggestions();
    }

    hideManager() {
        document.getElementById('hotspotManager').classList.add('hidden');
        this.selectedHotspot = null;
        this.hideEditor();
    }

    addHotspot() {
        if (!this.currentViewer || !this.currentSceneId) {
            this.showNotification('Please select a scene first', 'warning');
            return;
        }

        const hotspotId = `hotspot_${Date.now()}`;
        const currentView = this.currentViewer.getYaw();

        const hotspot = {
            id: hotspotId,
            sceneId: this.currentSceneId,
            pitch: -5,
            yaw: currentView,
            text: 'New Hotspot',
            type: 'scene',
            targetSceneId: null,
            category: 'scene'
        };

        this.hotspots.set(hotspotId, hotspot);
        this.addHotspotToViewer(hotspot);
        this.updateHotspotList();
        this.selectHotspot(hotspotId);
    }

    addHotspotToViewer(hotspot) {
        if (!this.currentViewer) return;

        try {
            this.currentViewer.addHotSpot({
                id: hotspot.id,
                pitch: hotspot.pitch,
                yaw: hotspot.yaw,
                type: 'custom',
                cssClass: 'modern-hotspot-marker',
                text: hotspot.text,
                clickHandlerFunc: () => this.handleHotspotClick(hotspot.id)
            });
        } catch (error) {
            console.error('Error adding hotspot to viewer:', error);
        }
    }

    selectHotspot(hotspotId) {
        this.selectedHotspot = hotspotId;
        const hotspot = this.hotspots.get(hotspotId);

        if (hotspot) {
            this.showEditor();
            this.populateEditor(hotspot);
            this.highlightHotspot(hotspotId);
        }
    }

    showEditor() {
        document.getElementById('hotspotEditor').classList.remove('hidden');
    }

    hideEditor() {
        document.getElementById('hotspotEditor').classList.add('hidden');
    }

    populateEditor(hotspot) {
        document.getElementById('hotspotText').value = hotspot.text || '';
        document.getElementById('hotspotYaw').value = hotspot.yaw || 0;
        document.getElementById('hotspotPitch').value = hotspot.pitch || 0;
        document.getElementById('yawValue').textContent = `${hotspot.yaw || 0}°`;
        document.getElementById('pitchValue').textContent = `${hotspot.pitch || 0}°`;

        // Update target scene dropdown
        this.updateTargetSceneDropdown(hotspot.targetSceneId);
    }

    updateTargetSceneDropdown(selectedSceneId) {
        const dropdown = document.getElementById('targetScene');
        if (!dropdown) return;

        dropdown.innerHTML = '<option value="">Select target scene...</option>';

        if (this.tourData && this.tourData.scenes) {
            this.tourData.scenes.forEach(scene => {
                if (scene.id !== this.currentSceneId) {
                    const option = document.createElement('option');
                    option.value = scene.id;
                    option.textContent = scene.title || scene.id;
                    option.selected = scene.id === selectedSceneId;
                    dropdown.appendChild(option);
                }
            });
        }
    }

    updateHotspotPosition() {
        if (!this.selectedHotspot) return;

        const yaw = parseInt(document.getElementById('hotspotYaw').value);
        const pitch = parseInt(document.getElementById('hotspotPitch').value);

        document.getElementById('yawValue').textContent = `${yaw}°`;
        document.getElementById('pitchValue').textContent = `${pitch}°`;

        const hotspot = this.hotspots.get(this.selectedHotspot);
        if (hotspot) {
            hotspot.yaw = yaw;
            hotspot.pitch = pitch;

            // Update in viewer
            this.updateHotspotInViewer(hotspot);
        }
    }

    updateHotspotInViewer(hotspot) {
        if (!this.currentViewer) return;

        try {
            // Remove and re-add hotspot (Pannellum limitation)
            this.currentViewer.removeHotSpot(hotspot.id);
            this.addHotspotToViewer(hotspot);
        } catch (error) {
            console.error('Error updating hotspot in viewer:', error);
        }
    }

    saveSelectedHotspot() {
        if (!this.selectedHotspot) return;

        const hotspot = this.hotspots.get(this.selectedHotspot);
        if (hotspot) {
            hotspot.text = document.getElementById('hotspotText').value;
            hotspot.targetSceneId = document.getElementById('targetScene').value;

            this.updateHotspotInViewer(hotspot);
            this.updateHotspotList();
            this.showNotification('Hotspot saved successfully', 'success');
        }
    }

    deleteSelectedHotspot() {
        if (!this.selectedHotspot) return;

        if (confirm('Are you sure you want to delete this hotspot?')) {
            const hotspot = this.hotspots.get(this.selectedHotspot);
            if (hotspot && this.currentViewer) {
                try {
                    this.currentViewer.removeHotSpot(hotspot.id);
                } catch (error) {
                    console.error('Error removing hotspot from viewer:', error);
                }
            }

            this.hotspots.delete(this.selectedHotspot);
            this.selectedHotspot = null;
            this.hideEditor();
            this.updateHotspotList();
            this.showNotification('Hotspot deleted', 'info');
        }
    }

    updateHotspotList() {
        const listContainer = document.getElementById('hotspotList');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        this.hotspots.forEach((hotspot, id) => {
            if (hotspot.sceneId === this.currentSceneId) {
                const hotspotItem = this.createHotspotListItem(hotspot);
                listContainer.appendChild(hotspotItem);
            }
        });

        if (listContainer.children.length === 0) {
            listContainer.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">No hotspots in this scene</p>';
        }
    }

    createHotspotListItem(hotspot) {
        const item = document.createElement('div');
        item.className = `hotspot-list-item p-3 bg-gray-800 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-700 ${this.selectedHotspot === hotspot.id ? 'ring-2 ring-green-400' : ''}`;

        item.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <i class="fas fa-crosshairs text-green-400 mr-2"></i>
                    <span class="text-white font-medium">${hotspot.text || 'Unnamed Hotspot'}</span>
                </div>
                <div class="text-xs text-gray-400">
                    ${hotspot.yaw}°, ${hotspot.pitch}°
                </div>
            </div>
            ${hotspot.targetSceneId ? `<div class="text-xs text-gray-500 mt-1">→ ${this.getSceneTitle(hotspot.targetSceneId)}</div>` : ''}
        `;

        item.addEventListener('click', () => this.selectHotspot(hotspot.id));
        return item;
    }

    getSceneTitle(sceneId) {
        if (this.tourData && this.tourData.scenes) {
            const scene = this.tourData.scenes.find(s => s.id === sceneId);
            return scene ? (scene.title || scene.id) : 'Unknown Scene';
        }
        return sceneId;
    }

    generateSmartSuggestions() {
        const suggestionsContainer = document.getElementById('suggestionsList');
        if (!suggestionsContainer) return;

        const suggestions = this.getSmartSuggestions();
        suggestionsContainer.innerHTML = '';

        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'bg-gray-800 rounded-lg p-2 cursor-pointer hover:bg-gray-700 transition-colors';
            suggestionItem.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-300">${suggestion.text}</span>
                    <button class="text-xs bg-green-500 hover:bg-green-600 text-black px-2 py-1 rounded">
                        Apply
                    </button>
                </div>
            `;

            suggestionItem.querySelector('button').addEventListener('click', () => {
                suggestion.action();
                this.generateSmartSuggestions();
            });

            suggestionsContainer.appendChild(suggestionItem);
        });

        if (suggestions.length === 0) {
            suggestionsContainer.innerHTML = '<p class="text-gray-500 text-xs text-center py-2">No suggestions available</p>';
        }
    }

    getSmartSuggestions() {
        const suggestions = [];

        // Suggest bidirectional navigation
        if (this.tourData && this.tourData.scenes && this.tourData.scenes.length > 1) {
            const currentSceneHotspots = Array.from(this.hotspots.values()).filter(h => h.sceneId === this.currentSceneId);
            const otherScenes = this.tourData.scenes.filter(s => s.id !== this.currentSceneId);

            otherScenes.forEach(scene => {
                const hasHotspotToScene = currentSceneHotspots.some(h => h.targetSceneId === scene.id);
                if (!hasHotspotToScene) {
                    suggestions.push({
                        text: `Add navigation to ${scene.title || scene.id}`,
                        action: () => this.addNavigationHotspot(scene.id, scene.title)
                    });
                }
            });
        }

        // Suggest optimal hotspot positioning
        const sceneHotspots = Array.from(this.hotspots.values()).filter(h => h.sceneId === this.currentSceneId);
        if (sceneHotspots.length > 1) {
            const clustered = this.detectClusteredHotspots(sceneHotspots);
            if (clustered.length > 0) {
                suggestions.push({
                    text: 'Distribute clustered hotspots',
                    action: () => this.distributeHotspots(clustered)
                });
            }
        }

        return suggestions;
    }

    addNavigationHotspot(targetSceneId, targetSceneTitle) {
        const hotspotId = `hotspot_${Date.now()}`;
        const optimalPosition = this.calculateOptimalPosition();

        const hotspot = {
            id: hotspotId,
            sceneId: this.currentSceneId,
            pitch: optimalPosition.pitch,
            yaw: optimalPosition.yaw,
            text: `Go to ${targetSceneTitle || 'Next Scene'}`,
            type: 'scene',
            targetSceneId: targetSceneId,
            category: 'scene'
        };

        this.hotspots.set(hotspotId, hotspot);
        this.addHotspotToViewer(hotspot);
        this.updateHotspotList();
        this.showNotification('Navigation hotspot added', 'success');
    }

    calculateOptimalPosition() {
        const existingHotspots = Array.from(this.hotspots.values()).filter(h => h.sceneId === this.currentSceneId);

        if (existingHotspots.length === 0) {
            return { yaw: 45, pitch: -5 };
        }

        // Find position with maximum distance from existing hotspots
        let bestPosition = { yaw: 0, pitch: -5 };
        let maxMinDistance = 0;

        for (let yaw = -180; yaw <= 180; yaw += 30) {
            const minDistance = Math.min(...existingHotspots.map(h => Math.abs(yaw - h.yaw)));
            if (minDistance > maxMinDistance) {
                maxMinDistance = minDistance;
                bestPosition.yaw = yaw;
            }
        }

        return bestPosition;
    }

    detectClusteredHotspots(hotspots) {
        const clustered = [];
        const threshold = 30; // degrees

        for (let i = 0; i < hotspots.length; i++) {
            for (let j = i + 1; j < hotspots.length; j++) {
                const distance = Math.abs(hotspots[i].yaw - hotspots[j].yaw);
                if (distance < threshold) {
                    clustered.push(hotspots[i], hotspots[j]);
                }
            }
        }

        return [...new Set(clustered)];
    }

    distributeHotspots(hotspots) {
        const angleStep = 360 / hotspots.length;

        hotspots.forEach((hotspot, index) => {
            hotspot.yaw = (index * angleStep) - 180;
            this.updateHotspotInViewer(hotspot);
        });

        this.updateHotspotList();
        this.showNotification('Hotspots distributed evenly', 'success');
    }

    highlightHotspot(hotspotId) {
        // Remove previous highlights
        document.querySelectorAll('.hotspot-highlighted').forEach(el => {
            el.classList.remove('hotspot-highlighted');
        });

        // Highlight selected hotspot
        const hotspotElement = document.querySelector(`[data-hotspot-id="${hotspotId}"]`);
        if (hotspotElement) {
            hotspotElement.classList.add('hotspot-highlighted');
        }
    }

    handleHotspotClick(hotspotId) {
        const hotspot = this.hotspots.get(hotspotId);
        if (hotspot && hotspot.targetSceneId) {
            // Navigate to target scene
            this.navigateToScene(hotspot.targetSceneId);
        } else {
            // Select hotspot for editing
            this.selectHotspot(hotspotId);
            this.showManager();
        }
    }

    navigateToScene(sceneId) {
        if (this.onSceneChange) {
            this.onSceneChange(sceneId);
        }
    }

    handleGlobalClick(event) {
        // Close manager if clicking outside
        const manager = document.getElementById('hotspotManager');
        if (manager && !manager.contains(event.target) && !event.target.closest('.hotspot-marker')) {
            // Don't close if clicking on hotspot controls
            if (!event.target.closest('[data-hotspot-control]')) {
                this.selectedHotspot = null;
                this.hideEditor();
            }
        }
    }

    handleKeydown(event) {
        if (event.key === 'Escape') {
            this.hideManager();
        } else if (event.key === 'Delete' && this.selectedHotspot) {
            this.deleteSelectedHotspot();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification if it doesn't exist
        let notification = document.getElementById('hotspotNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'hotspotNotification';
            notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg font-medium z-50 transition-all duration-300';
            document.body.appendChild(notification);
        }

        // Set notification style based on type
        const typeClasses = {
            success: 'bg-green-500 text-black',
            warning: 'bg-yellow-500 text-black',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white'
        };

        notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg font-medium z-50 transition-all duration-300 ${typeClasses[type] || typeClasses.info}`;
        notification.textContent = message;
        notification.style.opacity = '1';

        // Auto-hide notification
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 3000);
    }

    // Public API
    setViewer(viewer, sceneId) {
        this.currentViewer = viewer;
        this.currentSceneId = sceneId;
        this.viewers.set(sceneId, viewer);
    }

    setTourData(tourData) {
        this.tourData = tourData;
    }

    loadHotspotsForScene(sceneId, hotspots) {
        // Clear existing hotspots for this scene
        Array.from(this.hotspots.keys()).forEach(id => {
            const hotspot = this.hotspots.get(id);
            if (hotspot.sceneId === sceneId) {
                this.hotspots.delete(id);
            }
        });

        // Load new hotspots
        hotspots.forEach(hotspotData => {
            const hotspot = {
                id: hotspotData.id || `hotspot_${Date.now()}_${Math.random()}`,
                sceneId: sceneId,
                ...hotspotData
            };
            this.hotspots.set(hotspot.id, hotspot);
        });

        this.updateHotspotList();
    }

    getHotspotsForScene(sceneId) {
        return Array.from(this.hotspots.values()).filter(h => h.sceneId === sceneId);
    }

    exportHotspots() {
        const hotspotsData = {};
        this.hotspots.forEach((hotspot, id) => {
            if (!hotspotsData[hotspot.sceneId]) {
                hotspotsData[hotspot.sceneId] = [];
            }
            hotspotsData[hotspot.sceneId].push(hotspot);
        });
        return hotspotsData;
    }
}

// Global instance
window.ModernHotspotManager = ModernHotspotManager;