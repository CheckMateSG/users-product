// functions/src/clients/http/base.ts

import axios, { AxiosInstance, AxiosError } from "axios"
import axiosRetry from "axios-retry"
import { createServiceLogger } from "../../config/logger"
import {
  HttpClientConfig,
  HttpResponse,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from "./types"

const logger = createServiceLogger("HttpClient")

export class BaseHttpClient {
  protected readonly client: AxiosInstance

  constructor(config: HttpClientConfig = {}) {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 10000,
      ...axiosConfig
    } = config

    this.client = axios.create({
      timeout,
      ...axiosConfig,
    })

    // Configure axios-retry
    axiosRetry(this.client, {
      retries,
      retryDelay: (retryCount) => {
        const delay = retryDelay * Math.pow(2, retryCount - 1)
        return delay
      },
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx server errors
        return (
          !error.response ||
          (error.response.status >= 500 && error.response.status <= 599)
        )
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(
          {
            url: config.url,
            method: config.method,
            headers: this.sanitizeHeaders(config.headers || {}),
            timeout: config.timeout,
          },
          "Outgoing request"
        )
        return config
      },
      (error) => {
        logger.error({ error }, "Request configuration error")
        return Promise.reject(error)
      }
    )

    // Response logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(
          {
            url: response.config.url,
            method: response.config.method,
            status: response.status,
          },
          "Received response"
        )
        return response
      },
      async (error: AxiosError) => {
        const { response, config } = error
        const status = response?.status
        const url = config?.url

        logger.error(
          {
            url,
            method: config?.method,
            status,
            error: this.formatError(error),
          },
          "Request failed"
        )

        throw error
      }
    )
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers }
    // Remove sensitive headers
    const sensitiveHeaders = ["authorization", "cookie", "x-api-key"]
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = "[REDACTED]"
      }
    })
    return sanitized
  }

  private formatError(error: AxiosError): Record<string, any> {
    return {
      message: error.message,
      code: error.code,
      status: error.response?.status,
    }
  }

  // Helper methods for making requests
  async get<T = any>(
    url: string,
    config?: HttpClientConfig
  ): Promise<HttpResponse<T>> {
    return this.client.get(url, config)
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: HttpClientConfig
  ): Promise<HttpResponse<T>> {
    return this.client.post(url, data, config)
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: HttpClientConfig
  ): Promise<HttpResponse<T>> {
    return this.client.put(url, data, config)
  }

  async delete<T = any>(
    url: string,
    config?: HttpClientConfig
  ): Promise<HttpResponse<T>> {
    return this.client.delete(url, config)
  }

  // Add custom interceptors
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.client.interceptors.request.use(interceptor)
  }

  addResponseInterceptor(
    onFulfilled: ResponseInterceptor,
    onRejected?: ErrorInterceptor
  ): void {
    this.client.interceptors.response.use(onFulfilled, onRejected)
  }
}
