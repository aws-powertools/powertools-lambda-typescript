import { Tracer } from '@aws-lambda-powertools/tracer';

// Tracer parameter fetched from the environment variables (see template.yaml tab)
const tracer = new Tracer();
tracer.getSegment();

// You can also pass the parameter in the constructor
// const tracer = new Tracer({
//     serviceName: 'serverlessAirline'
// });
