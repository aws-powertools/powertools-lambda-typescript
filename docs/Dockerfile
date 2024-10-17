# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:0d4e6877f5e2204d4e3da97bf858df075ecc39eae062ed05366c8b5b895a1131

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
