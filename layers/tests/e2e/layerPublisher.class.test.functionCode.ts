import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

const logger = new Logger({
  logLevel: 'DEBUG',
});
const metrics = new Metrics();
const tracer = new Tracer();

const layerPath = process.env.LAYERS_PATH || '/opt/nodejs/node_modules';
const expectedVersion = process.env.POWERTOOLS_PACKAGE_VERSION || '0.0.0';

const getVersionFromModule = async (moduleName: string): Promise<string> => {
  const manifestPath = join(
    layerPath,
    '@aws-lambda-powertools',
    moduleName,
    'package.json'
  );

  let manifest: string;
  try {
    manifest = await readFile(manifestPath, { encoding: 'utf8' });
  } catch (error) {
    console.log(error);
    throw new Error(`Unable to read/find package.json file at ${manifestPath}`);
  }

  let moduleVersion: string;
  try {
    const { version } = JSON.parse(manifest);
    moduleVersion = version;
  } catch (error) {
    console.log(error);
    throw new Error(`Unable to parse package.json file at ${manifestPath}`);
  }

  return moduleVersion;
};

export const handler = async (): Promise<void> => {
  // Check that the packages version matches the expected one
  for (const moduleName of ['commons', 'logger', 'metrics', 'tracer']) {
    const moduleVersion = await getVersionFromModule(moduleName);
    if (moduleVersion != expectedVersion) {
      throw new Error(
        `Package version mismatch (${moduleName}): ${moduleVersion} != ${expectedVersion}`
      );
    }
  }

  // Check that the metrics is working
  metrics.captureColdStartMetric();

  // Check that the tracer is working
  const subsegment = tracer.getSegment()?.addNewSubsegment('### index.handler');
  if (!subsegment) {
    throw new Error('Unable to create subsegment, check the Tracer');
  }
  tracer.setSegment(subsegment);
  tracer.annotateColdStart();
  subsegment.close();
  tracer.setSegment(subsegment.parent);

  // Check that logger & tracer are both working
  // the presence of a log will indicate that the logger is working
  // while the content of the log will indicate that the tracer is working
  logger.debug('subsegment', { subsegment: subsegment.format() });
};
