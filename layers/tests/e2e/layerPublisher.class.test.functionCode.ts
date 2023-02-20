import { readFileSync } from 'node:fs';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger({
  logLevel: 'DEBUG'
});
const metrics = new Metrics();
const tracer = new Tracer();

export const handler = (): void => {

  // Check that the packages version matches the expected one
  try {
    const packageJSON = JSON.parse(
      readFileSync('/opt/nodejs/node_modules/@aws-lambda-powertools/logger/package.json', {
        encoding: 'utf8',
        flag: 'r',
      })
    );

    if (packageJSON.version != process.env.POWERTOOLS_PACKAGE_VERSION) {
      throw new Error(
        `Package version mismatch: ${packageJSON.version} != ${process.env.POWERTOOLS_PACKAGE_VERSION}`
      );
    }
  } catch (error) {
    console.error(error);
  }

  // Check that the logger is working
  logger.debug('Hello World!');

  // Check that the metrics is working
  metrics.captureColdStartMetric();

  // Check that the tracer is working
  const segment = tracer.getSegment();
  const handlerSegment = segment.addNewSubsegment('### index.handler');
  tracer.setSegment(handlerSegment);
  tracer.annotateColdStart();
  handlerSegment.close();
  tracer.setSegment(segment);

};