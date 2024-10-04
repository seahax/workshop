import { ReleaseType } from './release-type.js';

export const messageType = {
  feat: { heading: 'Features', bump: ReleaseType.minor },
  fix: { heading: 'Fixes', bump: ReleaseType.patch },
  chore: { heading: 'Chores', bump: ReleaseType.patch },
  refactor: { heading: 'Refactoring', bump: ReleaseType.patch },
  style: { heading: 'Formatting', bump: ReleaseType.patch },
  improvement: { heading: 'Improvements', bump: ReleaseType.patch },
  perf: { heading: 'Performance Improvements', bump: ReleaseType.patch },
  test: { heading: 'Testing', bump: ReleaseType.patch },
  build: { heading: 'Build Changes', bump: ReleaseType.patch },
  ci: { heading: 'CI Pipeline Changes', bump: ReleaseType.patch },
  docs: { heading: 'Documentation Changes', bump: ReleaseType.patch },
  revert: { heading: 'Reverted', bump: ReleaseType.patch },
} as const satisfies Record<string, { readonly heading: string; readonly bump: ReleaseType }>;
