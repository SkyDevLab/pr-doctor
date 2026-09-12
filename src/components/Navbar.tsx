import React, { useEffect, useState } from 'react';
import { Stethoscope, Activity, Info, ShieldAlert } from 'lucide-react';
import { githubApi } from '../services/githubApi';
import { RateLimitInfo } from '../types/github';
import { formatResetTime } from '../utils/formatDuration';

export const Navbar: React.FC = () => {
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(() => githubApi.getRateLimitInfo());
  const [showRateInfo, setShowRateInfo] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const unsubscribe = githubApi.onRateLimitUpdate((info) => {
      setRateLimit(info);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!rateLimit) return;
    const interval = setInterval(() => {
      setTimeRemaining(formatResetTime(rateLimit.reset));
    }, 1000);
    setTimeRemaining(formatResetTime(rateLimit.reset));
    return () => clearInterval(interval);
  }, [rateLimit]);

  const isLowQuota = rateLimit && rateLimit.remaining <= 5;

  return (
    <header className="border-b border-[#30363d] bg-[#161b22]/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/30">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">PR Doctor</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                MVP
              </span>
            </div>
            <p className="text-xs text-[#8b949e] hidden sm:block">Pull Request Health &amp; Blocker Diagnostics</p>
          </div>
        </div>

        {/* Rate Limit & External Links */}
        <div className="flex items-center space-x-3">
          {/* Rate Limit Pill */}
          <div className="relative">
            <button
              onClick={() => setShowRateInfo(!showRateInfo)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                rateLimit
                  ? isLowQuota
                    ? 'bg-red-950/40 text-red-400 border-red-800/60 hover:bg-red-900/50'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#e6edf3] hover:border-[#484f58]'
                  : 'bg-[#21262d] text-[#8b949e] border-[#30363d]'
              }`}
              title="Click to view GitHub API rate limit details"
            >
              {isLowQuota ? (
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-[#58a6ff]" />
              )}
              <span>
                {rateLimit ? (
                  <>
                    <strong className="text-white font-semibold">{rateLimit.remaining}</strong>
                    <span className="text-[#8b949e]">/{rateLimit.limit} reqs</span>
                  </>
                ) : (
                  <span>Rate Limit: 60/hr</span>
                )}
              </span>
              <Info className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {/* Rate limit dropdown modal */}
            {showRateInfo && (
              <div className="absolute right-0 mt-2 w-72 p-4 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 text-xs text-[#8b949e]">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#30363d]">
                  <span className="font-semibold text-white">GitHub API Quota</span>
                  <span className="text-[10px] text-blue-400 font-mono">Client-Side Public API</span>
                </div>
                <p className="mb-2">
                  PR Doctor runs 100% in your browser without servers or backend tokens. GitHub provides{' '}
                  <strong className="text-white">60 requests/hour</strong> per IP for unauthenticated public requests.
                </p>
                {rateLimit ? (
                  <div className="space-y-1.5 pt-2 border-t border-[#30363d] font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className="text-white font-semibold">
                        {rateLimit.remaining} of {rateLimit.limit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resets in:</span>
                      <span className="text-amber-400">{timeRemaining}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#6e7681] italic">
                    Quota will be read from response headers once your first PR is analyzed.
                  </p>
                )}
                <div className="mt-3 pt-2 border-t border-[#30363d] flex justify-end">
                  <button
                    onClick={() => setShowRateInfo(false)}
                    className="text-xs text-[#58a6ff] hover:underline"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
