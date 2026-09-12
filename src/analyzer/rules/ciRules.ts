import { GitHubCheckRun, GitHubCommitStatusItem } from '../../types/github';
import { Blocker } from '../../types/analysis';

export interface CiEvaluationResult {
  blockers: Blocker[];
  stats: {
    passed: number;
    failed: number;
    pending: number;
    skipped: number;
    total: number;
  };
}

export function evaluateCiRules(
  checkRuns: GitHubCheckRun[],
  commitStatuses: GitHubCommitStatusItem[]
): CiEvaluationResult {
  const blockers: Blocker[] = [];

  const failedItems: { name: string; url?: string; reason: string }[] = [];
  const pendingItems: { name: string; url?: string }[] = [];
  let passedCount = 0;
  let skippedCount = 0;

  // 1. Evaluate Check Runs
  for (const run of checkRuns) {
    if (run.status === 'completed') {
      if (run.conclusion === 'success') {
        passedCount++;
      } else if (
        run.conclusion === 'failure' ||
        run.conclusion === 'timed_out' ||
        run.conclusion === 'action_required' ||
        run.conclusion === 'cancelled'
      ) {
        failedItems.push({
          name: run.name,
          url: run.html_url,
          reason: run.conclusion || 'failed',
        });
      } else if (run.conclusion === 'skipped' || run.conclusion === 'neutral') {
        skippedCount++;
      }
    } else {
      // status is 'queued' or 'in_progress'
      pendingItems.push({
        name: run.name,
        url: run.html_url,
      });
    }
  }

  // 2. Evaluate Legacy Commit Statuses
  // Notice: Multiple statuses with the same context can exist; GitHub uses the latest one for each context
  const latestStatusesByContext = new Map<string, GitHubCommitStatusItem>();
  for (const status of commitStatuses) {
    if (!latestStatusesByContext.has(status.context)) {
      latestStatusesByContext.set(status.context, status);
    }
  }

  for (const status of latestStatusesByContext.values()) {
    if (status.state === 'success') {
      passedCount++;
    } else if (status.state === 'failure' || status.state === 'error') {
      failedItems.push({
        name: status.context,
        url: status.target_url || undefined,
        reason: status.state,
      });
    } else if (status.state === 'pending') {
      pendingItems.push({
        name: status.context,
        url: status.target_url || undefined,
      });
    }
  }

  const failedCount = failedItems.length;
  const pendingCount = pendingItems.length;
  const total = passedCount + failedCount + pendingCount + skippedCount;

  // Build Blocker Findings
  if (failedCount > 0) {
    const namesPreview = failedItems
      .slice(0, 3)
      .map((item) => item.name)
      .join(', ');
    const extraCount = failedCount > 3 ? ` and ${failedCount - 3} more` : '';

    blockers.push({
      id: 'ci-checks-failing',
      severity: 'critical',
      category: 'ci',
      title: `${failedCount} CI ${failedCount === 1 ? 'check is failing' : 'checks are failing'}`,
      description: `Failing: ${namesPreview}${extraCount}. Merge is typically blocked when required checks fail.`,
      action: 'Inspect the test/workflow logs, fix the failure locally, and push an updated commit.',
      details: failedItems.map((i) => `${i.name} (${i.reason})`),
      externalUrl: failedItems[0]?.url,
    });
  }

  if (pendingCount > 0) {
    const namesPreview = pendingItems
      .slice(0, 3)
      .map((item) => item.name)
      .join(', ');
    const extraCount = pendingCount > 3 ? ` and ${pendingCount - 3} more` : '';

    blockers.push({
      id: 'ci-checks-pending',
      severity: 'warning',
      category: 'ci',
      title: `CI checks still in progress (${pendingCount} pending)`,
      description: `Waiting for: ${namesPreview}${extraCount}.`,
      action: 'Wait for CI workflows to complete before merging or requesting final review.',
      details: pendingItems.map((i) => i.name),
      externalUrl: pendingItems[0]?.url,
    });
  }

  if (total === 0) {
    blockers.push({
      id: 'ci-no-checks',
      severity: 'info',
      category: 'ci',
      title: 'No CI checks reported',
      description: 'GitHub reported no automated check runs or commit statuses for the latest commit.',
    });
  }

  return {
    blockers,
    stats: {
      passed: passedCount,
      failed: failedCount,
      pending: pendingCount,
      skipped: skippedCount,
      total,
    },
  };
}
