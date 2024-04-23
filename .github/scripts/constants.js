module.exports = Object.freeze({
  /** @type {string} */
  // Values: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request
  "PR_ACTION": process.env.PR_ACTION?.replace(/"/g, '') || "",

  /** @type {string} */
  "PR_AUTHOR": process.env.PR_AUTHOR?.replace(/"/g, '') || "",

  /** @type {string} */
  "PR_BODY": process.env.PR_BODY || "",

  /** @type {string} */
  "PR_TITLE": process.env.PR_TITLE || "",

  /** @type {number} */
  "PR_NUMBER": process.env.PR_NUMBER || 0,

  /** @type {string} */
  "PR_IS_MERGED": process.env.PR_IS_MERGED || "false",

  /** @type {string} */
  "LABEL_BLOCK": "do-not-merge",

  /** @type {string} */
  "LABEL_BLOCK_REASON": "need-issue",

  /** @type {string} */
  "LABEL_PENDING_RELEASE": "pending-release",
  
  /** @type {string} */
  "LABEL_RELEASED": "completed",

  /** @type {string} */
  "HANDLE_MAINTAINERS_TEAM": "@aws-powertools/lambda-typescript",

  /** @type {string[]} */
  "IGNORE_AUTHORS": ["dependabot[bot]"],

  /** @type {RegExp} */
  "RELATED_ISSUE_REGEX": /\b\*{0,2}[iI]ssue [nN]umber\*{0,2}:\*{0,2}\s*(?<closingWord>closes?|closed|fix|fixes?|fixed|resolves?|resolved)?\s*#(?<issue>\d+)\b/
});