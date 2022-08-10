import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import fs from 'fs';

const SERVICE_NAME = 'e2e-tests-layer-consumer';
const logger = new Logger({ serviceName: SERVICE_NAME, logLevel: 'DEBUG' });
const metrics = new Metrics({ serviceName: SERVICE_NAME });
const tracer = new Tracer({ serviceName: SERVICE_NAME });

exports.handler = function (_event: never, _ctx: unknown): void {
  // check logger lib access
  logger.injectLambdaContext();
  logger.debug('Hello World!');
  // Check version
  try {
    const packageJSON = JSON.parse(
      fs.readFileSync('/opt/nodejs/node_modules/@aws-lambda-powertools/logger/package.json', {
        encoding: 'utf8',
        flag: 'r',
      })
    );
    metrics.captureColdStartMetric();
    const segment = tracer.getSegment();

    const handlerSegment = segment.addNewSubsegment('Handler');

    tracer.setSegment(handlerSegment);

    tracer.annotateColdStart();

    if (packageJSON.version != process.env.POWERTOOLS_PACKAGE_VERSION) {
      throw new Error(
        `Package version mismatch: \${packageJSON.version} != \${process.env.POWERTOOLS_PACKAGE_VERSION}`
      );
    }
  } catch (error) {
    logger.error(error);
  }
};
