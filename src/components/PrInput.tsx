import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, X, Sparkles, ArrowRight } from 'lucide-react';
import { parsePrUrl } from '../utils/parsePrUrl';

interface PrInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  initialUrl?: string;
}

const SAMPLE_PRS = [
  { label: 'dotnet/runtime #133803', url: 'https://github.com/dotnet/runtime/pull/133803' },
  { label: 'vitejs/vite #23476', url: 'https://github.com/vitejs/vite/pull/23476' },
  { label: 'facebook/react #28000', url: 'https://github.com/facebook/react/pull/28000' },
];

export const PrInput: React.FC<PrInputProps> = ({ onAnalyze, isLoading, initialUrl = '' }) => {
  const [url, setUrl] = useState(initialUrl);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (validationError) {
      // Clear or revalidate dynamically
      const res = parsePrUrl(val);
      if (res.isValid || !val.trim()) {
        setValidationError(null);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setValidationError('Please enter a GitHub Pull Request URL.');
      return;
    }

    const parsed = parsePrUrl(url);
    if (!parsed.isValid) {
      setValidationError(parsed.error || 'Invalid PR URL format.');
      return;
    }

    setValidationError(null);
    onAnalyze(parsed.normalizedUrl || url.trim());
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    setValidationError(null);
    onAnalyze(sampleUrl);
  };

  return (
    <div className="w-full max-w-3xl mx-auto text-center py-6 px-4 sm:px-0">
      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20 mb-4">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Client-Side Pull Request Diagnostics</span>
      </div>

      <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
        Why is my PR stuck?
      </h1>
      <p className="mt-3 text-base sm:text-lg text-[#8b949e] max-w-xl mx-auto">
        Paste a public GitHub Pull Request URL and let PR Doctor find the blockers.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-8">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-[#161b22] border border-[#30363d] rounded-2xl p-1.5 focus-within:border-[#58a6ff] focus-within:ring-1 focus-within:ring-[#58a6ff] shadow-xl transition-all">
          <div className="flex items-center flex-1 px-3 py-2 sm:py-0">
            <Search className="w-5 h-5 text-[#8b949e] shrink-0 mr-3" />
            <input
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="https://github.com/owner/repository/pull/123"
              disabled={isLoading}
              className="w-full bg-transparent text-sm sm:text-base text-white placeholder-[#6e7681] focus:outline-none font-mono"
            />
            {url && (
              <button
                type="button"
                onClick={() => {
                  setUrl('');
                  setValidationError(null);
                }}
                className="p-1 rounded-md text-[#8b949e] hover:text-white hover:bg-[#21262d]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="mt-2 sm:mt-0 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-600/30 shrink-0"
          >
            {isLoading ? (
              <span className="inline-flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Analyzing...</span>
              </span>
            ) : (
              <>
                <span>Analyze PR</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Validation error message */}
        {validationError && (
          <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg py-2 px-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </form>

      {/* Example PR Chips */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-[#8b949e]">Try an example:</span>
        {SAMPLE_PRS.map((sample) => (
          <button
            key={sample.url}
            type="button"
            onClick={() => handleSampleClick(sample.url)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-md bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] font-mono hover:text-white transition-all disabled:opacity-50"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </div>
  );
};
