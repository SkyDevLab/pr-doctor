export function formatRelativeTime(dateString: string | number | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'just now';
  }
  if (diffMin === 1) {
    return '1 minute ago';
  }
  if (diffMin < 60) {
    return `${diffMin} minutes ago`;
  }
  if (diffHour === 1) {
    return '1 hour ago';
  }
  if (diffHour < 24) {
    return `${diffHour} hours ago`;
  }
  if (diffDay === 1) {
    return 'yesterday';
  }
  if (diffDay < 30) {
    return `${diffDay} days ago`;
  }
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth === 1) {
    return '1 month ago';
  }
  if (diffMonth < 12) {
    return `${diffMonth} months ago`;
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatResetTime(resetEpochSeconds: number): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const remainingSec = Math.max(0, resetEpochSeconds - nowSec);

  if (remainingSec <= 0) {
    return 'now';
  }

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

export function formatDateShort(dateString: string): string {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
