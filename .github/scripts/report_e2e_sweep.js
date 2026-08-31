const INCIDENT_LABEL = 'e2e-sweeper';
const AUTOMATION_LABEL = 'automation';
const INCIDENT_TITLE = 'E2E stale stack cleanup failing';
const MAX_SECTION_ENTRIES = 50;
const MAX_BODY_LENGTH = 60_000;

/** Ensure an issue label exists, tolerating concurrent creation. */
const ensureLabel = async ({ github, owner, repo, name, color }) => {
  try {
    await github.rest.issues.getLabel({ owner, repo, name });
  } catch (error) {
    if (error.status !== 404) throw error;
    try {
      await github.rest.issues.createLabel({ owner, repo, name, color });
    } catch (createError) {
      const alreadyExists =
        createError.status === 422 ||
        createError.response?.data?.errors?.some(
          (labelError) => labelError.code === 'already_exists'
        );
      if (!alreadyExists) throw createError;
    }
  }
};

/** Find the open incident issue managed by the sweeper. */
const findIncident = async ({ github, owner, repo }) => {
  const { data: issues } = await github.rest.issues.listForRepo({
    owner,
    repo,
    state: 'open',
    labels: INCIDENT_LABEL,
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

/** Create, update, or close the stale-stack incident issue. */
const reportE2eSweep = async ({ github, context, core, report }) => {
  const { owner, repo } = context.repo;
  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  const isOk = report.ok === true;

  await ensureLabel({
    github,
    owner,
    repo,
    name: INCIDENT_LABEL,
    color: 'b60205',
  });
  await ensureLabel({
    github,
    owner,
    repo,
    name: AUTOMATION_LABEL,
    color: '0e8a16',
  });

  const incident = await findIncident({ github, owner, repo });

  if (!isOk) {
    const body = formatReport({ report, runUrl });
    if (incident === undefined) {
      const { data: issue } = await github.rest.issues.create({
        owner,
        repo,
        title: INCIDENT_TITLE,
        body,
        labels: [INCIDENT_LABEL, AUTOMATION_LABEL],
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
    return;
  }

  if (incident !== undefined) {
    await github.rest.issues.createComment({
      owner,
      repo,
      issue_number: incident.number,
      body: `The E2E test account is clean. [View workflow run](${runUrl}).`,
    });
    await github.rest.issues.update({
      owner,
      repo,
      issue_number: incident.number,
      state: 'closed',
    });
    core.info(`Closed incident issue #${incident.number}`);
  }
};

module.exports = reportE2eSweep;
module.exports.formatReport = formatReport;
