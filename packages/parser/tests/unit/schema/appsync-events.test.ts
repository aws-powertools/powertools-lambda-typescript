import { describe, expect, it } from 'vitest';
import {
  AppSyncEventsPublishSchema,
  AppSyncEventsSubscribeSchema,
} from '../../../src/schemas/index.js';
import type {
  AppSyncEventsPublishEvent,
  AppSyncEventsSubscribeEvent,
} from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: AppSync Events', () => {
  const eventsPath = 'appsync-events';
  const baseEvent = getTestEvent<AppSyncEventsSubscribeEvent>({
    eventsPath,
    filename: 'base',
  });

  describe('AppSyncEventsPublishSchema', () => {
    it('throws when the event is invalid', () => {
      // Prepare
      const event = omit(['info'], structuredClone(baseEvent));

      // Act & Assess
      expect(() => AppSyncEventsPublishSchema.parse(event)).toThrow();
    });

    it('parses a publish event', () => {
      // Prepare
      const event = structuredClone(
        baseEvent
      ) as unknown as AppSyncEventsPublishEvent;
      event.info.operation = 'PUBLISH';
      event.events = [
        {
          payload: {
            event_1: 'data_1',
          },
          id: '5f7dfbd1-b8ff-4c20-924e-23b42db467a0',
        },
        {
          payload: {
            event_2: 'data_2',
          },
          id: 'ababdf65-a3e6-4c1d-acd3-87466eab433c',
        },
        {
          payload: {
            event_3: 'data_3',
          },
          id: '8bb2983a-0967-45a0-8243-0aeb8c83d80e',
        },
      ];

      // Act
      const parsedEvent = AppSyncEventsPublishSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });

  describe('AppSyncEventsSubscribeSchema', () => {
    it('throws when the event is invalid', () => {
      // Prepare
      const event = omit(['info'], structuredClone(baseEvent));

      // Act & Assess
      expect(() => AppSyncEventsSubscribeSchema.parse(event)).toThrow();
    });

    it('parses a subscribe event', () => {
      // Prepare
      const event = structuredClone(baseEvent);
      event.info.operation = 'SUBSCRIBE';

      // Act
      const parsedEvent = AppSyncEventsSubscribeSchema.parse(event);

      // Assess
      expect(parsedEvent).toEqual(event);
    });
  });
});
