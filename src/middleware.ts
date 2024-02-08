import express, { type NextFunction, type Express, type Request, type Response, type Router } from 'express';
import { type ObjectSchema } from 'joi';
import morgan from 'morgan';

import { ApiError, BadRequestError } from './api-error';
import { logger } from './logger';
import { ErrorStatus, ErrorType } from './types';
import { getErrorMessage } from './utils';

export const validationMiddleware =
  (schema: ObjectSchema) => (request: Request, _response: Response, next: NextFunction) => {
    const { error } = schema.validate(request.body);
    if (error) {
      return next(new BadRequestError(ErrorType.VALIDATION_ERROR, error.message));
    }
    next();
  };

const loggerMiddleware = morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
});

const errorMiddleware = async (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): Promise<void> => {
  const errorMessage = getErrorMessage(error);
  if (error instanceof ApiError) {
    response.status(Number(error.status)).json({ type: error.type, ...(errorMessage && { message: errorMessage }) });
  } else {
    response.status(ErrorStatus.SERVER_ERROR).json({ type: ErrorType.SERVER_ERROR });
  }
  logger.error(`Error middleware: ${errorMessage}`);
};

export const initMiddleware = (app: Express, router: Router, done: () => void): void => {
  app.use(express.json());
  app.use(loggerMiddleware);
  app.use('/api', router);
  app.use(errorMiddleware);

  done();
};
