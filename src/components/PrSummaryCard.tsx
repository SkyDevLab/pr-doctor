import React from 'react';
import { GitCommit, FileCode, MessageSquare, Plus, Minus, Calendar, GitPullRequest } from 'lucide-react';
import { GitHubPullRequest } from '../types/github';
import { formatRelativeTime, formatDateShort } from '../utils/formatDuration';

interface PrSummaryCardProps {
  pr: GitHubPullRequest;
}

export const PrSummaryCard: React.FC<PrSummaryCardProps> = ({ pr }) => {
  const totalComments = (pr.comments || 0) + (pr.review_comments || 0);

  const getMergeableBadge = () => {
    if (pr.mergeable === true && pr.mergeable_state === 'clean') {
      return (
        <span className="text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded text-[11px] font-mono">
          Clean (No conflicts)
        </span>
      );
    }
    if (pr.mergeable === false || pr.mergeable_state === 'dirty') {
      return (
        <span className="text-red-400 bg-red-950/40 border border-red-800/50 px-2 py-0.5 rounded text-[11px] font-mono">
          Conflicts Detected
        </span>
      );
    }
    return (
      <span className="text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded text-[11px] font-mono">
        {pr.mergeable_state || 'Computing...'}
      </span>
    );
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 sm:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {/* Diff Stats */}
        <div className="space-y-1">
          <span className="text-[#8b949e] flex items-center gap-1">
            <FileCode className="w-3.5 h-3.5" />
            <span>Changes</span>
          </span>
          <div className="flex items-center space-x-2 font-mono text-sm">
            <span className="text-[#3fb950] font-semibold flex items-center">
              <Plus className="w-3 h-3 inline" />
              {pr.additions.toLocaleString()}
            </span>
            <span className="text-[#f85149] font-semibold flex items-center">
              <Minus className="w-3 h-3 inline" />
              {pr.deletions.toLocaleString()}
            </span>
            <span className="text-[#8b949e] text-xs">({pr.changed_files} files)</span>
          </div>
        </div>

        {/* Commits & Comments */}
        <div className="space-y-1">
          <span className="text-[#8b949e] flex items-center gap-1">
            <GitCommit className="w-3.5 h-3.5" />
            <span>Commits &amp; Activity</span>
          </span>
          <div className="flex items-center space-x-3 text-sm text-[#e6edf3]">
            <span className="font-semibold">{pr.commits} commits</span>
            <span className="text-[#8b949e] flex items-center gap-1 text-xs">
              <MessageSquare className="w-3 h-3" />
              {totalComments}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-1">
          <span className="text-[#8b949e] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Last Activity</span>
          </span>
          <div>
            <span className="font-semibold text-white">{formatRelativeTime(pr.updated_at)}</span>
            <p className="text-[11px] text-[#6e7681]">Opened {formatDateShort(pr.created_at)}</p>
          </div>
        </div>

        {/* Mergeable State */}
        <div className="space-y-1">
          <span className="text-[#8b949e] flex items-center gap-1">
            <GitPullRequest className="w-3.5 h-3.5" />
            <span>Branch Mergeability</span>
          </span>
          <div className="pt-0.5">{getMergeableBadge()}</div>
        </div>
      </div>
    </div>
  );
};
