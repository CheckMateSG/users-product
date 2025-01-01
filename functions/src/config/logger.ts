// functions\src\config\logger.ts
import pino from "pino"

const isDevelopment = process.env.NODE_ENV === "development"

// Base logger with environment-specific configuration
const logger = pino({
  timestamp: () => `,"time":"${new Date().toLocaleString()}"`,
  level: isDevelopment ? "debug" : "info",
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  serializers: {
    sender: (value) => {
      // Mask all but the last 4 digits
      if (typeof value === "string" || typeof value === "number") {
        const str = value.toString()
        return str.slice(-4).padStart(str.length, "*")
      }
      return value // Return as is if not a string or number
    },
  },
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined,
})

// Add environment tag to all logs
const envLogger = logger.child({
  environment: process.env.NODE_ENV,
})

// Create loggers for different handlers
export const createHttpLogger = (handlerName: string) =>
  envLogger.child({
    handler: handlerName,
    type: "http",
  })

export const createTriggerLogger = (handlerName: string) =>
  envLogger.child({
    handler: handlerName,
    type: "trigger",
  })

export const createPubSubLogger = (handlerName: string) =>
  envLogger.child({
    handler: handlerName,
    type: "pubsub",
  })

export const createServiceLogger = (serviceName: string) =>
  envLogger.child({
    service: serviceName,
    component: "service",
  })

export const createRepositoryLogger = (serviceName: string) =>
  envLogger.child({
    service: serviceName,
    component: "service",
  })

// Error logging utility
export const logError = (
  logger: pino.Logger,
  error: Error,
  context?: Record<string, any>
) => {
  logger.error(
    {
      err: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(error as any),
      },
      ...context,
    },
    "An error occurred"
  )
}
