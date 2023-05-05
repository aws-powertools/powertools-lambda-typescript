const {
  PR_AUTHOR,
  PR_BODY,
  PR_NUMBER,
  IGNORE_AUTHORS,
  LABEL_PENDING_RELEASE,
  HANDLE_MAINTAINERS_TEAM,
  PR_IS_MERGED,
  RELATED_ISSUE_REGEX,
} = require("./constants");

module.exports = async ({ github, context, core }) => {
  if (IGNORE_AUTHORS.includes(PR_AUTHOR)) {
    return core.notice("Author in IGNORE_AUTHORS list; skipping...");
  }

  if (PR_IS_MERGED == "false") {
    return core.notice("Only merged PRs to avoid spam; skipping");
  }

  const isMatch = RELATED_ISSUE_REGEX.exec(PR_BODY);
  try {
    if (!isMatch) {
      core.setFailed(
        `Unable to find related issue for PR number ${PR_NUMBER}.\n\n Body details: ${PR_BODY}`
      );
      return await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `${HANDLE_MAINTAINERS_TEAM} No related issues found. Please ensure '${LABEL_PENDING_RELEASE}' label is applied before releasing.`,
        issue_number: PR_NUMBER,
      });
    }
  } catch (error) {
    core.setFailed(
      `Unable to create comment on PR number ${PR_NUMBER}.\n\n Error details: ${error}`
    );
    throw new Error(error);
  }

  const {
    groups: { issue },
  } = isMatch;

  let currentLabels = [];
  try {
    core.info(`Getting labels for issue ${issue}`);
    currentLabels = await github.rest.issues.listLabelsOnIssue({
      issue_number: issue,
      owner: context.repo.owner,
      repo: context.repo.repo,
    });
  } catch (error) {
    core.setFailed(
      `Unable to get labels for issue ${issue}.\n\n Error details: ${error}`
    );
    throw new Error(error);
  }

  /**
   * Keep all labels except those that start with 'status/' or 'need-' or equal to 'help-wanted'
   * as those are contextual to issues still in progress.
   */
  const newLabels = currentLabels.data
    .filter(
      (label) =>
        !label.name.startsWith("status/") &&
        !label.name.startsWith("need-") &&
        label.name !== "help-wanted"
    )
    .map((label) => label.name);
  // Add the status/pending-release label
  newLabels.push(LABEL_PENDING_RELEASE);

  try {
    core.info(
      `Auto-labeling related issue ${issue} for release while removing 'status/*' and 'need-*' labels`
    );
    return await github.rest.issues.setLabels({
      issue_number: issue,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: newLabels,
    });
  } catch (error) {
    core.setFailed(
      `Is this issue number (${issue}) valid? Perhaps a discussion?`
    );
    throw new Error(error);
  }
};
