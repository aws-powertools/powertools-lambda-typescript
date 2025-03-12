---
title: Development environment
description: Setting up your development environment for contribution
---

<!-- markdownlint-disable MD043 -->

[![Join our Discord](https://dcbadge.vercel.app/api/server/B8zZKbbyET)](https://discord.gg/B8zZKbbyET){target="_blank" rel="nofollow"}

This page describes how to setup your development environment (Cloud or locally) to contribute to Powertools for AWS Lambda (TypeScript).

<center>
```mermaid
graph LR
    Dev["Development environment"] --> Quality["Run quality checks locally"] --> PR["Prepare pull request"] --> Collaborate
```
<i>End-to-end process</i>
</center>

## Requirements

!!! question "First time contributing to an open-source project ever?"
    Read this [introduction on how to fork and clone a project on GitHub](https://docs.github.com/en/get-started/quickstart/contributing-to-projects){target="_blank" rel="nofollow"}.

Unless you're using the pre-configured Cloud environment, you'll need the following installed:

* [GitHub account](https://github.com/join){target="_blank" rel="nofollow"}. You'll need to be able to fork, clone, and contribute via pull request.
* [Node.js 22.x](https://nodejs.org/download/release/latest-v22.x/){target="_blank" rel="nofollow"}. The repository contains an `.nvmrc` file, so if you use tools like [nvm](https://github.com/nvm-sh/nvm#nvmrc), [fnm](https://github.com/Schniz/fnm) you can switch version quickly.
* [npm 10.x](https://www.npmjs.com/). We use it to install dependencies and manage the workspaces.
* [Docker](https://docs.docker.com/engine/install/){target="_blank" rel="nofollow"}. We use it to run documentation, and non-JavaScript tooling.
* [Fork the repository](https://github.com/aws-powertools/powertools-lambda-typescript/fork). You'll work against your fork of this repository.

??? note "Additional requirements if running end-to-end tests"

    * [AWS Account bootstrapped with CDK](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html){target="_blank"}
    * [AWS CLI installed and configured](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

## Cloud environment

!!! warning "A word of caution"
    Before using one of the services below check out their pricing. You can find more information about each service pricing respectively on [Gitpod](https://www.gitpod.io/pricing){target="_blank" rel="nofollow"} and [GitHub Codespaces](https://docs.github.com/en/billing/managing-billing-for-github-codespaces/about-billing-for-github-codespaces){target="_blank" rel="nofollow"} pages.

Once provisioned, each Cloud environment will come with all development dependencies and tools you'll need to contribute already installed.

### Gitpod

To use a pre-configured Gitpod environment, create or login to a Gitpod account, then replace `YOUR_USERNAME` with your GitHub username or organization.

```bash
https://gitpod.io/#https://github.com/YOUR_USERNAME/powertools-lambda-typescript  #(1)!
```

1. For example, if your username is `octocat`, then the final URL should be `https://gitpod.io/#https://github.com/octocat/powertools-lambda-typescript`

### GitHub Codespaces

To use a pre-configured GitHub Codespaces environment, navigate to your fork of the repository, then click on the green `Code` button, and select `Create codespace on <branch_name>` under the `Codespaces` tab (where `<branch_name>` is the branch you want to work on).

## Local environment

> Assuming you've got all [requirements](#requirements).

You can use `npm run setup-local` to install all dependencies locally and setup pre-commit hooks.

!!! note "Curious about what `setup-local` does under the hood?"
    We use npm scripts to [automate common tasks](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/package.json#L24){target="_blank" rel="nofollow"} locally and in Continuous Integration environments.

### Local documentation

You might find useful to run both the documentation website and the API reference locally while contributing:

#### Using Docker (recommended)

1. Build the Docker image (only needed the first time):

   ```bash
   npm run docs:docker:build
   ```

2. Run the documentation website:

   ```bash
   npm run docs:docker:run
   ```

#### Using Python directly

If you have Python installed, you can run the documentation website and API reference locally without Docker:

1. Create a virtual environment and install dependencies:

   ```bash
   npm run docs:local:setup
   ```

2. Run the documentation website:

   ```bash
   npm run docs:local:run
   ```
