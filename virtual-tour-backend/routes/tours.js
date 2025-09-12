const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const tourSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).allow(''),
  isPublic: Joi.boolean().default(true),
  tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
  startingPanoramaId: Joi.string().uuid().optional()
});

const hotspotSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  type: Joi.string().valid('navigation', 'info', 'custom').required(),
  title: Joi.string().max(100).required(),
  description: Joi.string().max(500).allow(''),
  position: Joi.object({
    x: Joi.number().min(-180).max(180).required(),
    y: Joi.number().min(-90).max(90).required(),
    z: Joi.number().optional()
  }).required(),
  targetPanoramaId: Joi.string().uuid().when('type', {
    is: 'navigation',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  customData: Joi.object().optional()
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

// Routes

// Get all tours
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tags, isPublic } = req.query;
    
    const tours = await readJsonFile(getDataFilePath('tours.json'));
    let filteredTours = [...tours];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredTours = filteredTours.filter(tour =>
        tour.title.toLowerCase().includes(searchLower) ||
        tour.description.toLowerCase().includes(searchLower)
      );
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filteredTours = filteredTours.filter(tour =>
        tour.tags.some(tag => tagArray.includes(tag))
      );
    }

    if (isPublic !== undefined) {
      filteredTours = filteredTours.filter(tour => tour.isPublic === (isPublic === 'true'));
    }

    // Sort by creation date (newest first)
    filteredTours.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTours = filteredTours.slice(startIndex, endIndex);

    // Get panorama data for each tour
    const panoramas = await readJsonFile(getDataFilePath('panoramas.json'));
    const toursWithPanoramas = paginatedTours.map(tour => ({
      ...tour,
      panoramaCount: panoramas.filter(p => p.tourId === tour.id).length,
      startingPanorama: panoramas.find(p => p.id === tour.startingPanoramaId) || null
    }));

    res.json({
      tours: toursWithPanoramas,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredTours.length / limit),
        totalItems: filteredTours.length,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({
      error: 'Failed to fetch tours',
      message: error.message
    });
  }
});

// Get single tour by ID
router.get('/:id', async (req, res) => {
  try {
    const tourId = req.params.id;
    
    const tours = await readJsonFile(getDataFilePath('tours.json'));
    const tour = tours.find(t => t.id === tourId);
    
    if (!tour) {
      return res.status(404).json({
        error: 'Tour not found',
        message: 'The requested tour does not exist'
      });
    }

    // Get panoramas for this tour
    const panoramas = await readJsonFile(getDataFilePath('panoramas.json'));
    const tourPanoramas = panoramas.filter(p => p.tourId === tourId);

    const tourWithData = {
      ...tour,
      panoramas: tourPanoramas,
      panoramaCount: tourPanoramas.length
    };

    res.json(tourWithData);
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).json({
      error: 'Failed to fetch tour',
      message: error.message
    });
  }
});

// Create new tour
router.post('/', async (req, res) => {
  try {
    const { error, value } = tourSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const tourId = uuidv4();
    const newTour = {
      id: tourId,
      ...value,
      panoramaCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const tours = await readJsonFile(getDataFilePath('tours.json'));
    tours.push(newTour);
    await writeJsonFile(getDataFilePath('tours.json'), tours);

    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: newTour
    });
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(500).json({
      error: 'Failed to create tour',
      message: error.message
    });
  }
});

// Update tour
router.put('/:id', async (req, res) => {
  try {
    const tourId = req.params.id;
    const { error, value } = tourSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const tours = await readJsonFile(getDataFilePath('tours.json'));
    const tourIndex = tours.findIndex(t => t.id === tourId);
    
    if (tourIndex === -1) {
      return res.status(404).json({
        error: 'Tour not found',
        message: 'The requested tour does not exist'
      });
    }

    tours[tourIndex] = {
      ...tours[tourIndex],
      ...value,
      updatedAt: new Date().toISOString()
    };

    await writeJsonFile(getDataFilePath('tours.json'), tours);

    res.json({
      success: true,
      message: 'Tour updated successfully',
      data: tours[tourIndex]
    });
  } catch (error) {
    console.error('Error updating tour:', error);
    res.status(500).json({
      error: 'Failed to update tour',
      message: error.message
    });
  }
});

// Delete tour
router.delete('/:id', async (req, res) => {
  try {
    const tourId = req.params.id;
    
    const tours = await readJsonFile(getDataFilePath('tours.json'));
    const tourIndex = tours.findIndex(t => t.id === tourId);
    
    if (tourIndex === -1) {
      return res.status(404).json({
        error: 'Tour not found',
        message: 'The requested tour does not exist'
      });
    }

    // Remove tour
    tours.splice(tourIndex, 1);
    await writeJsonFile(getDataFilePath('tours.json'), tours);

    // Optionally remove associated panoramas
    const panoramas = await readJsonFile(getDataFilePath('panoramas.json'));
    const filteredPanoramas = panoramas.filter(p => p.tourId !== tourId);
    await writeJsonFile(getDataFilePath('panoramas.json'), filteredPanoramas);

    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tour:', error);
    res.status(500).json({
      error: 'Failed to delete tour',
      message: error.message
    });
  }
});

// Add hotspot to panorama
router.post('/:tourId/panorama/:panoramaId/hotspots', async (req, res) => {
  try {
    const { tourId, panoramaId } = req.params;
    const { error, value } = hotspotSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const hotspotId = value.id || uuidv4();
    const newHotspot = {
      id: hotspotId,
      ...value,
      createdAt: new Date().toISOString()
    };

    // Update panorama with new hotspot
    const panoramas = await readJsonFile(getDataFilePath('panoramas.json'));
    const panoramaIndex = panoramas.findIndex(p => p.id === panoramaId && p.tourId === tourId);
    
    if (panoramaIndex === -1) {
      return res.status(404).json({
        error: 'Panorama not found',
        message: 'The requested panorama does not exist in this tour'
      });
    }

    panoramas[panoramaIndex].hotspots = panoramas[panoramaIndex].hotspots || [];
    panoramas[panoramaIndex].hotspots.push(newHotspot);
    panoramas[panoramaIndex].updatedAt = new Date().toISOString();

    await writeJsonFile(getDataFilePath('panoramas.json'), panoramas);

    res.status(201).json({
      success: true,
      message: 'Hotspot added successfully',
      data: newHotspot
    });
  } catch (error) {
    console.error('Error adding hotspot:', error);
    res.status(500).json({
      error: 'Failed to add hotspot',
      message: error.message
    });
  }
});

// Update hotspot
router.put('/:tourId/panorama/:panoramaId/hotspots/:hotspotId', async (req, res) => {
  try {
    const { tourId, panoramaId, hotspotId } = req.params;
    const { error, value } = hotspotSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const panoramas = await readJsonFile(getDataFilePath('panoramas.json'));
    const panoramaIndex = panoramas.findIndex(p => p.id === panoramaId && p.tourId === tourId);
    
    if (panoramaIndex === -1) {
      return res.status(404).json({
        error: 'Panorama not found',
        message: 'The requested panorama does not exist in this tour'
      });
    }

    const hotspotIndex = panoramas[panoramaIndex].hotspots.findIndex(h => h.id === hotspotId);
    if (hotspotIndex === -1) {
      return res.status(404).json({
        error: 'Hotspot not found',
        message: 'The requested hotspot does not exist'
      });
    }

    panoramas[panoramaIndex].hotspots[hotspotIndex] = {
      ...panoramas[panoramaIndex].hotspots[hotspotIndex],
      ...value,
      updatedAt: new Date().toISOString()
    };
    panoramas[panoramaIndex].updatedAt = new Date().toISOString();

    await writeJsonFile(getDataFilePath('panoramas.json'), panoramas);

    res.json({
      success: true,
      message: 'Hotspot updated successfully',
      data: panoramas[panoramaIndex].hotspots[hotspotIndex]
    });
  } catch (error) {
    console.error('Error updating hotspot:', error);
    res.status(500).json({
      error: 'Failed to update hotspot',
      message: error.message
    });
  }
});

// Delete hotspot
router.delete('/:tourId/panorama/:panoramaId/hotspots/:hotspotId', async (req, res) => {
  try {
    const { tourId, panoramaId, hotspotId } = req.params;

    const panoramas = await readJsonFile(getDataFilePath('panoramas.json'));
    const panoramaIndex = panoramas.findIndex(p => p.id === panoramaId && p.tourId === tourId);
    
    if (panoramaIndex === -1) {
      return res.status(404).json({
        error: 'Panorama not found',
        message: 'The requested panorama does not exist in this tour'
      });
    }

    const hotspotIndex = panoramas[panoramaIndex].hotspots.findIndex(h => h.id === hotspotId);
    if (hotspotIndex === -1) {
      return res.status(404).json({
        error: 'Hotspot not found',
        message: 'The requested hotspot does not exist'
      });
    }

    panoramas[panoramaIndex].hotspots.splice(hotspotIndex, 1);
    panoramas[panoramaIndex].updatedAt = new Date().toISOString();

    await writeJsonFile(getDataFilePath('panoramas.json'), panoramas);

    res.json({
      success: true,
      message: 'Hotspot deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hotspot:', error);
    res.status(500).json({
      error: 'Failed to delete hotspot',
      message: error.message
    });
  }
});

// Increment view count
router.post('/:id/view', async (req, res) => {
  try {
    const tourId = req.params.id;
    
    const tours = await readJsonFile(getDataFilePath('tours.json'));
    const tourIndex = tours.findIndex(t => t.id === tourId);
    
    if (tourIndex === -1) {
      return res.status(404).json({
        error: 'Tour not found',
        message: 'The requested tour does not exist'
      });
    }

    tours[tourIndex].viewCount = (tours[tourIndex].viewCount || 0) + 1;
    tours[tourIndex].lastViewedAt = new Date().toISOString();

    await writeJsonFile(getDataFilePath('tours.json'), tours);

    res.json({
      success: true,
      viewCount: tours[tourIndex].viewCount
    });
  } catch (error) {
    console.error('Error updating view count:', error);
    res.status(500).json({
      error: 'Failed to update view count',
      message: error.message
    });
  }
});

module.exports = router;