import express, { Express, Request, Response, Router } from 'express';

import morgan from 'morgan';

import { logger } from './logger';
import { ErrorStatus, ErrorType } from './types';

const loggerMiddleware = morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
});

const errorMiddleware = (error: Error | { status: number; type: ErrorType; message?: string }, _req: Request, res: Response) => {
  let errorMessage = error.message;
  if (error instanceof Error) {
    res.status(ErrorStatus.SERVER_ERROR).json({ type: ErrorType.SERVER_ERROR });
    logger.error(`Error: ${error.message}`);
  } else {
    res.status(error.status).json({ type: error.type, ...(error.message && { message: error.message }) });
    errorMessage = JSON.stringify(error);
  }
  logger.error(`Error: ${errorMessage}`);
};

export const initMiddleware = (app: Express, router: Router, done: () => void) => {
  app.use(express.json());
  app.use(loggerMiddleware);
  app.use(router);
  app.use(errorMiddleware);

  done();
};
