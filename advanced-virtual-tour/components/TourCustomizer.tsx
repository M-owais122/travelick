'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, Upload, Type, Sliders, Eye, Download, 
  Undo, Redo, Copy, Save, Settings, Image, 
  Music, Volume2, Play, Pause, SkipForward,
  Layers, Grid, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, Link, Monitor, Smartphone,
  Tablet, VrHeadset, Sun, Moon, Contrast, Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Branding and Customization Types
interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  overlay: string;
}

interface Typography {
  fontFamily: string;
  headingSize: number;
  bodySize: number;
  captionSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  letterSpacing: number;
  lineHeight: number;
}

interface UIElements {
  showLogo: boolean;
  logoUrl?: string;
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  logoSize: number;
  showWatermark: boolean;
  watermarkText: string;
  showPoweredBy: boolean;
}

interface ControlsTheme {
  style: 'modern' | 'classic' | 'minimal' | 'glassmorphism';
  position: 'bottom' | 'top' | 'floating';
  size: 'small' | 'medium' | 'large';
  transparency: number;
  borderRadius: number;
  showLabels: boolean;
  iconStyle: 'outline' | 'filled' | 'duotone';
}

interface AudioSettings {
  backgroundMusic?: {
    url: string;
    volume: number;
    fadeIn: boolean;
    fadeOut: boolean;
    loop: boolean;
  };
  soundEffects: {
    hotspotClick: string;
    panoramaTransition: string;
    navigationSound: string;
    volume: number;
  };
  spatialAudio: boolean;
  enableAutoNarration: boolean;
}

interface AdvancedSettings {
  loadingScreen: {
    showCustomLoader: boolean;
    loaderType: 'spinner' | 'progress' | 'dots' | 'custom';
    backgroundColor: string;
    logoUrl?: string;
    message: string;
  };
  transitions: {
    type: 'fade' | 'slide' | 'zoom' | 'morph' | 'none';
    duration: number;
    easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  };
  interactions: {
    cursorStyle: 'default' | 'custom';
    cursorUrl?: string;
    hoverEffects: boolean;
    touchFeedback: boolean;
  };
  performance: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    preloadNext: boolean;
    lazyLoading: boolean;
    compression: boolean;
  };
}

interface TourTheme {
  id: string;
  name: string;
  colors: BrandColors;
  typography: Typography;
  uiElements: UIElements;
  controlsTheme: ControlsTheme;
  audioSettings: AudioSettings;
  advancedSettings: AdvancedSettings;
  customCSS?: string;
  isActive: boolean;
}

interface TourCustomizerProps {
  currentTheme: TourTheme;
  onThemeUpdate: (theme: TourTheme) => void;
  onPreview: (device: 'desktop' | 'mobile' | 'tablet' | 'vr') => void;
  onSave: () => void;
  onExport: (format: 'json' | 'css' | 'scss') => void;
  className?: string;
}

const TourCustomizer: React.FC<TourCustomizerProps> = ({
  currentTheme,
  onThemeUpdate,
  onPreview,
  onSave,
  onExport,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'ui' | 'controls' | 'audio' | 'advanced'>('colors');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile' | 'tablet' | 'vr'>('desktop');
  const [showPreview, setShowPreview] = useState(true);
  const [undoStack, setUndoStack] = useState<TourTheme[]>([]);
  const [redoStack, setRedoStack] = useState<TourTheme[]>([]);
  
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const logoUploadRef = useRef<HTMLInputElement>(null);
  const cssEditorRef = useRef<HTMLTextAreaElement>(null);

  // Predefined theme templates
  const themeTemplates = [
    {
      name: 'Modern Dark',
      colors: {
        primary: '#3B82F6',
        secondary: '#1F2937',
        accent: '#10B981',
        background: '#111827',
        text: '#F9FAFB',
        overlay: 'rgba(0, 0, 0, 0.8)'
      }
    },
    {
      name: 'Warm Light',
      colors: {
        primary: '#F59E0B',
        secondary: '#FEF3C7',
        accent: '#EF4444',
        background: '#FFFBEB',
        text: '#1F2937',
        overlay: 'rgba(255, 255, 255, 0.9)'
      }
    },
    {
      name: 'Ocean Blue',
      colors: {
        primary: '#0EA5E9',
        secondary: '#0F172A',
        accent: '#06B6D4',
        background: '#0C4A6E',
        text: '#E0F2FE',
        overlay: 'rgba(6, 182, 212, 0.3)'
      }
    },
    {
      name: 'Forest Green',
      colors: {
        primary: '#059669',
        secondary: '#064E3B',
        accent: '#10B981',
        background: '#022C22',
        text: '#ECFDF5',
        overlay: 'rgba(16, 185, 129, 0.2)'
      }
    }
  ];

  // Save to undo stack before making changes
  const saveToUndoStack = () => {
    setUndoStack(prev => [...prev.slice(-9), { ...currentTheme }]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    
    const previousTheme = undoStack[undoStack.length - 1];
    setRedoStack(prev => [currentTheme, ...prev.slice(0, 9)]);
    setUndoStack(prev => prev.slice(0, -1));
    onThemeUpdate(previousTheme);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    
    const nextTheme = redoStack[0];
    setUndoStack(prev => [...prev.slice(-9), currentTheme]);
    setRedoStack(prev => prev.slice(1));
    onThemeUpdate(nextTheme);
  };

  const updateTheme = (updates: Partial<TourTheme>) => {
    saveToUndoStack();
    onThemeUpdate({ ...currentTheme, ...updates });
  };

  const updateColors = (colorUpdates: Partial<BrandColors>) => {
    updateTheme({
      colors: { ...currentTheme.colors, ...colorUpdates }
    });
  };

  const updateTypography = (typographyUpdates: Partial<Typography>) => {
    updateTheme({
      typography: { ...currentTheme.typography, ...typographyUpdates }
    });
  };

  const updateUIElements = (uiUpdates: Partial<UIElements>) => {
    updateTheme({
      uiElements: { ...currentTheme.uiElements, ...uiUpdates }
    });
  };

  const updateControlsTheme = (controlsUpdates: Partial<ControlsTheme>) => {
    updateTheme({
      controlsTheme: { ...currentTheme.controlsTheme, ...controlsUpdates }
    });
  };

  const updateAudioSettings = (audioUpdates: Partial<AudioSettings>) => {
    updateTheme({
      audioSettings: { ...currentTheme.audioSettings, ...audioUpdates }
    });
  };

  const updateAdvancedSettings = (advancedUpdates: Partial<AdvancedSettings>) => {
    updateTheme({
      advancedSettings: { ...currentTheme.advancedSettings, ...advancedUpdates }
    });
  };

  const applyTemplate = (template: typeof themeTemplates[0]) => {
    saveToUndoStack();
    updateColors(template.colors);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const logoUrl = e.target?.result as string;
      updateUIElements({ logoUrl, showLogo: true });
    };
    reader.readAsDataURL(file);
  };

  const exportTheme = (format: 'json' | 'css' | 'scss') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(currentTheme, null, 2);
        filename = `theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        mimeType = 'application/json';
        break;
        
      case 'css':
        content = generateCSS(currentTheme);
        filename = `theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}.css`;
        mimeType = 'text/css';
        break;
        
      case 'scss':
        content = generateSCSS(currentTheme);
        filename = `theme-${currentTheme.name.toLowerCase().replace(/\s+/g, '-')}.scss`;
        mimeType = 'text/scss';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    onExport(format);
  };

  const generateCSS = (theme: TourTheme): string => {
    return `
/* Virtual Tour Theme: ${theme.name} */
:root {
  /* Colors */
  --vt-color-primary: ${theme.colors.primary};
  --vt-color-secondary: ${theme.colors.secondary};
  --vt-color-accent: ${theme.colors.accent};
  --vt-color-background: ${theme.colors.background};
  --vt-color-text: ${theme.colors.text};
  --vt-color-overlay: ${theme.colors.overlay};
  
  /* Typography */
  --vt-font-family: ${theme.typography.fontFamily};
  --vt-font-size-heading: ${theme.typography.headingSize}px;
  --vt-font-size-body: ${theme.typography.bodySize}px;
  --vt-font-size-caption: ${theme.typography.captionSize}px;
  --vt-font-weight: ${theme.typography.fontWeight};
  --vt-letter-spacing: ${theme.typography.letterSpacing}px;
  --vt-line-height: ${theme.typography.lineHeight};
  
  /* Controls */
  --vt-controls-transparency: ${theme.controlsTheme.transparency};
  --vt-controls-border-radius: ${theme.controlsTheme.borderRadius}px;
}

.virtual-tour-viewer {
  font-family: var(--vt-font-family);
  background-color: var(--vt-color-background);
  color: var(--vt-color-text);
}

.vt-controls {
  background-color: var(--vt-color-overlay);
  border-radius: var(--vt-controls-border-radius);
  opacity: var(--vt-controls-transparency);
}

.vt-button {
  background-color: var(--vt-color-primary);
  color: var(--vt-color-text);
  border-radius: var(--vt-controls-border-radius);
}

.vt-button:hover {
  background-color: var(--vt-color-accent);
}

${theme.customCSS || ''}
    `;
  };

  const generateSCSS = (theme: TourTheme): string => {
    return `
// Virtual Tour Theme: ${theme.name}
$vt-colors: (
  primary: ${theme.colors.primary},
  secondary: ${theme.colors.secondary},
  accent: ${theme.colors.accent},
  background: ${theme.colors.background},
  text: ${theme.colors.text},
  overlay: ${theme.colors.overlay}
);

$vt-typography: (
  font-family: ${theme.typography.fontFamily},
  heading-size: ${theme.typography.headingSize}px,
  body-size: ${theme.typography.bodySize}px,
  caption-size: ${theme.typography.captionSize}px,
  font-weight: ${theme.typography.fontWeight},
  letter-spacing: ${theme.typography.letterSpacing}px,
  line-height: ${theme.typography.lineHeight}
);

.virtual-tour-viewer {
  font-family: map-get($vt-typography, font-family);
  background-color: map-get($vt-colors, background);
  color: map-get($vt-colors, text);
  
  .vt-controls {
    background-color: map-get($vt-colors, overlay);
    border-radius: ${theme.controlsTheme.borderRadius}px;
    opacity: ${theme.controlsTheme.transparency};
  }
  
  .vt-button {
    background-color: map-get($vt-colors, primary);
    color: map-get($vt-colors, text);
    
    &:hover {
      background-color: map-get($vt-colors, accent);
    }
  }
}
    `;
  };

  const ColorPicker: React.FC<{
    label: string;
    value: string;
    onChange: (color: string) => void;
  }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border-2 border-gray-200 cursor-pointer"
          style={{ backgroundColor: value }}
          onClick={() => colorPickerRef.current?.click()}
        />
        <input
          ref={colorPickerRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-0 h-0 opacity-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 px-2 py-1 text-xs border rounded"
        />
      </div>
    </div>
  );

  return (
    <div className={cn('flex h-full bg-gray-50', className)}>
      {/* Sidebar */}
      <div className="w-80 bg-white border-r overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Tour Customizer</h2>
            
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={undoStack.length === 0}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              
              <button
                onClick={redo}
                disabled={redoStack.length === 0}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Redo"
              >
                <Redo className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'colors', label: 'Colors', icon: Palette },
              { id: 'typography', label: 'Typography', icon: Type },
              { id: 'ui', label: 'UI Elements', icon: Layers },
              { id: 'controls', label: 'Controls', icon: Settings },
              { id: 'audio', label: 'Audio', icon: Volume2 },
              { id: 'advanced', label: 'Advanced', icon: Sliders }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-xs rounded-md transition-colors",
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'colors' && (
              <motion.div
                key="colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-medium mb-3">Quick Templates</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {themeTemplates.map(template => (
                      <button
                        key={template.name}
                        onClick={() => applyTemplate(template)}
                        className="p-3 border rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex gap-1 mb-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: template.colors.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: template.colors.secondary }}
                          />
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: template.colors.accent }}
                          />
                        </div>
                        <span className="text-xs">{template.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Brand Colors</h3>
                  <div className="space-y-2">
                    <ColorPicker
                      label="Primary"
                      value={currentTheme.colors.primary}
                      onChange={(color) => updateColors({ primary: color })}
                    />
                    <ColorPicker
                      label="Secondary"
                      value={currentTheme.colors.secondary}
                      onChange={(color) => updateColors({ secondary: color })}
                    />
                    <ColorPicker
                      label="Accent"
                      value={currentTheme.colors.accent}
                      onChange={(color) => updateColors({ accent: color })}
                    />
                    <ColorPicker
                      label="Background"
                      value={currentTheme.colors.background}
                      onChange={(color) => updateColors({ background: color })}
                    />
                    <ColorPicker
                      label="Text"
                      value={currentTheme.colors.text}
                      onChange={(color) => updateColors({ text: color })}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'typography' && (
              <motion.div
                key="typography"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Font Family</label>
                  <select
                    value={currentTheme.typography.fontFamily}
                    onChange={(e) => updateTypography({ fontFamily: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">System Default</option>
                    <option value="Inter, sans-serif">Inter</option>
                    <option value="'Poppins', sans-serif">Poppins</option>
                    <option value="'Roboto', sans-serif">Roboto</option>
                    <option value="'Open Sans', sans-serif">Open Sans</option>
                    <option value="'Montserrat', sans-serif">Montserrat</option>
                    <option value="'Playfair Display', serif">Playfair Display</option>
                    <option value="'Georgia', serif">Georgia</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Heading Size</label>
                    <input
                      type="range"
                      min="16"
                      max="48"
                      value={currentTheme.typography.headingSize}
                      onChange={(e) => updateTypography({ headingSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{currentTheme.typography.headingSize}px</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Body Size</label>
                    <input
                      type="range"
                      min="12"
                      max="20"
                      value={currentTheme.typography.bodySize}
                      onChange={(e) => updateTypography({ bodySize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{currentTheme.typography.bodySize}px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Font Weight</label>
                  <select
                    value={currentTheme.typography.fontWeight}
                    onChange={(e) => updateTypography({ fontWeight: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="normal">Normal</option>
                    <option value="medium">Medium</option>
                    <option value="semibold">Semibold</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Letter Spacing</label>
                    <input
                      type="range"
                      min="-1"
                      max="3"
                      step="0.1"
                      value={currentTheme.typography.letterSpacing}
                      onChange={(e) => updateTypography({ letterSpacing: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{currentTheme.typography.letterSpacing}px</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Line Height</label>
                    <input
                      type="range"
                      min="1"
                      max="2"
                      step="0.1"
                      value={currentTheme.typography.lineHeight}
                      onChange={(e) => updateTypography({ lineHeight: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{currentTheme.typography.lineHeight}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ui' && (
              <motion.div
                key="ui"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <h3 className="font-medium mb-3">Logo Settings</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Logo</span>
                      <input
                        type="checkbox"
                        checked={currentTheme.uiElements.showLogo}
                        onChange={(e) => updateUIElements({ showLogo: e.target.checked })}
                        className="rounded"
                      />
                    </div>

                    {currentTheme.uiElements.showLogo && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">Upload Logo</label>
                          <input
                            ref={logoUploadRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <button
                            onClick={() => logoUploadRef.current?.click()}
                            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                          >
                            <Upload className="w-5 h-5 mx-auto mb-2 text-gray-400" />
                            <span className="text-sm text-gray-600">Click to upload logo</span>
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Logo Position</label>
                          <select
                            value={currentTheme.uiElements.logoPosition}
                            onChange={(e) => updateUIElements({ logoPosition: e.target.value as any })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="center">Center</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Logo Size</label>
                          <input
                            type="range"
                            min="50"
                            max="200"
                            value={currentTheme.uiElements.logoSize}
                            onChange={(e) => updateUIElements({ logoSize: parseInt(e.target.value) })}
                            className="w-full"
                          />
                          <span className="text-xs text-gray-500">{currentTheme.uiElements.logoSize}px</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Watermark & Branding</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show Watermark</span>
                      <input
                        type="checkbox"
                        checked={currentTheme.uiElements.showWatermark}
                        onChange={(e) => updateUIElements({ showWatermark: e.target.checked })}
                        className="rounded"
                      />
                    </div>

                    {currentTheme.uiElements.showWatermark && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Watermark Text</label>
                        <input
                          type="text"
                          value={currentTheme.uiElements.watermarkText}
                          onChange={(e) => updateUIElements({ watermarkText: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="© Your Company Name"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Show "Powered By"</span>
                      <input
                        type="checkbox"
                        checked={currentTheme.uiElements.showPoweredBy}
                        onChange={(e) => updateUIElements({ showPoweredBy: e.target.checked })}
                        className="rounded"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'controls' && (
              <motion.div
                key="controls"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">Control Style</label>
                  <select
                    value={currentTheme.controlsTheme.style}
                    onChange={(e) => updateControlsTheme({ style: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="modern">Modern</option>
                    <option value="classic">Classic</option>
                    <option value="minimal">Minimal</option>
                    <option value="glassmorphism">Glassmorphism</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Position</label>
                  <select
                    value={currentTheme.controlsTheme.position}
                    onChange={(e) => updateControlsTheme({ position: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                    <option value="floating">Floating</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  <select
                    value={currentTheme.controlsTheme.size}
                    onChange={(e) => updateControlsTheme({ size: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Transparency</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={currentTheme.controlsTheme.transparency}
                    onChange={(e) => updateControlsTheme({ transparency: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{Math.round(currentTheme.controlsTheme.transparency * 100)}%</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Border Radius</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={currentTheme.controlsTheme.borderRadius}
                    onChange={(e) => updateControlsTheme({ borderRadius: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{currentTheme.controlsTheme.borderRadius}px</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Show Labels</span>
                  <input
                    type="checkbox"
                    checked={currentTheme.controlsTheme.showLabels}
                    onChange={(e) => updateControlsTheme({ showLabels: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex gap-2">
            <button
              onClick={onSave}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Save Theme
            </button>
            
            <div className="relative">
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                <Download className="w-4 h-4 inline mr-2" />
                Export
              </button>
              {/* Export menu would go here */}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      {showPreview && (
        <div className="flex-1 p-6">
          <div className="bg-white rounded-lg shadow-sm border h-full">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">Live Preview</h3>
              
              <div className="flex items-center gap-2">
                {[
                  { device: 'desktop', icon: Monitor },
                  { device: 'tablet', icon: Tablet },
                  { device: 'mobile', icon: Smartphone },
                  { device: 'vr', icon: VrHeadset }
                ].map(({ device, icon: Icon }) => (
                  <button
                    key={device}
                    onClick={() => {
                      setPreviewDevice(device as any);
                      onPreview(device as any);
                    }}
                    className={cn(
                      "p-2 rounded transition-colors",
                      previewDevice === device
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-400 hover:text-gray-600"
                    )}
                    title={device}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 h-full">
              <div
                className={cn(
                  "mx-auto border-2 border-gray-200 rounded-lg overflow-hidden",
                  previewDevice === 'desktop' && "w-full h-96",
                  previewDevice === 'tablet' && "w-3/4 h-80",
                  previewDevice === 'mobile' && "w-80 h-96",
                  previewDevice === 'vr' && "w-full h-80"
                )}
                style={{
                  backgroundColor: currentTheme.colors.background,
                  color: currentTheme.colors.text,
                  fontFamily: currentTheme.typography.fontFamily
                }}
              >
                {/* Mock tour interface */}
                <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
                  {/* Mock panorama viewer */}
                  <div className="absolute inset-0 bg-black/20" />
                  
                  {/* UI Elements Preview */}
                  {currentTheme.uiElements.showLogo && (
                    <div
                      className={cn(
                        "absolute z-10",
                        currentTheme.uiElements.logoPosition === 'top-left' && "top-4 left-4",
                        currentTheme.uiElements.logoPosition === 'top-right' && "top-4 right-4",
                        currentTheme.uiElements.logoPosition === 'bottom-left' && "bottom-4 left-4",
                        currentTheme.uiElements.logoPosition === 'bottom-right' && "bottom-4 right-4",
                        currentTheme.uiElements.logoPosition === 'center' && "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      )}
                    >
                      <div 
                        className="bg-white/20 backdrop-blur rounded px-3 py-2 text-sm"
                        style={{ fontSize: `${Math.max(currentTheme.uiElements.logoSize / 10, 12)}px` }}
                      >
                        LOGO
                      </div>
                    </div>
                  )}

                  {/* Controls Preview */}
                  <div
                    className={cn(
                      "absolute flex gap-2 z-10",
                      currentTheme.controlsTheme.position === 'bottom' && "bottom-4 left-1/2 transform -translate-x-1/2",
                      currentTheme.controlsTheme.position === 'top' && "top-4 left-1/2 transform -translate-x-1/2",
                      currentTheme.controlsTheme.position === 'floating' && "bottom-4 right-4"
                    )}
                    style={{
                      backgroundColor: currentTheme.colors.overlay,
                      borderRadius: `${currentTheme.controlsTheme.borderRadius}px`,
                      opacity: currentTheme.controlsTheme.transparency,
                      padding: currentTheme.controlsTheme.size === 'large' ? '12px' : currentTheme.controlsTheme.size === 'medium' ? '8px' : '6px'
                    }}
                  >
                    {[Play, Eye, Settings].map((Icon, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-center rounded"
                        style={{
                          backgroundColor: currentTheme.colors.primary,
                          color: currentTheme.colors.text,
                          width: currentTheme.controlsTheme.size === 'large' ? '40px' : currentTheme.controlsTheme.size === 'medium' ? '32px' : '28px',
                          height: currentTheme.controlsTheme.size === 'large' ? '40px' : currentTheme.controlsTheme.size === 'medium' ? '32px' : '28px'
                        }}
                      >
                        <Icon className={cn(
                          currentTheme.controlsTheme.size === 'large' ? 'w-5 h-5' : 'w-4 h-4'
                        )} />
                      </div>
                    ))}
                  </div>

                  {/* Watermark Preview */}
                  {currentTheme.uiElements.showWatermark && (
                    <div className="absolute bottom-2 left-2 text-xs opacity-60">
                      {currentTheme.uiElements.watermarkText}
                    </div>
                  )}

                  {/* Mock hotspot */}
                  <div 
                    className="absolute top-1/2 left-1/3 w-8 h-8 rounded-full flex items-center justify-center animate-pulse cursor-pointer"
                    style={{ backgroundColor: currentTheme.colors.primary }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourCustomizer;