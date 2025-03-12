# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:047452c6641137c9caa3647d050ddb7fa67b59ed48cc67ec3a4995f3d360ab32

# Install Node.js
RUN apk add --no-cache nodejs=20.15.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
