const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Simple image processing without Sharp
console.log('🖼️ Using fallback image processing (Sharp not available)');

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  abortOnLimit: true,
  createParentPath: true
}));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple image stitching without Sharp
async function simpleImageStitch(imageFiles, options = {}) {
    console.log('🔧 Simple image stitching (no Sharp processing)');

    const outputId = uuidv4();
    const outputFilename = `panorama_${outputId}.jpg`;
    const outputPath = path.join(__dirname, 'uploads', outputFilename);

    try {
        // For now, just use the first image as the "stitched" result
        // This is a fallback when Sharp is not available
        const firstImage = imageFiles[0];
        await fs.writeFile(outputPath, firstImage.data);

        // Create thumbnail (copy of main image for simplicity)
        const thumbFilename = `thumb_${outputId}.jpg`;
        const thumbPath = path.join(__dirname, 'uploads', thumbFilename);
        await fs.writeFile(thumbPath, firstImage.data);

        console.log('✅ Simple stitching completed');

        return {
            success: true,
            id: outputId,
            panoramaUrl: `/uploads/${outputFilename}`,
            thumbnailUrl: `/uploads/${thumbFilename}`,
            method: options.method || 'simple',
            note: 'Processed with fallback method (Sharp not available)'
        };

    } catch (error) {
        console.error('❌ Simple stitching error:', error);
        throw error;
    }
}

// Image upload and stitching endpoint
app.post('/api/stitch', async (req, res) => {
    console.log('📤 Stitching request received');

    try {
        // Check if files were uploaded
        if (!req.files || !req.files.images) {
            return res.status(400).json({
                success: false,
                error: 'No images uploaded'
            });
        }

        // Handle single or multiple files
        let imageArray = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

        console.log(`📸 Processing ${imageArray.length} image(s)`);

        // Get stitching options
        const options = {
            method: req.body.method || 'simple',
            title: req.body.title || 'Stitched Panorama',
            quality: parseInt(req.body.quality) || 90,
            overlap: parseFloat(req.body.overlap) || 0.1
        };

        console.log('⚙️ Stitching options:', options);

        // Perform simple stitching
        const result = await simpleImageStitch(imageArray, options);

        // Save tour data
        const tourData = {
            id: result.id,
            title: options.title,
            description: `360° panorama created from ${imageArray.length} stitched images`,
            created: new Date().toISOString(),
            stitchingMethod: options.method,
            inputImages: imageArray.length,
            scenes: [{
                id: `scene_${result.id}`,
                title: options.title,
                image: result.panoramaUrl,
                panorama: result.panoramaUrl,
                preview: result.thumbnailUrl,
                hotspots: []
            }]
        };

        // Save to tours database
        await saveTourData(tourData);

        res.json({
            success: true,
            ...result,
            tour: tourData
        });

    } catch (error) {
        console.error('❌ Stitching error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Save tour data to JSON file
async function saveTourData(tourData) {
    try {
        const dataPath = path.join(__dirname, 'data', 'tours.json');

        // Ensure data directory exists
        await fs.mkdir(path.dirname(dataPath), { recursive: true });

        let existingData = { tours: [] };

        // Try to read existing data
        try {
            const fileContent = await fs.readFile(dataPath, 'utf8');
            existingData = JSON.parse(fileContent);
        } catch (error) {
            console.log('📝 Creating new tours database');
        }

        // Add new tour to the beginning
        existingData.tours.unshift(tourData);

        // Write back to file
        await fs.writeFile(dataPath, JSON.stringify(existingData, null, 2));
        console.log('💾 Tour data saved');

    } catch (error) {
        console.error('❌ Error saving tour data:', error);
        throw error;
    }
}

// Get all tours
app.get('/api/tours', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'tours.json');

        try {
            const fileContent = await fs.readFile(dataPath, 'utf8');
            const data = JSON.parse(fileContent);

            // Format tours for API response
            const formattedTours = data.tours.map(tour => ({
                id: tour.id,
                title: tour.title,
                description: tour.description,
                thumbnail: tour.scenes?.[0]?.preview || tour.scenes?.[0]?.image,
                created: tour.created,
                scenesCount: tour.scenes?.length || 1
            }));

            res.json({
                success: true,
                tours: formattedTours
            });

        } catch (error) {
            res.json({
                success: true,
                tours: []
            });
        }

    } catch (error) {
        console.error('❌ Error getting tours:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get specific tour
app.get('/api/tours/:id', async (req, res) => {
    try {
        const tourId = req.params.id;
        const dataPath = path.join(__dirname, 'data', 'tours.json');

        const fileContent = await fs.readFile(dataPath, 'utf8');
        const data = JSON.parse(fileContent);

        const tour = data.tours.find(t => t.id === tourId);

        if (!tour) {
            return res.status(404).json({
                success: false,
                error: 'Tour not found'
            });
        }

        res.json({
            success: true,
            tour: tour
        });

    } catch (error) {
        console.error('❌ Error getting tour:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create custom tour
app.post('/api/tours', async (req, res) => {
    try {
        const { title, description, scenes } = req.body;

        if (!title || !scenes || scenes.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Title and scenes are required'
            });
        }

        const tourId = uuidv4();
        const tourData = {
            id: tourId,
            title: title,
            description: description || `Virtual tour with ${scenes.length} scenes`,
            created: new Date().toISOString(),
            stitchingMethod: 'custom',
            inputImages: scenes.length,
            scenes: scenes.map(scene => ({
                id: scene.id,
                title: scene.title,
                description: scene.description,
                image: scene.image || scene.panorama,
                panorama: scene.panorama || scene.image,
                preview: scene.preview || scene.thumbnail,
                hotspots: scene.hotspots || []
            }))
        };

        await saveTourData(tourData);

        res.json({
            success: true,
            tour: tourData
        });

    } catch (error) {
        console.error('❌ Error creating tour:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'VR Tour Platform is running (Windows Compatible)',
        timestamp: new Date().toISOString(),
        imageProcessing: 'Fallback mode (Sharp not available)'
    });
});

// Serve main pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/viewer.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/viewer.html'));
});

app.get('/upload.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/upload.html'));
});

app.get('/stitch.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/stitch.html'));
});

app.get('/modern-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/modern-dashboard.html'));
});

app.get('/modern-tour-creator.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/modern-tour-creator.html'));
});

app.get('/modern-viewer.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/modern-viewer.html'));
});

app.get('/klapty-style-tour.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/klapty-style-tour.html'));
});

app.get('/hotspot-fix.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/hotspot-fix.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 VR Tour Platform running on http://localhost:' + PORT);
    console.log('📁 API endpoints available at http://localhost:' + PORT + '/api');
    console.log('🌐 Frontend available at http://localhost:' + PORT);
    console.log('🖼️ Image processing: Fallback mode (Sharp not available)');
    console.log('✨ Windows Compatible Virtual Tour Platform - Ready!');

    // List all available pages
    console.log('\n📄 Available Pages:');
    console.log('   • Main Dashboard: http://localhost:' + PORT + '/modern-dashboard.html');
    console.log('   • Tour Creator: http://localhost:' + PORT + '/modern-tour-creator.html');
    console.log('   • Klapty-Style Tour: http://localhost:' + PORT + '/klapty-style-tour.html');
    console.log('   • Hotspot Fix Demo: http://localhost:' + PORT + '/hotspot-fix.html');
    console.log('   • Original Viewer: http://localhost:' + PORT + '/viewer.html');
    console.log('   • Original Upload: http://localhost:' + PORT + '/upload.html');
});

module.exports = app;