import path from 'node:path';

import ansiHtml from 'ansi-html';
import { htmlEscape } from 'escape-goat';
import { type Connect } from 'vite';

import TEMPLATE_CLIENT_SCRIPT from './template/client.js?raw';
import TEMPLATE_ERROR_HTML from './template/error.html?raw';

interface Options {
  readonly base: string;
  readonly reload: boolean;
  readonly getError: () => Error | undefined;
}

const CLIENT_SCRIPT_NAME = '/@seahax/vite-plugin-build-preview/client.js';
const PING_ACCEPT_HEADER = 'text/x-vite-ping';

/**
 * Middleware that injects the client script into HTML responses.
 */
export default function middleware({ base, reload, getError }: Options): Connect.NextHandleFunction {
  const clientSrc = JSON.stringify(path.posix.join(base, CLIENT_SCRIPT_NAME));
  const clientScript = TEMPLATE_CLIENT_SCRIPT.replace(/(?<=const base *= *)'\/'/u, JSON.stringify(base));
  const clientScriptLength = Buffer.byteLength(clientScript, 'utf8');
  const clientRoute = path.posix.join(base, CLIENT_SCRIPT_NAME);

  return (req, res, next) => {
    //
    // Respond to pings.
    //
    if (req.headers.accept === PING_ACCEPT_HEADER) {
      res.statusCode = 204;
      res.end();
      return;
    }

    //
    // Serve the client script.
    //
    if (req.url === clientRoute) {
      res.setHeader('Content-Type', 'text/javascript');
      res.setHeader('Content-Length', clientScriptLength);
      res.end(clientScript);
      return;
    }

    const error = getError();

    //
    // Respond when there are build errors.
    //
    if (error) {
      if (req.headers.accept?.includes('html')) {
        const message = ansiHtml(htmlEscape(error.message));
        const html = TEMPLATE_ERROR_HTML
          .replace(/(?=<\/head>)|$/iu, `<script crossorigin="" src=${clientSrc}></script>\n`)
          .replace(/(?=<\/body>)|$/iu, `<pre class="error"><code>${message}</code></pre>\n`);

        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', Buffer.byteLength(html, 'utf8'));
        res.end(html);
      }
      else {
        res.statusCode = 500;
        res.end();
      }

      return;
    }

    //
    // Inject the client script into HTML responses.
    //
    if (req.headers.accept?.includes('html') && reload) {
      // XXX: Disable compression so we can intercept the response body.
      // Vite using compression seems to be undocumented, but it's there
      // in the source.
      req.headers['accept-encoding'] = 'identity';

      let hooked = true;
      let restoreHead: (() => void) | undefined;

      const chunks: Buffer[] = [];

      const writeHead = res.writeHead.bind(res);
      const write = res.write.bind(res);
      const end = res.end.bind(res);

      const push = (chunk: unknown, ...args: any[]): boolean => {
        const encoding = args.find((arg) => typeof arg === 'string');
        const callback = args.find((arg) => typeof arg === 'function');

        if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk, encoding as BufferEncoding | undefined));
          callback?.();
          return true;
        }

        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
          callback?.();
          return true;
        }

        return false;
      };

      const restore: (() => void) | undefined = () => {
        if (!hooked) return;

        hooked = false;

        let content: string | Buffer | undefined;

        if (chunks.length > 0) {
          const buffer = Buffer.concat(chunks);

          chunks.length = 0;

          const text = buffer.toString('utf8');
          const injectIndex = text.search(/<\/(?:head|body|html)>/iu);

          if (injectIndex >= 0) {
            content = text.slice(0, injectIndex);
            content += `<script src=${clientSrc}></script>\n`;
            content += text.slice(injectIndex);
            res.setHeader('Content-Length', Buffer.byteLength(content, 'utf8'));
          }
          else {
            content = buffer;
          }
        }

        restoreHead?.();
        restoreHead = undefined;

        if (content) res.write(content);
      };

      res.writeHead = (...args: [any]) => {
        if (!hooked) return writeHead(...args);

        restoreHead = () => res.writeHead(...args);

        return res;
      };

      res.write = (chunk: unknown, ...args: any[]) => {
        if (!hooked) return write(chunk, ...args);
        if (push(chunk, ...args)) return true;

        // If pushing fails, it means that the chunk type wasn't
        // supported. Restore the original response. This will also
        // commit any chunks that were already pushed.
        restore();

        return res.write(chunk, ...args);
      };

      res.end = (...args: any[]) => {
        if (!hooked) return end(...args);

        if (args[0] != null && typeof args[0] !== 'function') {
          res.write(...args as [any?]);
        }

        // The response is finished. Restore the original response if it
        // is not already restored.
        restore();
        res.end();

        return res;
      };

      return next();
    }

    next();
  };
}
