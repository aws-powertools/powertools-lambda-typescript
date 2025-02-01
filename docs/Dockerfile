# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:471695f3e611d9858788ac04e4daa9af961ccab73f1c0f545e90f8cc5d4268b8

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
