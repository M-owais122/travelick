class ObjectHighlight3D {
    constructor() {
        this.isEnabled = true;
        this.highlightedObjects = new Map();
        this.objectDatabase = new Map();
        this.currentModal = null;
        this.viewer3D = null;
        this.init();
    }

    init() {
        console.log('Initializing Object Highlight & 3D Models system...');
        this.createModal();
        this.loadObjectDatabase();
        this.setupEventListeners();
        this.loadDependencies();
    }

    async loadDependencies() {
        try {
            // Load Three.js for 3D model viewing
            if (!window.THREE) {
                console.log('Loading Three.js...');
                await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
                console.log('Three.js loaded successfully');
            }

            // Load OrbitControls for 3D navigation
            if (!window.THREE || !window.THREE.OrbitControls) {
                console.log('Loading OrbitControls...');
                await this.loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');
                console.log('OrbitControls loaded successfully');
            }

            console.log('All 3D dependencies loaded successfully');
        } catch (error) {
            console.error('Error loading 3D dependencies:', error);
        }
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadObjectDatabase() {
        // Define interactive objects for each room
        this.objectDatabase = new Map([
            // Living Room Objects
            ['living-room-sofa', {
                name: 'Modern Sectional Sofa',
                category: 'Furniture',
                description: 'A comfortable L-shaped sectional sofa with premium fabric upholstery, perfect for family gatherings and relaxation.',
                specifications: {
                    'Material': 'Premium Fabric & Hardwood Frame',
                    'Seating Capacity': '6-8 People',
                    'Dimensions': '120" L × 85" W × 35" H',
                    'Color': 'Charcoal Gray',
                    'Features': 'Removable Cushions, Stain Resistant'
                },
                model3D: null, // Would be URL to 3D model
                images: ['/uploads/furniture/sofa-1.jpg', '/uploads/furniture/sofa-2.jpg'],
                price: '$2,499',
                brand: 'Modern Living Co.'
            }],
            ['living-room-tv', {
                name: '65" Smart 4K TV',
                category: 'Electronics',
                description: 'Ultra HD Smart TV with HDR support and built-in streaming capabilities for the ultimate entertainment experience.',
                specifications: {
                    'Screen Size': '65 inches',
                    'Resolution': '4K Ultra HD (3840 x 2160)',
                    'Display Type': 'QLED',
                    'Smart Features': 'Built-in WiFi, Streaming Apps',
                    'Ports': '4x HDMI, 2x USB, Ethernet'
                },
                model3D: null,
                images: ['/uploads/electronics/tv-1.jpg'],
                price: '$1,299',
                brand: 'TechVision'
            }],
            ['living-room-coffee-table', {
                name: 'Glass Coffee Table',
                category: 'Furniture',
                description: 'Modern tempered glass coffee table with sleek metal legs, adding elegance to any living space.',
                specifications: {
                    'Material': 'Tempered Glass & Stainless Steel',
                    'Dimensions': '48" L × 24" W × 16" H',
                    'Shape': 'Rectangular',
                    'Weight Capacity': '50 lbs',
                    'Features': 'Easy to Clean, Scratch Resistant'
                },
                model3D: null,
                images: ['/uploads/furniture/coffee-table-1.jpg'],
                price: '$399',
                brand: 'Glass & Steel Designs'
            }],

            // Kitchen Objects
            ['kitchen-refrigerator', {
                name: 'French Door Refrigerator',
                category: 'Appliances',
                description: 'Energy-efficient French door refrigerator with advanced cooling technology and spacious interior.',
                specifications: {
                    'Capacity': '25.5 cubic feet',
                    'Type': 'French Door with Bottom Freezer',
                    'Energy Rating': 'Energy Star Certified',
                    'Features': 'Ice & Water Dispenser, Smart Connectivity',
                    'Dimensions': '36" W × 70" H × 30" D'
                },
                model3D: null,
                images: ['/uploads/appliances/fridge-1.jpg'],
                price: '$2,199',
                brand: 'CoolTech'
            }],
            ['kitchen-island', {
                name: 'Kitchen Island with Storage',
                category: 'Furniture',
                description: 'Spacious kitchen island with granite countertop and abundant storage space for cooking essentials.',
                specifications: {
                    'Material': 'Granite Top, Hardwood Base',
                    'Dimensions': '72" L × 36" W × 36" H',
                    'Storage': '6 Drawers, 3 Cabinets',
                    'Features': 'Soft-Close Drawers, Power Outlets',
                    'Seating': 'Bar Stool Ready'
                },
                model3D: null,
                images: ['/uploads/furniture/island-1.jpg'],
                price: '$3,499',
                brand: 'Kitchen Craft'
            }],

            // Bedroom Objects
            ['bedroom-bed', {
                name: 'King Size Platform Bed',
                category: 'Furniture',
                description: 'Modern platform bed with upholstered headboard, providing comfort and style for the master bedroom.',
                specifications: {
                    'Size': 'King (76" × 80")',
                    'Material': 'Upholstered Fabric & Wood Frame',
                    'Style': 'Platform Bed',
                    'Headboard': 'Tufted Upholstered',
                    'Assembly': 'Easy Assembly Required'
                },
                model3D: null,
                images: ['/uploads/furniture/bed-1.jpg'],
                price: '$1,599',
                brand: 'Sleep Comfort'
            }],
            ['bedroom-dresser', {
                name: '6-Drawer Dresser',
                category: 'Furniture',
                description: 'Elegant 6-drawer dresser with mirror, offering ample storage space for clothing and accessories.',
                specifications: {
                    'Material': 'Solid Wood',
                    'Dimensions': '60" W × 18" D × 32" H',
                    'Drawers': '6 Full-Extension Drawers',
                    'Features': 'Soft-Close Mechanism, Anti-Tip',
                    'Finish': 'Rich Walnut'
                },
                model3D: null,
                images: ['/uploads/furniture/dresser-1.jpg'],
                price: '$899',
                brand: 'Wood Craft'
            }],

            // Bathroom Objects
            ['bathroom-vanity', {
                name: 'Double Sink Vanity',
                category: 'Fixtures',
                description: 'Modern double sink vanity with quartz countertop and soft-close drawers for bathroom storage.',
                specifications: {
                    'Material': 'Quartz Top, Hardwood Cabinet',
                    'Dimensions': '72" W × 22" D × 34" H',
                    'Sinks': 'Dual Undermount Ceramic',
                    'Storage': '4 Drawers, 2 Cabinets',
                    'Finish': 'Waterproof Coating'
                },
                model3D: null,
                images: ['/uploads/fixtures/vanity-1.jpg'],
                price: '$2,299',
                brand: 'Bath Luxury'
            }],
            ['bathroom-bathtub', {
                name: 'Freestanding Soaking Tub',
                category: 'Fixtures',
                description: 'Luxury freestanding soaking tub made from high-quality acrylic for ultimate relaxation experience.',
                specifications: {
                    'Material': 'High-Grade Acrylic',
                    'Dimensions': '67" L × 32" W × 24" H',
                    'Capacity': '80 Gallons',
                    'Style': 'Freestanding Oval',
                    'Features': 'Overflow Drain, Center Drain'
                },
                model3D: null,
                images: ['/uploads/fixtures/bathtub-1.jpg'],
                price: '$1,899',
                brand: 'Luxury Bath Co.'
            }]
        ]);

        console.log('Object database loaded with', this.objectDatabase.size, 'objects');
    }

    createModal() {
        const modalHTML = `
            <div id="objectModal" class="object-modal" style="
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                backdrop-filter: blur(10px);
            ">
                <div class="modal-content" style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #1a1a2e;
                    border-radius: 15px;
                    padding: 0;
                    max-width: 90vw;
                    max-height: 90vh;
                    width: 800px;
                    overflow: hidden;
                    border: 2px solid #39FF14;
                    color: white;
                ">
                    <div class="modal-header" style="
                        background: linear-gradient(135deg, #39FF14, #2bd610);
                        color: #1a1a2e;
                        padding: 20px;
                        position: relative;
                    ">
                        <h2 id="objectTitle" style="margin: 0; font-size: 24px; font-weight: bold;"></h2>
                        <span id="objectCategory" style="
                            display: inline-block;
                            background: rgba(26, 26, 46, 0.2);
                            padding: 4px 12px;
                            border-radius: 20px;
                            font-size: 12px;
                            margin-top: 8px;
                        "></span>
                        <button id="closeObjectModal" style="
                            position: absolute;
                            top: 15px;
                            right: 15px;
                            background: none;
                            border: none;
                            color: #1a1a2e;
                            font-size: 24px;
                            cursor: pointer;
                            width: 30px;
                            height: 30px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        ">×</button>
                    </div>

                    <div class="modal-body" style="
                        padding: 20px;
                        max-height: 70vh;
                        overflow-y: auto;
                    ">
                        <div class="object-tabs" style="
                            display: flex;
                            margin-bottom: 20px;
                            border-bottom: 1px solid #39FF14;
                        ">
                            <button class="tab-btn active" data-tab="details" style="
                                padding: 10px 20px;
                                background: none;
                                border: none;
                                color: #39FF14;
                                cursor: pointer;
                                border-bottom: 2px solid #39FF14;
                            ">Details</button>
                            <button class="tab-btn" data-tab="3d" style="
                                padding: 10px 20px;
                                background: none;
                                border: none;
                                color: #ccc;
                                cursor: pointer;
                                border-bottom: 2px solid transparent;
                            ">3D View</button>
                            <button class="tab-btn" data-tab="gallery" style="
                                padding: 10px 20px;
                                background: none;
                                border: none;
                                color: #ccc;
                                cursor: pointer;
                                border-bottom: 2px solid transparent;
                            ">Gallery</button>
                        </div>

                        <div id="detailsTab" class="tab-content">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                                <div>
                                    <h3 style="color: #39FF14; margin-bottom: 10px; font-size: 18px;">Description</h3>
                                    <p id="objectDescription" style="color: #ccc; line-height: 1.6;"></p>
                                </div>
                                <div>
                                    <h3 style="color: #39FF14; margin-bottom: 10px; font-size: 18px;">Specifications</h3>
                                    <div id="objectSpecs" style="color: #ccc;"></div>
                                </div>
                            </div>

                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(57, 255, 20, 0.1); border-radius: 10px; margin-top: 20px;">
                                <div>
                                    <div id="objectPrice" style="font-size: 24px; font-weight: bold; color: #39FF14;"></div>
                                    <div id="objectBrand" style="color: #ccc; font-size: 14px;"></div>
                                </div>
                                <button id="viewInARBtn" style="
                                    background: #39FF14;
                                    color: #1a1a2e;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 8px;
                                    font-weight: bold;
                                    cursor: pointer;
                                ">
                                    <i class="fas fa-cube"></i> View in AR
                                </button>
                            </div>
                        </div>

                        <div id="3dTab" class="tab-content" style="display: none;">
                            <div id="model3DContainer" style="
                                width: 100%;
                                height: 400px;
                                background: #000;
                                border-radius: 10px;
                                position: relative;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <div id="model3DViewer" style="width: 100%; height: 100%;"></div>
                                <div id="model3DPlaceholder" style="
                                    text-align: center;
                                    color: #666;
                                ">
                                    <i class="fas fa-cube" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                                    <p>3D Model Loading...</p>
                                </div>
                            </div>

                            <div style="margin-top: 15px; text-align: center; color: #ccc; font-size: 12px;">
                                <i class="fas fa-mouse"></i> Left click + drag to rotate • <i class="fas fa-search-plus"></i> Scroll to zoom • <i class="fas fa-hand-paper"></i> Right click + drag to pan
                            </div>
                        </div>

                        <div id="galleryTab" class="tab-content" style="display: none;">
                            <div id="objectGallery" style="
                                display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                gap: 15px;
                            ">
                                <!-- Gallery images will be loaded here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.currentModal = document.getElementById('objectModal');
    }

    setupEventListeners() {
        // Close modal
        document.getElementById('closeObjectModal')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Close on backdrop click
        this.currentModal?.addEventListener('click', (e) => {
            if (e.target === this.currentModal) {
                this.closeModal();
            }
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // View in AR button
        document.getElementById('viewInARBtn')?.addEventListener('click', () => {
            this.viewInAR();
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentModal.style.display === 'block') {
                this.closeModal();
            }
        });
    }

    addObjectHotspots(scene) {
        console.log('Creating object hotspots for scene:', scene.id);

        if (!this.isEnabled) {
            console.log('Object highlighting is disabled');
            return [];
        }

        const objectHotspots = [];

        // Define object hotspots for each scene
        const sceneObjects = {
            'scene-1': [ // Living Room
                { pitch: -10, yaw: 45, objectId: 'living-room-sofa', name: 'Sofa' },
                { pitch: 5, yaw: 180, objectId: 'living-room-tv', name: 'Smart TV' },
                { pitch: -20, yaw: 90, objectId: 'living-room-coffee-table', name: 'Coffee Table' }
            ],
            'scene-2': [ // Kitchen
                { pitch: 0, yaw: -90, objectId: 'kitchen-refrigerator', name: 'Refrigerator' },
                { pitch: -15, yaw: 0, objectId: 'kitchen-island', name: 'Kitchen Island' }
            ],
            'scene-3': [ // Bedroom
                { pitch: -10, yaw: 180, objectId: 'bedroom-bed', name: 'King Bed' },
                { pitch: 0, yaw: 90, objectId: 'bedroom-dresser', name: 'Dresser' }
            ],
            'scene-4': [ // Bathroom
                { pitch: -5, yaw: 0, objectId: 'bathroom-vanity', name: 'Vanity' },
                { pitch: -10, yaw: 180, objectId: 'bathroom-bathtub', name: 'Bathtub' }
            ]
        };

        const sceneObjectList = sceneObjects[scene.id] || [];
        console.log('Found', sceneObjectList.length, 'objects for scene', scene.id);

        sceneObjectList.forEach((obj, index) => {
            console.log(`Creating object hotspot ${index + 1}:`, obj.name, 'at', obj.pitch, obj.yaw);

            const hotspot = {
                pitch: obj.pitch,
                yaw: obj.yaw,
                type: 'custom',
                text: `<div class="object-hotspot-${obj.objectId}" style="
                    background: #39FF14;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 3px solid white;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                    transition: all 0.3s ease;
                    animation: objectPulse 2s infinite;
                    z-index: 1000;
                    position: relative;
                "
                onmouseover="this.style.transform='scale(1.3)'; this.style.background='#2bd610';"
                onmouseout="this.style.transform='scale(1)'; this.style.background='#39FF14';"
                title="${obj.name} - Click to view details">
                    <i class="fas fa-cube" style="color: #1a1a2e; font-size: 18px;"></i>
                </div>
                <style>
                @keyframes objectPulse {
                    0% { box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 0 0 rgba(57, 255, 20, 0.7); }
                    50% { box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 0 8px rgba(57, 255, 20, 0.3); }
                    100% { box-shadow: 0 4px 15px rgba(0,0,0,0.4), 0 0 0 0 rgba(57, 255, 20, 0); }
                }
                </style>`,
                clickHandlerFunc: () => {
                    console.log('Object hotspot clicked:', obj.name);
                    this.showObjectDetails(obj.objectId);
                }
            };

            objectHotspots.push(hotspot);
        });

        console.log('Created', objectHotspots.length, 'object hotspots');
        return objectHotspots;
    }

    showObjectDetails(objectId) {
        const objectData = this.objectDatabase.get(objectId);
        if (!objectData) {
            console.error('Object not found:', objectId);
            return;
        }

        console.log('Showing object details for:', objectData.name);

        // Populate modal content
        document.getElementById('objectTitle').textContent = objectData.name;
        document.getElementById('objectCategory').textContent = objectData.category;
        document.getElementById('objectDescription').textContent = objectData.description;
        document.getElementById('objectPrice').textContent = objectData.price;
        document.getElementById('objectBrand').textContent = objectData.brand;

        // Populate specifications
        const specsContainer = document.getElementById('objectSpecs');
        specsContainer.innerHTML = '';
        Object.entries(objectData.specifications).forEach(([key, value]) => {
            const specRow = document.createElement('div');
            specRow.style.marginBottom = '8px';
            specRow.innerHTML = `
                <span style="color: #39FF14; font-weight: bold;">${key}:</span>
                <span style="margin-left: 10px;">${value}</span>
            `;
            specsContainer.appendChild(specRow);
        });

        // Load gallery
        this.loadObjectGallery(objectData);

        // Show modal
        this.currentModal.style.display = 'block';

        // Reset to details tab
        this.switchTab('details');

        // Initialize 3D viewer if model exists
        if (objectData.model3D) {
            this.load3DModel(objectData.model3D);
        }

    }

    loadObjectGallery(objectData) {
        const galleryContainer = document.getElementById('objectGallery');
        galleryContainer.innerHTML = '';

        if (objectData.images && objectData.images.length > 0) {
            objectData.images.forEach((imageSrc, index) => {
                const imageDiv = document.createElement('div');
                imageDiv.style.cssText = `
                    background: #333;
                    border-radius: 10px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                `;

                imageDiv.innerHTML = `
                    <img src="${imageSrc}" alt="${objectData.name} - Image ${index + 1}"
                         style="width: 100%; height: 200px; object-fit: cover;"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZmlsbD0iIzY2NiI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4='">
                    <div style="padding: 10px;">
                        <p style="margin: 0; font-size: 12px; color: #ccc;">View ${index + 1}</p>
                    </div>
                `;

                imageDiv.addEventListener('mouseenter', () => {
                    imageDiv.style.transform = 'scale(1.05)';
                });

                imageDiv.addEventListener('mouseleave', () => {
                    imageDiv.style.transform = 'scale(1)';
                });

                galleryContainer.appendChild(imageDiv);
            });
        } else {
            galleryContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: #666; padding: 40px;">
                    <i class="fas fa-images" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                    <p>No additional images available</p>
                </div>
            `;
        }
    }

    load3DModel(modelUrl) {
        const viewer3D = document.getElementById('model3DViewer');
        const placeholder = document.getElementById('model3DPlaceholder');

        // Create a basic 3D demo scene with Three.js
        this.create3DDemo(viewer3D, placeholder);
    }

    create3DDemo(container, placeholder) {
        if (!window.THREE) {
            placeholder.innerHTML = `
                <i class="fas fa-cube" style="font-size: 48px; margin-bottom: 10px; display: block; color: #39FF14;"></i>
                <p>3D Model Preview</p>
                <p style="font-size: 12px; opacity: 0.7;">Three.js loading...</p>
            `;
            return;
        }

        try {
            // Hide placeholder
            placeholder.style.display = 'none';

            // Create Three.js scene
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1a1a2e);

            // Create camera
            const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);

            // Create renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(container.offsetWidth, container.offsetHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Clear container and add renderer
            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            // Create a demo furniture object (sofa)
            this.createDemoFurniture(scene);

            // Add lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0x39FF14, 0.8);
            directionalLight.position.set(10, 10, 5);
            directionalLight.castShadow = true;
            scene.add(directionalLight);

            // Position camera
            camera.position.set(5, 5, 5);
            camera.lookAt(0, 0, 0);

            // Add orbit controls if available
            if (window.THREE.OrbitControls) {
                const controls = new THREE.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.05;
            }

            // Animation loop
            const animate = () => {
                requestAnimationFrame(animate);

                // Rotate the model slowly
                if (scene.children.length > 3) {
                    scene.children[3].rotation.y += 0.01;
                }

                renderer.render(scene, camera);
            };

            animate();

            // Store for cleanup
            this.viewer3D = { scene, camera, renderer, container };

            console.log('3D demo scene created successfully');

        } catch (error) {
            console.error('Error creating 3D scene:', error);
            placeholder.style.display = 'block';
            placeholder.innerHTML = `
                <i class="fas fa-cube" style="font-size: 48px; margin-bottom: 10px; display: block; color: #ff4444;"></i>
                <p>3D Model Error</p>
                <p style="font-size: 12px; opacity: 0.7;">${error.message}</p>
            `;
        }
    }

    createDemoFurniture(scene) {
        // Create a simple sofa representation
        const group = new THREE.Group();

        // Sofa base
        const baseGeometry = new THREE.BoxGeometry(3, 0.5, 1.5);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.25;
        base.castShadow = true;
        group.add(base);

        // Sofa back
        const backGeometry = new THREE.BoxGeometry(3, 1.5, 0.3);
        const backMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const back = new THREE.Mesh(backGeometry, backMaterial);
        back.position.y = 1;
        back.position.z = -0.6;
        back.castShadow = true;
        group.add(back);

        // Sofa arms
        const armGeometry = new THREE.BoxGeometry(0.3, 1.2, 1.5);
        const armMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });

        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.x = -1.35;
        leftArm.position.y = 0.85;
        leftArm.castShadow = true;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.x = 1.35;
        rightArm.position.y = 0.85;
        rightArm.castShadow = true;
        group.add(rightArm);

        // Add some cushions
        for (let i = 0; i < 3; i++) {
            const cushionGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.8);
            const cushionMaterial = new THREE.MeshLambertMaterial({ color: 0x39FF14 });
            const cushion = new THREE.Mesh(cushionGeometry, cushionMaterial);
            cushion.position.x = (i - 1) * 0.9;
            cushion.position.y = 0.65;
            cushion.position.z = -0.1;
            cushion.castShadow = true;
            group.add(cushion);
        }

        // Add floor
        const floorGeometry = new THREE.PlaneGeometry(10, 10);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        scene.add(floor);

        scene.add(group);
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.style.color = '#ccc';
            btn.style.borderBottomColor = 'transparent';
        });

        const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.color = '#39FF14';
            activeBtn.style.borderBottomColor = '#39FF14';
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });

        const activeContent = document.getElementById(`${tabName}Tab`);
        if (activeContent) {
            activeContent.style.display = 'block';
        }
    }

    closeModal() {
        this.currentModal.style.display = 'none';

        // Clean up 3D viewer if active
        if (this.viewer3D) {
            this.viewer3D = null;
        }
    }

    viewInAR() {
        // Placeholder for AR functionality
        alert('AR functionality would be implemented here using WebXR or AR.js');

        // In a real implementation:
        // 1. Check for WebXR support
        // 2. Start AR session
        // 3. Place 3D model in AR space
        // 4. Allow user to position and scale object
    }

    // Method to be called from the enhanced hotspots system
    getObjectHotspots(scene) {
        return this.addObjectHotspots(scene);
    }

    // Method to add custom objects
    addObject(objectId, objectData) {
        this.objectDatabase.set(objectId, objectData);
        console.log('Added object:', objectId);
    }

    // Method to enable/disable object highlighting
    toggleObjectHighlighting(enabled) {
        this.isEnabled = enabled;
        console.log('Object highlighting', enabled ? 'enabled' : 'disabled');
    }
}

// Initialize the object highlight system
let objectHighlight3D;

console.log('Object Highlight 3D script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Object Highlight system...');
    try {
        objectHighlight3D = new ObjectHighlight3D();

        // Make it globally accessible
        window.objectHighlight3D = objectHighlight3D;

        console.log('Object Highlight & 3D Models system initialized successfully!');

        // Test the system
        console.log('Object database size:', objectHighlight3D.objectDatabase.size);
        console.log('System enabled:', objectHighlight3D.isEnabled);

    } catch (error) {
        console.error('Error initializing Object Highlight system:', error);
    }
});

// Also initialize if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('DOM still loading, waiting...');
} else {
    console.log('DOM already loaded, initializing immediately...');
    setTimeout(() => {
        if (!window.objectHighlight3D) {
            console.log('Initializing Object Highlight system (fallback)...');
            try {
                objectHighlight3D = new ObjectHighlight3D();
                window.objectHighlight3D = objectHighlight3D;
                console.log('Object Highlight system initialized via fallback');
            } catch (error) {
                console.error('Fallback initialization failed:', error);
            }
        }
    }, 100);
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ObjectHighlight3D;
}