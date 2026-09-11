import {
  CloudFormationClient,
  CreateStackCommand,
  DeleteStackCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { mockClient } from 'aws-sdk-client-mock';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import '../../src/setupEnv.js';

describe('toReceiveCommandWith', () => {
  const client = new CloudFormationClient({});
  const clientMock = mockClient(client);

  beforeEach(() => {
    clientMock.reset();
    clientMock.resolves({});
  });

  afterAll(() => {
    clientMock.restore();
    client.destroy();
  });

  it.each([
    { StackName: 'my-stack', NextToken: 'next' },
    { StackName: 'my-stack' },
    { StackName: expect.stringContaining('stack') },
    {},
  ])('matches the expected input %j', async (expected) => {
    // Prepare
    const command = new DescribeStacksCommand({
      StackName: 'my-stack',
      NextToken: 'next',
    });

    // Act
    await client.send(command);

    // Assess
    expect(clientMock).toReceiveCommandWith(DescribeStacksCommand, expected);
  });

  it('matches nested asymmetric matchers', async () => {
    // Prepare
    const command = new CreateStackCommand({
      StackName: 'my-stack',
      Tags: [{ Key: 'service', Value: 'my-service' }],
    });

    // Act
    await client.send(command);

    // Assess
    expect(clientMock).toReceiveCommandWith(CreateStackCommand, {
      Tags: expect.arrayContaining([
        expect.objectContaining({ Value: expect.stringContaining('service') }),
      ]),
    });
  });

  it('requires nested objects to match unless an asymmetric matcher is used', async () => {
    // Prepare
    const command = new CreateStackCommand({
      StackName: 'my-stack',
      Parameters: [{ ParameterKey: 'service', ParameterValue: 'my-service' }],
    });

    // Act
    await client.send(command);

    // Assess
    expect(clientMock).not.toReceiveCommandWith(CreateStackCommand, {
      Parameters: [{ ParameterKey: 'service' }],
    });
  });

  it('finds a matching input among multiple calls', async () => {
    // Prepare
    const stackNames = ['first', 'matching', 'last'];

    // Act
    for (const StackName of stackNames) {
      await client.send(new DescribeStacksCommand({ StackName }));
    }

    // Assess
    expect(clientMock).toReceiveCommandWith(DescribeStacksCommand, {
      StackName: 'matching',
    });
  });

  it('ignores matching inputs sent to a different command', async () => {
    // Prepare
    const input = { StackName: 'my-stack' };

    // Act
    await client.send(new DeleteStackCommand(input));

    // Assess
    expect(clientMock).not.toReceiveCommandWith(DescribeStacksCommand, input);
    expect(() =>
      expect(clientMock).toReceiveCommandWith(DescribeStacksCommand, input)
    ).toThrow('Received inputs (call count: 0):');
  });

  it('reports the expected input and recorded inputs on a mismatch', async () => {
    // Prepare
    const command = new DescribeStacksCommand({ StackName: 'actual-stack' });

    // Act
    await client.send(command);

    // Assess
    expect(clientMock).not.toReceiveCommandWith(DescribeStacksCommand, {
      StackName: 'expected-stack',
    });
    expect(() =>
      expect(clientMock).toReceiveCommandWith(DescribeStacksCommand, {
        StackName: 'expected-stack',
      })
    ).toThrow(
      /CloudFormationClient DescribeStacksCommand to receive input containing.*expected-stack.*\nReceived inputs \(call count: 1\):.*actual-stack/s
    );
  });

  it('reports no calls for an unused client', () => {
    // Prepare
    const expected = { StackName: 'my-stack' };

    // Act
    const assertCommand = () =>
      expect(clientMock).toReceiveCommandWith(DescribeStacksCommand, expected);

    // Assess
    expect(assertCommand).toThrow('Received inputs (call count: 0):');
    expect(clientMock).not.toReceiveCommandWith(
      DescribeStacksCommand,
      expected
    );
  });

  it('reports a matching call when a negated assertion fails', async () => {
    // Prepare
    const input = { StackName: 'my-stack' };

    // Act
    await client.send(new DescribeStacksCommand(input));

    // Assess
    expect(() =>
      expect(clientMock).not.toReceiveCommandWith(DescribeStacksCommand, input)
    ).toThrow(
      /DescribeStacksCommand not to receive input containing.*my-stack/s
    );
  });

  it('supports asymmetric command assertions', async () => {
    // Prepare
    const input = { StackName: 'my-stack' };

    // Act
    await client.send(new DescribeStacksCommand(input));

    // Assess
    expect({ client: clientMock }).toEqual({
      client: expect.toReceiveCommandWith(DescribeStacksCommand, input),
    });
  });
});
