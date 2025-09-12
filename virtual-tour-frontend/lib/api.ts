import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface Tour {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  tags: string[];
  startingPanoramaId?: string;
  panoramaCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  panoramas?: Panorama[];
}

export interface Panorama {
  id: string;
  title: string;
  description?: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  metadata: {
    width: number;
    height: number;
    aspectRatio: number;
    format: string;
    size: number;
  };
  tourId?: string;
  hotspots: Hotspot[];
  createdAt: string;
  updatedAt: string;
}

export interface Hotspot {
  id: string;
  type: 'navigation' | 'info' | 'custom';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    z?: number;
  };
  targetPanoramaId?: string;
  customData?: any;
  createdAt: string;
}

export interface ShareData {
  id: string;
  code: string;
  tourId: string;
  type: 'link' | 'embed';
  settings: {
    autoplay: boolean;
    controls: boolean;
    title: boolean;
    description: boolean;
    logo: boolean;
    fullscreen: boolean;
    vr: boolean;
    width: number;
    height: number;
  };
  url: string;
  embedCode?: string;
  views: number;
  createdAt: string;
  lastAccessedAt?: string;
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class VirtualTourAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Tours API
  async getTours(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tags?: string[];
    isPublic?: boolean;
  }): Promise<{ tours: Tour[]; pagination: any }> {
    const response = await this.client.get('/tours', { params });
    return response.data;
  }

  async getTour(id: string): Promise<Tour> {
    const response = await this.client.get(`/tours/${id}`);
    return response.data;
  }

  async createTour(tour: Omit<Tour, 'id' | 'createdAt' | 'updatedAt' | 'panoramaCount' | 'viewCount'>): Promise<Tour> {
    const response = await this.client.post('/tours', tour);
    return response.data.data;
  }

  async updateTour(id: string, tour: Partial<Tour>): Promise<Tour> {
    const response = await this.client.put(`/tours/${id}`, tour);
    return response.data.data;
  }

  async deleteTour(id: string): Promise<void> {
    await this.client.delete(`/tours/${id}`);
  }

  async incrementTourView(id: string): Promise<{ viewCount: number }> {
    const response = await this.client.post(`/tours/${id}/view`);
    return response.data;
  }

  // Hotspots API
  async addHotspot(tourId: string, panoramaId: string, hotspot: Omit<Hotspot, 'id' | 'createdAt'>): Promise<Hotspot> {
    const response = await this.client.post(`/tours/${tourId}/panorama/${panoramaId}/hotspots`, hotspot);
    return response.data.data;
  }

  async updateHotspot(tourId: string, panoramaId: string, hotspot: Hotspot): Promise<Hotspot> {
    const response = await this.client.put(`/tours/${tourId}/panorama/${panoramaId}/hotspots/${hotspot.id}`, hotspot);
    return response.data.data;
  }

  async deleteHotspot(tourId: string, panoramaId: string, hotspotId: string): Promise<void> {
    await this.client.delete(`/tours/${tourId}/panorama/${panoramaId}/hotspots/${hotspotId}`);
  }

  // Upload API
  async uploadPanorama(file: File, metadata: {
    title: string;
    description?: string;
    tourId?: string;
  }): Promise<Panorama> {
    const formData = new FormData();
    formData.append('panorama', file);
    formData.append('title', metadata.title);
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.tourId) {
      formData.append('tourId', metadata.tourId);
    }

    const response = await this.client.post('/upload/panorama', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  async uploadMultiplePanoramas(files: File[], tourId?: string): Promise<Panorama[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('panoramas', file);
      formData.append('titles', `Panorama ${index + 1}`);
    });
    if (tourId) {
      formData.append('tourId', tourId);
    }

    const response = await this.client.post('/upload/tour/panoramas', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Sharing API
  async createShare(shareData: {
    tourId: string;
    type: 'link' | 'embed';
    settings?: Partial<ShareData['settings']>;
  }): Promise<ShareData> {
    const response = await this.client.post('/share/create', shareData);
    return response.data.data;
  }

  async getSharedTour(code: string): Promise<{
    share: Partial<ShareData>;
    tour: Tour;
  }> {
    const response = await this.client.get(`/share/${code}`);
    return response.data;
  }

  async updateShare(shareId: string, shareData: Partial<ShareData>): Promise<ShareData> {
    const response = await this.client.put(`/share/${shareId}`, shareData);
    return response.data.data;
  }

  async deleteShare(shareId: string): Promise<void> {
    await this.client.delete(`/share/${shareId}`);
  }

  async getShareAnalytics(shareId: string): Promise<{
    shareId: string;
    code: string;
    views: number;
    createdAt: string;
    lastAccessedAt?: string;
    url: string;
  }> {
    const response = await this.client.get(`/share/analytics/${shareId}`);
    return response.data;
  }

  // Utility methods
  getImageUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }
    return `${API_BASE_URL.replace('/api', '')}${path}`;
  }

  generateEmbedUrl(shareCode: string): string {
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/share/embed/${shareCode}`;
  }
}

// Create singleton instance
const api = new VirtualTourAPI();
export default api;

// React hooks for common operations
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function useTours(params?: Parameters<VirtualTourAPI['getTours']>[0]) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const result = await api.getTours(params);
        setTours(result.tours);
        setPagination(result.pagination);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch tours');
        toast.error('Failed to load tours');
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, [JSON.stringify(params)]);

  return { tours, pagination, loading, error, refetch: () => fetchTours() };
}

export function useTour(id: string | null) {
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setTour(null);
      setLoading(false);
      return;
    }

    const fetchTour = async () => {
      try {
        setLoading(true);
        const result = await api.getTour(id);
        setTour(result);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch tour');
        toast.error('Failed to load tour');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [id]);

  return { tour, loading, error, refetch: () => id && fetchTour() };
}

export function useUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadPanorama = async (file: File, metadata: Parameters<VirtualTourAPI['uploadPanorama']>[1]) => {
    try {
      setUploading(true);
      setProgress(0);
      
      const result = await api.uploadPanorama(file, metadata);
      setProgress(100);
      toast.success('Panorama uploaded successfully');
      return result;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultiple = async (files: File[], tourId?: string) => {
    try {
      setUploading(true);
      setProgress(0);
      
      const results = await api.uploadMultiplePanoramas(files, tourId);
      setProgress(100);
      toast.success(`${results.length} panoramas uploaded successfully`);
      return results;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    progress,
    uploadPanorama,
    uploadMultiple
  };
}