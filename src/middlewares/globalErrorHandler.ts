import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import envVariables from '../config/env';
import { TErrorSources } from '../interfaces/error.types';
import { handleValidationError } from '../errors/handleValidationError';
import { handleZodError } from '../errors/handleZodError';
import { handleClientError } from '../errors/handleClientError';
import { handlePrismaInitializationError } from '../errors/handlePrismaInitializationError';
import { handlePrismaRustPanicError } from '../errors/handlePrismaRustPanicError';
import { handlePrismaUnknownRequestError } from '../errors/handlePrismaUnknownRequestError';
import ApiError from '../errors/ApiError';
import AppError from '../errors/AppError';

const globalErrorHandler = (
  error: Error & { statusCode?: number; name?: string },
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  if (envVariables.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log('Global Error Handler:', error);
    // console.log(error);
  }

  let statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = error.message || 'Something went wrong!';
  let errorSources: TErrorSources[] = [];

  // Handle Prisma Client Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }

  // Handle Zod Validation Errors
  else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }

  // Handle Prisma Client Known Request Errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handleClientError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }

  // Handle Custom ApiError
  else if (error instanceof ApiError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorSources = error?.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  }

  // Handle Custom AppError
  else if (error instanceof AppError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorSources = error?.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  }

  // Handle Prisma Client Initialization Error
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    const simplifiedError = handlePrismaInitializationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }

  // Handle Prisma Client Rust Panic Error
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    const simplifiedError = handlePrismaRustPanicError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }

  // Handle Prisma Client Unknown Request Error
  else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    const simplifiedError = handlePrismaUnknownRequestError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }

  // Handle JWT Errors
  else if (error.name === 'JsonWebTokenError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Invalid token. Please log in again!';
    errorSources = [
      {
        path: '',
        message: 'Invalid token',
      },
    ];
  } else if (error.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = 'Your token has expired! Please log in again.';
    errorSources = [
      {
        path: '',
        message: 'Token expired',
      },
    ];
  }

  // Handle Generic JavaScript Errors
  else if (error instanceof SyntaxError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Syntax error in the request. Please verify your input.';
    errorSources = [
      {
        path: '',
        message: 'Syntax Error',
      },
    ];
  } else if (error instanceof TypeError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Type error in the application. Please verify your input.';
    errorSources = [
      {
        path: '',
        message: 'Type Error',
      },
    ];
  } else if (error instanceof ReferenceError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Reference error in the application. Please verify your input.';
    errorSources = [
      {
        path: '',
        message: 'Reference Error',
      },
    ];
  }

  // Handle General Errors
  else if (error instanceof Error) {
    message = error?.message;
    errorSources = error?.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  }

  // Catch any other error type
  else {
    message = 'An unexpected error occurred!';
    errorSources = [
      {
        path: '',
        message: 'An unexpected error occurred!',
      },
    ];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    error: error,
    ...(envVariables.NODE_ENV !== 'production' && {
      stack: error?.stack,
    }),
  });
};

export default globalErrorHandler;
