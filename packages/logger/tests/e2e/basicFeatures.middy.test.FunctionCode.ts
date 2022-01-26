import { injectLambdaContext, Logger } from "../../src";
import { APIGatewayProxyEvent } from "aws-lambda";
import middy from "@middy/core"

const PERSISTENT_KEY = process.env.PERSISTENT_KEY;
const PERSISTENT_VALUE = process.env.PERSISTENT_VALUE;
const ERROR_MSG = process.env.ERROR_MSG || 'error';
const SINGLE_LOG_ITEM_KEY = process.env.SINGLE_LOG_ITEM_KEY;
const SINGLE_LOG_ITEM_VALUE = process.env.SINGLE_LOG_ITEM_VALUE;

const logger = new Logger({
  persistentLogAttributes: {
    [PERSISTENT_KEY]: PERSISTENT_VALUE,
  }
});

const testFunction = async (event: APIGatewayProxyEvent) => {

  // Test feature 1: Log level filtering
  // Test feature 2: Context data
  // Test feature 3: Persistent additional log keys and value
  logger.debug("##### This should not appear");
  logger.info("This is an INFO log with context and persistent key");

  // Test feature 4: One-time additional log keys and values
  logger.info("This is an one-time log with an additional key-value", {
    [SINGLE_LOG_ITEM_KEY]: SINGLE_LOG_ITEM_VALUE,
  });

  // Test feature 5: Logging an error object
  try {
    throw new Error(ERROR_MSG);
  }catch(e){
    logger.error(ERROR_MSG, e);
  }

  // TODO: test sampling
  // // 8. Sampling works
  // // This log item (equal to log level 'ERROR') will be printed to standard output
  // // in all Lambda invocations
  // sampleRateLogger.error("sampleRateLogger This is an ERROR log");

  // // These log items (below the log level 'ERROR') have ~50% chance 
  // // of being printed in a Lambda invocation
  // sampleRateLogger.debug("# This is a DEBUG log that has 50% chance of being printed");
  // sampleRateLogger.info("# This is an INFO log that has 50% chance of being printed");
  // sampleRateLogger.warn("# This is a WARN log that has 50% chance of being printed");

  return formatJSONResponse({
    message: `E2E testing Lambda function`,
    event,
  });
}

const formatJSONResponse = (response: Record<string, any>) => {
  return {
    statusCode: 200,
    body: JSON.stringify(response)
  }
}

export const handler = middy(testFunction)
  .use(injectLambdaContext(logger));
