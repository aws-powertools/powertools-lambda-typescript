# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:3bba0a99bc6e635bb8e53f379d32ab9cecb554adee9cc8f59a347f93ecf82f3b

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
