import path from 'path';

export const { PORT = 3000, GET_BACKEND_SERVICES_URL = '' } = process.env;
export const LOGS_PATH = path.resolve(__dirname, '../logs/combined.log');
export const ACTIVITY_CHECK_DELAY = 10000;
