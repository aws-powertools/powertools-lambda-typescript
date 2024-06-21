import { z } from 'zod';

/**
 * Zod schema for EventBridge event
 *
 * @example
 * ```json
 * {
 *   "version": "0",
 *   "id": "6a7e8feb-b491-4cf7-a9f1-bf3703467718",
 *   "detail-type": "EC2 Instance State-change Notification",
 *   "source": "aws.ec2",
 *   "account": "111122223333",
 *   "time": "2017-12-22T18:43:48Z",
 *   "region": "us-west-1",
 *   "resources": [
 *     "arn:aws:ec2:us-west-1:123456789012:instance/i-1234567890abcdef0"
 *   ],
 *   "detail": {
 *     "instance_id": "i-1234567890abcdef0",
 *     "state": "terminated"
 *   },
 *   "replay-name": "replay_archive"
 * }
 * ```
 *
 * @see {@link types.EventBridgeEvent | EventBridgeEvent}
 * @see {@link https://docs.aws.amazon.com/eventbridge/latest/userguide/eventbridge-and-events.html}
 */
const EventBridgeSchema = z.object({
  version: z.string(),
  id: z.string(),
  source: z.string(),
  account: z.string(),
  time: z.string().datetime(),
  region: z.string(),
  resources: z.array(z.string()),
  'detail-type': z.string(),
  detail: z.unknown(),
  'replay-name': z.string().optional(),
});

export { EventBridgeSchema };
