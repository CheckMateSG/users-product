// ./functions/src/services/userServices.ts

import { User } from "../models/types/users"
import { UsersRepository } from "../models/users.repository"
import { ServiceResponse, createServiceResponse } from "./types/service-response"
import { ServiceErrorCode } from "./types/service-errors"
import { createServiceLogger } from "../config/logger"
import { firestore } from "../models/firestore/firestore"

const logger = createServiceLogger("UserService")
const repository = new UsersRepository(firestore)
const serviceResponse = createServiceResponse(logger)

export async function findById(id: string): Promise<ServiceResponse<User | null>> {
  const context = { method: "findById", id }
  logger.debug(context, "Finding user by ID")
  try {
    const user = await repository.findById(id)
    return serviceResponse.success(user || null, context)
  } catch (error) {
    return serviceResponse.fromError(
      ServiceErrorCode.INTERNAL_ERROR,
      "Error finding user",
      error,
      context
    )
  }
}

export async function findByWhatsappId(whatsappId: string): Promise<ServiceResponse<User | null>> {
  const context = { method: "findByWhatsappId", whatsappId }
  logger.debug(context, "Finding user by WhatsApp ID")
  try {
    const user = await repository.findByWhatsappId(whatsappId)
    return serviceResponse.success(user || null, context)
  } catch (error) {
    return serviceResponse.fromError(
      ServiceErrorCode.INTERNAL_ERROR,
      "Error finding user by WhatsApp ID",
      error,
      context
    )
  }
}

export async function findByTelegramId(telegramId: string): Promise<ServiceResponse<User | null>> {
  const context = { method: "findByTelegramId", telegramId }
  logger.debug(context, "Finding user by Telegram ID")
  try {
    const user = await repository.findByTelegramId(telegramId)
    return serviceResponse.success(user || null, context)
  } catch (error) {
    return serviceResponse.fromError(
      ServiceErrorCode.INTERNAL_ERROR,
      "Error finding user by Telegram ID",
      error,
      context
    )
  }
}

export async function findByEmailId(emailId: string): Promise<ServiceResponse<User | null>> {
  const context = { method: "findByEmailId", emailId }
  logger.debug(context, "Finding user by Email ID")
  try {
    const user = await repository.findByEmailId(emailId)
    return serviceResponse.success(user || null, context)
  } catch (error) {
    return serviceResponse.fromError(
      ServiceErrorCode.INTERNAL_ERROR,
      "Error finding user by Email ID",
      error,
      context
    )
  }
}

export async function createUser(userData: Omit<User, "id">): Promise<ServiceResponse<User>> {
  const context = { method: "createUser", userData }
  logger.debug(context, "Creating new user")
  try {
    const user = await repository.create(userData)
    return serviceResponse.success(user, context)
  } catch (error) {
    return serviceResponse.fromError(
      ServiceErrorCode.INTERNAL_ERROR,
      "Error creating user",
      error,
      context
    )
  }
}

export async function incrementSubmissionCount(
  userId: string,
  increment: number = 1
): Promise<ServiceResponse<void>> {
  const context = { method: "incrementSubmissionCount", userId, increment }
  logger.debug(context, "Incrementing submission count")
  try {
    await repository.incrementSubmissionCount(userId, increment)
    return serviceResponse.success(undefined, context)
  } catch (error) {
    return serviceResponse.fromError(
      ServiceErrorCode.INTERNAL_ERROR,
      "Error incrementing submission count",
      error,
      context
    )
  }
}

export async function incrementReferralCount(
  userId: string,
  increment: number = 1
): Promise<ServiceResponse<void>> {
  const context = { method: "incrementReferralCount", userId, increment }
  logger.debug(context, "Incrementing referral count")
  try {
    await repository.incrementReferralCount(userId, increment)
    return serviceResponse.success(undefined, context)
  } catch (error) {
    return serviceResponse.fromError(
      ServiceErrorCode.INTERNAL_ERROR,
      "Error incrementing referral count",
      error,
      context
    )
  }
}
