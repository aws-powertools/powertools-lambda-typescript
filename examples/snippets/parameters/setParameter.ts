import { setParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<void> => {
  // Store a string parameter
  const parameter = await setParameter('/my/parameter', { value: 'my-value' });
  console.log(parameter);
};
