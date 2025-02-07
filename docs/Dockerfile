# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:7e841df1cfb6c8c4ff0968f2cfe55127fb1a2f5614e1c9bc23cbc11fe4c96644

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
