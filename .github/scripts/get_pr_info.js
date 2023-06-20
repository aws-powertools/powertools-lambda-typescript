module.exports = async ({ github, context, core }) => {
  const prNumber = process.env.PR_NUMBER;

  if (prNumber === '') {
    core.setFailed(`No PR number was passed. Aborting`);
  }

  // Remove the `#` prefix from the PR number if it exists
  const prNumberWithoutPrefix = prNumber.replace('#', '');

  try {
    const {
      data: { head, base },
    } = await github.rest.pulls.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: prNumberWithoutPrefix,
    });

    core.setOutput('headRef', head.ref);
    core.setOutput('headSHA', head.sha);
    core.setOutput('baseRef', base.ref);
    core.setOutput('baseSHA', base.sha);
  } catch (error) {
    core.setFailed(
      `Unable to retrieve info from PR number ${prNumber}.\n\n Error details: ${error}`
    );
    throw error;
  }
};
