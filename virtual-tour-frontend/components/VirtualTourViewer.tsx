'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Maximize, Minimize, VrHeadset, Settings, Info, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Hotspot {
  id: string;
  type: 'navigation' | 'info' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number; // longitude (-180 to 180)
    y: number; // latitude (-90 to 90)
    z?: number;
  };
  targetPanoramaId?: string;
  customData?: any;
}

interface Panorama {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  hotspots: Hotspot[];
}

interface Tour {
  id: string;
  title: string;
  description?: string;
  startingPanoramaId?: string;
  panoramas: Panorama[];
}

interface VirtualTourViewerProps {
  tour: Tour;
  className?: string;
  showControls?: boolean;
  showInfo?: boolean;
  autoRotate?: boolean;
  onPanoramaChange?: (panoramaId: string) => void;
  onHotspotClick?: (hotspot: Hotspot) => void;
}

declare global {
  interface Window {
    THREE: any;
    PANOLENS: any;
  }
}

const VirtualTourViewer: React.FC<VirtualTourViewerProps> = ({
  tour,
  className,
  showControls = true,
  showInfo = true,
  autoRotate = false,
  onPanoramaChange,
  onHotspotClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const panoramasRef = useRef<{ [key: string]: any }>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVRMode, setIsVRMode] = useState(false);
  const [currentPanorama, setCurrentPanorama] = useState<Panorama | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(showInfo);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // Load required scripts
  useEffect(() => {
    const loadScripts = async () => {
      if (window.THREE && window.PANOLENS) {
        setScriptsLoaded(true);
        return;
      }

      try {
        // Load THREE.js
        if (!window.THREE) {
          const threeScript = document.createElement('script');
          threeScript.src = 'https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js';
          threeScript.async = true;
          document.head.appendChild(threeScript);
          
          await new Promise((resolve, reject) => {
            threeScript.onload = resolve;
            threeScript.onerror = reject;
          });
        }

        // Load Panolens.js
        if (!window.PANOLENS) {
          const panolensScript = document.createElement('script');
          panolensScript.src = 'https://cdn.jsdelivr.net/npm/panolens@0.12.1/build/panolens.min.js';
          panolensScript.async = true;
          document.head.appendChild(panolensScript);
          
          await new Promise((resolve, reject) => {
            panolensScript.onload = resolve;
            panolensScript.onerror = reject;
          });
        }

        setScriptsLoaded(true);
      } catch (error) {
        console.error('Failed to load required scripts:', error);
        setError('Failed to load viewer components');
      }
    };

    loadScripts();
  }, []);

  // Initialize viewer
  useEffect(() => {
    if (!scriptsLoaded || !containerRef.current || !tour.panoramas?.length) {
      return;
    }

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create viewer
        const viewer = new window.PANOLENS.Viewer({
          container: containerRef.current,
          autoHideInfospot: false,
          controlBar: showControls,
          enableReticle: true,
          dwellTime: 1500,
          autoRotate: autoRotate,
          autoRotateSpeed: 0.3,
          cameraFov: 75,
          reverseDragging: false
        });

        viewerRef.current = viewer;
        const panoramasMap: { [key: string]: any } = {};

        // Create panoramas
        for (const panoramaData of tour.panoramas) {
          const panorama = new window.PANOLENS.ImagePanorama(panoramaData.url);
          panoramasMap[panoramaData.id] = panorama;
          viewer.add(panorama);

          // Add hotspots
          if (panoramaData.hotspots?.length) {
            panoramaData.hotspots.forEach((hotspot) => {
              let infospot;
              
              if (hotspot.type === 'navigation') {
                infospot = new window.PANOLENS.Infospot(300, window.PANOLENS.DataImage.Arrow);
              } else if (hotspot.type === 'info') {
                infospot = new window.PANOLENS.Infospot(350, window.PANOLENS.DataImage.Info);
              } else {
                infospot = new window.PANOLENS.Infospot(300, window.PANOLENS.DataImage.Info);
              }

              // Calculate 3D position from spherical coordinates
              const phi = (90 - hotspot.position.y) * Math.PI / 180;
              const theta = (hotspot.position.x + 180) * Math.PI / 180;
              const radius = 5000;

              infospot.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
              );

              infospot.addHoverText(hotspot.title);

              // Add click handler
              infospot.addEventListener('click', () => {
                onHotspotClick?.(hotspot);
                
                if (hotspot.type === 'navigation' && hotspot.targetPanoramaId) {
                  const targetPanorama = panoramasMap[hotspot.targetPanoramaId];
                  if (targetPanorama) {
                    viewer.setPanorama(targetPanorama);
                  }
                }
              });

              panorama.add(infospot);
            });
          }

          // Listen for panorama enter events
          panorama.addEventListener('enter', () => {
            const panoData = tour.panoramas.find(p => p.id === panoramaData.id);
            if (panoData) {
              setCurrentPanorama(panoData);
              onPanoramaChange?.(panoramaData.id);
            }
          });
        }

        panoramasRef.current = panoramasMap;

        // Set starting panorama
        const startingPanorama = tour.startingPanoramaId 
          ? panoramasMap[tour.startingPanoramaId]
          : Object.values(panoramasMap)[0];

        if (startingPanorama) {
          viewer.setPanorama(startingPanorama);
        }

        setIsLoading(false);

      } catch (error) {
        console.error('Error initializing viewer:', error);
        setError('Failed to initialize tour viewer');
        setIsLoading(false);
      }
    };

    initViewer();

    // Cleanup
    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
      panoramasRef.current = {};
    };
  }, [scriptsLoaded, tour, showControls, autoRotate, onPanoramaChange, onHotspotClick]);

  // Fullscreen handlers
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, []);

  const toggleVR = useCallback(() => {
    if (viewerRef.current) {
      try {
        viewerRef.current.enableEffect(window.PANOLENS.MODES.VR);
        setIsVRMode(true);
      } catch (error) {
        console.error('VR mode error:', error);
      }
    }
  }, []);

  const navigateToPanorama = useCallback((panoramaId: string) => {
    const panorama = panoramasRef.current[panoramaId];
    if (panorama && viewerRef.current) {
      viewerRef.current.setPanorama(panorama);
    }
  }, []);

  if (error) {
    return (
      <div className={cn('w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg', className)}>
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative w-full h-96 bg-black rounded-lg overflow-hidden', className)}>
      {/* Main viewer container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading Virtual Tour...</p>
          </div>
        </div>
      )}

      {/* Info panel */}
      {showInfoPanel && currentPanorama && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg max-w-sm">
          <h3 className="font-semibold text-lg mb-1">{currentPanorama.title}</h3>
          {currentPanorama.description && (
            <p className="text-sm text-gray-300">{currentPanorama.description}</p>
          )}
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
            title="Toggle Info"
          >
            <Info className="w-5 h-5" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleVR}
            className="bg-black bg-opacity-70 text-white p-2 rounded-lg hover:bg-opacity-90 transition-all"
            title="Enter VR Mode"
          >
            <VrHeadset className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Scene navigation (thumbnail strip) */}
      {tour.panoramas.length > 1 && (
        <div className="absolute bottom-4 left-4 flex gap-2 max-w-md overflow-x-auto">
          {tour.panoramas.map((panorama) => (
            <button
              key={panorama.id}
              onClick={() => navigateToPanorama(panorama.id)}
              className={cn(
                'flex-shrink-0 w-16 h-10 rounded border-2 overflow-hidden transition-all',
                currentPanorama?.id === panorama.id
                  ? 'border-white shadow-lg'
                  : 'border-gray-400 opacity-70 hover:opacity-100'
              )}
              title={panorama.title}
            >
              {panorama.thumbnailUrl ? (
                <img
                  src={panorama.thumbnailUrl}
                  alt={panorama.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white">
                  {panorama.title.charAt(0)}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VirtualTourViewer;