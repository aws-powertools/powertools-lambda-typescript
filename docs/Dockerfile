# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:2a703999163cdb8257a85849fb2d39914a82587769f95c297bb3f01acf72a609

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
