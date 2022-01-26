import { Logger } from "../../src";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

const PARENT_PERSISTENT_KEY = process.env.PARENT_PERSISTENT_KEY;
const PARENT_PERSISTENT_VALUE = process.env.PARENT_PERSISTENT_VALUE;
const PARENT_LOG_MSG = process.env.PARENT_LOG_MSG;
const CHILD_LOG_MSG = process.env.PARENT_LOG_MSG;
const CHILD_LOG_LEVEL = process.env.CHILD_LOG_LEVEL;

const parentLogger = new Logger({
  persistentLogAttributes: {
    [PARENT_PERSISTENT_KEY]: PARENT_PERSISTENT_VALUE,
  }
});

// Create a child logger
const childLogger = parentLogger.createChild({
  logLevel: CHILD_LOG_LEVEL,
});


const handler = async (event: APIGatewayProxyEvent, context: Context) => {
  parentLogger.addContext(context);
  
  childLogger.info(CHILD_LOG_MSG);
  childLogger.error(CHILD_LOG_MSG);
  parentLogger.info(PARENT_LOG_MSG);
  parentLogger.error(PARENT_LOG_MSG);


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

