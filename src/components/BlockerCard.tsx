import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { Blocker } from '../types/analysis';

interface BlockerCardProps {
  blocker: Blocker;
}

export const BlockerCard: React.FC<BlockerCardProps> = ({ blocker }) => {
  const [expanded, setExpanded] = useState(false);

  const severityConfig = {
    critical: {
      border: 'border-red-500/30 hover:border-red-500/50',
      bg: 'bg-red-950/20',
      badgeBg: 'bg-red-500/10 text-red-400 border-red-500/30',
      badgeText: 'Critical Blocker',
      icon: AlertCircle,
      iconColor: 'text-red-400',
      actionBg: 'bg-red-950/40 border-red-900/50 text-red-200',
      actionTitleColor: 'text-red-300',
    },
    warning: {
      border: 'border-amber-500/30 hover:border-amber-500/50',
      bg: 'bg-amber-950/20',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      badgeText: 'Warning / Waiting',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      actionBg: 'bg-amber-950/40 border-amber-900/50 text-amber-200',
      actionTitleColor: 'text-amber-300',
    },
    info: {
      border: 'border-[#30363d] hover:border-[#484f58]',
      bg: 'bg-[#161b22]',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      badgeText: 'Information',
      icon: Info,
      iconColor: 'text-blue-400',
      actionBg: 'bg-[#21262d] border-[#30363d] text-[#c9d1d9]',
      actionTitleColor: 'text-blue-300',
    },
  }[blocker.severity];

  const Icon = severityConfig.icon;

  const categoryLabels: Record<string, string> = {
    ci: 'CI & Workflows',
    review: 'Code Review',
    conflict: 'Git Merge',
    draft: 'Pull Request State',
    activity: 'Discussions & Staleness',
    state: 'PR Lifecycle',
    general: 'System',
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-all shadow-sm ${severityConfig.bg} ${severityConfig.border}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="mt-0.5 shrink-0">
            <Icon className={`w-5 h-5 ${severityConfig.iconColor}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityConfig.badgeBg}`}
              >
                {severityConfig.badgeText}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d] font-mono">
                {categoryLabels[blocker.category] || blocker.category}
              </span>
            </div>
            <h4 className="text-base font-semibold text-white tracking-tight">{blocker.title}</h4>
            <p className="mt-1 text-sm text-[#c9d1d9] leading-relaxed">{blocker.description}</p>
          </div>
        </div>

        {blocker.externalUrl && (
          <a
            href={blocker.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] transition-all shrink-0"
            title="Open related link on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Suggested Action */}
      {blocker.action && (
        <div className={`mt-4 p-3.5 rounded-lg border text-xs sm:text-sm ${severityConfig.actionBg}`}>
          <div className="flex items-start space-x-2">
            <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-white/70" />
            <div>
              <span className={`font-semibold uppercase tracking-wider text-[10px] block mb-0.5 ${severityConfig.actionTitleColor}`}>
                Recommended Action:
              </span>
              <span className="leading-snug">{blocker.action}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Details list if available */}
      {blocker.details && blocker.details.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#30363d]/60">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center space-x-1.5 text-xs text-[#8b949e] hover:text-[#58a6ff] font-mono transition-colors"
          >
            <span>{expanded ? 'Hide details' : `Show details (${blocker.details.length})`}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <ul className="mt-2 space-y-1 text-xs text-[#8b949e] font-mono pl-4 list-disc">
              {blocker.details.map((detail, idx) => (
                <li key={idx} className="break-all">
                  {detail}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
