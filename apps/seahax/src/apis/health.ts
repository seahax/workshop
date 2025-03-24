import { empty, initApi } from './api.ts';

export const healthApi = initApi({
  health: {
    summary: 'Health check.',
    method: 'GET',
    path: '/health',
    responses: {
      200: empty,
      500: empty,
    },
  },
}, {
  strictStatusCodes: true,
});
