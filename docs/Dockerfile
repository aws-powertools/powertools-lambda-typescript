# The Python minor version must match docs/.python-version; Dependabot keeps the digest current.
FROM python:3.14-alpine@sha256:9e9fde4d32eedce0b661d9ab91e826b62dddf28e928c230ec55f1866cac66b01

# git for mkdocs-git-revision-date-plugin, Node.js for TypeDoc, tini to forward signals to mkdocs serve.
# The mounted checkout belongs to the host user, so git must be told to trust it.
RUN apk add --no-cache git nodejs npm tini \
  && git config --system --add safe.directory /docs

COPY requirements.txt /tmp/
RUN pip install --no-cache-dir --require-hashes -r /tmp/requirements.txt

WORKDIR /docs
EXPOSE 8000
ENTRYPOINT ["/sbin/tini", "--", "mkdocs"]
CMD ["serve", "--dev-addr=0.0.0.0:8000"]
