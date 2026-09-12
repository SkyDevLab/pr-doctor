import React from 'react';
import { Blocker } from '../types/analysis';
import { BlockerCard } from './BlockerCard';
import { CheckCircle2 } from 'lucide-react';

interface BlockerListProps {
  blockers: Blocker[];
}

export const BlockerList: React.FC<BlockerListProps> = ({ blockers }) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <span>Why is it stuck?</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] border border-[#30363d]">
            {blockers.length} findings
          </span>
        </h3>
      </div>

      {blockers.length === 0 ? (
        <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-[#3fb950] mx-auto mb-3" />
          <h4 className="text-base font-semibold text-white">No Blockers Found</h4>
          <p className="text-xs text-[#8b949e] mt-1 max-w-sm mx-auto">
            All visible GitHub checks and reviews are in good standing.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blockers.map((blocker) => (
            <BlockerCard key={blocker.id} blocker={blocker} />
          ))}
        </div>
      )}
    </section>
  );
};
