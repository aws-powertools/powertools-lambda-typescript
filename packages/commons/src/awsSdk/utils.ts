import { SdkClient } from '../types/awsSdk';

/**
 * @internal
 * Type guard to check if the client provided is a valid AWS SDK v3 client
 */
const isSdkClient = (client: unknown): client is SdkClient =>
  typeof client === 'object' &&
  client !== null &&
  'send' in client &&
  typeof client.send === 'function' &&
  'config' in client &&
  client.config !== undefined &&
  typeof client.config === 'object' &&
  client.config !== null &&
  'middlewareStack' in client &&
  client.middlewareStack !== undefined &&
  typeof client.middlewareStack === 'object' &&
  client.middlewareStack !== null &&
  'identify' in client.middlewareStack &&
  typeof client.middlewareStack.identify === 'function' &&
  'addRelativeTo' in client.middlewareStack &&
  typeof client.middlewareStack.addRelativeTo === 'function';

export { isSdkClient };
