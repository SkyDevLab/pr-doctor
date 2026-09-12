import { GitHubPullRequest } from '../../types/github';
import { Blocker } from '../../types/analysis';

export function evaluateConflictRules(pr: GitHubPullRequest): Blocker[] {
  const blockers: Blocker[] = [];

  // If PR is already closed
  if (pr.state === 'closed') {
    if (pr.merged) {
      blockers.push({
        id: 'pr-already-merged',
        severity: 'info',
        category: 'state',
        title: 'Pull Request already merged',
        description: `This PR was merged into ${pr.base.ref} on ${new Date(pr.merged_at || pr.updated_at).toLocaleDateString()}.`,
      });
      return blockers;
    } else {
      blockers.push({
        id: 'pr-closed-unmerged',
        severity: 'critical',
        category: 'state',
        title: 'Pull Request is closed',
        description: 'This PR was closed without being merged. No changes can progress while closed.',
        action: 'Reopen the pull request if this work should continue.',
      });
      return blockers;
    }
  }

  // Conflict detection
  if (pr.mergeable === false || pr.mergeable_state === 'dirty' || pr.mergeable_state === 'conflict') {
    blockers.push({
      id: 'merge-conflict',
      severity: 'critical',
      category: 'conflict',
      title: 'Merge conflict detected',
      description: `The branch "${pr.head.ref}" has merge conflicts with base branch "${pr.base.ref}" and cannot be merged cleanly.`,
      action: `Merge or rebase "${pr.base.ref}" into "${pr.head.ref}" and resolve the conflicting files.`,
    });
  } else if (pr.mergeable === null || pr.mergeable_state === 'unknown') {
    blockers.push({
      id: 'mergeable-computing',
      severity: 'info',
      category: 'conflict',
      title: 'Mergeability is being computed',
      description: `GitHub is currently calculating whether "${pr.head.ref}" can merge cleanly into "${pr.base.ref}".`,
      action: 'Check back in a minute or refresh to verify merge status.',
    });
  }

  return blockers;
}
