import { describe, expect, it } from 'vitest';
import { EventBridgeEnvelope } from '../../../src/envelopes/eventbridge.js';
import { parse } from '../../../src/parser.js';
import {
  EcsTaskStateChangeDetailSchema,
  EcsTaskStateChangeSchema,
} from '../../../src/schemas/ecs.js';
import type { EcsTaskStateChangeEvent } from '../../../src/types/schema.js';
import { getTestEvent, omit } from '../helpers/utils.js';

describe('Schema: ECS', () => {
  const baseEvent = getTestEvent<EcsTaskStateChangeEvent>({
    eventsPath: 'ecs',
    filename: 'base',
  });

  // Shapes captured from Fargate tasks and the ECS docs, derived from the base event
  const { detail } = baseEvent;
  const [container] = detail.containers;
  const runningDetail = {
    ...omit(
      [
        'executionStoppedAt',
        'stopCode',
        'stoppedAt',
        'stoppedReason',
        'stoppingAt',
      ],
      detail
    ),
    desiredStatus: 'RUNNING',
    lastStatus: 'RUNNING',
    containers: [{ ...omit(['exitCode'], container), lastStatus: 'RUNNING' }],
  };
  const failedToStartDetail = {
    ...omit(['startedAt'], detail),
    stopCode: 'TaskFailedToStart',
    containers: [omit(['exitCode', 'imageDigest'], container)],
  };
  const capturedEvents = [
    {
      name: 'a stopped task whose essential container exited',
      event: baseEvent,
    },
    {
      name: 'a running Fargate task',
      event: { ...baseEvent, detail: runningDetail },
    },
    {
      name: 'a running EC2 task',
      event: {
        ...baseEvent,
        detail: {
          ...omit(
            ['computeId', 'ephemeralStorage', 'platformVersion'],
            runningDetail
          ),
          capacityProviderName: 'example-asg-capacity-provider',
          containerInstanceArn:
            'arn:aws:ecs:eu-central-1:123456789012:container-instance/example-cluster/d1d84798400f49f3b21cb61610c1e',
          launchType: 'EC2',
        },
      },
    },
    {
      name: 'a task whose image could not be pulled',
      event: {
        ...baseEvent,
        detail: {
          ...failedToStartDetail,
          stoppedReason:
            'CannotPullContainerError: pull image manifest has been retried 7 time(s): failed to resolve ref public.ecr.aws/docker/library/busybox:does-not-exist: public.ecr.aws/docker/library/busybox:does-not-exist: not found',
        },
      },
    },
    {
      name: 'a task whose secret could not be fetched',
      event: {
        ...baseEvent,
        detail: {
          ...failedToStartDetail,
          stoppedReason:
            'ResourceInitializationError: unable to pull secrets or registry auth: execution resource retrieval failed: unable to retrieve secret from asm: service call has been retried 1 time(s): failed to fetch secret arn:aws:secretsmanager:eu-central-1:123456789012:secret:example-AbCdEf from secrets manager',
        },
      },
    },
    {
      name: 'a task with task-level and environment overrides',
      event: {
        ...baseEvent,
        detail: {
          ...detail,
          cpu: '512',
          memory: '1024',
          overrides: {
            containerOverrides: [
              {
                environment: [{ name: 'FOO', value: 'bar' }],
                cpu: 128,
                memory: 256,
                name: 'app',
              },
            ],
            cpu: '512',
            memory: '1024',
          },
        },
      },
    },
  ];

  it.each(capturedEvents)('parses $name', ({ event }) => {
    // Prepare
    const input = structuredClone(event);

    // Act
    const result = EcsTaskStateChangeSchema.parse(input);

    // Assess
    expect(result).toStrictEqual(event);
  });

  it('parses the stop fields of a stopped task with the EventBridge envelope', () => {
    // Prepare
    const event = structuredClone(baseEvent);

    // Act
    const result = parse(
      event,
      EventBridgeEnvelope,
      EcsTaskStateChangeDetailSchema
    );

    // Assess
    expect(result).toEqual(
      expect.objectContaining({
        lastStatus: 'STOPPED',
        stopCode: 'EssentialContainerExited',
        stoppedReason: 'Essential container in task exited',
        containers: [expect.objectContaining({ exitCode: 1 })],
      })
    );
  });

  it('throws if the event is not an ECS Task State Change event', () => {
    // Prepare
    const event = {
      ...structuredClone(baseEvent),
      'detail-type': 'ECS Container Instance State Change',
    };

    // Act & Assess
    expect(() => EcsTaskStateChangeSchema.parse(event)).toThrow();
  });

  it('throws if the detail is missing a required field', () => {
    // Prepare
    const event = omit(['taskArn'], structuredClone(detail));

    // Act & Assess
    expect(() => EcsTaskStateChangeDetailSchema.parse(event)).toThrow();
  });

  it('throws if a task attribute has no name', () => {
    // Prepare
    const event = {
      ...structuredClone(detail),
      attributes: [{ value: 'x86_64' }],
    };

    // Act & Assess
    expect(() => EcsTaskStateChangeDetailSchema.parse(event)).toThrow();
  });
});
