import { logger } from './powertools';
import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
import { randomUUID } from 'node:crypto';
import { default as request } from 'phin';

export const getUuid = async (): Promise<string> => {
  const uuidApiUrl = await getParameter('/app/uuid-api-url');
  if (!uuidApiUrl) {
    // create uuid locally
    logger.warn('No uuid-api-url parameter found, creating uuid locally');

    return randomUUID();
  } else {
    // Request a sample random uuid from a webservice
    const res = await request<{ uuid: string }>({
      url: uuidApiUrl,
      parse: 'json',
    });

    return res.body.uuid;
  }
};
