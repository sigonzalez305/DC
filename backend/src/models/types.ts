export interface Ward {
  id: number;
  name: string;
  geom?: any; // PostGIS geometry
  population?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Source {
  id: number;
  slug: string;
  name: string;
  type: 'twitter' | 'instagram' | 'reddit' | 'nextdoor' | 'government' | 'other';
  handle?: string;
  refresh_rate_minutes: number;
  last_fetched_at?: Date;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Signal {
  id: number;
  source_id: number;
  source_type: string;
  timestamp: Date;
  title?: string;
  body: string;
  author?: string;
  url?: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number; // -1 to 1
  latitude?: number;
  longitude?: number;
  ward_id?: number;
  keywords?: string[];
  category?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
