import { getParametersByName } from '@aws-lambda-powertools/parameters/ssm';
import type { SSMGetParametersByNameOptionsInterface } from '@aws-lambda-powertools/parameters/ssm';

const props: Record<string, SSMGetParametersByNameOptionsInterface> = {
  '/develop/service/commons/telemetry/config': {
    maxAge: 300,
    transform: 'json',
  },
  '/no_cache_param': { maxAge: 0 },
  '/develop/service/payment/api/capture/url': {}, // When empty or undefined, it uses default values
};

export const handler = async (): Promise<void> => {
  // This returns an object with the parameter name as key
  const parameters = await getParametersByName(props, { maxAge: 60 });
  for (const [key, value] of Object.entries(parameters)) {
    console.log(`${key}: ${value}`);
  }
};
