// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

// Additional runtime variables
process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';
process.env.AWS_XRAY_DEBUG_MODE = 'TRUE';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { TracingNamespace as dummyTracingNamespace } from './utils/namespaces/hello-world';
import { Handler } from 'aws-lambda';
import { Tracer } from '../src';

const tracer = new Tracer();

const lambdaHandler: Handler = async () => {
  tracer.putAnnotation('StringAnnotation', 'AnnotationValue');
  tracer.putAnnotation('NumberAnnotation', 1234);
  tracer.putAnnotation('BooleanAnnotationKey', true);
  tracer.putMetadata('MetadataKey', {});
  tracer.putMetadata('MetadataKey', {}, 'SomeNameSpace');

  return {
    foo: 'bar'
  };

};

dummyTracingNamespace(tracer, () => {
  lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
});