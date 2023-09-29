import { createLogger, format, transports } from 'winston';

import { LOGS_PATH } from './config';

export const logger = createLogger({
  level: 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.File({ filename: LOGS_PATH })],
});
