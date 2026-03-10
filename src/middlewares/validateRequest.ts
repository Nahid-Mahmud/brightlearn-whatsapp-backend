import type { NextFunction, Request, Response } from 'express';
import { ZodObject, type ZodRawShape } from 'zod';

export const validateRequest =
  (ZodSchema: ZodObject<ZodRawShape>) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.body && req.body.data) {
        req.body = JSON.parse(req.body.data);
      }

      // Wrap the request properties to match schema structure
      const validatedData = await ZodSchema.parseAsync({
        body: req.body || {},
        query: req.query,
        params: req.params,
      });

      // Update request with validated data
      req.body = validatedData.body;
      next();
    } catch (error) {
      next(error);
    }
  };
