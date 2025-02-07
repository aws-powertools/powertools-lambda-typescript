import { Logger } from '@aws-lambda-powertools/logger';
import { HashiCorpVaultProvider } from './customProviderVault.js';

const logger = new Logger({ logLevel: 'DEBUG' });
const secretsProvider = new HashiCorpVaultProvider({
  url: 'https://vault.example.com:8200/v1',
  token: process.env.ROOT_TOKEN ?? '',
});

try {
  // Retrieve a secret from HashiCorp Vault
  const secret = await secretsProvider.get<{ foo: 'string' }>('my-secret', {
    sdkOptions: {
      mount: 'secrets',
    },
  });
  if (!secret) {
    throw new Error('Secret not found');
  }
  logger.debug('Secret retrieved!');
} catch (error) {
  if (error instanceof Error) {
    logger.error(error.message, error);
  }
}
