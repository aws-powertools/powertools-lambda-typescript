import { Metrics } from '@aws-lambda-powertools/metrics';

// Metrics parameters fetched from the environment variables (see template.yaml tab)
const metrics = new Metrics();

// You can also pass the parameters in the constructor
// const metrics = new Metrics({
//   namespace: 'serverlessAirline',
//   serviceName: 'orders'
// });