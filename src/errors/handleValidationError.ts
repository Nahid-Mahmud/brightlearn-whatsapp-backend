import { Prisma } from '@prisma/client';
import type { TGenericErrorResponse } from '../interfaces/error.types';

export const handleValidationError = (
  error: Prisma.PrismaClientValidationError
): TGenericErrorResponse => {
  const errorSources = [
    {
      path: '',
      message: error.message,
    },
  ];
  const statusCode = 400;
  return {
    statusCode,
    message: 'Validation Error',
    errorSources,
  };
};
