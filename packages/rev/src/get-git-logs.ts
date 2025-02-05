import { $ } from 'execa';

import { type NpmMetadata } from './get-npm-metadata.ts';
import { type PackageJson } from './get-package-json.ts';

export interface GitLog {
  readonly hash: string;
  readonly message: string;
  readonly scope: string;
  readonly type: string;
  readonly breaking: boolean;
  readonly fullText: string;
}

const TYPE_ORDER: Readonly<Record<string, number>> = {
  feat: 0,
  fix: 1,
  refactor: 2,
  style: 3,
  test: 4,
  build: 5,
  ci: 6,
  docs: 7,
};

export async function getGitLogs(
  { name }: Pick<PackageJson, 'name'>,
  { gitHead }: Pick<NpmMetadata, 'gitHead'>,
): Promise<readonly GitLog[]> {
  const { stdout } = await $({
    stdout: 'pipe',
  })`git log ${'--pretty=format:%h %s'} ${gitHead}..HEAD -- .`;

  return stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => createLog(name, line) ?? [])
    .sort(compareLogs);
}

function createLog(name: string, line: string): GitLog | undefined {
  const match = line.match(/^\s*([a-f0-9]+)\s+(?=\S)(.+?)(?<=\S)\s*?$/mu);

  if (!match) return;

  const [, hash = '', text = ''] = match;
  const matchConventional = text.match(/^([^:\s(]*?)(?:\(([^)\s]*)\))?(!)?:(.*)$/u);
  const [, type = '', scope = '', bang = '', message = text] = matchConventional ?? [];
  const partial = { hash, message: message.trim(), scope, type: getNormalType(type), breaking: Boolean(bang) };
  const fullText = getFullText(name, partial);

  return { ...partial, fullText };
}

function getFullText(name: string, log: Omit<GitLog, 'fullText'>): string {
  const breaking = log.breaking ? '!' : '';
  const scope = log.scope && log.scope !== name && !name.endsWith(`/${log.scope}`) ? `(${log.scope})` : '';
  const label = log.type ? `__${log.type}${scope}${breaking}:__ ` : '';
  const hash = log.hash ? ` (${log.hash})` : '';

  return `${label}${log.message}${hash}`;
}

function getNormalType(type: string): string {
  type = type.toLowerCase().trim();

  switch (type) {
    case 'feats':
    case 'feature':
    case 'features': {
      return 'feat';
    }
    case 'fixes':
    case 'fixed':
    case 'fixing': {
      return 'fix';
    }
    case 'refactors':
    case 'refactored':
    case 'refactoring':
    case 'rewrite':
    case 'rewrites':
    case 'rewrote':
    case 'rewriting': {
      return 'refactor';
    }
    case 'styles':
    case 'styled':
    case 'styling': {
      return 'style';
    }
    case 'tests':
    case 'tested':
    case 'testing': {
      return 'test';
    }
    case 'builds':
    case 'building': {
      return 'build';
    }
    case 'doc':
    case 'document':
    case 'documents':
    case 'documented':
    case 'documenting': {
      return 'docs';
    }
    default: {
      return type || 'chore';
    }
  }
}

function compareLogs(a: GitLog, b: GitLog): number {
  return (TYPE_ORDER[a.type] ?? 100) - (TYPE_ORDER[b.type] ?? 200)
        || Number(b.breaking) - Number(a.breaking)
        || a.fullText.localeCompare(b.fullText);
}
