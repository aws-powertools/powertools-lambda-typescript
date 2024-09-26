# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:7aea3592488c021f1391fe2259ea20d6253d705a7acab17581c0a0104c7ce308

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
