import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';

const parametersProvider = new SSMProvider();

export const handler = async (): Promise<void> => {
  const decryptedValue = await parametersProvider.get(
    '/my/encrypted/parameter',
    { decrypt: true }
  ); // (1)
  console.log(decryptedValue);

  const noRecursiveValues = await parametersProvider.getMultiple(
    '/my/path/prefix',
    { recursive: false }
  );
  for (const [key, value] of Object.entries(noRecursiveValues || {})) {
    console.log(`${key}: ${value}`);
  }
};
