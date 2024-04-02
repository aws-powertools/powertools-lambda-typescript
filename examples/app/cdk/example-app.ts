#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { PowertoolsExampleStack } from './example-stack.js';

const app = new App();
new PowertoolsExampleStack(app, 'PowertoolsTypeScript-Example-CDK', {});
