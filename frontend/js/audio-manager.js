// Professional Audio Management System

class AudioManager {
    constructor() {
        this.backgroundMusic = null;
        this.soundEffects = new Map();
        this.spatialAudio = new Map();
        this.narration = null;
        this.volume = {
            master: 1.0,
            music: 0.6,
            effects: 0.8,
            narration: 1.0
        };
        this.isMuted = false;
        this.fadeInterval = null;
        this.spatialSupported = false;
        this.audioContext = null;
        this.init();
    }

    async init() {
        try {
            // Initialize Web Audio API for advanced features
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.spatialSupported = true;
            console.log('Audio Manager initialized with Web Audio API support');
        } catch (e) {
            console.log('Web Audio API not supported, using fallback');
        }

        this.loadSoundEffects();
        this.setupAudioControls();
        this.createAudioUI();
    }

    // Load default sound effects
    loadSoundEffects() {
        const defaultSounds = {
            'transition': '/audio/effects/transition.mp3',
            'info': '/audio/effects/info.mp3',
            'media': '/audio/effects/media.mp3',
            'interaction': '/audio/effects/interaction.mp3',
            'error': '/audio/effects/error.mp3',
            'success': '/audio/effects/success.mp3',
            'ambient': '/audio/ambient/'
        };

        // Preload commonly used sounds
        for (const [name, url] of Object.entries(defaultSounds)) {
            if (!url.endsWith('/')) {
                this.preloadSound(name, url);
            }
        }
    }

    // Preload audio files
    preloadSound(name, url) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = url;
        audio.volume = 0; // Silent preload

        audio.addEventListener('canplaythrough', () => {
            console.log(`Sound effect '${name}' preloaded successfully`);
        });

        audio.addEventListener('error', () => {
            console.log(`Failed to preload sound effect '${name}'`);
        });

        this.soundEffects.set(name, audio);
    }

    // Background Music Management
    async setBackgroundMusic(url, options = {}) {
        const {
            loop = true,
            fadeIn = true,
            fadeDuration = 2000,
            volume = this.volume.music
        } = options;

        // Stop existing music
        if (this.backgroundMusic) {
            await this.stopBackgroundMusic(fadeIn ? fadeDuration : 0);
        }

        if (!url) return;

        try {
            this.backgroundMusic = new Audio(url);
            this.backgroundMusic.loop = loop;
            this.backgroundMusic.volume = fadeIn ? 0 : volume * this.volume.master;

            await this.backgroundMusic.play();

            if (fadeIn) {
                this.fadeIn(this.backgroundMusic, volume * this.volume.master, fadeDuration);
            }

            console.log('Background music started:', url);

        } catch (error) {
            console.error('Failed to play background music:', error);
        }
    }

    async stopBackgroundMusic(fadeDuration = 1000) {
        if (!this.backgroundMusic) return;

        if (fadeDuration > 0) {
            await this.fadeOut(this.backgroundMusic, fadeDuration);
        } else {
            this.backgroundMusic.pause();
        }

        this.backgroundMusic = null;
    }

    // Sound Effects
    playSound(name, options = {}) {
        if (this.isMuted || !soundEnabled) return;

        const {
            volume = this.volume.effects,
            delay = 0,
            loop = false,
            pitch = 1.0
        } = options;

        // Use preloaded sound or create new one
        let audio = this.soundEffects.get(name);

        if (!audio) {
            console.warn(`Sound effect '${name}' not found`);
            return;
        }

        // Clone audio for overlapping sounds
        const soundInstance = audio.cloneNode();
        soundInstance.volume = volume * this.volume.master;
        soundInstance.loop = loop;

        // Apply pitch shift if supported
        if (this.audioContext && pitch !== 1.0) {
            this.applyPitchShift(soundInstance, pitch);
        }

        const playAudio = () => {
            soundInstance.play().catch(e => console.log('Sound play failed:', e));
        };

        if (delay > 0) {
            setTimeout(playAudio, delay);
        } else {
            playAudio();
        }

        return soundInstance;
    }

    // Spatial Audio for 3D positioning
    playSpatialSound(name, position, options = {}) {
        if (!this.spatialSupported || this.isMuted) {
            return this.playSound(name, options);
        }

        const {
            volume = this.volume.effects,
            maxDistance = 50,
            rolloffFactor = 1,
            refDistance = 1
        } = options;

        // Calculate distance-based volume
        const distance = this.calculateDistance(position);
        const spatialVolume = Math.max(0, 1 - (distance / maxDistance)) * volume;

        return this.playSound(name, { ...options, volume: spatialVolume });
    }

    // Narration System
    async playNarration(text, options = {}) {
        const {
            voice = 'default',
            rate = 1.0,
            pitch = 1.0,
            volume = this.volume.narration,
            lang = 'en-US'
        } = options;

        // Stop existing narration
        this.stopNarration();

        // Use Web Speech API if available
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = volume * this.volume.master;
            utterance.lang = lang;

            // Select voice if specified
            if (voice !== 'default') {
                const voices = speechSynthesis.getVoices();
                const selectedVoice = voices.find(v => v.name.includes(voice));
                if (selectedVoice) utterance.voice = selectedVoice;
            }

            utterance.onend = () => {
                this.narration = null;
                this.updateNarrationUI(false);
            };

            utterance.onerror = (e) => {
                console.error('Narration error:', e);
                this.narration = null;
                this.updateNarrationUI(false);
            };

            this.narration = utterance;
            speechSynthesis.speak(utterance);
            this.updateNarrationUI(true);

        } else {
            console.warn('Speech synthesis not supported');
        }
    }

    async playNarrationFile(url, options = {}) {
        const { volume = this.volume.narration } = options;

        this.stopNarration();

        try {
            this.narration = new Audio(url);
            this.narration.volume = volume * this.volume.master;

            this.narration.onended = () => {
                this.narration = null;
                this.updateNarrationUI(false);
            };

            this.narration.onerror = () => {
                this.narration = null;
                this.updateNarrationUI(false);
            };

            await this.narration.play();
            this.updateNarrationUI(true);

        } catch (error) {
            console.error('Failed to play narration file:', error);
        }
    }

    stopNarration() {
        if (this.narration) {
            if (this.narration instanceof Audio) {
                this.narration.pause();
                this.narration.currentTime = 0;
            } else {
                speechSynthesis.cancel();
            }
            this.narration = null;
            this.updateNarrationUI(false);
        }
    }

    // Volume Control
    setVolume(type, value) {
        this.volume[type] = Math.max(0, Math.min(1, value));
        this.updateAudioLevels();
        this.saveVolumeSettings();
    }

    setMasterVolume(value) {
        this.volume.master = Math.max(0, Math.min(1, value));
        this.updateAudioLevels();
        this.saveVolumeSettings();
    }

    updateAudioLevels() {
        // Update background music
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.volume.music * this.volume.master;
        }

        // Update narration
        if (this.narration && this.narration instanceof Audio) {
            this.narration.volume = this.volume.narration * this.volume.master;
        }

        // Update UI
        this.updateVolumeUI();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;

        if (this.isMuted) {
            if (this.backgroundMusic) this.backgroundMusic.volume = 0;
            if (this.narration && this.narration instanceof Audio) this.narration.volume = 0;
        } else {
            this.updateAudioLevels();
        }

        this.updateMuteUI();
    }

    // Audio Fading
    fadeIn(audio, targetVolume, duration) {
        return new Promise((resolve) => {
            const steps = 20;
            const stepVolume = targetVolume / steps;
            const stepDuration = duration / steps;
            let currentStep = 0;

            const fadeInterval = setInterval(() => {
                currentStep++;
                audio.volume = Math.min(stepVolume * currentStep, targetVolume);

                if (currentStep >= steps) {
                    clearInterval(fadeInterval);
                    audio.volume = targetVolume;
                    resolve();
                }
            }, stepDuration);
        });
    }

    fadeOut(audio, duration) {
        return new Promise((resolve) => {
            const initialVolume = audio.volume;
            const steps = 20;
            const stepVolume = initialVolume / steps;
            const stepDuration = duration / steps;
            let currentStep = 0;

            const fadeInterval = setInterval(() => {
                currentStep++;
                audio.volume = Math.max(initialVolume - (stepVolume * currentStep), 0);

                if (currentStep >= steps || audio.volume <= 0) {
                    clearInterval(fadeInterval);
                    audio.pause();
                    audio.volume = initialVolume;
                    resolve();
                }
            }, stepDuration);
        });
    }

    // Scene-based Audio
    loadSceneAudio(scene) {
        // Background music for scene
        if (scene.backgroundMusic) {
            this.setBackgroundMusic(scene.backgroundMusic, {
                fadeIn: true,
                fadeDuration: 1500
            });
        }

        // Ambient sounds
        if (scene.ambientSounds) {
            scene.ambientSounds.forEach(sound => {
                this.playSound(sound.name, {
                    loop: true,
                    volume: sound.volume || 0.3
                });
            });
        }

        // Auto-narration
        if (scene.autoNarration) {
            setTimeout(() => {
                if (scene.narrationText) {
                    this.playNarration(scene.narrationText);
                } else if (scene.narrationFile) {
                    this.playNarrationFile(scene.narrationFile);
                }
            }, scene.narrationDelay || 2000);
        }
    }

    // Advanced Audio Features
    applyPitchShift(audio, pitchRatio) {
        // Requires Web Audio API
        if (!this.audioContext) return;

        try {
            const source = this.audioContext.createMediaElementSource(audio);
            const pitchShift = this.audioContext.createScriptProcessor(4096, 1, 1);

            // Simple pitch shifting (limited but functional)
            pitchShift.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0);
                const output = e.outputBuffer.getChannelData(0);

                for (let i = 0; i < input.length; i++) {
                    const sourceIndex = Math.floor(i * pitchRatio);
                    output[i] = sourceIndex < input.length ? input[sourceIndex] : 0;
                }
            };

            source.connect(pitchShift);
            pitchShift.connect(this.audioContext.destination);

        } catch (e) {
            console.log('Pitch shifting failed:', e);
        }
    }

    calculateDistance(position) {
        // Simple distance calculation from viewer position
        // In a real implementation, this would use actual 3D positions
        return Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);
    }

    // UI Management
    createAudioUI() {
        // Add audio controls to the toolbar if not already present
        const toolbar = document.querySelector('.toolbar');
        if (!toolbar || document.getElementById('audioControls')) return;

        const audioControls = document.createElement('div');
        audioControls.id = 'audioControls';
        audioControls.innerHTML = `
            <button id="narrationBtn" onclick="audioManager.toggleNarration()" title="Toggle Narration" style="display: none;">
                <i class="fas fa-microphone"></i>
            </button>
            <div id="volumePanel" style="display: none; position: absolute; bottom: 60px; background: rgba(0,0,0,0.9); padding: 15px; border-radius: 8px; min-width: 200px;">
                <div style="color: white; margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">Master Volume</label>
                    <input type="range" id="masterVolume" min="0" max="100" value="100" style="width: 100%;">
                </div>
                <div style="color: white; margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">Music</label>
                    <input type="range" id="musicVolume" min="0" max="100" value="60" style="width: 100%;">
                </div>
                <div style="color: white; margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 5px;">Effects</label>
                    <input type="range" id="effectsVolume" min="0" max="100" value="80" style="width: 100%;">
                </div>
                <div style="color: white;">
                    <label style="display: block; margin-bottom: 5px;">Narration</label>
                    <input type="range" id="narrationVolume" min="0" max="100" value="100" style="width: 100%;">
                </div>
            </div>
        `;

        // Insert before existing sound button or at the end
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.parentNode.insertBefore(audioControls, soundBtn);
        } else {
            toolbar.appendChild(audioControls);
        }

        this.setupVolumeControls();
    }

    setupVolumeControls() {
        // Volume sliders
        const controls = {
            'masterVolume': 'master',
            'musicVolume': 'music',
            'effectsVolume': 'effects',
            'narrationVolume': 'narration'
        };

        for (const [elementId, volumeType] of Object.entries(controls)) {
            const slider = document.getElementById(elementId);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.setVolume(volumeType, e.target.value / 100);
                });
            }
        }

        // Enhanced sound button functionality
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            soundBtn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.toggleVolumePanel();
            });
        }
    }

    toggleVolumePanel() {
        const panel = document.getElementById('volumePanel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    toggleNarration() {
        if (this.narration) {
            this.stopNarration();
        } else {
            // Example narration for current scene
            if (currentScene) {
                this.playNarration(`Welcome to ${currentScene.title}. ${currentScene.description || 'Look around to explore this space.'}`);
            }
        }
    }

    updateVolumeUI() {
        const sliders = {
            'masterVolume': this.volume.master,
            'musicVolume': this.volume.music,
            'effectsVolume': this.volume.effects,
            'narrationVolume': this.volume.narration
        };

        for (const [elementId, value] of Object.entries(sliders)) {
            const slider = document.getElementById(elementId);
            if (slider) {
                slider.value = value * 100;
            }
        }
    }

    updateMuteUI() {
        const soundBtn = document.getElementById('soundBtn');
        if (soundBtn) {
            const icon = soundBtn.querySelector('i');
            if (icon) {
                icon.className = this.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
            }
            soundBtn.classList.toggle('active', !this.isMuted);
        }
    }

    updateNarrationUI(playing) {
        const narrationBtn = document.getElementById('narrationBtn');
        if (narrationBtn) {
            narrationBtn.style.display = 'inline-block';
            narrationBtn.classList.toggle('active', playing);
            const icon = narrationBtn.querySelector('i');
            if (icon) {
                icon.className = playing ? 'fas fa-microphone-slash' : 'fas fa-microphone';
            }
        }
    }

    setupAudioControls() {
        // Load saved settings
        this.loadVolumeSettings();

        // Auto-resume audio context on user interaction
        const resumeAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        };

        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
    }

    saveVolumeSettings() {
        localStorage.setItem('audioSettings', JSON.stringify({
            volume: this.volume,
            isMuted: this.isMuted
        }));
    }

    loadVolumeSettings() {
        const saved = localStorage.getItem('audioSettings');
        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.volume = { ...this.volume, ...settings.volume };
                this.isMuted = settings.isMuted || false;
            } catch (e) {
                console.log('Failed to load audio settings');
            }
        }
    }
}

// Initialize global audio manager
const audioManager = new AudioManager();

// Integration with existing systems
if (typeof window !== 'undefined') {
    window.audioManager = audioManager;
}

// Connect to hotspot manager
if (typeof hotspotManager !== 'undefined') {
    hotspotManager.setSoundManager(audioManager);
}

console.log('Audio Manager loaded');