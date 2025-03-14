# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:479a06a8f5a320a9b2b17e72cb7012388d66ea71a8568235cfa072eb152bc30c

# Install Node.js
RUN apk add --no-cache nodejs=20.15.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
