# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:f5c556a6d30ce0c1c0df10e3c38c79bbcafdaea4b1c1be366809d0d4f6f9d57f

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
