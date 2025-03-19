# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:f226a2d2d5983643cab401491fc40e8a5711a50e90c21433f80e91c014cff1f5

# Install Node.js
RUN apk add --no-cache nodejs=20.15.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
