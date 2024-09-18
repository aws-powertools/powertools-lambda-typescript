import { setParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<void> => {
  // Overwrite a string parameter
  const parameter = await setParameter('/my/parameter', {
    value: 'my-value',
    overwrite: true,
  });
  console.log(parameter);
};
