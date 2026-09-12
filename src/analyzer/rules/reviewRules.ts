import { GitHubReview, GitHubUser, GitHubTeam } from '../../types/github';
import { Blocker } from '../../types/analysis';

export interface ReviewEvaluationResult {
  blockers: Blocker[];
  stats: {
    approvalsCount: number;
    changesRequestedCount: number;
    pendingReviewersCount: number;
  };
  latestReviewsByUser: Map<string, GitHubReview>;
}

export function evaluateReviewRules(
  reviews: GitHubReview[],
  requestedReviewers: GitHubUser[],
  requestedTeams: GitHubTeam[]
): ReviewEvaluationResult {
  const blockers: Blocker[] = [];

  // Determine each user's latest review state
  // Sort chronologically by submitted_at
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );

  const latestReviewsByUser = new Map<string, GitHubReview>();
  for (const review of sortedReviews) {
    if (!review.user || !review.user.login) continue;
    // Dismissed reviews do not count towards approval or changes requested
    if (review.state === 'DISMISSED') {
      latestReviewsByUser.delete(review.user.login);
      continue;
    }
    // Only states that affect merge decisions: APPROVED, CHANGES_REQUESTED
    // If COMMENTED, it does not overwrite an existing APPROVED or CHANGES_REQUESTED
    if (review.state === 'APPROVED' || review.state === 'CHANGES_REQUESTED') {
      latestReviewsByUser.set(review.user.login, review);
    }
  }

  const changesRequestedUsers: string[] = [];
  const approvedUsers: string[] = [];

  for (const [login, review] of latestReviewsByUser.entries()) {
    if (review.state === 'CHANGES_REQUESTED') {
      changesRequestedUsers.push(login);
    } else if (review.state === 'APPROVED') {
      approvedUsers.push(login);
    }
  }

  // 1. Changes Requested -> Critical Blocker
  if (changesRequestedUsers.length > 0) {
    const userList = changesRequestedUsers.map((u) => `@${u}`).join(', ');
    blockers.push({
      id: 'review-changes-requested',
      severity: 'critical',
      category: 'review',
      title: 'Changes were requested',
      description: `${userList} requested changes on this pull request.`,
      action: `Address the requested changes and re-request review from ${userList}.`,
      details: changesRequestedUsers.map((u) => `@${u} requested changes`),
    });
  }

  // 2. Pending Requested Reviewers -> Warning / Waiting
  // Note: We explicitly state that @user has been requested as a reviewer,
  // without falsely assuming branch protection approval requirement.
  const pendingReviewerLogins = requestedReviewers.map((u) => `@${u.login}`);
  const pendingTeamSlugs = requestedTeams.map((t) => `@team/${t.slug}`);
  const allPending = [...pendingReviewerLogins, ...pendingTeamSlugs];

  if (allPending.length > 0) {
    const listPreview = allPending.slice(0, 3).join(', ');
    const extra = allPending.length > 3 ? ` and ${allPending.length - 3} more` : '';
    blockers.push({
      id: 'review-requested-pending',
      severity: 'warning',
      category: 'review',
      title: 'Review requested',
      description: `${listPreview}${extra} has been requested as a reviewer.`,
      action: `Wait for or follow up with the requested reviewers (${listPreview}${extra}).`,
      details: allPending,
    });
  }

  // 3. No reviews yet and no pending requests
  if (approvedUsers.length === 0 && changesRequestedUsers.length === 0 && allPending.length === 0) {
    blockers.push({
      id: 'review-none-recorded',
      severity: 'info',
      category: 'review',
      title: 'No reviews recorded yet',
      description: 'No reviews or requested reviewers have been registered on this pull request.',
      action: 'Request a review from a teammate or repository maintainer if required by this project.',
    });
  } else if (approvedUsers.length > 0 && changesRequestedUsers.length === 0) {
    const approvedList = approvedUsers.map((u) => `@${u}`).join(', ');
    blockers.push({
      id: 'review-approved',
      severity: 'info',
      category: 'review',
      title: `Approved by ${approvedList}`,
      description: `${approvedUsers.length} maintainer approval(s) recorded.`,
    });
  }

  return {
    blockers,
    stats: {
      approvalsCount: approvedUsers.length,
      changesRequestedCount: changesRequestedUsers.length,
      pendingReviewersCount: allPending.length,
    },
    latestReviewsByUser,
  };
}
