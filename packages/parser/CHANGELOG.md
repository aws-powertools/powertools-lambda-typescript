# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.16.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.15.0...v2.16.0) (2025-03-07)


### Bug Fixes

* **parser:** envelope sub-path exports regression ([#3667](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3667)) ([beac102](https://github.com/aws-powertools/powertools-lambda-typescript/commit/beac1021107f4c117a561829b3b9ab1f404a4e14))
* **parser:** update S3 Event Schema ([#3671](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3671)) ([c14c7b3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c14c7b3e7e1366379cd5062c91e09a62ddf7a42a))





# [2.15.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.14.0...v2.15.0) (2025-02-25)


### Features

* **parser:** provide sub-path exports ([#3598](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3598)) ([09f0aaa](https://github.com/aws-powertools/powertools-lambda-typescript/commit/09f0aaaf92233d326acd9e5fbd21a5c241cdbfe7))





# [2.14.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.13.1...v2.14.0) (2025-02-10)


### Bug Fixes

* **parser:** parse sqs record body field as JSON and S3Schema in S3SqsEventNoificationRecordSchema ([#3529](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3529)) ([bcd4b9f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bcd4b9f7864543b25c57143c2903ed68c16d3987))


### Features

* **parser:** add TransferFamilySchema for AWS Transfer Family events ([#3575](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3575)) ([2c27c5e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2c27c5e717ff6a8f9b54148dbde3ab7dc83b5baf))
* **parser:** simplify `ParseResult` and `parse` inference ([#3568](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3568)) ([95762ad](https://github.com/aws-powertools/powertools-lambda-typescript/commit/95762ade4b51fc40860302dd77a97819dac44a98))





## [2.13.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.13.0...v2.13.1) (2025-01-28)


### Bug Fixes

* **parser:** allow Kinesis envelopes to handle non-JSON strings ([#3531](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3531)) ([d18e03d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d18e03d06e4fa4970aa24c4c041793d58a7cde79))
* **parser:** allow SQS envelopes to handle non-JSON strings ([#3513](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3513)) ([89f0006](https://github.com/aws-powertools/powertools-lambda-typescript/commit/89f0006e9b50448372a5ce70592ea1af5a75ec35))
* **parser:** allow VPC envelopes to handle non-JSON strings ([#3534](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3534)) ([603988d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/603988d4ad187501aa93ea405a3a136e260dba13))
* **parser:** API Gateway Envelopes handle non-JSON ([#3511](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3511)) ([a4846af](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a4846afd09c29032f79b79cfa1410675440d7dae))
* **parser:** CloudWatch Log Envelope handles non-JSON ([#3505](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3505)) ([781a14e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/781a14e11b55767df24739badc77c6d309982d51))
* **parser:** DynamoDBStream schema & envelope ([#3482](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3482)) ([7f7f8ce](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7f7f8ced2953e0fc72a33cd2b6e8af15fae8d3d6))
* **parser:** EventBridge envelope uses correct path ([#3504](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3504)) ([7cce60b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7cce60b41b8b72c5aeee5eb17b87d159af3123ac))
* **parser:** Firehose SQS should fail for invalid SQS message ([#3526](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3526)) ([4721dda](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4721ddaf943ec6695536bdd19e7c29ebf03cb4ed))
* **parser:** Kafka Envelope + tests ([#3489](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3489)) ([bd6b24a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bd6b24aa66b79ce267395b5376418bdabc0e31af))
* **parser:** LambdaFunctionUrl envelope assumes JSON string in body ([#3514](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3514)) ([09aa287](https://github.com/aws-powertools/powertools-lambda-typescript/commit/09aa287c9d44e50b843c0702d86a682c939b9525))
* **parser:** make identitySource nulablel in APIGatewayRequestAuthorizerEventV2Schema ([#3485](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3485)) ([8692de6](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8692de67292cf77db5f25e0ca8c572d71d72eadb))
* **parser:** min array length on Records ([#3521](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3521)) ([89a6281](https://github.com/aws-powertools/powertools-lambda-typescript/commit/89a62811c4b1732b77c225d64e8cda98b38968fa))
* **parser:** set min length of 1 to s3 event lists ([#3524](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3524)) ([937be64](https://github.com/aws-powertools/powertools-lambda-typescript/commit/937be641b3ee82748fc1bdec0291abe5ef0e7a97))
* **parser:** SNS Envelope handles non-JSON ([#3506](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3506)) ([4d7f05f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4d7f05f7415cc52fae42de643ceaffcf764c2472))





# [2.13.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.12.0...v2.13.0) (2025-01-14)


### Features

* **parser:** `DynamoDBMarshalled` helper to parse DynamoDB data structure ([#3442](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3442)) ([e154e58](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e154e58986187d8210d18f6ca79d8b710d87d600))





# [2.12.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.11.0...v2.12.0) (2024-12-17)


### Bug Fixes

* **parser:** make SNS subject field nullish ([#3415](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3415)) ([0da9cea](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0da9ceaeccd088af09963690959871a2ca165729))


### Features

* **parser:** Add appsync resolver event Zod schemas ([#3301](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3301)) ([318f34b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/318f34b40331df7665939f92370797feb7b22dd0))
* **parser:** add schema for DynamoDB - Kinesis Stream event ([#3328](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3328)) ([a8dfa74](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a8dfa74bff22dcde273f11295c1defcc904e98d3))





# [2.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.10.0...v2.11.0) (2024-11-20)


### Bug Fixes

* **parser:** add aws region to kinesis event ([#3260](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3260)) ([246f132](https://github.com/aws-powertools/powertools-lambda-typescript/commit/246f13253bdba1f6963cf53605b0ae10698f063e))
* **parser:** event type literal for selfManagedKafka ([#3325](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3325)) ([5350afe](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5350afed92d02b7b8d47f387705f70c59deeeb65))
* **parser:** fix cause errors nested structure ([#3250](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3250)) ([1ff97cb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1ff97cb758b2e44a76ce108d8e54c9335088abba))





# [2.9.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.8.0...v2.9.0) (2024-10-07)

**Note:** Version bump only for package @aws-lambda-powertools/parser





# [2.8.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.7.0...v2.8.0) (2024-09-16)

**Note:** Version bump only for package @aws-lambda-powertools/parser





# [2.7.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.6.0...v2.7.0) (2024-08-08)


### Features

* **parser:** add helper function to handle JSON stringified fields ([#2901](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2901)) ([806b884](https://github.com/aws-powertools/powertools-lambda-typescript/commit/806b884f51684fa4654d357fafdf8ebeda4de01b))





# [2.6.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.5.0...v2.6.0) (2024-07-25)


### Features

* **parser:** allow parser set event type of handler with middy ([#2786](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2786)) ([9973f09](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9973f09da260305ce8fd18780a9a474f3404ca1a))





# [2.5.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.4.0...v2.5.0) (2024-07-15)


### Bug Fixes

* **parser:** include error cause in ParseError ([#2774](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2774)) ([34d0b55](https://github.com/aws-powertools/powertools-lambda-typescript/commit/34d0b5500ca67a6df0703be66031d1aee61a09fa))





# [2.4.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.3.0...v2.4.0) (2024-07-10)


### Features

* **internal:** support Middy.js 5.x ([#2748](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2748)) ([1d7ad61](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1d7ad61a569a4b1421dbe1754b0179f676cfede7))
* **maintenance:** drop support for Node.js 16.x ([#2717](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2717)) ([e4eee73](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e4eee73770ffccead9212a566335ec256a31af7d))





# [2.3.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.2.0...v2.3.0) (2024-06-27)


### Features

* **parser:** enhance API Gateway schemas ([#2665](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2665)) ([b3bc1f0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b3bc1f0a173233fdcf50f2573949b17a312813b4))





# [2.2.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.1.1...v2.2.0) (2024-06-13)


### Bug Fixes

* **parser:** handle API Gateway Test UI sourceIp ([#2531](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2531)) ([cd6c512](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cd6c512c3a3b799debdafabac1558c8d40c8dc93))





## [2.1.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.1.0...v2.1.1) (2024-05-14)


### Bug Fixes

* **parser:** lambda function url cognitoIdentity and principalOrgId nullable ([#2430](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2430)) ([3c3e393](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3c3e393df47d28a6bddb2a9d01cd6fefea3db15e))
* **parser:** set APIGatewayProxyEventSchema body and query string keys to be nullable ([#2465](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2465)) ([7ce5b3c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7ce5b3cff88b6eadeda1041b4eb076af2ebd848d))
* **parser:** set etag optional for delete object notifications ([#2429](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2429)) ([100e223](https://github.com/aws-powertools/powertools-lambda-typescript/commit/100e2238b45e224a369cc7a349f78cafda3f94b7))





# [2.1.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.0.4...v2.1.0) (2024-04-17)

**Note:** Version bump only for package @aws-lambda-powertools/parser
