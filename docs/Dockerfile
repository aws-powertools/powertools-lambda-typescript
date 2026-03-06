# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:f4332a8e8895aa303bf7f3ceede749980a98cf79f5d87ad567b4d41f037b0101

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
