import { PRDiagnosis, NormalizedPRData } from '../types/analysis';

export function generateMarkdownReport(data: NormalizedPRData, diagnosis: DiagnosisStatusReport): string {
  const pr = data.pullRequest;
  const statusEmoji =
    diagnosis.status === 'BLOCKED' ? '🔴' : diagnosis.status === 'WAITING' ? '🟡' : '🟢';

  let md = `## PR Doctor Diagnosis: ${statusEmoji} ${diagnosis.status}\n\n`;
  md += `**PR:** [#${pr.number} ${pr.title}](${pr.html_url})\n`;
  const repoName = pr.base?.repo?.full_name || pr.base.ref;
  md += `**Repo:** \`${repoName}\` | **Author:** @${pr.user.login} | **Branch:** \`${pr.head.ref}\` -> \`${pr.base.ref}\`\n\n`;

  md += `### Why is it stuck?\n\n`;
  if (diagnosis.blockers.length === 0) {
    md += `- 🟢 No blockers detected.\n`;
  } else {
    for (const blocker of diagnosis.blockers) {
      const bEmoji =
        blocker.severity === 'critical' ? '🔴' : blocker.severity === 'warning' ? '🟡' : 'ℹ️';
      md += `- ${bEmoji} **${blocker.title}**: ${blocker.description}\n`;
      if (blocker.action) {
        md += `  - *Action:* ${blocker.action}\n`;
      }
    }
  }

  if (diagnosis.actions.length > 0) {
    md += `\n### What should I do next?\n\n`;
    diagnosis.actions.forEach((action, idx) => {
      md += `${idx + 1}. ${action}\n`;
    });
  }

  md += `\n---\n*Diagnosed by [PR Doctor](https://skydevlab.github.io/pr-doctor/) · SkyDevLab*`;
  return md;
}

type DiagnosisStatusReport = PRDiagnosis;
