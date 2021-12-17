import type { Handler } from 'aws-lambda';

interface LambdaInterface {
  handler: Handler
}

export {
  LambdaInterface
};