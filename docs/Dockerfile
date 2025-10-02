# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:00f9276315990b82f5af8c47bb2b71e2c69aef9f02a08f8dffd2515f42310753

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
