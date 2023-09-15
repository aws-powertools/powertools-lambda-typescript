#!/usr/bin/env bash
rm -rf tmp/nodejs
mkdir -p tmp/nodejs
npm run build -w packages/commons
mv aws-lambda-powertools-commons-*.tgz tmp/nodejs
npm run build -w packages/logger
mv aws-lambda-powertools-logger-*.tgz tmp/nodejs
npm run build -w packages/metrics
mv aws-lambda-powertools-metrics-*.tgz tmp/nodejs
npm run build -w packages/tracer
mv aws-lambda-powertools-tracer-*.tgz tmp/nodejs
cd tmp/nodejs
npm init -y
npm i \
  aws-lambda-powertools-commons-*.tgz \
  aws-lambda-powertools-logger-*.tgz \
  aws-lambda-powertools-metrics-*.tgz \
  aws-lambda-powertools-tracer-*.tgz
rm -rf node_modules/@types \
  package.json \
  package-lock.json
cd ../..