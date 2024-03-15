import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

/**
 * Fetch a string from an SSM parameter.
 *
 * Throws an error if the parameter is not found.
 *
 * @param name The name of the parameter
 */
const getSSMStringParameter = async (name: string): Promise<string> => {
  const parameter = await getParameter(name, { maxAge: 600 });

  if (!parameter) {
    throw new Error(`Parameter ${name} not found`);
  }

  return parameter;
};

export { getSSMStringParameter };
