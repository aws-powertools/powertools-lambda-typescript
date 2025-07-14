import {
  getNumberFromEnv,
  getStringFromEnv,
} from '@aws-lambda-powertools/commons/utils/env';

/**
 * It returns the value of the POWERTOOLS_PARAMETERS_MAX_AGE environment variable.
 *
 * @returns {number|undefined}
 */
const getParametersMaxAge = (): number | undefined => {
  try {
    return getNumberFromEnv({
      key: 'POWERTOOLS_PARAMETERS_MAX_AGE',
    });
  } catch (error) {
    return undefined;
  }
};

/**
 * It returns the value of the POWERTOOLS_PARAMETERS_SSM_DECRYPT environment variable.
 *
 * @returns {string}
 */
const getSSMDecrypt = (): string => {
  return getStringFromEnv({
    key: 'POWERTOOLS_PARAMETERS_SSM_DECRYPT',
    defaultValue: '',
  });
};

export { getParametersMaxAge, getSSMDecrypt };
