import { z } from 'zod';
import type {
  EcsTaskStateChangeDetail,
  EcsTaskStateChangeEvent,
} from '../types/schema.js';
import { EventBridgeSchema } from './eventbridge.js';

/**
 * Parses the `detail` of an Amazon ECS `ECS Task State Change` event.
 *
 * Fields the EventBridge schema registry marks as required are required here; every
 * other field is optional. The stop fields (`stopCode`, `stoppedReason`, `stoppingAt`,
 * `executionStoppedAt`) appear once the task is stopping, `stoppedAt` once it is
 * `STOPPED`, and `containers[].exitCode` only for containers that started.
 *
 * Use it with `EventBridgeEnvelope` to parse only the `detail` of the event.
 *
 * @example
 * ```json
 * {
 *   "attachments": [
 *     {
 *       "id": "0b6871e9-2f42-4642-b627-43225bc45c67",
 *       "type": "eni",
 *       "status": "DELETED",
 *       "details": [
 *         { "name": "subnetId", "value": "subnet-0b08f9a8165d1de70" }
 *       ]
 *     }
 *   ],
 *   "availabilityZone": "eu-central-1b",
 *   "capacityProviderName": "FARGATE",
 *   "clusterArn": "arn:aws:ecs:eu-central-1:123456789012:cluster/example-cluster",
 *   "containers": [
 *     {
 *       "containerArn": "arn:aws:ecs:eu-central-1:123456789012:container/example-cluster/955a1cbb110241cb9985128773d4ee79/fab8cef5-a3e3-4e59-90e6-494f25527224",
 *       "exitCode": 1,
 *       "lastStatus": "STOPPED",
 *       "name": "app",
 *       "taskArn": "arn:aws:ecs:eu-central-1:123456789012:task/example-cluster/955a1cbb110241cb9985128773d4ee79"
 *     }
 *   ],
 *   "createdAt": "2026-11-10T17:32:18.456Z",
 *   "desiredStatus": "STOPPED",
 *   "lastStatus": "STOPPED",
 *   "launchType": "FARGATE",
 *   "overrides": { "containerOverrides": [{ "name": "app" }] },
 *   "stopCode": "EssentialContainerExited",
 *   "stoppedAt": "2026-11-10T17:32:55.486Z",
 *   "stoppedReason": "Essential container in task exited",
 *   "taskArn": "arn:aws:ecs:eu-central-1:123456789012:task/example-cluster/955a1cbb110241cb9985128773d4ee79",
 *   "taskDefinitionArn": "arn:aws:ecs:eu-central-1:123456789012:task-definition/exit1:1",
 *   "updatedAt": "2026-11-10T17:32:55.486Z",
 *   "version": 5
 * }
 * ```
 *
 * @see {@link EcsTaskStateChangeDetail | `EcsTaskStateChangeDetail`}
 * @see {@link https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_task_events.html}
 */
const EcsTaskStateChangeDetailSchema = z.object({
  attachments: z
    .array(
      z.object({
        id: z.string().optional(),
        type: z.string().optional(),
        status: z.string().optional(),
        details: z
          .array(
            z.object({
              name: z.string().optional(),
              value: z.string().optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  attributes: z
    .array(
      z.object({
        name: z.string().optional(),
        value: z.string().optional(),
      })
    )
    .optional(),
  availabilityZone: z.string().optional(),
  capacityProviderName: z.string().optional(),
  clusterArn: z.string(),
  computeId: z.string().optional(),
  connectivity: z.string().optional(),
  connectivityAt: z.iso.datetime().optional(),
  containerInstanceArn: z.string().optional(),
  containers: z.array(
    z.object({
      containerArn: z.string(),
      cpu: z.string().optional(),
      exitCode: z.number().optional(),
      gpuIds: z.array(z.string()).optional(),
      image: z.string().optional(),
      imageDigest: z.string().optional(),
      lastStatus: z.string(),
      memory: z.string().optional(),
      memoryReservation: z.string().optional(),
      name: z.string(),
      networkBindings: z
        .array(
          z.object({
            bindIP: z.string().optional(),
            containerPort: z.number().optional(),
            hostPort: z.number().optional(),
            protocol: z.string().optional(),
          })
        )
        .optional(),
      networkInterfaces: z
        .array(
          z.object({
            attachmentId: z.string().optional(),
            ipv6Address: z.string().optional(),
            privateIpv4Address: z.string().optional(),
          })
        )
        .optional(),
      reason: z.string().optional(),
      runtimeId: z.string().optional(),
      taskArn: z.string(),
    })
  ),
  cpu: z.string().optional(),
  createdAt: z.iso.datetime(),
  desiredStatus: z.string(),
  enableExecuteCommand: z.boolean().optional(),
  ephemeralStorage: z.object({ sizeInGiB: z.number() }).optional(),
  executionStoppedAt: z.iso.datetime().optional(),
  group: z.string().optional(),
  lastStatus: z.string(),
  launchType: z.string().optional(),
  memory: z.string().optional(),
  overrides: z.object({
    containerOverrides: z.array(
      z.object({
        command: z.array(z.string()).optional(),
        cpu: z.number().optional(),
        environment: z
          .array(
            z.object({
              name: z.string().optional(),
              value: z.string().optional(),
            })
          )
          .optional(),
        memory: z.number().optional(),
        name: z.string(),
      })
    ),
    cpu: z.string().optional(),
    memory: z.string().optional(),
  }),
  platformVersion: z.string().optional(),
  pullStartedAt: z.iso.datetime().optional(),
  pullStoppedAt: z.iso.datetime().optional(),
  startedAt: z.iso.datetime().optional(),
  startedBy: z.string().optional(),
  stopCode: z.string().optional(),
  stoppedAt: z.iso.datetime().optional(),
  stoppedReason: z.string().optional(),
  stoppingAt: z.iso.datetime().optional(),
  taskArn: z.string(),
  taskDefinitionArn: z.string(),
  updatedAt: z.iso.datetime(),
  version: z.number(),
});

/**
 * Parses an Amazon ECS `ECS Task State Change` event delivered by EventBridge.
 *
 * @example
 * ```json
 * {
 *   "version": "0",
 *   "id": "105f6bb1-4da6-c630-4965-35383018cbca",
 *   "detail-type": "ECS Task State Change",
 *   "source": "aws.ecs",
 *   "account": "123456789012",
 *   "time": "2026-11-10T17:32:55Z",
 *   "region": "eu-central-1",
 *   "resources": [
 *     "arn:aws:ecs:eu-central-1:123456789012:task/example-cluster/955a1cbb110241cb9985128773d4ee79"
 *   ],
 *   "detail": {
 *     "clusterArn": "arn:aws:ecs:eu-central-1:123456789012:cluster/example-cluster",
 *     "containers": [],
 *     "createdAt": "2026-11-10T17:32:18.456Z",
 *     "desiredStatus": "STOPPED",
 *     "lastStatus": "STOPPED",
 *     "overrides": { "containerOverrides": [] },
 *     "stopCode": "EssentialContainerExited",
 *     "taskArn": "arn:aws:ecs:eu-central-1:123456789012:task/example-cluster/955a1cbb110241cb9985128773d4ee79",
 *     "taskDefinitionArn": "arn:aws:ecs:eu-central-1:123456789012:task-definition/exit1:1",
 *     "updatedAt": "2026-11-10T17:32:55.486Z",
 *     "version": 5
 *   }
 * }
 * ```
 *
 * @see {@link EcsTaskStateChangeEvent | `EcsTaskStateChangeEvent`}
 * @see {@link https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_task_events.html}
 */
const EcsTaskStateChangeSchema = EventBridgeSchema.extend({
  source: z.literal('aws.ecs'),
  'detail-type': z.literal('ECS Task State Change'),
  detail: EcsTaskStateChangeDetailSchema,
});

export { EcsTaskStateChangeDetailSchema, EcsTaskStateChangeSchema };
