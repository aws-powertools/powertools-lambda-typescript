#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkAppStack } from '../lib/example-stack';

const app = new cdk.App();
new CdkAppStack(app, 'CdkAppStack', {});