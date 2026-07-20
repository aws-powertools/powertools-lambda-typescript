import { randomUUID } from 'node:crypto';
import {
  InterfaceVpcEndpointAwsService,
  IpProtocol,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { CapacityProvider } from 'aws-cdk-lib/aws-lambda';
import { TEST_ARCHITECTURES } from '../constants.js';
import { getArchitectureKey } from '../helpers.js';
import type { TestStack } from '../TestStack.js';

/**
 * A Lambda Managed Instances (LMI) capacity provider that can be used in tests.
 *
 * It provisions the networking (VPC + security group) required by the capacity
 * provider to launch EC2 instances, constrained to the architecture under test.
 * The VPC is dual-stack and outbound connectivity is provided over IPv6 via an
 * egress-only internet gateway, avoiding NAT gateways entirely: they are slow
 * to provision/delete and subject to a low default account quota.
 *
 * The capacity provider is created in the same stack as the test functions so
 * it is ephemeral: it exists only for the duration of the test run and is torn
 * down with the rest of the stack. EC2-backed capacity is slow to provision,
 * so create one per test suite and share it across the functions in that suite.
 */
class TestLmiCapacityProvider extends CapacityProvider {
  /**
   * @param stack - The test stack to create the capacity provider in
   * @param architecture - The architecture the capacity provider serves;
   * defaults to the ambient `ARCH` environment variable, which is the right
   * source inside a test suite but must be passed explicitly when a single
   * process builds providers for several architectures (e.g. the shared
   * capacity provider scripts in `lmi/`)
   */
  public constructor(
    stack: Pick<TestStack, 'stack'>,
    architecture: keyof typeof TEST_ARCHITECTURES = getArchitectureKey()
  ) {
    const resourceId = randomUUID().substring(0, 5);
    const vpc = new Vpc(stack.stack, `vpc-${resourceId}`, {
      ipProtocol: IpProtocol.DUAL_STACK,
      // A single AZ keeps the fleet as concentrated as possible so that
      // saturating it forces concurrent invocations to be multiplexed into
      // shared execution environments
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          // With a dual-stack VPC and no NAT gateways, egress from these
          // subnets is IPv6-only via an egress-only internet gateway
          name: 'private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    // The LMI runtime delivers telemetry to CloudWatch Logs through the
    // customer VPC, and the CloudWatch Logs endpoint is not reachable over
    // the VPC's IPv6-only egress path, so give it an interface endpoint
    vpc.addInterfaceEndpoint(`logs-${resourceId}`, {
      service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });
    const securityGroup = new SecurityGroup(stack.stack, `sg-${resourceId}`, {
      vpc,
      allowAllOutbound: true,
      allowAllIpv6Outbound: true,
    });

    super(stack.stack, `cp-${resourceId}`, {
      subnets: vpc.privateSubnets,
      securityGroups: [securityGroup],
      architectures: [TEST_ARCHITECTURES[architecture]],
      // The service minimum; keeps the fleet as small as possible so that
      // concurrent invocations share execution environments
      maxVCpuCount: 12,
    });
  }
}

export { TestLmiCapacityProvider };
