import React, { useState } from 'react';
import { Users, CheckCircle2, AlertOctagon, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { GitHubReview, GitHubUser, GitHubTeam } from '../types/github';
import { AnalysisStats } from '../types/analysis';
import { formatRelativeTime } from '../utils/formatDuration';

interface ReviewsDetailSectionProps {
  reviews: GitHubReview[];
  requestedReviewers: GitHubUser[];
  requestedTeams: GitHubTeam[];
  stats: AnalysisStats;
}

export const ReviewsDetailSection: React.FC<ReviewsDetailSectionProps> = ({
  reviews,
  requestedReviewers,
  requestedTeams,
  stats,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base tracking-tight flex items-center space-x-2">
              <span>Reviews &amp; Reviewers</span>
              <span className="text-xs text-[#8b949e] font-mono">
                ({reviews.length} reviews, {requestedReviewers.length + requestedTeams.length} requested)
              </span>
            </h4>
            <div className="flex items-center space-x-3 text-xs font-mono mt-1">
              {stats.approvalsCount > 0 && (
                <span className="text-[#3fb950] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" /> {stats.approvalsCount} approved
                </span>
              )}
              {stats.changesRequestedCount > 0 && (
                <span className="text-[#f85149] flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3 inline" /> {stats.changesRequestedCount} changes requested
                </span>
              )}
              {stats.pendingReviewersCount > 0 && (
                <span className="text-[#d29922] flex items-center gap-1">
                  <Clock className="w-3 h-3 inline" /> {stats.pendingReviewersCount} requested
                </span>
              )}
            </div>
          </div>
        </div>

        <button className="text-[#8b949e] hover:text-white p-1">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[#30363d] space-y-4">
          {/* Requested Reviewers */}
          {(requestedReviewers.length > 0 || requestedTeams.length > 0) && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2">
                Pending Review Requests
              </h5>
              <div className="flex flex-wrap gap-2">
                {requestedReviewers.map((user) => (
                  <div
                    key={user.login}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#21262d] border border-[#30363d] text-xs text-[#e6edf3]"
                  >
                    <img src={user.avatar_url} alt={user.login} className="w-4 h-4 rounded-full" />
                    <span>@{user.login}</span>
                    <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/40">
                      Requested
                    </span>
                  </div>
                ))}
                {requestedTeams.map((team) => (
                  <div
                    key={team.slug}
                    className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-[#21262d] border border-[#30363d] text-xs text-[#e6edf3]"
                  >
                    <span>@{team.name || team.slug}</span>
                    <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-800/40">
                      Team Requested
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past Reviews List */}
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2">
              Submitted Reviews ({reviews.length})
            </h5>
            {reviews.length === 0 ? (
              <p className="text-xs text-[#8b949e]">No submitted reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {reviews.map((rev) => {
                  const isApproved = rev.state === 'APPROVED';
                  const isChangesRequested = rev.state === 'CHANGES_REQUESTED';
                  const isDismissed = rev.state === 'DISMISSED';

                  return (
                    <div
                      key={rev.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={rev.user.avatar_url}
                          alt={rev.user.login}
                          className="w-4 h-4 rounded-full"
                        />
                        <span className="font-semibold text-white">@{rev.user.login}</span>
                        <span className="text-[#8b949e]">
                          {formatRelativeTime(rev.submitted_at)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                            isApproved
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                              : isChangesRequested
                              ? 'bg-red-950 text-red-300 border border-red-800/50'
                              : isDismissed
                              ? 'bg-[#30363d] text-[#8b949e]'
                              : 'bg-blue-950/50 text-blue-300'
                          }`}
                        >
                          {rev.state}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
