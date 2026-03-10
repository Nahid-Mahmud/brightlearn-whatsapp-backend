import { ZodError } from 'zod';
import type {
  TErrorSources,
  TGenericErrorResponse,
} from '../interfaces/error.types';

export const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSources[] = [];
  const errorDetails = err.issues;
  // console.log("Zod Error Details:", errorDetails);
  errorDetails.forEach((issue) => {
    errorSources.push({
      path: issue.path.join('.'),
      message: issue.message,
    });
  });

  return {
    statusCode: 400,
    message: `Validation Error: ${err.issues.map((issue) => issue.path + ':' + issue.message).join(', ')}`,
    errorSources,
  };
};
