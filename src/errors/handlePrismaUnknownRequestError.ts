import { PrismaClientUnknownRequestError } from '@prisma/client/runtime/client';
import { StatusCodes } from 'http-status-codes';
import type { TGenericErrorResponse } from '../interfaces/error.types';

export const handlePrismaUnknownRequestError = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _err: PrismaClientUnknownRequestError
): TGenericErrorResponse => {
  return {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: `An unexpected database error occurred. Please try again or contact support.`,
    errorSources: [
      {
        path: '',
        message: 'Prisma Client Unknown Request Error',
      },
    ],
  };
};
