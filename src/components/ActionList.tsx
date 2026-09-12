import React, { useState } from 'react';
import { ListChecks, CheckCircle2, Circle } from 'lucide-react';

interface ActionListProps {
  actions: string[];
}

export const ActionList: React.FC<ActionListProps> = ({ actions }) => {
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const toggleAction = (idx: number) => {
    setCompletedActions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (actions.length === 0) {
    return (
      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
          <ListChecks className="w-5 h-5 text-[#3fb950]" />
          <span>What should I do next?</span>
        </h3>
        <p className="mt-2 text-sm text-[#8b949e]">
          No pending actions required. You can merge this pull request if you have write access and requirements are satisfied.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <ListChecks className="w-5 h-5 text-[#58a6ff]" />
          <span>What should I do next?</span>
        </h3>
        <span className="text-xs text-[#8b949e]">Ordered by priority</span>
      </div>

      <div className="space-y-3">
        {actions.map((action, idx) => {
          const isDone = !!completedActions[idx];

          return (
            <div
              key={idx}
              onClick={() => toggleAction(idx)}
              className={`flex items-start space-x-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-[#8b949e] line-through'
                  : 'bg-[#21262d]/60 border-[#30363d] hover:border-[#484f58] text-[#e6edf3]'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 shrink-0 text-[#8b949e] hover:text-[#58a6ff]"
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />
                ) : (
                  <Circle className="w-4 h-4 text-[#484f58]" />
                )}
              </button>
              <div className="flex items-baseline space-x-2">
                <span className="font-mono text-xs text-[#8b949e] font-semibold">{idx + 1}.</span>
                <span className="text-sm leading-relaxed">{action}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
