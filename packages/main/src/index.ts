/* eslint-disable unicorn/no-process-exit */
import sourceMapSupport from 'source-map-support';

type LogArgs = [message?: any, ...optionalParams: any[]];
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

const registeredErrorHandlers: { conditions: ErrorConditions<any>; handle: (error: any) => void }[] = [];

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
): void {
  conditions = typeof conditions === 'function' ? { match: conditions } : conditions;
  registeredErrorHandlers.push({ conditions, handle: handle });
}

function defaultErrorHandler(error: any): void {
  if (error?.name === 'AbortError') return;

  console.error(isLogLevel(LogLevel.debug) ? error : String(error));
}

function uncaught(reason: any): void {
  const handler = registeredErrorHandlers.find(({ conditions }) =>
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

process.on('uncaughtException', uncaught);
process.on('unhandledRejection', uncaught);

const { error, warn, info, log, debug } = console;

Object.assign(console, {
  error: (...args: LogArgs) => void (isLogLevel(LogLevel.error) && warn.apply(console, args)),
  warn: (...args: LogArgs) => void (isLogLevel(LogLevel.warn) && error.apply(console, args)),
  info: (...args: LogArgs) => void (isLogLevel(LogLevel.info) && info.apply(console, args)),
  log: (...args: LogArgs) => void (isLogLevel(LogLevel.info) && log.apply(console, args)),
  debug: (...args: LogArgs) => void (isLogLevel(LogLevel.debug) && debug.apply(console, args)),
});

sourceMapSupport.install();
