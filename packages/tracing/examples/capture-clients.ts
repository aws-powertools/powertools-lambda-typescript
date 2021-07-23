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

class DummyServiceV2 {
  private customRequestHandler?: null | unknown;
  
  public act(): void {
    return;
  }

  public customizeRequests(callback: unknown): void {
    if (!callback) {
      this.customRequestHandler = null;
    } else if (typeof callback === 'function') {
      this.customRequestHandler = callback;
    } else {
      throw new Error('Invalid callback type \'' + typeof callback + '\' provided in customizeRequests');
    }
  }
}

class DummyServiceV3 {
  private customRequestHandler?: null | unknown;
    
  public act(): void {
    return;
  }
  
}

const lambdaHandler: Handler = async () => {
  const dummyServiceV2 = tracer.captureAWSClient(new DummyServiceV2());
  dummyServiceV2?.act();

  const dummyServiceV3 = tracer.captureAWSv3Client(new DummyServiceV3());
  dummyServiceV3?.act();
};

dummyTracingNamespace(tracer, () => {
  lambdaHandler(dummyEvent, dummyContext, () => console.log('Lambda invoked!'));
});