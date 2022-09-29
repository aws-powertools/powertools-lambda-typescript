import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path from 'path';
import { ExampleFunction } from './example-function';

export class CdkAppStack extends Stack {
  public constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    new ExampleFunction(this, 'MyFunction', {
      functionName: 'MyFunction',
      tracingActive: true,
    });

    new ExampleFunction(this, 'MyFunctionWithDecorator', {
      functionName: 'MyFunctionWithDecorator',
      tracingActive: true,
    });

    new ExampleFunction(this, 'MyFunctionWithMiddy', {
      functionName: 'MyFunctionWithMiddy',
      tracingActive: true,
    });

    new ExampleFunction(this, 'Tracer.Disabled', {
      functionName: 'Tracer.Disabled',
      tracingActive: true,
    });

    new ExampleFunction(this, 'Tracer.Middleware', {
      functionName: 'Tracer.Middleware',
      tracingActive: true,
    });

    new ExampleFunction(this, 'Tracer.Decorator', {
      functionName: 'Tracer.Decorator',
      tracingActive: true,
    });

    new ExampleFunction(this, 'Tracer.Manual', {
      functionName: 'Tracer.Manual',
      tracingActive: true,
    });

    new ExampleFunction(this, 'Tracer.PatchAllAWSSDK', {
      functionName: 'Tracer.PatchAllAWSSDK',
      tracingActive: true,
    });
    
    new ExampleFunction(this, 'Tracer.PatchAWSSDKv2', {
      functionName: 'Tracer.PatchAWSSDKv2',
      tracingActive: true,
    });

    new ExampleFunction(this, 'Tracer.PatchAWSSDKv3', {
      functionName: 'Tracer.PatchAWSSDKv3',
      tracingActive: true,
    });

    new ExampleFunction(this, 'Tracer.CaptureResponseDisabled', {
      functionName: 'Tracer.CaptureResponseDisabled',
      tracingActive: true,
    });

    new ExampleFunction(this, 'Tracer.CaptureErrorDisabled', {
      functionName: 'Tracer.CaptureErrorDisabled',
      tracingActive: true,
    });

    new ExampleFunction(this, 'MyLayeredFunction', {
      functionName: 'MyLayeredFunction',
      tracingActive: true,
      useLayer: true,
      fnProps: {
        entry: path.join(__dirname, 'example-function.MyFunction.ts')
      }
    });
  }
}
