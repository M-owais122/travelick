const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const PanoramaConverter = require('./panoramaConverter');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
  createParentPath: true
}));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// Database file paths
const TOURS_DB = path.join(__dirname, 'data', 'tours.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Initialize panorama converter
const panoramaConverter = new PanoramaConverter();

// Initialize data directory and files
async function initializeDB() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    
    try {
      await fs.access(TOURS_DB);
    } catch {
      // Create initial tours data with example
      const initialData = {
        tours: [
          {
            id: "demo-tour-1",
            title: "Modern Apartment Tour",
            description: "Experience a beautiful modern apartment with 360° views",
            thumbnail: "/uploads/demo/living-room-thumb.jpg",
            created: new Date().toISOString(),
            scenes: [
              {
                id: "scene-1",
                title: "Living Room",
                image: "/uploads/demo/living-room.jpg",
                preview: "/uploads/demo/living-room-thumb.jpg",
                hotspots: [
                  {
                    pitch: -5,
                    yaw: 90,
                    type: "scene",
                    text: "Go to Kitchen",
                    sceneId: "scene-2"
                  },
                  {
                    pitch: -10,
                    yaw: -45,
                    type: "scene",
                    text: "Go to Bedroom",
                    sceneId: "scene-3"
                  },
                  {
                    pitch: 15,
                    yaw: 180,
                    type: "info",
                    text: "Modern chandelier with LED lighting"
                  }
                ]
              },
              {
                id: "scene-2",
                title: "Kitchen",
                image: "/uploads/demo/kitchen.jpg",
                preview: "/uploads/demo/kitchen-thumb.jpg",
                hotspots: [
                  {
                    pitch: -5,
                    yaw: -90,
                    type: "scene",
                    text: "Back to Living Room",
                    sceneId: "scene-1"
                  },
                  {
                    pitch: 0,
                    yaw: 45,
                    type: "scene",
                    text: "Go to Bedroom",
                    sceneId: "scene-3"
                  },
                  {
                    pitch: -20,
                    yaw: 0,
                    type: "info",
                    text: "Marble countertop with built-in appliances"
                  }
                ]
              },
              {
                id: "scene-3",
                title: "Master Bedroom",
                image: "/uploads/demo/bedroom.jpg",
                preview: "/uploads/demo/bedroom-thumb.jpg",
                hotspots: [
                  {
                    pitch: -8,
                    yaw: 180,
                    type: "scene",
                    text: "Back to Living Room",
                    sceneId: "scene-1"
                  },
                  {
                    pitch: -5,
                    yaw: -135,
                    type: "scene",
                    text: "Go to Kitchen",
                    sceneId: "scene-2"
                  },
                  {
                    pitch: 10,
                    yaw: 90,
                    type: "info",
                    text: "King-size bed with premium bedding"
                  }
                ]
              }
            ]
          }
        ]
      };
      await fs.writeFile(TOURS_DB, JSON.stringify(initialData, null, 2));
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Helper functions
async function readTours() {
  try {
    const data = await fs.readFile(TOURS_DB, 'utf8');
    return JSON.parse(data);
  } catch {
    return { tours: [] };
  }
}

async function writeTours(data) {
  await fs.writeFile(TOURS_DB, JSON.stringify(data, null, 2));
}

// Routes

// Get all tours
app.get('/api/tours', async (req, res) => {
  try {
    const data = await readTours();
    const toursList = data.tours.map(tour => ({
      id: tour.id,
      title: tour.title,
      description: tour.description,
      thumbnail: tour.thumbnail,
      created: tour.created,
      scenesCount: tour.scenes ? tour.scenes.length : 0
    }));
    res.json({ success: true, tours: toursList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single tour
app.get('/api/tours/:id', async (req, res) => {
  try {
    const data = await readTours();
    const tour = data.tours.find(t => t.id === req.params.id);
    
    if (!tour) {
      return res.status(404).json({ success: false, error: 'Tour not found' });
    }
    
    res.json({ success: true, tour });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new tour
app.post('/api/tours', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    const data = await readTours();
    const newTour = {
      id: uuidv4(),
      title,
      description: description || '',
      thumbnail: '',
      created: new Date().toISOString(),
      scenes: []
    };
    
    data.tours.push(newTour);
    await writeTours(data);
    
    res.json({ success: true, tour: newTour });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload panorama to tour
app.post('/api/tours/:tourId/upload', async (req, res) => {
  try {
    if (!req.files || !req.files.panorama) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    const file = req.files.panorama;
    const { title, hotspots } = req.body;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' 
      });
    }
    
    // Generate unique filename
    const ext = path.extname(file.name);
    const filename = `${uuidv4()}${ext}`;
    const uploadPath = path.join(UPLOADS_DIR, filename);
    
    // Move file to uploads directory
    await file.mv(uploadPath);
    
    // Update tour data
    const data = await readTours();
    const tour = data.tours.find(t => t.id === req.params.tourId);
    
    if (!tour) {
      return res.status(404).json({ success: false, error: 'Tour not found' });
    }
    
    const newScene = {
      id: `scene-${uuidv4()}`,
      title: title || 'Untitled Scene',
      image: `/uploads/${filename}`,
      preview: `/uploads/${filename}`, // In production, generate thumbnail
      hotspots: hotspots ? JSON.parse(hotspots) : []
    };
    
    if (!tour.scenes) tour.scenes = [];
    tour.scenes.push(newScene);
    
    // Set thumbnail if first scene
    if (tour.scenes.length === 1) {
      tour.thumbnail = newScene.image;
    }
    
    await writeTours(data);
    
    res.json({ 
      success: true, 
      scene: newScene,
      message: 'Panorama uploaded successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update tour scenes (add/edit hotspots)
app.put('/api/tours/:tourId/scenes/:sceneId', async (req, res) => {
  try {
    const { tourId, sceneId } = req.params;
    const { hotspots } = req.body;
    
    const data = await readTours();
    const tour = data.tours.find(t => t.id === tourId);
    
    if (!tour) {
      return res.status(404).json({ success: false, error: 'Tour not found' });
    }
    
    const scene = tour.scenes.find(s => s.id === sceneId);
    if (!scene) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }
    
    scene.hotspots = hotspots;
    await writeTours(data);
    
    res.json({ success: true, scene });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete tour
app.delete('/api/tours/:id', async (req, res) => {
  try {
    const data = await readTours();
    const index = data.tours.findIndex(t => t.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Tour not found' });
    }
    
    // TODO: Delete associated images from uploads folder
    data.tours.splice(index, 1);
    await writeTours(data);
    
    res.json({ success: true, message: 'Tour deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate embed code
app.get('/api/tours/:id/embed', async (req, res) => {
  try {
    const { id } = req.params;
    const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
    
    const embedCode = `<iframe 
  src="${baseUrl}/viewer.html?tour=${id}&embed=true" 
  width="100%" 
  height="600" 
  frameborder="0" 
  allowfullscreen 
  allow="vr; xr; accelerometer; gyroscope">
</iframe>`;
    
    res.json({ 
      success: true, 
      embedCode,
      directLink: `${baseUrl}/viewer.html?tour=${id}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available conversion methods
app.get('/api/conversion/methods', (req, res) => {
  try {
    const methods = panoramaConverter.getAvailableMethods();
    res.json({ success: true, methods });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert regular photo to panorama
app.post('/api/conversion/convert', async (req, res) => {
  try {
    if (!req.files || !req.files.photo) {
      return res.status(400).json({ success: false, error: 'No photo uploaded' });
    }

    const file = req.files.photo;
    const { method = 'perspective', title } = req.body;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' 
      });
    }

    // Generate unique filenames
    const inputId = uuidv4();
    const outputId = uuidv4();
    const inputPath = path.join(UPLOADS_DIR, `input_${inputId}.jpg`);
    const outputPath = path.join(UPLOADS_DIR, `panorama_${outputId}.jpg`);
    const thumbnailPath = path.join(UPLOADS_DIR, `thumb_${outputId}.jpg`);

    // Save uploaded file
    await file.mv(inputPath);

    // Validate image
    const validation = await panoramaConverter.validateImage(inputPath);
    if (!validation.isValid) {
      // Clean up
      await fs.unlink(inputPath).catch(() => {});
      return res.status(400).json({ 
        success: false, 
        error: 'Image validation failed',
        issues: validation.issues
      });
    }

    // Convert to panorama
    const conversionResult = await panoramaConverter.convertToPanorama(
      inputPath, 
      outputPath, 
      method
    );

    // Generate thumbnail
    await panoramaConverter.generateThumbnail(outputPath, thumbnailPath);

    // Clean up input file
    await fs.unlink(inputPath).catch(() => {});

    res.json({
      success: true,
      conversion: conversionResult,
      panorama: {
        id: outputId,
        title: title || 'Converted Panorama',
        image: `/uploads/panorama_${outputId}.jpg`,
        thumbnail: `/uploads/thumb_${outputId}.jpg`,
        method: method,
        originalValidation: validation
      }
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multi-image stitching endpoint
app.post('/api/conversion/stitch', async (req, res) => {
  try {
    console.log('Stitching request received');

    // Check if images were uploaded
    if (!req.files || !req.files.images) {
      return res.status(400).json({ success: false, error: 'No images uploaded' });
    }

    const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    console.log(`Received ${images.length} images for stitching`);

    // Validate minimum images
    if (images.length < 2) {
      return res.status(400).json({ success: false, error: 'At least 2 images required for stitching' });
    }

    // Get options from request
    const method = req.body.method || 'horizontal';
    const title = req.body.title || 'Stitched Panorama';
    const overlap = parseFloat(req.body.overlap) || 0.1;
    const quality = parseInt(req.body.quality) || 90;

    console.log('Stitching options:', { method, title, overlap, quality });

    // Generate unique tour ID
    const tourId = uuidv4();
    const timestamp = Date.now();

    // Save uploaded images
    const savedImages = [];
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const fileName = `stitch_input_${tourId}_${i}_${timestamp}.${image.name.split('.').pop()}`;
      const imagePath = path.join(UPLOADS_DIR, fileName);

      await image.mv(imagePath);
      savedImages.push({
        path: imagePath,
        name: fileName,
        url: `/uploads/${fileName}`
      });
    }

    console.log('Images saved, starting stitching process...');

    // Perform stitching using panorama converter
    const stitchingResult = await panoramaConverter.stitchImages(savedImages, {
      method,
      overlap,
      quality
    });

    console.log('Stitching result:', stitchingResult);

    if (!stitchingResult.success) {
      // Cleanup uploaded images
      for (const img of savedImages) {
        try {
          await fs.unlink(img.path);
        } catch (e) {
          console.warn('Failed to cleanup image:', img.path);
        }
      }
      return res.status(500).json({ success: false, error: stitchingResult.error });
    }

    // Create panorama filename
    const panoramaFileName = `panorama_${tourId}.jpg`;
    const panoramaPath = path.join(UPLOADS_DIR, panoramaFileName);
    const panoramaUrl = `/uploads/${panoramaFileName}`;

    // Save the stitched panorama
    await fs.writeFile(panoramaPath, stitchingResult.imageData);

    // Generate thumbnail
    const thumbFileName = `thumb_${tourId}.jpg`;
    const thumbnailUrl = `/uploads/${thumbFileName}`;

    try {
      const thumbnailData = await panoramaConverter.generateThumbnail(stitchingResult.imageData);
      await fs.writeFile(path.join(UPLOADS_DIR, thumbFileName), thumbnailData);
    } catch (thumbError) {
      console.warn('Failed to generate thumbnail:', thumbError.message);
    }

    // Create tour entry
    const newTour = {
      id: tourId,
      title: title,
      description: `360° panorama created from ${images.length} stitched images`,
      thumbnail: thumbnailUrl,
      created: new Date().toISOString(),
      stitchingMethod: method,
      inputImages: images.length,
      scenes: [{
        id: `scene_${tourId}`,
        title: title,
        panorama: panoramaUrl,
        hotspots: []
      }]
    };

    // Save to database
    const data = await readTours();
    data.tours.unshift(newTour);
    await writeTours(data);

    // Cleanup input images (keep only the stitched result)
    for (const img of savedImages) {
      try {
        await fs.unlink(img.path);
      } catch (e) {
        console.warn('Failed to cleanup input image:', img.path);
      }
    }

    console.log('Stitching completed successfully');

    // Return success response
    res.json({
      success: true,
      message: `Successfully stitched ${images.length} images into a 360° panorama`,
      tourId: tourId,
      tourUrl: `/viewer.html?tour=${tourId}`,
      panoramaUrl: panoramaUrl,
      thumbnailUrl: thumbnailUrl,
      stitchingResult: {
        stitchingMethod: method,
        inputImages: images.length,
        dimensions: stitchingResult.dimensions || { width: 'unknown', height: 'unknown' },
        overlap: overlap
      }
    });

  } catch (error) {
    console.error('Stitching error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stitch images'
    });
  }
});

// Validate photo for conversion
app.post('/api/conversion/validate', async (req, res) => {
  try {
    if (!req.files || !req.files.photo) {
      return res.status(400).json({ success: false, error: 'No photo uploaded' });
    }

    const file = req.files.photo;
    const tempId = uuidv4();
    const tempPath = path.join(UPLOADS_DIR, `temp_${tempId}.jpg`);

    // Save temporary file
    await file.mv(tempPath);

    // Validate
    const validation = await panoramaConverter.validateImage(tempPath);

    // Clean up
    await fs.unlink(tempPath).catch(() => {});

    res.json({
      success: true,
      validation,
      recommendations: getConversionRecommendations(validation)
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function for conversion recommendations
function getConversionRecommendations(validation) {
  const recommendations = [];
  
  if (!validation.metadata) return recommendations;

  const { width, height } = validation.metadata;
  const aspectRatio = width / height;

  if (aspectRatio > 2) {
    recommendations.push({
      method: 'perspective',
      reason: 'Wide aspect ratio works well with perspective projection'
    });
  } else if (aspectRatio < 0.8) {
    recommendations.push({
      method: 'cylindrical', 
      reason: 'Tall images work better with cylindrical projection'
    });
  } else {
    recommendations.push({
      method: 'perspective',
      reason: 'Standard aspect ratio - perspective projection recommended'
    });
  }

  if (width >= 2048) {
    recommendations.push({
      method: 'ai_depth',
      reason: 'High resolution image suitable for AI-enhanced conversion'
    });
  }

  return recommendations;
}

// Initialize and start server
initializeDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 VR Tour Platform running on http://localhost:${PORT}`);
    console.log(`📁 API endpoints available at http://localhost:${PORT}/api`);
    console.log(`🌐 WSL2 Internal: http://172.26.27.72:${PORT}`);
    console.log(`📱 Mobile access: http://192.168.1.122:${PORT}`);
    console.log(`⚠️  Port forwarding required for mobile access`);
    console.log(`✨ Advanced Virtual Tour Platform - Ready for production use!`);
  });
});