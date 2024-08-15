import { type Connect } from 'vite';

const PING_ACCEPT_HEADER = 'text/x-vite-ping';

export default function middleware(): Connect.NextHandleFunction {
  return (req, res, next) => {
    if (req.headers.accept === PING_ACCEPT_HEADER) {
      res.statusCode = 204;
      res.end();
      return;
    }

    next();
  };
}
