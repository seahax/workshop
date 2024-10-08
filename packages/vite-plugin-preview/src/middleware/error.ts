import ansiHtml from 'ansi-html';
import { htmlEscape } from 'escape-goat';
import Negotiator from 'negotiator';
import { type Connect } from 'vite';

import TEMPLATE_ERROR_HTML from '../template/error.html?raw';

interface Config {
  readonly getError: () => Error | undefined;
}

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
