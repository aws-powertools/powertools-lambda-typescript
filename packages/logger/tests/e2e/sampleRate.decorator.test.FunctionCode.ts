import { Logger } from "../../src";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { LambdaInterface } from "@aws-lambda-powertools/commons";

const SAMPLE_RATE = parseFloat(process.env.SAMPLE_RATE);
const LOG_MSG = process.env.LOG_MSG;

const logger = new Logger({
  sampleRateValue: SAMPLE_RATE,
});

class Lambda implements LambdaInterface {
  // Decorate your handler class method
  @logger.injectLambdaContext()
  public async handler(event: APIGatewayProxyEvent, context: Context): Promise<{ statusCode: number; body: string; }> {
    logger.debug(LOG_MSG);
    logger.info(LOG_MSG);
    logger.warn(LOG_MSG);
    logger.error(LOG_MSG);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `E2E testing Lambda function`,
        event,
      })
    };
  }
}

export const myFunction = new Lambda();
export const handler = myFunction.handler;