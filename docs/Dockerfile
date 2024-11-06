# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:ce587cbffd5283056df4a84bd3f2eb0c54f0031b1789844dcaf6ac53da0fd52c

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
