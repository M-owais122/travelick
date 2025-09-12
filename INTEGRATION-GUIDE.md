# 🔌 Virtual Tour Platform Integration Guide

This guide will help you integrate the Virtual Tour Platform into your existing React/Next.js project.

## 📋 Prerequisites

- React 18+ or Next.js 13+
- TypeScript (recommended)
- Tailwind CSS (recommended)
- Node.js backend (for API)

## 🚀 Quick Integration (5 minutes)

### Step 1: Install Dependencies

```bash
npm install three panolens axios react-dropzone react-hot-toast framer-motion lucide-react clsx tailwind-merge @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tooltip
```

### Step 2: Copy Components

```bash
# Copy the components to your project
cp -r virtual-tour-frontend/components/* your-project/components/virtual-tour/
cp -r virtual-tour-frontend/lib/* your-project/lib/virtual-tour/
```

### Step 3: Basic Usage

```tsx
// pages/tour/[id].tsx or app/tour/[id]/page.tsx
import { VirtualTourViewer } from '@/components/virtual-tour/VirtualTourViewer';

export default function TourPage({ tour }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{tour.title}</h1>
      <VirtualTourViewer 
        tour={tour}
        className="w-full h-96 rounded-lg"
        showControls={true}
        showInfo={true}
      />
    </div>
  );
}
```

## 🛠️ Detailed Integration Steps

### 1. Backend API Setup

First, set up the backend API server:

```bash
cd your-project-backend
npm install express multer sharp cors helmet compression morgan uuid joi dotenv express-rate-limit
```

Copy the backend routes:

```bash
cp -r virtual-tour-backend/routes your-project-backend/
cp virtual-tour-backend/server.js your-project-backend/virtual-tour-server.js
```

Integrate with your existing server:

```javascript
// your-existing-server.js
const express = require('express');
const tourRoutes = require('./routes/tours');
const uploadRoutes = require('./routes/upload');
const shareRoutes = require('./routes/share');

const app = express();

// ... your existing middleware ...

// Add virtual tour routes
app.use('/api/tours', tourRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/share', shareRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));
```

### 2. Environment Configuration

Add these variables to your `.env`:

```env
# Virtual Tour Configuration
VIRTUAL_TOUR_UPLOAD_PATH=./uploads
VIRTUAL_TOUR_MAX_FILE_SIZE=50MB
VIRTUAL_TOUR_API_URL=http://localhost:3001/api
```

### 3. TypeScript Configuration

Add type definitions to your `types` folder:

```typescript
// types/virtual-tour.ts
export interface Tour {
  id: string;
  title: string;
  description?: string;
  startingPanoramaId?: string;
  panoramas: Panorama[];
  isPublic: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Panorama {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  hotspots: Hotspot[];
}

export interface Hotspot {
  id: string;
  type: 'navigation' | 'info' | 'custom';
  title: string;
  description?: string;
  position: { x: number; y: number };
  targetPanoramaId?: string;
}
```

### 4. API Client Integration

Integrate the API client with your existing API layer:

```typescript
// lib/api/virtual-tour.ts
import { Tour, Panorama, Hotspot } from '@/types/virtual-tour';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL + '/virtual-tour';

export class VirtualTourService {
  static async getTours(): Promise<Tour[]> {
    const response = await axios.get(`${API_BASE}/tours`);
    return response.data.tours;
  }

  static async getTour(id: string): Promise<Tour> {
    const response = await axios.get(`${API_BASE}/tours/${id}`);
    return response.data;
  }

  static async uploadPanorama(file: File, metadata: any): Promise<Panorama> {
    const formData = new FormData();
    formData.append('panorama', file);
    formData.append('title', metadata.title);
    
    const response = await axios.post(`${API_BASE}/upload/panorama`, formData);
    return response.data.data;
  }
}
```

## 🎯 Usage Patterns

### Pattern 1: Standalone Tour Viewer

```tsx
// components/TourViewer.tsx
'use client';

import { useState, useEffect } from 'react';
import { VirtualTourViewer } from '@/components/virtual-tour/VirtualTourViewer';
import { VirtualTourService } from '@/lib/api/virtual-tour';

interface TourViewerProps {
  tourId: string;
}

export function TourViewer({ tourId }: TourViewerProps) {
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTour = async () => {
      try {
        const tourData = await VirtualTourService.getTour(tourId);
        setTour(tourData);
      } catch (error) {
        console.error('Failed to load tour:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTour();
  }, [tourId]);

  if (loading) return <div className="animate-pulse h-96 bg-gray-200 rounded" />;
  if (!tour) return <div>Tour not found</div>;

  return (
    <VirtualTourViewer
      tour={tour}
      className="w-full h-96"
      showControls={true}
      showInfo={true}
      onPanoramaChange={(panoramaId) => {
        console.log('Switched to panorama:', panoramaId);
      }}
    />
  );
}
```

### Pattern 2: Tour Gallery

```tsx
// components/TourGallery.tsx
import { useState, useEffect } from 'react';
import { VirtualTourService } from '@/lib/api/virtual-tour';
import { TourViewer } from './TourViewer';

export function TourGallery() {
  const [tours, setTours] = useState([]);
  const [selectedTour, setSelectedTour] = useState(null);

  useEffect(() => {
    const loadTours = async () => {
      const toursData = await VirtualTourService.getTours();
      setTours(toursData);
    };
    loadTours();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tours.map((tour) => (
          <div
            key={tour.id}
            className="cursor-pointer border rounded-lg p-4 hover:shadow-lg"
            onClick={() => setSelectedTour(tour)}
          >
            <h3 className="font-semibold">{tour.title}</h3>
            <p className="text-gray-600 text-sm">{tour.description}</p>
            <div className="mt-2 text-xs text-gray-500">
              {tour.panoramas.length} panoramas
            </div>
          </div>
        ))}
      </div>

      {selectedTour && (
        <div className="mt-8">
          <TourViewer tourId={selectedTour.id} />
        </div>
      )}
    </div>
  );
}
```

### Pattern 3: Tour Editor Integration

```tsx
// pages/admin/tours/edit/[id].tsx
import { useState, useEffect } from 'react';
import { TourEditor } from '@/components/virtual-tour/TourEditor';
import { VirtualTourService } from '@/lib/api/virtual-tour';

export default function EditTourPage({ params }) {
  const [tour, setTour] = useState(null);

  const handleSave = async (updatedTour) => {
    await VirtualTourService.updateTour(params.id, updatedTour);
    setTour(updatedTour);
  };

  const handleHotspotAdd = async (panoramaId, hotspot) => {
    return await VirtualTourService.addHotspot(params.id, panoramaId, hotspot);
  };

  return (
    <div className="h-screen">
      {tour && (
        <TourEditor
          tour={tour}
          onSave={handleSave}
          onHotspotAdd={handleHotspotAdd}
          onHotspotUpdate={VirtualTourService.updateHotspot}
          onHotspotDelete={VirtualTourService.deleteHotspot}
          className="w-full h-full"
        />
      )}
    </div>
  );
}
```

### Pattern 4: File Upload Integration

```tsx
// components/UploadForm.tsx
import { useState } from 'react';
import { PanoramaUploader } from '@/components/virtual-tour/PanoramaUploader';
import { VirtualTourService } from '@/lib/api/virtual-tour';

export function UploadForm({ tourId, onUploadComplete }) {
  const handleUpload = async (files) => {
    const results = await Promise.all(
      files.map(file => 
        VirtualTourService.uploadPanorama(file, {
          title: file.name,
          tourId
        })
      )
    );
    
    onUploadComplete?.(results);
    return results;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Upload Panoramas</h2>
      <PanoramaUploader
        onUpload={handleUpload}
        tourId={tourId}
        maxFiles={10}
        maxSize={50}
        className="w-full"
      />
    </div>
  );
}
```

## 🎨 Styling Integration

### With Tailwind CSS (Recommended)

The components are built with Tailwind CSS. Add these to your `tailwind.config.js`:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    // ... your existing content paths
    './components/virtual-tour/**/*.{js,ts,jsx,tsx}',
    './lib/virtual-tour/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'vr-primary': '#39FF14',
        'vr-secondary': '#1a1a2e',
      }
    }
  }
};
```

### With Custom CSS

If you're not using Tailwind, create a CSS file:

```css
/* styles/virtual-tour.css */
.virtual-tour-viewer {
  width: 100%;
  height: 400px;
  border-radius: 0.5rem;
  overflow: hidden;
  position: relative;
  background: #000;
}

.virtual-tour-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.virtual-tour-control-btn {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}

.virtual-tour-control-btn:hover {
  background: rgba(0, 0, 0, 0.9);
}
```

## 📱 Responsive Integration

### Mobile Optimization

```tsx
// hooks/useVirtualTour.ts
import { useState, useEffect } from 'react';

export function useVirtualTour() {
  const [isMobile, setIsMobile] = useState(false);
  const [isVRSupported, setIsVRSupported] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setIsVRSupported('xr' in navigator || 'getVRDisplays' in navigator);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { isMobile, isVRSupported };
}

// Usage in component
export function ResponsiveTourViewer({ tour }) {
  const { isMobile, isVRSupported } = useVirtualTour();

  return (
    <VirtualTourViewer
      tour={tour}
      className={`w-full ${isMobile ? 'h-64' : 'h-96'}`}
      showControls={true}
      showInfo={!isMobile} // Hide info panel on mobile
      autoRotate={isMobile} // Auto-rotate on mobile
    />
  );
}
```

## 🔧 Advanced Configuration

### Custom API Integration

```typescript
// lib/virtual-tour-config.ts
export const virtualTourConfig = {
  apiUrl: process.env.NEXT_PUBLIC_VIRTUAL_TOUR_API,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedFormats: ['image/jpeg', 'image/png'],
  defaultViewerOptions: {
    showControls: true,
    showInfo: true,
    autoRotate: false,
    fov: 75,
  },
  hotspotTypes: {
    navigation: { color: '#39FF14', size: 300 },
    info: { color: '#3B82F6', size: 350 },
    custom: { color: '#EF4444', size: 300 },
  }
};
```

### Error Boundary Integration

```tsx
// components/VirtualTourErrorBoundary.tsx
import React from 'react';

class VirtualTourErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Virtual Tour Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Failed to load virtual tour</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<VirtualTourErrorBoundary>
  <VirtualTourViewer tour={tour} />
</VirtualTourErrorBoundary>
```

## 🚀 Performance Optimization

### Lazy Loading Implementation

```tsx
// components/LazyTourViewer.tsx
import { lazy, Suspense } from 'react';

const VirtualTourViewer = lazy(() => 
  import('@/components/virtual-tour/VirtualTourViewer')
);

export function LazyTourViewer(props) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg" />
      }
    >
      <VirtualTourViewer {...props} />
    </Suspense>
  );
}
```

### Image Optimization

```typescript
// lib/image-optimization.ts
export function optimizePanoramaImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Optimize for VR viewing (4096x2048 is optimal)
      const maxWidth = 4096;
      const maxHeight = 2048;
      
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        const optimizedFile = new File([blob], file.name, {
          type: 'image/jpeg'
        });
        resolve(optimizedFile);
      }, 'image/jpeg', 0.9);
    };

    img.src = URL.createObjectURL(file);
  });
}
```

## 🔍 Testing Integration

### Unit Tests

```typescript
// __tests__/virtual-tour.test.tsx
import { render, screen } from '@testing-library/react';
import { VirtualTourViewer } from '@/components/virtual-tour/VirtualTourViewer';

const mockTour = {
  id: 'test-tour',
  title: 'Test Tour',
  panoramas: [
    {
      id: 'pano-1',
      title: 'Test Panorama',
      url: '/test-image.jpg',
      hotspots: []
    }
  ]
};

test('renders virtual tour viewer', () => {
  render(<VirtualTourViewer tour={mockTour} />);
  expect(screen.getByText('Test Tour')).toBeInTheDocument();
});
```

### E2E Tests

```typescript
// cypress/integration/virtual-tour.spec.ts
describe('Virtual Tour', () => {
  it('should load and navigate tour', () => {
    cy.visit('/tours/test-tour-id');
    
    cy.get('[data-testid="virtual-tour-viewer"]').should('be.visible');
    cy.get('[data-testid="tour-controls"]').should('be.visible');
    
    // Test fullscreen
    cy.get('[data-testid="fullscreen-btn"]').click();
    cy.get('body').should('have.class', 'fullscreen');
    
    // Test hotspot navigation
    cy.get('.hotspot').first().click();
    cy.get('[data-testid="current-panorama"]')
      .should('not.contain', 'Test Panorama');
  });
});
```

## 📦 Deployment Considerations

### Build Configuration

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    // Handle three.js and panolens dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      'three': 'three',
    };
    
    return config;
  },
  env: {
    VIRTUAL_TOUR_API_URL: process.env.VIRTUAL_TOUR_API_URL,
  }
};
```

### CDN Configuration

```typescript
// lib/cdn-config.ts
export const cdnConfig = {
  baseUrl: process.env.CDN_BASE_URL || '',
  panoramaPath: '/panoramas/',
  thumbnailPath: '/thumbnails/',
  
  getImageUrl: (path: string): string => {
    return `${cdnConfig.baseUrl}${path}`;
  },
  
  getThumbnailUrl: (panoramaId: string): string => {
    return `${cdnConfig.baseUrl}${cdnConfig.thumbnailPath}${panoramaId}_thumb.jpg`;
  }
};
```

This integration guide should help you successfully incorporate the Virtual Tour Platform into your existing project. For additional help, refer to the main README.md or create an issue in the repository.