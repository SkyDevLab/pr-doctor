import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { PrInput } from './components/PrInput';
import { LoadingState } from './components/LoadingState';
import { DiagnosisHeader } from './components/DiagnosisHeader';
import { PrSummaryCard } from './components/PrSummaryCard';
import { BlockerList } from './components/BlockerList';
import { ActionList } from './components/ActionList';
import { ChecksDetailSection } from './components/ChecksDetailSection';
import { ReviewsDetailSection } from './components/ReviewsDetailSection';
import { ErrorCard } from './components/ErrorCard';
import { Footer } from './components/Footer';
import { githubApi, GitHubApiError } from './services/githubApi';
import { analyzePullRequest } from './analyzer';
import { NormalizedPRData, PRDiagnosis } from './types/analysis';
import { parsePrUrl } from './utils/parsePrUrl';

export const App: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<
    'fetching_pr' | 'checking_ci' | 'checking_reviews' | 'building_diagnosis'
  >('fetching_pr');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<Error | GitHubApiError | null>(null);
  const [prData, setPrData] = useState<NormalizedPRData | null>(null);
  const [diagnosis, setDiagnosis] = useState<PRDiagnosis | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Check URL parameters on mount (e.g. ?pr=dotnet/runtime/pull/119756 or ?url=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prParam = params.get('pr') || params.get('url');
    if (prParam) {
      const fullUrl = prParam.startsWith('http') ? prParam : `https://github.com/${prParam}`;
      setCurrentUrl(fullUrl);
      executeAnalysis(fullUrl);
    }
  }, []);

  const executeAnalysis = async (targetUrl: string) => {
    const parsed = parsePrUrl(targetUrl);
    if (!parsed.isValid || !parsed.owner || !parsed.repo || !parsed.pullNumber) {
      setError(new Error(parsed.error || 'Invalid PR URL'));
      return;
    }

    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setLoadingStep('fetching_pr');
    setStatusMessage(`Connecting to GitHub for ${parsed.owner}/${parsed.repo}#${parsed.pullNumber}...`);

    // Update query param in address bar without reload
    try {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('pr', `${parsed.owner}/${parsed.repo}/pull/${parsed.pullNumber}`);
      window.history.replaceState({}, '', newUrl.toString());
    } catch {
      // ignore
    }

    try {
      const data = await githubApi.fetchPullRequestData(
        parsed.owner,
        parsed.repo,
        parsed.pullNumber,
        (step, msg) => {
          setLoadingStep(step);
          setStatusMessage(msg);
        },
        abortControllerRef.current.signal
      );

      const computedDiagnosis = analyzePullRequest(data);
      setPrData(data);
      setDiagnosis(computedDiagnosis);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // User triggered a newer analysis
      }
      setPrData(null);
      setDiagnosis(null);
      if (err instanceof GitHubApiError || err instanceof Error) {
        setError(err);
      } else {
        setError(new Error('An unexpected error occurred while analyzing the pull request.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (currentUrl) {
      executeAnalysis(currentUrl);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-[#e6edf3]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero & Input */}
        <PrInput
          onAnalyze={(url) => {
            setCurrentUrl(url);
            executeAnalysis(url);
          }}
          isLoading={isLoading}
          initialUrl={currentUrl}
        />

        {/* Loading State */}
        {isLoading && (
          <LoadingState currentStep={loadingStep} statusMessage={statusMessage} />
        )}

        {/* Error Display */}
        {error && !isLoading && (
          <ErrorCard error={error} onRetry={handleRetry} />
        )}

        {/* Analysis Results View */}
        {diagnosis && prData && !isLoading && !error && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Diagnosis Card */}
            <DiagnosisHeader data={prData} diagnosis={diagnosis} />

            {/* Metadata Summary */}
            <PrSummaryCard pr={prData.pullRequest} />

            {/* Blocker Findings ("Why is it stuck?") */}
            <BlockerList blockers={diagnosis.blockers} />

            {/* Action Items ("What should I do next?") */}
            <ActionList actions={diagnosis.actions} />

            {/* Detailed Raw Checks & Reviews Accordions */}
            <div className="pt-4 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8b949e]">
                Underlying Diagnostics
              </h3>
              <ChecksDetailSection
                checkRuns={prData.checkRuns}
                commitStatuses={prData.commitStatuses}
                stats={diagnosis.stats}
              />
              <ReviewsDetailSection
                reviews={prData.reviews}
                requestedReviewers={prData.requestedReviewers}
                requestedTeams={prData.requestedTeams}
                stats={diagnosis.stats}
              />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
