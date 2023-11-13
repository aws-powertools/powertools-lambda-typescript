/**
 * Test built in schema
 *
 * @group unit/parser/schema/
 */
import { CloudWatchLogsSchema } from '../../../src/schemas/cloudwatch';
import cloudWatchLogEvent from '../../events/cloudWatchLogEvent.json';

describe('CloudWatchLogs ', () => {
  it('should parse cloudwatch logs event', () => {
    const parsed = CloudWatchLogsSchema.parse(cloudWatchLogEvent);
    expect(parsed.awslogs.data).toBeDefined();
    expect(parsed.awslogs.data?.logEvents[0]).toEqual({
      id: 'eventId1',
      timestamp: 1440442987000,
      message: '[ERROR] First test message',
    });
  });
  it('should throw error if cloudwatch logs event is invalid', () => {
    expect(() =>
      CloudWatchLogsSchema.parse({
        awslogs: {
          data: 'invalid',
        },
      })
    ).toThrowError();
  });
});
