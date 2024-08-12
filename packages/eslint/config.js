import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import react from 'eslint-plugin-react';
import regexp from 'eslint-plugin-regexp';
import importSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import typescript from 'typescript-eslint';

const JS_EXTENSIONS = ['js', 'jsx', 'cjs', 'mjs'];
const TS_EXTENSIONS = ['ts', 'tsx'];
const REACT_EXTENSIONS = ['jsx', 'tsx'];

const ALL_FILES = `**/*.{${[...JS_EXTENSIONS, ...TS_EXTENSIONS].join(',')}}`;
const TS_FILES = `**/*.{${TS_EXTENSIONS.join(',')}}`;
const REACT_FILES = `**/*.{${REACT_EXTENSIONS.join(',')}}`;
const TEST_FILES = `**/*.test.{${[...JS_EXTENSIONS, ...TS_EXTENSIONS].join(',')}}`;

/**
 * Type helper for flat configuration collections.
 *
 * @param  {...(ESLintConfig | ESLintConfigs)[]} configs
 * @returns {ESLintConfigs}
 */
const section = (...configs) => configs.flat();
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/** @type {ESLintConfigs} */
export default [
  {
    ignores: ['**/{node_modules,lib,dist,out,coverage}'],
  },

  // Base
  ...section(
    {
      files: [ALL_FILES],
      ...eslint.configs.recommended,
    },
    {
      files: [ALL_FILES],
      rules: {
        'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
        // Recommended++
        'no-implicit-coercion': 'warn',
        'no-useless-rename': 'warn',
        // Recommended--
        'no-empty': 'off',
        // Redundant (handled by typescript)
        'no-undef': 'off',
        'valid-typeof': 'off',
      },
    },
    // Testing
    {
      files: [TEST_FILES],
      rules: {
        // Test files tend to be longer than their source counterparts.
        'max-lines': 'off',
      },
    },
  ),

  // TypeScript
  ...section(
    ...typescript.configs.recommendedTypeChecked,
    ...typescript.configs.stylisticTypeChecked,
    ...typescript.configs.strictTypeChecked,
    {
      rules: {
        // Additions (not included in any shared configs)
        '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports' }],
        '@typescript-eslint/consistent-type-exports': ['warn', { fixMixedExportsWithInlineTypeSpecifier: true }],
        '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true, allowConciseArrowFunctionExpressionsStartingWithVoid: true }],
        '@typescript-eslint/switch-exhaustiveness-check': 'warn',
        // Stylistic--
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        // Recommended--
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/prefer-namespace-keyword': 'off',
        '@typescript-eslint/require-await': 'off',
        // Strict--
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/no-dynamic-delete': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true, allowNumber: true, allowBoolean: true, allowNullish: true }],
        // Deprecated (in typescript-eslint v8)
        '@typescript-eslint/ban-types': 'off',
      },
    },
  ).map((config) => ({ ...config, files: [TS_FILES] })),

  // React
  ...section(
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    {
      settings: {
        react: {
          version: '18',
        },
      },
    },
  ).map((config) => ({ ...config, files: [REACT_FILES] })),

  // React Hooks
  ...section(
    ...compat.config({ extends: ['plugin:react-hooks/recommended'] }),
  ).map((config) => ({ ...config, files: [REACT_FILES] })),

  // RegExp
  ...section(
    regexp.configs['flat/recommended'],
  ).map((config) => ({ ...config, files: [ALL_FILES] })),

  // Unicorn
  ...section(
    unicorn.configs['flat/recommended'],
    {
      rules: {
        // Recommended--
        'unicorn/no-array-reduce': 'off',
        'unicorn/no-null': 'off',
        'unicorn/no-object-as-default-parameter': 'off',
        'unicorn/no-useless-undefined': 'off',
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/prevent-abbreviations': 'off',
      },
    },
  ).map((config) => ({ ...config, files: [ALL_FILES] })),

  // Import
  ...section(
    ...compat.plugins('import'),
    {
      rules: {
        'import/extensions': ['error', { ignorePackages: true, pattern: { js: 'always' } }],
        'import/no-cycle': 'error',
        'import/no-extraneous-dependencies': ['error', { devDependencies: ['!**/src/**/*'] }],
        'import/no-self-import': 'error',
      },
    },
    {
      files: ['**/*.test.*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ).map((config) => ({ ...config, files: [ALL_FILES] })),

  // Import Sort
  ...section(
    {
      plugins: { 'import-sort': importSort },
      rules: {
        'import-sort/exports': 'warn',
        'import-sort/imports': 'warn',
      },
    },
  ).map((config) => ({ ...config, files: [ALL_FILES] })),

  // Stylistic
  ...section(
    stylistic.configs.customize({ indent: 2, quoteProps: 'as-needed', arrowParens: true, semi: true }),
  ).map((config) => ({ ...config, files: [ALL_FILES] })),

  // XXX: Required for the typescript plugin.
  {
    languageOptions: {
      parserOptions: {
        // Detect relative typescript config instead of setting the `project`
        // option. Required when using typescript project references.
        EXPERIMENTAL_useProjectService: true,
        // Future name of the above experimental option (v8 beta, v9).
        projectService: true,
      },
    },
  },

  // XXX: Required for the import plugin.
  {
    languageOptions: {
      // All source local packages and source files should be using ESM.
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    settings: {
      'import/parsers': {
        espree: ['.js'],
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        node: true,
        typescript: true,
      },
    },
  },
];
