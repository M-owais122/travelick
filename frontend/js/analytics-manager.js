// Advanced Analytics Tracking System

class AnalyticsManager {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = this.getUserId();
        this.sessionStart = Date.now();
        this.events = [];
        this.heatmapData = new Map();
        this.sceneMetrics = new Map();
        this.userBehavior = new Map();
        this.deviceInfo = this.getDeviceInfo();
        this.isOnline = navigator.onLine;
        this.pendingEvents = [];
        this.trackingEnabled = true;
        this.init();
    }

    async init() {
        // Check privacy settings
        this.checkPrivacySettings();

        // Start session tracking
        this.startSession();

        // Setup event listeners
        this.setupEventListeners();

        // Setup offline sync
        this.setupOfflineSync();

        // Load existing analytics data
        this.loadStoredAnalytics();

        console.log('Analytics Manager initialized with session:', this.sessionId);
    }

    // Privacy and Consent
    checkPrivacySettings() {
        const consent = localStorage.getItem('analytics_consent');
        if (consent === null) {
            this.showConsentDialog();
        } else {
            this.trackingEnabled = consent === 'true';
        }
    }

    showConsentDialog() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; margin: 20px;">
                <h3 style="margin-top: 0; color: #333;">Analytics & Privacy</h3>
                <p style="color: #666; line-height: 1.5;">
                    We collect anonymous usage data to improve your tour experience.
                    This includes which scenes you visit, how long you spend viewing them,
                    and which features you use. No personal information is collected.
                </p>
                <div style="text-align: right; margin-top: 20px;">
                    <button onclick="analyticsManager.setConsent(false)"
                            style="background: #ccc; color: black; border: none; padding: 10px 20px; border-radius: 6px; margin-right: 10px; cursor: pointer;">
                        Decline
                    </button>
                    <button onclick="analyticsManager.setConsent(true)"
                            style="background: #39FF14; color: black; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Accept
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    setConsent(consent) {
        this.trackingEnabled = consent;
        localStorage.setItem('analytics_consent', consent.toString());

        // Remove consent dialog
        const modal = document.querySelector('[style*="z-index: 10000"]');
        if (modal) modal.remove();

        if (consent) {
            this.startSession();
        }
    }

    // Session Management
    startSession() {
        if (!this.trackingEnabled) return;

        this.trackEvent('session_start', {
            sessionId: this.sessionId,
            userId: this.userId,
            timestamp: this.sessionStart,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            tourId: currentTour?.id,
            device: this.deviceInfo
        });
    }

    endSession() {
        if (!this.trackingEnabled) return;

        const sessionDuration = Date.now() - this.sessionStart;

        this.trackEvent('session_end', {
            sessionId: this.sessionId,
            duration: sessionDuration,
            totalEvents: this.events.length,
            scenesVisited: this.sceneMetrics.size,
            interactionsCount: this.getTotalInteractions(),
            timestamp: Date.now()
        });

        this.syncToServer();
    }

    // Event Tracking
    trackEvent(eventType, data = {}) {
        if (!this.trackingEnabled) return;

        const event = {
            id: this.generateEventId(),
            sessionId: this.sessionId,
            userId: this.userId,
            type: eventType,
            timestamp: Date.now(),
            tourId: currentTour?.id,
            sceneId: currentScene?.id,
            data: {
                ...data,
                url: window.location.href,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };

        this.events.push(event);
        this.storeEventLocally(event);

        // Process specific event types
        this.processEventType(event);

        // Try to sync if online
        if (this.isOnline) {
            this.syncSingleEvent(event);
        }

        console.log('Analytics event tracked:', eventType, data);
    }

    processEventType(event) {
        switch (event.type) {
            case 'scene_view':
                this.updateSceneMetrics(event);
                break;
            case 'hotspot_interaction':
                this.updateInteractionMetrics(event);
                break;
            case 'user_interaction':
                this.updateBehaviorMetrics(event);
                break;
            case 'viewport_change':
                this.updateViewportMetrics(event);
                break;
        }
    }

    // Scene Analytics
    trackSceneView(sceneId, sceneTitle) {
        const sceneMetric = this.sceneMetrics.get(sceneId) || {
            id: sceneId,
            title: sceneTitle,
            viewCount: 0,
            totalDuration: 0,
            firstView: Date.now(),
            lastView: Date.now(),
            entryMethods: new Map(),
            exitMethods: new Map(),
            bounceRate: 0
        };

        sceneMetric.viewCount++;
        sceneMetric.lastView = Date.now();
        sceneMetric.entryTime = Date.now();

        this.sceneMetrics.set(sceneId, sceneMetric);

        this.trackEvent('scene_view', {
            sceneId,
            sceneTitle,
            viewCount: sceneMetric.viewCount,
            previousScene: this.previousSceneId
        });

        this.previousSceneId = sceneId;
    }

    trackSceneExit(sceneId, method = 'unknown') {
        const sceneMetric = this.sceneMetrics.get(sceneId);
        if (!sceneMetric || !sceneMetric.entryTime) return;

        const duration = Date.now() - sceneMetric.entryTime;
        sceneMetric.totalDuration += duration;

        // Track exit method
        const exitCount = sceneMetric.exitMethods.get(method) || 0;
        sceneMetric.exitMethods.set(method, exitCount + 1);

        this.trackEvent('scene_exit', {
            sceneId,
            duration,
            exitMethod: method,
            totalDuration: sceneMetric.totalDuration,
            averageDuration: sceneMetric.totalDuration / sceneMetric.viewCount
        });
    }

    // Hotspot Analytics
    trackHotspotInteraction(hotspot, interactionType = 'click') {
        const hotspotId = `${currentScene?.id}_${hotspot.pitch}_${hotspot.yaw}`;

        this.trackEvent('hotspot_interaction', {
            hotspotId,
            hotspotType: hotspot.category || hotspot.type,
            hotspotText: hotspot.text,
            interactionType,
            coordinates: {
                pitch: hotspot.pitch,
                yaw: hotspot.yaw
            },
            scenePosition: this.getCurrentViewerPosition()
        });

        // Update heatmap data
        this.updateHeatmapData(hotspot.pitch, hotspot.yaw, interactionType);
    }

    // Heatmap Generation
    updateHeatmapData(pitch, yaw, interactionType) {
        const gridSize = 10; // degrees
        const gridX = Math.floor((yaw + 180) / gridSize);
        const gridY = Math.floor((pitch + 90) / gridSize);
        const gridKey = `${gridX}_${gridY}`;

        const heatmapPoint = this.heatmapData.get(gridKey) || {
            x: gridX * gridSize - 180,
            y: gridY * gridSize - 90,
            interactions: 0,
            types: new Map(),
            intensity: 0
        };

        heatmapPoint.interactions++;
        const typeCount = heatmapPoint.types.get(interactionType) || 0;
        heatmapPoint.types.set(interactionType, typeCount + 1);
        heatmapPoint.intensity = Math.log(heatmapPoint.interactions + 1);

        this.heatmapData.set(gridKey, heatmapPoint);
    }

    generateHeatmapData() {
        const heatmapArray = [];

        for (const [key, point] of this.heatmapData) {
            heatmapArray.push({
                x: point.x,
                y: point.y,
                value: point.intensity,
                interactions: point.interactions,
                types: Object.fromEntries(point.types)
            });
        }

        return heatmapArray.sort((a, b) => b.value - a.value);
    }

    // User Behavior Analytics
    trackUserBehavior(action, details = {}) {
        const behaviorKey = `${action}_${currentScene?.id || 'global'}`;

        const behavior = this.userBehavior.get(behaviorKey) || {
            action,
            sceneId: currentScene?.id,
            count: 0,
            firstOccurrence: Date.now(),
            lastOccurrence: Date.now(),
            details: []
        };

        behavior.count++;
        behavior.lastOccurrence = Date.now();
        behavior.details.push({
            timestamp: Date.now(),
            ...details
        });

        // Keep only last 10 detail entries to manage memory
        if (behavior.details.length > 10) {
            behavior.details = behavior.details.slice(-10);
        }

        this.userBehavior.set(behaviorKey, behavior);

        this.trackEvent('user_behavior', {
            action,
            count: behavior.count,
            ...details
        });
    }

    // Viewport and Navigation Analytics
    trackViewportChange(pitch, yaw, fov) {
        this.trackEvent('viewport_change', {
            pitch,
            yaw,
            fov,
            timestamp: Date.now()
        });
    }

    trackNavigation(from, to, method) {
        this.trackEvent('navigation', {
            fromScene: from,
            toScene: to,
            method, // 'hotspot', 'thumbnail', 'keyboard', etc.
            timestamp: Date.now()
        });
    }

    // Performance Analytics
    trackPerformance(metric, value, context = {}) {
        this.trackEvent('performance', {
            metric,
            value,
            context,
            userAgent: navigator.userAgent,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        });
    }

    trackError(error, context = {}) {
        this.trackEvent('error', {
            message: error.message,
            stack: error.stack,
            type: error.name,
            context,
            timestamp: Date.now()
        });
    }

    // Analytics Dashboard Data
    generateAnalyticsReport() {
        const totalDuration = Date.now() - this.sessionStart;

        const report = {
            session: {
                id: this.sessionId,
                duration: totalDuration,
                startTime: this.sessionStart,
                eventCount: this.events.length
            },
            scenes: this.generateSceneAnalytics(),
            interactions: this.generateInteractionAnalytics(),
            heatmap: this.generateHeatmapData(),
            behavior: this.generateBehaviorAnalytics(),
            performance: this.generatePerformanceAnalytics(),
            paths: this.generateUserPathAnalytics()
        };

        return report;
    }

    generateSceneAnalytics() {
        const analytics = [];

        for (const [sceneId, metrics] of this.sceneMetrics) {
            analytics.push({
                sceneId,
                title: metrics.title,
                viewCount: metrics.viewCount,
                averageDuration: metrics.totalDuration / metrics.viewCount,
                totalDuration: metrics.totalDuration,
                bounceRate: this.calculateBounceRate(sceneId),
                engagementScore: this.calculateEngagementScore(metrics)
            });
        }

        return analytics.sort((a, b) => b.viewCount - a.viewCount);
    }

    generateInteractionAnalytics() {
        const hotspotEvents = this.events.filter(e => e.type === 'hotspot_interaction');

        const interactionsByType = new Map();
        const interactionsByScene = new Map();

        hotspotEvents.forEach(event => {
            const type = event.data.hotspotType;
            const sceneId = event.sceneId;

            // By type
            const typeCount = interactionsByType.get(type) || 0;
            interactionsByType.set(type, typeCount + 1);

            // By scene
            const sceneCount = interactionsByScene.get(sceneId) || 0;
            interactionsByScene.set(sceneId, sceneCount + 1);
        });

        return {
            total: hotspotEvents.length,
            byType: Object.fromEntries(interactionsByType),
            byScene: Object.fromEntries(interactionsByScene),
            mostInteractive: this.findMostInteractiveElement(hotspotEvents)
        };
    }

    generateBehaviorAnalytics() {
        const behaviors = [];

        for (const [key, behavior] of this.userBehavior) {
            behaviors.push({
                action: behavior.action,
                sceneId: behavior.sceneId,
                frequency: behavior.count,
                firstOccurrence: behavior.firstOccurrence,
                lastOccurrence: behavior.lastOccurrence,
                avgTimeInterval: behavior.count > 1
                    ? (behavior.lastOccurrence - behavior.firstOccurrence) / (behavior.count - 1)
                    : 0
            });
        }

        return behaviors.sort((a, b) => b.frequency - a.frequency);
    }

    generatePerformanceAnalytics() {
        const performanceEvents = this.events.filter(e => e.type === 'performance');

        const metrics = {
            sceneLoadTimes: [],
            averageFrameRate: null,
            memoryUsage: null,
            connectionSpeed: null
        };

        performanceEvents.forEach(event => {
            switch (event.data.metric) {
                case 'scene_load_time':
                    metrics.sceneLoadTimes.push(event.data.value);
                    break;
                case 'frame_rate':
                    metrics.averageFrameRate = event.data.value;
                    break;
                case 'memory_usage':
                    metrics.memoryUsage = event.data.value;
                    break;
            }
        });

        return metrics;
    }

    generateUserPathAnalytics() {
        const navigationEvents = this.events.filter(e => e.type === 'navigation');

        const paths = [];
        const pathFrequency = new Map();

        for (let i = 0; i < navigationEvents.length - 1; i++) {
            const from = navigationEvents[i].data.fromScene;
            const to = navigationEvents[i].data.toScene;
            const pathKey = `${from}_to_${to}`;

            const frequency = pathFrequency.get(pathKey) || 0;
            pathFrequency.set(pathKey, frequency + 1);
        }

        for (const [path, frequency] of pathFrequency) {
            const [from, to] = path.split('_to_');
            paths.push({ from, to, frequency });
        }

        return paths.sort((a, b) => b.frequency - a.frequency);
    }

    // Helper Functions
    calculateBounceRate(sceneId) {
        const sceneEvents = this.events.filter(e => e.sceneId === sceneId);
        const interactionEvents = sceneEvents.filter(e =>
            e.type === 'hotspot_interaction' || e.type === 'user_interaction'
        );

        return sceneEvents.length > 0 ? 1 - (interactionEvents.length / sceneEvents.length) : 0;
    }

    calculateEngagementScore(metrics) {
        // Engagement score based on time spent and interactions
        const avgDuration = metrics.totalDuration / metrics.viewCount;
        const interactionCount = this.getTotalInteractionsForScene(metrics.id);

        // Normalize scores (example weights)
        const timeScore = Math.min(avgDuration / 30000, 1); // 30 seconds = max score
        const interactionScore = Math.min(interactionCount / 5, 1); // 5 interactions = max score

        return (timeScore * 0.6 + interactionScore * 0.4) * 100;
    }

    findMostInteractiveElement(hotspotEvents) {
        const elementCounts = new Map();

        hotspotEvents.forEach(event => {
            const elementId = event.data.hotspotId;
            const count = elementCounts.get(elementId) || 0;
            elementCounts.set(elementId, count + 1);
        });

        let mostInteractive = null;
        let maxCount = 0;

        for (const [elementId, count] of elementCounts) {
            if (count > maxCount) {
                maxCount = count;
                mostInteractive = elementId;
            }
        }

        return { elementId: mostInteractive, interactions: maxCount };
    }

    getTotalInteractions() {
        return this.events.filter(e =>
            e.type === 'hotspot_interaction' ||
            e.type === 'user_interaction'
        ).length;
    }

    getTotalInteractionsForScene(sceneId) {
        return this.events.filter(e =>
            e.sceneId === sceneId &&
            (e.type === 'hotspot_interaction' || e.type === 'user_interaction')
        ).length;
    }

    // Utility Functions
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateEventId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    getUserId() {
        let userId = localStorage.getItem('analytics_user_id');
        if (!userId) {
            userId = this.generateSessionId();
            localStorage.setItem('analytics_user_id', userId);
        }
        return userId;
    }

    getDeviceInfo() {
        return {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }

    getCurrentViewerPosition() {
        if (typeof viewer !== 'undefined' && viewer) {
            return {
                pitch: viewer.getPitch(),
                yaw: viewer.getYaw(),
                fov: viewer.getHfov()
            };
        }
        return null;
    }

    // Storage and Sync
    storeEventLocally(event) {
        try {
            const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            stored.push(event);

            // Keep only last 1000 events to manage storage
            if (stored.length > 1000) {
                stored.splice(0, stored.length - 1000);
            }

            localStorage.setItem('analytics_events', JSON.stringify(stored));
        } catch (e) {
            console.warn('Failed to store analytics event locally:', e);
        }
    }

    loadStoredAnalytics() {
        try {
            const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            this.events = [...this.events, ...stored];
        } catch (e) {
            console.warn('Failed to load stored analytics:', e);
        }
    }

    async syncToServer() {
        if (!this.isOnline || this.events.length === 0) return;

        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    events: this.events
                })
            });

            if (response.ok) {
                console.log('Analytics synced to server');
                // Clear local storage after successful sync
                localStorage.removeItem('analytics_events');
                this.events = [];
            }
        } catch (error) {
            console.warn('Failed to sync analytics to server:', error);
        }
    }

    async syncSingleEvent(event) {
        if (!this.isOnline) return;

        try {
            const response = await fetch('/api/analytics/event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                this.pendingEvents.push(event);
            }
        } catch (error) {
            this.pendingEvents.push(event);
        }
    }

    setupOfflineSync() {
        // Sync when coming back online
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncToServer();
            this.syncPendingEvents();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Sync before page unload
        window.addEventListener('beforeunload', () => {
            this.endSession();
        });
    }

    async syncPendingEvents() {
        while (this.pendingEvents.length > 0) {
            const event = this.pendingEvents.shift();
            await this.syncSingleEvent(event);
        }
    }

    setupEventListeners() {
        // Track viewport changes
        if (typeof viewer !== 'undefined') {
            document.addEventListener('viewportChanged', (e) => {
                this.trackViewportChange(e.detail.pitch, e.detail.yaw, e.detail.fov);
            });
        }

        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.trackUserBehavior('page_hidden');
            } else {
                this.trackUserBehavior('page_visible');
            }
        });

        // Track window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.trackUserBehavior('window_resize', {
                    newSize: `${window.innerWidth}x${window.innerHeight}`
                });
            }, 250);
        });
    }

    // Public API
    getReport() {
        return this.generateAnalyticsReport();
    }

    exportData() {
        const data = {
            session: this.sessionId,
            analytics: this.generateAnalyticsReport(),
            events: this.events,
            generatedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${this.sessionId}.json`;
        a.click();

        URL.revokeObjectURL(url);
    }
}

// Initialize global analytics manager
const analyticsManager = new AnalyticsManager();

// Integration with existing systems
if (typeof window !== 'undefined') {
    window.analyticsManager = analyticsManager;
}

// Integration helpers
function trackSceneChange(sceneId, sceneTitle) {
    if (analyticsManager.previousSceneId) {
        analyticsManager.trackSceneExit(analyticsManager.previousSceneId, 'scene_change');
    }
    analyticsManager.trackSceneView(sceneId, sceneTitle);
}

function trackHotspotClick(hotspot) {
    analyticsManager.trackHotspotInteraction(hotspot, 'click');
}

function trackUserAction(action, details) {
    analyticsManager.trackUserBehavior(action, details);
}

console.log('Analytics Manager loaded');