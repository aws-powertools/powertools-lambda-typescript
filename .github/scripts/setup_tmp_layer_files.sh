#!/usr/bin/env bash
rm -rf tmp/nodejs
mkdir -p tmp/nodejs
cd tmp/nodejs
npm init -y
npm i \
  @aws-lambda-powertools/logger@$VERSION \
  @aws-lambda-powertools/metrics@$VERSION \
  @aws-lambda-powertools/tracer@$VERSION \
  @aws-lambda-powertools/parameters@$VERSION
rm -rf node_modules/@types \
  package.json \
  package-lock.json
cd ../..