import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Virtual Tour utility functions
export const tourUtils = {
  // Validate panorama image dimensions
  validatePanoramaImage: (file: File): Promise<{
    isValid: boolean;
    width: number;
    height: number;
    aspectRatio: number;
    isEquirectangular: boolean;
  }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const isEquirectangular = Math.abs(aspectRatio - 2) < 0.1;
        
        resolve({
          isValid: img.width > 0 && img.height > 0,
          width: img.width,
          height: img.height,
          aspectRatio,
          isEquirectangular
        });
      };
      img.onerror = () => {
        resolve({
          isValid: false,
          width: 0,
          height: 0,
          aspectRatio: 0,
          isEquirectangular: false
        });
      };
      
      if (file.type.startsWith('image/')) {
        img.src = URL.createObjectURL(file);
      } else {
        resolve({
          isValid: false,
          width: 0,
          height: 0,
          aspectRatio: 0,
          isEquirectangular: false
        });
      }
    });
  },

  // Convert file size to human readable format
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Generate unique ID
  generateId: (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Convert spherical coordinates to 3D position
  sphericalTo3D: (longitude: number, latitude: number, radius: number = 5000) => {
    const phi = (90 - latitude) * Math.PI / 180;
    const theta = (longitude + 180) * Math.PI / 180;
    
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  },

  // Convert 3D position to spherical coordinates
  threeDToSpherical: (x: number, y: number, z: number) => {
    const radius = Math.sqrt(x * x + y * y + z * z);
    const longitude = Math.atan2(z, x) * 180 / Math.PI - 180;
    const latitude = 90 - Math.acos(y / radius) * 180 / Math.PI;
    
    return { longitude, latitude };
  },

  // Check if browser supports VR
  isVRSupported: (): boolean => {
    return !!(navigator as any).xr || !!(navigator as any).getVRDisplays;
  },

  // Check if device is mobile
  isMobile: (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Check if browser supports fullscreen
  supportsFullscreen: (): boolean => {
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    );
  },

  // Get optimal viewer dimensions
  getOptimalViewerSize: (containerWidth: number, containerHeight: number) => {
    const aspectRatio = 16 / 9; // Standard aspect ratio for panorama viewers
    let width = containerWidth;
    let height = containerWidth / aspectRatio;
    
    if (height > containerHeight) {
      height = containerHeight;
      width = containerHeight * aspectRatio;
    }
    
    return { width: Math.floor(width), height: Math.floor(height) };
  },

  // Debounce function
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  },

  // Throttle function
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Date formatting utilities
export const dateUtils = {
  formatRelative: (date: string | Date): string => {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  },

  formatDate: (date: string | Date, format: 'short' | 'long' = 'short'): string => {
    const targetDate = new Date(date);
    
    if (format === 'short') {
      return targetDate.toLocaleDateString();
    }
    
    return targetDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Validation utilities
export const validation = {
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidImageType: (type: string): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(type.toLowerCase());
  },

  sanitizeFilename: (filename: string): string => {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }
};

// Local storage utilities with error handling
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }
};

// Error handling utilities
export const errorUtils = {
  getErrorMessage: (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.response?.data?.message) return error.response.data.message;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  },

  isNetworkError: (error: any): boolean => {
    return error?.code === 'NETWORK_ERROR' || error?.message === 'Network Error';
  },

  retryAsync: async <T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && errorUtils.isNetworkError(error)) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return errorUtils.retryAsync(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }
};

// Performance utilities
export const performance = {
  measure: <T>(name: string, fn: () => T): T => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
      const result = fn();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      return result;
    }
    return fn();
  },

  measureAsync: async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${name}-start`);
      const result = await fn();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      return result;
    }
    return await fn();
  }
};