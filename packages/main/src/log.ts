import { format } from 'node:util';

import chalk from 'chalk';

import { events } from './events.ts';

type LogFunction = (...data: any[]) => void;

export enum LogLevel {
  silent = 0,
  error = 1,
  warn = 2,
  info = 3,
  debug = 4,
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

export function toErrorString(error: any): string | undefined {
  if (error?.name === 'AssertionError') return `Error: ${error.message}`;
  if (isLogLevel(LogLevel.debug) && error?.stack) return String(error.stack);

  return String(error);
}

export function initLog(): void {
  const { error, warn, log, debug } = console;

  Object.assign(console, {
    error: createLogFunction(LogLevel.error, chalk.red, error),
    warn: createLogFunction(LogLevel.warn, chalk.yellow, warn),
    info: createLogFunction(LogLevel.info, (message) => message, error),
    log: createLogFunction(LogLevel.info, (message) => message, log),
    debug: createLogFunction(LogLevel.debug, chalk.gray, debug),
  });

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const writeStdout = process.stdout.write;

  Object.assign(process.stdout, {
    write: function (this: typeof process.stdout, ...args: [any, ...any[]]) {
      emitBeforeLog('stdout');
      return writeStdout.call(this, ...args);
    },
  });

  // eslint-disable-next-line @typescript-eslint/unbound-method
  const writeStderr = process.stderr.write;

  Object.assign(process.stderr, {
    write: function (this: typeof process.stderr, ...args: [any, ...any[]]) {
      emitBeforeLog('stderr');
      return writeStderr.call(this, ...args);
    },
  });
}

function createLogFunction(
  level: LogLevel,
  decorate: (message: string) => string,
  write: LogFunction,
): LogFunction {
  return (...args) => {
    if (isLogLevel(level)) {
      emitBeforeLog(level);
      write(decorate(format(...args.map((arg) => arg instanceof Error ? toErrorString(arg) : arg))));
    }
  };
}

function emitBeforeLog(level: LogLevel | 'stdout' | 'stderr'): void {
  if ((emitBeforeLog as any).emitting) return;

  (emitBeforeLog as any).emitting = true;

  try {
    events.emit('beforeLog', level);
  }
  finally {
    (emitBeforeLog as any).emitting = false;
  }
}
