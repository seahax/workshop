import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Connect-style simple middleware function (2 arguments).
 */
export type SimpleMiddleware = (
  request: IncomingMessage,
  response: ServerResponse
) => void;

/**
 * Connect-style next middleware function (3 arguments).
 */
export type NextMiddleware = (
  request: IncomingMessage,
  response: ServerResponse,
  next: (error?: unknown) => void
) => void;

/**
 * Connect-style error middleware function (4 arguments).
 */
export type ErrorMiddleware = (
  error: unknown,
  request: IncomingMessage,
  response: ServerResponse,
  next: (error?: unknown) => void
) => void;
