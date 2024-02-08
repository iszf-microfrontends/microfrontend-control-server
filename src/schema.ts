import Joi from 'joi';

import { type BackendService, type ConnectedMicrofrontend, type Microfrontend } from './types';

export const ConnectedMicrofrontendSchema = Joi.object<ConnectedMicrofrontend>({
  name: Joi.string().required(),
  url: Joi.string().required(),
  contentComponent: Joi.string().required(),
  backendName: Joi.string().required(),
});

export const MicrofrontendSchema = ConnectedMicrofrontendSchema.append<Microfrontend>({
  id: Joi.string().required(),
  isActive: Joi.boolean().required(),
});

export const MicrofrontendListSchema = Joi.array<Microfrontend[]>().items(MicrofrontendSchema);

export const BackendServiceSchema = Joi.object<BackendService>({
  name: Joi.string().required(),
  'status-code': Joi.number().required(),
});

export const BackendServiceListSchema = Joi.array<BackendService[]>()
  .items(BackendServiceSchema)
  .options({ allowUnknown: true });
