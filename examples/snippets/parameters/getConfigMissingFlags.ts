import { getConfig } from '@aws-lambda-powertools/parameters/appconfig-agent';
import {
  FlagNotFoundError,
  ParameterNotFoundError,
} from '@aws-lambda-powertools/parameters/errors';

export const handler = async (): Promise<void> => {
  try {
    const flags = await getConfig('features', {
      application: 'my-app',
      environment: 'prod',
      agentOptions: { flags: ['ui_refresh'] },
      transform: 'json',
      throwOnMissing: true,
    });
    console.log(flags);
  } catch (error) {
    if (error instanceof FlagNotFoundError) {
      console.warn('Use fallback for missing flags', error.flags);
      return;
    }
    if (error instanceof ParameterNotFoundError) {
      console.error(
        'Application, environment, or configuration profile not found'
      );
    }
    throw error;
  }
};
