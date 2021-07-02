import { Segment } from 'aws-xray-sdk-core';
import { Tracer } from 'Tracer';

const TracingNamespace = (tracer: Tracer, handler: () => void): void => {
  const ns = tracer.provider.getNamespace();
  ns.run(() => {
    const segment = new Segment('facade', process.env._X_AMZN_TRACE_ID || null);
    tracer.provider.setSegment(segment);
    handler();
    // segment.close();
  });
};

export {
  TracingNamespace
};