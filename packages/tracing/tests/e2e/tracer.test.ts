// /**
//  * Test tracer manual mode
//  *
//  * @group e2e/tracer/all
//  */

// import { randomUUID, randomBytes } from 'crypto';
// import { join } from 'path';
// import { Tracing, Architecture } from 'aws-cdk-lib/aws-lambda';
// import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
// import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
// import { App, Duration, Stack, RemovalPolicy } from 'aws-cdk-lib';
// import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';
// import * as AWS from 'aws-sdk';
// import { getTraces, getInvocationSubsegment, splitSegmentsByName } from '../helpers/tracesUtils';
// import { isValidRuntimeKey } from '@aws-lambda-powertools/commons/tests/utils/e2eUtils';
// import { 
//   SETUP_TIMEOUT, 
//   TEARDOWN_TIMEOUT, 
//   TEST_CASE_TIMEOUT,
//   expectedCustomAnnotationKey, 
//   expectedCustomAnnotationValue, 
//   expectedCustomMetadataKey, 
//   expectedCustomMetadataValue, 
//   expectedCustomResponseValue, 
//   expectedCustomErrorMessage,
//   InvocationMap,
// } from './constants';

// const xray = new AWS.XRay();
// const lambdaClient = new AWS.Lambda();
// const stsClient = new AWS.STS();

// const runtime: string = process.env.RUNTIME || 'nodejs14x';

// if (!isValidRuntimeKey(runtime)) {
//   throw new Error(`Invalid runtime key value: ${runtime}`);
// }

// describe(`Tracer E2E tests for runtime: ${runtime}`, () => {

//   const startTime = new Date();
//   const invocations = 3;

//   let integTestApp: App;
//   let stack: Stack;
//   let invocationsMap: InvocationMap;

//   const addLambdaFunctions = async (stack: Stack, functionConfigs: string[], tableWithWriteAccess: Table): Promise<InvocationMap> => {
//     const region = process.env.AWS_REGION;
//     const identity = await stsClient.getCallerIdentity().promise();
//     const account = identity.Account;

//     const map: InvocationMap = {};

//     for (const functionConfig of functionConfigs) {
//       const expectedServiceName = randomUUID();
//       const fileName = functionConfig.split('-')[0];
//       const functionInstanceName = `${functionConfig}-${randomBytes(12).toString('hex')}`;
//       const fn = new NodejsFunction(stack, functionConfig, {
//         entry: join(__dirname, `tracer.test.${fileName}.ts`),
//         handler: 'handler',
//         functionName: functionInstanceName,
//         tracing: Tracing.ACTIVE,
//         architecture: Architecture.X86_64,
//         memorySize: 256,
//         environment: {
//           EXPECTED_SERVICE_NAME: expectedServiceName,
//           EXPECTED_CUSTOM_ANNOTATION_KEY: expectedCustomAnnotationKey,
//           EXPECTED_CUSTOM_ANNOTATION_VALUE: expectedCustomAnnotationValue,
//           EXPECTED_CUSTOM_METADATA_KEY: expectedCustomMetadataKey,
//           EXPECTED_CUSTOM_METADATA_VALUE: JSON.stringify(expectedCustomMetadataValue),
//           EXPECTED_CUSTOM_RESPONSE_VALUE: JSON.stringify(expectedCustomResponseValue),
//           EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage,
//           POWERTOOLS_TRACER_CAPTURE_RESPONSE: functionConfig.indexOf('NoCaptureErrorResponse') !== -1 ? 'false' : 'true',
//           POWERTOOLS_TRACER_CAPTURE_ERROR: functionConfig.indexOf('NoCaptureErrorResponse') !== -1 ? 'false' : 'true',
//           POWERTOOLS_TRACE_ENABLED: functionConfig.indexOf('Disabled') !== -1 ? 'false' : 'true',
//           TEST_TABLE_NAME: tableWithWriteAccess.tableName,
//         },
//         timeout: Duration.seconds(30),
//         bundling: {
//           externalModules: ['aws-sdk'],
//         }
//       });
//       tableWithWriteAccess.grantWriteData(fn);

//       map[functionConfig] = {
//         serviceName: expectedServiceName,
//         functionName: functionInstanceName,
//         resourceArn: `arn:aws:lambda:${region}:${account}:function:${functionInstanceName}`, // ARN is still a token at this point, so we construct the ARN manually
//       };
//     }
    
//     return map;
//   };
  
//   beforeAll(async () => {

//     // Prepare
//     integTestApp = new App();
//     stack = new Stack(integTestApp, 'TracerIntegTest'); // TODO: change stack name to be unique

//     const table = new Table(stack, 'Table', {
//       tableName: randomUUID(),
//       partitionKey: {
//         name: 'id',
//         type: AttributeType.STRING
//       },
//       billingMode: BillingMode.PAY_PER_REQUEST,
//       removalPolicy: RemovalPolicy.DESTROY
//     });

//     const functionConfigs = [
//       'Manual',
//       'Middleware',
//       'Middleware-Disabled',
//       'Middleware-NoCaptureErrorResponse',
//       'Decorator',
//       'DecoratorWithAsyncHandler',
//       'Decorator-Disabled',
//       'Decorator-NoCaptureErrorResponse',
//     ];
//     invocationsMap = await addLambdaFunctions(stack, functionConfigs, table);

//     await deployStack(integTestApp, stack);

//     // Act
//     Object.values(invocationsMap).forEach(async ({ functionName }) => {
//       for (let i = 0; i < invocations; i++) {
//         await lambdaClient.invoke({
//           FunctionName: functionName,
//           LogType: 'Tail',
//           Payload: JSON.stringify({
//             throw: i === invocations - 1 ? true : false, // only last invocation should throw
//             sdkV2: i === 1 ? 'all' : 'client', // only second invocation should use captureAll
//             invocation: i + 1, // Pass invocation number for easier debugging
//           }),
//         }).promise();
//       }
//     });
    
//   }, SETUP_TIMEOUT);

//   afterAll(async () => {

//     if (!process.env.DISABLE_TEARDOWN) {
//       await destroyStack(integTestApp, stack);
//     }

//   }, TEARDOWN_TIMEOUT);

//   it('Verifies that a when Tracer is used to manually instrument a function all custom traces are generated with correct annotations and metadata', async () => {
    
//     const resourceArn = invocationsMap['Manual'].resourceArn;
//     const expectedServiceName = invocationsMap['Manual'].serviceName;
    
//     // Assess
//     // Retrieve traces from X-Ray using Resource ARN as filter
//     const sortedTraces = await getTraces(xray, startTime, resourceArn, invocations, 5);

//     for (let i = 0; i < invocations; i++) {
//       expect(sortedTraces[i].Segments.length).toBe(5);

//       const invocationSubsegment = getInvocationSubsegment(sortedTraces[i]);

//       if (invocationSubsegment?.subsegments !== undefined) {
//         expect(invocationSubsegment?.subsegments?.length).toBe(1);
        
//         const handlerSubsegment = invocationSubsegment?.subsegments[0];
//         expect(handlerSubsegment.name).toBe('## index.handler');
        
//         if (handlerSubsegment?.subsegments !== undefined) {
//           expect(handlerSubsegment?.subsegments?.length).toBe(3);

//           const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [ 'DynamoDB', 'httpbin.org' ]);
//           // Assert that there are exactly two subsegment with the name 'DynamoDB'
//           expect(subsegments.get('DynamoDB')?.length).toBe(2);
//           // Assert that there is exactly one subsegment with the name 'httpbin.org'
//           expect(subsegments.get('httpbin.org')?.length).toBe(1);
//           // Assert that there are exactly zero other subsegments
//           expect(subsegments.get('other')?.length).toBe(0);
          
//           const { annotations, metadata } = handlerSubsegment;

//           if (annotations !== undefined && metadata !== undefined) {
//             // Assert that the annotations are as expected
//             expect(annotations['ColdStart']).toEqual(true ? i === 0 : false);
//             expect(annotations['Service']).toEqual(expectedServiceName);
//             expect(annotations[expectedCustomAnnotationKey]).toEqual(expectedCustomAnnotationValue);
//             // Assert that the metadata object is as expected
//             expect(metadata[expectedServiceName][expectedCustomMetadataKey])
//               .toEqual(expectedCustomMetadataValue);
            
//             if (i === invocations - 1) {
//               // Assert that the subsegment has the expected fault
//               expect(invocationSubsegment.error).toBe(true);
//               expect(handlerSubsegment.fault).toBe(true);
//               expect(handlerSubsegment.hasOwnProperty('cause')).toBe(true);
//               expect(handlerSubsegment.cause?.exceptions[0].message).toBe(expectedCustomErrorMessage);
//             } else {
//               // Assert that the metadata object contains the response
//               expect(metadata[expectedServiceName]['index.handler response'])
//                 .toEqual(expectedCustomResponseValue);
//             }
//           } else {
//             // Make test fail if there are no annotations or metadata
//             expect('annotations !== undefined && metadata !== undefined')
//               .toBe('annotations === undefined && metadata === undefined');
//           }
//         } else {
//           // Make test fail if the handlerSubsegment subsegment doesn't have any subsebment
//           expect('handlerSubsegment?.subsegments !== undefined')
//             .toBe('handlerSubsegment?.subsegments === undefined');
//         }
//       } else {
//         // Make test fail if the Invocation subsegment doesn't have an handler subsebment
//         expect('invocationSubsegment?.subsegments !== undefined')
//           .toBe('invocationSubsegment?.subsegments === undefined');
//       }
//     }

//   }, TEST_CASE_TIMEOUT);

//   // it('Verifies that a when Tracer is used as middleware all custom traces are generated with correct annotations and metadata', async () => {
    
//   //   const resourceArn = invocationsMap['Middleware'].resourceArn;
//   //   const expectedServiceName = invocationsMap['Middleware'].serviceName;

//   //   // Assess
//   //   // Retrieve traces from X-Ray using Resource ARN as filter
//   //   const sortedTraces = await getTraces(xray, startTime, resourceArn, invocations, 5);

//   //   for (let i = 0; i < invocations; i++) {
//   //     // Assert that the trace has the expected amount of segments
//   //     expect(sortedTraces[i].Segments.length).toBe(5);

//   //     const invocationSubsegment = getInvocationSubsegment(sortedTraces[i]);

//   //     if (invocationSubsegment?.subsegments !== undefined) {
//   //       expect(invocationSubsegment?.subsegments?.length).toBe(1);
        
//   //       const handlerSubsegment = invocationSubsegment?.subsegments[0];
//   //       expect(handlerSubsegment.name).toBe('## index.handler');
        
//   //       if (handlerSubsegment?.subsegments !== undefined) {
//   //         expect(handlerSubsegment?.subsegments?.length).toBe(3);

//   //         const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [ 'DynamoDB', 'httpbin.org' ]);
//   //         // Assert that there are exactly two subsegment with the name 'DynamoDB'
//   //         expect(subsegments.get('DynamoDB')?.length).toBe(2);
//   //         // Assert that there is exactly one subsegment with the name 'httpbin.org'
//   //         expect(subsegments.get('httpbin.org')?.length).toBe(1);
//   //         // Assert that there are exactly zero other subsegments
//   //         expect(subsegments.get('other')?.length).toBe(0);
          
//   //         const { annotations, metadata } = handlerSubsegment;

//   //         if (annotations !== undefined && metadata !== undefined) {
//   //           // Assert that the annotations are as expected
//   //           expect(annotations['ColdStart']).toEqual(true ? i === 0 : false);
//   //           expect(annotations['Service']).toEqual(expectedServiceName);
//   //           expect(annotations[expectedCustomAnnotationKey]).toEqual(expectedCustomAnnotationValue);
//   //           // Assert that the metadata object is as expected
//   //           expect(metadata[expectedServiceName][expectedCustomMetadataKey])
//   //             .toEqual(expectedCustomMetadataValue);
            
//   //           if (i === invocations - 1) {
//   //             // Assert that the subsegment has the expected fault
//   //             expect(invocationSubsegment.error).toBe(true);
//   //             expect(handlerSubsegment.fault).toBe(true);
//   //             expect(handlerSubsegment.hasOwnProperty('cause')).toBe(true);
//   //             expect(handlerSubsegment.cause?.exceptions[0].message).toBe(expectedCustomErrorMessage);
//   //           } else {
//   //             // Assert that the metadata object contains the response
//   //             expect(metadata[expectedServiceName]['index.handler response'])
//   //               .toEqual(expectedCustomResponseValue);
//   //           }
//   //         } else {
//   //           // Make test fail if there are no annotations or metadata
//   //           expect('annotations !== undefined && metadata !== undefined')
//   //             .toBe('annotations === undefined && metadata === undefined');
//   //         }
//   //       } else {
//   //         // Make test fail if the handlerSubsegment subsegment doesn't have any subsebment
//   //         expect('handlerSubsegment?.subsegments !== undefined')
//   //           .toBe('handlerSubsegment?.subsegments === undefined');
//   //       }
//   //     } else {
//   //       // Make test fail if the Invocation subsegment doesn't have an handler subsebment
//   //       expect('invocationSubsegment?.subsegments !== undefined')
//   //         .toBe('invocationSubsegment?.subsegments === undefined');
//   //     }
//   //   }

//   // }, TEST_CASE_TIMEOUT);

//   // it('Verifies that a when Tracer is used as middleware, with errors & response capturing disabled, all custom traces are generated with correct annotations', async () => {
    
//   //   const resourceArn = invocationsMap['Middleware-NoCaptureErrorResponse'].resourceArn;
//   //   const expectedServiceName = invocationsMap['Middleware-NoCaptureErrorResponse'].serviceName;

//   //   // Assess
//   //   // Retrieve traces from X-Ray using Resource ARN as filter
//   //   const sortedTraces = await getTraces(xray, startTime, resourceArn, invocations, 5);

//   //   for (let i = 0; i < invocations; i++) {
//   //     // Assert that the trace has the expected amount of segments
//   //     expect(sortedTraces[i].Segments.length).toBe(5);

//   //     const invocationSubsegment = getInvocationSubsegment(sortedTraces[i]);

//   //     if (invocationSubsegment?.subsegments !== undefined) {
//   //       expect(invocationSubsegment?.subsegments?.length).toBe(1);
        
//   //       const handlerSubsegment = invocationSubsegment?.subsegments[0];
//   //       expect(handlerSubsegment.name).toBe('## index.handler');
        
//   //       if (handlerSubsegment?.subsegments !== undefined) {
//   //         expect(handlerSubsegment?.subsegments?.length).toBe(3);

//   //         const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [ 'DynamoDB', 'httpbin.org' ]);
//   //         // Assert that there are exactly two subsegment with the name 'DynamoDB'
//   //         expect(subsegments.get('DynamoDB')?.length).toBe(2);
//   //         // Assert that there is exactly one subsegment with the name 'httpbin.org'
//   //         expect(subsegments.get('httpbin.org')?.length).toBe(1);
//   //         // Assert that there are exactly zero other subsegments
//   //         expect(subsegments.get('other')?.length).toBe(0);
          
//   //         const { annotations, metadata } = handlerSubsegment;

//   //         if (annotations !== undefined && metadata !== undefined) {
//   //           // Assert that the annotations are as expected
//   //           expect(annotations['ColdStart']).toEqual(true ? i === 0 : false);
//   //           expect(annotations['Service']).toEqual(expectedServiceName);
//   //           expect(annotations[expectedCustomAnnotationKey]).toEqual(expectedCustomAnnotationValue);
//   //           // Assert that the metadata object is as expected
//   //           expect(metadata[expectedServiceName][expectedCustomMetadataKey])
//   //             .toEqual(expectedCustomMetadataValue);
            
//   //           if (i === invocations - 1) {
//   //             // Assert that the subsegment has the expected fault
//   //             expect(invocationSubsegment.error).toBe(true);
//   //             expect(handlerSubsegment.error).toBe(true);
//   //             // Assert that no error was captured on the subsegment
//   //             expect(handlerSubsegment.hasOwnProperty('cause')).toBe(false);
//   //           } else {
//   //             // Assert that the metadata object does not contain the response object
//   //             expect(metadata[expectedServiceName].hasOwnProperty('index.handler response')).toBe(false);
//   //           }
//   //         } else {
//   //           // Make test fail if there are no annotations or metadata
//   //           expect('annotations !== undefined && metadata !== undefined')
//   //             .toBe('annotations === undefined && metadata === undefined');
//   //         }
//   //       } else {
//   //         // Make test fail if the handlerSubsegment subsegment doesn't have any subsebment
//   //         expect('handlerSubsegment?.subsegments !== undefined')
//   //           .toBe('handlerSubsegment?.subsegments === undefined');
//   //       }
//   //     } else {
//   //       // Make test fail if the Invocation subsegment doesn't have an handler subsebment
//   //       expect('invocationSubsegment?.subsegments !== undefined')
//   //         .toBe('invocationSubsegment?.subsegments === undefined');
//   //     }
//   //   }

//   // }, TEST_CASE_TIMEOUT);

//   // it('Verifies that a when tracing is disabled in middleware mode no custom traces are generated', async () => {
    
//   //   const resourceArn = invocationsMap['Middleware-Disabled'].resourceArn;
    
//   //   // Assess
//   //   // Retrieve traces from X-Ray using Resource ARN as filter
//   //   const sortedTraces = await getTraces(xray, startTime, resourceArn, invocations, 2);

//   //   for (let i = 0; i < invocations; i++) {
//   //     // Assert that the trace has the expected amount of segments
//   //     expect(sortedTraces[i].Segments.length).toBe(2);

//   //     const invocationSubsegment = getInvocationSubsegment(sortedTraces[i]);

//   //     expect(invocationSubsegment?.subsegments).toBeUndefined();
        
//   //     if (i === invocations - 1) {
//   //       // Assert that the subsegment has the expected fault
//   //       expect(invocationSubsegment.error).toBe(true);
//   //     }
//   //   }

//   // }, TEST_CASE_TIMEOUT);

//   // it('Verifies that a when Tracer is used as decorator all custom traces are generated with correct annotations and metadata', async () => {
    
//   //   const resourceArn = invocationsMap['Decorator'].resourceArn;
//   //   const expectedServiceName = invocationsMap['Decorator'].serviceName;
    
//   //   // Assess
//   //   // Retrieve traces from X-Ray using Resource ARN as filter
//   //   const sortedTraces = await getTraces(xray, startTime, resourceArn, invocations, 5);

//   //   for (let i = 0; i < invocations; i++) {
//   //     // Assert that the trace has the expected amount of segments
//   //     expect(sortedTraces[i].Segments.length).toBe(5);

//   //     const invocationSubsegment = getInvocationSubsegment(sortedTraces[i]);

//   //     if (invocationSubsegment?.subsegments !== undefined) {
//   //       expect(invocationSubsegment?.subsegments?.length).toBe(1);
        
//   //       const handlerSubsegment = invocationSubsegment?.subsegments[0];
//   //       expect(handlerSubsegment.name).toBe('## index.handler');
        
//   //       if (handlerSubsegment?.subsegments !== undefined) {
//   //         expect(handlerSubsegment?.subsegments?.length).toBe(4);
          
//   //         const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [ 'DynamoDB', 'httpbin.org', '### myMethod' ]);
//   //         // Assert that there are exactly two subsegment with the name 'DynamoDB'
//   //         expect(subsegments.get('DynamoDB')?.length).toBe(2);
//   //         // Assert that there is exactly one subsegment with the name 'httpbin.org'
//   //         expect(subsegments.get('httpbin.org')?.length).toBe(1);
//   //         // Assert that there is exactly one subsegment with the name '### myMethod'
//   //         expect(subsegments.get('### myMethod')?.length).toBe(1);
//   //         // Assert that there are exactly zero other subsegments
//   //         expect(subsegments.get('other')?.length).toBe(0);

//   //         const methodSubsegment = subsegments.get('### myMethod') || [];
//   //         const { metadata } = methodSubsegment[0];

//   //         if (metadata !== undefined) {
//   //           // Assert that the metadata object is as expected
//   //           expect(metadata[expectedServiceName]['myMethod response'])
//   //             .toEqual(expectedCustomResponseValue);
//   //         } else {
//   //           // Make test fail if there is no metadata
//   //           expect('metadata !== undefined')
//   //             .toBe('metadata === undefined');
//   //         }
//   //       } else {
//   //         // Make test fail if the handlerSubsegment subsegment doesn't have any subsebment
//   //         expect('handlerSubsegment?.subsegments !== undefined')
//   //           .toBe('handlerSubsegment?.subsegments === undefined');
//   //       }
        
//   //       const { annotations, metadata } = handlerSubsegment;

//   //       if (annotations !== undefined && metadata !== undefined) {
//   //         // Assert that the annotations are as expected
//   //         expect(annotations['ColdStart']).toEqual(true ? i === 0 : false);
//   //         expect(annotations['Service']).toEqual(expectedServiceName);
//   //         expect(annotations[expectedCustomAnnotationKey]).toEqual(expectedCustomAnnotationValue);
//   //         // Assert that the metadata object is as expected
//   //         expect(metadata[expectedServiceName][expectedCustomMetadataKey])
//   //           .toEqual(expectedCustomMetadataValue);
          
//   //         if (i === invocations - 1) {
//   //           // Assert that the subsegment has the expected fault
//   //           expect(invocationSubsegment.error).toBe(true);
//   //           expect(handlerSubsegment.fault).toBe(true);
//   //           expect(handlerSubsegment.hasOwnProperty('cause')).toBe(true);
//   //           expect(handlerSubsegment.cause?.exceptions[0].message).toBe(expectedCustomErrorMessage);
//   //         } else {
//   //           // Assert that the metadata object contains the response
//   //           expect(metadata[expectedServiceName]['index.handler response'])
//   //             .toEqual(expectedCustomResponseValue);
//   //         }
//   //       } else {
//   //         // Make test fail if there are no annotations or metadata
//   //         expect('annotations !== undefined && metadata !== undefined')
//   //           .toBe('annotations === undefined && metadata === undefined');
//   //       }
//   //     } else {
//   //       // Make test fail if the Invocation subsegment doesn't have an handler subsebment
//   //       expect('invocationSubsegment?.subsegments !== undefined')
//   //         .toBe('invocationSubsegment?.subsegments === undefined');
//   //     }
//   //   }

//   // }, TEST_CASE_TIMEOUT);

//   // it('Verifies that a when Tracer is used as decorator on an async handler all custom traces are generated with correct annotations and metadata', async () => {
    
//   //   const resourceArn = invocationsMap['DecoratorWithAsyncHandler'].resourceArn;
//   //   const expectedServiceName = invocationsMap['DecoratorWithAsyncHandler'].serviceName;
    
//   //   // Assess
//   //   // Retrieve traces from X-Ray using Resource ARN as filter
//   //   const sortedTraces = await getTraces(xray, startTime, resourceArn, invocations, 5);

//   //   for (let i = 0; i < invocations; i++) {
//   //     // Assert that the trace has the expected amount of segments
//   //     expect(sortedTraces[i].Segments.length).toBe(5);

//   //     const invocationSubsegment = getInvocationSubsegment(sortedTraces[i]);

//   //     if (invocationSubsegment?.subsegments !== undefined) {
//   //       expect(invocationSubsegment?.subsegments?.length).toBe(1);
        
//   //       const handlerSubsegment = invocationSubsegment?.subsegments[0];
//   //       expect(handlerSubsegment.name).toBe('## index.handler');
        
//   //       if (handlerSubsegment?.subsegments !== undefined) {
//   //         expect(handlerSubsegment?.subsegments?.length).toBe(4);
          
//   //         const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [ 'DynamoDB', 'httpbin.org', '### myMethod' ]);
//   //         // Assert that there are exactly two subsegment with the name 'DynamoDB'
//   //         expect(subsegments.get('DynamoDB')?.length).toBe(2);
//   //         // Assert that there is exactly one subsegment with the name 'httpbin.org'
//   //         expect(subsegments.get('httpbin.org')?.length).toBe(1);
//   //         // Assert that there is exactly one subsegment with the name '### myMethod'
//   //         expect(subsegments.get('### myMethod')?.length).toBe(1);
//   //         // Assert that there are exactly zero other subsegments
//   //         expect(subsegments.get('other')?.length).toBe(0);

//   //         const methodSubsegment = subsegments.get('### myMethod') || [];
//   //         const { metadata } = methodSubsegment[0];

//   //         if (metadata !== undefined) {
//   //           // Assert that the metadata object is as expected
//   //           expect(metadata[expectedServiceName]['myMethod response'])
//   //             .toEqual(expectedCustomResponseValue);
//   //         } else {
//   //           // Make test fail if there is no metadata
//   //           expect('metadata !== undefined')
//   //             .toBe('metadata === undefined');
//   //         }
//   //       } else {
//   //         // Make test fail if the handlerSubsegment subsegment doesn't have any subsebment
//   //         expect('handlerSubsegment?.subsegments !== undefined')
//   //           .toBe('handlerSubsegment?.subsegments === undefined');
//   //       }
        
//   //       const { annotations, metadata } = handlerSubsegment;

//   //       if (annotations !== undefined && metadata !== undefined) {
//   //         // Assert that the annotations are as expected
//   //         expect(annotations['ColdStart']).toEqual(true ? i === 0 : false);
//   //         expect(annotations['Service']).toEqual(expectedServiceName);
//   //         expect(annotations[expectedCustomAnnotationKey]).toEqual(expectedCustomAnnotationValue);
//   //         // Assert that the metadata object is as expected
//   //         expect(metadata[expectedServiceName][expectedCustomMetadataKey])
//   //           .toEqual(expectedCustomMetadataValue);
          
//   //         if (i === invocations - 1) {
//   //           // Assert that the subsegment has the expected fault
//   //           expect(invocationSubsegment.error).toBe(true);
//   //           expect(handlerSubsegment.fault).toBe(true);
//   //           expect(handlerSubsegment.hasOwnProperty('cause')).toBe(true);
//   //           expect(handlerSubsegment.cause?.exceptions[0].message).toBe(expectedCustomErrorMessage);
//   //         } else {
//   //           // Assert that the metadata object contains the response
//   //           expect(metadata[expectedServiceName]['index.handler response'])
//   //             .toEqual(expectedCustomResponseValue);
//   //         }
//   //       } else {
//   //         // Make test fail if there are no annotations or metadata
//   //         expect('annotations !== undefined && metadata !== undefined')
//   //           .toBe('annotations === undefined && metadata === undefined');
//   //       }
//   //     } else {
//   //       // Make test fail if the Invocation subsegment doesn't have an handler subsebment
//   //       expect('invocationSubsegment?.subsegments !== undefined')
//   //         .toBe('invocationSubsegment?.subsegments === undefined');
//   //     }
//   //   }

//   // }, TEST_CASE_TIMEOUT);

//   // it('Verifies that a when Tracer is used as decorator, with errors & response capturing disabled, all custom traces are generated with correct annotations', async () => {
    
//   //   const resourceArn = invocationsMap['Decorator-NoCaptureErrorResponse'].resourceArn;
//   //   const expectedServiceName = invocationsMap['Decorator-NoCaptureErrorResponse'].serviceName;
    
//   //   // Assess
//   //   // Retrieve traces from X-Ray using Resource ARN as filter
//   //   const sortedTraces = await getTraces(xray, startTime, resourceArn, invocations, 5);

//   //   for (let i = 0; i < invocations; i++) {
//   //     // Assert that the trace has the expected amount of segments
//   //     expect(sortedTraces[i].Segments.length).toBe(5);

//   //     const invocationSubsegment = getInvocationSubsegment(sortedTraces[i]);

//   //     if (invocationSubsegment?.subsegments !== undefined) {
//   //       expect(invocationSubsegment?.subsegments?.length).toBe(1);
        
//   //       const handlerSubsegment = invocationSubsegment?.subsegments[0];
//   //       expect(handlerSubsegment.name).toBe('## index.handler');
        
//   //       if (handlerSubsegment?.subsegments !== undefined) {
//   //         expect(handlerSubsegment?.subsegments?.length).toBe(4);
          
//   //         const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [ 'DynamoDB', 'httpbin.org', '### myMethod' ]);
//   //         // Assert that there are exactly two subsegment with the name 'DynamoDB'
//   //         expect(subsegments.get('DynamoDB')?.length).toBe(2);
//   //         // Assert that there is exactly one subsegment with the name 'httpbin.org'
//   //         expect(subsegments.get('httpbin.org')?.length).toBe(1);
//   //         // Assert that there is exactly one subsegment with the name '### myMethod'
//   //         expect(subsegments.get('### myMethod')?.length).toBe(1);
//   //         // Assert that there are exactly zero other subsegments
//   //         expect(subsegments.get('other')?.length).toBe(0);

//   //         // Assert that no response was captured on the subsegment
//   //         const methodSubsegment = subsegments.get('### myMethod') || [];
//   //         expect(methodSubsegment[0].hasOwnProperty('metadata')).toBe(false);
//   //       } else {
//   //         // Make test fail if the handlerSubsegment subsegment doesn't have any subsebment
//   //         expect('handlerSubsegment?.subsegments !== undefined')
//   //           .toBe('handlerSubsegment?.subsegments === undefined');
//   //       }
        
//   //       const { annotations, metadata } = handlerSubsegment;

//   //       if (annotations !== undefined && metadata !== undefined) {
//   //         // Assert that the annotations are as expected
//   //         expect(annotations['ColdStart']).toEqual(true ? i === 0 : false);
//   //         expect(annotations['Service']).toEqual(expectedServiceName);
//   //         expect(annotations[expectedCustomAnnotationKey]).toEqual(expectedCustomAnnotationValue);
//   //         // Assert that the metadata object is as expected
//   //         expect(metadata[expectedServiceName][expectedCustomMetadataKey])
//   //           .toEqual(expectedCustomMetadataValue);
          
//   //         if (i === invocations - 1) {
//   //           // Assert that the subsegment has the expected fault
//   //           expect(invocationSubsegment.error).toBe(true);
//   //           expect(handlerSubsegment.error).toBe(true);
//   //           // Assert that no error was captured on the subsegment
//   //           expect(handlerSubsegment.hasOwnProperty('cause')).toBe(false);
//   //         } else {
//   //           // Assert that the metadata object does not contain the response object
//   //           expect(metadata[expectedServiceName].hasOwnProperty('index.handler response')).toBe(false);
//   //         }
//   //       } else {
//   //         // Make test fail if there are no annotations or metadata
//   //         expect('annotations !== undefined && metadata !== undefined')
//   //           .toBe('annotations === undefined && metadata === undefined');
//   //       }
//   //     } else {
//   //       // Make test fail if the Invocation subsegment doesn't have an handler subsebment
//   //       expect('invocationSubsegment?.subsegments !== undefined')
//   //         .toBe('invocationSubsegment?.subsegments === undefined');
//   //     }
//   //   }

//   // }, TEST_CASE_TIMEOUT);

//   // it('Verifies that a when tracing is disabled in decorator mode no custom traces are generated', async () => {
    
//   //   const resourceArn = invocationsMap['Decorator-Disabled'].resourceArn;
    
//   //   // Assess
//   //   // Retrieve traces from X-Ray using Resource ARN as filter
//   //   const sortedTraces = await getTraces(xray, startTime, resourceArn, invocations, 2);

//   //   for (let i = 0; i < invocations; i++) {
//   //     // Assert that the trace has the expected amount of segments
//   //     expect(sortedTraces[i].Segments.length).toBe(2);

//   //     const invocationSubsegment = getInvocationSubsegment(sortedTraces[i]);

//   //     expect(invocationSubsegment?.subsegments).toBeUndefined();
        
//   //     if (i === invocations - 1) {
//   //       // Assert that the subsegment has the expected fault
//   //       expect(invocationSubsegment.error).toBe(true);
//   //     }
//   //   }

//   // }, TEST_CASE_TIMEOUT);

// });