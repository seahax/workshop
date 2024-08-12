import path from 'node:path';

import { type Connect } from 'vite';

import TEMPLATE_CLIENT_SCRIPT from '../template/client.js?raw';

interface Config {
  readonly base: string;
}

export const CLIENT_SCRIPT_NAME = '/@seahax/vite-plugin-build-preview/client.js';

export default function middleware({ base }: Config): Connect.NextHandleFunction {
  const clientRoute = path.posix.join(base, CLIENT_SCRIPT_NAME);
  const clientScript = TEMPLATE_CLIENT_SCRIPT.replace(/(?<=const base *= *)'\/'/u, JSON.stringify(base));
  const clientScriptLength = Buffer.byteLength(clientScript, 'utf8');

  return (req, res, next) => {
    if (req.url === clientRoute) {
      res.setHeader('Content-Type', 'text/javascript');
      res.setHeader('Content-Length', clientScriptLength);
      res.end(clientScript);
      return;
    }

    next();
  };
}
