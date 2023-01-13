import { Logger } from '@aws-lambda-powertools/logger';
import { MyCompanyLogFormatter } from './utils/formatters/MyCompanyLogFormatter';

const logger = new Logger({
    logFormatter: new MyCompanyLogFormatter(),
    logLevel: 'DEBUG',
    serviceName: 'serverlessAirline',
    sampleRateValue: 0.5,
    persistentLogAttributes: {
        awsAccountId: process.env.AWS_ACCOUNT_ID,
        logger: {
            name: '@aws-lambda-powertools/logger',
            version: '0.0.1'
        }
    },
});

export const handler = async (event, context): Promise<void> => {

    logger.addContext(context);

    logger.info('This is an INFO log', { correlationIds: { myCustomCorrelationId: 'foo-bar-baz' } });

};