// Multi-language Support System (i18n)

class I18nManager {
    constructor() {
        this.currentLanguage = 'en';
        this.translations = new Map();
        this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        this.defaultLanguage = 'en';
        this.fallbackTranslations = new Map();
        this.loadingPromises = new Map();
        this.init();
    }

    async init() {
        // Load default translations
        await this.loadTranslations('en');

        // Detect user language
        const userLang = this.detectUserLanguage();

        // Load user language if different from default
        if (userLang !== 'en') {
            await this.setLanguage(userLang);
        }

        this.createLanguageSelector();
        console.log('I18n Manager initialized with language:', this.currentLanguage);
    }

    // Language Detection
    detectUserLanguage() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && this.isLanguageSupported(urlLang)) {
            return urlLang;
        }

        // Check localStorage
        const savedLang = localStorage.getItem('selectedLanguage');
        if (savedLang && this.isLanguageSupported(savedLang)) {
            return savedLang;
        }

        // Check browser language
        const browserLang = navigator.language || navigator.languages[0];
        const shortLang = browserLang.split('-')[0];

        if (this.isLanguageSupported(shortLang)) {
            return shortLang;
        }

        return this.defaultLanguage;
    }

    // Supported Languages Configuration
    getSupportedLanguages() {
        return {
            'en': { name: 'English', nativeName: 'English', flag: '🇺🇸' },
            'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
            'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
            'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
            'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
            'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
            'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
            'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
            'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
            'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
            'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
            'he': { name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
            'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
            'th': { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
            'tr': { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' }
        };
    }

    isLanguageSupported(lang) {
        return Object.keys(this.getSupportedLanguages()).includes(lang);
    }

    // Translation Loading
    async loadTranslations(lang) {
        if (this.translations.has(lang)) {
            return this.translations.get(lang);
        }

        // Check if already loading
        if (this.loadingPromises.has(lang)) {
            return this.loadingPromises.get(lang);
        }

        const loadPromise = this.fetchTranslations(lang);
        this.loadingPromises.set(lang, loadPromise);

        try {
            const translations = await loadPromise;
            this.translations.set(lang, translations);
            return translations;
        } catch (error) {
            console.error(`Failed to load translations for ${lang}:`, error);
            this.loadingPromises.delete(lang);
            return this.getDefaultTranslations();
        }
    }

    async fetchTranslations(lang) {
        try {
            // Try to load from server first
            const response = await fetch(`/locales/${lang}.json`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log(`Server translations not available for ${lang}, using embedded`);
        }

        // Fallback to embedded translations
        return this.getEmbeddedTranslations(lang);
    }

    // Default/Embedded Translations
    getDefaultTranslations() {
        return {
            // UI Elements
            'loading': 'Loading...',
            'error': 'Error',
            'success': 'Success',
            'close': 'Close',
            'cancel': 'Cancel',
            'ok': 'OK',
            'yes': 'Yes',
            'no': 'No',
            'back': 'Back',
            'next': 'Next',
            'previous': 'Previous',
            'save': 'Save',
            'delete': 'Delete',
            'edit': 'Edit',
            'view': 'View',
            'share': 'Share',
            'download': 'Download',

            // VR Tour Specific
            'tour.title': 'Virtual Tour',
            'tour.loading': 'Loading Virtual Tour...',
            'tour.error': 'Failed to load tour',
            'tour.scene': 'Scene',
            'tour.scenes': 'Scenes',
            'tour.hotspot': 'Point of Interest',
            'tour.hotspots': 'Points of Interest',
            'tour.navigate': 'Navigate',
            'tour.explore': 'Explore',
            'tour.information': 'Information',
            'tour.gallery': 'Gallery',
            'tour.video': 'Video',
            'tour.audio': 'Audio',

            // Controls
            'controls.autoRotate': 'Auto Rotate',
            'controls.fullscreen': 'Fullscreen',
            'controls.vr': 'VR Mode',
            'controls.map': 'Map View',
            'controls.sound': 'Sound',
            'controls.mute': 'Mute',
            'controls.unmute': 'Unmute',
            'controls.play': 'Play',
            'controls.pause': 'Pause',
            'controls.stop': 'Stop',

            // VR Messages
            'vr.activated': 'VR Mode Activated!',
            'vr.deactivated': 'VR Mode Deactivated',
            'vr.unsupported': 'VR not supported on this device',
            'vr.instructions': 'Put on your VR headset or rotate your device to look around',
            'vr.requirements': 'VR Mode Requirements',

            // Share & Social
            'share.title': 'Share This Tour',
            'share.link': 'Direct Link',
            'share.embed': 'Embed Code',
            'share.copied': 'Copied to clipboard!',
            'share.social': 'Share on Social Media',

            // Gallery
            'gallery.title': 'Image Gallery',
            'gallery.previous': 'Previous Image',
            'gallery.next': 'Next Image',
            'gallery.of': 'of',

            // Comments
            'comments.title': 'Comments & Reviews',
            'comments.add': 'Add Comment',
            'comments.placeholder': 'Share your thoughts about this tour...',
            'comments.empty': 'No comments yet. Be the first to share your thoughts!',
            'comments.added': 'Comment added successfully!',

            // Audio
            'audio.narration': 'Narration',
            'audio.backgroundMusic': 'Background Music',
            'audio.soundEffects': 'Sound Effects',
            'audio.volume': 'Volume',
            'audio.playing': 'Playing audio clip',

            // Errors
            'error.tourNotFound': 'Tour not found',
            'error.sceneNotFound': 'Scene not found',
            'error.connectionFailed': 'Connection failed',
            'error.mediaLoadFailed': 'Failed to load media',

            // Time
            'time.justNow': 'Just now',
            'time.minuteAgo': 'A minute ago',
            'time.minutesAgo': '{0} minutes ago',
            'time.hourAgo': 'An hour ago',
            'time.hoursAgo': '{0} hours ago',
            'time.dayAgo': 'A day ago',
            'time.daysAgo': '{0} days ago',

            // Numbers
            'number.first': 'First',
            'number.second': 'Second',
            'number.third': 'Third',
            'number.last': 'Last'
        };
    }

    getEmbeddedTranslations(lang) {
        const baseTranslations = this.getDefaultTranslations();

        // Language-specific overrides
        const overrides = {
            'es': {
                'loading': 'Cargando...',
                'error': 'Error',
                'success': 'Éxito',
                'close': 'Cerrar',
                'tour.title': 'Recorrido Virtual',
                'tour.loading': 'Cargando Recorrido Virtual...',
                'controls.autoRotate': 'Rotación Automática',
                'controls.fullscreen': 'Pantalla Completa',
                'controls.vr': 'Modo VR',
                'vr.activated': '¡Modo VR Activado!',
                'share.title': 'Compartir Este Recorrido'
            },
            'fr': {
                'loading': 'Chargement...',
                'error': 'Erreur',
                'success': 'Succès',
                'close': 'Fermer',
                'tour.title': 'Visite Virtuelle',
                'tour.loading': 'Chargement de la Visite Virtuelle...',
                'controls.autoRotate': 'Rotation Automatique',
                'controls.fullscreen': 'Plein Écran',
                'controls.vr': 'Mode VR',
                'vr.activated': 'Mode VR Activé!',
                'share.title': 'Partager Cette Visite'
            },
            'de': {
                'loading': 'Laden...',
                'error': 'Fehler',
                'success': 'Erfolg',
                'close': 'Schließen',
                'tour.title': 'Virtuelle Tour',
                'tour.loading': 'Virtuelle Tour wird geladen...',
                'controls.autoRotate': 'Auto-Rotation',
                'controls.fullscreen': 'Vollbild',
                'controls.vr': 'VR-Modus',
                'vr.activated': 'VR-Modus Aktiviert!',
                'share.title': 'Diese Tour Teilen'
            },
            'zh': {
                'loading': '加载中...',
                'error': '错误',
                'success': '成功',
                'close': '关闭',
                'tour.title': '虚拟导览',
                'tour.loading': '正在加载虚拟导览...',
                'controls.autoRotate': '自动旋转',
                'controls.fullscreen': '全屏',
                'controls.vr': 'VR模式',
                'vr.activated': 'VR模式已激活！',
                'share.title': '分享此导览'
            },
            'ar': {
                'loading': 'جاري التحميل...',
                'error': 'خطأ',
                'success': 'نجح',
                'close': 'إغلاق',
                'tour.title': 'جولة افتراضية',
                'tour.loading': 'جاري تحميل الجولة الافتراضية...',
                'controls.autoRotate': 'دوران تلقائي',
                'controls.fullscreen': 'ملء الشاشة',
                'controls.vr': 'وضع الواقع الافتراضي',
                'vr.activated': 'تم تفعيل وضع الواقع الافتراضي!',
                'share.title': 'مشاركة هذه الجولة'
            }
        };

        return { ...baseTranslations, ...(overrides[lang] || {}) };
    }

    // Language Switching
    async setLanguage(lang) {
        if (!this.isLanguageSupported(lang)) {
            console.warn(`Language ${lang} not supported`);
            return false;
        }

        if (lang === this.currentLanguage) {
            return true;
        }

        // Load translations for the new language
        await this.loadTranslations(lang);

        const oldLanguage = this.currentLanguage;
        this.currentLanguage = lang;

        // Save preference
        localStorage.setItem('selectedLanguage', lang);

        // Update URL parameter
        this.updateUrlParameter('lang', lang);

        // Apply RTL if needed
        this.handleDirectionChange(oldLanguage, lang);

        // Update all UI elements
        this.updateAllTranslations();

        // Update language selector
        this.updateLanguageSelector();

        // Update audio narration language
        if (typeof audioManager !== 'undefined') {
            audioManager.setNarrationLanguage(lang);
        }

        // Emit language change event
        this.emitLanguageChangeEvent(oldLanguage, lang);

        console.log(`Language changed from ${oldLanguage} to ${lang}`);
        return true;
    }

    // Translation Functions
    t(key, params = []) {
        const currentTranslations = this.translations.get(this.currentLanguage) || this.getDefaultTranslations();

        let translation = currentTranslations[key];

        // Fallback to default language if translation not found
        if (!translation && this.currentLanguage !== this.defaultLanguage) {
            const defaultTranslations = this.translations.get(this.defaultLanguage) || this.getDefaultTranslations();
            translation = defaultTranslations[key];
        }

        // Last resort: return key
        if (!translation) {
            console.warn(`Translation not found for key: ${key}`);
            return key;
        }

        // Parameter substitution
        if (params.length > 0) {
            translation = this.substituteParameters(translation, params);
        }

        return translation;
    }

    substituteParameters(text, params) {
        return text.replace(/\{(\d+)\}/g, (match, index) => {
            const paramIndex = parseInt(index);
            return params[paramIndex] !== undefined ? params[paramIndex] : match;
        });
    }

    // RTL Support
    handleDirectionChange(oldLang, newLang) {
        const wasRTL = this.rtlLanguages.includes(oldLang);
        const isRTL = this.rtlLanguages.includes(newLang);

        if (wasRTL !== isRTL) {
            document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
            document.documentElement.classList.toggle('rtl', isRTL);

            // Update CSS custom properties for RTL
            if (isRTL) {
                document.documentElement.style.setProperty('--text-align', 'right');
                document.documentElement.style.setProperty('--flex-direction', 'row-reverse');
            } else {
                document.documentElement.style.setProperty('--text-align', 'left');
                document.documentElement.style.setProperty('--flex-direction', 'row');
            }
        }
    }

    // UI Updates
    updateAllTranslations() {
        // Update elements with data-i18n attribute
        const i18nElements = document.querySelectorAll('[data-i18n]');
        i18nElements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translatedText = this.t(key);

            // Update different attributes based on element type
            if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translatedText;
            } else if (element.tagName === 'INPUT' && element.placeholder !== undefined) {
                element.placeholder = translatedText;
            } else if (element.title !== undefined) {
                element.title = translatedText;
            } else {
                element.textContent = translatedText;
            }
        });

        // Update specific UI elements
        this.updateTourTitle();
        this.updateSceneTitle();
        this.updateControlLabels();
    }

    updateTourTitle() {
        if (currentTour && currentTour.translations && currentTour.translations[this.currentLanguage]) {
            const tourTitle = document.getElementById('tourTitle');
            if (tourTitle) {
                tourTitle.textContent = currentTour.translations[this.currentLanguage].title || currentTour.title;
            }
        }
    }

    updateSceneTitle() {
        if (currentScene && currentScene.translations && currentScene.translations[this.currentLanguage]) {
            const sceneTitle = document.getElementById('sceneTitle');
            if (sceneTitle) {
                sceneTitle.textContent = currentScene.translations[this.currentLanguage].title || currentScene.title;
            }
        }
    }

    updateControlLabels() {
        const controls = {
            'autoRotateBtn': 'controls.autoRotate',
            'vrBtn': 'controls.vr',
            'mapBtn': 'controls.map',
            'soundBtn': 'controls.sound'
        };

        for (const [elementId, translationKey] of Object.entries(controls)) {
            const element = document.getElementById(elementId);
            if (element) {
                element.title = this.t(translationKey);
            }
        }
    }

    // Language Selector UI
    createLanguageSelector() {
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar || document.getElementById('languageSelector')) return;

        const languageSelector = document.createElement('div');
        languageSelector.id = 'languageSelector';
        languageSelector.style.cssText = 'position: relative; display: inline-block;';

        const languageBtn = document.createElement('button');
        languageBtn.onclick = () => this.toggleLanguageMenu();
        languageBtn.title = 'Change Language';
        languageBtn.innerHTML = '<i class="fas fa-globe"></i>';

        const languageMenu = document.createElement('div');
        languageMenu.id = 'languageMenu';
        languageMenu.style.cssText = `
            display: none;
            position: absolute;
            bottom: 60px;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 8px;
            padding: 10px;
            min-width: 200px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
        `;

        this.populateLanguageMenu(languageMenu);

        languageSelector.appendChild(languageBtn);
        languageSelector.appendChild(languageMenu);
        toolbar.appendChild(languageSelector);
    }

    populateLanguageMenu(menu) {
        const languages = this.getSupportedLanguages();

        for (const [code, info] of Object.entries(languages)) {
            const languageItem = document.createElement('div');
            languageItem.style.cssText = `
                padding: 8px 12px;
                color: white;
                cursor: pointer;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                transition: background 0.3s ease;
            `;

            languageItem.innerHTML = `
                <span>${info.flag} ${info.nativeName}</span>
                ${code === this.currentLanguage ? '<i class="fas fa-check" style="color: #39FF14;"></i>' : ''}
            `;

            languageItem.onmouseover = () => languageItem.style.background = 'rgba(57, 255, 20, 0.2)';
            languageItem.onmouseout = () => languageItem.style.background = 'transparent';

            languageItem.onclick = async () => {
                await this.setLanguage(code);
                this.hideLanguageMenu();
            };

            menu.appendChild(languageItem);
        }
    }

    toggleLanguageMenu() {
        const menu = document.getElementById('languageMenu');
        if (menu) {
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
        }
    }

    hideLanguageMenu() {
        const menu = document.getElementById('languageMenu');
        if (menu) {
            menu.style.display = 'none';
        }
    }

    updateLanguageSelector() {
        const menu = document.getElementById('languageMenu');
        if (menu) {
            // Clear and repopulate to update checkmarks
            menu.innerHTML = '';
            this.populateLanguageMenu(menu);
        }
    }

    // Utility Functions
    updateUrlParameter(param, value) {
        const url = new URL(window.location.href);
        url.searchParams.set(param, value);
        window.history.replaceState({}, '', url.toString());
    }

    emitLanguageChangeEvent(oldLang, newLang) {
        const event = new CustomEvent('languageChanged', {
            detail: { oldLanguage: oldLang, newLanguage: newLang }
        });
        document.dispatchEvent(event);
    }

    // Tour Content Translation
    translateTourContent(tour) {
        if (!tour.translations || !tour.translations[this.currentLanguage]) {
            return tour;
        }

        const translation = tour.translations[this.currentLanguage];

        return {
            ...tour,
            title: translation.title || tour.title,
            description: translation.description || tour.description,
            scenes: tour.scenes.map(scene => this.translateSceneContent(scene))
        };
    }

    translateSceneContent(scene) {
        if (!scene.translations || !scene.translations[this.currentLanguage]) {
            return scene;
        }

        const translation = scene.translations[this.currentLanguage];

        return {
            ...scene,
            title: translation.title || scene.title,
            description: translation.description || scene.description,
            hotspots: scene.hotspots.map(hotspot => this.translateHotspotContent(hotspot))
        };
    }

    translateHotspotContent(hotspot) {
        if (!hotspot.translations || !hotspot.translations[this.currentLanguage]) {
            return hotspot;
        }

        const translation = hotspot.translations[this.currentLanguage];

        return {
            ...hotspot,
            text: translation.text || hotspot.text,
            title: translation.title || hotspot.title,
            description: translation.description || hotspot.description
        };
    }

    // Language Detection for Content
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getCurrentLanguageInfo() {
        return this.getSupportedLanguages()[this.currentLanguage];
    }

    isRTLLanguage(lang = this.currentLanguage) {
        return this.rtlLanguages.includes(lang);
    }
}

// Initialize global i18n manager
const i18nManager = new I18nManager();

// Global translation function
function t(key, params = []) {
    return i18nManager.t(key, params);
}

// Integration with existing systems
if (typeof window !== 'undefined') {
    window.i18nManager = i18nManager;
    window.t = t;
}

// Auto-hide language menu on outside click
document.addEventListener('click', (e) => {
    const languageSelector = document.getElementById('languageSelector');
    if (languageSelector && !languageSelector.contains(e.target)) {
        i18nManager.hideLanguageMenu();
    }
});

console.log('I18n Manager loaded');