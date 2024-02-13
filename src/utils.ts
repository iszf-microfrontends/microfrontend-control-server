import { type Request, type Response, type NextFunction } from 'express';

import { GET_BACKEND_SERVICES_URL } from './config';
import { BackendServiceListSchema } from './schema';
import { type BackendService } from './types';

export const isErrorWithMessage = (error: unknown): error is { message: string } =>
  typeof error === 'object' &&
  error !== null &&
  'message' in error &&
  typeof (error as Record<string, unknown>).message === 'string';

export const getErrorMessage = (error: unknown): string => {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return JSON.stringify(error);
};

export const asyncHandler =
  (fn: (request: Request, response: Response, next: NextFunction) => void) =>
  async (request: Request, response: Response, next: NextFunction): Promise<void> =>
    Promise.resolve(fn(request, response, next)).catch(next);

export const getBackendServices = async (): Promise<BackendService[]> => {
  try {
    const response = await fetch(GET_BACKEND_SERVICES_URL);
    const data = (await response.json()) as { services: BackendService[] };
    const { error: validationError } = BackendServiceListSchema.validate(data.services);
    if (validationError) {
      throw validationError;
    }
    return data.services;
  } catch (error) {
    throw new Error(`Failed to get backend services: ${getErrorMessage(error)}`);
  }
};

export const asyncLoop = (asyncCallback: () => Promise<void>, delay: number): void => {
  setTimeout(async function loopFn(): Promise<void> {
    await asyncCallback();
    setTimeout(loopFn, delay);
  }, delay);
};
