import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<Record<string, unknown>> => {
  const parameter = await getParameter('my/param');

  return {
    value: parameter,
  };
};
