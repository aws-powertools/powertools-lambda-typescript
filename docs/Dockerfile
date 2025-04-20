# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:95f2ff42251979c043d6cb5b1c82e6ae8189e57e02105813dd1ce124021a418b

# Install Node.js
RUN apk add --no-cache nodejs=20.15.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
