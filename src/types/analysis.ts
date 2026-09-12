import {
  GitHubPullRequest,
  GitHubCheckRun,
  GitHubCommitStatusItem,
  GitHubReview,
  GitHubUser,
  GitHubTeam,
} from './github';

export type BlockerSeverity = 'critical' | 'warning' | 'info';

export interface Blocker {
  id: string;
  severity: BlockerSeverity;
  category: 'ci' | 'review' | 'conflict' | 'draft' | 'activity' | 'state' | 'general';
  title: string;
  description: string;
  action?: string;
  details?: string[];
  externalUrl?: string;
}

export type DiagnosisStatus = 'BLOCKED' | 'WAITING' | 'READY';

export interface AnalysisStats {
  checksFailed: number;
  checksPending: number;
  checksPassed: number;
  checksSkipped: number;
  totalChecks: number;
  approvalsCount: number;
  changesRequestedCount: number;
  pendingReviewersCount: number;
  commentsCount: number;
}

export interface PRDiagnosis {
  status: DiagnosisStatus;
  statusHeadline: string;
  statusSubtext: string;
  blockers: Blocker[];
  actions: string[];
  stats: AnalysisStats;
  analyzedAt: string;
}

export interface NormalizedPRData {
  pullRequest: GitHubPullRequest;
  checkRuns: GitHubCheckRun[];
  commitStatuses: GitHubCommitStatusItem[];
  reviews: GitHubReview[];
  requestedReviewers: GitHubUser[];
  requestedTeams: GitHubTeam[];
}
