# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:1a4e939cfd62b90943b6a829eb8544933e4e94eab18b8ca1d0f912fa9a532c37

# Install Node.js
RUN apk add --no-cache nodejs=22.13.1-r0 npm

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
