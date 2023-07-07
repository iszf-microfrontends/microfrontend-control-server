import express, { NextFunction, Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import Joi, { ObjectSchema } from 'joi';
import fetch from 'cross-fetch';

dotenv.config();

const PORT = process.env.PORT ?? 3000;
const BACKEND_SERVICES_URL = process.env.BACKEND_SERVICES_URL ?? '';

enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  MICROFRONTEND_NOT_FOUND = 'microfrontend_not_found',
  MICROFRONTEND_ALREADY_STARTED = 'microfrontend_already_started',
  BACKEND_SERVICE_NOT_FOUND = 'backend_service_not_found',
  SERVER_ERROR = 'server_error',
  FAILED_GET_BACKEND_SERVICES = 'failed_get_backend_services',
}

enum ErrorStatus {
  BAD_REQUEST = 400,
  SERVER_ERROR = 500,
}

type MicrofrontendDto = {
  name: string;
  url: string;
  scope: string;
  component: string;
  backendName: string;
};

type StartedMicrofrontendDto = Omit<MicrofrontendDto, 'backendName'> & {
  isActive: boolean;
};

type BackendServiceDto = {
  name: string;
  'status-code': number;
};

const MicrofrontendDtoSchema = Joi.object<MicrofrontendDto>({
  name: Joi.string().required(),
  url: Joi.string().required(),
  scope: Joi.string().required(),
  component: Joi.string().required(),
  backendName: Joi.string().required(),
});

const app = express();
const logger = pinoHttp({ transport: { target: 'pino-pretty' } });

const router = Router();
const microfrontendsRouter = Router();

const startedMicrofrontends: StartedMicrofrontendDto[] = [];

microfrontendsRouter.get('/all', (_req, res) => {
  res.status(200).json(startedMicrofrontends);
});

microfrontendsRouter.post('/start', validationMiddleware(MicrofrontendDtoSchema), async (req, res) => {
  const data = req.body as MicrofrontendDto;
  const existingMicrofrontend = startedMicrofrontends.find((mf) => mf.url === data.url);
  if (existingMicrofrontend) {
    throw { status: ErrorStatus.BAD_REQUEST, type: ErrorType.MICROFRONTEND_ALREADY_STARTED };
  }

  let isActive = false;

  if (data.backendName !== 'test') {
    const backendServices = await getBackendServices();
    const existingBackendService = backendServices.find((service) => service.name === data.backendName);
    if (!existingBackendService) {
      throw { status: ErrorStatus.BAD_REQUEST, type: ErrorType.BACKEND_SERVICE_NOT_FOUND };
    }

    isActive = existingBackendService['status-code'] === 200;
  }

  const startedMicrofrontend: StartedMicrofrontendDto = {
    name: data.name,
    url: data.url,
    scope: data.scope,
    component: data.component,
    isActive,
  };
  startedMicrofrontends.push(startedMicrofrontend);
  res.status(200).json({ success: true });
});

microfrontendsRouter.get('/close', (req, res) => {
  const name = req.query.name;
  const closedMicrofrontendIndex = startedMicrofrontends.findIndex((mf) => mf.name === name);
  if (closedMicrofrontendIndex === -1) {
    throw { status: ErrorStatus.BAD_REQUEST, type: ErrorType.MICROFRONTEND_NOT_FOUND };
  }
  startedMicrofrontends.splice(closedMicrofrontendIndex, 1);
  res.status(200).json({ success: true });
});

router.use('/microfrontends', microfrontendsRouter);

app.use(logger);
app.use(express.json());

app.use('/api/v1', router);

app.use(errorMiddleware);

const bootstrap = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Microfrontend control server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start Microfrontend control server: ${error}`);
  }
};

bootstrap();

function errorMiddleware(
  error: Error | { status: number; type: ErrorType; message?: string },
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof Error) {
    res.status(ErrorStatus.SERVER_ERROR).json({ type: ErrorType.SERVER_ERROR });
  } else {
    res.status(error.status).json({ type: error.type, ...(error.message && { message: error.message }) });
  }
  req.log.error(`Error Middleware: ${JSON.stringify(error)}`);
}

function validationMiddleware(schema: ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return next({ status: ErrorStatus.BAD_REQUEST, type: ErrorType.VALIDATION_ERROR, message: error.details[0].message });
    }
    next();
  };
}

async function getBackendServices() {
  try {
    const response = await fetch(`${BACKEND_SERVICES_URL}/services`);
    const data = (await response.json()) as { services: BackendServiceDto[] };
    return data.services;
  } catch (error) {
    throw { status: ErrorStatus.SERVER_ERROR, type: ErrorType.FAILED_GET_BACKEND_SERVICES };
  }
}
