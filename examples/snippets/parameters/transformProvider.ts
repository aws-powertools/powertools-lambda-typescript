import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';

const secretsProvider = new SecretsProvider();

export const handler = async (): Promise<void> => {
  // Transform a JSON string
  const json = await secretsProvider.get('my-secret-json', {
    transform: 'json',
  });
  console.log(json);

  // Transform a Base64 encoded string (e.g. binary)
  const binary = await secretsProvider.getMultiple('my-secret-binary', {
    transform: 'binary',
  });
  console.log(binary);
};
