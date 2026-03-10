import { PrismaClientRustPanicError } from '@prisma/client/runtime/client';
import { StatusCodes } from 'http-status-codes';
import type { TGenericErrorResponse } from '../interfaces/error.types';

export const handlePrismaRustPanicError = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _err: PrismaClientRustPanicError
): TGenericErrorResponse => {
  return {
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: `Critical database engine error occurred. Please contact support.`,
    errorSources: [
      {
        path: '',
        message: 'Prisma Client Rust Panic Error',
      },
    ],
  };
};
