import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  MinusCircle,
} from 'lucide-react';
import { GitHubCheckRun, GitHubCommitStatusItem } from '../types/github';
import { AnalysisStats } from '../types/analysis';

interface ChecksDetailSectionProps {
  checkRuns: GitHubCheckRun[];
  commitStatuses: GitHubCommitStatusItem[];
  stats: AnalysisStats;
}

export const ChecksDetailSection: React.FC<ChecksDetailSectionProps> = ({
  checkRuns,
  commitStatuses,
  stats,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const total = stats.totalChecks;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-base tracking-tight flex items-center space-x-2">
              <span>CI &amp; Automated Checks</span>
              <span className="text-xs text-[#8b949e] font-mono">({total})</span>
            </h4>
            <div className="flex items-center space-x-2 text-xs font-mono mt-1">
              {stats.checksFailed > 0 && (
                <span className="text-[#f85149] flex items-center gap-1">
                  <XCircle className="w-3 h-3 inline" /> {stats.checksFailed} failed
                </span>
              )}
              {stats.checksPending > 0 && (
                <span className="text-[#d29922] flex items-center gap-1">
                  <Clock className="w-3 h-3 inline" /> {stats.checksPending} pending
                </span>
              )}
              {stats.checksPassed > 0 && (
                <span className="text-[#3fb950] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 inline" /> {stats.checksPassed} passed
                </span>
              )}
              {stats.checksSkipped > 0 && (
                <span className="text-[#8b949e] flex items-center gap-1">
                  <MinusCircle className="w-3 h-3 inline" /> {stats.checksSkipped} skipped
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
        <div className="mt-4 pt-4 border-t border-[#30363d] space-y-2">
          {checkRuns.length === 0 && commitStatuses.length === 0 && (
            <p className="text-xs text-[#8b949e] py-2">No checks reported for this commit.</p>
          )}

          {checkRuns.map((run) => {
            const isSuccess = run.conclusion === 'success';
            const isFailure =
              run.conclusion === 'failure' ||
              run.conclusion === 'timed_out' ||
              run.conclusion === 'cancelled';
            const isPending = run.status !== 'completed';

            return (
              <div
                key={run.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs"
              >
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />}
                  {isFailure && <XCircle className="w-4 h-4 text-[#f85149] shrink-0" />}
                  {isPending && <Clock className="w-4 h-4 text-[#d29922] shrink-0" />}
                  {!isSuccess && !isFailure && !isPending && (
                    <MinusCircle className="w-4 h-4 text-[#8b949e] shrink-0" />
                  )}
                  <span className="font-mono text-white truncate">{run.name}</span>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span
                    className={`font-mono px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                      isSuccess
                        ? 'bg-emerald-950 text-emerald-300'
                        : isFailure
                        ? 'bg-red-950 text-red-300'
                        : isPending
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-[#30363d] text-[#8b949e]'
                    }`}
                  >
                    {run.conclusion || run.status}
                  </span>
                  {run.html_url && (
                    <a
                      href={run.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8b949e] hover:text-[#58a6ff]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {commitStatuses.map((st) => (
            <div
              key={st.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#21262d]/50 border border-[#30363d] text-xs"
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                {st.state === 'success' && <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />}
                {st.state === 'failure' && <XCircle className="w-4 h-4 text-[#f85149] shrink-0" />}
                {st.state === 'pending' && <Clock className="w-4 h-4 text-[#d29922] shrink-0" />}
                <span className="font-mono text-white truncate">{st.context}</span>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <span className="text-[11px] text-[#8b949e] max-w-[200px] truncate hidden sm:inline">
                  {st.description}
                </span>
                <span
                  className={`font-mono px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                    st.state === 'success'
                      ? 'bg-emerald-950 text-emerald-300'
                      : st.state === 'failure'
                      ? 'bg-red-950 text-red-300'
                      : 'bg-amber-950 text-amber-300'
                  }`}
                >
                  {st.state}
                </span>
                {st.target_url && (
                  <a
                    href={st.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8b949e] hover:text-[#58a6ff]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
