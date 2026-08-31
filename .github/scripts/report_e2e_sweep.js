const INCIDENT_LABEL = 'e2e-sweeper';
const AUTOMATION_LABEL = 'automation';
const INCIDENT_TITLE = 'E2E stale stack cleanup failing';

const ensureLabel = async ({ github, owner, repo, name, color }) => {
  try {
    await github.rest.issues.getLabel({ owner, repo, name });
  } catch (error) {
    if (error.status !== 404) throw error;
    await github.rest.issues.createLabel({ owner, repo, name, color });
  }
};

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

const formatSection = (title, items, format) => {
  if (items.length === 0) return `### ${title}\n\n_None_`;
  return `### ${title}\n\n${items.map((item) => `- ${format(item)}`).join('\n')}`;
};

const formatReport = ({ report, runUrl }) =>
  [
    `Automated E2E stale stack cleanup reported a problem at ${report.timestamp}.`,
    formatSection(
      'Candidates',
      report.candidates,
      (item) =>
        `\`${item.stackName}\` — ${item.status}; ${item.ageHours} hours old; reason: ${item.reason}`
    ),
    formatSection('Deleted', report.deleted, (name) => `\`${name}\``),
    formatSection(
      'Skipped in progress',
      report.skippedInProgress,
      (item) => `\`${item.stackName}\` — ${item.status}`
    ),
    formatSection(
      'Unresolved',
      report.unresolved,
      (item) => `\`${item.stackName}\` — ${item.status}; reason: ${item.reason}`
    ),
    `Discovery failed: **${report.discoveryFailed ? 'yes' : 'no'}**`,
    `[View workflow run](${runUrl})`,
  ].join('\n\n');

module.exports = async ({ github, context, core, report }) => {
  const { owner, repo } = context.repo;
  const runUrl = `${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId}`;
  const isOk =
    report.unresolved.length === 0 &&
    report.skippedInProgress.length === 0 &&
    report.discoveryFailed === false;

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
