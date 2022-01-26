// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { CloudFormationStackArtifact } from '@aws-cdk/cx-api';
import { SdkProvider } from 'aws-cdk/lib/api/aws-auth';
import { CloudFormationDeployments } from 'aws-cdk/lib/api/cloudformation-deployments';
import { App, CfnOutput, Stack } from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda-nodejs';
import * as AWS from 'aws-sdk';
const promiseRetry = require('promise-retry');

import { InvocationLogs } from "./InvocationLog";
import { OutputLogEvents } from 'aws-sdk/clients/cloudwatchlogs';

const lambdaClient = new AWS.Lambda();

// TODO: SDK uses AWS_REGION env var as a default one. However, current unit tests verifies against 'eu-central-1' (declared in `helpers/populateEnvrionmentVaraibles.ts`) This is inconsistent with other modules and can trick contributors as `cdk bootstrap` is run in one region, deployed in another region, and CW Log verification in another region
const cloudwatchLogsClient = new AWS.CloudWatchLogs({});

export type StackWithLambdaFunctionOptions  = {
  app: App;
  stackName: string;
  functionName: string;
  functionEntry: string;
  environment: {[key: string]: string};
  logGroupOutputKey: string; 
}

export const createStackWithLambdaFunction = (params: StackWithLambdaFunctionOptions): Stack => {
  
  const stack = new Stack(params.app, params.stackName);
  const testFunction = new lambda.NodejsFunction(stack, `testFunction`, {
    functionName: params.functionName,
    entry: params.functionEntry,
    environment: params.environment,
  });

  new CfnOutput(stack, params.logGroupOutputKey, {
    value: testFunction.logGroup.logGroupName,
  });
  return stack;
}

export const deployStack = async (stackArtifact: CloudFormationStackArtifact ): Promise<{[name:string]: string}> => {
  const sdkProvider = await SdkProvider.withAwsCliCompatibleDefaults({
    profile: process.env.AWS_PROFILE,
  });
  const cloudFormation = new CloudFormationDeployments({ sdkProvider });

  // WHEN lambda function is deployed
  const result = await cloudFormation.deployStack({
    stack: stackArtifact,
    quiet: true,
  });

  return result.outputs;
}

export const invokeFunction = async (functionName: string, times: number = 1): Promise<InvocationLogs[]> => {
  let invocationLogs: InvocationLogs[] = [];
  let promises = [];
    
  for (let i = 0; i < times; i++) {
    const invokePromise = lambdaClient
      .invoke({
        FunctionName: functionName,
        LogType: 'Tail', // Wait until execution completes and return all logs
      })
      .promise()
      .then((response) => {
        invocationLogs.push(new InvocationLogs(response?.LogResult!));
      });
    promises.push(invokePromise);
  }
  await Promise.all(promises)

  return invocationLogs; 
}
export const invokeFunctionAsync = async (functionName: string, times: number = 1): Promise<any[]> => {
  let responses: any[] = [];
  let promises = [];
    
  for (let i = 0; i < times; i++) {
    const invokePromise = lambdaClient
      .invoke({
        FunctionName: functionName,
        InvocationType: 'Event',
      })
      .promise()
      .then(response => {
        responses.push(response);
      });
    promises.push(invokePromise);
  }
  await Promise.all(promises);

  return responses; 
}

export const destroyStack = async (app: App, stack: Stack): Promise<void> => {
  const stackArtifact = app.synth().getStackByName(stack.stackName);

    const sdkProvider = await SdkProvider.withAwsCliCompatibleDefaults({
      profile: process.env.AWS_PROFILE,
    });
    const cloudFormation = new CloudFormationDeployments({ sdkProvider });

    await cloudFormation.destroyStack({
      stack: stackArtifact,
      quiet: true,
    });
}



export const fetchStreams = async (logGroupName: string) => {
  const descLogStreamsResponse = await cloudwatchLogsClient.describeLogStreams({
    logGroupName: logGroupName,
    descending: true,
    // orderBy //TODO, order by lastEventTimestamp & filter only one that is after start date
  }).promise();

  const logStreams: string[] = descLogStreamsResponse.logStreams!.map(logStream => logStream.logStreamName!);
  return logStreams;
};

export const fetchStreamsUntil = async (logGroupName: string, atLeast:number): Promise<string[]> => {
  const retryOption = {
    retries: 6,
    factor: 1.5,
    minTimeout: 1000, 
  }
  return promiseRetry(async (retry: any, attemptNumber: number) => {
    const streams = await fetchStreams(logGroupName)
    if(streams.length < atLeast){
      console.debug(`Found ${streams.length} log streams, retry until having at least ${atLeast} stream`);
      retry();
    }
    return streams;
  }, retryOption)
};

const fetchLogsEventsUntilEnd = async (logGroupName: string, logStream: string): Promise<OutputLogEvents> => {
  const retryOption = {
    retries: 10,
    factor: 2,
    minTimeout: 500, 
  }
  return promiseRetry(async (retry: any, attemptNumber: number) => {
    return cloudwatchLogsClient.getLogEvents({
      logGroupName: logGroupName,
      logStreamName: logStream,
    }).promise()
      .then(response => {
        return response.events!;
      })
      .then(events => {
        const lastEvent = events[events.length-1];
        if(lastEvent === undefined){
          console.log('### something is wrong events', events);
        }
        if(lastEvent?.message?.startsWith('REPORT')){
          // This log should be error.
          // TODO: remove this after debug
          if(events.length <= 3 ){
            console.log('### Found missing log bug');
            console.log('### logStream', logStream);
            console.log('### events', events);
          }
          return events;
        } else {
          console.debug(`### Last event is NOT the REPORT event yet, retry again ${attemptNumber}`)
          console.debug('### logStream', logStream);
          console.debug('## lastEvent', lastEvent);
          retry()
        }
      })
    
  }, retryOption);
};

export const fetchLogs = async (logGroupName: string, logStreams: string[], includeLambdaServiceLog:boolean = true): Promise<string[]> => {
  const promises = logStreams.map(logStream => {
    return fetchLogsEventsUntilEnd(logGroupName, logStream);
  });
  
  let logMessages = (await Promise.all(promises))
    .flat(1)
    .map(event => event!.message!);

  if(!includeLambdaServiceLog){
    logMessages = logMessages.filter(message => {
      return !message.startsWith('START') && !message.startsWith('END') && !message.startsWith('REPORT');
    });
  }
  return logMessages;
};