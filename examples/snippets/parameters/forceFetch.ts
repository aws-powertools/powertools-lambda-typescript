import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<void> => {
  // Retrieve a single parameter
  const parameter = await getParameter('/my/parameter', { forceFetch: true });
  console.log(parameter);
};
