import {
  Context,
  CloudFormationCustomResourceEvent
} from 'aws-lambda';
import {
  SSMClient,
  PutParameterCommand,
  DeleteParameterCommand
} from '@aws-sdk/client-ssm';

const client = new SSMClient({});

/**
 * Create a new SSM SecureString parameter, overwriting any existing parameter with the same name if it exists.
 */
const createResource = async (event: CloudFormationCustomResourceEvent): Promise<void> => {
  const { ResourceProperties } = event;
  const { Name, Value } = ResourceProperties;

  await client.send(new PutParameterCommand({
    Name,
    Value,
    Type: 'SecureString',
    Overwrite: true,
  }));
};

/**
 * Delete an existing SSM parameter.
 */
const deleteResource = async (event: CloudFormationCustomResourceEvent): Promise<void> => {
  const { ResourceProperties } = event;
  const { Name } = ResourceProperties;

  await client.send(new DeleteParameterCommand({
    Name,
  }));
};

/**
 * Custom resource handler for creating and deleting SSM SecureString parameters. This is used by
 * CDK to create and delete the SSM SecureString parameters that are used to test the SSMProvider.
 * 
 * We need a custom resource because CDK does not support creating SSM SecureString parameters.
 */
export const handler = async (event: CloudFormationCustomResourceEvent, _context: Context): Promise<void> => {
  if (event.RequestType === 'Create' || event.RequestType === 'Update') {
    await createResource(event);
  } else if (event.RequestType === 'Delete') {
    await deleteResource(event);
  } else {
    console.error('Unknown request type', event);
    throw new Error('Unknown request type');
  }
};