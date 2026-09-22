import { randomUUID } from 'node:crypto';
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  InterfaceVpcEndpointAwsService,
  IpProtocol,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { CapacityProvider } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
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
      // A single AZ keeps the networking minimal; the tests pin execution
      // environments per function rather than relying on fleet placement
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

    // Without an explicit log group Lambda creates its own
    // `/aws/lambda/capacity-provider/<name>` outside the stack, with no
    // retention, and it outlives teardown
    const logGroup = new LogGroup(stack.stack, `cp-logs-${resourceId}`, {
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    super(stack.stack, `cp-${resourceId}`, {
      subnets: vpc.privateSubnets,
      securityGroups: [securityGroup],
      architectures: [TEST_ARCHITECTURES[architecture]],
      logGroup,
      // Sized for the CI matrix rather than the service minimum of 12. Every
      // LMI cell of an architecture (two packages x two Node.js versions)
      // attaches a function that Lambda places on its own 4 vCPU instance, so
      // the fleet sits at 16 vCPU. The cap is only enforced on launches made
      // once the fleet has reached it, so at 12 a single failed instance
      // launch could never be replaced. Two spare instances' worth of headroom
      // covers that; the tests do not depend on the fleet being small because
      // each function pins its own execution environments.
      maxVCpuCount: 24,
    });
  }
}

export { TestLmiCapacityProvider };
