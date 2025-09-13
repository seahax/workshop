/**
 * @typedef {import('eslint').Linter.Config} Config
 * @typedef {import('./define-config').ConfigArrayNested} ConfigArrayNested
 */

/**
 * Helper for defining ESLint configurations with proper types and support for
 * nested arrays of configs.
 *
 * @param {ConfigArrayNested} configs ESLint configurations, possibly nested.
 * @returns {Config[]} Flattened array of ESLint configurations.
 */
export function defineConfig(...configs) {
  return configs.flatMap((value) => flatMapRecursive(value));
}

/**
 * @param {ConfigArrayNested | Config} value
 * @returns {Config[] | Config}
 */
function flatMapRecursive(value) {
  return Array.isArray(value) ? value.flatMap((item) => flatMapRecursive(item)) : value;
}
