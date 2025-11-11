# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:980e11fed03b8e7851e579be9f34b1210f516c9f0b4da1a1457f21a460bd6628

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
