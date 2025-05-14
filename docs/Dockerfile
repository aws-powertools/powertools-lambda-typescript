# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:eb04b60c566a8862be6b553157c16a92fbbfc45d71b7e4e8593526aecca63f52

# Install Node.js
RUN apk add --no-cache nodejs=20.15.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
