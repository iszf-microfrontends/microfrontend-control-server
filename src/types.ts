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

export type ConnectedMicrofrontend = {
  name: string;
  url: string;
  contentComponent: string;
  backendName: string;
};

export type Microfrontend = ConnectedMicrofrontend & {
  id: string;
  isActive: boolean;
};

export type BackendService = {
  name: string;
  'status-code': number;
};
