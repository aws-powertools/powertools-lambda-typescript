const INCIDENT_TITLE = 'E2E stale stack cleanup failing';
const MAX_SECTION_ENTRIES = 50;
const MAX_BODY_LENGTH = 60_000;

/** Find the open incident issue by its exact title. */
const findIncident = async ({ github, owner, repo }) => {
  const { data: issues } = await github.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    per_page: 100,
  });

  return issues.find(
    (issue) =>
      issue.title === INCIDENT_TITLE && issue.pull_request === undefined
  );
};

/** Render one bounded report section as Markdown. */
const formatSection = (title, items, format, runUrl) => {
  if (items.length === 0) return `### ${title}\n\n_None_`;
  const visibleItems = items.slice(0, MAX_SECTION_ENTRIES);
  const lines = visibleItems.map((item) => `- ${format(item)}`);
  const hiddenCount = items.length - visibleItems.length;
  if (hiddenCount > 0) {
    lines.push(
      `- …and ${hiddenCount} more — see the [workflow run](${runUrl})`
    );
  }
  return `### ${title}\n\n${lines.join('\n')}`;
};

/** Render a bounded sweep report for job summaries and incident issues. */
const formatReport = ({ report, runUrl }) => {
  const body = [
    '# E2E stale stack sweep',
    `- Mode: **${report.dryRun ? 'dry run' : 'cleanup'}**\n- Timestamp: ${report.timestamp}\n- Discovery failed: ${report.discoveryFailed ? 'yes' : 'no'}`,
    formatSection(
      'Candidates',
      report.candidates,
      (item) =>
        `\`${item.stackName}\` — ${item.status}; ${item.ageHours} hours old; reason: ${item.reason}`,
      runUrl
    ),
    formatSection('Deleted', report.deleted, (name) => `\`${name}\``, runUrl),
    formatSection(
      'Skipped in progress',
      report.skippedInProgress,
      (item) => `\`${item.stackName}\` — ${item.status}`,
      runUrl
    ),
    formatSection(
      'Unresolved',
      report.unresolved,
      (item) =>
        `\`${item.stackName}\` — ${item.status}; reason: ${item.reason}`,
      runUrl
    ),
    `[View workflow run](${runUrl})`,
  ].join('\n\n');

  if (body.length <= MAX_BODY_LENGTH) return body;
  const suffix = `\n\n_Report truncated — see the [workflow run](${runUrl})._`;
  return `${body.slice(0, MAX_BODY_LENGTH - suffix.length)}${suffix}`;
};

/** Create or update the stale-stack incident issue after a failed sweep. */
const reportE2eSweep = async ({ github, context, core, report }) => {
  const { owner, repo } = context.repo;
  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  if (report.ok === true) {
    core.info('Sweep completed without an incident');
    return;
  }

  const incident = await findIncident({ github, owner, repo });
  const body = formatReport({ report, runUrl });
  if (incident === undefined) {
    const { data: issue } = await github.rest.issues.create({
      owner,
      repo,
      title: INCIDENT_TITLE,
      body,
    });
    core.info(`Created incident issue #${issue.number}`);
    return;
  }

  await github.rest.issues.createComment({
    owner,
    repo,
    issue_number: incident.number,
    body,
  });
  core.info(`Updated incident issue #${incident.number}`);
};

export { formatReport, reportE2eSweep as default };
