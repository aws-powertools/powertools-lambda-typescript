# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:bb7b015690d9fb5ef0dbc98ca3520f153aa43129fb96aec5ca54c9154dc3b729

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
