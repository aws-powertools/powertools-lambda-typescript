module.exports = {
  out: 'api',
  exclude: [ '**/node_modules/**', '**/*.test.ts', '**/*.json' ],
  name: 'aws-lambda-powertools-typescript',
  excludePrivate: true,
  entryPointStrategy: 'packages',
  readme: './README.md',
};