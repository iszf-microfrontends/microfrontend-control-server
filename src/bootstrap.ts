import express, { NextFunction, Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import Joi, { ObjectSchema } from 'joi';

dotenv.config();

enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  MICROFRONTEND_NOT_FOUND = 'microfrontend_not_found',
  MICROFRONTEND_ALREADY_STARTED = 'microfrontend_already_started',
  SERVER_ERROR = 'server_error',
}

enum ErrorStatus {
  BAD_REQUEST = 400,
  SERVER_ERROR = 500,
}

type MicrofrontendDto = {
  name: string;
  url: string;
  component: string;
};

const MicrofrontendDtoSchema = Joi.object<MicrofrontendDto>({
  name: Joi.string().required(),
  url: Joi.string().required(),
  component: Joi.string().required(),
});

const app = express();
const port = process.env.PORT ?? 3000;
const logger = pinoHttp({ transport: { target: 'pino-pretty' } });

const router = Router();
const microfrontendsRouter = Router();

const startedMicrofrontends: MicrofrontendDto[] = [];

microfrontendsRouter.get('/all', (_req, res) => {
  res.status(200).json(startedMicrofrontends);
});

microfrontendsRouter.post('/start', validateRequest(MicrofrontendDtoSchema), (req, res) => {
  const data = req.body as MicrofrontendDto;
  const existingMicrofrontend = startedMicrofrontends.find((mf) => mf.url === data.url);
  if (existingMicrofrontend) {
    throw { status: ErrorStatus.BAD_REQUEST, type: ErrorType.MICROFRONTEND_ALREADY_STARTED };
  }
  startedMicrofrontends.push(data);
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
    app.listen(port, () => {
      console.log(`Microfrontend control server listening on port ${port}`);
    });
  } catch (error) {
    console.error(`Failed to start Microfrontend control server: ${error}`);
  }
};

bootstrap();

function errorMiddleware(
  error: Error | { status: number; type: ErrorType; message?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof Error) {
    res.status(ErrorStatus.SERVER_ERROR).json({ type: ErrorType.SERVER_ERROR });
  } else {
    res.status(error.status).json({ type: error.type, ...(error.message && { message: error.message }) });
  }
}

function validateRequest(schema: ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return next({ status: ErrorStatus.BAD_REQUEST, type: ErrorType.VALIDATION_ERROR, message: error.details[0].message });
    }
    next();
  };
}
