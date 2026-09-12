import { describe, it, expect } from 'vitest';
import { parsePrUrl } from '../utils/parsePrUrl';

describe('parsePrUrl', () => {
  it('correctly parses a standard GitHub PR URL', () => {
    const result = parsePrUrl('https://github.com/dotnet/runtime/pull/119756');
    expect(result.isValid).toBe(true);
    expect(result.owner).toBe('dotnet');
    expect(result.repo).toBe('runtime');
    expect(result.pullNumber).toBe(119756);
    expect(result.normalizedUrl).toBe('https://github.com/dotnet/runtime/pull/119756');
  });

  it('handles URLs with trailing slashes', () => {
    const result = parsePrUrl('https://github.com/facebook/react/pull/28000/');
    expect(result.isValid).toBe(true);
    expect(result.owner).toBe('facebook');
    expect(result.repo).toBe('react');
    expect(result.pullNumber).toBe(28000);
  });

  it('handles subpaths like /files and /commits', () => {
    const resultFiles = parsePrUrl('https://github.com/microsoft/vscode/pull/999/files');
    expect(resultFiles.isValid).toBe(true);
    expect(resultFiles.pullNumber).toBe(999);

    const resultCommits = parsePrUrl('https://github.com/microsoft/vscode/pull/999/commits');
    expect(resultCommits.isValid).toBe(true);
    expect(resultCommits.pullNumber).toBe(999);
  });

  it('handles hash anchors and query params', () => {
    const result = parsePrUrl('https://github.com/owner/repo/pull/42#issuecomment-987654');
    expect(result.isValid).toBe(true);
    expect(result.pullNumber).toBe(42);
  });

  it('handles URLs without protocol prefix', () => {
    const result = parsePrUrl('github.com/owner/my-repo/pull/123');
    expect(result.isValid).toBe(true);
    expect(result.owner).toBe('owner');
    expect(result.repo).toBe('my-repo');
    expect(result.pullNumber).toBe(123);
  });

  it('rejects GitHub Issue URLs with a helpful message', () => {
    const result = parsePrUrl('https://github.com/owner/repo/issues/55');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Issue');
  });

  it('rejects non-GitHub domains', () => {
    const result = parsePrUrl('https://gitlab.com/owner/repo/pull/123');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Only GitHub is supported');
  });

  it('rejects invalid PR numbers or repo-only URLs', () => {
    const resultRepo = parsePrUrl('https://github.com/owner/repo');
    expect(resultRepo.isValid).toBe(false);

    const resultNan = parsePrUrl('https://github.com/owner/repo/pull/abc');
    expect(resultNan.isValid).toBe(false);
  });

  it('rejects empty input', () => {
    const result = parsePrUrl('');
    expect(result.isValid).toBe(false);
  });
});
