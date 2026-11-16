import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudWatchLogsSchema } from '../../../src/schemas/cloudwatch.js';
import type { CloudWatchLogsEvent } from '../../../src/types/index.js';
import { getTestEvent } from '../helpers/utils.js';

describe('Schema: CloudWatchLogs', () => {
  const baseEvent = getTestEvent<CloudWatchLogsEvent>({
    eventsPath: 'cloudwatch',
    filename: 'base',
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('parses a CloudWatch Logs event', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = CloudWatchLogsSchema.parse(event);

    // Assess
    expect(result).toStrictEqual({
      awslogs: {
        data: {
          logEvents: [
            {
              id: '38569604798453153764115268074363468419149517103543812096',
              message: `2024-10-21T14:28:15.158Z	eadc91c8-8273-4a2d-b170-b0a7883b619e	INFO	Hello from other.ts
`,
              timestamp: 1729520895158,
            },
            {
              id: '38569604798453153764115268074363468419149517103543812097',
              message: `START RequestId: eadc91c8-8273-4a2d-b170-b0a7883b619e Version: $LATEST
`,
              timestamp: 1729520895158,
            },
            {
              id: '38569604798475454509313798697505004137422165465049792514',
              message: `{"level":"INFO","message":"Hello from other.ts","sampling_rate":0,"service":"service_undefined","timestamp":"2024-10-21T14:28:15.158Z","xray_trace_id":"1-671664ff-69b0ec7624423e04544c023f"}
`,
              timestamp: 1729520895159,
            },
          ],
          logGroup: '/aws/lambda/some-other-name',
          logStream:
            '2024/10/21/OtherFn[$LATEST]16c175a5f89246aaad5c878aebaeeac7',
          messageType: 'DATA_MESSAGE',
          owner: '536254204126',
          subscriptionFilters: [
            'CwtriggerStack-MySubscriptionC96E1FB5-c1AHhT24v8Jh',
          ],
        },
      },
    });
  });

  it('throws if the event is not a CloudWatch Logs event', () => {
    // Prepare
    const event = {
      awslogs: {
        data: 'invalid',
      },
    };

    // Act & Assess
    expect(() => CloudWatchLogsSchema.parse(event)).toThrow();
  });

  it('returns a failed result if the log data decompresses past the size limit', () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_MAX_DECOMPRESSED_SIZE', '1024');
    const event = {
      awslogs: {
        data: Buffer.from(gzipSync(Buffer.alloc(2048, 'a'))).toString('base64'),
      },
    };

    // Act
    const result = CloudWatchLogsSchema.safeParse(event);

    // Assess
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      'Decompressed data exceeds the maximum size of 1024 bytes, set POWERTOOLS_MAX_DECOMPRESSED_SIZE to change the limit'
    );
  });

  it('parses a CloudWatch Logs event within the configured size limit', () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_MAX_DECOMPRESSED_SIZE', '4096');
    const event = structuredClone(baseEvent);

    // Act
    const result = CloudWatchLogsSchema.safeParse(event);

    // Assess
    expect(result.success).toBe(true);
  });
});
