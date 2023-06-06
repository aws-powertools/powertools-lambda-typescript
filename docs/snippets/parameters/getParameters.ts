import { getParameters } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (): Promise<void> => {
  /**
   * Retrieve multiple parameters from a path prefix recursively.
   * This returns an object with the parameter name as key
   */
  const parameters = await getParameters('/my/path/prefix');
  for (const [key, value] of Object.entries(parameters || {})) {
    console.log(`${key}: ${value}`);
  }
};
