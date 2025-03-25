import { initRouterSchema, NoBody } from '@seahax/ts-rest';

export const healthRouterSpec = initRouterSchema({
  health: {
    summary: 'Health check.',
    method: 'GET',
    path: '/health',
    responses: {
      200: NoBody,
    },
  },
}, {
  commonResponses: {
    500: NoBody,
  },
  strictStatusCodes: true,
});
