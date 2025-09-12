const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const uploadSchema = Joi.object({
  title: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow(''),
  tourId: Joi.string().uuid().optional()
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/panoramas');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  },
  fileFilter: fileFilter
});

// Utility functions
const createThumbnail = async (imagePath, outputPath) => {
  try {
    await sharp(imagePath)
      .resize(400, 200, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    return false;
  }
};

const validatePanoramaImage = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    
    // Check if image is equirectangular (2:1 aspect ratio)
    const aspectRatio = metadata.width / metadata.height;
    const isEquirectangular = Math.abs(aspectRatio - 2) < 0.1;
    
    return {
      isValid: isEquirectangular,
      width: metadata.width,
      height: metadata.height,
      aspectRatio: aspectRatio,
      format: metadata.format,
      size: metadata.size
    };
  } catch (error) {
    console.error('Error validating panorama:', error);
    return { isValid: false, error: error.message };
  }
};

const savePanoramaMetadata = async (panoramaData) => {
  const dataDir = path.join(__dirname, '../data');
  const metadataFile = path.join(dataDir, 'panoramas.json');
  
  try {
    await fs.mkdir(dataDir, { recursive: true });
    
    let panoramas = [];
    try {
      const existingData = await fs.readFile(metadataFile, 'utf8');
      panoramas = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    panoramas.push(panoramaData);
    await fs.writeFile(metadataFile, JSON.stringify(panoramas, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error saving panorama metadata:', error);
    return false;
  }
};

// Routes

// Upload single panorama
router.post('/panorama', upload.single('panorama'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a panoramic image to upload'
      });
    }

    // Validate request body
    const { error, value } = uploadSchema.validate(req.body);
    if (error) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        error: 'Validation error',
        message: error.details[0].message
      });
    }

    const { title, description, tourId } = value;
    
    // Validate panorama image
    const validation = await validatePanoramaImage(req.file.path);
    if (!validation.isValid) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        error: 'Invalid panorama image',
        message: validation.error || 'Image must be equirectangular (2:1 aspect ratio) for proper 360° viewing'
      });
    }

    // Create thumbnail
    const thumbnailPath = req.file.path.replace(/\.(jpg|jpeg|png)$/i, '_thumb.jpg');
    const thumbnailCreated = await createThumbnail(req.file.path, thumbnailPath);

    // Prepare panorama metadata
    const panoramaId = uuidv4();
    const panoramaData = {
      id: panoramaId,
      title,
      description,
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/panoramas/${req.file.filename}`,
      thumbnailUrl: thumbnailCreated ? `/uploads/panoramas/${path.basename(thumbnailPath)}` : null,
      metadata: {
        width: validation.width,
        height: validation.height,
        aspectRatio: validation.aspectRatio,
        format: validation.format,
        size: req.file.size
      },
      tourId: tourId || null,
      hotspots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save metadata
    const saved = await savePanoramaMetadata(panoramaData);
    if (!saved) {
      return res.status(500).json({
        error: 'Failed to save panorama metadata',
        message: 'The image was uploaded but metadata could not be saved'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Panorama uploaded successfully',
      data: panoramaData
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      error: 'Upload failed',
      message: error.message
    });
  }
});

// Upload multiple panoramas for a tour
router.post('/tour/panoramas', upload.array('panoramas', 10), async (req, res) => {
  const uploadedFiles = [];
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select panoramic images to upload'
      });
    }

    const { tourId, titles } = req.body;
    const titlesArray = Array.isArray(titles) ? titles : [titles];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const title = titlesArray[i] || `Panorama ${i + 1}`;

      try {
        // Validate panorama image
        const validation = await validatePanoramaImage(file.path);
        if (!validation.isValid) {
          await fs.unlink(file.path).catch(console.error);
          continue; // Skip invalid files
        }

        // Create thumbnail
        const thumbnailPath = file.path.replace(/\.(jpg|jpeg|png)$/i, '_thumb.jpg');
        await createThumbnail(file.path, thumbnailPath);

        const panoramaId = uuidv4();
        const panoramaData = {
          id: panoramaId,
          title,
          description: '',
          filename: file.filename,
          originalName: file.originalname,
          url: `/uploads/panoramas/${file.filename}`,
          thumbnailUrl: `/uploads/panoramas/${path.basename(thumbnailPath)}`,
          metadata: {
            width: validation.width,
            height: validation.height,
            aspectRatio: validation.aspectRatio,
            format: validation.format,
            size: file.size
          },
          tourId: tourId || null,
          hotspots: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await savePanoramaMetadata(panoramaData);
        uploadedFiles.push(panoramaData);

      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        await fs.unlink(file.path).catch(console.error);
      }
    }

    res.status(201).json({
      success: true,
      message: `${uploadedFiles.length} panoramas uploaded successfully`,
      data: uploadedFiles
    });

  } catch (error) {
    console.error('Batch upload error:', error);
    
    // Clean up all uploaded files on error
    if (req.files) {
      for (const file of req.files) {
        await fs.unlink(file.path).catch(console.error);
      }
    }
    
    res.status(500).json({
      error: 'Batch upload failed',
      message: error.message
    });
  }
});

// Get upload progress (for large files)
router.get('/progress/:uploadId', (req, res) => {
  // This is a placeholder for upload progress tracking
  // In a real implementation, you'd use websockets or server-sent events
  res.json({
    uploadId: req.params.uploadId,
    progress: 100,
    status: 'completed'
  });
});

module.exports = router;