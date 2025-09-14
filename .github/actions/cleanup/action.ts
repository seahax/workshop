import assert from 'node:assert';
import path from 'node:path';

import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';

// assert.ok(process.env.GITHUB_WORKFLOW_REF, 'Missing GITHUB_WORKFLOW_REF environment variable.');
assert.ok(process.env.GITHUB_REPOSITORY, 'Missing GITHUB_REPOSITORY environment variable.');

// const workflow = path.basename(process.env.GITHUB_WORKFLOW_REF.split('@', 1)[0]!);
const [owner = '', repo = ''] = process.env.GITHUB_REPOSITORY.split('/', 2);
const expireDays = Number.parseInt(process.env.EXPIRE_DAYS ?? '', 10) || 0;
const expireMilliseconds = expireDays * 24 * 60 * 60 * 1000;
const token = process.env.GITHUB_TOKEN;
const dryRun = /^true$/u.test(process.env.DRY_RUN ?? '');

assert.ok(!Number.isNaN(expireDays), 'Invalid expire_days input. Must be a number.');

const octokit = new (Octokit.plugin(throttling))({
  auth: token,
  baseUrl: process.env.GITHUB_API_URL,
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
      // Only retry once.
      if (retryCount < 1) {
        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (_retryAfter, options, octokit) => {
      // No retries.
      octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
    },
  },
});

const runs = await octokit.paginate(octokit.actions.listWorkflowRunsForRepo, { owner, repo });

for (const run of runs) {
  const { id, path: runPath, run_number, created_at, status, pull_requests } = run;
  const filename = path.relative('.github/workflows', runPath);
  const expiration = new Date(created_at).getTime() + expireMilliseconds;
  const now = Date.now();

  // Never delete the current run.
  if (process.env.GITHUB_RUN_ID === String(id)) continue;

  if (expiration >= now) {
    console.log(`Skipped "${filename}" #${run_number} [${id}] (age < ${expireDays} days)`);
    continue;
  }

  if (status !== 'completed') {
    console.log(`Skipped "${filename}" #${run_number} [${id}] (status: ${status})`);
    continue;
  }

  if (pull_requests?.length) {
    console.log(`Skipped "${filename}" #${run_number} [${id}] (attached PRs)`);
    continue;
  }

  console.log(`Delete "${filename}" #${run_number} [${id}]${dryRun ? ' (dry run)' : ''}`);

  if (dryRun) continue;

  await octokit.actions.deleteWorkflowRun({ owner, repo, run_id: id });
}
