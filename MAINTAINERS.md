## Table of contents <!-- omit in toc -->

- [Overview](#overview)
- [Current Maintainers](#current-maintainers)
- [Emeritus](#emeritus)
- [Labels](#labels)
- [Maintainer Responsibilities](#maintainer-responsibilities)
  - [Uphold Code of Conduct](#uphold-code-of-conduct)
  - [Prioritize Security](#prioritize-security)
  - [Review Pull Requests](#review-pull-requests)
  - [Merging Pull Requests](#merging-pull-requests)
  - [Triage New Issues](#triage-new-issues)
  - [Triage Bug Reports](#triage-bug-reports)
  - [Triage RFCs](#triage-rfcs)
  - [Run end to end tests](#run-end-to-end-tests)
  - [Releasing a new version](#releasing-a-new-version)
    - [Drafting release notes](#drafting-release-notes)
  - [Releasing a documentation hotfix](#releasing-a-documentation-hotfix)
  - [Maintain Overall Health of the Repo](#maintain-overall-health-of-the-repo)
  - [Manage Roadmap](#manage-roadmap)
  - [Add Continuous Integration Checks](#add-continuous-integration-checks)
  - [Negative Impact on the Project](#negative-impact-on-the-project)
  - [Becoming a maintainer](#becoming-a-maintainer)
- [Common scenarios](#common-scenarios)
  - [Contribution is stuck](#contribution-is-stuck)
  - [Insufficient feedback or information](#insufficient-feedback-or-information)
  - [Crediting contributions](#crediting-contributions)
  - [Is that a bug?](#is-that-a-bug)
  - [Mentoring contributions](#mentoring-contributions)
  - [Long running issues or PRs](#long-running-issues-or-prs)
- [Automation](#automation)

## Overview

> **Please treat this content as a living document.**

This is document explains who the maintainers are (see below), what they do in this repo, and how they should be doing it. If you're interested in contributing, see [CONTRIBUTING](CONTRIBUTING.md).

## Current Maintainers

| Maintainer         | GitHub ID                                   | Affiliation |
| ------------------ | ------------------------------------------- | ----------- |
| Andrea Amorosi     | [dreamorosi](https://github.com/dreamorosi) | Amazon      |
| Alexander Schueren | [am29d](https://github.com/am29d)           | Amazon      |

## Emeritus

Previous active maintainers who contributed to this project.

| Maintainer                 | GitHub ID                                     | Affiliation |
| -------------------------- | --------------------------------------------- | ----------- |
| Sara Gerion                | [saragerion](https://github.com/saragerion)   | Amazon      |
| Florian Chazal             | [flochaz](https://github.com/flochaz)         | Amazon      |
| Chadchapol Vittavutkarnvej | [ijemmy](https://github.com/ijemmy)           | Booking.com |
| Alan Churley               | [alan-churley](alan-churley)                  | CloudCall   |
| Bahr Michael               | [bahrmichael](https://github.com/bahrmichael) | Stedi       |

## Labels

These are the most common labels used by maintainers to triage issues, pull requests (PR), and for project management:

| Label                                  | Usage                                                                                          | Notes                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| triage                                 | New issues that require maintainers review                                                     | Issue template                                     |
| area/documentation                     | Improvements or additions to documentation                                                     | Examples/Readme files; Doc additions, fixes, etc.; |
| area/logger                            | Items related to the Logger Utility                                                            | PR automation                                      |
| area/metrics                           | Items related to the Metrics Utility                                                           | PR automation                                      |
| area/tracer                            | Items related to the Tracer Utility                                                            | PR automation                                      |
| area/idempotency                       | Items related to the Idempotency Utility                                                       | PR automation                                      |
| area/parameters                        | Items related to the Parameters Utility                                                        | PR automation                                      |
| area/commons                           | Items related to the Commons Utility                                                           | PR automation                                      |
| area/jmespath                          | Items related to the JMESPath Utility                                                          | PR automation                                      |
| area/validation                        | Items related to the Validation Utility                                                        | PR automation                                      |
| area/batch                             | Items related to the Batch Processing Utility                                                  | PR automation                                      |
| area/parser                            | Items related to the Parser Utility                                                            | PR automation                                      |
| area/automation                        | Items related to automation like GitHub workflows or CI/CD                                     | PR automation                                      |
| area/layers                            | Items related to the Lambda Layers pipeline                                                    | PR automation                                      |
| size/XS                                | PRs between 0-9 LOC                                                                            | PR automation                                      |
| size/S                                 | PRs between 10-29 LOC                                                                          | PR automation                                      |
| size/M                                 | PRs between 30-99 LOC                                                                          | PR automation                                      |
| size/L                                 | PRs between 100-499 LOC                                                                        | PR automation                                      |
| size/XL                                | PRs between 500-999 LOC, often PRs that grown with feedback                                    | PR automation                                      |
| size/XXL                               | PRs with 1K+ LOC, largely documentation related                                                | PR automation                                      |
| customer-reference                     | Authorization to use company name in our documentation                                         | Public Relations                                   |
| community-content                      | Suggested content to feature in our documentation                                              | Public Relations                                   |
| do-not-merge                           | PRs that are blocked for varying reasons                                                       | Timeline is uncertain                              |
| type/bug                               | Unexpected, reproducible and unintended software behavior                                      | PR/Release automation; Doc snippets are excluded;  |
| type/bug-upstream                      | Bug caused by upstream dependency                                                              |                                                    |
| type/not-a-bug                         | New and existing bug reports incorrectly submitted as bug                                      | Analytics                                          |
| type/deprecation                       | This item contains code deprecation                                                            |                                                    |
| type/duplicate                         | This issue is a duplicate of an existing one                                                   | Analytics                                          |
| type/feature-request                   | Issue requesting new or enhancements to existing features                                      | Issue template                                     |
| type/feature                           | PRs that introduce new features                                                                | PR automation                                      |
| type/enhancement                       | PRs that introduce minor changes, usually to existing features                                 | PR automation                                      |
| type/RFC                               | Technical design documents related to a feature request                                        |                                                    |
| type/internal                          | PRs that introduce changes in governance, tech debt and chores (linting setup, baseline, etc.) | PR automation                                      |
| type/tests                             | PRs that add or change tests                                                                   | PR automation                                      |
| type/dependencies                      | Changes that touch dependencies, e.g. Dependabot, etc.                                         | Issues/PR automation                               |
| type/breaking-change                   | Changes that will cause customer impact and need careful triage                                |                                                    |
| status/blocked                         | Items which progress is blocked by external dependency or reason                               |                                                    |
| status/confirmed                       | Items with clear scope and that are ready for implementation                                   |                                                    |
| status/discussing                      | Items that need to be discussed, elaborated, or refined                                        |                                                    |
| status/on-hold                         | Items that are on hold and will be revisited in the future                                     |                                                    |
| status/pending-release                 | Merged changes that will be available soon                                                     | Release automation auto-closes/notifies it         |
| status/completed                       | Items that are complete and have been merged and/or shipped                                    |                                                    |
| status/rejected                        | This is something we will not be working on. At least, not in the measurable future            |                                                    |
| status/pending-close-response-required | This issue will be closed soon unless the discussion moves forward                             | Stale Automation                                   |
| good-first-issue                       | Something that is suitable for those who want to start contributing                            |                                                    |
| help-wanted                            | Tasks you want help from anyone to move forward                                                | Bandwidth, complex topics, etc.                    |
| need-customer-feedback                 | Tasks that need more feedback before proceeding                                                | 80/20% rule, uncertain, etc.                       |
| need-more-information                  | Missing information before making any calls                                                    | Signal that investigation or answers are needed    |
| need-response                          | Requires a response from a customer and might be automatically closed if none is received      | Marked as stale after 2 weeks, and closed after 3  |
| need-issue                             | PR is missing a related issue for tracking change                                              |                                                    |

## Maintainer Responsibilities

Maintainers are active and visible members of the community, and have [maintain-level permissions on a repository](https://docs.github.com/en/organizations/managing-access-to-your-organizations-repositories/repository-permission-levels-for-an-organization). Use those privileges to serve the community and evolve code as follows.

Be aware of recurring ambiguous situations and [document them](#common-scenarios) to help your fellow maintainers.

### Uphold Code of Conduct

Model the behavior set forward by the [Code of Conduct](CODE_OF_CONDUCT.md) and raise any violations to other maintainers and admins. There could be unusual circumstances where inappropriate behavior does not immediately fall within the [Code of Conduct](CODE_OF_CONDUCT.md).

These might be nuanced and should be handled with extra care - when in doubt, do not engage and reach out to other maintainers and admins.

### Prioritize Security

Security is your number one priority. Maintainer's Github keys must be password protected securely and any reported security vulnerabilities are addressed before features or bugs.

Note that this repository is monitored and supported 24/7 by Amazon Security, see [Reporting a Vulnerability](SECURITY.md) for details.

### Review Pull Requests

Review pull requests regularly, comment, suggest, reject, merge and close. Accept only high quality pull-requests. Provide code reviews and guidance on incoming pull requests.

PRs are [labeled](#labels) based on file changes and semantic title. Pay attention to whether labels reflect the current state of the PR and correct accordingly.

Use and enforce [semantic versioning](https://semver.org/) pull request titles, as these will be used for [CHANGELOG](CHANGELOG.md) and [Release notes](https://github.com/aws-powertools/powertools-lambda-typescript/releases) - make sure they communicate their intent at the human level.

For issues linked to a PR, our automation should apply the `status/pending-release` label. Make sure the label is always applied when merging. [Upon release](#releasing-a-new-version), these issues will be notified which release version contains their change.

See [Common scenarios](#common-scenarios) section for additional guidance.

### Merging Pull Requests

Before merging a PR make sure that the title reflects the changes being introduced.

This project uses the [squash and merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges#squash-and-merge-your-commits) strategy which means commits are squashed into a single commit. Instead of seeing all of a contributor's individual commits from a topic branch, the commits are combined into one commit and merged into the default branch.

This allows you to have control over the commit message although it should match the PR title most of the time. Use and enforce [semantic versioning](https://semver.org/), as these will be used for versioning the next release.

### Triage New Issues

Manage [labels](#labels), review issues regularly, and create new labels as needed by the project. Remove `triage` label when you're able to confirm the validity of a request, a bug can be reproduced, etc. Give priority to the original author for implementation, unless it is a sensitive task that is best handled by maintainers.

Make sure issues are assigned to our [board of activities](https://github.com/orgs/aws-powertools/projects/7) and have the right [status](https://docs.powertools.aws.dev/lambda-typescript/latest/roadmap/#roadmap-status-definition).

Use our [labels](#labels) to signal good first issues to new community members, and to set expectation that this might need additional feedback from the author, other customers, experienced community members and/or maintainers.

Be aware of [casual contributors](https://opensource.com/article/17/10/managing-casual-contributors) and recurring contributors. Provide the experience and attention you wish you had if you were starting in open source.

See [Common scenarios](#common-scenarios) section for additional guidance.

### Triage Bug Reports

Be familiar with [our definition of bug](#is-that-a-bug). If it's not a bug, you can close it or adjust its title and labels - always communicate the reason accordingly.

For bugs caused by upstream dependencies, replace `type/bug` with `type/bug-upstream` label. Ask the author whether they'd like to raise the issue upstream or if they prefer us to do so.

Assess the impact and make the call on whether we need an emergency release. Contact other [maintainers](#current-maintainers) when in doubt.

See [Common scenarios](#common-scenarios) section for additional guidance.

### Triage RFCs

RFC is a collaborative process to help us get to the most optimal solution given the context. Their purpose is to ensure everyone understands what this context is, their trade-offs, and alternative solutions that were part of the research before implementation begins.

Make sure you ask these questions in mind when reviewing:

- Does it use our [RFC template](https://github.com/aws-powertools/powertools-lambda-typescript/issues/new?assignees=&labels=RFC%2Ctriage&template=rfc.yml&title=RFC%3A+TITLE)?
- Does the match our [Tenets](https://docs.powertools.aws.dev/lambda-typescript/latest/#tenets)?
- Does the proposal address the use case? If so, is the recommended usage explicit?
- Does it focus on the mechanics to solve the use case over fine-grained implementation details?
- Can anyone familiar with the code base implement it?
- If approved, are they interested in contributing? Do they need any guidance?
- Does this significantly increase the overall project maintenance? Do we have the skills to maintain it?
- If we can't take this use case, are there alternative projects we could recommend? Or does it call for a new project altogether?

When necessary, be upfront that the time to review, approve, and implement a RFC can vary - see [Contribution is stuck](#contribution-is-stuck). Some RFCs may be further updated after implementation, as certain areas become clearer.

An example of a successful RFC: [#447](https://github.com/aws-powertools/powertools-lambda-typescript/issues/447)

### Run end to end tests

E2E tests should be ran before every merge to `main` or manually via [run-e2e-tests workflow](https://github.com/aws-powertools/powertools-lambda-typescript/actions/workflows/run-e2e-tests.yml) before making a release.

To run locally, you need [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html#getting_started_prerequisites) and an [account bootstrapped](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) (`cdk bootstrap`). With a default AWS CLI profile configured, or `AWS_PROFILE` environment variable set, run `npm run test:e2e -ws`. For more information on how the tests are structured, see [Integration Tests](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/CONTRIBUTING.md#integration-tests).

### Releasing a new version

🚧 WIP 🚧

#### Drafting release notes

Visit the [Releases page](https://github.com/aws-powertools/powertools-lambda-typescript/releases) and choose the edit pencil button.

Make sure the `tag` field reflects the new version you're releasing, the target branch field is set to `main`, and `release title` matches your tag e.g., `v1.4.1`.

You'll notice we group all changes based on their [labels](#labels) like `type/feature`, `type/bug`, `type/documentation`, etc.

**All looking good, what's next?**

The best part comes now. Replace the placeholder `[Human readable summary of changes]` with what you'd like to communicate to customers what this release is all about. Rule of thumb: always put yourself in the customers shoes.

These are some questions to keep in mind when drafting your first or future release notes:

- Can customers understand at a high level what changed in this release?
- Is there a link to the documentation where they can read more about each main change?
- Are there any graphics or [code snippets](carbon.now.sh/) that can enhance readability?
- Are we calling out any key contributor(s) to this release?
    - All contributors are automatically credited, use this as an exceptional case to feature them

Once you're happy, hit `Publish release` 🎉🎉🎉.

This will kick off the [Publish docs on release](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/.github/workflows/publish-docs-on-release.yml) workflow that will will notify all the issues labeled as `status/pending-release` of the new release.

### Releasing a documentation hotfix

You can rebuild the latest documentation without a full release via this [GitHub Actions Workflow](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/.github/workflows/rebuild-latest-docs.yml).

Choose `Run workflow`, keep `main` as the branch, and input the latest Powertools for AWS Lambda (TypeScript) version available i.e. `v1.4.1`.

This workflow will update both user guide and API documentation.

### Maintain Overall Health of the Repo

Keep the `main` branch at production quality at all times. If a PR introduces code changes you should make sure that linting and tests are passing before merging.

### Manage Roadmap

See [Roadmap section](https://docs.powertools.aws.dev/lambda-typescript/latest/roadmap/)

Ensure the repo highlights features that should be elevated to the project roadmap. Be clear about the feature’s status, priority, target version, and whether or not it should be elevated to the roadmap.

### Add Continuous Integration Checks

Add integration checks that validate pull requests and pushes to ease the burden on Pull Request reviewers. Continuously revisit areas of improvement to reduce operational burden in all parties involved.

### Negative Impact on the Project

Actions that negatively impact the project will be handled by the admins, in coordination with other maintainers, in balance with the urgency of the issue. Examples would be [Code of Conduct](CODE_OF_CONDUCT.md) violations, deliberate harmful or malicious actions, spam, monopolization, and security risks.

### Becoming a maintainer

In late 2023, we will revisit this. We need to improve our understanding of how other projects are doing, their mechanisms to promote key contributors, and how they interact daily.

We suspect this process might look similar to the [OpenSearch project](https://github.com/opensearch-project/.github/blob/main/MAINTAINERS.md#becoming-a-maintainer).

## Common scenarios

These are recurring ambiguous situations that new and existing maintainers may encounter. They serve as guidance. It is up to each maintainer to follow, adjust, or handle in a different manner as long as [our conduct is consistent](#uphold-code-of-conduct)

### Contribution is stuck

A contribution can get stuck often due to lack of bandwidth and language barrier. For bandwidth issues, check whether the author needs help. Make sure you get their permission before pushing code into their existing PR - do not create a new PR unless strictly necessary.

For language barrier and others, offer a 1:1 chat to get them unblocked. Often times, English might not be their primary language, and writing in public might put them off, or come across not the way they intended to be.

In other cases, you may have constrained capacity. Use `help-wanted` label when you want to signal other maintainers and external contributors that you could use a hand to move it forward.

### Insufficient feedback or information

When in doubt, use `need-more-information` or `need-customer-feedback` labels to signal more context and feedback are necessary before proceeding. You can also use `status/on-hold` label when you expect it might take a while to gather enough information before you can decide.

Note that issues marked as `need-response` will be automatically closed after 3 weeks of inactivity.

### Crediting contributions

We credit all contributions as part of each [release note](https://github.com/aws-powertools/powertools-lambda-typescript/releases) as an automated process. If you find contributors are missing from the release note you're producing, please add them manually.

### Is that a bug?

A bug produces incorrect or unexpected results at runtime that differ from its intended behavior. Bugs must be reproducible. They directly affect customers experience at runtime despite following its recommended usage.

Documentation snippets, examples, use of internal components, or unadvertised functionalities are not considered bugs.

### Mentoring contributions

Always favor mentoring issue authors to contribute, unless they're not interested or the implementation is sensitive (_e.g., complexity, time to release, etc._).

Make use of `help-wanted` and `good-first-issue` to signal additional contributions the community can help.

### Long running issues or PRs

Try offering a 1:1 call in the attempt to get to a mutual understanding and clarify areas that maintainers could help.

In the rare cases where both parties don't have the bandwidth or expertise to continue, it's best to use the `status/on-hold` label. By then, see if it's possible to break the PR or issue in smaller chunks, and eventually close if there is no progress.

## Automation

🚧 WIP 🚧
