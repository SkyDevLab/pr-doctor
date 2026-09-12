import { GitHubPullRequest } from '../../types/github';
import { Blocker } from '../../types/analysis';

export function evaluateActivityRules(pr: GitHubPullRequest): Blocker[] {
  const blockers: Blocker[] = [];

  // 1. Comment discussion notice (strictly informational, adhering to REST API accuracy guidelines)
  const totalComments = (pr.comments || 0) + (pr.review_comments || 0);
  if (totalComments > 0) {
    blockers.push({
      id: 'activity-comments-detected',
      severity: 'info',
      category: 'activity',
      title: 'Review discussion activity detected',
      description: `${totalComments} discussion comment(s) exist on this pull request. (GitHub REST API does not indicate whether conversation threads have been marked resolved; please verify discussions on GitHub).`,
    });
  }

  // 2. Staleness check
  if (pr.state === 'open') {
    const updatedAt = new Date(pr.updated_at).getTime();
    const now = Date.now();
    const daysSinceUpdate = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));

    if (daysSinceUpdate >= 30) {
      blockers.push({
        id: 'activity-stale',
        severity: 'warning',
        category: 'activity',
        title: `PR appears stale (no activity for ${daysSinceUpdate} days)`,
        description: `This PR was last updated on ${new Date(pr.updated_at).toLocaleDateString()}. Long-inactive PRs often fall behind base branches or lose maintainer context.`,
        action: `Rebase onto ${pr.base.ref} or post an update to resume progress.`,
      });
    }
  }

  return blockers;
}
