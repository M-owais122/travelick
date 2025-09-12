'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { 
  Maximize, Minimize, VrHeadset, Settings, Info, ArrowLeft, 
  Play, Pause, Volume2, VolumeX, Ruler, Eye, Share2, 
  Camera, RotateCw, Compass, Map, Layers, Zap, Target,
  MousePointer, Move3D, RotateCcw, ZoomIn, ZoomOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Advanced Types
interface AdvancedHotspot {
  id: string;
  type: 'navigation' | 'info' | 'video' | 'audio' | '3d_model' | 'image_gallery' | 'custom';
  subType?: 'door' | 'window' | 'stairs' | 'elevator' | 'room_label' | 'poi';
  title: string;
  description?: string;
  position: {
    x: number; // longitude
    y: number; // latitude
    z?: number; // depth
  };
  targetPanoramaId?: string;
  media?: {
    url: string;
    type: 'video' | 'audio' | 'image' | '3d_model';
    thumbnail?: string;
    autoplay?: boolean;
    loop?: boolean;
  };
  animation?: {
    type: 'pulse' | 'bounce' | 'glow' | 'rotate' | 'scale';
    duration: number;
    infinite: boolean;
  };
  triggers?: {
    onEnter?: string; // JavaScript code to execute
    onLeave?: string;
    onClick?: string;
  };
  style?: {
    color: string;
    size: number;
    icon: string;
    customCSS?: string;
  };
}

interface TourLevel {
  id: string;
  name: string;
  floor: number;
  panoramas: string[]; // panorama IDs
  floorPlan?: string; // floor plan image URL
  elevation?: number; // meters above ground
}

interface AdvancedPanorama {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  hotspots: AdvancedHotspot[];
  levelId?: string;
  position?: {
    x: number;
    y: number;
    floor: number;
  };
  metadata: {
    captureDate: string;
    camera?: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
    weather?: string;
    lighting?: 'natural' | 'artificial' | 'mixed';
  };
  processing: {
    exposure?: number;
    saturation?: number;
    contrast?: number;
    sharpness?: number;
    whiteBalance?: number;
  };
  restrictions?: {
    noDownload: boolean;
    noScreenshot: boolean;
    passwordProtected: boolean;
    expiryDate?: string;
  };
}

interface TourAnalytics {
  viewCount: number;
  uniqueVisitors: number;
  averageViewTime: number;
  heatmapData: Array<{
    x: number;
    y: number;
    intensity: number;
  }>;
  popularHotspots: Array<{
    id: string;
    clicks: number;
  }>;
  deviceStats: {
    desktop: number;
    mobile: number;
    vr: number;
  };
  geographicData: Array<{
    country: string;
    count: number;
  }>;
}

interface AdvancedTour {
  id: string;
  title: string;
  description?: string;
  startingPanoramaId?: string;
  panoramas: AdvancedPanorama[];
  levels?: TourLevel[];
  branding?: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    customCSS?: string;
  };
  settings: {
    autoRotate: boolean;
    autoRotateSpeed: number;
    showCompass: boolean;
    showMiniMap: boolean;
    showLevelSelector: boolean;
    enableGyroscope: boolean;
    enableKeyboardNav: boolean;
    enableMouseWheel: boolean;
    transitionSpeed: number;
    fieldOfView: number;
    maxZoom: number;
    minZoom: number;
  };
  audio?: {
    backgroundMusic?: string;
    ambientSounds?: string;
    narration?: Array<{
      panoramaId: string;
      audioUrl: string;
      autoplay: boolean;
    }>;
  };
  analytics?: TourAnalytics;
}

interface AdvancedVirtualTourViewerProps {
  tour: AdvancedTour;
  className?: string;
  onPanoramaChange?: (panoramaId: string) => void;
  onHotspotClick?: (hotspot: AdvancedHotspot) => void;
  onAnalyticsEvent?: (event: string, data: any) => void;
  enableAnalytics?: boolean;
  watermark?: boolean;
  customControls?: React.ReactNode;
}

const AdvancedVirtualTourViewer: React.FC<AdvancedVirtualTourViewerProps> = ({
  tour,
  className,
  onPanoramaChange,
  onHotspotClick,
  onAnalyticsEvent,
  enableAnalytics = true,
  watermark = true,
  customControls
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const compassRef = useRef<HTMLCanvasElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPanorama, setCurrentPanorama] = useState<AdvancedPanorama | null>(null);
  const [currentLevel, setCurrentLevel] = useState<TourLevel | null>(null);
  
  // Control states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(tour.settings.showMiniMap);
  const [showCompass, setShowCompass] = useState(tour.settings.showCompass);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMeasurementTool, setShowMeasurementTool] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Advanced states
  const [viewMode, setViewMode] = useState<'normal' | 'dollhouse' | 'floorplan'>('normal');
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(tour.settings.enableGyroscope);
  const [autoRotating, setAutoRotating] = useState(tour.settings.autoRotate);
  const [currentFOV, setCurrentFOV] = useState(tour.settings.fieldOfView);
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0 });
  const [heatmapVisible, setHeatmapVisible] = useState(false);
  
  // Measurement tool states
  const [measurementPoints, setMeasurementPoints] = useState<Array<{ x: number; y: number; z: number }>>([]);
  const [isDrawingMeasurement, setIsDrawingMeasurement] = useState(false);
  
  // Analytics tracking
  const sessionStartTime = useRef(Date.now());
  const viewTimeTracker = useRef<number>(0);
  const heatmapData = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);

  // Load advanced scripts and libraries
  useEffect(() => {
    const loadAdvancedLibraries = async () => {
      try {
        // Load Three.js extensions
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js'),
          loadScript('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/controls/DeviceOrientationControls.js'),
          loadScript('https://cdn.jsdelivr.net/npm/three@0.158.0/examples/js/effects/StereoEffect.js'),
          loadScript('https://cdn.jsdelivr.net/npm/panolens@0.12.1/build/panolens.min.js'),
          loadScript('https://cdn.jsdelivr.net/npm/tween.js@18.6.4/dist/tween.umd.js'),
        ]);
        
        initAdvancedViewer();
      } catch (error) {
        setError('Failed to load advanced libraries');
        console.error(error);
      }
    };

    loadAdvancedLibraries();
  }, []);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initAdvancedViewer = async () => {
    if (!containerRef.current || !window.THREE || !window.PANOLENS) return;

    try {
      setIsLoading(true);

      // Create advanced viewer with custom renderer
      const viewer = new window.PANOLENS.Viewer({
        container: containerRef.current,
        autoHideInfospot: false,
        controlBar: false, // We'll use custom controls
        enableReticle: true,
        dwellTime: 1500,
        autoRotate: tour.settings.autoRotate,
        autoRotateSpeed: tour.settings.autoRotateSpeed,
        cameraFov: tour.settings.fieldOfView,
        reverseDragging: false,
        enableKeyboardNav: tour.settings.enableKeyboardNav,
        enableMouseWheel: tour.settings.enableMouseWheel,
      });

      // Add custom post-processing effects
      if (window.THREE.EffectComposer) {
        setupPostProcessing(viewer);
      }

      viewerRef.current = viewer;
      
      // Setup panoramas with advanced features
      await setupAdvancedPanoramas(viewer);
      
      // Setup device orientation controls
      if (tour.settings.enableGyroscope && window.DeviceOrientationControls) {
        setupGyroscopeControls(viewer);
      }

      // Setup audio system
      setupAudioSystem();
      
      // Setup analytics tracking
      if (enableAnalytics) {
        setupAnalyticsTracking(viewer);
      }

      // Setup compass
      if (tour.settings.showCompass) {
        setupCompass();
      }

      setIsLoading(false);
      
    } catch (error) {
      console.error('Error initializing advanced viewer:', error);
      setError('Failed to initialize tour viewer');
      setIsLoading(false);
    }
  };

  const setupAdvancedPanoramas = async (viewer: any) => {
    const panoramasMap: { [key: string]: any } = {};

    for (const panoramaData of tour.panoramas) {
      // Create panorama with advanced loading
      const panorama = new window.PANOLENS.ImagePanorama(panoramaData.url);
      
      // Apply image processing settings
      if (panoramaData.processing) {
        applyImageProcessing(panorama, panoramaData.processing);
      }

      panoramasMap[panoramaData.id] = panorama;
      viewer.add(panorama);

      // Add advanced hotspots
      await setupAdvancedHotspots(panorama, panoramaData);

      // Setup panorama events
      panorama.addEventListener('enter', () => {
        setCurrentPanorama(panoramaData);
        onPanoramaChange?.(panoramaData.id);
        trackAnalyticsEvent('panorama_enter', { panoramaId: panoramaData.id });
        
        // Auto-play audio if configured
        if (tour.audio?.narration) {
          const narration = tour.audio.narration.find(n => n.panoramaId === panoramaData.id);
          if (narration && narration.autoplay) {
            playAudio(narration.audioUrl);
          }
        }
      });

      panorama.addEventListener('leave', () => {
        trackAnalyticsEvent('panorama_leave', { 
          panoramaId: panoramaData.id,
          timeSpent: Date.now() - sessionStartTime.current
        });
      });
    }

    // Set starting panorama with smooth transition
    const startingPanorama = tour.startingPanoramaId 
      ? panoramasMap[tour.startingPanoramaId]
      : Object.values(panoramasMap)[0];

    if (startingPanorama) {
      await smoothTransitionToPanorama(viewer, startingPanorama);
    }
  };

  const setupAdvancedHotspots = async (panorama: any, panoramaData: AdvancedPanorama) => {
    for (const hotspot of panoramaData.hotspots) {
      let infospot;

      // Create different hotspot types
      switch (hotspot.type) {
        case 'navigation':
          infospot = createNavigationHotspot(hotspot);
          break;
        case 'video':
          infospot = await createVideoHotspot(hotspot);
          break;
        case 'audio':
          infospot = createAudioHotspot(hotspot);
          break;
        case '3d_model':
          infospot = await create3DModelHotspot(hotspot);
          break;
        case 'image_gallery':
          infospot = createImageGalleryHotspot(hotspot);
          break;
        default:
          infospot = createInfoHotspot(hotspot);
      }

      // Position hotspot
      const position = sphericalTo3D(hotspot.position.x, hotspot.position.y, 5000);
      infospot.position.set(position.x, position.y, position.z);

      // Add custom styling
      if (hotspot.style) {
        applyHotspotStyling(infospot, hotspot.style);
      }

      // Add animations
      if (hotspot.animation) {
        addHotspotAnimation(infospot, hotspot.animation);
      }

      // Add interaction events
      infospot.addEventListener('click', (event: any) => {
        event.stopPropagation();
        handleAdvancedHotspotClick(hotspot, panoramaData);
      });

      // Add hover effects
      infospot.addEventListener('hoverenter', () => {
        trackAnalyticsEvent('hotspot_hover', { 
          hotspotId: hotspot.id,
          type: hotspot.type
        });
      });

      panorama.add(infospot);
    }
  };

  const createNavigationHotspot = (hotspot: AdvancedHotspot) => {
    const size = hotspot.style?.size || 300;
    let iconSrc = window.PANOLENS.DataImage.Arrow;

    // Custom icons based on subtype
    switch (hotspot.subType) {
      case 'door':
        iconSrc = createCustomIcon('door', hotspot.style?.color || '#39FF14');
        break;
      case 'stairs':
        iconSrc = createCustomIcon('stairs', hotspot.style?.color || '#39FF14');
        break;
      case 'elevator':
        iconSrc = createCustomIcon('elevator', hotspot.style?.color || '#39FF14');
        break;
    }

    return new window.PANOLENS.Infospot(size, iconSrc);
  };

  const createVideoHotspot = async (hotspot: AdvancedHotspot) => {
    const videoIcon = createCustomIcon('video', hotspot.style?.color || '#FF6B6B');
    const infospot = new window.PANOLENS.Infospot(350, videoIcon);
    
    // Add video element
    if (hotspot.media?.url) {
      const videoElement = document.createElement('video');
      videoElement.src = hotspot.media.url;
      videoElement.controls = true;
      videoElement.style.width = '400px';
      videoElement.style.height = '225px';
      
      infospot.addHoverElement(videoElement, 20);
    }
    
    return infospot;
  };

  const createAudioHotspot = (hotspot: AdvancedHotspot) => {
    const audioIcon = createCustomIcon('audio', hotspot.style?.color || '#4ECDC4');
    const infospot = new window.PANOLENS.Infospot(300, audioIcon);
    
    if (hotspot.media?.url) {
      const audioElement = document.createElement('audio');
      audioElement.src = hotspot.media.url;
      audioElement.controls = true;
      audioElement.autoplay = hotspot.media.autoplay || false;
      audioElement.loop = hotspot.media.loop || false;
      
      const container = document.createElement('div');
      container.style.padding = '20px';
      container.style.background = 'rgba(0, 0, 0, 0.8)';
      container.style.borderRadius = '10px';
      container.style.color = 'white';
      
      const title = document.createElement('h3');
      title.textContent = hotspot.title;
      title.style.marginBottom = '10px';
      
      container.appendChild(title);
      container.appendChild(audioElement);
      
      infospot.addHoverElement(container, 20);
    }
    
    return infospot;
  };

  const create3DModelHotspot = async (hotspot: AdvancedHotspot) => {
    const modelIcon = createCustomIcon('3d_model', hotspot.style?.color || '#9B59B6');
    const infospot = new window.PANOLENS.Infospot(350, modelIcon);
    
    // Load 3D model viewer (placeholder - would integrate with Three.js GLTFLoader)
    if (hotspot.media?.url) {
      const modelContainer = document.createElement('div');
      modelContainer.style.width = '500px';
      modelContainer.style.height = '400px';
      modelContainer.style.background = 'rgba(0, 0, 0, 0.9)';
      modelContainer.style.borderRadius = '10px';
      modelContainer.style.padding = '20px';
      modelContainer.style.color = 'white';
      
      const title = document.createElement('h3');
      title.textContent = hotspot.title;
      title.style.textAlign = 'center';
      title.style.marginBottom = '20px';
      
      const modelViewer = document.createElement('div');
      modelViewer.style.width = '100%';
      modelViewer.style.height = '300px';
      modelViewer.style.background = '#333';
      modelViewer.style.borderRadius = '5px';
      modelViewer.style.display = 'flex';
      modelViewer.style.alignItems = 'center';
      modelViewer.style.justifyContent = 'center';
      modelViewer.textContent = '3D Model Viewer';
      
      modelContainer.appendChild(title);
      modelContainer.appendChild(modelViewer);
      
      infospot.addHoverElement(modelContainer, 20);
    }
    
    return infospot;
  };

  const createImageGalleryHotspot = (hotspot: AdvancedHotspot) => {
    const galleryIcon = createCustomIcon('gallery', hotspot.style?.color || '#F39C12');
    return new window.PANOLENS.Infospot(320, galleryIcon);
  };

  const createInfoHotspot = (hotspot: AdvancedHotspot) => {
    const infoIcon = hotspot.style?.icon 
      ? createCustomIcon(hotspot.style.icon, hotspot.style.color || '#3498DB')
      : window.PANOLENS.DataImage.Info;
    
    return new window.PANOLENS.Infospot(300, infoIcon);
  };

  const createCustomIcon = (type: string, color: string): string => {
    const icons = {
      door: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 12H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z"/>
      </svg>`,
      stairs: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}">
        <path d="M22 11l-3-3V6c0-.55-.45-1-1-1s-1 .45-1 1v1l-2-2-2 2 2 2h1v2l-2-2-2 2 2 2h1v2l-2-2-2 2 2 2h1v2H3c-.55 0-1 .45-1 1s.45 1 1 1h10c.55 0 1-.45 1-1v-3h1c.55 0 1-.45 1-1v-3h1c.55 0 1-.45 1-1v-3h1c.55 0 1-.45 1-1V8l3 3z"/>
      </svg>`,
      elevator: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8 17v-2h2v2H8zm0-4v-2h2v2H8zm0-4V7h2v2H8zm4 8v-2h2v2h-2zm0-4v-2h2v2h-2zm0-4V7h2v2h-2zm4 8v-2h2v2h-2zm0-4v-2h2v2h-2zm0-4V7h2v2h-2z"/>
      </svg>`,
      video: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}">
        <path d="M8 5v14l11-7z"/>
      </svg>`,
      audio: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>`,
      '3d_model': `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`,
      gallery: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="${color}">
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>`
    };
    
    const svgString = icons[type as keyof typeof icons] || icons.gallery;
    return `data:image/svg+xml;base64,${btoa(svgString)}`;
  };

  // Helper functions
  const sphericalTo3D = (longitude: number, latitude: number, radius: number = 5000) => {
    const phi = (90 - latitude) * Math.PI / 180;
    const theta = (longitude + 180) * Math.PI / 180;
    
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  };

  const handleAdvancedHotspotClick = (hotspot: AdvancedHotspot, panoramaData: AdvancedPanorama) => {
    onHotspotClick?.(hotspot);
    trackAnalyticsEvent('hotspot_click', {
      hotspotId: hotspot.id,
      type: hotspot.type,
      panoramaId: panoramaData.id
    });

    // Execute custom triggers
    if (hotspot.triggers?.onClick) {
      try {
        eval(hotspot.triggers.onClick);
      } catch (error) {
        console.error('Error executing hotspot trigger:', error);
      }
    }

    // Handle navigation
    if (hotspot.type === 'navigation' && hotspot.targetPanoramaId) {
      navigateWithTransition(hotspot.targetPanoramaId);
    }
  };

  const navigateWithTransition = async (panoramaId: string) => {
    if (!viewerRef.current) return;

    const targetPanorama = tour.panoramas.find(p => p.id === panoramaId);
    if (!targetPanorama) return;

    // Add transition animation
    setIsLoading(true);
    
    // Custom transition effect
    await new Promise(resolve => {
      if (window.TWEEN) {
        const currentFov = viewerRef.current.camera.fov;
        const transition = new window.TWEEN.Tween({ fov: currentFov })
          .to({ fov: 120 }, 300)
          .easing(window.TWEEN.Easing.Cubic.Out)
          .onUpdate((obj: any) => {
            viewerRef.current.camera.fov = obj.fov;
            viewerRef.current.camera.updateProjectionMatrix();
          })
          .onComplete(() => {
            // Switch panorama
            const panoramaObj = viewerRef.current.panoramas.find((p: any) => 
              p.userData && p.userData.panoramaId === panoramaId
            );
            if (panoramaObj) {
              viewerRef.current.setPanorama(panoramaObj);
            }
            
            // Zoom back
            new window.TWEEN.Tween({ fov: 120 })
              .to({ fov: tour.settings.fieldOfView }, 300)
              .easing(window.TWEEN.Easing.Cubic.Out)
              .onUpdate((obj: any) => {
                viewerRef.current.camera.fov = obj.fov;
                viewerRef.current.camera.updateProjectionMatrix();
              })
              .onComplete(resolve)
              .start();
          })
          .start();
      } else {
        resolve(undefined);
      }
    });
    
    setIsLoading(false);
  };

  const trackAnalyticsEvent = (event: string, data: any) => {
    if (!enableAnalytics) return;
    
    onAnalyticsEvent?.(event, {
      ...data,
      timestamp: Date.now(),
      sessionId: sessionStartTime.current,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });

    // Track heatmap data for mouse movements
    if (event === 'mouse_move') {
      heatmapData.current.push({
        x: data.x,
        y: data.y,
        timestamp: Date.now()
      });
    }
  };

  // Advanced control handlers
  const toggleMeasurementTool = () => {
    setShowMeasurementTool(!showMeasurementTool);
    setIsDrawingMeasurement(false);
    setMeasurementPoints([]);
  };

  const toggleViewMode = () => {
    const modes: Array<'normal' | 'dollhouse' | 'floorplan'> = ['normal', 'dollhouse', 'floorplan'];
    const currentIndex = modes.indexOf(viewMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setViewMode(nextMode);
    
    // Apply view mode changes to viewer
    if (viewerRef.current) {
      switch (nextMode) {
        case 'dollhouse':
          viewerRef.current.camera.fov = 60;
          viewerRef.current.camera.position.set(0, 2000, 2000);
          break;
        case 'floorplan':
          viewerRef.current.camera.fov = 90;
          viewerRef.current.camera.position.set(0, 5000, 0);
          viewerRef.current.camera.lookAt(0, 0, 0);
          break;
        default:
          viewerRef.current.camera.fov = tour.settings.fieldOfView;
          viewerRef.current.camera.position.set(0, 0, 0);
      }
      viewerRef.current.camera.updateProjectionMatrix();
    }
  };

  const setupPostProcessing = (viewer: any) => {
    // Add post-processing effects like bloom, depth of field, etc.
    // This would use Three.js EffectComposer
  };

  const setupGyroscopeControls = (viewer: any) => {
    if (!gyroscopeEnabled) return;
    
    // Device orientation controls would be implemented here
    // Using DeviceOrientationControls from Three.js
  };

  const setupAudioSystem = () => {
    if (tour.audio?.backgroundMusic) {
      const audio = new Audio(tour.audio.backgroundMusic);
      audio.loop = true;
      audio.volume = 0.3;
      audioRef.current = audio;
    }
  };

  const setupAnalyticsTracking = (viewer: any) => {
    // Setup mouse tracking for heatmap
    containerRef.current?.addEventListener('mousemove', (event) => {
      trackAnalyticsEvent('mouse_move', {
        x: event.clientX,
        y: event.clientY
      });
    });

    // Track view time
    const viewTimeInterval = setInterval(() => {
      viewTimeTracker.current += 1000;
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(viewTimeInterval);
  };

  const setupCompass = () => {
    // Compass implementation would go here
    // Drawing on canvas and updating based on camera rotation
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className={cn('relative w-full h-96 bg-black rounded-lg overflow-hidden flex items-center justify-center', className)}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading Virtual Tour...</p>
          <p className="text-sm text-gray-400">Preparing immersive experience</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('relative w-full h-96 bg-red-50 rounded-lg overflow-hidden flex items-center justify-center', className)}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-lg font-semibold">Failed to Load Tour</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-96 bg-black rounded-lg overflow-hidden', className)}>
      {/* Main viewer container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Advanced Control Panel */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white p-3 rounded-xl"
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'normal' ? 'dollhouse' : 'normal')}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Toggle View Mode"
          >
            <Layers className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleMeasurementTool}
            className={cn(
              "p-2 hover:bg-white/20 rounded-lg transition-colors",
              showMeasurementTool && "bg-primary/20"
            )}
            title="Measurement Tool"
          >
            <Ruler className="w-5 h-5" />
          </button>

          <button
            onClick={() => setHeatmapVisible(!heatmapVisible)}
            className={cn(
              "p-2 hover:bg-white/20 rounded-lg transition-colors",
              heatmapVisible && "bg-primary/20"
            )}
            title="View Heatmap"
          >
            <Target className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowCompass(!showCompass)}
            className={cn(
              "p-2 hover:bg-white/20 rounded-lg transition-colors",
              showCompass && "bg-primary/20"
            )}
            title="Toggle Compass"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Tour Information Panel */}
      <AnimatePresence>
        {currentPanorama && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-white p-4 rounded-xl max-w-sm"
          >
            <h3 className="font-bold text-lg mb-1">{currentPanorama.title}</h3>
            {currentPanorama.description && (
              <p className="text-sm text-gray-300 mb-2">{currentPanorama.description}</p>
            )}
            <div className="text-xs text-gray-400 space-y-1">
              {currentPanorama.metadata.captureDate && (
                <div>Captured: {new Date(currentPanorama.metadata.captureDate).toLocaleDateString()}</div>
              )}
              {currentPanorama.metadata.location?.address && (
                <div>📍 {currentPanorama.metadata.location.address}</div>
              )}
              <div>Hotspots: {currentPanorama.hotspots.length}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full"
      >
        <div className="flex items-center gap-4">
          {/* Audio Controls */}
          {tour.audio && (
            <>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </>
          )}

          {/* View Controls */}
          <button
            onClick={() => setAutoRotating(!autoRotating)}
            className={cn(
              "p-2 hover:bg-white/20 rounded-full transition-colors",
              autoRotating && "bg-primary/20"
            )}
            title="Auto Rotate"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setGyroscopeEnabled(!gyroscopeEnabled)}
            className={cn(
              "p-2 hover:bg-white/20 rounded-full transition-colors",
              gyroscopeEnabled && "bg-primary/20"
            )}
            title="Gyroscope"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Standard Controls */}
          <div className="w-px h-6 bg-white/20"></div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsVRMode(!isVRMode)}
            className={cn(
              "p-2 hover:bg-white/20 rounded-full transition-colors",
              isVRMode && "bg-primary/20"
            )}
            title="VR Mode"
          >
            <VrHeadset className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Compass */}
      <AnimatePresence>
        {showCompass && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-20 right-4"
          >
            <canvas
              ref={compassRef}
              width={80}
              height={80}
              className="bg-black/50 rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Map */}
      <AnimatePresence>
        {showMiniMap && tour.levels && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md text-white p-3 rounded-xl"
          >
            <div className="w-48 h-32 bg-gray-700 rounded relative">
              <Map className="absolute inset-0 w-full h-full text-gray-400" />
              {/* Mini map implementation would go here */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark */}
      {watermark && (
        <div className="absolute bottom-2 left-2 text-white/50 text-xs">
          Powered by Advanced VR Tour
        </div>
      )}

      {/* Custom Controls Slot */}
      {customControls}
    </div>
  );
};

export default AdvancedVirtualTourViewer;