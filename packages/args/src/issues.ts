import type { SchemaIssue } from './schemas.ts';

export const extraPositionalOptionIssue = (): SchemaIssue => ({
  message: 'Extra positional option',
});

export const unknownOptionIssue = (name: string): SchemaIssue => ({
  message: `Unknown option "${name}"`,
});

export const missingOptionValue = (): SchemaIssue => ({
  message: 'Missing option value',
});

export const unexpectedOptionValue = (): SchemaIssue => ({
  message: 'Unexpected option value',
});

export const missingRequiredOption = (): SchemaIssue => ({
  message: 'Missing required option',
});
