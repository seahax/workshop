import assert from 'node:assert';
import path from 'node:path';

import actions from '@actions/core';
import { throttling } from '@octokit/plugin-throttling';
import { Octokit } from '@octokit/rest';

assert.ok(process.env.GITHUB_REPOSITORY, 'Missing GITHUB_REPOSITORY environment variable.');
assert.ok(process.env.GITHUB_WORKFLOW_REF, 'Missing GITHUB_WORKFLOW_REF environment variable.');

const EXPIRE_DAYS = 7;
const EXPIRE_DAYS_IN_MS = EXPIRE_DAYS * 24 * 60 * 60 * 1000;

const octokit = new (Octokit.plugin(throttling))({
  auth: actions.getInput('github_token'),
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

const [repoOwner = '', repoName = ''] = process.env.GITHUB_REPOSITORY.split('/', 2);
const workflowFilename = path.basename(process.env.GITHUB_WORKFLOW_REF.split('@', 1)[0] ?? '');
const runs = await octokit.paginate(
  'GET /repos/:owner/:repo/actions/workflows/:workflow/runs',
  { owner: repoOwner, repo: repoName, workflow: workflowFilename },
);

runs.sort((a, b) => b.run_number - a.run_number);

for (const run of runs) {
  const { id, run_number, created_at, status, pull_requests } = run;
  const expiration = new Date(created_at).getTime() + EXPIRE_DAYS_IN_MS;
  const now = Date.now();

  // Never delete the current run.
  if (process.env.GITHUB_RUN_ID === String(id)) continue;

  if (expiration >= now) {
    console.log(`Skipped run #${run_number} (${id}) with an age of less than ${EXPIRE_DAYS} days.`);
    continue;
  }

  if (status !== 'completed') {
    console.log(`Skipped run #${run_number} (${id}) with status "${status}".`);
    continue;
  }

  if (pull_requests.length > 0) {
    console.log(`Skipped run #${run_number} (${id}) with attached PRs.`);
    continue;
  }

  console.log(`Delete run #${run_number} (${id}).`);
}
