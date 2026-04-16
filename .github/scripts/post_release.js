const LABEL_PENDING_RELEASE = 'pending-release';
const LABEL_RELEASED = 'completed';

/**
 * Fetch issues using GitHub REST API
 *
 * @param {object} gh_client - Pre-authenticated REST client (Octokit)
 * @param {string} org - GitHub Organization
 * @param {string} repository - GitHub repository
 * @param {string} state - GitHub issue state (open, closed)
 * @param {string} label - Comma-separated issue labels to fetch
 * @return {Object[]} issues - Array of issues matching params
 * @see {@link https://octokit.github.io/rest.js/v18#usage|Octokit client}
 */
const fetchIssues = async ({
  gh_client,
  core,
  org,
  repository,
  state = 'all',
  label = LABEL_PENDING_RELEASE,
}) => {
  try {
    const { data: issues } = await gh_client.rest.issues.listForRepo({
      owner: org,
      repo: repository,
      state: state,
      labels: label,
    });

    return issues.filter(
      (issue) => Object.hasOwn(Object(issue), 'pull_request') === false
    );
  } catch (error) {
    core.setFailed(error);
    throw new Error('Failed to fetch issues');
  }
};

/**
 * Update labels on closed issues that are pending release
 *
 * Swaps the 'pending-release' label to 'completed' on each closed issue.
 * GitHub natively links releases to issues, so no comment is needed.
 *
 * @param {object} gh_client - Pre-authenticated REST client (Octokit)
 * @param {string} owner - GitHub Organization
 * @param {string} repository - GitHub repository
 * @see {@link https://octokit.github.io/rest.js/v18#usage|Octokit client}
 */
const updateLabels = async ({ gh_client, core, owner, repository }) => {
  const issues = await fetchIssues({
    gh_client: gh_client,
    org: owner,
    repository: repository,
    state: 'closed',
  });

  issues.forEach(async (issue) => {
    core.info(`Updating labels for issue number ${issue.number}`);

    // Remove staged label; keep existing ones
    const labels = issue.labels
      .filter((label) => label.name !== LABEL_PENDING_RELEASE)
      .map((label) => label.name);

    // Update labels including the released one
    try {
      await gh_client.rest.issues.setLabels({
        repo: repository,
        owner,
        issue_number: issue.number,
        labels: [...labels, LABEL_RELEASED],
      });
    } catch (error) {
      core.setFailed(error);
      throw new Error('Failed to label issue');
    }

    core.info(`Issue number ${issue.number} labeled`);
  });
};

// context: https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts
module.exports = async ({ github, context, core }) => {
  core.info('Running post-release label update');

  await updateLabels({
    gh_client: github,
    core,
    owner: context.repo.owner,
    repository: context.repo.repo,
  });
};
