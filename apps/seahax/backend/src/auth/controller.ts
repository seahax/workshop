import { type Controller, createController } from '@seahax/espresso';
import { lazy } from '@seahax/lazy';
import z from 'zod';

import { getAuthService } from './service.ts';

export const getAuthController = lazy((key): Controller => {
  const auth = getAuthService(key);
  const controller = createController('/auth');

  // Get a JWT token given a refresh token or an email+password.
  controller.addRoute('POST', '/token', async (request, response) => {
    const cookies = await request.cookies($PostTokenCookies);
    const body = await request.body($PostTokenBody);
    const result = body.type === 'refresh'
      ? await auth.refresh({ token: cookies.refreshToken })
      : await auth.login({ email: body.email, password: body.password });

    if (!result) {
      await response.sendJson({ error: 'Invalid Credentials' }, { status: 401 });
      return;
    };

    const { user, accessToken, refreshToken } = result;

    await response
      .setHeader('Cache-Control', 'no-store')
      .appendHeader(
        'set-cookie',
        `refreshToken=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=${request.path}`,
      )
      .sendJson({ user, accessToken });
  });

  // Change a user's password given a valid current password.
  controller.addRoute('POST', '/password', async (request, response) => {
    const { email, password, newPassword } = await request.body($PostPasswordBody);
    const success = await auth.updatePassword({ email, password, newPassword });

    if (!success) {
      await response.sendJson({ error: 'Invalid Credentials' }, { status: 401 });
      return;
    }

    await response.send();
  });

  return controller;
});

const $PostTokenCookies = z.object({
  refreshToken: z.string().min(1).max(100).optional(),
});

const $PostTokenBody = z.union([
  z.object({
    type: z.literal('login'),
    email: z.string(),
    password: z.string(),
  }),
  z.object({
    type: z.literal('refresh'),
  }),
]);

const $PostPasswordBody = z.object({
  email: z.string(),
  password: z.string(),
  newPassword: z.string(),
});
