# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:58dee36ad85b0ae4836522ee6d3f0150d828bca9a1f7d3bfbf430bca771c1441

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
