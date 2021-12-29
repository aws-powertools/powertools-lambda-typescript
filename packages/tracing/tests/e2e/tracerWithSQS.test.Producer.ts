// Load the AWS SDK for Node.js
import AWSXRay from 'aws-xray-sdk-core';
import AWSOrig from 'aws-sdk';

const AWS = AWSXRay.captureAWS(AWSOrig);

exports.handler = async function () {
  console.log(`XRAY trace id : ${process.env._X_AMZN_TRACE_ID}`);
  // Create an SQS service object
  const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

  const params = {
    // Remove DelaySeconds parameter and value for FIFO queues
    MessageAttributes: {
      Title: {
        DataType: 'String',
        StringValue: 'The Whistler',
      },
      Author: {
        DataType: 'String',
        StringValue: 'John Grisham',
      },
      WeeksOn: {
        DataType: 'Number',
        StringValue: '6',
      },
    },
    MessageBody: 'Information about current NY Times fiction bestseller for week of 12/11/2016.',
    // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
    // MessageGroupId: "Group1",  // Required for FIFO queues
    QueueUrl: process.env.SQS_QUEUE_URL,
  };

  try {
    console.log('Sending message');
    const data = await sqs.sendMessage(params).promise();
    console.log('Success', data.MessageId);
  } catch (e) {
    console.log('Error', e);
    throw e;
  }
};
