const { PR_NUMBER, PR_TITLE } = require('./constants');

module.exports = async ({ github, context, core }) => {
  const BUG_REGEX = /(fix|bug)(\((.+)\))?(:.+)/;
  const ENHANCEMENT_REGEX = /(refactor|improv)(\((.+)\))?(:.+)/;
  const FEAT_REFACTOR_REGEX = /(feat)(\((.+)\))?(:.+)/;
  const DEPRECATED_REGEX = /(deprecated)(\((.+)\))?(:.+)/;

  const labels = {
    feature: FEAT_REFACTOR_REGEX,
    bug: BUG_REGEX,
    deprecation: DEPRECATED_REGEX,
    enhancement: ENHANCEMENT_REGEX,
  };

  // Maintenance: We should keep track of modified PRs in case their titles change
  let miss = 0;
  try {
    for (const label in labels) {
      const matcher = new RegExp(labels[label]);
      const matches = matcher.exec(PR_TITLE);
      if (matches != null) {
        core.info(`Auto-labeling PR ${PR_NUMBER} with ${label}`);

        await github.rest.issues.addLabels({
          issue_number: PR_NUMBER,
          owner: context.repo.owner,
          repo: context.repo.repo,
          labels: [label],
        });

        return;
      } else {
        core.debug(`'${PR_TITLE}' didn't match '${label}' semantic.`);
        miss += 1;
      }
    }
  } finally {
    if (miss == Object.keys(labels).length) {
      core.notice(
        `PR ${PR_NUMBER} title '${PR_TITLE}' contain any of the release-related types; skipping...`
      );
    }
  }
};
