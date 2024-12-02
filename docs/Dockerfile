# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:3f571e7f83702812ab63e73c912dfea762abecd12b3d9bae678211bb625ba9ad

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
