const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const shareSchema = Joi.object({
  tourId: Joi.string().uuid().required(),
  type: Joi.string().valid('link', 'embed').default('link'),
  settings: Joi.object({
    autoplay: Joi.boolean().default(false),
    controls: Joi.boolean().default(true),
    title: Joi.boolean().default(true),
    description: Joi.boolean().default(true),
    logo: Joi.boolean().default(false),
    fullscreen: Joi.boolean().default(true),
    vr: Joi.boolean().default(true),
    width: Joi.number().min(300).max(1920).default(800),
    height: Joi.number().min(200).max(1080).default(600)
  }).default({})
});

// Utility functions
const getDataFilePath = (filename) => path.join(__dirname, '../data', filename);

const readJsonFile = async (filePath, defaultValue = []) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue;
    }
    throw error;
  }
};

const writeJsonFile = async (filePath, data) => {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

const generateShareCode = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Routes

// Create share link
router.post('/create', async (req, res) => {
  try {
    const { error, value } = shareSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { tourId, type, settings } = value;

    // Verify tour exists
    const tours = await readJsonFile(getDataFilePath('tours.json'));
    const tour = tours.find(t => t.id === tourId);
    
    if (!tour) {
      return res.status(404).json({
        error: 'Tour not found',
        message: 'The specified tour does not exist'
      });
    }

    const shareId = uuidv4();
    const shareCode = generateShareCode();
    
    const shareData = {
      id: shareId,
      code: shareCode,
      tourId,
      type,
      settings,
      url: `${req.protocol}://${req.get('host')}/share/${shareCode}`,
      embedCode: type === 'embed' ? generateEmbedCode(shareCode, settings) : null,
      views: 0,
      createdAt: new Date().toISOString(),
      lastAccessedAt: null
    };

    // Save share data
    const shares = await readJsonFile(getDataFilePath('shares.json'));
    shares.push(shareData);
    await writeJsonFile(getDataFilePath('shares.json'), shares);

    res.status(201).json({
      success: true,
      message: 'Share link created successfully',
      data: shareData
    });

  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({
      error: 'Failed to create share link',
      message: error.message
    });
  }
});

// Get shared tour by code
router.get('/:code', async (req, res) => {
  try {
    const shareCode = req.params.code;
    
    const shares = await readJsonFile(getDataFilePath('shares.json'));
    const share = shares.find(s => s.code === shareCode);
    
    if (!share) {
      return res.status(404).json({
        error: 'Share link not found',
        message: 'The requested share link does not exist or has expired'
      });
    }

    // Get tour data
    const tours = await readJsonFile(getDataFilePath('tours.json'));
    const tour = tours.find(t => t.id === share.tourId);
    
    if (!tour) {
      return res.status(404).json({
        error: 'Tour not found',
        message: 'The associated tour no longer exists'
      });
    }

    // Get panoramas for this tour
    const panoramas = await readJsonFile(getDataFilePath('panoramas.json'));
    const tourPanoramas = panoramas.filter(p => p.tourId === share.tourId);

    // Update access statistics
    const shareIndex = shares.findIndex(s => s.id === share.id);
    shares[shareIndex].views = (shares[shareIndex].views || 0) + 1;
    shares[shareIndex].lastAccessedAt = new Date().toISOString();
    await writeJsonFile(getDataFilePath('shares.json'), shares);

    const responseData = {
      share: {
        id: share.id,
        code: share.code,
        type: share.type,
        settings: share.settings
      },
      tour: {
        ...tour,
        panoramas: tourPanoramas
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching shared tour:', error);
    res.status(500).json({
      error: 'Failed to fetch shared tour',
      message: error.message
    });
  }
});

// Get embed HTML
router.get('/embed/:code', async (req, res) => {
  try {
    const shareCode = req.params.code;
    
    const shares = await readJsonFile(getDataFilePath('shares.json'));
    const share = shares.find(s => s.code === shareCode && s.type === 'embed');
    
    if (!share) {
      return res.status(404).json({
        error: 'Embed not found',
        message: 'The requested embed does not exist'
      });
    }

    // Get tour data
    const tours = await readJsonFile(getDataFilePath('tours.json'));
    const tour = tours.find(t => t.id === share.tourId);
    
    if (!tour) {
      return res.status(404).json({
        error: 'Tour not found',
        message: 'The associated tour no longer exists'
      });
    }

    // Get panoramas
    const panoramas = await readJsonFile(getDataFilePath('panoramas.json'));
    const tourPanoramas = panoramas.filter(p => p.tourId === share.tourId);

    // Generate HTML page
    const html = generateEmbedHTML(tour, tourPanoramas, share.settings);
    
    res.set('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Error serving embed:', error);
    res.status(500).send('<h1>Error loading virtual tour</h1>');
  }
});

// Update share settings
router.put('/:shareId', async (req, res) => {
  try {
    const shareId = req.params.shareId;
    const { error, value } = shareSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const shares = await readJsonFile(getDataFilePath('shares.json'));
    const shareIndex = shares.findIndex(s => s.id === shareId);
    
    if (shareIndex === -1) {
      return res.status(404).json({
        error: 'Share not found',
        message: 'The requested share link does not exist'
      });
    }

    shares[shareIndex] = {
      ...shares[shareIndex],
      settings: value.settings,
      embedCode: value.type === 'embed' ? 
        generateEmbedCode(shares[shareIndex].code, value.settings) : null,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile(getDataFilePath('shares.json'), shares);

    res.json({
      success: true,
      message: 'Share settings updated successfully',
      data: shares[shareIndex]
    });

  } catch (error) {
    console.error('Error updating share:', error);
    res.status(500).json({
      error: 'Failed to update share',
      message: error.message
    });
  }
});

// Delete share
router.delete('/:shareId', async (req, res) => {
  try {
    const shareId = req.params.shareId;
    
    const shares = await readJsonFile(getDataFilePath('shares.json'));
    const shareIndex = shares.findIndex(s => s.id === shareId);
    
    if (shareIndex === -1) {
      return res.status(404).json({
        error: 'Share not found',
        message: 'The requested share link does not exist'
      });
    }

    shares.splice(shareIndex, 1);
    await writeJsonFile(getDataFilePath('shares.json'), shares);

    res.json({
      success: true,
      message: 'Share link deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting share:', error);
    res.status(500).json({
      error: 'Failed to delete share',
      message: error.message
    });
  }
});

// Get share analytics
router.get('/analytics/:shareId', async (req, res) => {
  try {
    const shareId = req.params.shareId;
    
    const shares = await readJsonFile(getDataFilePath('shares.json'));
    const share = shares.find(s => s.id === shareId);
    
    if (!share) {
      return res.status(404).json({
        error: 'Share not found',
        message: 'The requested share link does not exist'
      });
    }

    res.json({
      shareId: share.id,
      code: share.code,
      views: share.views || 0,
      createdAt: share.createdAt,
      lastAccessedAt: share.lastAccessedAt,
      url: share.url
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

// Helper functions
function generateEmbedCode(shareCode, settings) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  return `<iframe 
    src="${baseUrl}/embed/${shareCode}" 
    width="${settings.width || 800}" 
    height="${settings.height || 600}" 
    frameborder="0" 
    allowvr="yes" 
    allowfullscreen="yes"
    title="Virtual Tour"
  ></iframe>`;
}

function generateEmbedHTML(tour, panoramas, settings) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${tour.title} - Virtual Tour</title>
    <script src="https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/panolens@0.12.1/build/panolens.min.js"></script>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        #panorama {
            width: 100%;
            height: 100%;
        }
        .tour-info {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 15px;
            border-radius: 8px;
            max-width: 300px;
            z-index: 1000;
            ${!settings.title && !settings.description ? 'display: none;' : ''}
        }
        .tour-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
            ${!settings.title ? 'display: none;' : ''}
        }
        .tour-description {
            font-size: 14px;
            line-height: 1.4;
            ${!settings.description ? 'display: none;' : ''}
        }
        .controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            ${!settings.controls ? 'display: none;' : ''}
        }
        .control-btn {
            background: rgba(0, 0, 0, 0.7);
            color: white;
            border: none;
            padding: 10px;
            margin: 0 5px;
            border-radius: 5px;
            cursor: pointer;
        }
        .control-btn:hover {
            background: rgba(0, 0, 0, 0.9);
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 18px;
            z-index: 1001;
        }
    </style>
</head>
<body>
    <div id="panorama"></div>
    
    <div class="tour-info">
        <div class="tour-title">${tour.title}</div>
        <div class="tour-description">${tour.description}</div>
    </div>
    
    <div class="controls">
        ${settings.fullscreen ? '<button class="control-btn" onclick="toggleFullscreen()">⛶</button>' : ''}
        ${settings.vr ? '<button class="control-btn" onclick="toggleVR()">🥽</button>' : ''}
    </div>
    
    <div class="loading" id="loading">Loading Virtual Tour...</div>

    <script>
        const tourData = ${JSON.stringify({ tour, panoramas })};
        const settings = ${JSON.stringify(settings)};
        
        let viewer;
        let currentPanorama = null;
        
        function initViewer() {
            const container = document.getElementById('panorama');
            viewer = new PANOLENS.Viewer({
                container: container,
                autoHideInfospot: false,
                controlBar: ${settings.controls},
                enableReticle: true
            });
            
            // Load panoramas
            const panoramas = tourData.panoramas;
            const panoramaObjects = {};
            
            panoramas.forEach(panoramaData => {
                const panorama = new PANOLENS.ImagePanorama(\`${req.protocol}://${req.get('host')}\${panoramaData.url}\`);
                panoramaObjects[panoramaData.id] = panorama;
                viewer.add(panorama);
                
                // Add hotspots
                if (panoramaData.hotspots) {
                    panoramaData.hotspots.forEach(hotspot => {
                        if (hotspot.type === 'navigation' && hotspot.targetPanoramaId) {
                            const infospot = new PANOLENS.Infospot(300, PANOLENS.DataImage.Arrow);
                            infospot.position.set(
                                Math.cos(hotspot.position.y * Math.PI / 180) * Math.cos(hotspot.position.x * Math.PI / 180) * 5000,
                                Math.sin(hotspot.position.y * Math.PI / 180) * 5000,
                                Math.cos(hotspot.position.y * Math.PI / 180) * Math.sin(hotspot.position.x * Math.PI / 180) * 5000
                            );
                            infospot.addHoverText(hotspot.title);
                            infospot.addEventListener('click', () => {
                                const targetPanorama = panoramaObjects[hotspot.targetPanoramaId];
                                if (targetPanorama) {
                                    viewer.setPanorama(targetPanorama);
                                }
                            });
                            panorama.add(infospot);
                        }
                    });
                }
            });
            
            // Start with first panorama or specified starting panorama
            const startingPanorama = panoramas.find(p => p.id === tourData.tour.startingPanoramaId) || panoramas[0];
            if (startingPanorama && panoramaObjects[startingPanorama.id]) {
                viewer.setPanorama(panoramaObjects[startingPanorama.id]);
            }
            
            // Hide loading
            document.getElementById('loading').style.display = 'none';
        }
        
        function toggleFullscreen() {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
        
        function toggleVR() {
            if (viewer) {
                viewer.enableEffect(PANOLENS.MODES.VR);
            }
        }
        
        // Initialize when page loads
        window.addEventListener('load', initViewer);
        
        // Auto-start if enabled
        ${settings.autoplay ? 'window.addEventListener("load", () => setTimeout(() => viewer && viewer.setPanorama(viewer.panoramas[0]), 1000));' : ''}
    </script>
</body>
</html>
  `;
}

module.exports = router;