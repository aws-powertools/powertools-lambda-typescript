import { invokeFunction } from '@aws-lambda-powertools/testing-utils';

/**
 * Invoke function sequentially 3 times with different parameters
 *
 * invocation: is just a tracking number (it has to start from 1)
 * throw: forces the Lambda to throw an error
 *
 * @param functionName
 */
const invokeAllTestCases = async (
  functionName: string,
  times: number
): Promise<void> => {
  await invokeFunction({
    functionName,
    times,
    invocationMode: 'SEQUENTIAL',
    payload: [
      {
        invocation: 1,
        throw: false,
      },
      {
        invocation: 2,
        throw: false,
      },
      {
        invocation: 3,
        throw: true, // only last invocation should throw
      },
    ],
  });
};

export { invokeAllTestCases };
