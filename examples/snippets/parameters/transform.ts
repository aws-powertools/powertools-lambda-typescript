import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<void> => {
  const valueFromJson = await getParameter('/my/json/parameter', {
    transform: 'json',
  });
  console.log(valueFromJson);
};
