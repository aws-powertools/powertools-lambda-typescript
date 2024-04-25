import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
import type { SSMGetParametersByNameOptions } from '@aws-lambda-powertools/parameters/ssm/types';

const props: Record<string, SSMGetParametersByNameOptions> = {
  '/develop/service/commons/telemetry/config': {
    maxAge: 300,
    transform: 'json',
  },
  '/this/param/does/not/exist': {}, // <- Example of non-existent parameter
};

export const handler = async (): Promise<void> => {
  const { _errors: errors, ...parameters } = await getParametersByName(props, {
    throwOnError: false,
  });

  // Handle gracefully, since `/this/param/does/not/exist` will only be available in `_errors`
  if (errors && errors.length) {
    console.error(`Unable to retrieve parameters: ${errors.join(',')}`);
  }

  for (const [key, value] of Object.entries(parameters)) {
    console.log(`${key}: ${value}`);
  }
};
