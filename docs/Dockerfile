# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:0bfdba448e93984191246f7a28abeacc79f789e7e9cf0c639a48fe4365e880a7

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
