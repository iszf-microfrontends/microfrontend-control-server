import path from 'path';

export const PORT = process.env.PORT ?? 3000;
export const GET_BACKEND_SERVICES_URL = process.env.GET_BACKEND_SERVICES_URL ?? '';
export const LOGS_PATH = path.resolve(__dirname, '../logs/combined.log');
export const ACTIVITY_CHECK_DELAY = 10000;
