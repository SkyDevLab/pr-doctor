# 🩺 PR Doctor

> **Diagnose why your GitHub Pull Request is stuck.**  
> A zero-backend, 100% client-side developer tool deployed directly on GitHub Pages.

[![Deploy PR Doctor to GitHub Pages](https://github.com/SkyDevLab/pr-doctor/actions/workflows/deploy.yml/badge.svg)](https://github.com/SkyDevLab/pr-doctor/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat&logo=github)](https://skydevlab.github.io/pr-doctor/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 What is PR Doctor?

**PR Doctor** answers a single question that developers, reviewers, and engineering managers ask every day:

> **“Why is my GitHub Pull Request stuck?”**

Paste any public GitHub Pull Request URL, and PR Doctor calls GitHub's public REST API directly from your browser to analyze the PR, identify CI failures, review states, merge conflicts, and draft statuses, and provide a clear, prioritized checklist of next steps.

---

## 💡 Why Does It Exist?

GitHub pull request pages are rich in information, but that information is often scattered across multiple tabs, folding sections, sub-menus, and workflow run outputs:
- A test failed 14 levels deep in a CI matrix.
- A reviewer requested changes weeks ago on an outdated commit.
- A teammate was requested as a reviewer, but the author assumes someone else is reviewing.
- The PR branch is dirty or conflicts with the base branch.

PR Doctor synthesizes all this data into a single, high-contrast diagnosis dashboard with immediate action items.

---

## 🔒 Client-Side & Security Model

> [!IMPORTANT]
> **PR Doctor is a client-side application. GitHub API requests are made directly from the user's browser.**

- **Zero backend, zero database, zero proxy servers.**
- **No stored credentials**: PR Doctor does not ask for, store, or accept Personal Access Tokens (PATs) or passwords.
- **Zero data tracking**: Repository code and metadata are analyzed strictly in-memory in your local browser session and are never transmitted to external analytics or third-party servers.

---

## 📊 Overall Diagnosis States

PR Doctor uses a deterministic rules engine to classify pull requests into three primary states:

| Status | Meaning | Conditions |
|---|---|---|
| **🔴 BLOCKED** | Critical blocker prevents merging | Failing CI check runs, changes requested by reviewers, merge conflicts (`dirty`), or closed unmerged state |
| **🟡 WAITING** | Waiting on actions or reviews | Draft status, CI checks still in progress / queued, or pending reviewer requests |
| **🟢 READY** | Appears ready to merge | Passing CI checks, approvals recorded (if applicable), clean mergeable state, no requested changes |

---

## 🏗 Architecture & Design

PR Doctor decouples GitHub API ingestion from diagnostic analysis:

```
                  ┌───────────────────────────────┐
                  │          User Input           │
                  │   (PR URL or Query Param)     │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │       URL Parser & Utils      │
                  │   Validation & Normalization  │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │       GitHub API Service      │
                  │  - In-memory Caching          │
                  │  - Request Deduplication      │
                  │  - Dynamic Rate-Limit Parser  │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │      Deterministic Engine     │
                  │  - CI Rules (Runs & Statuses) │
                  │  - Review Decision Rules      │
                  │  - Merge Conflict Rules       │
                  │  - Draft Rules                │
                  │  - Activity & Staleness Rules │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │     Modern Developer UI       │
                  │  - Diagnosis Header & Banner  │
                  │  - Priority Blocker List      │
                  │  - Actionable Step Checklist  │
                  │  - Deep Diagnostics Modal     │
                  │  - Markdown Export for Slack  │
                  └───────────────────────────────┘
```

### GitHub API Endpoints Used

PR Doctor makes selective requests to minimize API quota consumption:

1. **Pull Request Details**:
   - `GET /repos/{owner}/{repo}/pulls/{number}`
   - Fetches title, author, base/head branches, additions/deletions, draft status, mergeable state, and requested reviewers.
2. **CI Check Runs**:
   - `GET /repos/{owner}/{repo}/commits/{head_sha}/check-runs`
   - Fetches GitHub Actions check runs, conclusions (success, failure, cancelled, timed_out, skipped), and workflow URLs.
3. **Legacy Commit Statuses**:
   - `GET /repos/{owner}/{repo}/commits/{head_sha}/status`
   - Aggregates external CI providers (e.g. Jenkins, TeamCity, CircleCI) that report via commit statuses.
4. **Pull Request Reviews**:
   - `GET /repos/{owner}/{repo}/pulls/{number}/reviews`
   - Analyzes latest chronological review states per user (`APPROVED`, `CHANGES_REQUESTED`, `COMMENTED`, `DISMISSED`).

---

## ⏱ GitHub API Rate Limits

GitHub provides **60 requests per hour per IP** for unauthenticated public REST API requests.

### How PR Doctor Handles Rate Limits:
- **Dynamic Header Tracking**: Automatically inspects `x-ratelimit-limit`, `x-ratelimit-remaining`, and `x-ratelimit-reset` headers on every response.
- **Header Badge & Countdown**: The navigation bar displays live remaining requests (`X / 60 reqs`) and a real-time countdown to quota reset.
- **In-Memory Caching & Deduplication**: Repeated queries for the same PR within a 3-minute session are served from memory to preserve rate limits.
- **Friendly Error Guidance**: If the rate limit is reached, a dedicated card displays the exact time until reset.

---

## 🛠 Local Development

### Prerequisites
- Node.js 18+ (tested on Node 20+)
- npm 9+

### Setup & Run

```bash
# 1. Clone the repository
git clone https://github.com/SkyDevLab/pr-doctor.git
cd pr-doctor

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Run automated test suite (Vitest)
npm run test

# 5. Build for production
npm run build
```

---

## 🚀 GitHub Pages Deployment

PR Doctor is configured for deployment to GitHub Pages at:

```
https://skydevlab.github.io/pr-doctor/
```

### Configuration Highlights:
- **Vite Base Path**: Configured dynamically via `VITE_BASE_PATH: /pr-doctor/` for production builds and `/` for local development.
- **GitHub Actions Workflow**: `.github/workflows/deploy.yml` automatically tests, builds, and deploys the `./dist` folder to GitHub Pages on every push to `main`.
- **SPA Fallback**: `public/404.html` provides a lightweight client-side redirect script ensuring direct visits or refreshes on deep URLs work without server configuration.

---

## ⚠️ Current Limitations (V1 MVP)

1. **Public Repositories Only**: Since PR Doctor operates without user credentials, it cannot inspect private GitHub repositories.
2. **Unresolved Comment Threads**: The GitHub REST API does not expose the `isResolved` boolean on review comments (that property is currently exclusive to GitHub's GraphQL API). PR Doctor detects comment discussion activity, but does not falsely guess conversation resolution status.
3. **Repository Branch Protection Mandates**: GitHub REST endpoints do not expose branch protection settings (such as minimum required approvals) to unauthenticated visitors. Reviewer requests are surfaced as pending requests rather than assumed requirements.

---

## 🗺 Future Roadmap

- [ ] **GitHub App / OAuth Integration**: Enable opt-in authentication for higher rate limits (5,000 req/hr) and private repository diagnostics.
- [ ] **GraphQL Engine**: Authoritative thread resolution detection (`PullRequestReviewThread.isResolved`).
- [ ] **Browser Extension**: One-click PR Doctor diagnostics embedded directly on GitHub pull request pages.
- [ ] **Saved History**: Local browser history of previously diagnosed PRs.
- [ ] **CI Log Deep Dive**: Automated parsing of stack traces and failure summaries in test logs.

---

## 📄 License

MIT License &copy; 2026 **SkyDevLab**.
