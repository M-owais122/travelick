'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, ArrowUp, ArrowDown, Map, Eye, EyeOff, 
  Plus, Trash2, Edit3, Move, RotateCw, ZoomIn, ZoomOut,
  Save, Upload, Download, Share, Settings, Grid3X3,
  Layers, Navigation, Home, Elevator, Stairs, MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorPlan {
  id: string;
  url: string;
  width: number;
  height: number;
  scale: number; // meters per pixel
  rotation: number; // degrees
  offset: { x: number; y: number }; // calibration offset
}

interface PanoramaPosition {
  x: number; // position on floor plan (pixels)
  y: number; // position on floor plan (pixels)
  rotation: number; // panorama orientation (degrees)
  elevation: number; // height above floor (meters)
}

interface TourLevel {
  id: string;
  name: string;
  floor: number;
  elevation: number; // meters above ground level
  panoramas: string[]; // panorama IDs
  floorPlan?: FloorPlan;
  connections: Array<{
    id: string;
    type: 'stairs' | 'elevator' | 'ramp' | 'custom';
    position: { x: number; y: number };
    targetLevelId: string;
    targetPosition?: { x: number; y: number };
    bidirectional: boolean;
  }>;
  visibility: boolean;
  color: string; // for UI differentiation
}

interface MultiLevelTour {
  id: string;
  title: string;
  levels: TourLevel[];
  panoramas: Array<{
    id: string;
    title: string;
    url: string;
    levelId: string;
    position: PanoramaPosition;
    hotspots: any[];
  }>;
  settings: {
    defaultLevel: string;
    showFloorPlans: boolean;
    showPanoramaPositions: boolean;
    showConnections: boolean;
    enableLevelSwitching: boolean;
    transitionAnimation: 'fade' | 'slide' | 'zoom' | 'none';
  };
}

interface MultiLevelTourManagerProps {
  tour: MultiLevelTour;
  onTourUpdate: (tour: MultiLevelTour) => void;
  onPanoramaSelect: (panoramaId: string) => void;
  onLevelSwitch: (levelId: string) => void;
  selectedPanoramaId?: string;
  currentLevelId?: string;
  mode: 'view' | 'edit';
  className?: string;
}

const MultiLevelTourManager: React.FC<MultiLevelTourManagerProps> = ({
  tour,
  onTourUpdate,
  onPanoramaSelect,
  onLevelSwitch,
  selectedPanoramaId,
  currentLevelId,
  mode = 'view',
  className
}) => {
  const [selectedLevel, setSelectedLevel] = useState<string>(currentLevelId || tour.settings.defaultLevel);
  const [showFloorPlan, setShowFloorPlan] = useState(tour.settings.showFloorPlans);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [isAddingPanorama, setIsAddingPanorama] = useState(false);
  const [isAddingConnection, setIsAddingConnection] = useState(false);
  const [dragMode, setDragMode] = useState<'none' | 'panorama' | 'connection'>('none');
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentLevel = tour.levels.find(level => level.id === selectedLevel);
  const currentPanoramas = tour.panoramas.filter(p => p.levelId === selectedLevel);

  // Level switching handler
  const handleLevelSwitch = (levelId: string) => {
    setSelectedLevel(levelId);
    onLevelSwitch(levelId);
  };

  // Render floor plan on canvas
  useEffect(() => {
    if (!canvasRef.current || !currentLevel?.floorPlan) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const floorPlan = currentLevel.floorPlan;
    
    // Load and draw floor plan image
    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Apply transformations
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(pan.x, pan.y);
      ctx.rotate((floorPlan.rotation * Math.PI) / 180);
      
      // Draw floor plan
      ctx.drawImage(img, 0, 0, floorPlan.width, floorPlan.height);
      
      // Draw panoramas
      drawPanoramas(ctx);
      
      // Draw connections
      if (tour.settings.showConnections) {
        drawConnections(ctx);
      }
      
      ctx.restore();
    };
    img.src = floorPlan.url;
  }, [currentLevel, scale, pan, selectedPanoramaId, tour.settings]);

  const drawPanoramas = (ctx: CanvasRenderingContext2D) => {
    currentPanoramas.forEach(panorama => {
      const { x, y } = panorama.position;
      const isSelected = panorama.id === selectedPanoramaId;
      
      // Draw panorama indicator
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 12 : 8, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#39FF14' : '#3B82F6';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw orientation indicator
      const orientationRadius = isSelected ? 20 : 15;
      const orientationX = x + Math.cos(panorama.position.rotation * Math.PI / 180) * orientationRadius;
      const orientationY = y + Math.sin(panorama.position.rotation * Math.PI / 180) * orientationRadius;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(orientationX, orientationY);
      ctx.strokeStyle = isSelected ? '#39FF14' : '#3B82F6';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw label
      if (tour.settings.showPanoramaPositions) {
        ctx.font = '12px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText(panorama.title, x + 15, y - 15);
      }
    });
  };

  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    if (!currentLevel) return;
    
    currentLevel.connections.forEach(connection => {
      const { x, y } = connection.position;
      
      // Draw connection point
      ctx.beginPath();
      ctx.rect(x - 8, y - 8, 16, 16);
      
      switch (connection.type) {
        case 'stairs':
          ctx.fillStyle = '#F59E0B';
          break;
        case 'elevator':
          ctx.fillStyle = '#8B5CF6';
          break;
        case 'ramp':
          ctx.fillStyle = '#10B981';
          break;
        default:
          ctx.fillStyle = '#6B7280';
      }
      
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw connection icon
      ctx.font = '10px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(connection.type === 'stairs' ? '🪜' : connection.type === 'elevator' ? '🛗' : '🛤️', x, y + 3);
    });
  };

  // Handle canvas interactions
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentLevel?.floorPlan) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - pan.x) / scale;
    const y = (event.clientY - rect.top - pan.y) / scale;

    if (mode === 'edit') {
      if (isAddingPanorama) {
        addPanoramaAtPosition(x, y);
      } else if (isAddingConnection) {
        addConnectionAtPosition(x, y);
      } else {
        // Select panorama at clicked position
        const clickedPanorama = findPanoramaAtPosition(x, y);
        if (clickedPanorama) {
          onPanoramaSelect(clickedPanorama.id);
        }
      }
    } else {
      // View mode - just select panorama
      const clickedPanorama = findPanoramaAtPosition(x, y);
      if (clickedPanorama) {
        onPanoramaSelect(clickedPanorama.id);
      }
    }
  };

  const findPanoramaAtPosition = (x: number, y: number) => {
    return currentPanoramas.find(panorama => {
      const distance = Math.sqrt(
        Math.pow(panorama.position.x - x, 2) + Math.pow(panorama.position.y - y, 2)
      );
      return distance <= 15;
    });
  };

  const addPanoramaAtPosition = (x: number, y: number) => {
    const newPanorama = {
      id: `panorama-${Date.now()}`,
      title: `Panorama ${currentPanoramas.length + 1}`,
      url: '',
      levelId: selectedLevel,
      position: {
        x,
        y,
        rotation: 0,
        elevation: 1.6 // Standard eye level
      },
      hotspots: []
    };

    const updatedTour = {
      ...tour,
      panoramas: [...tour.panoramas, newPanorama]
    };

    onTourUpdate(updatedTour);
    setIsAddingPanorama(false);
  };

  const addConnectionAtPosition = (x: number, y: number) => {
    if (!currentLevel) return;

    const newConnection = {
      id: `connection-${Date.now()}`,
      type: 'stairs' as const,
      position: { x, y },
      targetLevelId: tour.levels.find(l => l.id !== selectedLevel)?.id || '',
      bidirectional: true
    };

    const updatedLevel = {
      ...currentLevel,
      connections: [...currentLevel.connections, newConnection]
    };

    const updatedTour = {
      ...tour,
      levels: tour.levels.map(level => 
        level.id === selectedLevel ? updatedLevel : level
      )
    };

    onTourUpdate(updatedTour);
    setIsAddingConnection(false);
  };

  const addNewLevel = () => {
    const newLevel: TourLevel = {
      id: `level-${Date.now()}`,
      name: `Level ${tour.levels.length + 1}`,
      floor: tour.levels.length,
      elevation: tour.levels.length * 3, // 3 meters per floor
      panoramas: [],
      connections: [],
      visibility: true,
      color: `hsl(${tour.levels.length * 60}, 70%, 50%)`
    };

    const updatedTour = {
      ...tour,
      levels: [...tour.levels, newLevel]
    };

    onTourUpdate(updatedTour);
    setSelectedLevel(newLevel.id);
  };

  const deleteLevel = (levelId: string) => {
    const updatedTour = {
      ...tour,
      levels: tour.levels.filter(level => level.id !== levelId),
      panoramas: tour.panoramas.filter(panorama => panorama.levelId !== levelId)
    };

    onTourUpdate(updatedTour);
    
    if (selectedLevel === levelId) {
      setSelectedLevel(tour.levels[0]?.id || '');
    }
  };

  const toggleLevelVisibility = (levelId: string) => {
    const updatedTour = {
      ...tour,
      levels: tour.levels.map(level => 
        level.id === levelId 
          ? { ...level, visibility: !level.visibility }
          : level
      )
    };

    onTourUpdate(updatedTour);
  };

  const updateLevelName = (levelId: string, name: string) => {
    const updatedTour = {
      ...tour,
      levels: tour.levels.map(level => 
        level.id === levelId 
          ? { ...level, name }
          : level
      )
    };

    onTourUpdate(updatedTour);
    setEditingLevel(null);
  };

  return (
    <div className={cn('flex flex-col h-full bg-gray-50', className)}>
      {/* Level Selector */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Multi-Level Tour</h3>
        </div>
        
        <div className="flex items-center gap-2">
          {mode === 'edit' && (
            <button
              onClick={addNewLevel}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Add Level"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowFloorPlan(!showFloorPlan)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showFloorPlan ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
            )}
            title="Toggle Floor Plan"
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Level List */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-3">
            <div className="text-sm text-gray-500 mb-2">Levels ({tour.levels.length})</div>
            
            <div className="space-y-1">
              {tour.levels
                .sort((a, b) => b.floor - a.floor) // Top floors first
                .map((level) => (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all",
                      selectedLevel === level.id
                        ? "bg-blue-50 border-2 border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    )}
                    onClick={() => handleLevelSwitch(level.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: level.color }}
                        />
                        
                        {editingLevel === level.id ? (
                          <input
                            type="text"
                            defaultValue={level.name}
                            className="text-sm font-medium bg-transparent border-b border-blue-300 focus:outline-none"
                            onBlur={(e) => updateLevelName(level.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateLevelName(level.id, e.currentTarget.value);
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium">{level.name}</span>
                        )}
                      </div>
                      
                      {mode === 'edit' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLevelVisibility(level.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {level.visibility ? 
                              <Eye className="w-3 h-3" /> : 
                              <EyeOff className="w-3 h-3" />
                            }
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLevel(level.id);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          
                          {tour.levels.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLevel(level.id);
                              }}
                              className="p-1 hover:bg-red-100 text-red-600 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      <div>Floor: {level.floor}</div>
                      <div>Elevation: {level.elevation}m</div>
                      <div>Panoramas: {tour.panoramas.filter(p => p.levelId === level.id).length}</div>
                      <div>Connections: {level.connections.length}</div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* Level Navigation */}
          {currentLevel && (
            <div className="p-3 border-t">
              <div className="text-sm text-gray-500 mb-2">Quick Navigation</div>
              
              <div className="space-y-1">
                {tour.levels
                  .filter(level => level.id !== selectedLevel)
                  .map(level => (
                    <button
                      key={level.id}
                      onClick={() => handleLevelSwitch(level.id)}
                      className="w-full flex items-center gap-2 p-2 text-left hover:bg-gray-100 rounded text-sm"
                    >
                      {level.floor > (currentLevel?.floor || 0) ? 
                        <ArrowUp className="w-3 h-3" /> : 
                        <ArrowDown className="w-3 h-3" />
                      }
                      {level.name}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Floor Plan Viewer */}
        <div className="flex-1 relative">
          {showFloorPlan && currentLevel?.floorPlan ? (
            <div ref={containerRef} className="w-full h-full relative">
              {/* Canvas for floor plan */}
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full h-full object-contain cursor-crosshair"
                onClick={handleCanvasClick}
              />

              {/* Canvas Controls */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-2 space-y-1">
                <button
                  onClick={() => setScale(Math.min(scale * 1.2, 3))}
                  className="p-2 hover:bg-gray-100 rounded w-full"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setScale(Math.max(scale / 1.2, 0.1))}
                  className="p-2 hover:bg-gray-100 rounded w-full"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    setScale(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="p-2 hover:bg-gray-100 rounded w-full"
                  title="Reset View"
                >
                  <Home className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Mode Tools */}
              {mode === 'edit' && (
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3">
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setIsAddingPanorama(!isAddingPanorama);
                        setIsAddingConnection(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors",
                        isAddingPanorama 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-100 hover:bg-gray-200"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                      Add Panorama
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsAddingConnection(!isAddingConnection);
                        setIsAddingPanorama(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors",
                        isAddingConnection 
                          ? "bg-green-600 text-white" 
                          : "bg-gray-100 hover:bg-gray-200"
                      )}
                    >
                      <Navigation className="w-4 h-4" />
                      Add Connection
                    </button>
                  </div>

                  {(isAddingPanorama || isAddingConnection) && (
                    <div className="mt-2 text-xs text-gray-600">
                      Click on the floor plan to add {isAddingPanorama ? 'panorama' : 'connection'}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center text-gray-500">
                <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No Floor Plan Available</p>
                <p className="text-sm">Upload a floor plan to visualize this level</p>
                
                {mode === 'edit' && (
                  <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Floor Plan
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Level Info Panel */}
      <AnimatePresence>
        {currentLevel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border-t p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{currentLevel.name}</h4>
                <div className="text-sm text-gray-500 space-x-4">
                  <span>Floor: {currentLevel.floor}</span>
                  <span>Elevation: {currentLevel.elevation}m</span>
                  <span>Panoramas: {currentPanoramas.length}</span>
                  <span>Connections: {currentLevel.connections.length}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentLevel.connections.map(connection => (
                  <div
                    key={connection.id}
                    className="px-2 py-1 bg-gray-100 rounded text-xs flex items-center gap-1"
                  >
                    {connection.type === 'stairs' && <Stairs className="w-3 h-3" />}
                    {connection.type === 'elevator' && <Elevator className="w-3 h-3" />}
                    {connection.type}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiLevelTourManager;