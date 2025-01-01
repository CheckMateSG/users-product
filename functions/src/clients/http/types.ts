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
