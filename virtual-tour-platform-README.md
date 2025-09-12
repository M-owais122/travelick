# 🌍 Virtual Tour Platform

A complete Virtual Tour solution built with React/Next.js frontend and Node.js/Express backend. Create immersive 360° virtual tours with hotspot navigation, VR support, and easy sharing capabilities.

## 🚀 Features

### Core Features
- ✅ **360° Panoramic Viewer** - Immersive panorama viewing with Panolens.js
- ✅ **Hotspot Navigation** - Click/tap hotspots to navigate between panoramas
- ✅ **Tour Editor** - Visual hotspot placement and tour management
- ✅ **File Upload System** - Upload and manage panoramic images
- ✅ **VR Mode Support** - Compatible with VR headsets (Oculus Quest, etc.)
- ✅ **Fullscreen Mode** - Immersive fullscreen viewing experience
- ✅ **Share & Embed** - Generate shareable links and iframe embeds
- ✅ **Responsive Design** - Works on mobile, tablet, and desktop

### Technical Features
- 🔧 **Modular Architecture** - Easy to integrate into existing projects
- 🔧 **TypeScript Support** - Fully typed components and API
- 🔧 **RESTful API** - Well-documented backend API
- 🔧 **Image Validation** - Automatic equirectangular format detection
- 🔧 **Progress Tracking** - Upload progress and status indicators
- 🔧 **Error Handling** - Comprehensive error management
- 🔧 **Caching** - Optimized image loading and caching

## 📁 Project Structure

```
virtual-tour-platform/
├── virtual-tour-backend/          # Node.js/Express API
│   ├── routes/
│   │   ├── upload.js             # File upload endpoints
│   │   ├── tours.js              # Tour management endpoints
│   │   └── share.js              # Sharing endpoints
│   ├── uploads/                  # Uploaded panorama storage
│   ├── data/                     # JSON data storage
│   ├── server.js                 # Main server file
│   └── package.json
│
├── virtual-tour-frontend/         # React/Next.js Components
│   ├── components/
│   │   ├── VirtualTourViewer.tsx # Main 360° viewer component
│   │   ├── TourEditor.tsx        # Visual tour editor
│   │   └── PanoramaUploader.tsx  # File upload component
│   ├── lib/
│   │   ├── api.ts               # API client and hooks
│   │   └── utils.ts             # Utility functions
│   └── package.json
│
└── README.md                     # This file
```

## 🛠️ Quick Setup

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd virtual-tour-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   npm run dev  # Development
   npm start    # Production
   ```

   The API will be available at `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd virtual-tour-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

   Components will be available for integration.

## 🔗 Integration Guide

### Method 1: Direct Component Integration

Copy the components directly into your existing React/Next.js project:

```bash
# Copy components
cp -r virtual-tour-frontend/components/* your-project/components/
cp -r virtual-tour-frontend/lib/* your-project/lib/

# Install required dependencies
npm install three panolens axios react-dropzone react-hot-toast framer-motion lucide-react clsx tailwind-merge
```

### Method 2: NPM Package (Future)

```bash
npm install @your-org/virtual-tour-components
```

## 📖 Usage Examples

### Basic Virtual Tour Viewer

```tsx
import VirtualTourViewer from '@/components/VirtualTourViewer';

function MyTourPage() {
  const tour = {
    id: 'tour-1',
    title: 'My Virtual Tour',
    startingPanoramaId: 'pano-1',
    panoramas: [
      {
        id: 'pano-1',
        title: 'Living Room',
        url: '/images/living-room.jpg',
        hotspots: [
          {
            id: 'hotspot-1',
            type: 'navigation',
            title: 'Go to Kitchen',
            position: { x: 45, y: 0 },
            targetPanoramaId: 'pano-2'
          }
        ]
      },
      // ... more panoramas
    ]
  };

  return (
    <VirtualTourViewer 
      tour={tour}
      className="w-full h-96"
      showControls={true}
      showInfo={true}
    />
  );
}
```

### Tour Editor Integration

```tsx
import TourEditor from '@/components/TourEditor';
import api from '@/lib/api';

function EditTourPage() {
  const handleSave = async (tour) => {
    await api.updateTour(tour.id, tour);
  };

  const handleHotspotAdd = async (panoramaId, hotspot) => {
    return await api.addHotspot(tour.id, panoramaId, hotspot);
  };

  return (
    <TourEditor
      tour={tour}
      onSave={handleSave}
      onHotspotAdd={handleHotspotAdd}
      onHotspotUpdate={api.updateHotspot}
      onHotspotDelete={api.deleteHotspot}
      className="w-full h-screen"
    />
  );
}
```

### File Upload Component

```tsx
import PanoramaUploader from '@/components/PanoramaUploader';
import { useUpload } from '@/lib/api';

function UploadPage() {
  const { uploadMultiple } = useUpload();

  const handleUpload = async (files) => {
    return await uploadMultiple(files, tourId);
  };

  return (
    <PanoramaUploader
      onUpload={handleUpload}
      tourId={tourId}
      maxFiles={10}
      maxSize={50}
    />
  );
}
```

## 🎯 API Reference

### Tours API

| Endpoint | Method | Description |
|----------|---------|------------|
| `/api/tours` | GET | Get all tours |
| `/api/tours/:id` | GET | Get single tour |
| `/api/tours` | POST | Create new tour |
| `/api/tours/:id` | PUT | Update tour |
| `/api/tours/:id` | DELETE | Delete tour |

### Upload API

| Endpoint | Method | Description |
|----------|---------|------------|
| `/api/upload/panorama` | POST | Upload single panorama |
| `/api/upload/tour/panoramas` | POST | Upload multiple panoramas |

### Sharing API

| Endpoint | Method | Description |
|----------|---------|------------|
| `/api/share/create` | POST | Create share link |
| `/api/share/:code` | GET | Get shared tour |
| `/api/share/embed/:code` | GET | Get embed HTML |

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Optional: Database Configuration
# MONGODB_URI=mongodb://localhost:27017/virtual-tours

# Optional: Cloud Storage
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_BUCKET_NAME=your-bucket-name
```

### Component Props

#### VirtualTourViewer Props

```tsx
interface VirtualTourViewerProps {
  tour: Tour;                              // Tour data
  className?: string;                      // CSS classes
  showControls?: boolean;                  // Show control buttons
  showInfo?: boolean;                      // Show info panel
  autoRotate?: boolean;                    // Auto-rotate panorama
  onPanoramaChange?: (id: string) => void; // Panorama change callback
  onHotspotClick?: (hotspot: Hotspot) => void; // Hotspot click callback
}
```

#### TourEditor Props

```tsx
interface TourEditorProps {
  tour: Tour;                                    // Tour data
  onSave: (tour: Tour) => void;                  // Save callback
  onHotspotAdd: (panoramaId: string, hotspot: Omit<Hotspot, 'id'>) => Promise<string>;
  onHotspotUpdate: (panoramaId: string, hotspot: Hotspot) => Promise<void>;
  onHotspotDelete: (panoramaId: string, hotspotId: string) => Promise<void>;
  className?: string;                            // CSS classes
}
```

## 📱 VR & Mobile Support

### VR Headset Compatibility
- **Oculus Quest/Quest 2** ✅
- **HTC Vive** ✅ 
- **Google Cardboard** ✅
- **Samsung Gear VR** ✅

### Mobile Browser Support
- **iOS Safari** ✅
- **Android Chrome** ✅
- **Samsung Internet** ✅
- **Firefox Mobile** ✅

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🎨 Customization

### Styling

The components use Tailwind CSS classes. You can customize the appearance by:

1. **Override CSS classes**
   ```tsx
   <VirtualTourViewer 
     className="w-full h-screen rounded-none border-4"
     // ...
   />
   ```

2. **Custom CSS variables**
   ```css
   :root {
     --tour-primary-color: #3b82f6;
     --tour-background: #000000;
     --tour-text: #ffffff;
   }
   ```

### Hotspot Icons

You can customize hotspot appearances by modifying the Panolens.js DataImage:

```tsx
// Custom navigation arrow
const customArrow = 'data:image/svg+xml;base64,' + btoa(`
  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <!-- Your custom SVG -->
  </svg>
`);

const infospot = new PANOLENS.Infospot(300, customArrow);
```

## 🚀 Deployment

### Backend Deployment (Node.js)

```bash
# Build for production
npm run build

# Start production server
npm start
```

**Recommended Platforms:**
- Railway
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

### Frontend Deployment (Next.js)

```bash
# Build static export
npm run build
npm run export

# Or deploy to Vercel
vercel --prod
```

**Recommended Platforms:**
- Vercel (recommended for Next.js)
- Netlify
- AWS S3 + CloudFront
- GitHub Pages (for static export)

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🔍 Troubleshooting

### Common Issues

#### 1. **Images not loading**
- Check file paths and permissions
- Verify CORS settings
- Ensure images are in correct format (JPG/PNG)

#### 2. **VR mode not working**
- Enable HTTPS (required for VR APIs)
- Check browser VR support
- Verify device compatibility

#### 3. **Upload failures**
- Check file size limits
- Verify image format (equirectangular preferred)
- Check server disk space

#### 4. **Hotspots not clickable**
- Verify hotspot positioning
- Check z-index conflicts
- Ensure proper event handlers

### Performance Optimization

1. **Image Optimization**
   ```bash
   # Compress panoramas (recommended)
   ffmpeg -i input.jpg -q:v 85 -vf scale=4096:2048 output.jpg
   ```

2. **Lazy Loading**
   ```tsx
   // Enable lazy loading
   <VirtualTourViewer tour={tour} lazyLoad={true} />
   ```

3. **Caching**
   ```tsx
   // Configure caching headers
   app.use('/uploads', express.static('uploads', {
     maxAge: '1y',
     etag: true
   }));
   ```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-username/virtual-tour-platform.git
cd virtual-tour-platform

# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Panolens.js** - 360° panorama viewer
- **Three.js** - 3D graphics library
- **React Dropzone** - File upload component
- **Tailwind CSS** - Utility-first CSS framework

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-username/virtual-tour-platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/virtual-tour-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/virtual-tour-platform/discussions)

---

**Made with ❤️ for the VR community**