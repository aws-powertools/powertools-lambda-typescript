# Contributing Guidelines

Thank you for your interest in contributing to our project. Whether it's a bug report, new feature, correction, or additional
documentation, we greatly value feedback and contributions from our community.

Please read through this document before submitting any issues or pull requests to ensure we have all the necessary
information to effectively respond to your bug report or contribution.

## Security issue notifications
If you discover a potential security issue in this project we ask that you notify AWS/Amazon Security via our [vulnerability reporting page](http://aws.amazon.com/security/vulnerability-reporting/). Please do **not** create a public GitHub issue.

## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest features.

When filing an issue, please check existing open, or recently closed, issues to make sure somebody else hasn't already
reported the issue. Please try to include as much information as you can. Details like these are incredibly useful:

* A reproducible test case or series of steps
* The version of our code being used
* Any modifications you've made relevant to the bug
* Anything unusual about your environment or deployment

## Contributing via Pull Requests

Contributions via pull requests are much appreciated. Before sending us a pull request, please ensure that:

1. You are working against the latest source on the **main** branch.
2. You check existing open, and recently merged pull requests to make sure someone else hasn't addressed the problem already.
3. You open an [RFC issue](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/new?assignees=&labels=RFC%2C+triage&template=rfc.md&title=RFC%3A+) to discuss any significant work - we would hate for your time to be wasted.
4. You lint and test the code. When you've setup the repository with `npm run init-environment`, pre-commit and push-hooks will automatically lint and test the code. Pull request builds will run the same checks as well.

### Dev setup

To send us a pull request, please follow these steps:

1. Fork the repository.
2. Install dependencies: `npm install`
3. Prepare utilities like commit hooks: `npm run init-environment`
4. Create a new branch to focus on the specific change you are contributing e.g. `git checkout -b improv/logger-debug-sampling`
5. Run all tests, and code baseline checks: `npm run test`
6. Commit to your fork using clear commit messages.
7. Send us a pull request with a [conventional semantic title](https://github.com/awslabs/aws-lambda-powertools-typescript/blob/main/.github/semantic.yml), and answering any default questions in the pull request interface. [Here's an example](https://github.com/awslabs/aws-lambda-powertools-python/pull/67).
8. Pay attention to any automated CI failures reported in the pull request, and stay involved in the conversation.

GitHub provides an additional document on [forking a repository](https://help.github.com/articles/fork-a-repo/) and
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

#### Local documentation

You might find useful to run both the documentation website and the API reference locally while contributing:

* **API reference**: :construction:
* **Docs website**:

You can build and start a local docs website by running these two commands.
  - `npm run docs-buildDockerImage` OR `docker build -t squidfunk/mkdocs-material ./docs/`
  - `npm run docs-runLocalDocker` OR `docker run --rm -it -p 8000:8000 -v ${PWD}:/docs squidfunk/mkdocs-material`

### Tests

Tests are under `tests` folder of each modules and split into two categories: unit tests and e2e tests.

You can run each group separately or all together thanks to [jest-runner-groups](https://www.npmjs.com/package/jest-runner-groups).

Unit tests, under `tests/unit` folder are standard [Jest](https://jestjs.io) tests.

Integration tests under `tests/e2e` folder on the other hand will test the module features by deploying Lambdas functions into your AWS Account. Infrastructure deployment is possible thanks to CDK lib for Typescript and `aws sdk` is used to invoke the functions and assert on the expected behavior. All of this is orchestrated using the same Jest framework used for the unit tests.

Since running integration tests will deploy AWS resources you will need an AWS account and might incur in some costs which should be covered by the [AWS Free Tier](https://aws.amazon.com/free/?all-free-tier.sort-by=item.additionalFields.SortRank&all-free-tier.sort-order=asc&awsf.Free%20Tier%20Types=*all&awsf.Free%20Tier%20Categories=*all). If you already don't have an AWS Account follow [these instructions to create one](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/).

When contributing to this repository these integration tests are run by the maintainers before merging a PR.


**Unit testing**

**Write**

As mentioned before, tests are splitted thanks to [jest-runner-groups](https://www.npmjs.com/package/jest-runner-groups) and therefore needs to be tagged properly by adding the following comments in your unit test file:

```
/**
 * Tests metrics
 *
 * @group unit/<YOUR CATEGORY>/<YOUR SUB CATEGORY>
 */
```

**Run**

 `npm run test`

You can run selective tests by restricting the group to the one you want. For instance `npx jest --group=unit/metrics/all`.

**e2e tests**

**Write**

As mentioned before, unit and e2e tests are splitted thanks to [jest-runner-groups](https://www.npmjs.com/package/jest-runner-groups) and therefore needs to be tagged properly by adding the following comments in your unit test file:

```
/**
 * Tests data lake catalog
 *
 * @group e2e/<YOUR CATEGORY>/<YOUR SUB CATEGORY>
 */
```

and leverage `aws-cdk` package to programatically deploy and destroy stacks. See `metrics/tests/e2e/decorator.test.ts` as an example.


**Run**

To run unit tests you can either use projen task
* `npm run test:e2e` which will only run jest integ tests
* or jest directly `npx jest --group=e2e`

You can run selective tests by restricting the group to the one you want. For instance `npx jest --group=e2e/other/example`.

Two important env variable can be used:
* `AWS_PROFILE` to use the right credentials
* `DISABLE_TEARDOWN` if you don't want your stack to be destroyed at the end of the test (useful in dev mode when iterating over your code).

Example: `DISABLE_TEARDOWN=true AWS_PROFILE=ara npx jest --group=integ/other/example`

**Automate**

1. Create AWS Role
  As mention earlier we are leveraging CDK to deploy and clean resources on AWS. Therefore to run those tests through github actions you will need to grant specific permissions to your workflow. To do so you can leverage [@pahud/cdk-github-oidc](https://constructs.dev/packages/@pahud/cdk-github-oidc) construct which setup the right resources to leverage [Github OpenID Connect](https://github.blog/changelog/2021-10-27-github-actions-secure-cloud-deployments-with-openid-connect/) mechanism.
1. Add your new role into your Github fork secrets under `AWS_ROLE_ARN_TO_ASSUME`.
1. Run manually `run-e2e-tests` workflow.

### Conventions

Category | Convention
------------------------------------------------- | ---------------------------------------------------------------------------------
**Docstring** |  We use a slight variation of numpy convention with markdown to help generate more readable API references.
**Style guide** | We use black as well as flake8 extensions to enforce beyond good practices [PEP8](https://pep8.org/). We strive to make use of type annotation as much as possible, but don't overdo in creating custom types.
**Core utilities** | Core utilities use a Class, always accept `service` as a constructor parameter, can work in isolation, and are also available in other languages implementation.
**Utilities** | Utilities are not as strict as core and focus on solving a developer experience problem while following the project [Tenets](https://awslabs.github.io/aws-lambda-powertools-typescript/#tenets).
**Exceptions** | Specific exceptions live within utilities themselves and use `Error` suffix e.g. `MetricUnitError`.
**Git commits** | We follow [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). These are not enforced as we squash and merge PRs, but PR titles are enforced during CI.
**Documentation** | API reference docs are generated from docstrings which should have Examples section to allow developers to have what they need within their own IDE. Documentation website covers the wider usage, tips, and strive to be concise.

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute on. As our projects, by default, use the default GitHub issue labels (enhancement/bug/help wanted/invalid/question/documentation), looking at any 'help wanted' issues is a great place to start.

## Code of Conduct

This project has adopted the [Amazon Open Source Code of Conduct](https://aws.github.io/code-of-conduct).
For more information see the [Code of Conduct FAQ](https://aws.github.io/code-of-conduct-faq) or contact
opensource-codeofconduct@amazon.com with any additional questions or comments.

## Troubleshooting

### API reference documentation

TODO

## Licensing

See the [LICENSE](LICENSE) file for our project's licensing. We will ask you to confirm the licensing of your contribution.

We may ask you to sign a [Contributor License Agreement (CLA)](http://en.wikipedia.org/wiki/Contributor_License_Agreement) for larger changes.