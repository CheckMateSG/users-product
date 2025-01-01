import axios, { AxiosInstance } from "axios"
import { BaseHttpClient } from "../../../src/clients/http/base"
import { HttpClientConfig } from "../../../src/clients/http/types"
//import { HttpError } from "../../../src/clients/http/types"

// Mock the logger
jest.mock("../../../src/config/logger", () => ({
  createServiceLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}))

// Mock axios
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}))

describe("BaseHttpClient", () => {
  let client: BaseHttpClient
  let axiosInstance: jest.Mocked<AxiosInstance>

  beforeEach(() => {
    jest.clearAllMocks()
    client = new BaseHttpClient()
    axiosInstance = (client as any).client
  })

  describe("Constructor", () => {
    it("should initialize with default config", () => {
      expect((client as any).retryConfig).toEqual({
        retries: 3,
        retryDelay: 1000,
        retryCondition: expect.any(Function),
      })
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
        })
      )
    })

    it("should initialize with custom config", () => {
      const config: HttpClientConfig = {
        retries: 5,
        retryDelay: 2000,
        timeout: 5000,
        baseURL: "https://api.example.com",
      }
      const customClient = new BaseHttpClient(config)
      expect((customClient as any).retryConfig.retries).toBe(5)
      expect((customClient as any).retryConfig.retryDelay).toBe(2000)
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
          baseURL: "https://api.example.com",
        })
      )
    })
  })

  describe("HTTP Methods", () => {
    const mockResponse = {
      data: { message: "success" },
      status: 200,
      headers: { "content-type": "application/json" },
    }

    it("should make successful GET request", async () => {
      axiosInstance.get.mockResolvedValueOnce(mockResponse)
      const response = await client.get("/test")
      expect(axiosInstance.get).toHaveBeenCalledWith("/test", undefined)
      expect(response).toEqual(mockResponse)
    })

    it("should make successful POST request", async () => {
      const postData = { key: "value" }
      axiosInstance.post.mockResolvedValueOnce(mockResponse)
      const response = await client.post("/test", postData)
      expect(axiosInstance.post).toHaveBeenCalledWith(
        "/test",
        postData,
        undefined
      )
      expect(response).toEqual(mockResponse)
    })

    it("should make successful PUT request", async () => {
      const putData = { key: "value" }
      axiosInstance.put.mockResolvedValueOnce(mockResponse)
      const response = await client.put("/test", putData)
      expect(axiosInstance.put).toHaveBeenCalledWith(
        "/test",
        putData,
        undefined
      )
      expect(response).toEqual(mockResponse)
    })

    it("should make successful DELETE request", async () => {
      axiosInstance.delete.mockResolvedValueOnce(mockResponse)
      const response = await client.delete("/test")
      expect(axiosInstance.delete).toHaveBeenCalledWith("/test", undefined)
      expect(response).toEqual(mockResponse)
    })
  })

  describe("Interceptors", () => {
    it("should add request interceptor", () => {
      const interceptor = (config: any) => config
      client.addRequestInterceptor(interceptor)
      expect(axiosInstance.interceptors.request.use).toHaveBeenCalledWith(
        interceptor
      )
    })

    it("should add response interceptor", () => {
      const successInterceptor = (response: any) => response
      const errorInterceptor = (error: any) => Promise.reject(error)

      client.addResponseInterceptor(successInterceptor, errorInterceptor)
      expect(axiosInstance.interceptors.response.use).toHaveBeenCalledWith(
        successInterceptor,
        errorInterceptor
      )
    })
  })

  describe("Header Sanitization", () => {
    it("should sanitize sensitive headers", () => {
      const headers = {
        authorization: "Bearer token",
        "content-type": "application/json",
        "x-api-key": "secret-key",
        cookie: "session=123",
        "custom-header": "value",
      }

      const sanitized = (client as any).sanitizeHeaders(headers)

      expect(sanitized).toEqual({
        "content-type": "application/json",
        "custom-header": "value",
        authorization: "[REDACTED]",
        "x-api-key": "[REDACTED]",
        cookie: "[REDACTED]",
      })
    })
  })
})
