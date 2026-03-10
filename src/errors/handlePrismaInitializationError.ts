import { PrismaClientInitializationError } from '@prisma/client/runtime/client';
import { StatusCodes } from 'http-status-codes';
import type { TGenericErrorResponse } from '../interfaces/error.types';

export const handlePrismaInitializationError = (
  err: PrismaClientInitializationError
): TGenericErrorResponse => {
  return {
    statusCode: StatusCodes.SERVICE_UNAVAILABLE,
    message: `Database connection failed. Please try again later.`,
    errorSources: [
      {
        path: '',
        message: `Database connection failed. Error: ${err.errorCode || 'Unknown'}`,
      },
    ],
  };
};
