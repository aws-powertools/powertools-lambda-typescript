# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:26153027ff0b192d3dbea828f2fe2dd1bf6ff753c58dd542b3ddfe866b08bf60

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
