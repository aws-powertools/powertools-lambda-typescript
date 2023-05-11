#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkAppStack } from '../src/example-stack';

const app = new cdk.App();
new CdkAppStack(app, 'LambdaPowertoolsTypeScript-ExamplesCdkStack', {});
