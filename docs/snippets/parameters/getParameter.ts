import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  // Retrieve a single parameter
  const parameter = await getParameter('/my/parameter');
  console.log(parameter);
};
