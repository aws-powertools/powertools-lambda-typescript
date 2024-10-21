# version 9.5.35
FROM squidfunk/mkdocs-material@sha256:31eb7f7c86dc35e29ca5520e1826b3c7fd54ddd84adc20cb0a42f59d17aa912e

COPY requirements.txt /tmp/
RUN pip install --require-hashes -r /tmp/requirements.txt
