# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:f5bcec4e71c138bcb89c0dccb633c830f54a0218e1aefedaade952b61b908d00

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
