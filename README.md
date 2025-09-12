# 🎯 VR Tour Platform - Kuula-like 360° Virtual Tours

A complete, modern virtual tour platform with 360° panoramic viewing, hotspot navigation, VR support, and easy sharing capabilities.

## ✨ Features

### 🎮 Core Tour Features
- **360° Panoramic Viewer** - Full spherical panorama support with smooth navigation
- **Multi-Scene Tours** - Link multiple panoramas with interactive hotspots
- **VR Mode** - Immersive VR experience with headset support
- **Mobile Responsive** - Touch gestures and mobile-optimized interface
- **Fullscreen Support** - Distraction-free viewing experience
- **Auto-Rotate** - Automatic panorama rotation with toggle control

### 🎯 Hotspot System
- **Scene Navigation** - Click hotspots to move between panoramas
- **Information Points** - Add contextual information tooltips
- **Visual Editor** - Easy hotspot placement and management
- **Smart Positioning** - Pitch/yaw coordinate system for precise placement

### 📱 User Interface
- **Dark/Light Mode** - Toggle between themes with persistent preference
- **Thumbnail Gallery** - Quick scene switching with preview images
- **Mini Map** - Optional floor plan view showing current location
- **Share & Embed** - Generate shareable links and iframe embeds
- **Social Sharing** - Direct sharing to Facebook, Twitter, WhatsApp

### 🔧 Admin Features
- **Upload Interface** - Drag-and-drop panorama upload
- **Tour Management** - Create, edit, and organize tours
- **Hotspot Editor** - Visual hotspot placement with preview
- **File Validation** - Secure file upload with type and size checking

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone or download the project
cd "VR tour"

# Install dependencies
npm install

# Start the development server
npm run dev
```

The platform will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Demo Tour**: http://localhost:3000/viewer.html?tour=demo-tour-1

## 📁 Project Structure

```
VR tour/
├── package.json                 # Dependencies and scripts
├── README.md                   # This file
├── backend/                    # Node.js + Express API
│   ├── server.js              # Main server file
│   ├── data/                  # JSON database storage
│   │   └── tours.json         # Tours metadata
│   └── uploads/               # Uploaded panorama files
│       └── demo/              # Demo images
└── frontend/                  # Client-side application
    ├── index.html            # Main landing page
    ├── viewer.html           # 360° tour viewer
    ├── upload.html           # Tour creation interface
    └── js/                   # JavaScript modules
        ├── main.js           # Homepage functionality
        ├── viewer.js         # Tour viewer logic
        └── upload.js         # Upload interface
```

## 🛠️ API Endpoints

### Tours Management
- `GET /api/tours` - List all tours
- `GET /api/tours/:id` - Get specific tour with scenes
- `POST /api/tours` - Create new tour
- `DELETE /api/tours/:id` - Delete tour

### Scene Management  
- `POST /api/tours/:tourId/upload` - Upload panorama to tour
- `PUT /api/tours/:tourId/scenes/:sceneId` - Update scene hotspots

### Sharing
- `GET /api/tours/:id/embed` - Get embed code and share links

## 🎨 Customization

### Colors
The platform uses a vibrant green (`#39FF14`) as the primary accent color. Update this in:
- `tailwind.config` in HTML files
- CSS custom properties
- JavaScript color references

### 360° Viewer
Built on [Pannellum](https://pannellum.org/) - a lightweight WebGL panorama viewer:
- Supports equirectangular panoramas
- WebVR/WebXR compatible
- Mobile touch controls
- Keyboard navigation

## 📱 Responsive Design

### Desktop Features
- Full control panel with scene thumbnails
- Comprehensive toolbar with all features
- Keyboard shortcuts (F=fullscreen, V=VR, R=rotate, M=map, S=share)

### Mobile Optimizations
- Touch gesture navigation (swipe between scenes)
- Simplified UI with essential controls
- Optimized hotspot sizes for touch
- Responsive layouts for all screen sizes

## 🌐 Deployment

### Frontend Deployment (Static)

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy frontend
cd frontend
netlify deploy --prod --dir .
```

### Backend Deployment

#### Render
1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Set environment variables if needed

#### Heroku
```bash
# Install Heroku CLI and login
heroku create your-vr-tour-api

# Deploy
git subtree push --prefix backend heroku main
```

#### Fly.io
```bash
# Install flyctl and create app
fly launch --name your-vr-tour-api

# Deploy
fly deploy
```

### Environment Configuration

Update the API base URL in frontend JavaScript files:

**For Production:**
```javascript
// In main.js, viewer.js, upload.js
const API_BASE = 'https://your-backend-domain.com/api';
```

**For Development:**
```javascript
const API_BASE = 'http://localhost:3000/api';
```

## 🔐 Security Features

### File Upload Security
- File type validation (JPEG, PNG, WebP only)
- File size limits (50MB max)
- Secure file naming with UUIDs
- Directory traversal protection

### Future Enhancements
- User authentication system
- Tour access controls (private/public)
- Rate limiting for uploads
- CDN integration for panorama delivery

## 🎯 Usage Examples

### Creating a Virtual Tour

1. **Visit Upload Page**: Navigate to `/upload.html`
2. **Enter Tour Info**: Add title and description
3. **Upload Panoramas**: Drag-and-drop 360° images
4. **Add Hotspots**: Configure scene navigation and info points
5. **Publish Tour**: Generate shareable links

### Embedding Tours

```html
<!-- Basic embed -->
<iframe 
  src="https://your-domain.com/viewer.html?tour=TOUR_ID&embed=true" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen>
</iframe>

<!-- With VR support -->
<iframe 
  src="https://your-domain.com/viewer.html?tour=TOUR_ID&embed=true" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen 
  allow="vr; xr; accelerometer; gyroscope">
</iframe>
```

### Keyboard Shortcuts (Viewer)
- `F` - Toggle fullscreen
- `V` - Enter VR mode  
- `R` - Toggle auto-rotate
- `M` - Toggle mini-map
- `S` - Open share modal
- `←/→` - Navigate between scenes
- `ESC` - Close modals

## 🐛 Troubleshooting

### Common Issues

**"Failed to connect to server"**
- Ensure backend is running (`npm run dev`)
- Check API_BASE URL in frontend JavaScript
- Verify CORS configuration

**"Tour not loading"**  
- Check browser console for errors
- Verify tour ID in URL
- Ensure panorama images are accessible

**"Upload failed"**
- Verify file format (JPEG/PNG/WebP)
- Check file size (under 50MB)
- Ensure backend upload directory is writable

**VR mode not working**
- Use HTTPS in production (required for WebXR)
- Check browser VR/WebXR support
- Ensure device has VR capabilities

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Pannellum](https://pannellum.org/) - WebGL panorama viewer
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Font Awesome](https://fontawesome.com/) - Icon library
- [Express.js](https://expressjs.com/) - Web framework for Node.js

---

**Ready to create amazing virtual tours!** 🎉

Start the server with `npm run dev` and visit http://localhost:3000 to begin exploring.