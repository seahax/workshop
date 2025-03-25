import { initExpressRouter } from '@seahax/ts-rest/express';
import { healthRouterSpec } from 'app-seahax-api';

export const healthRouter = initExpressRouter(healthRouterSpec, {
  health: async () => {
    return { status: 200, body: undefined };
  },
});
