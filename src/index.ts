import express, { Router, type NextFunction, type Request, type Response } from 'express';
import Joi, { type ObjectSchema } from 'joi';

import { BadRequestError } from './api-error';
import { GET_BACKEND_SERVICES_URL, PORT, CHECK_HEALTH_INTERVAL } from './config';
import { logger } from './logger';
import { initMiddleware } from './middleware';
import { ErrorType, type BackendServiceDto, type ConnectedMicrofrontendDto, type MicrofrontendDto } from './types';

const app = express();
const router = Router();

const microfrontends: ConnectedMicrofrontendDto[] = [];

router.get('/microfrontends', (_req, res) => {
  res.status(200).json(microfrontends);
});

const validateSchema = (schema: ObjectSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return next(new BadRequestError(ErrorType.VALIDATION_ERROR, error.details[0].message));
  }
  next();
};

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => void) => async (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

const getBackendServices = async (): Promise<BackendServiceDto[]> => {
  try {
    const response = await fetch(GET_BACKEND_SERVICES_URL);
    const data = (await response.json()) as { services: BackendServiceDto[] };
    return data.services;
  } catch (error) {
    throw new Error('Failed to get backend services');
  }
};

const createServicesHealthChecker = (delay: number): (() => void) => {
  let interval: NodeJS.Timeout | null = null;

  const checkMicrofrontends = async (): Promise<void> => {
    for (let i = 0; i < microfrontends.length; i++) {
      const microfrontend = microfrontends[i];
      try {
        await fetch(microfrontend.url);
      } catch {
        logger.info(`Microfrontend not responding: ${microfrontend.url}`);
        microfrontends.splice(i, 1);
      }
    }
  };

  const checkBackendServices = async (): Promise<void> => {
    const backendServices = await getBackendServices();
    for (let i = 0; i < microfrontends.length; i++) {
      const microfrontend = microfrontends[i];
      microfrontend.isActive = backendServices.find((bs) => bs.name === microfrontend.backendName)?.['status-code'] === 200;
    }
  };

  return () => {
    if (!interval) {
      interval = setInterval(async () => {
        await checkMicrofrontends();
        await checkBackendServices();
      }, delay);
      if (microfrontends.length === 0 && interval) {
        clearInterval(interval);
      }
    }
  };
};

const MicrofrontendSchema = Joi.object<MicrofrontendDto>({
  name: Joi.string().required(),
  url: Joi.string().required(),
  component: Joi.string().required(),
  backendName: Joi.string().required(),
});

const checkServicesHealth = createServicesHealthChecker(CHECK_HEALTH_INTERVAL);

router.post(
  '/microfrontends',
  validateSchema(MicrofrontendSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as MicrofrontendDto;
    const existingMicrofrontend = microfrontends.find((mf) => mf.url === data.url);
    if (existingMicrofrontend) {
      throw new BadRequestError(ErrorType.ALREADY_CONNECTED);
    }

    const backendServices = await getBackendServices();
    const existingBackendService = backendServices.find((service) => service.name === data.backendName);
    if (!existingBackendService) {
      throw new BadRequestError(ErrorType.UNKNOWN_BACKEND);
    }

    microfrontends.push({
      name: data.name,
      url: data.url,
      component: data.component,
      isActive: existingBackendService['status-code'] === 200,
      backendName: existingBackendService.name,
    });

    checkServicesHealth();

    res.status(200).json({ success: true });
  }),
);

const bootstrap = (): void => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${PORT}`);
  }
};

initMiddleware(app, router, bootstrap);
