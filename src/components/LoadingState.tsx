import React from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface LoadingStateProps {
  currentStep: 'fetching_pr' | 'checking_ci' | 'checking_reviews' | 'building_diagnosis';
  statusMessage?: string;
}

const STEPS = [
  { key: 'fetching_pr', label: 'Fetching PR details' },
  { key: 'checking_ci', label: 'Checking CI & Commit Statuses' },
  { key: 'checking_reviews', label: 'Checking reviews & requested reviewers' },
  { key: 'building_diagnosis', label: 'Building diagnosis' },
];

export const LoadingState: React.FC<LoadingStateProps> = ({ currentStep, statusMessage }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full max-w-xl mx-auto my-12 p-6 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-xl text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mb-4 border border-blue-500/20">
        <Loader2 className="w-6 h-6 animate-spin text-[#58a6ff]" />
      </div>

      <h3 className="text-xl font-bold text-white tracking-tight">Analyzing PR...</h3>
      {statusMessage && <p className="text-xs text-[#8b949e] mt-1 font-mono">{statusMessage}</p>}

      <div className="mt-6 space-y-3 text-left max-w-md mx-auto">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={step.key}
              className={`flex items-center space-x-3 text-sm px-3 py-2 rounded-lg transition-all ${
                isCurrent
                  ? 'bg-blue-500/10 text-white font-medium border border-blue-500/30'
                  : isDone
                  ? 'text-[#3fb950]'
                  : 'text-[#6e7681]'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#58a6ff] shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[#30363d] shrink-0" />
              )}
              <span>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
