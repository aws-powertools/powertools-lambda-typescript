const { LABEL_PENDING_RELEASE, LABEL_RELEASED } = require('./constants');

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
      (issue) => Object(issue).hasOwnProperty('pull_request') === false
    );
  } catch (error) {
    core.setFailed(error);
    throw new Error('Failed to fetch issues');
  }
};

/**
 * Notify new release and close staged GitHub issue
 *
 * @param {object} gh_client - Pre-authenticated REST client (Octokit)
 * @param {string} owner - GitHub Organization
 * @param {string} repository - GitHub repository
 * @param {string} release_version - GitHub Release version
 * @see {@link https://octokit.github.io/rest.js/v18#usage|Octokit client}
 */
const notifyRelease = async ({
  gh_client,
  core,
  owner,
  repository,
  release_version,
}) => {
  const release_url = `https://github.com/${owner}/${repository}/releases/tag/v${release_version.replace(
    /v/g,
    ''
  )}`;

  const issues = await fetchIssues({
    gh_client: gh_client,
    org: owner,
    repository: repository,
    state: 'closed',
  });

  issues.forEach(async (issue) => {
    core.info(`Updating issue number ${issue.number}`);

    const comment = `This is now released under [${release_version}](${release_url}) version!`;
    try {
      await gh_client.rest.issues.createComment({
        owner: owner,
        repo: repository,
        body: comment,
        issue_number: issue.number,
      });
    } catch (error) {
      core.setFailed(error);
      throw new Error(
        `Failed to update issue ${issue.number} about ${release_version} release`
      );
    }

    // Remove staged label; keep existing ones
    const labels = issue.labels
      .filter((label) => label.name != LABEL_PENDING_RELEASE)
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
  const { RELEASE_VERSION } = process.env;
  core.info(`Running post-release script for ${RELEASE_VERSION} version`);

  await notifyRelease({
    gh_client: github,
    core,
    owner: context.repo.owner,
    repository: context.repo.repo,
    release_version: RELEASE_VERSION,
  });
};
