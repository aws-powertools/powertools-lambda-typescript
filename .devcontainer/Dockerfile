# See here for image contents: https://github.com/microsoft/vscode-dev-containers/blob/v0.212.0/containers/javascript-node/.devcontainer/base.Dockerfile
# [Choice] Node.js version (use -bullseye variants on local arm64/Apple Silicon): 18, 16, 14, 18-bullseye, 16-bullseye, 14-bullseye, 18-buster, 16-buster, 14-buster
ARG VARIANT="20-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

# This section to install additional OS packages.
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends bash-completion

# Install fnm to manage Node.js versions
RUN curl -fsSL https://fnm.vercel.app/install | bash -s

RUN wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip \
    && unzip aws-sam-cli-linux-x86_64.zip -d sam-installation \
    && sudo ./sam-installation/install \
    && rm -rf sam-installation aws-sam-cli-linux-*
