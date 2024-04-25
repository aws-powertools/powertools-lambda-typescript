import { HashiCorpVaultProvider } from './customProviderVault.js';

const secretsProvider = new HashiCorpVaultProvider({
  url: 'https://vault.example.com:8200/v1',
  token: 'my-token',
});

export const handler = async (): Promise<void> => {
  // Retrieve a secret from HashiCorp Vault
  const secret = await secretsProvider.get('my-secret');
  console.log(secret);
};
