import { GitHubPullRequest } from '../../types/github';
import { Blocker } from '../../types/analysis';

export function evaluateDraftRules(pr: GitHubPullRequest): Blocker[] {
  const blockers: Blocker[] = [];

  if (pr.draft) {
    blockers.push({
      id: 'pr-is-draft',
      severity: 'warning',
      category: 'draft',
      title: 'This PR is still marked as draft',
      description: 'Draft pull requests communicate that changes are still in progress. Reviewers and auto-merge tools typically wait until the PR is marked ready.',
      action: 'Click "Ready for review" on GitHub once you are ready for final reviews and CI validation.',
    });
  }

  return blockers;
}
