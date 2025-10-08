/**
 * @fileoverview This module provides a robust HTTP client for interacting with the Trello API.
 * It uses `axios` for making HTTP requests and includes interceptors for logging and centralized error handling.
 * It defines a custom `TrelloHttpError` for consistent error reporting and exports a singleton instance
 * of the `TrelloHttpClient` for use throughout the application.
 */
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { TrelloApiError } from './types.js';

/**
 * Custom error class for Trello API HTTP errors.
 * This class standardizes errors originating from Trello API requests,
 * capturing the HTTP status code and any specific error details returned by the Trello API.
 */
export class TrelloHttpError extends Error {
  /**
   * The HTTP status code of the error response.
   * @type {number}
   */
  public readonly statusCode: number;
  /**
   * The detailed error object returned by the Trello API, if available.
   * @type {TrelloApiError | undefined}
   */
  public readonly trelloError?: TrelloApiError;

  /**
   * Creates an instance of TrelloHttpError.
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code.
   * @param {TrelloApiError} [trelloError] - The specific Trello API error details.
   */
  constructor(message: string, statusCode: number, trelloError?: TrelloApiError) {
    super(message);
    this.name = 'TrelloHttpError';
    this.statusCode = statusCode;
    this.trelloError = trelloError;
  }
}

/**
 * An HTTP client specifically configured for the Trello API.
 * It handles authentication, base URL, timeouts, and provides logging and error handling for all requests.
 */
export class TrelloHttpClient {
  private readonly axios: AxiosInstance;
  private readonly logger = logger.child({ component: 'TrelloHttpClient' });

  /**
   * Initializes a new instance of the TrelloHttpClient, setting up the axios instance and interceptors.
   */
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

  /**
   * Sets up request and response interceptors for the axios instance.
   * - The request interceptor logs outgoing requests (with redacted credentials).
   * - The response interceptor logs incoming responses and handles errors, transforming them into `TrelloHttpError`.
   * @private
   */
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

  /**
   * Performs a GET request.
   * @template T The expected response data type.
   * @param {string} url - The request URL path.
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.get<T>(url, config);
    return response.data;
  }

  /**
   * Performs a POST request.
   * @template T The expected response data type.
   * @param {string} url - The request URL path.
   * @param {any} [data] - The request body data.
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Performs a PUT request.
   * @template T The expected response data type.
   * @param {string} url - The request URL path.
   * @param {any} [data] - The request body data.
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Performs a DELETE request.
   * @template T The expected response data type.
   * @param {string} url - The request URL path.
   * @param {AxiosRequestConfig} [config] - Optional axios request configuration.
   * @returns {Promise<T>} A promise that resolves to the response data.
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axios.delete<T>(url, config);
    return response.data;
  }

  /**
   * Performs a batch request to the Trello API, allowing up to 10 GET requests in a single call.
   * @template T The expected response data type for each item in the batch.
   * @param {string[]} urls - An array of URL paths to include in the batch request.
   * @returns {Promise<T[]>} A promise that resolves to an array of response data.
   * @throws {Error} if the number of URLs exceeds 10.
   */
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

/**
 * A singleton instance of the `TrelloHttpClient`.
 * This instance is shared across the application to ensure consistent configuration and connection reuse.
 * @type {TrelloHttpClient}
 */
export const trelloHttp = new TrelloHttpClient();
