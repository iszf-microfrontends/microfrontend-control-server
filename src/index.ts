import crypto from 'crypto';

import express, { Router } from 'express';

import { BadRequestError } from './api-error';
import { ACTIVITY_CHECK_DELAY, PORT } from './config';
import { logger } from './logger';
import { initMiddleware, validationMiddleware } from './middleware';
import { ConnectedMicrofrontendSchema } from './schema';
import { ErrorType, type Microfrontend, type ConnectedMicrofrontend } from './types';
import { getErrorMessage, getBackendServices, asyncLoop, asyncHandler } from './utils';

const app = express();
const router = Router();
const microfrontendManager = createMicrofrontendManager();

const microfrontends: Microfrontend[] = [];

router.get('/microfrontends', (_request, response) => {
  response.status(200).json(microfrontends);
});

router.post(
  '/microfrontends',
  validationMiddleware(ConnectedMicrofrontendSchema),
  asyncHandler(async (request, response) => {
    const data = request.body as ConnectedMicrofrontend;
    const existingMicrofrontend = microfrontends.find(
      (microfrontend) => microfrontend.url === data.url,
    );
    if (existingMicrofrontend) {
      throw new BadRequestError(ErrorType.ALREADY_CONNECTED);
    }

    const backendServices = await getBackendServices();
    const existingBackendService = backendServices.find(
      (service) => service.name === data.backendName,
    );
    if (!existingBackendService) {
      throw new BadRequestError(ErrorType.UNKNOWN_BACKEND);
    }

    microfrontends.push({
      ...data,
      id: crypto.createHash('md5').update(data.name).digest('hex'),
      backendName: existingBackendService.name,
      isActive: existingBackendService['status-code'] === 200,
    });

    response.status(200).json({ success: true });
  }),
);

const bootstrap = async (): Promise<void> => {
  try {
    // eslint-disable-next-line no-console
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    microfrontendManager.watch();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to start server on port ${PORT}: ${getErrorMessage(error)}`);
  }
};

initMiddleware(app, router, bootstrap);

function createMicrofrontendManager(): {
  watch: () => void;
} {
  const checkActivity = async (): Promise<void> => {
    for (let idx = 0; idx < microfrontends.length; idx += 1) {
      const microfrontend = microfrontends[idx];
      try {
        // eslint-disable-next-line no-await-in-loop
        await fetch(microfrontend.url);
      } catch (error) {
        microfrontends.splice(idx, 1);
        idx -= 1;
        logger.info(`Microfrontend ${microfrontend.url} not responding: ${getErrorMessage(error)}`);
      }
    }

    if (!microfrontends.length) {
      return;
    }

    try {
      const backendServices = await getBackendServices();
      for (let idx = 0; idx < microfrontends.length; idx += 1) {
        const microfrontend = microfrontends[idx];
        const backendService = backendServices.find(
          (service) => service.name === microfrontend.backendName,
        );
        microfrontend.isActive = backendService?.['status-code'] === 200;
      }
    } catch (error) {
      logger.error(`Failed to check microfrontends activity: ${getErrorMessage(error)}`);
    }
  };

  return {
    watch: () => asyncLoop(checkActivity, ACTIVITY_CHECK_DELAY),
  };
}
