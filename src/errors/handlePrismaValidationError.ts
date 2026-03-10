import { PrismaClientValidationError } from '@prisma/client/runtime/client';
import { StatusCodes } from 'http-status-codes';

interface ErrorResponse {
  statusCode: number;
  message: string;
  errorDetails: {
    type: string;
    details: string;
  };
}

export const handlePrismaValidationError = (
  err: PrismaClientValidationError
): ErrorResponse => {
  return {
    statusCode: StatusCodes.BAD_REQUEST,
    message: `Invalid data provided. Please check your input and try again.`,
    errorDetails: {
      type: 'ValidationError',
      details: err.message,
    },
  };
};
