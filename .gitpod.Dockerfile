# See gitpod image here: https://hub.docker.com/layers/gitpod/workspace-base/latest
FROM gitpod/workspace-base@sha256:d69d08a0e1fa62b6d8db9e7ffe63dc21a58f0242946d945d776a819aec652130

USER gitpod

# Install fnm to manage Node.js versions
RUN curl -fsSL https://fnm.vercel.app/install | bash -s
