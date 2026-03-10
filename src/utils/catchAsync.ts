import { type NextFunction, type Request, type Response } from 'express';

type asyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const catchAsync =
  (fn: asyncHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Async Error Handler:', error);
      next(error);
    });
  };
