#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { LayerPublisherStack } from '../src/layer-publisher-stack';

const app = new cdk.App();
new LayerPublisherStack(app, 'LayerPublisherStack');