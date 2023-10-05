import { ErrorStatus, type ErrorType } from './types';

export class ApiError {
  constructor(public status: ErrorStatus, public type: ErrorType, public message?: string) {}
}

const createApiError = (status: ErrorStatus): new (type: ErrorType, message?: string) => ApiError =>
  class extends ApiError {
    constructor(type: ErrorType, message?: string) {
      super(status, type, message);
    }
  };

export const BadRequestError = createApiError(ErrorStatus.BAD_REQUEST);
export const ServerError = createApiError(ErrorStatus.SERVER_ERROR);
