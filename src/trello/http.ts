import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { TrelloApiError } from './types.js';

export class TrelloHttpError extends Error {
  public readonly statusCode: number;
  public readonly trelloError?: TrelloApiError;

  constructor(message: string, statusCode: number, trelloError?: TrelloApiError) {
    super(message);
    this.name = 'TrelloHttpError';
    this.statusCode = statusCode;
    this.trelloError = trelloError;
  }
}

export class TrelloHttpClient {
  private readonly axios: AxiosInstance;
  private readonly logger = logger.child({ component: 'TrelloHttpClient' });

  constructor() {
    this.axios = axios.create({
      baseURL: config.TRELLO_API_BASE,
      timeout: 30000,
      params: {
        key: config.TRELLO_KEY,
        token: config.TRELLO_TOKEN,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for logging
    this.axios.interceptors.request.use(
      (config) => {
        this.logger.debug({
          method: config.method?.toUpperCase(),
          url: config.url,
          params: { ...config.params, key: '[REDACTED]', token: '[REDACTED]' },
        }, 'Trello API request');
        return config;
      },
      (error) => {
        this.logger.error({ error: error.message }, 'Trello API request error');
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and logging
    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug({
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          responseSize: JSON.stringify(response.data).length,
        }, 'Trello API response');
        return response;
      },
      (error: AxiosError) => {
        this.logger.error({
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
        }, 'Trello API error response');

        // Transform axios error to our custom error
        const statusCode = error.response?.status || 500;
        const trelloError = error.response?.data as TrelloApiError | undefined;
        
        let message = 'Trello API request failed';
        if (trelloError?.message) {
          message = trelloError.message;
        } else if (error.message) {
          message = error.message;
        }

        return Promise.reject(new TrelloHttpError(message, statusCode, trelloError));
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  // Utility method for batch requests
  async batch<T>(urls: string[]): Promise<T[]> {
    if (urls.length === 0) {
      return [];
    }
    
    if (urls.length > 10) {
      throw new Error('Batch requests are limited to 10 URLs');
    }

    const batchUrl = '/batch';
    const urlsParam = urls.join(',');
    
    return this.get<T[]>(batchUrl, {
      params: { urls: urlsParam },
    });
  }
}

// Singleton instance
export const trelloHttp = new TrelloHttpClient();
