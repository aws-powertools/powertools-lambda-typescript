import { Segment } from 'aws-xray-sdk-core';
import { Tracer } from 'Tracer';

const TracingNamespace = (tracer: Tracer, handler: () => void): void => {
    let ns = tracer.provider.getNamespace()
    ns.run(() => {
        // TODO: revisit and mock AWS Lambda namespace
        let segment = new Segment('Lambda Handler')
        tracer.provider.setSegment(segment)
        handler()
        segment.close()
    })
}

export {
    TracingNamespace
}