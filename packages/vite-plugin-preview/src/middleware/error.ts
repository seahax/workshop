import fs from 'node:fs/promises';
import path from 'node:path';

import ansiHtml from 'ansi-html';
import { htmlEscape } from 'escape-goat';
import Negotiator from 'negotiator';
import { type Connect } from 'vite';

interface Config {
  readonly getError: () => Error | undefined;
}

const TEMPLATE_ERROR_HTML = await fs.readFile(path.resolve(import.meta.dirname, '../client/error.html'), 'utf8');

export default function middleware({ getError }: Config): Connect.NextHandleFunction {
  return (req, res, next) => {
    const error = getError();

    if (error) {
      const negotiator = new Negotiator(req);

      if (negotiator.mediaTypes(['text/html']).length > 0) {
        const message = ansiHtml(htmlEscape(error.message));
        const html = TEMPLATE_ERROR_HTML
          .replace(/(?=<\/body>)|$/iu, `<pre class="error"><code>${message}</code></pre>\n`);

        res.statusCode = 200;
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

    next();
  };
}
