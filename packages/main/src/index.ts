/* eslint-disable unicorn/no-process-exit */
import { format } from 'node:util';

import chalk from 'chalk';
import sourceMapSupport from 'source-map-support';

type ErrorMatcher<TError> = ((error: unknown) => error is TError) | ((error: unknown) => boolean);

interface ErrorConditions<TError> {
  readonly name?: string | RegExp;
  readonly code?: string | RegExp;
  readonly type?: new (...args: any[]) => TError;
  readonly match?: ErrorMatcher<TError>;
}

export enum LogLevel {
  silent = 0,
  error = 1,
  warn = 2,
  info = 3,
  debug = 4,
}

type LogFunction = (...data: any[]) => void;

interface ErrorHandlerEntry {
  readonly conditions: ErrorConditions<any>;
  readonly handle: (error: any) => void;
}

const errorHandlers = new Set<ErrorHandlerEntry>();
const beforeLogHandlers = new Set<() => void>();

export function main(action: () => void | Promise<void>): void {
  void action();
}

export function isLogLevel(requiredLevel: LogLevel): boolean {
  return requiredLevel <= getLogLevel();
}

export function getLogLevel(): LogLevel {
  switch (process.env.LOG_LEVEL) {
    case 'silent': {
      return LogLevel.silent;
    }
    case 'error': {
      return LogLevel.error;
    }
    case 'warn': {
      return LogLevel.warn;
    }
    case 'info': {
      return LogLevel.info;
    }
    case 'debug': {
      return LogLevel.debug;
    }
    default: {
      return LogLevel.info;
    }
  }
}

export function setLogLevel(level: LogLevel): void {
  process.env.LOG_LEVEL = LogLevel[level];
}

export function registerErrorHandler<TError>(
  conditions: ErrorConditions<TError> | ErrorMatcher<TError>,
  handle: (error: TError) => void,
): () => void {
  const entry = {
    conditions: typeof conditions === 'function' ? { match: conditions } : conditions,
    handle,
  };

  errorHandlers.add(entry);

  return () => {
    errorHandlers.delete(entry);
  };
}

export function registerBeforeLogHandler(handler: () => void): () => void {
  const entry = (): void => handler();

  beforeLogHandlers.add(entry);

  return () => {
    beforeLogHandlers.delete(entry);
  };
}

function defaultErrorHandler(error: any): void {
  if (error?.name === 'AbortError') return;

  console.error(isLogLevel(LogLevel.debug) ? error : String(error));
}

function uncaught(reason: any): void {
  const handler = [...errorHandlers].find(({ conditions }) =>
    (conditions.name != null && reason?.name === conditions.name)
    || (conditions.code != null && reason?.code === conditions.code)
    || (conditions.type && reason instanceof conditions.type)
    || conditions.match?.(reason),
  );

  const handle = handler?.handle ?? defaultErrorHandler;

  handle(reason);

  process.exitCode ||= typeof reason?.exitCode === 'number' ? reason.exitCode : 1;
  process.exit();
}

function createLogFunction(
  level: LogLevel,
  decorate: (message: string) => string,
  write: LogFunction,
): LogFunction {
  return (...data) => {
    if (isLogLevel(level)) {
      beforeLogHandlers.forEach((handler) => handler());
      write(decorate(format(...data)));
    }
  };
}

const { error, warn, info, log, debug } = console;

Object.assign(console, {
  error: createLogFunction(LogLevel.error, chalk.red, error),
  warn: createLogFunction(LogLevel.warn, chalk.yellow, warn),
  info: createLogFunction(LogLevel.info, (message) => message, info),
  log: createLogFunction(LogLevel.info, (message) => message, log),
  debug: createLogFunction(LogLevel.debug, chalk.gray, debug),
});

process.on('uncaughtException', uncaught);
process.on('unhandledRejection', uncaught);
sourceMapSupport.install();
