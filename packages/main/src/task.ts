import createOra from 'ora';

import { AbortError } from './error.js';
import { events } from './events.js';

interface StackFrame {
  readonly update: () => void;
}

interface CounterState {
  readonly prefix: string;
  count: number;
  total: number | null;
  readonly suffix: string;
}

export interface TaskCounterOptions {
  readonly prefix?: string;
  readonly total?: number | null;
  readonly suffix?: string;
}

export interface TaskCounter {
  increment(value?: number): void;
  total(value: number | null): void;
}

export type TaskStatusString = 'succeed' | 'warn' | 'fail';
export type TaskStatus = TaskStatusString | boolean;
export interface TaskFailResult { status: 'fail'; value: undefined }
export interface TaskPassResult<T> { status: 'succeed' | 'warn'; value: T }
export type TaskResult<T> = TaskPassResult<T> | TaskFailResult;

export interface Task {
  counter(options?: TaskCounterOptions): TaskCounter;
  step<T>(text: string, callback: () => Promise<T>): Promise<T>;
  result(value: TaskStatus, detail?: string): void;
  detail(text: string): void;
}

export async function withOptionalTask<T>(text: string, callback: (task: Task) => Promise<T>): Promise<TaskResult<T>> {
  let status: TaskStatusString;
  let value: T;

  const [task, stop, abort] = start(text);

  try {
    value = await callback(task);
  }
  catch (error: any) {
    task.result('fail');

    if (error?.name === 'AbortError') {
      abort();
    }
    else {
      console.error(error);
    }

    return { status: 'fail', value: undefined };
  }
  finally {
    status = stop();
  }

  return status === 'fail'
    ? { status, value: undefined }
    : { status, value };
}

export async function withTask<T>(
  text: string,
  callback: (task: Task) => Promise<T>,
): Promise<TaskPassResult<T>> {
  const result = await withOptionalTask(text, callback);

  if (result.status === 'fail') {
    throw new AbortError('Task failed.');
  }

  return result;
}

function start(text: string): [task: Task, stop: () => TaskStatusString, abort: () => void] {
  let status: TaskStatusString = 'succeed';
  let aborted = false;
  let detail = '';

  const steps: string[] = [];
  const counters: CounterState[] = [];
  const previous = stack.at(-1);
  const frame: StackFrame = { update };

  stack.push(frame);

  const task: Task = {
    counter({ prefix = '', total = null, suffix = '' } = {}) {
      const state: CounterState = { prefix, count: 0, total, suffix };

      counters.push(state);
      update();

      return {
        increment(value = 1) {
          state.count += value;
          update();
        },
        total(value) {
          state.total = value;
          update();
        },
      };
    },
    async step(text, callback) {
      steps.push(text);
      update();

      const value = await callback();

      steps.pop();
      update();

      return value;
    },
    result(newStatus, newDetail) {
      if (newDetail != null) {
        detail = newDetail;
      }

      switch (newStatus) {
        case true: {
          status = 'succeed';
          break;
        }
        case false: {
          status = 'fail';
          break;
        }
        default: {
          status = newStatus;
          break;
        }
      }
    },
    detail(text) {
      detail = text;
    },
  };

  update();

  return [task, stop, abort];

  function update(): void {
    if (frame === stack.at(-1)) {
      const parts: string[] = [];
      const detail = steps.at(-1);
      const counterParts = counters.map((counter) => {
        const total = counter.total == null ? '' : `/${counter.total}`;

        return `${counter.prefix}${counter.count}${total}${counter.suffix}`;
      });

      if (detail) parts.push(detail);
      if (counterParts.length > 0) parts.push(`[${counterParts.join(', ')}]`);

      ora.text = text;
      ora.suffixText = parts.join(' ');

      if (!ora.isSpinning) ora.start();
    }
  };

  function stop(): TaskStatusString {
    if (detail) {
      ora.suffixText = ora.suffixText
        ? `${ora.suffixText} (${detail})`
        : `(${detail})`;
    }

    ora[aborted ? 'stop' : status]();
    stack.pop();
    previous?.update();

    return status;
  };

  function abort(): void {
    aborted = true;
  }
}

const stack: StackFrame[] = [];
const ora = createOra();

events.on('beforeLog', () => {
  // Make sure that the spinner doesn't interfere with regular logging.
  ora.clear();
});
