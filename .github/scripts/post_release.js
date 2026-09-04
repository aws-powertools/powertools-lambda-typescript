const LABEL_PENDING_RELEASE = 'pending-release';

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
 * Removes the 'pending-release' label from each closed issue, since a closed
 * issue in a published release has shipped. GitHub natively links releases to
 * issues, so no comment is needed.
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

  for (const issue of issues) {
    core.info(`Removing ${LABEL_PENDING_RELEASE} from issue ${issue.number}`);

    try {
      await gh_client.rest.issues.removeLabel({
        repo: repository,
        owner,
        issue_number: issue.number,
        name: LABEL_PENDING_RELEASE,
      });
    } catch (error) {
      core.setFailed(error);
      throw new Error('Failed to remove label from issue');
    }

    core.info(`Issue ${issue.number} updated`);
  }
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
