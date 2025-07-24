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
  } catch (_error) {
    console.error('Unable to retrieve secret: ', _error);
    return {
      message: 'Unable to retrieve secret',
    };
  }
};
