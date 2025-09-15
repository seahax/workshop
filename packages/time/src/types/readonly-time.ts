import { type Time } from './time.js';

/**
 * A subset of the Time interface which includes only getters. Used as a
 * lightweight intermediate type when changing and formatting times.
 */
export type ReadonlyTime = Pick<Time, Extract<keyof Time, `get${string}`> | 'toClock' | 'valueOf'>;
