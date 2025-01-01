// functions/src/clients/http/types.ts

import {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios"

export interface HttpClientConfig extends AxiosRequestConfig {
  retries?: number
  retryDelay?: number
  timeout?: number
}

export class HttpError extends Error {
  public status?: number
  public code?: string
  public response?: any
  public config?: any

  constructor(message: string) {
    super(message)
    // Restore prototype chain; otherwise, instanceof checks may fail.
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}

export interface RetryConfig {
  retries: number
  retryDelay: number
  retryCondition: (error: AxiosError) => boolean
}

export type RequestInterceptor = (
  config: AxiosRequestConfig
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>
export type ResponseInterceptor = (
  response: AxiosResponse
) => AxiosResponse | Promise<AxiosResponse>
export type ErrorInterceptor = (error: AxiosError) => Promise<never>

export interface HttpResponse<T = any> {
  data: T
  status: number
  headers: Record<string, string>
}
