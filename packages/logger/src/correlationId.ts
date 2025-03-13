import type { JSONObject } from '@aws-lambda-powertools/commons/types';
import { search as JMESPathSearch } from '@aws-lambda-powertools/jmespath';
import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';

const search = (expression: string, data: JSONObject) => {
  JMESPathSearch(expression, data, {
    customFunctions: new PowertoolsFunctions(),
  });
};

export { search };
