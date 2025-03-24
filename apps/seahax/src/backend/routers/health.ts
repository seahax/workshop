import { healthApi } from '../../apis/health.ts';
import { initExpressRouter } from './router.ts';

export const healthRouter = initExpressRouter(healthApi, {
  health: async () => {
    return { status: 200, body: undefined };
  },
});
