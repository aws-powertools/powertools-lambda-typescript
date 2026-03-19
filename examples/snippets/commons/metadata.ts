import { getMetadata } from '@aws-lambda-powertools/commons/utils/metadata';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'serverlessAirline' });
const metadata = await getMetadata();

export const handler = async () => {
  const { AvailabilityZoneID: azId } = metadata;
  logger.appendKeys({ azId });
};
