import { z } from 'zod';
import {
  AppSyncCognitoIdentity,
  AppSyncIamIdentity,
  AppSyncOidcIdentity,
} from './appsync-shared.js';

/**
 * A zod schema for the AppSync Events `identity` object when using an AWS Lambda Authorizer.
 */
const AppSyncLambdaAuthIdentity = z.object({
  handlerContext: z.record(z.string(), z.unknown()),
});

/**
 * A zod schema for AppSync Events request object.
 *
 * This schema is used when extending subscribe and publish events.
 */
const AppSyncEventsRequestSchema = z.object({
  headers: z.record(z.string(), z.string()).optional(),
  domainName: z.string().nullable(),
});

/**
 * A zod schema for AppSync Events info object.
 *
 * This schema is used when extending subscribe and publish events.
 */
const AppSyncEventsInfoSchema = z.object({
  channel: z.object({
    path: z.string(),
    segments: z.array(z.string()),
  }),
  channelNamespace: z.object({
    name: z.string(),
  }),
  operation: z.union([z.literal('PUBLISH'), z.literal('SUBSCRIBE')]),
});

/**
 * A zod schema for AppSync Events base events.
 *
 * This schema is used as a base for both publish and subscribe events.
 */
const AppSyncEventsBaseSchema = z.object({
  identity: z.union([
    z.null(),
    AppSyncCognitoIdentity,
    AppSyncIamIdentity,
    AppSyncLambdaAuthIdentity,
    AppSyncOidcIdentity,
  ]),
  result: z.null(),
  request: AppSyncEventsRequestSchema,
  info: AppSyncEventsInfoSchema,
  error: z.null(),
  prev: z.null(),
  stash: z.object({}),
  outErrors: z.array(z.unknown()),
  events: z.null(),
});

/**
 * A zod schema for AppSync Events publish events.
 *
 * @example
 * ```json
 * {
 *   "identity": null,
 *   "result": null,
 *   "request": {
 *     "headers": {
 *       "header1": "value1",
 *     },
 *     "domainName": "example.com"
 *   },
 *   "info": {
 *     "channel": {
 *       "path": "/default/foo",
 *       "segments": ["default", "foo"]
 *     },
 *     "channelNamespace": {
 *       "name": "default"
 *     },
 *     "operation": "PUBLISH"
 *   },
 *   "error": null,
 *   "prev": null,
 *   "stash": {},
 *   "outErrors": [],
 *   "events": [
 *     {
 *       "payload": {
 *         "key": "value"
 *       },
 *       "id": "12345"
 *     },
 *     {
 *       "payload": {
 *         "key2": "value2"
 *       },
 *       "id": "67890"
 *     }
 *   ]
 * }
 * ```
 */
const AppSyncEventsPublishSchema = AppSyncEventsBaseSchema.extend({
  info: AppSyncEventsInfoSchema.extend({
    operation: z.literal('PUBLISH'),
  }),
  events: z
    .array(
      z.object({
        payload: z.record(z.string(), z.unknown()),
        id: z.string(),
      })
    )
    .min(1),
});

/**
 * A zod schema for AppSync Events subscribe events.
 *
 * @example
 * ```json
 * {
 *   "identity": null,
 *   "result": null,
 *   "request": {
 *     "headers": {
 *       "header1": "value1",
 *     },
 *     "domainName": "example.com"
 *   },
 *   "info": {
 *     "channel": {
 *       "path": "/default/foo",
 *       "segments": ["default", "foo"]
 *     },
 *     "channelNamespace": {
 *       "name": "default"
 *     },
 *     "operation": "SUBSCRIBE"
 *   },
 *   "error": null,
 *   "prev": null,
 *   "stash": {},
 *   "outErrors": [],
 *   "events": null,
 * }
 * ```
 */
const AppSyncEventsSubscribeSchema = AppSyncEventsBaseSchema.extend({
  info: AppSyncEventsInfoSchema.extend({
    operation: z.literal('SUBSCRIBE'),
  }),
  events: z.null(),
});

export {
  AppSyncEventsBaseSchema,
  AppSyncCognitoIdentity,
  AppSyncIamIdentity,
  AppSyncLambdaAuthIdentity,
  AppSyncOidcIdentity,
  AppSyncEventsRequestSchema,
  AppSyncEventsInfoSchema,
  AppSyncEventsPublishSchema,
  AppSyncEventsSubscribeSchema,
};
