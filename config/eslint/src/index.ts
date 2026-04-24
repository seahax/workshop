import js from '@eslint/js';
import progress from '@seahax/eslint-progress';
import { type Config, defineConfig } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import regexp from 'eslint-plugin-regexp';
import importSort from 'eslint-plugin-simple-import-sort';
import typescript from 'typescript-eslint';

interface Options {
  readonly enableReact?: boolean;
  readonly enablePrettier?: boolean;
}

/**
 * Seahax ESLint config factory.
 */
export default function config(root: string, { enableReact = false, enablePrettier = false }: Options = {}): Config[] {
  return defineConfig(
    { ignores: ['**/{node_modules,lib,dist,out,coverage}'] },

    // Bases
    progress(),
    js.configs.recommended,
    typescript.configs.recommended,
    regexp.configs['flat/recommended'],
    { plugins: { 'import-sort': importSort } },
    enableReact
      ? [
          { files: ['**/*.{tsx,jsx}'], ...react.configs.flat.recommended },
          { files: ['**/*.{tsx,jsx}'], ...react.configs.flat['jsx-runtime'] },
        ]
      : [],
    enablePrettier ? [prettierPlugin, prettierConfig, { rules: { 'prettier/prettier': 'warn' } }] : [],

    {
      languageOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        parserOptions: { projectService: true, tsconfigRootDir: root },
      },
      settings: {
        ...(enableReact ? react.configs.flat.recommended?.languageOptions : undefined),
        '@seahax/wrap': {
          autoFix: true,
        },
      },
    },

    {
      rules: {
        'import-sort/exports': 'warn',
        'import-sort/imports': 'warn',
        'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
        'no-empty': 'off',
        'no-implicit-coercion': 'warn',
        'no-undef': 'off',
        'no-useless-rename': 'warn',
        'prefer-const': 'warn',
        'valid-typeof': 'off',
      },
    },

    {
      files: ['**/*.{ts,cts,mts,tsx}'],
      rules: {
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },

    {
      files: [`**/*.{test,spec,config,setup}.{js,cjs,mjs,ts,cts,mts}`],
      rules: {
        'max-lines': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  );
}
