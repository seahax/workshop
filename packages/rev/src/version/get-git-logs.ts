import { $ } from 'execa';

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

export async function getGitLogs({ dir, name, gitHead }: {
  dir: string;
  name: string;
  gitHead: string;
}): Promise<GitLog[]> {
  const { stdout } = await $({
    stdout: 'pipe',
    cwd: dir,
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

  if (type.startsWith('feat')) return 'feat';

  if (type.startsWith('fix')) return 'fix';

  if (type.startsWith('perf')) return 'perf';

  if (type.startsWith('ops')) return 'ops';

  if (type.startsWith('refactor')) return 'refactor';
  if (type.startsWith('rewrit')) return 'refactor';

  if (type.startsWith('styl')) return 'style';

  if (type.startsWith('test')) return 'test';

  if (type.startsWith('build')) return 'build';

  if (type.startsWith('doc')) return 'docs';

  if (type.startsWith('chore')) return 'chore';
  if (type.startsWith('patch')) return 'chore';
  if (!type) return 'chore';

  return type;
}

function compareLogs(a: GitLog, b: GitLog): number {
  return (TYPE_ORDER[a.type] ?? 100) - (TYPE_ORDER[b.type] ?? 200)
        || Number(b.breaking) - Number(a.breaking)
        || a.fullText.localeCompare(b.fullText);
}
