import { NormalizedPRData, PRDiagnosis, Blocker, DiagnosisStatus } from '../types/analysis';
import { evaluateConflictRules } from './rules/conflictRules';
import { evaluateDraftRules } from './rules/draftRules';
import { evaluateCiRules } from './rules/ciRules';
import { evaluateReviewRules } from './rules/reviewRules';
import { evaluateActivityRules } from './rules/activityRules';

export function analyzePullRequest(data: NormalizedPRData): PRDiagnosis {
  const { pullRequest, checkRuns, commitStatuses, reviews, requestedReviewers, requestedTeams } =
    data;

  // Run all deterministic rule modules
  const conflictBlockers = evaluateConflictRules(pullRequest);
  const draftBlockers = evaluateDraftRules(pullRequest);
  const ciResult = evaluateCiRules(checkRuns, commitStatuses);
  const reviewResult = evaluateReviewRules(reviews, requestedReviewers, requestedTeams);
  const activityBlockers = evaluateActivityRules(pullRequest);

  // Collect all blockers
  const allBlockers: Blocker[] = [
    ...conflictBlockers,
    ...draftBlockers,
    ...ciResult.blockers,
    ...reviewResult.blockers,
    ...activityBlockers,
  ];

  // Severity sort order: critical -> warning -> info
  const severityWeight: Record<string, number> = {
    critical: 1,
    warning: 2,
    info: 3,
  };

  allBlockers.sort((a, b) => (severityWeight[a.severity] || 99) - (severityWeight[b.severity] || 99));

  // Determine Overall Status
  const criticalCount = allBlockers.filter((b) => b.severity === 'critical').length;
  const warningCount = allBlockers.filter((b) => b.severity === 'warning').length;

  let status: DiagnosisStatus = 'READY';
  let statusHeadline = '🟢 READY';
  let statusSubtext = 'The PR appears ready based on available GitHub API data.';

  if (criticalCount > 0) {
    status = 'BLOCKED';
    statusHeadline = '🔴 BLOCKED';

    const reasons: string[] = [];
    if (conflictBlockers.some((b) => b.severity === 'critical')) reasons.push('merge conflict');
    if (ciResult.stats.failed > 0) reasons.push('failing CI checks');
    if (reviewResult.stats.changesRequestedCount > 0) reasons.push('changes requested');
    if (pullRequest.state === 'closed' && !pullRequest.merged) reasons.push('PR closed');

    statusSubtext =
      reasons.length > 0
        ? `Stuck due to ${reasons.join(', ')}.`
        : 'Action is required before this PR can proceed.';
  } else if (warningCount > 0) {
    status = 'WAITING';
    statusHeadline = '🟡 WAITING';

    const reasons: string[] = [];
    if (pullRequest.draft) reasons.push('draft status');
    if (ciResult.stats.pending > 0) reasons.push('running CI');
    if (reviewResult.stats.pendingReviewersCount > 0) reasons.push('pending reviewer(s)');

    statusSubtext =
      reasons.length > 0
        ? `Waiting on ${reasons.join(', ')}.`
        : 'In progress or pending review.';
  } else {
    // If no critical and no warning blockers, ensure an explicit positive note exists
    if (!allBlockers.some((b) => b.id === 'no-obvious-blocker')) {
      allBlockers.unshift({
        id: 'no-obvious-blocker',
        severity: 'info',
        category: 'general',
        title: 'No obvious blocker detected',
        description:
          "The PR appears ready based on the information available from GitHub's public API. (Note: Repository-specific branch protection rules or merge queue configurations may still apply).",
      });
    }
  }

  // Generate actionable next steps
  const actions: string[] = [];
  for (const blocker of allBlockers) {
    if (blocker.action && !actions.includes(blocker.action)) {
      actions.push(blocker.action);
    }
  }

  const commentsCount = (pullRequest.comments || 0) + (pullRequest.review_comments || 0);

  return {
    status,
    statusHeadline,
    statusSubtext,
    blockers: allBlockers,
    actions,
    stats: {
      checksFailed: ciResult.stats.failed,
      checksPending: ciResult.stats.pending,
      checksPassed: ciResult.stats.passed,
      checksSkipped: ciResult.stats.skipped,
      totalChecks: ciResult.stats.total,
      approvalsCount: reviewResult.stats.approvalsCount,
      changesRequestedCount: reviewResult.stats.changesRequestedCount,
      pendingReviewersCount: reviewResult.stats.pendingReviewersCount,
      commentsCount,
    },
    analyzedAt: new Date().toISOString(),
  };
}
