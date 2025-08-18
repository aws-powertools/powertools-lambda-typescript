# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:405aeb6dbf1fcddd1082993eacf288a46648ea56b846323f001aee619015a23b

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
