export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  ALREADY_CONNECTED = 'already_connected',
  UNKNOWN_BACKEND = 'unknown_backend',
  SERVER_ERROR = 'server_error',
}

export enum ErrorStatus {
  BAD_REQUEST = 400,
  SERVER_ERROR = 500,
}

export type MicrofrontendDto = {
  name: string;
  url: string;
  component: string;
  backendName: string;
};

export type ConnectedMicrofrontendDto = Omit<MicrofrontendDto, 'backendName'> & {
  isActive: boolean;
};

export type BackendServiceDto = {
  name: string;
  'status-code': number;
};
