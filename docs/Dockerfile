# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:86d21da4f45f16e30774bf911e5b4795da13ce0cd197dbf8d3d059f256b2cc37

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
