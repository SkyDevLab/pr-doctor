export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubTeam {
  name: string;
  slug: string;
  html_url?: string;
}

export interface GitHubBranchRef {
  ref: string;
  sha: string;
  repo: {
    full_name: string;
    fork?: boolean;
    html_url?: string;
  } | null;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  draft: boolean;
  locked: boolean;
  merged: boolean;
  mergeable: boolean | null;
  mergeable_state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
  commits: number;
  user: GitHubUser;
  head: GitHubBranchRef;
  base: GitHubBranchRef;
  requested_reviewers: GitHubUser[];
  requested_teams: GitHubTeam[];
}

export interface GitHubCheckRun {
  id: number;
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion:
    | 'success'
    | 'failure'
    | 'neutral'
    | 'cancelled'
    | 'timed_out'
    | 'action_required'
    | 'skipped'
    | null;
  html_url: string;
  started_at: string | null;
  completed_at: string | null;
  output?: {
    title: string | null;
    summary: string | null;
  };
  app?: {
    name: string;
    slug: string;
  };
}

export interface GitHubCheckRunsResponse {
  total_count: number;
  check_runs: GitHubCheckRun[];
}

export interface GitHubCommitStatusItem {
  id: number;
  state: 'pending' | 'success' | 'failure' | 'error';
  description: string | null;
  target_url: string | null;
  context: string;
  created_at: string;
  updated_at: string;
}

export interface GitHubCombinedCommitStatus {
  state: 'pending' | 'success' | 'failure' | 'error';
  total_count: number;
  statuses: GitHubCommitStatusItem[];
  sha: string;
}

export interface GitHubReview {
  id: number;
  user: GitHubUser;
  body: string | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  submitted_at: string;
  commit_id: string;
  html_url: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix epoch seconds
  used?: number;
}
