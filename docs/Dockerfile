# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:f6c81d538499f5755c8d1486f0abcda50bb631be391890ef823fcba18803114a

# Install Node.js
RUN apk add --no-cache nodejs=20.15.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
