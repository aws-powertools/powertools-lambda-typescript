# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:c3739993c3e7c92cfe649ba03cbc04f4fa9b1497886abd16267eb413cda8aecf

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
