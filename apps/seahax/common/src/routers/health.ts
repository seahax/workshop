import { $Empty, initRouterSpec } from '@seahax/ts-rest';

export const healthRouterSpec = initRouterSpec({
  health: {
    summary: 'Health check.',
    method: 'GET',
    path: '/health',
    responses: {
      200: $Empty,
    },
  },
}, {
  commonResponses: {
    500: $Empty,
  },
  strictStatusCodes: true,
});
