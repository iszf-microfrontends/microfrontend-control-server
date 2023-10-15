import express, { type NextFunction, type Express, type Request, type Response, type Router } from 'express';
import morgan from 'morgan';

import { ApiError } from './api-error';
import { logger } from './logger';
import { ErrorStatus, ErrorType } from './types';

const loggerMiddleware = morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
});

const errorMiddleware = async (
  error: Error | { status: number; type: ErrorType; message?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
): Promise<void> => {
  let errorMessage = error.message;
  if (error instanceof ApiError) {
    res.status(error.status).json({ type: error.type, ...(error.message && { message: error.message }) });
    errorMessage = JSON.stringify(error);
  } else {
    res.status(ErrorStatus.SERVER_ERROR).json({ type: ErrorType.SERVER_ERROR });
    errorMessage = error.message;
  }
  logger.error(`Error: ${errorMessage}`);
};

export const initMiddleware = (app: Express, router: Router, done: () => void): void => {
  app.use(express.json());
  app.use(loggerMiddleware);
  app.use('/api', router);
  app.use(errorMiddleware);

  done();
};
