import {
  GitHubPullRequest,
  GitHubCheckRunsResponse,
  GitHubCombinedCommitStatus,
  GitHubReview,
  RateLimitInfo,
} from '../types/github';
import { NormalizedPRData } from '../types/analysis';

export interface FetchProgressCallback {
  (step: 'fetching_pr' | 'checking_ci' | 'checking_reviews' | 'building_diagnosis', message: string): void;
}

export class GitHubApiError extends Error {
  public status: number;
  public isRateLimit: boolean;
  public resetTime?: number;

  constructor(message: string, status: number, isRateLimit = false, resetTime?: number) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.isRateLimit = isRateLimit;
    this.resetTime = resetTime;
  }
}

class GitHubApiService {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private inFlight = new Map<string, Promise<unknown>>();
  private rateLimitInfo: RateLimitInfo | null = null;
  private rateLimitListeners = new Set<(info: RateLimitInfo) => void>();
  private CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

  public getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  public onRateLimitUpdate(listener: (info: RateLimitInfo) => void): () => void {
    this.rateLimitListeners.add(listener);
    if (this.rateLimitInfo) {
      listener(this.rateLimitInfo);
    }
    return () => {
      this.rateLimitListeners.delete(listener);
    };
  }

  private notifyRateLimit(info: RateLimitInfo) {
    this.rateLimitInfo = info;
    for (const listener of this.rateLimitListeners) {
      listener(info);
    }
  }

  private updateRateLimitFromHeaders(headers: Headers) {
    const limitHeader = headers.get('x-ratelimit-limit');
    const remainingHeader = headers.get('x-ratelimit-remaining');
    const resetHeader = headers.get('x-ratelimit-reset');
    const usedHeader = headers.get('x-ratelimit-used');

    if (limitHeader && remainingHeader && resetHeader) {
      const info: RateLimitInfo = {
        limit: parseInt(limitHeader, 10),
        remaining: parseInt(remainingHeader, 10),
        reset: parseInt(resetHeader, 10),
        used: usedHeader ? parseInt(usedHeader, 10) : undefined,
      };
      this.notifyRateLimit(info);
    }
  }

  private async fetchWithDedupeAndCache<T>(
    url: string,
    signal?: AbortSignal,
    allowNotFound = false
  ): Promise<T | null> {
    // 1. Check in-memory cache
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.data as T;
    }

    // 2. Check in-flight request
    const inFlightPromise = this.inFlight.get(url);
    if (inFlightPromise) {
      return (await inFlightPromise) as T;
    }

    // 3. Initiate network fetch
    const requestPromise = (async () => {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          signal,
        });

        this.updateRateLimitFromHeaders(response.headers);

        if (response.status === 404) {
          if (allowNotFound) {
            return null;
          }
          throw new GitHubApiError(
            'Repository or Pull Request not found. Make sure the repository is public and the PR number exists.',
            404
          );
        }

        if (response.status === 403 || response.status === 429) {
          const remaining = response.headers.get('x-ratelimit-remaining');
          const reset = response.headers.get('x-ratelimit-reset');
          const resetTime = reset ? parseInt(reset, 10) : undefined;
          const isRateLimit = remaining === '0' || response.status === 429;

          if (isRateLimit) {
            throw new GitHubApiError(
              'GitHub API rate limit exceeded. GitHub provides 60 requests per hour for unauthenticated requests.',
              response.status,
              true,
              resetTime
            );
          }

          let msg = 'Access forbidden by GitHub API.';
          try {
            const body = await response.json();
            if (body && body.message) {
              msg = body.message;
            }
          } catch {
            // ignore
          }
          throw new GitHubApiError(msg, response.status, false, resetTime);
        }

        if (!response.ok) {
          let errorMsg = `GitHub API request failed with status ${response.status} (${response.statusText})`;
          try {
            const errorJson = await response.json();
            if (errorJson?.message) {
              errorMsg = errorJson.message;
            }
          } catch {
            // ignore
          }
          throw new GitHubApiError(errorMsg, response.status);
        }

        const data = await response.json();
        this.cache.set(url, { data, timestamp: Date.now() });
        return data as T;
      } finally {
        this.inFlight.delete(url);
      }
    })();

    this.inFlight.set(url, requestPromise);
    return (await requestPromise) as T | null;
  }

  /**
   * Fetches full PR analysis data with progress reporting.
   */
  public async fetchPullRequestData(
    owner: string,
    repo: string,
    pullNumber: number,
    onProgress?: FetchProgressCallback,
    signal?: AbortSignal
  ): Promise<NormalizedPRData> {
    // Step 1: Fetch PR metadata
    onProgress?.('fetching_pr', `Fetching PR #${pullNumber} details from ${owner}/${repo}...`);
    const prUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;
    const pullRequest = await this.fetchWithDedupeAndCache<GitHubPullRequest>(prUrl, signal);

    if (!pullRequest) {
      throw new GitHubApiError(`Pull request #${pullNumber} not found.`, 404);
    }

    const headSha = pullRequest.head?.sha;

    // Step 2: Fetch CI status & check runs in parallel (if headSha available)
    onProgress?.('checking_ci', 'Checking CI check runs and commit statuses...');
    let checkRuns: GitHubCheckRunsResponse | null = null;
    let combinedStatus: GitHubCombinedCommitStatus | null = null;

    if (headSha) {
      const checkRunsUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${headSha}/check-runs?per_page=100`;
      const statusUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${headSha}/status`;

      // Fetch both check-runs and legacy statuses gracefully
      const [checkRunsRes, statusRes] = await Promise.allSettled([
        this.fetchWithDedupeAndCache<GitHubCheckRunsResponse>(checkRunsUrl, signal, true),
        this.fetchWithDedupeAndCache<GitHubCombinedCommitStatus>(statusUrl, signal, true),
      ]);

      if (checkRunsRes.status === 'fulfilled') {
        checkRuns = checkRunsRes.value;
      }
      if (statusRes.status === 'fulfilled') {
        combinedStatus = statusRes.value;
      }
    }

    // Step 3: Fetch reviews
    onProgress?.('checking_reviews', 'Checking reviews and requested reviewers...');
    const reviewsUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews?per_page=100`;
    let reviews: GitHubReview[] = [];

    try {
      const reviewsData = await this.fetchWithDedupeAndCache<GitHubReview[]>(reviewsUrl, signal, true);
      if (reviewsData && Array.isArray(reviewsData)) {
        reviews = reviewsData;
      }
    } catch {
      // Continue gracefully if reviews fail or permission is restricted
      reviews = [];
    }

    onProgress?.('building_diagnosis', 'Analyzing blockers and synthesizing diagnosis...');

    return {
      pullRequest,
      checkRuns: checkRuns?.check_runs || [],
      commitStatuses: combinedStatus?.statuses || [],
      reviews,
      requestedReviewers: pullRequest.requested_reviewers || [],
      requestedTeams: pullRequest.requested_teams || [],
    };
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const githubApi = new GitHubApiService();
