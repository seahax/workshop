import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import progress from '@seahax/eslint-progress';
import stylistic from '@stylistic/eslint-plugin';
import react from 'eslint-plugin-react';
import regexp from 'eslint-plugin-regexp';
import importSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import typescript from 'typescript-eslint';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  // Bases
  progress(),
  eslint.configs.recommended,
  stylistic.configs.customize({ indent: 2, quoteProps: 'as-needed', arrowParens: true, semi: true }),
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  ...compat.config({ extends: ['plugin:react-hooks/recommended'] }),
  regexp.configs['flat/recommended'],
  ...compat.plugins('import'),
  { plugins: { 'import-sort': importSort } },
  unicorn.configs['flat/recommended'],
  ...[
    ...typescript.configs.recommendedTypeChecked,
    ...typescript.configs.stylisticTypeChecked,
    ...typescript.configs.strictTypeChecked,
  ].map((config) => ({ ...config, files: [...config.files ?? [], '**/*.{ts,tsx}'] })),

  // Settings
  {
    languageOptions: {
      // All source local packages and source files should be using ESM.
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: {
        // Detect relative typescript config instead of setting the `project`
        // option. Required when using typescript project references.
        EXPERIMENTAL_useProjectService: true,
        // Future name of the above experimental option (v8 beta, v9).
        projectService: true,
      },
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
      react: {
        version: '18',
      },
    },
  },

  { // Rules: General
    rules: {
      'import-sort/exports': 'warn',
      'import-sort/imports': 'warn',
      'import/extensions': ['error', { ignorePackages: true, pattern: { js: 'always' } }],
      'import/no-cycle': 'error',
      'import/no-extraneous-dependencies': ['error', { devDependencies: false }],
      'import/no-self-import': 'error',
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      'no-empty': 'off',
      'no-implicit-coercion': 'warn',
      'no-undef': 'off',
      'no-useless-rename': 'warn',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-object-as-default-parameter': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'valid-typeof': 'off',
    },
  },

  { // Rules: TypeScript
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/consistent-type-exports': ['warn', { fixMixedExportsWithInlineTypeSpecifier: true }],
      '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true, allowConciseArrowFunctionExpressionsStartingWithVoid: true }],
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-dynamic-delete': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-namespace-keyword': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowAny: true, allowNumber: true, allowBoolean: true, allowNullish: true }],
      '@typescript-eslint/switch-exhaustiveness-check': 'warn',
    },
  },

  { // Rules: Tests, Configs
    files: ['**/*.{test,spec,config}.*'],
    rules: {
      'max-lines': 'off',
      'import/no-extraneous-dependencies': ['off'],
    },
  },
];
