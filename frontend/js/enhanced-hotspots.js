// Enhanced Hotspot Management System

class HotspotManager {
    constructor() {
        console.log('HotspotManager constructor called');
        this.activeTooltip = null;
        this.galleries = new Map();
        this.soundManager = null;
        this.init();
    }

    init() {
        console.log('HotspotManager init() called');
        this.createGalleryModal();
        this.setupEventListeners();
        console.log('Enhanced Hotspot Manager initialized successfully');
    }

    // Create enhanced hotspots based on type
    createEnhancedHotspot(hotspot) {
        const hotspotConfig = {
            pitch: hotspot.pitch,
            yaw: hotspot.yaw,
            type: 'custom',
            cssClass: this.getHotspotClass(hotspot.category || hotspot.type),
            clickHandlerFunc: () => this.handleHotspotClick(hotspot),
            createTooltipFunc: () => this.createRichTooltip(hotspot),
            text: this.getHotspotIcon(hotspot.category || hotspot.type)
        };

        return hotspotConfig;
    }

    // Get CSS class based on hotspot category
    getHotspotClass(category) {
        const classes = {
            'scene': 'hotspot-scene',
            'navigation': 'hotspot-scene',
            'info': 'hotspot-info',
            'media': 'hotspot-media',
            'interactive': 'hotspot-interactive',
            'gallery': 'hotspot-media',
            'video': 'hotspot-media',
            'audio': 'hotspot-interactive'
        };
        return classes[category] || 'hotspot-info';
    }

    // Get icon for hotspot category
    getHotspotIcon(category) {
        const icons = {
            'scene': '<i class="fas fa-arrow-right" style="color: white; font-size: 16px;"></i>',
            'navigation': '<i class="fas fa-arrow-right" style="color: white; font-size: 16px;"></i>',
            'info': '<i class="fas fa-info" style="color: white; font-size: 14px;"></i>',
            'media': '<i class="fas fa-images" style="color: white; font-size: 14px;"></i>',
            'interactive': '<i class="fas fa-hand-pointer" style="color: white; font-size: 14px;"></i>',
            'gallery': '<i class="fas fa-images" style="color: white; font-size: 14px;"></i>',
            'video': '<i class="fas fa-play" style="color: white; font-size: 14px;"></i>',
            'audio': '<i class="fas fa-volume-up" style="color: white; font-size: 14px;"></i>'
        };
        return icons[category] || '<i class="fas fa-info" style="color: white; font-size: 14px;"></i>';
    }

    // Handle hotspot clicks
    async handleHotspotClick(hotspot) {
        console.log('Hotspot clicked:', hotspot);

        // Close any existing tooltip
        this.closeActiveTooltip();

        // Play interaction sound
        this.playInteractionSound(hotspot.category || hotspot.type);

        // Handle different hotspot types
        switch (hotspot.category || hotspot.type) {
            case 'scene':
            case 'navigation':
                await this.handleSceneNavigation(hotspot);
                break;

            case 'gallery':
                this.openGallery(hotspot.gallery || hotspot.media);
                break;

            case 'video':
                this.showVideoTooltip(hotspot);
                break;

            case 'audio':
                this.playAudioClip(hotspot.audioUrl);
                break;

            case 'interactive':
                this.handleInteractiveElement(hotspot);
                break;

            default:
                this.showInfoTooltip(hotspot);
        }

        // Track analytics
        this.trackHotspotInteraction(hotspot);
    }

    // Handle scene navigation with transition effects
    async handleSceneNavigation(hotspot) {
        if (hotspot.sceneId) {
            // Show transition overlay
            this.showTransitionOverlay(hotspot.text || 'Loading...');

            // Add slight delay for smooth transition
            setTimeout(() => {
                if (typeof loadScene === 'function') {
                    loadScene(hotspot.sceneId);
                }
                this.hideTransitionOverlay();
            }, 500);
        }
    }

    // Create rich tooltip with media support
    createRichTooltip(hotspot) {
        const tooltip = document.createElement('div');
        tooltip.className = 'rich-tooltip';

        const header = document.createElement('div');
        header.className = 'rich-tooltip-header';
        header.innerHTML = `
            <span>${hotspot.title || hotspot.text}</span>
            <button class="tooltip-close" onclick="hotspotManager.closeActiveTooltip()">
                <i class="fas fa-times"></i>
            </button>
        `;

        const content = document.createElement('div');
        content.className = 'rich-tooltip-content';

        // Add media content
        if (hotspot.image) {
            const img = document.createElement('img');
            img.src = hotspot.image;
            img.alt = hotspot.title || hotspot.text;
            content.appendChild(img);
        }

        if (hotspot.video) {
            const video = document.createElement('video');
            video.src = hotspot.video;
            video.controls = true;
            video.preload = 'metadata';
            content.appendChild(video);
        }

        // Add text content
        if (hotspot.description || hotspot.text) {
            const textDiv = document.createElement('div');
            textDiv.className = 'rich-tooltip-text';
            textDiv.innerHTML = hotspot.description || hotspot.text;
            content.appendChild(textDiv);
        }

        // Add action buttons
        const actions = this.createTooltipActions(hotspot);
        if (actions.children.length > 0) {
            content.appendChild(actions);
        }

        tooltip.appendChild(header);
        tooltip.appendChild(content);

        this.activeTooltip = tooltip;
        return tooltip;
    }

    // Create action buttons for tooltips
    createTooltipActions(hotspot) {
        const actions = document.createElement('div');
        actions.className = 'rich-tooltip-actions';

        // Gallery button
        if (hotspot.gallery && hotspot.gallery.length > 0) {
            const galleryBtn = document.createElement('button');
            galleryBtn.className = 'tooltip-btn';
            galleryBtn.innerHTML = '<i class="fas fa-images"></i> View Gallery';
            galleryBtn.onclick = () => this.openGallery(hotspot.gallery);
            actions.appendChild(galleryBtn);
        }

        // External link button
        if (hotspot.link) {
            const linkBtn = document.createElement('button');
            linkBtn.className = 'tooltip-btn';
            linkBtn.innerHTML = '<i class="fas fa-external-link-alt"></i> Learn More';
            linkBtn.onclick = () => window.open(hotspot.link, '_blank');
            actions.appendChild(linkBtn);
        }

        // Share button
        if (hotspot.shareable !== false) {
            const shareBtn = document.createElement('button');
            shareBtn.className = 'tooltip-btn';
            shareBtn.innerHTML = '<i class="fas fa-share"></i> Share';
            shareBtn.onclick = () => this.shareHotspot(hotspot);
            actions.appendChild(shareBtn);
        }

        return actions;
    }

    // Close active tooltip
    closeActiveTooltip() {
        if (this.activeTooltip && this.activeTooltip.parentNode) {
            this.activeTooltip.parentNode.removeChild(this.activeTooltip);
            this.activeTooltip = null;
        }
    }

    // Gallery functionality
    createGalleryModal() {
        const modal = document.createElement('div');
        modal.id = 'galleryModal';
        modal.className = 'gallery-modal';
        modal.innerHTML = `
            <div class="gallery-content">
                <button class="gallery-close" onclick="hotspotManager.closeGallery()">
                    <i class="fas fa-times"></i>
                </button>
                <button class="gallery-nav prev" onclick="hotspotManager.prevImage()">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <button class="gallery-nav next" onclick="hotspotManager.nextImage()">
                    <i class="fas fa-chevron-right"></i>
                </button>
                <img class="gallery-main-image" id="galleryMainImage" src="" alt="">
                <div class="gallery-thumbnails" id="galleryThumbnails"></div>
                <div class="gallery-info" id="galleryInfo"></div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    openGallery(images) {
        if (!images || images.length === 0) return;

        this.currentGallery = images;
        this.currentImageIndex = 0;

        const modal = document.getElementById('galleryModal');
        const mainImage = document.getElementById('galleryMainImage');
        const thumbnails = document.getElementById('galleryThumbnails');

        // Set main image
        mainImage.src = images[0].url || images[0];
        mainImage.alt = images[0].caption || '';

        // Create thumbnails
        thumbnails.innerHTML = '';
        images.forEach((image, index) => {
            const thumb = document.createElement('img');
            thumb.className = 'gallery-thumb';
            thumb.src = image.thumbnail || image.url || image;
            thumb.alt = image.caption || '';
            thumb.onclick = () => this.showGalleryImage(index);
            if (index === 0) thumb.classList.add('active');
            thumbnails.appendChild(thumb);
        });

        modal.classList.add('active');
        this.updateGalleryInfo();
    }

    showGalleryImage(index) {
        if (!this.currentGallery || index < 0 || index >= this.currentGallery.length) return;

        this.currentImageIndex = index;
        const image = this.currentGallery[index];

        document.getElementById('galleryMainImage').src = image.url || image;

        // Update active thumbnail
        document.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });

        this.updateGalleryInfo();
    }

    updateGalleryInfo() {
        const info = document.getElementById('galleryInfo');
        const image = this.currentGallery[this.currentImageIndex];

        if (image.caption || image.description) {
            info.innerHTML = `
                <div style="color: white; text-align: center; margin-top: 15px;">
                    ${image.caption ? `<h4 style="margin-bottom: 8px;">${image.caption}</h4>` : ''}
                    ${image.description ? `<p style="font-size: 14px; opacity: 0.8;">${image.description}</p>` : ''}
                </div>
            `;
        } else {
            info.innerHTML = '';
        }
    }

    nextImage() {
        if (this.currentImageIndex < this.currentGallery.length - 1) {
            this.showGalleryImage(this.currentImageIndex + 1);
        }
    }

    prevImage() {
        if (this.currentImageIndex > 0) {
            this.showGalleryImage(this.currentImageIndex - 1);
        }
    }

    closeGallery() {
        document.getElementById('galleryModal').classList.remove('active');
    }

    // Video tooltip
    showVideoTooltip(hotspot) {
        const tooltip = document.createElement('div');
        tooltip.className = 'rich-tooltip';
        tooltip.innerHTML = `
            <div class="rich-tooltip-header">
                <span>${hotspot.title || 'Video'}</span>
                <button class="tooltip-close" onclick="hotspotManager.closeActiveTooltip()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="rich-tooltip-content">
                <video controls autoplay muted style="width: 100%; border-radius: 8px;">
                    <source src="${hotspot.video}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                ${hotspot.description ? `<div class="rich-tooltip-text">${hotspot.description}</div>` : ''}
            </div>
        `;

        // Position tooltip
        document.body.appendChild(tooltip);
        this.activeTooltip = tooltip;
    }

    // Audio functionality
    playAudioClip(audioUrl) {
        if (!audioUrl) return;

        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error('Audio play failed:', e));

        showNotification('🔊 Playing audio clip', 'info');
    }

    // Interactive elements
    handleInteractiveElement(hotspot) {
        switch (hotspot.interactionType) {
            case 'quiz':
                this.showQuiz(hotspot.quiz);
                break;
            case 'form':
                this.showForm(hotspot.form);
                break;
            case 'measurement':
                this.showMeasurement(hotspot.measurement);
                break;
            default:
                this.showInfoTooltip(hotspot);
        }
    }

    // Transition effects
    showTransitionOverlay(text) {
        const overlay = document.createElement('div');
        overlay.id = 'sceneTransition';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1500;
            animation: fadeIn 0.3s ease;
        `;
        overlay.innerHTML = `
            <div style="color: white; text-align: center;">
                <div style="width: 40px; height: 40px; border: 3px solid #39FF14; border-radius: 50%; border-top: 3px solid transparent; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h3 style="font-size: 18px; margin: 0;">${text}</h3>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    hideTransitionOverlay() {
        const overlay = document.getElementById('sceneTransition');
        if (overlay) {
            overlay.remove();
        }
    }

    // Sound management
    setSoundManager(manager) {
        this.soundManager = manager;
    }

    playInteractionSound(type) {
        if (!this.soundManager || !soundEnabled) return;

        const soundMap = {
            'scene': 'transition',
            'info': 'info',
            'media': 'media',
            'interactive': 'interaction'
        };

        const soundType = soundMap[type] || 'default';
        this.soundManager.playSound(soundType);
    }

    // Analytics tracking
    trackHotspotInteraction(hotspot) {
        const analyticsData = {
            timestamp: new Date().toISOString(),
            tourId: currentTour?.id,
            sceneId: currentScene?.id,
            hotspotType: hotspot.category || hotspot.type,
            hotspotText: hotspot.text,
            userAgent: navigator.userAgent
        };

        // Store in localStorage for now (can be sent to analytics server)
        const existing = JSON.parse(localStorage.getItem('hotspot_interactions') || '[]');
        existing.push(analyticsData);
        localStorage.setItem('hotspot_interactions', JSON.stringify(existing));

        console.log('Hotspot interaction tracked:', analyticsData);
    }

    // Share hotspot
    shareHotspot(hotspot) {
        const shareData = {
            title: hotspot.title || hotspot.text,
            text: `Check out this point of interest: ${hotspot.title || hotspot.text}`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(e => console.log('Share failed:', e));
        } else {
            // Fallback
            const text = `${shareData.text}\n${shareData.url}`;
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Hotspot info copied to clipboard!', 'success');
            });
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Close gallery on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeGallery();
                this.closeActiveTooltip();
            }
        });

        // Close gallery on outside click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'galleryModal') {
                this.closeGallery();
            }
        });
    }

    // Info tooltip fallback
    showInfoTooltip(hotspot) {
        if (typeof showNotification === 'function') {
            showNotification(hotspot.text || hotspot.description, 'info');
        }
    }
}

// Initialize global hotspot manager
const hotspotManager = new HotspotManager();

// Integration with existing viewer.js
if (typeof window !== 'undefined') {
    window.hotspotManager = hotspotManager;
}

// Enhanced hotspot creation function for integration
function createEnhancedHotspots(scene) {
    console.log('=== HOTSPOT CREATION DEBUG ===');
    console.log('createEnhancedHotspots called with scene:', scene);

    if (!scene || !scene.hotspots) {
        console.warn('⚠️ No scene or hotspots found:', { scene, hasHotspots: !!scene?.hotspots });
        return [];
    }

    console.log('✅ Found hotspots:', scene.hotspots.length);
    console.log('📍 Hotspot details:', scene.hotspots);

    // Get object hotspots from the 3D system
    let objectHotspots = [];
    if (window.objectHighlight3D) {
        console.log('ObjectHighlight3D system found, getting object hotspots...');
        objectHotspots = window.objectHighlight3D.getObjectHotspots(scene);
        console.log('Added', objectHotspots.length, 'object hotspots');
    } else {
        console.warn('ObjectHighlight3D system not found! Checking after delay...');
        setTimeout(() => {
            if (window.objectHighlight3D) {
                console.log('ObjectHighlight3D system now available');
            } else {
                console.error('ObjectHighlight3D system still not available');
            }
        }, 1000);
    }

    // Create navigation and info hotspots
    const testHotspots = scene.hotspots.map((hotspot, index) => {
        console.log('Processing hotspot:', hotspot);

        const basicHotspot = {
            pitch: hotspot.pitch || 0,
            yaw: hotspot.yaw || 0,
            type: 'custom',
            text: `<div class="test-hotspot" style="
                background: #39FF14;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 3px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 0 20px rgba(57, 255, 20, 0.8);
            ">
                <i class="fas fa-${hotspot.category === 'scene' ? 'arrow-right' : 'info'}" style="color: black; font-size: 16px;"></i>
            </div>`,
            clickHandlerFunc: () => {
                console.log('🎯 HOTSPOT CLICKED!', hotspot);

                // Check if it's a scene navigation hotspot
                const isSceneNavigation = (hotspot.category === 'scene' || hotspot.type === 'scene') && hotspot.sceneId;

                if (isSceneNavigation) {
                    console.log('🔄 Scene navigation detected:', hotspot.sceneId);

                    // Check if loadScene function exists
                    if (typeof loadScene === 'function') {
                        console.log('✅ loadScene function found, navigating...');

                        // Show loading notification
                        if (typeof showNotification === 'function') {
                            showNotification(`Moving to ${hotspot.text || hotspot.title || 'next room'}...`, 'info');
                        }

                        // Navigate to new scene
                        loadScene(hotspot.sceneId);
                    } else {
                        console.error('❌ loadScene function not found!');
                        console.log('Available global functions:', Object.getOwnPropertyNames(window).filter(name => typeof window[name] === 'function').slice(0, 20));
                        alert('Navigation function not available. Please refresh the page.');
                    }
                } else {
                    console.log('ℹ️ Info hotspot clicked');
                    // Show info alert with details
                    const info = [
                        hotspot.title || hotspot.text || 'Information',
                        hotspot.description ? `\nDescription: ${hotspot.description}` : '',
                        `\nType: ${hotspot.category || hotspot.type || 'info'}`,
                        `\nPosition: Pitch ${hotspot.pitch}°, Yaw ${hotspot.yaw}°`
                    ].join('');

                    alert(info);
                }
            }
        };

        console.log('Created test hotspot:', basicHotspot);
        return basicHotspot;
    });

    console.log('All test hotspots created:', testHotspots);

    // Add force test object hotspots for debugging
    let forceTestHotspots = [];
    if (window.forceCreateObjectHotspots) {
        forceTestHotspots = window.forceCreateObjectHotspots(scene);
        console.log('Added', forceTestHotspots.length, 'force test object hotspots');
    }

    // Combine navigation hotspots with object hotspots
    const allHotspots = [...testHotspots, ...objectHotspots, ...forceTestHotspots];
    console.log('Total hotspots (navigation + objects + test):', allHotspots.length);

    return allHotspots;
}

console.log('Enhanced Hotspots system loaded');