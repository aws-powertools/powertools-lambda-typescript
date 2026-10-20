import { ParameterNotFoundError } from '@aws-lambda-powertools/parameters/errors';
import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<void> => {
  try {
    // The return type is narrowed to `string` (no longer `string | undefined`)
    const parameter = await getParameter('/my/parameter', {
      throwOnMissing: true,
    });
    console.log(parameter.toUpperCase());
  } catch (error) {
    if (error instanceof ParameterNotFoundError) {
      console.error('The parameter does not exist in the store');
    }
    throw error;
  }
};
