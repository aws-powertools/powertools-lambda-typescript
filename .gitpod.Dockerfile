# See gitpod image here: https://hub.docker.com/r/gitpod/workspace-base
FROM gitpod/workspace-base@sha256-f08b7c4d5caf9e9a570deb49bf9987d4f725b7d1320dc2e948f795635f441747

USER gitpod

# Install fnm to manage Node.js versions
RUN curl -fsSL https://fnm.vercel.app/install -o /tmp/install \
  && chmod a+x /tmp/install 
  && /tmp/install \
  && rm /tmp/install

# Install AWS SAM CLI
RUN curl -LO https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip \
  && unzip -q aws-sam-cli-linux-x86_64.zip -d sam-installation \
  && sudo ./sam-installation/install \
  && rm -rf sam-installation aws-sam-cli-linux-*
