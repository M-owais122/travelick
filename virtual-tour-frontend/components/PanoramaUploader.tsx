'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, AlertCircle, Image, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface UploadFile extends File {
  id: string;
  preview?: string;
  uploadProgress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: any;
}

interface PanoramaUploaderProps {
  onUpload: (files: File[]) => Promise<any[]>;
  tourId?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
  accept?: Record<string, string[]>;
}

const PanoramaUploader: React.FC<PanoramaUploaderProps> = ({
  onUpload,
  tourId,
  maxFiles = 10,
  maxSize = 50,
  className,
  accept = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png']
  }
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        switch (error.code) {
          case 'file-too-large':
            toast.error(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`);
            break;
          case 'file-invalid-type':
            toast.error(`File ${file.name} is not a valid image format.`);
            break;
          case 'too-many-files':
            toast.error(`Too many files. Maximum is ${maxFiles} files.`);
            break;
          default:
            toast.error(`Error with file ${file.name}: ${error.message}`);
        }
      });
    });

    // Process accepted files
    const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
      ...file,
      id: `${Date.now()}-${Math.random()}`,
      status: 'pending' as const,
      preview: URL.createObjectURL(file)
    }));

    setFiles(prev => {
      const combined = [...prev, ...newFiles];
      if (combined.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed. Some files were not added.`);
        return combined.slice(0, maxFiles);
      }
      return combined;
    });
  }, [maxFiles, maxSize]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    maxFiles,
    multiple: true,
    disabled: isUploading
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file && file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const validatePanorama = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const isEquirectangular = Math.abs(aspectRatio - 2) < 0.1;
        
        if (!isEquirectangular) {
          toast.warning(`${file.name} may not be equirectangular (2:1 aspect ratio). Upload anyway?`);
        }
        
        resolve(true); // Allow upload anyway, but warn user
      };
      img.onerror = () => {
        toast.error(`Could not load ${file.name}`);
        resolve(false);
      };
      
      if (file.type.startsWith('image/')) {
        img.src = URL.createObjectURL(file);
      } else {
        resolve(false);
      }
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    
    try {
      // Validate all files first
      const validationPromises = files.map(file => validatePanorama(file));
      const validationResults = await Promise.all(validationPromises);
      
      const validFiles = files.filter((_, index) => validationResults[index]);
      
      if (validFiles.length === 0) {
        toast.error('No valid files to upload');
        setIsUploading(false);
        return;
      }

      // Update status to uploading
      setFiles(prev => prev.map(file => ({
        ...file,
        status: validFiles.includes(file) ? 'uploading' : 'error',
        uploadProgress: validFiles.includes(file) ? 0 : undefined,
        error: validFiles.includes(file) ? undefined : 'Invalid file format'
      })));

      // Simulate upload progress (replace with actual progress tracking)
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(file => {
          if (file.status === 'uploading' && (file.uploadProgress || 0) < 90) {
            return {
              ...file,
              uploadProgress: Math.min((file.uploadProgress || 0) + Math.random() * 20, 90)
            };
          }
          return file;
        }));
      }, 500);

      // Perform actual upload
      const results = await onUpload(validFiles);
      
      clearInterval(progressInterval);

      // Update files with results
      setFiles(prev => prev.map((file, index) => {
        const result = results[index];
        return {
          ...file,
          status: result ? 'success' : 'error',
          uploadProgress: 100,
          result: result,
          error: result ? undefined : 'Upload failed'
        };
      }));

      toast.success(`Successfully uploaded ${results.length} panoramas`);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      
      setFiles(prev => prev.map(file => ({
        ...file,
        status: file.status === 'uploading' ? 'error' : file.status,
        error: file.status === 'uploading' ? 'Upload failed' : file.error
      })));
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const successFiles = files.filter(f => f.status === 'success');
  const errorFiles = files.filter(f => f.status === 'error');

  return (
    <div className={cn('w-full', className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive && !isDragReject && 'border-blue-400 bg-blue-50',
          isDragReject && 'border-red-400 bg-red-50',
          isUploading && 'pointer-events-none opacity-60',
          'hover:border-blue-400 hover:bg-blue-50'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center',
            isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
          )}>
            <Upload className="w-8 h-8" />
          </div>
          
          <div>
            <p className="text-lg font-medium">
              {isDragActive 
                ? 'Drop your panoramas here' 
                : 'Upload panoramic images'
              }
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop or click to browse • JPG, PNG • Max {maxSize}MB each • Up to {maxFiles} files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              ⚡ Best results with equirectangular images (2:1 aspect ratio)
            </p>
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Files ({files.length})</h3>
            <div className="flex gap-2">
              {pendingFiles.length > 0 && (
                <button
                  onClick={uploadFiles}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {pendingFiles.length} files
                    </>
                  )}
                </button>
              )}
              
              <button
                onClick={clearAll}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Status summary */}
          {(successFiles.length > 0 || errorFiles.length > 0) && (
            <div className="flex gap-4 text-sm">
              {successFiles.length > 0 && (
                <div className="text-green-600">
                  ✓ {successFiles.length} uploaded
                </div>
              )}
              {errorFiles.length > 0 && (
                <div className="text-red-600">
                  ✗ {errorFiles.length} failed
                </div>
              )}
            </div>
          )}

          {/* Files grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-white"
              >
                {/* Preview */}
                <div className="flex-shrink-0 w-16 h-10 bg-gray-100 rounded overflow-hidden">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  
                  {/* Progress bar */}
                  {file.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all"
                          style={{ width: `${file.uploadProgress || 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}
                </div>

                {/* Status icon */}
                <div className="flex-shrink-0">
                  {file.status === 'pending' && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                  {file.status === 'uploading' && (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">📸 Tips for best results:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use equirectangular panoramic images (2:1 aspect ratio)</li>
          <li>• Higher resolution images provide better VR experience</li>
          <li>• Ensure good lighting and minimal motion blur</li>
          <li>• Consider the viewer's starting position when capturing</li>
        </ul>
      </div>
    </div>
  );
};

export default PanoramaUploader;