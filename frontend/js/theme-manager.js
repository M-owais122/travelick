// Enhanced Branding and Theme Customization System

class ThemeManager {
    constructor() {
        this.currentTheme = 'default';
        this.customThemes = new Map();
        this.brandingConfig = {
            logo: null,
            logoPosition: 'top-left',
            companyName: '',
            primaryColor: '#39FF14',
            secondaryColor: '#2ecc71',
            accentColor: '#00bfff',
            backgroundColor: '#000000',
            textColor: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            customCSS: ''
        };
        this.whiteLabel = false;
        this.customLoadingScreen = null;
        this.init();
    }

    async init() {
        // Load saved branding configuration
        this.loadBrandingConfig();

        // Apply current theme
        this.applyTheme();

        // Create theme management UI
        this.createThemeUI();

        // Setup dynamic CSS variables
        this.setupCSSVariables();

        console.log('Theme Manager initialized');
    }

    // Theme Management
    getAvailableThemes() {
        return {
            'default': {
                name: 'Default Green',
                description: 'Original green theme with modern design',
                primaryColor: '#39FF14',
                secondaryColor: '#2ecc71',
                accentColor: '#00bfff',
                backgroundColor: '#000000',
                textColor: '#ffffff'
            },
            'blue': {
                name: 'Ocean Blue',
                description: 'Professional blue theme',
                primaryColor: '#007acc',
                secondaryColor: '#0099cc',
                accentColor: '#33ccff',
                backgroundColor: '#001122',
                textColor: '#ffffff'
            },
            'purple': {
                name: 'Royal Purple',
                description: 'Elegant purple theme',
                primaryColor: '#8a2be2',
                secondaryColor: '#9932cc',
                accentColor: '#ba55d3',
                backgroundColor: '#120022',
                textColor: '#ffffff'
            },
            'orange': {
                name: 'Sunset Orange',
                description: 'Warm orange theme',
                primaryColor: '#ff6600',
                secondaryColor: '#ff8533',
                accentColor: '#ffaa66',
                backgroundColor: '#221100',
                textColor: '#ffffff'
            },
            'red': {
                name: 'Crimson Red',
                description: 'Bold red theme',
                primaryColor: '#dc143c',
                secondaryColor: '#ff1493',
                accentColor: '#ff69b4',
                backgroundColor: '#220011',
                textColor: '#ffffff'
            },
            'dark': {
                name: 'Dark Professional',
                description: 'Sleek dark theme',
                primaryColor: '#444444',
                secondaryColor: '#666666',
                accentColor: '#888888',
                backgroundColor: '#111111',
                textColor: '#ffffff'
            },
            'light': {
                name: 'Light Professional',
                description: 'Clean light theme',
                primaryColor: '#2196f3',
                secondaryColor: '#1976d2',
                accentColor: '#0d47a1',
                backgroundColor: '#ffffff',
                textColor: '#333333'
            }
        };
    }

    setTheme(themeId) {
        const themes = this.getAvailableThemes();
        const customTheme = this.customThemes.get(themeId);

        if (!themes[themeId] && !customTheme) {
            console.warn(`Theme ${themeId} not found`);
            return false;
        }

        this.currentTheme = themeId;

        // Update branding config with theme colors
        const theme = themes[themeId] || customTheme;
        Object.assign(this.brandingConfig, theme);

        this.applyTheme();
        this.saveBrandingConfig();

        // Emit theme change event
        document.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { themeId, theme }
        }));

        return true;
    }

    applyTheme() {
        // Apply CSS variables
        this.updateCSSVariables();

        // Apply custom CSS
        this.applyCustomCSS();

        // Update logo and branding
        this.updateBranding();

        // Apply loading screen customization
        this.updateLoadingScreen();

        // Update meta theme color
        this.updateMetaThemeColor();
    }

    // Branding Configuration
    setBrandingConfig(config) {
        Object.assign(this.brandingConfig, config);
        this.applyTheme();
        this.saveBrandingConfig();
    }

    getBrandingConfig() {
        return { ...this.brandingConfig };
    }

    setLogo(logoUrl, position = 'top-left') {
        this.brandingConfig.logo = logoUrl;
        this.brandingConfig.logoPosition = position;
        this.updateLogo();
        this.saveBrandingConfig();
    }

    setCompanyName(name) {
        this.brandingConfig.companyName = name;
        this.updateCompanyName();
        this.saveBrandingConfig();
    }

    enableWhiteLabel(enabled = true) {
        this.whiteLabel = enabled;
        this.updateWhiteLabeling();
        this.saveBrandingConfig();
    }

    // Custom CSS
    setCustomCSS(css) {
        this.brandingConfig.customCSS = css;
        this.applyCustomCSS();
        this.saveBrandingConfig();
    }

    applyCustomCSS() {
        // Remove existing custom styles
        const existingStyle = document.getElementById('customThemeStyles');
        if (existingStyle) {
            existingStyle.remove();
        }

        // Add new custom styles
        if (this.brandingConfig.customCSS) {
            const style = document.createElement('style');
            style.id = 'customThemeStyles';
            style.textContent = this.brandingConfig.customCSS;
            document.head.appendChild(style);
        }
    }

    // CSS Variables Management
    setupCSSVariables() {
        // Define CSS custom properties for theming
        const root = document.documentElement;

        root.style.setProperty('--primary-color', this.brandingConfig.primaryColor);
        root.style.setProperty('--secondary-color', this.brandingConfig.secondaryColor);
        root.style.setProperty('--accent-color', this.brandingConfig.accentColor);
        root.style.setProperty('--background-color', this.brandingConfig.backgroundColor);
        root.style.setProperty('--text-color', this.brandingConfig.textColor);
        root.style.setProperty('--font-family', this.brandingConfig.fontFamily);
    }

    updateCSSVariables() {
        const root = document.documentElement;

        root.style.setProperty('--primary-color', this.brandingConfig.primaryColor);
        root.style.setProperty('--secondary-color', this.brandingConfig.secondaryColor);
        root.style.setProperty('--accent-color', this.brandingConfig.accentColor);
        root.style.setProperty('--background-color', this.brandingConfig.backgroundColor);
        root.style.setProperty('--text-color', this.brandingConfig.textColor);
        root.style.setProperty('--font-family', this.brandingConfig.fontFamily);

        // Update specific elements that don't use CSS variables
        this.updateDirectStyles();
    }

    updateDirectStyles() {
        // Update elements that need direct style updates
        const elementsToUpdate = [
            { selector: '.toolbar button', property: 'border-color', value: this.brandingConfig.primaryColor },
            { selector: '.hotspot-scene', property: 'border-color', value: this.brandingConfig.primaryColor },
            { selector: '.scene-thumb.active', property: 'border-color', value: this.brandingConfig.primaryColor },
            { selector: '.btn-primary', property: 'background-color', value: this.brandingConfig.primaryColor },
            { selector: '.text-primary', property: 'color', value: this.brandingConfig.primaryColor }
        ];

        elementsToUpdate.forEach(({ selector, property, value }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style[property] = value;
            });
        });
    }

    // Logo and Branding Updates
    updateLogo() {
        if (!this.brandingConfig.logo) return;

        // Remove existing logos
        const existingLogos = document.querySelectorAll('.custom-logo');
        existingLogos.forEach(logo => logo.remove());

        // Create logo element
        const logo = document.createElement('div');
        logo.className = 'custom-logo';
        logo.innerHTML = `
            <img src="${this.brandingConfig.logo}" alt="Logo" style="
                max-height: 60px;
                max-width: 200px;
                height: auto;
                width: auto;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
            ">
        `;

        // Position logo based on configuration
        this.positionLogo(logo);

        document.body.appendChild(logo);
    }

    positionLogo(logoElement) {
        const positions = {
            'top-left': { top: '20px', left: '20px' },
            'top-right': { top: '20px', right: '20px' },
            'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%)' },
            'bottom-left': { bottom: '80px', left: '20px' },
            'bottom-right': { bottom: '80px', right: '20px' },
            'bottom-center': { bottom: '80px', left: '50%', transform: 'translateX(-50%)' }
        };

        const position = positions[this.brandingConfig.logoPosition] || positions['top-left'];

        logoElement.style.cssText = `
            position: fixed;
            z-index: 1500;
            ${Object.entries(position).map(([key, value]) => `${key}: ${value}`).join('; ')};
        `;
    }

    updateCompanyName() {
        // Update company name in various places
        const titleElements = document.querySelectorAll('[data-brand="title"]');
        titleElements.forEach(element => {
            element.textContent = this.brandingConfig.companyName || element.textContent;
        });

        // Update page title
        if (this.brandingConfig.companyName) {
            document.title = `${currentTour?.title || 'Virtual Tour'} - ${this.brandingConfig.companyName}`;
        }
    }

    updateWhiteLabeling() {
        // Hide/show Claude Code branding
        const brandingElements = document.querySelectorAll('.claude-branding, [data-claude-brand]');
        brandingElements.forEach(element => {
            element.style.display = this.whiteLabel ? 'none' : '';
        });

        // Remove "Powered by Claude Code" text
        if (this.whiteLabel) {
            const poweredByText = document.querySelectorAll('*');
            poweredByText.forEach(element => {
                if (element.textContent && element.textContent.includes('Claude Code')) {
                    element.style.display = 'none';
                }
            });
        }
    }

    // Loading Screen Customization
    setCustomLoadingScreen(config) {
        this.customLoadingScreen = {
            background: config.background || this.brandingConfig.backgroundColor,
            logo: config.logo || this.brandingConfig.logo,
            text: config.text || 'Loading Virtual Tour...',
            textColor: config.textColor || this.brandingConfig.textColor,
            spinnerColor: config.spinnerColor || this.brandingConfig.primaryColor,
            ...config
        };

        this.updateLoadingScreen();
    }

    updateLoadingScreen() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (!loadingOverlay || !this.customLoadingScreen) return;

        loadingOverlay.style.background = this.customLoadingScreen.background;

        const content = loadingOverlay.querySelector('.text-center');
        if (content) {
            content.innerHTML = `
                ${this.customLoadingScreen.logo ? `<img src="${this.customLoadingScreen.logo}" alt="Logo" style="max-height: 80px; margin-bottom: 20px;">` : ''}
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2" style="border-color: ${this.customLoadingScreen.spinnerColor};"></div>
                <p style="color: ${this.customLoadingScreen.textColor}; margin-top: 16px;">${this.customLoadingScreen.text}</p>
            `;
        }
    }

    updateMetaThemeColor() {
        // Update meta theme-color for mobile browsers
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = this.brandingConfig.primaryColor;
    }

    // Theme Management UI
    createThemeUI() {
        // Add theme selector to toolbar
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar || document.getElementById('themeSelector')) return;

        const themeSelector = document.createElement('div');
        themeSelector.id = 'themeSelector';
        themeSelector.style.cssText = 'position: relative; display: inline-block;';

        const themeBtn = document.createElement('button');
        themeBtn.onclick = () => this.toggleThemeMenu();
        themeBtn.title = 'Change Theme';
        themeBtn.innerHTML = '<i class="fas fa-palette"></i>';

        const themeMenu = document.createElement('div');
        themeMenu.id = 'themeMenu';
        themeMenu.style.cssText = `
            display: none;
            position: absolute;
            bottom: 60px;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 15px;
            min-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            color: white;
        `;

        this.populateThemeMenu(themeMenu);

        themeSelector.appendChild(themeBtn);
        themeSelector.appendChild(themeMenu);
        toolbar.appendChild(themeSelector);

        // Create advanced theme customizer
        this.createAdvancedThemeCustomizer();
    }

    populateThemeMenu(menu) {
        const themes = this.getAvailableThemes();

        menu.innerHTML = `
            <div style="margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #444;">
                <h4 style="margin: 0 0 10px 0; color: ${this.brandingConfig.primaryColor};">Theme Selection</h4>
            </div>
        `;

        // Theme grid
        const themeGrid = document.createElement('div');
        themeGrid.style.cssText = 'display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 15px;';

        for (const [themeId, theme] of Object.entries(themes)) {
            const themeItem = document.createElement('div');
            themeItem.style.cssText = `
                padding: 10px;
                border: 2px solid ${themeId === this.currentTheme ? this.brandingConfig.primaryColor : 'transparent'};
                border-radius: 6px;
                cursor: pointer;
                background: linear-gradient(90deg, ${theme.primaryColor}22, ${theme.secondaryColor}22);
                transition: all 0.3s ease;
                position: relative;
            `;

            themeItem.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div style="width: 20px; height: 20px; background: ${theme.primaryColor}; border-radius: 3px; margin-right: 8px;"></div>
                    <div style="width: 16px; height: 16px; background: ${theme.secondaryColor}; border-radius: 3px; margin-right: 8px;"></div>
                    <div style="width: 12px; height: 12px; background: ${theme.accentColor}; border-radius: 3px; margin-right: 8px;"></div>
                    <strong style="flex: 1;">${theme.name}</strong>
                    ${themeId === this.currentTheme ? '<i class="fas fa-check" style="color: ' + this.brandingConfig.primaryColor + ';"></i>' : ''}
                </div>
                <div style="font-size: 12px; opacity: 0.8;">${theme.description}</div>
            `;

            themeItem.onmouseover = () => {
                if (themeId !== this.currentTheme) {
                    themeItem.style.borderColor = '#666';
                }
            };

            themeItem.onmouseout = () => {
                if (themeId !== this.currentTheme) {
                    themeItem.style.borderColor = 'transparent';
                }
            };

            themeItem.onclick = () => {
                this.setTheme(themeId);
                this.hideThemeMenu();
                this.updateThemeMenu();
            };

            themeGrid.appendChild(themeItem);
        }

        menu.appendChild(themeGrid);

        // Advanced customization button
        const advancedBtn = document.createElement('button');
        advancedBtn.style.cssText = `
            width: 100%;
            padding: 8px;
            background: ${this.brandingConfig.primaryColor};
            color: black;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            margin-top: 10px;
        `;
        advancedBtn.textContent = 'Advanced Customization';
        advancedBtn.onclick = () => {
            this.hideThemeMenu();
            this.showAdvancedThemeCustomizer();
        };

        menu.appendChild(advancedBtn);
    }

    createAdvancedThemeCustomizer() {
        const modal = document.createElement('div');
        modal.id = 'advancedThemeModal';
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <h3 class="text-xl font-bold mb-4">
                    <i class="fas fa-palette mr-2 text-primary"></i>Advanced Theme Customization
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Color Customization -->
                    <div>
                        <h4 class="font-bold mb-3">Colors</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium mb-1">Primary Color</label>
                                <div class="flex gap-2">
                                    <input type="color" id="primaryColorPicker" class="w-12 h-8 border rounded">
                                    <input type="text" id="primaryColorText" class="flex-1 px-2 py-1 border rounded text-sm">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Secondary Color</label>
                                <div class="flex gap-2">
                                    <input type="color" id="secondaryColorPicker" class="w-12 h-8 border rounded">
                                    <input type="text" id="secondaryColorText" class="flex-1 px-2 py-1 border rounded text-sm">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Accent Color</label>
                                <div class="flex gap-2">
                                    <input type="color" id="accentColorPicker" class="w-12 h-8 border rounded">
                                    <input type="text" id="accentColorText" class="flex-1 px-2 py-1 border rounded text-sm">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Branding -->
                    <div>
                        <h4 class="font-bold mb-3">Branding</h4>
                        <div class="space-y-3">
                            <div>
                                <label class="block text-sm font-medium mb-1">Company Name</label>
                                <input type="text" id="companyNameInput" class="w-full px-2 py-1 border rounded text-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Logo URL</label>
                                <input type="url" id="logoUrlInput" class="w-full px-2 py-1 border rounded text-sm">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Logo Position</label>
                                <select id="logoPositionSelect" class="w-full px-2 py-1 border rounded text-sm">
                                    <option value="top-left">Top Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="top-center">Top Center</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="bottom-center">Bottom Center</option>
                                </select>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="checkbox" id="whiteLabelCheck" class="mr-2">
                                    <span class="text-sm">Enable White Label (Hide Claude Code branding)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Custom CSS -->
                <div class="mt-6">
                    <h4 class="font-bold mb-3">Custom CSS</h4>
                    <textarea id="customCSSInput" rows="8" placeholder="Enter custom CSS rules..."
                              class="w-full px-3 py-2 border rounded text-sm font-mono"></textarea>
                </div>

                <!-- Preview -->
                <div class="mt-6">
                    <h4 class="font-bold mb-3">Preview</h4>
                    <div id="themePreview" style="
                        padding: 20px;
                        border-radius: 8px;
                        background: var(--background-color);
                        border: 2px solid var(--primary-color);
                    ">
                        <div style="color: var(--primary-color); font-weight: bold; margin-bottom: 10px;">
                            Primary Color Preview
                        </div>
                        <div style="color: var(--secondary-color); margin-bottom: 10px;">
                            Secondary Color Preview
                        </div>
                        <div style="color: var(--accent-color); margin-bottom: 10px;">
                            Accent Color Preview
                        </div>
                        <button style="
                            background: var(--primary-color);
                            color: black;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            margin-right: 10px;
                        ">Primary Button</button>
                        <button style="
                            background: var(--secondary-color);
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                        ">Secondary Button</button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-between mt-6">
                    <div class="flex gap-2">
                        <button onclick="themeManager.saveTheme()" class="bg-primary text-black px-4 py-2 rounded-lg">
                            Save Theme
                        </button>
                        <button onclick="themeManager.exportTheme()" class="border px-4 py-2 rounded-lg">
                            Export
                        </button>
                        <button onclick="themeManager.importTheme()" class="border px-4 py-2 rounded-lg">
                            Import
                        </button>
                    </div>
                    <button onclick="themeManager.closeAdvancedThemeCustomizer()" class="bg-gray-500 text-white px-4 py-2 rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupAdvancedThemeControls();
    }

    setupAdvancedThemeControls() {
        // Color pickers
        const colorControls = [
            { picker: 'primaryColorPicker', text: 'primaryColorText', config: 'primaryColor' },
            { picker: 'secondaryColorPicker', text: 'secondaryColorText', config: 'secondaryColor' },
            { picker: 'accentColorPicker', text: 'accentColorText', config: 'accentColor' }
        ];

        colorControls.forEach(({ picker, text, config }) => {
            const pickerElement = document.getElementById(picker);
            const textElement = document.getElementById(text);

            if (pickerElement && textElement) {
                // Set initial values
                pickerElement.value = this.brandingConfig[config];
                textElement.value = this.brandingConfig[config];

                // Sync picker and text
                pickerElement.addEventListener('input', (e) => {
                    textElement.value = e.target.value;
                    this.updatePreviewColor(config, e.target.value);
                });

                textElement.addEventListener('input', (e) => {
                    if (this.isValidColor(e.target.value)) {
                        pickerElement.value = e.target.value;
                        this.updatePreviewColor(config, e.target.value);
                    }
                });
            }
        });

        // Other controls
        const companyNameInput = document.getElementById('companyNameInput');
        if (companyNameInput) {
            companyNameInput.value = this.brandingConfig.companyName;
        }

        const logoUrlInput = document.getElementById('logoUrlInput');
        if (logoUrlInput) {
            logoUrlInput.value = this.brandingConfig.logo || '';
        }

        const logoPositionSelect = document.getElementById('logoPositionSelect');
        if (logoPositionSelect) {
            logoPositionSelect.value = this.brandingConfig.logoPosition;
        }

        const whiteLabelCheck = document.getElementById('whiteLabelCheck');
        if (whiteLabelCheck) {
            whiteLabelCheck.checked = this.whiteLabel;
        }

        const customCSSInput = document.getElementById('customCSSInput');
        if (customCSSInput) {
            customCSSInput.value = this.brandingConfig.customCSS || '';
        }
    }

    updatePreviewColor(property, color) {
        const preview = document.getElementById('themePreview');
        if (preview) {
            preview.style.setProperty(`--${property.replace(/([A-Z])/g, '-$1').toLowerCase()}`, color);
        }
    }

    isValidColor(color) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    }

    // Theme Import/Export
    exportTheme() {
        const themeData = {
            name: `Custom Theme ${Date.now()}`,
            config: this.getBrandingConfig(),
            whiteLabel: this.whiteLabel,
            customLoadingScreen: this.customLoadingScreen,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `theme-${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }

    importTheme() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const themeData = JSON.parse(text);

                if (themeData.config) {
                    this.setBrandingConfig(themeData.config);
                    this.whiteLabel = themeData.whiteLabel || false;
                    this.customLoadingScreen = themeData.customLoadingScreen;

                    this.applyTheme();
                    this.setupAdvancedThemeControls();

                    showNotification('Theme imported successfully!', 'success');
                }
            } catch (error) {
                console.error('Failed to import theme:', error);
                showNotification('Failed to import theme', 'error');
            }
        };

        input.click();
    }

    saveTheme() {
        // Collect values from form
        const config = {
            primaryColor: document.getElementById('primaryColorText')?.value || this.brandingConfig.primaryColor,
            secondaryColor: document.getElementById('secondaryColorText')?.value || this.brandingConfig.secondaryColor,
            accentColor: document.getElementById('accentColorText')?.value || this.brandingConfig.accentColor,
            companyName: document.getElementById('companyNameInput')?.value || '',
            logo: document.getElementById('logoUrlInput')?.value || null,
            logoPosition: document.getElementById('logoPositionSelect')?.value || 'top-left',
            customCSS: document.getElementById('customCSSInput')?.value || ''
        };

        const whiteLabelEnabled = document.getElementById('whiteLabelCheck')?.checked || false;

        this.setBrandingConfig(config);
        this.enableWhiteLabel(whiteLabelEnabled);

        showNotification('Theme saved successfully!', 'success');
    }

    // UI Control Functions
    toggleThemeMenu() {
        const menu = document.getElementById('themeMenu');
        if (menu) {
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
        }
    }

    hideThemeMenu() {
        const menu = document.getElementById('themeMenu');
        if (menu) {
            menu.style.display = 'none';
        }
    }

    updateThemeMenu() {
        const menu = document.getElementById('themeMenu');
        if (menu) {
            this.populateThemeMenu(menu);
        }
    }

    showAdvancedThemeCustomizer() {
        document.getElementById('advancedThemeModal').classList.add('active');
    }

    closeAdvancedThemeCustomizer() {
        document.getElementById('advancedThemeModal').classList.remove('active');
    }

    // Storage Functions
    saveBrandingConfig() {
        const config = {
            brandingConfig: this.brandingConfig,
            currentTheme: this.currentTheme,
            whiteLabel: this.whiteLabel,
            customLoadingScreen: this.customLoadingScreen,
            customThemes: Object.fromEntries(this.customThemes)
        };

        localStorage.setItem('themeConfig', JSON.stringify(config));
    }

    loadBrandingConfig() {
        try {
            const saved = localStorage.getItem('themeConfig');
            if (saved) {
                const config = JSON.parse(saved);
                this.brandingConfig = { ...this.brandingConfig, ...config.brandingConfig };
                this.currentTheme = config.currentTheme || 'default';
                this.whiteLabel = config.whiteLabel || false;
                this.customLoadingScreen = config.customLoadingScreen;
                this.customThemes = new Map(Object.entries(config.customThemes || {}));
            }
        } catch (error) {
            console.warn('Failed to load theme configuration:', error);
        }
    }

    // Public API
    getCurrentTheme() {
        return this.currentTheme;
    }

    resetToDefault() {
        this.currentTheme = 'default';
        this.brandingConfig = {
            logo: null,
            logoPosition: 'top-left',
            companyName: '',
            primaryColor: '#39FF14',
            secondaryColor: '#2ecc71',
            accentColor: '#00bfff',
            backgroundColor: '#000000',
            textColor: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            customCSS: ''
        };
        this.whiteLabel = false;
        this.customLoadingScreen = null;

        this.applyTheme();
        this.saveBrandingConfig();
    }
}

// Initialize global theme manager
const themeManager = new ThemeManager();

// Integration with existing systems
if (typeof window !== 'undefined') {
    window.themeManager = themeManager;
}

// Auto-hide theme menu on outside click
document.addEventListener('click', (e) => {
    const themeSelector = document.getElementById('themeSelector');
    if (themeSelector && !themeSelector.contains(e.target)) {
        themeManager.hideThemeMenu();
    }
});

console.log('Theme Manager loaded');