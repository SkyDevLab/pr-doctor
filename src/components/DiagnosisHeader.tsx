import React, { useState } from 'react';
import { ExternalLink, Copy, Check, GitMerge, AlertOctagon, Clock, CheckCircle } from 'lucide-react';
import { NormalizedPRData, PRDiagnosis } from '../types/analysis';
import { generateMarkdownReport } from '../utils/exportMarkdown';

interface DiagnosisHeaderProps {
  data: NormalizedPRData;
  diagnosis: PRDiagnosis;
}

export const DiagnosisHeader: React.FC<DiagnosisHeaderProps> = ({ data, diagnosis }) => {
  const [copied, setCopied] = useState(false);
  const pr = data.pullRequest;

  const handleCopy = () => {
    const report = generateMarkdownReport(data, diagnosis);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const statusConfig = {
    BLOCKED: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
      icon: AlertOctagon,
      label: 'BLOCKED',
      dotColor: 'bg-red-500',
    },
    WAITING: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Clock,
      label: 'WAITING',
      dotColor: 'bg-amber-500',
    },
    READY: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: CheckCircle,
      label: 'READY',
      dotColor: 'bg-emerald-500',
    },
  }[diagnosis.status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className={`p-6 sm:p-8 rounded-2xl border ${statusConfig.border} ${statusConfig.bg} transition-all`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: PR Identity */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-[#8b949e] font-mono">
            <span>{pr.base?.repo?.full_name || pr.base?.ref}</span>
            <span>&bull;</span>
            <span className="font-semibold text-white">PR #{pr.number}</span>
            {pr.draft && (
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-[#30363d] text-[#8b949e]">
                Draft
              </span>
            )}
            {pr.merged && (
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-purple-900/40 text-purple-300 border border-purple-700/50 flex items-center space-x-1">
                <GitMerge className="w-3 h-3 inline" />
                <span>Merged</span>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>{pr.title}</span>
            <a
              href={pr.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8b949e] hover:text-[#58a6ff] transition-colors inline-flex items-center shrink-0"
              title="Open PR on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#8b949e]">
            <span className="flex items-center space-x-1.5">
              <img
                src={pr.user.avatar_url}
                alt={pr.user.login}
                className="w-4 h-4 rounded-full"
              />
              <span className="text-[#e6edf3]">@{pr.user.login}</span>
            </span>
            <span>wants to merge into</span>
            <code className="px-1.5 py-0.5 rounded bg-[#21262d] text-white font-mono text-[11px]">
              {pr.base.ref}
            </code>
            <span>from</span>
            <code className="px-1.5 py-0.5 rounded bg-[#21262d] text-white font-mono text-[11px]">
              {pr.head.ref}
            </code>
          </div>
        </div>

        {/* Right: Big Status Badge & Quick Action */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3">
          <div
            className={`inline-flex items-center space-x-2.5 px-4 py-2 rounded-xl border text-sm sm:text-base font-bold tracking-wide ${statusConfig.badgeBg} shadow-lg`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dotColor} animate-pulse`} />
            <StatusIcon className="w-5 h-5" />
            <span>{statusConfig.label}</span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] hover:text-white transition-all shadow-sm"
            title="Copy formatted markdown report for Slack or GitHub"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#3fb950]" />
                <span className="text-[#3fb950]">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#8b949e]" />
                <span>Copy Markdown Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subtext Summary */}
      <div className="mt-4 pt-4 border-t border-[#30363d]/50 flex items-center justify-between text-xs sm:text-sm">
        <p className={`font-medium ${statusConfig.text}`}>{diagnosis.statusSubtext}</p>
        <span className="text-[11px] text-[#6e7681] font-mono hidden sm:inline">
          Diagnosed {new Date(diagnosis.analyzedAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};
