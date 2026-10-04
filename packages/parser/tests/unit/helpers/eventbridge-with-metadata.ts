import type {
  EventBridgeEvent,
  EventBridgeWithMetadataRecord,
} from '../../../src/types/index.js';
import { getTestEvent } from './utils.js';

/**
 * Creates a synthetic WITH_METADATA record from the classic EventBridge fixture.
 *
 * @param detail - the application payload
 */
const makeRecord = (detail: unknown): EventBridgeWithMetadataRecord => ({
  Data: {
    ...getTestEvent<EventBridgeEvent>({
      eventsPath: 'eventbridge',
      filename: 'base',
    }),
    detail,
  },
  Metadata: {},
  SystemMetadata: {
    'aws:DeliveryType': 'LIVE',
    'aws:EventId': 'bus-event-id',
    'aws:SequenceNumber': '10000000000000003000',
    EventGroupId: 'group-1',
    DeduplicationId: 'dedup-1',
  },
});

export { makeRecord };
