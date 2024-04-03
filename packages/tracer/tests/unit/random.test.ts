import Namespace from 'cls-hooked';
import { Segment } from 'aws-xray-sdk-core';
import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Tracer } from '../../src/Tracer';

describe('Stuff', () => {
  let ns: Namespace.Namespace;

  beforeEach(() => {
    ns = Namespace.createNamespace('AWSXRay');
    ns.enter(ns.createContext());
    const facade = new Segment('facade');
    ns.set('segment', facade);
  });

  it('should do stuff', async () => {
    const tracer = new Tracer();

    class Lambda implements LambdaInterface {
      private readonly memberVariable: string;

      public constructor(memberVariable: string) {
        this.memberVariable = memberVariable;
      }

      @tracer.captureLambdaHandler()
      public async handler(
        _event: unknown,
        _context: Context
      ): Promise<string> {
        try {
          await fetch(
            // 'https://docs.powertools.aws.dev/lambda/typescript/latest/'
            'http://localhost:3000'
          );
        } catch {}

        return `memberVariable:${this.memberVariable}`;
      }
    }

    // Act / Assess
    const lambda = new Lambda('someValue');
    const handler = lambda.handler.bind(lambda);

    const res = await handler({}, {} as Context);
    expect(res).toBe('memberVariable:someValue');

    const segment = ns.get('segment');
    // make assertions on the segment
    expect(segment.name).toBe('facade');
    expect(segment.subsegments.length).toBe(1);
    expect(segment.subsegments[0].name).toBe('## index.handler');
    expect(segment.subsegments[0].end_time).toBeDefined();
    expect(segment.subsegments[0].subsegments.length).toBe(1);
    expect(segment.subsegments[0].subsegments[0].name).toBe('localhost');
    expect(segment.subsegments[0].subsegments[0].end_time).toBeDefined();
  });
});
