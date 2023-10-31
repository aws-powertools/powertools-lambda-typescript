import {DynamoDBStreamRecordSchema, DynamoDBStreamSchema} from '../../src/schemas/dynamodb';

describe('DynamoDB', () => {
   it('should parse a stream of records', () => {
      DynamoDBStreamSchema.parse({
        Records: [
          {
            eventID: '500c3b0d1c4e9d661540d744ec6270a0',
            eventName: 'INSERT',
            eventVersion: '1.1',
            eventSource: 'aws:dynamodb',
            awsRegion: 'eu-west-1',
            dynamodb: {
              ApproximateCreationDateTime: 1696258322,
              Keys: {
                id: {
                  S: '11231',
                },
              },
              NewImage: {
                name: {
                  S: 'John Doe',
                },
                id: {
                  S: '11231',
                },
              },
              SequenceNumber: '300000000015609734923',
              SizeBytes: 26,
              StreamViewType: 'NEW_AND_OLD_IMAGES',
            },
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:770231343013:table/AwsEventsStack-TableCD117FA1-XT5WRCQNWMBQ/stream/2023-10-02T12:16:42.661',
          },
          {
            eventID: '500c3b0d1c4e9d661540d744ec6270a0',
            eventName: 'INSERT',
            eventVersion: '1.1',
            eventSource: 'aws:dynamodb',
            awsRegion: 'eu-west-1',
            dynamodb: {
              ApproximateCreationDateTime: 1696258322,
              Keys: {
                id: {
                  S: '11231',
                },
              },
              NewImage: {
                name: {
                  S: 'John Doe',
                },
                id: {
                  S: '11231',
                },
              },
              SequenceNumber: '300000000015609734923',
              SizeBytes: 26,
              StreamViewType: 'NEW_AND_OLD_IMAGES',
            },
            eventSourceARN:
              'arn:aws:dynamodb:eu-west-1:770231343013:table/AwsEventsStack-TableCD117FA1-XT5WRCQNWMBQ/stream/2023-10-02T12:16:42.661',
          },
        ],
      })
    });
});