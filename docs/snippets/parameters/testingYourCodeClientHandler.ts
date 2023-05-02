import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<Record<string, unknown>> => {
  try {
    const parameter = await getSecret('my-secret');

    return {
      value: parameter,
    };
  } catch (error) {
    return {
      message: 'Unable to retrieve secret',
    };
  }
};
