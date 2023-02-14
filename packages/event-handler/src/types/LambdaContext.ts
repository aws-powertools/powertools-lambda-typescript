import { JSONData } from './common';

interface LambdaContext {
  functionName: string
  functionVersion: string
  invokedFunctionArn: string
  awsRequestId: string
  memoryLimitInMb: number
  logGroupName: string
  logStreamName: string
  identify: LambdaCognitoIdentity
  clientContext: LambdaClientContext
}

class LambdaCognitoIdentity {
  public cognitoIdentityId?: string;
  public cognitoIdentityPoolId?: string;
}

class LambdaClientContext {
  public client?: LambdaClientContextMobileClient;
  public custom?: JSONData;
  public env?: JSONData;
}

class LambdaClientContextMobileClient {
  public appPackageName?: string;
  public appTitle?: string;
  public appVersionCode?: string;
  public appVersionName?: string;
  public installationId?: string;
}

export {
  LambdaContext,
  LambdaCognitoIdentity,
  LambdaClientContext,
  LambdaClientContextMobileClient,
};
