# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:d485eb6e9ca02fa8158311e55595c344eb01db5587a7b2c35560c13cb906e3cd

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
