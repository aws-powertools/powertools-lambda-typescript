import { SSMProvider } from '@aws-lambda-powertools/parameters/ssm';

const parametersProvider = new SSMProvider();

export const handler = async (): Promise<void> => {
  // Retrieve a single parameter
  const parameter = await parametersProvider.get('/my/parameter', { maxAge: 60 }); // 1 minute
  console.log(parameter);

  // Retrieve multiple parameters from a path prefix
  const parameters = await parametersProvider.getMultiple('/my/path/prefix', { maxAge: 120 }); // 2 minutes
  for (const [ key, value ] of Object.entries(parameters || {})) {
    console.log(`${key}: ${value}`);
  }
};