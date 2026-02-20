# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:1c30983ef0681684d07a90f4f34a2ff8adf7aaa0bfc1c0d518873bb5e7912f37

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
