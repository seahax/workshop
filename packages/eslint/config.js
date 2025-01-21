import { FlatCompat } from '@eslint/eslintrc';
import eslint from '@eslint/js';
import progress from '@seahax/eslint-progress';
import stylistic from '@stylistic/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import react from 'eslint-plugin-react';
import regexp from 'eslint-plugin-regexp';
import importSort from 'eslint-plugin-simple-import-sort';
import unicorn from 'eslint-plugin-unicorn';
import typescript from 'typescript-eslint';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const jsExt = ['js', 'mjs', 'cjs', 'jsx'];
const tsExt = ['ts', 'cts', 'mts', 'tsx'];
const ext = [...jsExt, ...tsExt];

export default function config({ ignores = [], tsconfigPath } = {}) {
  return [
    { ignores },

    // Bases
    progress(),
    eslint.configs.recommended,
    stylistic.configs.customize({ indent: 2, quoteProps: 'as-needed', arrowParens: true, semi: true }),
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    compat.config({ extends: ['plugin:react-hooks/recommended'] }),
    regexp.configs['flat/recommended'],
    unicorn.configs['flat/recommended'],
    { plugins: { import: importPlugin } },
    { plugins: { 'import-sort': importSort } },
    [
      typescript.configs.recommendedTypeChecked,
      typescript.configs.stylisticTypeChecked,
      typescript.configs.strictTypeChecked,
    ].flat().map((config) => ({ ...config, files: [...config.files ?? [], `**/*.{${tsExt}}`] })),

    // Settings
    {
      languageOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        parserOptions: {
          project: tsconfigPath,
        },
      },
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': tsExt.map((ext) => `.${ext}`),
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

    // Rules: General
    {
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
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/no-array-reduce': 'off',
        'unicorn/no-array-for-each': 'off',
        'unicorn/no-null': 'off',
        'unicorn/no-object-as-default-parameter': 'off',
        'unicorn/no-useless-undefined': 'off',
        'unicorn/numeric-separators-style': 'off',
        'unicorn/prefer-default-parameters': 'off',
        'unicorn/prefer-event-target': 'off',
        'unicorn/prefer-native-coercion-functions': 'off',
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/prefer-type-error': 'off',
        'unicorn/prefer-ternary': 'off',
        'unicorn/prevent-abbreviations': 'off',
        'valid-typeof': 'off',
        '@stylistic/indent-binary-ops': ['off'],
        '@stylistic/max-len': ['warn', { code: 120, tabWidth: 2, ignoreComments: true, ignoreTemplateLiterals: true }],
      },
    },

    // Rules: TypeScript
    {
      files: [`**/*.{${tsExt}}`],
      rules: {
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/consistent-indexed-object-style': ['off'],
        '@typescript-eslint/consistent-type-exports': ['warn', { fixMixedExportsWithInlineTypeSpecifier: true }],
        '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports' }],
        '@typescript-eslint/explicit-function-return-type': [
          'warn',
          { allowExpressions: true, allowConciseArrowFunctionExpressionsStartingWithVoid: true },
        ],
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/no-dynamic-delete': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-invalid-void-type': 'off',
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
        '@typescript-eslint/prefer-regexp-exec': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          { allowAny: true, allowNumber: true, allowBoolean: true, allowNullish: true },
        ],
        '@typescript-eslint/switch-exhaustiveness-check': [
          'warn',
          { considerDefaultExhaustiveForUnions: true, requireDefaultForNonUnion: true },
        ],
      },
    },

    // Rules: Tests, Configs
    {
      files: [`**/*.{test,spec,config,setup}.{${ext}}`],
      rules: {
        'max-lines': 'off',
        'import/no-extraneous-dependencies': ['off'],
      },
    },
  ].flat();
}
