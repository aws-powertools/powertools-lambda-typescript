import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';

const parametersProvider = new SSMProvider();

export const handler = async (): Promise<void> => {
  // Retrieve a single parameter and cache it for 1 minute
  const parameter = await parametersProvider.get('/my/parameter', {
    maxAge: 60,
  }); // (1)
  console.log(parameter);

  // Retrieve multiple parameters from a path prefix and cache them for 2 minutes
  const parameters = await parametersProvider.getMultiple('/my/path/prefix', {
    maxAge: 120,
  });
  for (const [key, value] of Object.entries(parameters || {})) {
    console.log(`${key}: ${value}`);
  }
};
