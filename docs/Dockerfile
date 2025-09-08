# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:209b62dd9530163cc5cf9a49853b5bb8570ffb3f3b5fe4eadc1d319bbda5ce2f

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
