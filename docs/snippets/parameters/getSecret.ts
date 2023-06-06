import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

export const handler = async (): Promise<void> => {
  // Retrieve a single secret
  const secret = await getSecret('my-secret');
  console.log(secret);
};
