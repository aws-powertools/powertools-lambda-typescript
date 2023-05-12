const {
  PR_ACTION,
  PR_AUTHOR,
  PR_BODY,
  PR_NUMBER,
  IGNORE_AUTHORS,
  LABEL_BLOCK,
  LABEL_BLOCK_REASON,
  RELATED_ISSUE_REGEX,
} = require("./constants");

module.exports = async ({ github, context, core }) => {
  if (IGNORE_AUTHORS.includes(PR_AUTHOR)) {
    return core.notice("Author in IGNORE_AUTHORS list; skipping...");
  }

  if (!["opened"].includes(PR_ACTION)) {
    return core.notice(
      "Only newly opened PRs are labelled to avoid spam; skipping"
    );
  }

  const isMatch = RELATED_ISSUE_REGEX.exec(PR_BODY);
  if (isMatch == null) {
    core.info(
      `No related issue found, maybe the author didn't use the template but there is one.`
    );

    let msg =
      "No related issues found. Please ensure there is an open issue related to this change to avoid significant delays or closure.";
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: msg,
      issue_number: PR_NUMBER,
    });

    return await github.rest.issues.addLabels({
      issue_number: PR_NUMBER,
      owner: context.repo.owner,
      repo: context.repo.repo,
      labels: [LABEL_BLOCK, LABEL_BLOCK_REASON],
    });
  } else {
    const { closingWord, issue } = isMatch.groups;
    core.info(
      `Found related issue #${issue} ${
        closingWord === undefined
          ? "without closing word"
          : `with closing word ${closingWord}`
      }`
    );
  }
};
