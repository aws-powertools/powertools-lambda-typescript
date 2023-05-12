import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';

const parametersProvider = new SSMProvider();

export const handler = async (): Promise<void> => {
  /**
   * This will display:
   * /param/a: [some value]
   * /param/b: [some value]
   * /param/c: undefined
   */
  const parameters = await parametersProvider.getMultiple('/param', {
    transform: 'json',
  });
  for (const [key, value] of Object.entries(parameters || {})) {
    console.log(`${key}: ${value}`);
  }

  try {
    // This will throw a TransformParameterError
    const parameters2 = await parametersProvider.getMultiple('/param', {
      transform: 'json',
      throwOnTransformError: true,
    });
    for (const [key, value] of Object.entries(parameters2 || {})) {
      console.log(`${key}: ${value}`);
    }
  } catch (err) {
    console.error(err);
  }
};
