# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:3555052d6cbde1086b166ebacacc43126c6fb0a7b990f324072150725aa63b18

# Install Node.js
RUN apk add --no-cache nodejs=20.15.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
