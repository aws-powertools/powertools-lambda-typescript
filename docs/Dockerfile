# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:23b69789b1dd836c53ea25b32f62ef8e1a23366037acd07c90959a219fd1f285

# Install Node.js
RUN apk add --no-cache nodejs=20.15.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
