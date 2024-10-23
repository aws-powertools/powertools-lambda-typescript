import { describe, expect, it } from 'vitest';
import { CloudWatchLogsSchema } from '../../../src/schemas/cloudwatch.js';
import type { CloudWatchLogsEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: CloudWatchLogs', () => {
  const baseEvent = getTestEvent<CloudWatchLogsEvent>({
    eventsPath: 'cloudwatch',
    filename: 'base',
  });

  it('parses a CloudWatchLogs event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const parsedEvent = CloudWatchLogsSchema.parse(event);

    // Assess
    expect(parsedEvent).toStrictEqual({
      awslogs: {
        data: {
          logEvents: [
            {
              id: 'eventId1',
              message: '[ERROR] First test message',
              timestamp: 1440442987000,
            },
            {
              id: 'eventId2',
              message: '[ERROR] Second test message',
              timestamp: 1440442987001,
            },
          ],
          logGroup: 'testLogGroup',
          logStream: 'testLogStream',
          messageType: 'DATA_MESSAGE',
          owner: '123456789123',
          subscriptionFilters: ['testFilter'],
        },
      },
    });
  });

  it('throws if event is not a CloudWatchLogs event', () => {
    // Prepare
    const event = { foo: 'bar' };

    // Act & Assess
    expect(() => CloudWatchLogsSchema.parse(event)).toThrow();
  });
});
