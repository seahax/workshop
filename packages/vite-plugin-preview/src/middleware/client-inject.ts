import { type OutgoingHttpHeader, type OutgoingHttpHeaders } from 'node:http';
import path from 'node:path';
import { type Transform } from 'node:stream';

import Negotiator from 'negotiator';
import replace from 'stream-replace-string';
import { type Connect } from 'vite';

import { CLIENT_SCRIPT_NAME } from './client-route.ts';

interface Config {
  readonly base: string;
}

export default function middleware({ base }: Config): Connect.NextHandleFunction {
  const clientRoute = path.posix.join(base, CLIENT_SCRIPT_NAME);
  const clientScript = `<script src=${JSON.stringify(clientRoute)}></script>`;

  return (req, res, next) => {
    const negotiator = new Negotiator(req);

    if (negotiator.mediaTypes(['text/html']).length === 0) {
      // The client script can only be injected into HTML responses.
      return;
    }

    // XXX: Disable compression to allow response stream reading/injection.
    // When automatic reloading is enabled, a script must be injected into HTML
    // responses to handle client-side websocket communication.
    //
    // It's not well documented, but the Vite preview server uses the
    // "@polka/compression" middleware for response compression. Compression
    // should be unnecessary for this plugin's use case.
    req.headers['accept-encoding'] = 'identity';

    const original = {
      writeHead: res.writeHead.bind(res),
      write: res.write.bind(res),
      end: res.end.bind(res),
    };

    let isHeadWritten = false;
    let replaceStream: Transform | undefined | false;

    const start = (): void => {
      if (replaceStream != null) return;

      if (res.getHeader('Content-Type')?.toString().includes('text/html')) {
        replaceStream = replace('</head>', `${clientScript}\n</head>`);

        replaceStream.on('data', function (this: Transform, chunk: any) {
          if (!original.write(chunk)) {
            this.pause();
            res.once('drain', () => this.resume());
          }
        }.bind(replaceStream));

        replaceStream.on('error', (error) => {
          res.emit('error', error);
        });

        replaceStream.once('end', () => {
          original.end();
        });
      }
      else {
        replaceStream = false;
      }
    };

    res.writeHead = (
      status,
      ...args:
        | [headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]]
        | [statusMessage?: string, headers?: OutgoingHttpHeaders | OutgoingHttpHeader[]]
    ) => {
      if (isHeadWritten) {
        throw new Error('Response writeHead can only be called once.');
      }

      isHeadWritten = true;

      const headers = args.find((arg): arg is OutgoingHttpHeaders | OutgoingHttpHeader[] => typeof arg === 'object');
      const headersArray = Array.isArray(headers)
        ? headers
        : (headers
            ? Object.entries(headers).flat()
            : []);

      for (let i = 0; i < headersArray.length; i += 2) {
        const key = headersArray[i] as string;
        const value = headersArray[i + 1];

        if (value !== undefined) {
          res.setHeader(key, value);
        }
      }

      original.writeHead(status, typeof args[1] === 'string' ? args[1] : undefined);

      return res;
    };

    res.write = (
      ...args:
        | [chunk: any, cb?: (error?: Error | null) => void]
        | [chunk: any, encoding: BufferEncoding, cb?: (error?: Error | null) => void]
    ) => {
      start();

      if (!replaceStream) {
        return original.write(...args as Parameters<typeof res.write>);
      }

      return replaceStream.write(...args as Parameters<typeof res.write>);
    };

    res.end = (
      ...args:
        | [cb?: () => void]
        | [chunk: any, cb?: () => void]
        | [chunk: any, encoding?: BufferEncoding, cb?: () => void]
    ) => {
      start();

      if (!replaceStream) {
        return original.end(...args);
      }

      replaceStream.end(...args);

      return res;
    };

    next();
  };
}
