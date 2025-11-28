import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API Response types
 */
interface ApiErrorResponse {
  error: string;
  details?: string;
  validation?: Record<string, string[]>;
}

interface HealthResponse {
  status: 'ok';
  time: string;
}

interface SubmissionResponse {
  ok: boolean;
  id: string;
}

interface Page {
  id: string;
  slug: string;
  title: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  isPublished: boolean;
  lastModified: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  product?: string;
  sortOrder: number;
  isPublished: boolean;
}

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  altText: string;
  category: 'garden-room' | 'house-extension';
  sortOrder: number;
  isPublished: boolean;
}

interface Redirect {
  id: string;
  sourceSlug: string;
  destinationUrl: string;
  active: boolean;
  createdAt: string;
}

interface GalleryResponse {
  items: GalleryItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Client error class
 */
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: ApiErrorResponse
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Rate limit error class
 */
class RateLimitError extends ApiError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 429);
    this.name = 'RateLimitError';
    if (retryAfter) {
      this.message = `Rate limit exceeded. Retry after ${retryAfter} seconds.`;
    }
  }
}

/**
 * API Client configuration
 */
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Main API Client class
 */
class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    // Request interceptor for logging and debugging
    this.client.interceptors.request.use(
      (config) => {
        if (import.meta.env.DEV) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          
          // Handle rate limiting
          if (status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            throw new RateLimitError(retryAfter ? parseInt(retryAfter) : undefined);
          }
          
          // Handle other API errors
          const message = data?.error || `HTTP ${status}: ${error.message}`;
          throw new ApiError(message, status, data);
        }
        
        // Handle network errors
        if (error.code === 'ECONNABORTED') {
          throw new ApiError('Request timeout', 0);
        }
        
        throw new ApiError(error.message || 'Network error', 0);
      }
    );
  }

  /**
   * Generic request method
   */
  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.request(config);
    return response.data;
  }

  /**
   * Health check endpoint
   */
  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>({
      method: 'GET',
      url: '/health',
    });
  }

  /**
   * Submit enquiry/quote form
   */
  async submitEnquiry(data: Record<string, unknown>): Promise<SubmissionResponse> {
    return this.request<SubmissionResponse>({
      method: 'POST',
      url: '/submissions/enquiry',
      data,
    });
  }

  /**
   * Get page content by slug
   */
  async getPage(slug: string): Promise<Page> {
    return this.request<Page>({
      method: 'GET',
      url: `/content/pages/${encodeURIComponent(slug)}`,
    });
  }

  /**
   * Get FAQs with optional product filter
   */
  async getFAQs(product?: string): Promise<FAQ[]> {
    return this.request<FAQ[]>({
      method: 'GET',
      url: '/content/faqs',
      params: product ? { product } : undefined,
    });
  }

  /**
   * Get gallery items with optional filters
   */
  async getGallery(options?: {
    category?: 'garden-room' | 'house-extension';
    page?: number;
    pageSize?: number;
  }): Promise<GalleryResponse> {
    return this.request<GalleryResponse>({
      method: 'GET',
      url: '/content/gallery',
      params: options,
    });
  }

  /**
   * Create a gallery item
   */
  async createGalleryItem(data: Omit<GalleryItem, 'id'>): Promise<GalleryItem> {
    return this.request<GalleryItem>({
      method: 'POST',
      url: '/admin/gallery',
      data,
    });
  }

  /**
   * Update a gallery item
   */
  async updateGalleryItem(id: string, data: Partial<Omit<GalleryItem, 'id'>>): Promise<GalleryItem> {
    return this.request<GalleryItem>({
      method: 'PATCH',
      url: `/admin/gallery/${id}`,
      data,
    });
  }

  /**
   * Delete a gallery item
   */
  async deleteGalleryItem(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/admin/gallery/${id}`,
    });
  }

  /**
   * Get all redirects
   */
  async getRedirects(): Promise<Redirect[]> {
    return this.request<Redirect[]>({
      method: 'GET',
      url: '/admin/redirects',
    });
  }

  /**
   * Create a new redirect
   */
  async createRedirect(data: { sourceSlug: string; destinationUrl: string; active: boolean }): Promise<Redirect> {
    return this.request<Redirect>({
      method: 'POST',
      url: '/admin/redirects',
      data,
    });
  }

  /**
   * Update a redirect
   */
  async updateRedirect(id: string, data: Partial<{ sourceSlug: string; destinationUrl: string; active: boolean }>): Promise<Redirect> {
    return this.request<Redirect>({
      method: 'PATCH',
      url: `/admin/redirects/${id}`,
      data,
    });
  }

  /**
   * Delete a redirect
   */
  async deleteRedirect(id: string): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/admin/redirects/${id}`,
    });
  }

  /**
   * Admin authentication (for future use)
   */
  async adminLogin(email: string, password: string): Promise<{ token: string }> {
    return this.request<{ token: string }>({
      method: 'POST',
      url: '/admin/auth/login',
      data: { email, password },
    });
  }

  /**
   * Set authorization header for admin requests
   */
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear authorization header
   */
  /**
   * Upload an image
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await this.client.post<{ url: string }>('/admin/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.url;
  }

  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Get base URL for reference
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}

/**
 * Create and configure API client instance
 */
function createApiClient(): ApiClient {
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  if (import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL) {
    console.warn('[API Client] VITE_API_BASE_URL not set, using default:', baseURL);
  }

  return new ApiClient({
    baseURL,
    timeout: 30000,
  });
}

// Export singleton instance
export const apiClient = createApiClient();

// Export types and classes for use in components
export type {
  ApiErrorResponse,
  HealthResponse,
  SubmissionResponse,
  Page,
  FAQ,
  GalleryItem,
  GalleryResponse,
  Redirect,
};

export { ApiError, RateLimitError };
export default apiClient;