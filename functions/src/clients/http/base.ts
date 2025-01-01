// functions/src/clients/http/base.ts

import axios, { AxiosInstance, AxiosError } from "axios"
import { createServiceLogger } from "../../config/logger"
import {
  HttpClientConfig,
  HttpError,
  HttpResponse,
  RetryConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
} from "./types"

const logger = createServiceLogger("HttpClient")

export class BaseHttpClient {
  protected readonly client: AxiosInstance
  private readonly retryConfig: RetryConfig

  constructor(config: HttpClientConfig = {}) {
    const {
      retries = 3,
      retryDelay = 1000,
      timeout = 10000,
      ...axiosConfig
    } = config

    this.retryConfig = {
      retries,
      retryDelay,
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx server errors
        return (
          !error.response ||
          (error.response.status >= 500 && error.response.status <= 599)
        )
      },
    }

    this.client = axios.create({
      timeout,
      ...axiosConfig,
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
        console.log("success")
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
        console.log("error")
        return this.handleRequestError(error)
      }
    )
  }

  private async handleRequestError(
    error: AxiosError,
    retryCount = 0
  ): Promise<never> {
    const { response, config } = error
    const status = response?.status
    const url = config?.url

    // Log the error
    logger.error(
      {
        url,
        method: config?.method,
        status,
        error: this.formatError(error),
      },
      "Request failed"
    )

    // Check if we should retry
    const errorConfig = error.config
    if (
      retryCount < this.retryConfig.retries &&
      errorConfig && // Check if config exists on error
      this.retryConfig.retryCondition(error)
    ) {
      const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount)
      logger.debug(
        { url, retryCount: retryCount + 1, delay },
        "Retrying failed request"
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
      try {
        return await this.client.request(errorConfig)
      } catch (retryError) {
        return this.handleRequestError(retryError as AxiosError, retryCount + 1)
      }
    }

    // Convert to HttpError and throw
    const httpError: HttpError = new HttpError(error.message)
    httpError.status = status
    httpError.code = error.code
    httpError.response = response
    httpError.config = config

    throw httpError
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
      data: error.response?.data,
      headers: this.sanitizeHeaders(error.response?.headers || {}),
    }
  }

  // Helper methods for making requests
  async get<T = any>(
    url: string,
    config?: HttpClientConfig
  ): Promise<HttpResponse<T>> {
    const response = await this.client.get<T>(url, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: HttpClientConfig
  ): Promise<HttpResponse<T>> {
    const response = await this.client.post<T>(url, data, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: HttpClientConfig
  ): Promise<HttpResponse<T>> {
    const response = await this.client.put<T>(url, data, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
  }

  async delete<T = any>(
    url: string,
    config?: HttpClientConfig
  ): Promise<HttpResponse<T>> {
    const response = await this.client.delete<T>(url, config)
    return {
      data: response.data,
      status: response.status,
      headers: response.headers as Record<string, string>,
    }
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
