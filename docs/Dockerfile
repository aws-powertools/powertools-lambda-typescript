# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:c62453b1ba229982c6325a71165c1a3007c11bd3dd470e7a1446c5783bd145b4

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
