export interface ParsedPrUrl {
  isValid: boolean;
  owner?: string;
  repo?: string;
  pullNumber?: number;
  normalizedUrl?: string;
  error?: string;
}

export function parsePrUrl(rawUrl: string): ParsedPrUrl {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      error: 'Please enter a GitHub Pull Request URL.',
    };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Please enter a GitHub Pull Request URL.',
    };
  }

  // Ensure protocol if missing (e.g. github.com/owner/repo/pull/123)
  let urlStringToParse = trimmed;
  if (!/^https?:\/\//i.test(urlStringToParse)) {
    urlStringToParse = `https://${urlStringToParse}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStringToParse);
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format. Expected: https://github.com/owner/repo/pull/123',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== 'github.com' && hostname !== 'www.github.com') {
    return {
      isValid: false,
      error: `Only GitHub is supported. Found domain: "${hostname}". Expected "github.com".`,
    };
  }

  // Path format: /owner/repo/pull/number or /owner/repo/pull/number/...
  const segments = parsed.pathname.split('/').filter(Boolean);

  if (segments.length >= 3 && segments[2].toLowerCase() === 'issues') {
    return {
      isValid: false,
      error: `This looks like a GitHub Issue (/issues/${segments[3] || ''}), not a Pull Request (/pull/123).`,
    };
  }

  if (segments.length < 4 || segments[2].toLowerCase() !== 'pull') {
    return {
      isValid: false,
      error: 'Invalid Pull Request URL. Expected format: https://github.com/owner/repo/pull/123',
    };
  }

  const owner = segments[0];
  const repo = segments[1];
  const pullNumberStr = segments[3];
  const pullNumber = parseInt(pullNumberStr, 10);

  if (isNaN(pullNumber) || pullNumber <= 0) {
    return {
      isValid: false,
      error: `Invalid PR number "${pullNumberStr}". Must be a positive integer.`,
    };
  }

  // Check valid owner/repo name format
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
    return {
      isValid: false,
      error: 'Invalid GitHub repository name or owner in URL.',
    };
  }

  return {
    isValid: true,
    owner,
    repo,
    pullNumber,
    normalizedUrl: `https://github.com/${owner}/${repo}/pull/${pullNumber}`,
  };
}
