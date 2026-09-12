import React from 'react';
import { AlertCircle, ShieldAlert, RefreshCw, HelpCircle } from 'lucide-react';
import { GitHubApiError } from '../services/githubApi';
import { formatResetTime } from '../utils/formatDuration';

interface ErrorCardProps {
  error: Error | GitHubApiError;
  onRetry: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ error, onRetry }) => {
  const isApiError = error instanceof GitHubApiError;
  const isRateLimit = isApiError && error.isRateLimit;
  const isNotFound = isApiError && error.status === 404;

  return (
    <div className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-[#161b22] border border-red-500/30 rounded-2xl shadow-xl">
      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-xl bg-red-500/10 text-red-400 shrink-0 border border-red-500/20">
          {isRateLimit ? (
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          ) : (
            <AlertCircle className="w-6 h-6" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {isRateLimit
              ? 'GitHub API Rate Limit Reached'
              : isNotFound
              ? 'Pull Request Not Found'
              : 'Analysis Failed'}
          </h3>

          <p className="text-sm text-[#c9d1d9] leading-relaxed">{error.message}</p>

          {isRateLimit && error.resetTime && (
            <div className="mt-3 p-3 rounded-lg bg-[#21262d] border border-[#30363d] text-xs font-mono space-y-1">
              <div className="text-amber-400">
                Rate limit reset in: <strong>{formatResetTime(error.resetTime)}</strong>
              </div>
              <p className="text-[#8b949e] font-sans">
                GitHub allows 60 unauthenticated requests per hour. Please wait a few moments or try again once the window resets.
              </p>
            </div>
          )}

          {isNotFound && (
            <div className="mt-3 p-3 rounded-lg bg-[#21262d] border border-[#30363d] text-xs text-[#8b949e] space-y-1">
              <div className="flex items-center space-x-1 text-white font-medium">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tips for checking URLs:</span>
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Check that the repository is <strong>public</strong> (PR Doctor only accesses public PRs).</li>
                <li>Verify the owner, repo, and PR number in your browser.</li>
                <li>Make sure this is a Pull Request, not an Issue.</li>
              </ul>
            </div>
          )}

          <div className="pt-4 flex items-center space-x-3">
            <button
              onClick={onRetry}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
