import { initExpressRouter } from '@seahax/ts-rest/express';
import { authRouterSpec } from 'app-seahax-api';
import type { Router } from 'express';
import type { Mongoose } from 'mongoose';

interface Config {
  db: Mongoose;
}

export const createAuthRouter = ({ db }: Config): Router => {
  void db;

  return initExpressRouter(authRouterSpec, {
    login: async ({ body }) => {
      void body;
      return { status: 200, body: { accessToken: '', refreshToken: '' } };
    },
    refresh: async ({ body }) => {
      void body;
      return { status: 200, body: { accessToken: '', refreshToken: '' } };
    },
  });
};
