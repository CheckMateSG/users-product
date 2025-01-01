// functions\src\services\types\service-response.ts

import { ServiceErrorCode } from "./service-errors"
import { logError } from "../../config/logger"
import type { Logger } from "pino"

export interface ServiceError {
  code: ServiceErrorCode
  message: string
  details?: unknown
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: ServiceError
}

export function createServiceResponse(logger: Logger) {
  return {
    success<T>(data: T, context?: Record<string, unknown>): ServiceResponse<T> {
      logger.info({ data, context }, "Operation successful")
      return {
        success: true,
        data,
      }
    },

    error<T>(
      error: ServiceError,
      context?: Record<string, unknown>
    ): ServiceResponse<T> {
      logError(logger, new Error(error.message), {
        code: error.code,
        details: error.details,
        context,
      })
      return {
        success: false,
        error,
      }
    },

    fromError<T>(
      code: ServiceErrorCode,
      message: string,
      details?: unknown,
      context?: Record<string, unknown>
    ): ServiceResponse<T> {
      return this.error(
        {
          code,
          message,
          details,
        },
        context
      )
    },
  }
}
