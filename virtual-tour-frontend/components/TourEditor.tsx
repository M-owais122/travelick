'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Plus, Save, Trash2, Edit, Move, Info, Navigation, Settings, Undo, Redo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Types
interface Hotspot {
  id: string;
  type: 'navigation' | 'info' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
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

interface TourEditorProps {
  tour: Tour;
  onSave: (tour: Tour) => void;
  onHotspotAdd: (panoramaId: string, hotspot: Omit<Hotspot, 'id'>) => Promise<string>;
  onHotspotUpdate: (panoramaId: string, hotspot: Hotspot) => Promise<void>;
  onHotspotDelete: (panoramaId: string, hotspotId: string) => Promise<void>;
  className?: string;
}

interface EditingHotspot extends Hotspot {
  isNew?: boolean;
}

const TourEditor: React.FC<TourEditorProps> = ({
  tour,
  onSave,
  onHotspotAdd,
  onHotspotUpdate,
  onHotspotDelete,
  className
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const panoramasRef = useRef<{ [key: string]: any }>({});
  
  const [currentPanorama, setCurrentPanorama] = useState<Panorama | null>(null);
  const [editingHotspot, setEditingHotspot] = useState<EditingHotspot | null>(null);
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [hotspotType, setHotspotType] = useState<'navigation' | 'info' | 'custom'>('navigation');
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<Tour[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load scripts (same as VirtualTourViewer)
  useEffect(() => {
    const loadScripts = async () => {
      if (window.THREE && window.PANOLENS) {
        setScriptsLoaded(true);
        return;
      }

      try {
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
      }
    };

    loadScripts();
  }, []);

  // Initialize editor
  useEffect(() => {
    if (!scriptsLoaded || !containerRef.current || !tour.panoramas?.length) {
      return;
    }

    const initEditor = async () => {
      try {
        setIsLoading(true);

        const viewer = new window.PANOLENS.Viewer({
          container: containerRef.current,
          autoHideInfospot: false,
          controlBar: true,
          enableReticle: true,
          dwellTime: 1500
        });

        viewerRef.current = viewer;
        const panoramasMap: { [key: string]: any } = {};

        // Create panoramas with editable hotspots
        for (const panoramaData of tour.panoramas) {
          const panorama = new window.PANOLENS.ImagePanorama(panoramaData.url);
          panoramasMap[panoramaData.id] = panorama;
          viewer.add(panorama);

          // Add existing hotspots
          if (panoramaData.hotspots?.length) {
            panoramaData.hotspots.forEach((hotspot) => {
              addHotspotToScene(panorama, hotspot, panoramaData.id);
            });
          }

          // Listen for panorama enter events
          panorama.addEventListener('enter', () => {
            setCurrentPanorama(panoramaData);
          });

          // Add click listener for adding new hotspots
          panorama.addEventListener('click', (event: any) => {
            if (isAddingHotspot && event.intersects && event.intersects.length > 0) {
              const intersect = event.intersects[0];
              const position = convertIntersectToSpherical(intersect.point);
              setPendingPosition(position);
              setIsAddingHotspot(false);
              openHotspotEditor(null, position);
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

        // Initialize history
        setHistory([JSON.parse(JSON.stringify(tour))]);
        setHistoryIndex(0);

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing editor:', error);
        setIsLoading(false);
      }
    };

    initEditor();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
      panoramasRef.current = {};
    };
  }, [scriptsLoaded, tour, isAddingHotspot]);

  // Helper functions
  const convertIntersectToSpherical = (point: any) => {
    const vector = new window.THREE.Vector3(point.x, point.y, point.z);
    const spherical = new window.THREE.Spherical();
    spherical.setFromVector3(vector);
    
    const longitude = (spherical.theta * 180 / Math.PI) - 180;
    const latitude = 90 - (spherical.phi * 180 / Math.PI);
    
    return { x: longitude, y: latitude };
  };

  const addHotspotToScene = (panorama: any, hotspot: Hotspot, panoramaId: string) => {
    let infospot;
    
    if (hotspot.type === 'navigation') {
      infospot = new window.PANOLENS.Infospot(300, window.PANOLENS.DataImage.Arrow);
    } else if (hotspot.type === 'info') {
      infospot = new window.PANOLENS.Infospot(350, window.PANOLENS.DataImage.Info);
    } else {
      infospot = new window.PANOLENS.Infospot(300, window.PANOLENS.DataImage.Info);
    }

    // Calculate 3D position
    const phi = (90 - hotspot.position.y) * Math.PI / 180;
    const theta = (hotspot.position.x + 180) * Math.PI / 180;
    const radius = 5000;

    infospot.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );

    infospot.addHoverText(hotspot.title);
    infospot.userData = { hotspotId: hotspot.id, panoramaId };

    // Add edit functionality
    infospot.addEventListener('click', (event: any) => {
      event.stopPropagation();
      openHotspotEditor(hotspot);
    });

    panorama.add(infospot);
    return infospot;
  };

  const openHotspotEditor = (hotspot: Hotspot | null, position?: { x: number; y: number }) => {
    if (hotspot) {
      setEditingHotspot({ ...hotspot });
    } else if (position && currentPanorama) {
      setEditingHotspot({
        id: `temp-${Date.now()}`,
        type: hotspotType,
        title: '',
        description: '',
        position,
        isNew: true
      });
    }
  };

  const saveHotspot = async () => {
    if (!editingHotspot || !currentPanorama) return;

    try {
      if (editingHotspot.isNew) {
        const { id, isNew, ...hotspotData } = editingHotspot;
        const newId = await onHotspotAdd(currentPanorama.id, hotspotData);
        
        // Add to current panorama data
        const updatedPanorama = {
          ...currentPanorama,
          hotspots: [...currentPanorama.hotspots, { ...hotspotData, id: newId }]
        };
        setCurrentPanorama(updatedPanorama);

        // Add to scene
        const panorama = panoramasRef.current[currentPanorama.id];
        if (panorama) {
          addHotspotToScene(panorama, { ...hotspotData, id: newId }, currentPanorama.id);
        }
      } else {
        await onHotspotUpdate(currentPanorama.id, editingHotspot);
        
        // Update current panorama data
        const updatedPanorama = {
          ...currentPanorama,
          hotspots: currentPanorama.hotspots.map(h => 
            h.id === editingHotspot.id ? editingHotspot : h
          )
        };
        setCurrentPanorama(updatedPanorama);
      }

      // Add to history
      addToHistory();
      setEditingHotspot(null);
      toast.success('Hotspot saved successfully');
    } catch (error) {
      console.error('Error saving hotspot:', error);
      toast.error('Failed to save hotspot');
    }
  };

  const deleteHotspot = async (hotspotId: string) => {
    if (!currentPanorama) return;

    try {
      await onHotspotDelete(currentPanorama.id, hotspotId);
      
      // Remove from scene
      const panorama = panoramasRef.current[currentPanorama.id];
      if (panorama) {
        const infospot = panorama.children.find((child: any) => 
          child.userData?.hotspotId === hotspotId
        );
        if (infospot) {
          panorama.remove(infospot);
        }
      }

      // Update current panorama data
      const updatedPanorama = {
        ...currentPanorama,
        hotspots: currentPanorama.hotspots.filter(h => h.id !== hotspotId)
      };
      setCurrentPanorama(updatedPanorama);

      addToHistory();
      toast.success('Hotspot deleted');
    } catch (error) {
      console.error('Error deleting hotspot:', error);
      toast.error('Failed to delete hotspot');
    }
  };

  const addToHistory = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(tour)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      // Apply previous state
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      // Apply next state
    }
  };

  const navigateToPanorama = (panoramaId: string) => {
    const panorama = panoramasRef.current[panoramaId];
    if (panorama && viewerRef.current) {
      viewerRef.current.setPanorama(panorama);
    }
  };

  return (
    <div className={cn('relative w-full h-full bg-black rounded-lg overflow-hidden', className)}>
      {/* Main viewer container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Editor toolbar */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold">Tour Editor</h3>
          <div className="text-sm text-gray-300">
            {currentPanorama?.title}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsAddingHotspot(true)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-all',
              isAddingHotspot 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-600 hover:bg-gray-500'
            )}
          >
            <Plus className="w-4 h-4" />
            Add Hotspot
          </button>

          <select
            value={hotspotType}
            onChange={(e) => setHotspotType(e.target.value as any)}
            className="px-2 py-1.5 bg-gray-600 text-white text-sm rounded"
          >
            <option value="navigation">Navigation</option>
            <option value="info">Information</option>
            <option value="custom">Custom</option>
          </select>

          <button
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50"
          >
            <Undo className="w-4 h-4" />
          </button>

          <button
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 bg-gray-600 hover:bg-gray-500 rounded disabled:opacity-50"
          >
            <Redo className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSave(tour)}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded text-sm"
          >
            <Save className="w-4 h-4" />
            Save Tour
          </button>
        </div>
      </div>

      {/* Hotspots list */}
      {currentPanorama && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg max-w-xs">
          <h4 className="font-semibold mb-2">Hotspots ({currentPanorama.hotspots.length})</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {currentPanorama.hotspots.map((hotspot) => (
              <div key={hotspot.id} className="flex items-center justify-between bg-gray-600 p-2 rounded">
                <div className="flex-1">
                  <div className="text-sm font-medium">{hotspot.title}</div>
                  <div className="text-xs text-gray-300">{hotspot.type}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openHotspotEditor(hotspot)}
                    className="p-1 hover:bg-gray-500 rounded"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteHotspot(hotspot.id)}
                    className="p-1 hover:bg-red-500 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scene navigation */}
      <div className="absolute bottom-4 left-4 flex gap-2 max-w-md overflow-x-auto">
        {tour.panoramas.map((panorama) => (
          <button
            key={panorama.id}
            onClick={() => navigateToPanorama(panorama.id)}
            className={cn(
              'flex-shrink-0 w-16 h-10 rounded border-2 overflow-hidden transition-all',
              currentPanorama?.id === panorama.id
                ? 'border-blue-400 shadow-lg'
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

      {/* Hotspot editor modal */}
      {editingHotspot && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingHotspot.isNew ? 'Add Hotspot' : 'Edit Hotspot'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editingHotspot.title}
                  onChange={(e) => setEditingHotspot({
                    ...editingHotspot,
                    title: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter hotspot title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editingHotspot.type}
                  onChange={(e) => setEditingHotspot({
                    ...editingHotspot,
                    type: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="navigation">Navigation</option>
                  <option value="info">Information</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingHotspot.description || ''}
                  onChange={(e) => setEditingHotspot({
                    ...editingHotspot,
                    description: e.target.value
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Enter description (optional)"
                />
              </div>

              {editingHotspot.type === 'navigation' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Target Panorama</label>
                  <select
                    value={editingHotspot.targetPanoramaId || ''}
                    onChange={(e) => setEditingHotspot({
                      ...editingHotspot,
                      targetPanoramaId: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select panorama</option>
                    {tour.panoramas
                      .filter(p => p.id !== currentPanorama?.id)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingHotspot(null)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveHotspot}
                disabled={!editingHotspot.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {editingHotspot.isNew ? 'Add' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions overlay */}
      {isAddingHotspot && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg p-4 max-w-sm text-center">
            <p className="font-medium mb-2">Adding Hotspot</p>
            <p className="text-sm text-gray-600">Click on the panorama where you want to place the hotspot</p>
            <button
              onClick={() => setIsAddingHotspot(false)}
              className="mt-3 px-4 py-2 bg-gray-600 text-white rounded pointer-events-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourEditor;