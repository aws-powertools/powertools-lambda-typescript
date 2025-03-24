import { Logger } from '@aws-lambda-powertools/logger';
import { HashiCorpVaultProvider } from './customProviderVault.js';

const logger = new Logger({ serviceName: 'serverless-airline' });
const secretsProvider = new HashiCorpVaultProvider({
  url: 'https://vault.example.com:8200/v1',
  token: process.env.ROOT_TOKEN ?? '',
  rootPath: 'kv',
});

// Retrieve a secret from HashiCorp Vault
const secret = await secretsProvider.get<{ foo: 'string' }>('my-secret');

const res = await fetch('https://example.com/api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${secret?.foo}`,
  },
  body: JSON.stringify({ data: 'example' }),
});
logger.debug('res status', { status: res.status });
