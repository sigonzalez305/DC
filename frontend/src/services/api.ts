const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Signal {
  id: number;
  source_id: number;
  source_type: string;
  timestamp: string;
  title: string | null;
  body: string;
  author: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  latitude: number | null;
  longitude: number | null;
  ward_id: number | null;
  keywords: string[] | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  average_score: number;
}

export interface Ward {
  id: number;
  name: string;
  population: number;
  geom: any;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: number;
  slug: string;
  name: string;
  type: string;
  handle: string | null;
  refresh_rate_minutes: number;
  last_fetched_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Signals endpoints
  async getSignals(params?: {
    ward_id?: number;
    sentiment?: string;
    category?: string;
    limit?: number;
  }): Promise<ApiResponse<Signal[]>> {
    const queryParams = new URLSearchParams();
    if (params?.ward_id) queryParams.append('ward_id', params.ward_id.toString());
    if (params?.sentiment) queryParams.append('sentiment', params.sentiment);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<Signal[]>(`/signals${query ? `?${query}` : ''}`);
  }

  async getSignal(id: number): Promise<ApiResponse<Signal>> {
    return this.request<Signal>(`/signals/${id}`);
  }

  // Sentiment endpoints
  async getCitywideSentiment(): Promise<ApiResponse<SentimentStats>> {
    return this.request<SentimentStats>('/sentiment/citywide');
  }

  async getSentimentByWard(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/sentiment/by-ward');
  }

  // Wards endpoints
  async getWards(): Promise<ApiResponse<Ward[]>> {
    return this.request<Ward[]>('/wards');
  }

  async getWard(id: number): Promise<ApiResponse<Ward>> {
    return this.request<Ward>(`/wards/${id}`);
  }

  // Sources endpoints
  async getSources(params?: { type?: string; is_active?: boolean }): Promise<ApiResponse<Source[]>> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    const query = queryParams.toString();
    return this.request<Source[]>(`/sources${query ? `?${query}` : ''}`);
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ message: string; timestamp: string }>> {
    return this.request('/health');
  }
}

export const api = new ApiClient(API_URL);
