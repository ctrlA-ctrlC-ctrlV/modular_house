import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

describe('ApiClient', () => {
  const mockRequest = vi.fn();
  const mockInterceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  const mockDefaults = {
    headers: {
      common: {} as Record<string, string>,
    },
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    
    // Reset mock state
    mockRequest.mockReset();
    mockInterceptors.request.use.mockReset();
    mockInterceptors.response.use.mockReset();
    mockDefaults.headers.common = {};

    // Mock axios.create
    vi.mocked(axios.create).mockReturnValue({
      request: mockRequest,
      interceptors: mockInterceptors,
      defaults: mockDefaults,
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment Configuration', () => {
    it('should use VITE_API_BASE_URL when available', async () => {
      await import('./apiClient');
      
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.any(String),
          timeout: 30000,
        })
      );
    });

    it('should have correct default headers', async () => {
      await import('./apiClient');
      
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });
  });

  describe('Health Check', () => {
    it('should call health endpoint correctly', async () => {
      const mockResponse = { status: 'ok', time: '2023-01-01T00:00:00Z' };
      mockRequest.mockResolvedValueOnce({ data: mockResponse });
      
      const { apiClient } = await import('./apiClient');
      const result = await apiClient.getHealth();

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/health',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Submission', () => {
    it('should submit enquiry with correct data', async () => {
      const mockResponse = { ok: true, id: 'test-id' };
      const enquiryData = { name: 'Test User', email: 'test@example.com' };
      mockRequest.mockResolvedValueOnce({ data: mockResponse });
      
      const { apiClient } = await import('./apiClient');
      const result = await apiClient.submitEnquiry(enquiryData);

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/submissions/enquiry',
        data: enquiryData,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Content API', () => {
    it('should fetch page by slug', async () => {
      const mockPage = { id: '1', slug: 'test-page', title: 'Test Page' };
      mockRequest.mockResolvedValueOnce({ data: mockPage });
      
      const { apiClient } = await import('./apiClient');
      const result = await apiClient.getPage('test-page');

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/content/pages/test-page',
      });
      expect(result).toEqual(mockPage);
    });

    it('should fetch FAQs', async () => {
      const mockFAQs = [{ id: '1', question: 'Test?', answer: 'Answer' }];
      mockRequest.mockResolvedValueOnce({ data: mockFAQs });
      
      const { apiClient } = await import('./apiClient');
      const result = await apiClient.getFAQs();

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/content/faqs',
        params: undefined,
      });
      expect(result).toEqual(mockFAQs);
    });

    it('should fetch gallery with filters', async () => {
      const mockGallery = { items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
      mockRequest.mockResolvedValueOnce({ data: mockGallery });
      
      const { apiClient } = await import('./apiClient');
      const result = await apiClient.getGallery({ category: 'garden-room', page: 1 });

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'GET',
        url: '/content/gallery',
        params: { category: 'garden-room', page: 1 },
      });
      expect(result).toEqual(mockGallery);
    });
  });

  describe('Authentication', () => {
    it('should set auth token correctly', async () => {
      const { apiClient } = await import('./apiClient');
      const token = 'test-token';
      
      apiClient.setAuthToken(token);

      expect(mockDefaults.headers.common.Authorization).toBe(`Bearer ${token}`);
    });

    it('should clear auth token correctly', async () => {
      const { apiClient } = await import('./apiClient');
      
      apiClient.setAuthToken('test-token');
      apiClient.clearAuthToken();

      expect(mockDefaults.headers.common.Authorization).toBeUndefined();
    });

    it('should login admin user', async () => {
      const mockToken = { token: 'jwt-token' };
      mockRequest.mockResolvedValueOnce({ data: mockToken });
      
      const { apiClient } = await import('./apiClient');
      const result = await apiClient.adminLogin('test@example.com', 'password');

      expect(mockRequest).toHaveBeenCalledWith({
        method: 'POST',
        url: '/admin/auth/login',
        data: { email: 'test@example.com', password: 'password' },
      });
      expect(result).toEqual(mockToken);
    });
  });

  describe('Utility Methods', () => {
    it('should return base URL', async () => {
      const { apiClient } = await import('./apiClient');
      
      const baseURL = apiClient.getBaseURL();
      expect(baseURL).toBeTruthy();
      expect(typeof baseURL).toBe('string');
    });
  });
});

vi.mock('axios');