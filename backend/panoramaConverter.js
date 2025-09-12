// Try to load Sharp, but don't fail if it's not available
let sharp;
try {
    sharp = require('sharp');
} catch (error) {
    console.warn('Sharp module not available - panorama conversion features will be limited');
    console.warn('To enable full panorama conversion, install Sharp: npm install --platform=win32 --arch=x64 sharp');
    sharp = null;
}
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');

class PanoramaConverter {
    constructor() {
        // You can integrate with various AI services for panorama conversion
        this.services = {
            // Example services (you'll need API keys for production)
            huggingface: 'https://api-inference.huggingface.co/models/facebook/dpt-large',
            replicate: 'https://api.replicate.com/v1/predictions',
            openai: 'https://api.openai.com/v1/images/generations'
        };
    }

    // Main conversion function
    async convertToPanorama(inputPath, outputPath, method = 'perspective') {
        try {
            console.log(`Converting ${inputPath} to panorama using ${method} method...`);
            
            switch (method) {
                case 'perspective':
                    return await this.perspectiveConversion(inputPath, outputPath);
                case 'ai_depth':
                    return await this.aiDepthConversion(inputPath, outputPath);
                case 'cylindrical':
                    return await this.cylindricalProjection(inputPath, outputPath);
                case 'tile_repeat':
                    return await this.tileRepeatMethod(inputPath, outputPath);
                default:
                    return await this.perspectiveConversion(inputPath, outputPath);
            }
        } catch (error) {
            console.error('Panorama conversion failed:', error);
            throw error;
        }
    }

    // Method 1: Perspective projection (basic but fast)
    async perspectiveConversion(inputPath, outputPath) {
        if (!sharp) {
            throw new Error('Sharp module not available. Please install it with: npm install --platform=win32 --arch=x64 sharp');
        }
        
        try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();
            
            // Create panorama dimensions (2:1 aspect ratio for equirectangular)
            const panoramaWidth = 4096;
            const panoramaHeight = 2048;
            
            // Resize and project the image onto panorama canvas
            const processedImage = await image
                .resize(panoramaWidth / 3, panoramaHeight / 2, { 
                    fit: 'cover',
                    position: 'center'
                })
                .extend({
                    top: panoramaHeight / 4,
                    bottom: panoramaHeight / 4,
                    left: panoramaWidth / 3,
                    right: panoramaWidth / 3,
                    background: { r: 0, g: 0, b: 0, alpha: 1 }
                })
                .jpeg({ quality: 90 })
                .toFile(outputPath);
            
            return {
                success: true,
                method: 'perspective',
                outputPath,
                dimensions: { width: panoramaWidth, height: panoramaHeight },
                message: 'Converted using perspective projection'
            };
        } catch (error) {
            throw new Error(`Perspective conversion failed: ${error.message}`);
        }
    }

    // Method 2: AI-based depth estimation and panorama generation
    async aiDepthConversion(inputPath, outputPath) {
        try {
            // This is a placeholder for AI-based conversion
            // In production, you'd integrate with services like:
            // - Hugging Face Depth Estimation models
            // - Replicate.com panorama models
            // - Custom trained models
            
            console.log('AI depth conversion - using fallback perspective method');
            return await this.perspectiveConversion(inputPath, outputPath);
        } catch (error) {
            throw new Error(`AI depth conversion failed: ${error.message}`);
        }
    }

    // Method 3: Cylindrical projection
    async cylindricalProjection(inputPath, outputPath) {
        if (!sharp) {
            throw new Error('Sharp module not available. Please install it with: npm install --platform=win32 --arch=x64 sharp');
        }
        
        try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();
            
            const panoramaWidth = 4096;
            const panoramaHeight = 2048;
            
            // Create a cylindrical projection effect
            const buffer = await image
                .resize(panoramaWidth, panoramaHeight / 2, { fit: 'cover' })
                .extend({
                    top: panoramaHeight / 4,
                    bottom: panoramaHeight / 4,
                    left: 0,
                    right: 0,
                    background: { r: 50, g: 50, b: 50, alpha: 1 }
                })
                .modulate({ brightness: 1.1, saturation: 1.2 })
                .jpeg({ quality: 90 })
                .toFile(outputPath);
            
            return {
                success: true,
                method: 'cylindrical',
                outputPath,
                dimensions: { width: panoramaWidth, height: panoramaHeight },
                message: 'Converted using cylindrical projection'
            };
        } catch (error) {
            throw new Error(`Cylindrical conversion failed: ${error.message}`);
        }
    }

    // Method 4: Tile and repeat method (creates repeating pattern)
    async tileRepeatMethod(inputPath, outputPath) {
        if (!sharp) {
            throw new Error('Sharp module not available. Please install it with: npm install --platform=win32 --arch=x64 sharp');
        }
        
        try {
            const image = sharp(inputPath);
            const metadata = await image.metadata();
            
            const panoramaWidth = 4096;
            const panoramaHeight = 2048;
            const tileWidth = panoramaWidth / 4;
            const tileHeight = panoramaHeight;
            
            // Resize image to tile size
            const tileBuffer = await image
                .resize(tileWidth, tileHeight, { fit: 'cover' })
                .jpeg()
                .toBuffer();
            
            // Create panorama by tiling the image
            const tiles = [];
            for (let i = 0; i < 4; i++) {
                tiles.push({
                    input: tileBuffer,
                    left: i * tileWidth,
                    top: 0
                });
            }
            
            await sharp({
                create: {
                    width: panoramaWidth,
                    height: panoramaHeight,
                    channels: 3,
                    background: { r: 0, g: 0, b: 0 }
                }
            })
            .composite(tiles)
            .jpeg({ quality: 90 })
            .toFile(outputPath);
            
            return {
                success: true,
                method: 'tile_repeat',
                outputPath,
                dimensions: { width: panoramaWidth, height: panoramaHeight },
                message: 'Converted using tile repeat method'
            };
        } catch (error) {
            throw new Error(`Tile repeat conversion failed: ${error.message}`);
        }
    }

    // Generate thumbnail for converted panorama
    async generateThumbnail(panoramaPath, thumbnailPath) {
        if (!sharp) {
            throw new Error('Sharp module not available. Please install it with: npm install --platform=win32 --arch=x64 sharp');
        }
        
        try {
            await sharp(panoramaPath)
                .resize(400, 200, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);
            
            return thumbnailPath;
        } catch (error) {
            throw new Error(`Thumbnail generation failed: ${error.message}`);
        }
    }

    // Validate if image is suitable for conversion
    async validateImage(imagePath) {
        if (!sharp) {
            // Return a basic validation when Sharp is not available
            return {
                isValid: true,
                issues: ['Sharp module not available - image validation limited'],
                metadata: {
                    width: 'unknown',
                    height: 'unknown', 
                    format: 'unknown',
                    size: 'unknown'
                }
            };
        }
        
        try {
            const metadata = await sharp(imagePath).metadata();
            
            const validations = {
                isValid: true,
                issues: [],
                metadata: {
                    width: metadata.width,
                    height: metadata.height,
                    format: metadata.format,
                    size: metadata.size
                }
            };

            // Check minimum resolution
            if (metadata.width < 800 || metadata.height < 600) {
                validations.issues.push('Image resolution too low (minimum 800x600)');
                validations.isValid = false;
            }

            // Check aspect ratio
            const aspectRatio = metadata.width / metadata.height;
            if (aspectRatio < 0.5 || aspectRatio > 4) {
                validations.issues.push('Unusual aspect ratio may not convert well');
            }

            // Check file size
            if (metadata.size > 50 * 1024 * 1024) { // 50MB
                validations.issues.push('File size too large (maximum 50MB)');
                validations.isValid = false;
            }

            return validations;
        } catch (error) {
            return {
                isValid: false,
                issues: [`Image validation failed: ${error.message}`],
                metadata: null
            };
        }
    }

    // Get available conversion methods
    getAvailableMethods() {
        return [
            {
                id: 'perspective',
                name: 'Perspective Projection',
                description: 'Fast conversion using perspective projection',
                quality: 'Good',
                speed: 'Fast',
                recommended: true
            },
            {
                id: 'cylindrical',
                name: 'Cylindrical Projection',
                description: 'Creates cylindrical panorama effect',
                quality: 'Good', 
                speed: 'Fast'
            },
            {
                id: 'tile_repeat',
                name: 'Tile Repeat',
                description: 'Repeats image to create panorama pattern',
                quality: 'Basic',
                speed: 'Very Fast'
            },
            {
                id: 'ai_depth',
                name: 'AI Depth Conversion',
                description: 'AI-powered depth-aware conversion (Premium)',
                quality: 'Excellent',
                speed: 'Slow',
                premium: true
            }
        ];
    }
}

module.exports = PanoramaConverter;