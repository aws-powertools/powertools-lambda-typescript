# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:f9cb76de2e0d6c31f98227839c299847c549459291b335f48828d60ff8b87059

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
