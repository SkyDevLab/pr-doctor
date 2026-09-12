import { describe, it, expect } from 'vitest';
import { analyzePullRequest } from '../analyzer';
import { NormalizedPRData } from '../types/analysis';
import { GitHubPullRequest, GitHubCheckRun, GitHubReview } from '../types/github';

function createMockPr(overrides?: Partial<GitHubPullRequest>): GitHubPullRequest {
  return {
    id: 1,
    number: 100,
    title: 'Feat: Add awesome feature',
    body: 'Description of changes',
    state: 'open',
    draft: false,
    locked: false,
    merged: false,
    mergeable: true,
    mergeable_state: 'clean',
    html_url: 'https://github.com/org/repo/pull/100',
    created_at: '2026-09-01T10:00:00Z',
    updated_at: new Date().toISOString(),
    closed_at: null,
    merged_at: null,
    additions: 150,
    deletions: 20,
    changed_files: 5,
    comments: 0,
    review_comments: 0,
    commits: 3,
    user: { login: 'octocat', avatar_url: 'https://avatar.url', html_url: 'https://github.com/octocat' },
    head: { ref: 'feat/awesome', sha: 'abcdef123', repo: { full_name: 'octocat/repo' } },
    base: { ref: 'main', sha: '123456789', repo: { full_name: 'org/repo' } },
    requested_reviewers: [],
    requested_teams: [],
    ...overrides,
  };
}

describe('analyzePullRequest Blocker Engine', () => {
  it('diagnoses a clean PR with passing checks as READY', () => {
    const checkRuns: GitHubCheckRun[] = [
      {
        id: 101,
        name: 'build-and-test',
        status: 'completed',
        conclusion: 'success',
        html_url: 'https://github.com/org/repo/runs/101',
        started_at: '2026-09-01T10:05:00Z',
        completed_at: '2026-09-01T10:10:00Z',
      },
    ];

    const reviews: GitHubReview[] = [
      {
        id: 201,
        user: { login: 'senior-dev', avatar_url: '', html_url: '' },
        body: 'LGTM!',
        state: 'APPROVED',
        submitted_at: '2026-09-01T11:00:00Z',
        commit_id: 'abcdef123',
        html_url: '',
      },
    ];

    const data: NormalizedPRData = {
      pullRequest: createMockPr(),
      checkRuns,
      commitStatuses: [],
      reviews,
      requestedReviewers: [],
      requestedTeams: [],
    };

    const diagnosis = analyzePullRequest(data);
    expect(diagnosis.status).toBe('READY');
    expect(diagnosis.blockers.some((b) => b.id === 'no-obvious-blocker')).toBe(true);
    expect(diagnosis.stats.checksPassed).toBe(1);
    expect(diagnosis.stats.checksFailed).toBe(0);
    expect(diagnosis.stats.approvalsCount).toBe(1);
  });

  it('diagnoses failing CI checks as BLOCKED (critical)', () => {
    const checkRuns: GitHubCheckRun[] = [
      {
        id: 101,
        name: 'test / linux-x64',
        status: 'completed',
        conclusion: 'failure',
        html_url: 'https://github.com/org/repo/runs/101',
        started_at: null,
        completed_at: null,
      },
      {
        id: 102,
        name: 'linter',
        status: 'completed',
        conclusion: 'success',
        html_url: 'https://github.com/org/repo/runs/102',
        started_at: null,
        completed_at: null,
      },
    ];

    const data: NormalizedPRData = {
      pullRequest: createMockPr(),
      checkRuns,
      commitStatuses: [],
      reviews: [],
      requestedReviewers: [],
      requestedTeams: [],
    };

    const diagnosis = analyzePullRequest(data);
    expect(diagnosis.status).toBe('BLOCKED');
    expect(diagnosis.blockers.some((b) => b.id === 'ci-checks-failing' && b.severity === 'critical')).toBe(true);
    expect(diagnosis.actions.some((a) => a.includes('Inspect the test/workflow logs'))).toBe(true);
  });

  it('diagnoses changes requested as BLOCKED (critical)', () => {
    const reviews: GitHubReview[] = [
      {
        id: 301,
        user: { login: 'lead-reviewer', avatar_url: '', html_url: '' },
        body: 'Please fix the edge case in parser',
        state: 'CHANGES_REQUESTED',
        submitted_at: '2026-09-02T12:00:00Z',
        commit_id: 'abcdef123',
        html_url: '',
      },
    ];

    const data: NormalizedPRData = {
      pullRequest: createMockPr(),
      checkRuns: [],
      commitStatuses: [],
      reviews,
      requestedReviewers: [],
      requestedTeams: [],
    };

    const diagnosis = analyzePullRequest(data);
    expect(diagnosis.status).toBe('BLOCKED');
    const blocker = diagnosis.blockers.find((b) => b.id === 'review-changes-requested');
    expect(blocker).toBeDefined();
    expect(blocker?.severity).toBe('critical');
    expect(blocker?.description).toContain('@lead-reviewer requested changes');
  });

  it('diagnoses merge conflict as BLOCKED (critical)', () => {
    const data: NormalizedPRData = {
      pullRequest: createMockPr({ mergeable: false, mergeable_state: 'dirty' }),
      checkRuns: [],
      commitStatuses: [],
      reviews: [],
      requestedReviewers: [],
      requestedTeams: [],
    };

    const diagnosis = analyzePullRequest(data);
    expect(diagnosis.status).toBe('BLOCKED');
    expect(diagnosis.blockers.some((b) => b.id === 'merge-conflict' && b.severity === 'critical')).toBe(true);
  });

  it('diagnoses draft PR as WAITING (warning)', () => {
    const data: NormalizedPRData = {
      pullRequest: createMockPr({ draft: true }),
      checkRuns: [],
      commitStatuses: [],
      reviews: [],
      requestedReviewers: [],
      requestedTeams: [],
    };

    const diagnosis = analyzePullRequest(data);
    expect(diagnosis.status).toBe('WAITING');
    expect(diagnosis.blockers.some((b) => b.id === 'pr-is-draft' && b.severity === 'warning')).toBe(true);
  });

  it('diagnoses pending reviewer requests as WAITING (warning) without asserting required branch rule', () => {
    const data: NormalizedPRData = {
      pullRequest: createMockPr(),
      checkRuns: [],
      commitStatuses: [],
      reviews: [],
      requestedReviewers: [{ login: 'alice', avatar_url: '', html_url: '' }],
      requestedTeams: [],
    };

    const diagnosis = analyzePullRequest(data);
    expect(diagnosis.status).toBe('WAITING');
    const blocker = diagnosis.blockers.find((b) => b.id === 'review-requested-pending');
    expect(blocker).toBeDefined();
    expect(blocker?.description).toBe('@alice has been requested as a reviewer.');
  });

  it('diagnoses closed unmerged PR as BLOCKED', () => {
    const data: NormalizedPRData = {
      pullRequest: createMockPr({ state: 'closed', merged: false }),
      checkRuns: [],
      commitStatuses: [],
      reviews: [],
      requestedReviewers: [],
      requestedTeams: [],
    };

    const diagnosis = analyzePullRequest(data);
    expect(diagnosis.status).toBe('BLOCKED');
    expect(diagnosis.blockers.some((b) => b.id === 'pr-closed-unmerged')).toBe(true);
  });
});
