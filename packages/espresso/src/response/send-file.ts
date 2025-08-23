import type { Stats } from 'node:fs';
import fs from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import path from 'node:path';

import etag from 'etag';
import mime from 'mime';

import type { CompressionProvider } from './compression.ts';
import { HEADER_CONTENT_LENGTH, HEADER_CONTENT_TYPE, HEADER_ETAG, HEADER_LAST_MODIFIED } from './constants.ts';
import { isModified } from './is-modified.ts';
import type { SendFileOptions } from './options.ts';
import { send } from './send.ts';
import { sendJson } from './send-json.ts';

/**
 * Send a file from the local file system as a streamed response body.
 */
export async function sendFile(
  response: ServerResponse,
  compressionProvider: CompressionProvider | undefined,
  root: string,
  filename: string,
  { onNotFound, useCacheControl = true, ...options }: SendFileOptions = {},
): Promise<void> {
  const normalFilename = path.normalize(filename);

  // Prevent directory traversal attacks by ensuring the filename does not
  // contain any path traversal sequences.
  if (normalFilename.startsWith('..')) {
    await sendJson(response, compressionProvider, { error: 'Forbidden' }, { status: 403 });
    return;
  }

  const absoluteFilename = path.resolve(path.join(root, normalFilename));
  const stats = await getFileStats(absoluteFilename);

  if (!stats?.isFile()) {
    if (typeof onNotFound === 'string') {
      return await sendFile(response, compressionProvider, root, onNotFound, options);
    }

    await onNotFound?.(response, root, filename);

    if (response.headersSent) {
      return;
    }

    await sendJson(response, compressionProvider, { error: 'Not Found' }, { status: 404 });
    return;
  }

  if (!response.hasHeader(HEADER_CONTENT_TYPE)) {
    response.setHeader(HEADER_CONTENT_TYPE, mime.getType(absoluteFilename) || 'application/octet-stream');
  }

  if (stats.size > 0) {
    response.setHeader(HEADER_CONTENT_LENGTH, stats.size.toString(10));
  }

  const etagValue = etag(stats);
  const modified = isModified(response.req.headers, etagValue, stats.mtime);

  if (!response.hasHeader(HEADER_LAST_MODIFIED)) {
    response.setHeader(HEADER_LAST_MODIFIED, stats.mtime.toUTCString());
  }

  if (!response.hasHeader(HEADER_ETAG)) {
    response.setHeader(HEADER_ETAG, etagValue);
  }

  const headers = typeof options.headers === 'function' ? options.headers(filename) : options.headers;

  if (!modified && useCacheControl) {
    await send(response, compressionProvider, null, { status: 304, ...options, headers });
    return;
  }

  const handle = await fs.open(absoluteFilename, fs.constants.O_RDONLY);
  const readable = handle.createReadStream();

  return await send(response, compressionProvider, readable, { ...options, headers });
}

async function getFileStats(filename: string): Promise<Stats | undefined> {
  try {
    return await fs.stat(filename);
  }
  catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
}
