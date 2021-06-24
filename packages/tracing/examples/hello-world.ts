// Populate runtime
require('./../tests/helpers/populateEnvironmentVariables');

process.env.POWERTOOLS_SERVICE_NAME = 'hello-world';

import * as dummyEvent from '../../../tests/resources/events/custom/hello-world.json';
import { context as dummyContext } from '../../../tests/resources/contexts/hello-world';
import { Handler } from 'aws-lambda';
import { Tracer } from '../src';

const tracer = new Tracer();

const lambdaHandler: Handler = async () => {

    tracer.putAnnotation("AnnotationKey", "AnnotationValue");
    tracer.putAnnotation("AnnotationKey", 1234);
    tracer.putAnnotation("AnnotationKey", true);
    tracer.putMetadata("MetadataKey", {});
    tracer.putMetadata("MetadataKey", {}, 'SomeNameSpace');

    return {
        foo: 'bar'
    };

};

lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));