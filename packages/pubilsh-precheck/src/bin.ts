#!/usr/bin/env node
import { alias, createHelp, cue, parseOptions } from '@seahax/args';
import { getPackages } from '@seahax/monorepo';

const help = createHelp`
{bold Usage:} publish-precheck {blue [options]}

Check package.json files for problems to fix before publishing.

Read the docs:
https://github.com/seahax/workshop/blob/main/packages/publish-precheck/README.md

{bold Options:}
  {blue --dry-run}       Do not actually publish, just show what would be done.
  {blue --command, -c}   Publish command (default: detected by lockfile)
  {blue --help, -h}      Show this help message.
`;

void (async () => {
  const args = process.argv.slice(2);
  const options = await parseOptions(args, {
    '--help': cue(),
    '-h': alias('--help'),
  });

  if (options.value === '--help') {
    return help().exit();
  }

  for (const pkg of await getPackages(process.cwd())) {
    const { data, filename } = pkg;

    if (!data.name) continue;
    if (!data.version) continue;
    if (data.private) continue;

    check(data.license, `package ${data.name} (${filename}) is missing "license"`);
    check(data.repository, `package ${data.name} (${filename}) is missing "repository"`);
    check(Array.isArray(data.files) && data.files.length > 0, `package ${data.name} (${filename}) is missing "files"`);
    check(data.type === 'module' || data.type === 'commonjs', `package ${data.name} (${filename}) has invalid "type"`);

    if (data.type === 'module') {
      check(data.exports || data.bin, `package ${data.name} (${filename}) is "module" but missing "exports" or "bin"`);
      check(!data.main, `package ${data.name} (${filename}) is "module" but has "main"`);
    }
    else if (data.type === 'commonjs') {
      check(data.main || data.bin, `package ${data.name} (${filename}) is "commonjs" but missing "main" or "bin"`);
      check(!data.exports, `package ${data.name} (${filename}) is "commonjs" but has "exports"`);
    }

    check(!data.exports || data.type === 'module', `package ${data.name} (${filename}) has "exports" but not "module"`);
    check(!data.main || data.type === 'commonjs', `package ${data.name} (${filename}) has "main" but not "commonjs"`);

    if (data.exports) {
      check(data.types, `Package ${data.name} (${filename}) missing "types"`);
    }

    if (data.dependencies) {
      for (const [dep, ver] of Object.entries<string>(data.dependencies)) {
        check(!ver.startsWith('workspace:'), `Package ${data.name} (${filename}) has "workspace:" dependency ${dep}`);
        check(!ver.startsWith('file:'), `Package ${data.name} (${filename}) has "file:" dependency ${dep}`);
        check(ver !== '*', `Package ${data.name} (${filename}) has "*" dependency ${dep}`);
      }
    }
  }

  function check(success: unknown, message: string): void {
    if (success) {
      return;
    }

    console.error(message);
    process.exitCode = 1;
  }
})();
