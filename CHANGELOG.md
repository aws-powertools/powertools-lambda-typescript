# Change Log

## [2.29.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.28.1...v2.29.0) (2025-11-21)

### Improvements

- **commons** Make trace ID access more robust ([#4693](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4693)) ([b26cd2c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b26cd2c7395e55fb33a6ce719bc69b1a11004446))

### Bug Fixes

- **logger** infinite loop on log buffer when item size is max bytes ([#4741](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4741)) ([f0677d4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f0677d4f1220df6f68f9fd8ece221306fdd9b154))
- **logger** not passing persistent keys to children ([#4740](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4740)) ([eafbe13](https://github.com/aws-powertools/powertools-lambda-typescript/commit/eafbe13aa6ca7067c2c8329150fdf600ebca12a7))
- **event-handler** moved the response mutation logic to the `composeMiddleware` function ([#4773](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4773)) ([2fe04e3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2fe04e351aa4f8a104a145d3fcef7bb6d856506f))
- **event-handler** handle repeated queryString values ([#4755](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4755)) ([5d3cf2d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5d3cf2de5821171e968577fcb1c74d5198e153d6))
- **event-handler** allow event handler response to return array ([#4725](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4725)) ([eef92ca](https://github.com/aws-powertools/powertools-lambda-typescript/commit/eef92ca929cd7a2551e228b20deae3b59044a0ee))

### Features

- **logger** use async local storage for logger ([#4668](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4668)) ([4507fcc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4507fccb8872975f4a3e683ec9034e7f71e67d30))
- **metrics** use async local storage for metrics ([#4663](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4663)) ([#4694](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4694)) ([2e08f74](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2e08f74cfe86571ef7f2388d3a028763561c11e9))
- **parser** add type for values parsed by DynamoDBStreamRecord ([#4793](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4793)) ([c2bd849](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c2bd8499c38f2e9048782d717613a721b3e8ccc8))
- **batch** use async local storage for batch processing ([#4700](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4700)) ([67a8de7](https://github.com/aws-powertools/powertools-lambda-typescript/commit/67a8de7baec4a240bc5f22493a13c75289397d7c))
- **event-handler** add support for ALB ([#4759](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4759)) ([a470892](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a4708925fb08da09044ea1592ea7df58e46f383d))
- **event-handler** expose response streaming in public API ([#4743](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4743)) ([be4e4e2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/be4e4e2b9f0a39210f972f22d03a382aea304f60))
- **event-handler** add first-class support for binary responses ([#4723](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4723)) ([13dbcdc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/13dbcdccc3626d442f66c6037af7df88626dd9c2))
- **event-handler** Add support for HTTP APIs (API Gateway v2) ([#4714](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4714)) ([2f70018](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2f700189aef42445a229da8a0d1446e1d63423fa))

### Maintenance

- **tracer** bump aws-xray-sdk-core from 3.11.0 to 3.12.0 ([#4792](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4792)) ([afb5678](https://github.com/aws-powertools/powertools-lambda-typescript/commit/afb5678ed6176d9d2e0a759993af0054a2c80b05))
- **event-handler** unflag http handler from experimental ([#4801](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4801)) ([a2deb8d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a2deb8d702bb305bbf017882ce16beb6b3c809aa))


## [2.28.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.28.0...v2.28.1) (2025-10-23)

### Bug Fixes

- **logger** fix esbuild ESM bundler error ([#4678](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4678)) ([8a13e8e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8a13e8ee2b2c2715f584f762b63c495ac849979f))


## [2.28.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.27.0...v2.28.0) (2025-10-21)

### Improvements

- **commons** Make X-rRay trace ID access more robust ([#4658](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4658)) ([5199d3e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5199d3e3a5000d3b3b5f2906f3d62da5fc1c96ec))
- **event-handler** ended response stream when body is null ([#4651](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4651)) ([a37a317](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a37a3173023439ee67cc328753cb2d292dc3854f))
- **event-handler** rename ServiceError class to HttpError ([#4610](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4610)) ([33f7334](https://github.com/aws-powertools/powertools-lambda-typescript/commit/33f733471a54d528514e7bebcd863edc4e3781a9))

### Bug Fixes

- **logger** correct persistentLogAttributes warning behavior ([#4627](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4627)) ([5cb6797](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5cb6797b66c18ddf8a266fce50b8c1dab4c25b29))
- **idempotency** add null check for idempotencyHandler before calling handleMiddyOnError ([#4643](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4643)) ([5dab224](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5dab224fa5a341ff6e00b819690090594dbcd811))
- **parser** updated the SQSRecordSchema to make the md5OfMessageAttributes nullable ([#4632](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4632)) ([adc8f60](https://github.com/aws-powertools/powertools-lambda-typescript/commit/adc8f60bf3ffedbbb502aaf90b44bec9bea310dd))
- **event-handler** allow http handlers to return duplex streams ([#4629](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4629)) ([f46ae7c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f46ae7c4b73a428b3a9aeb7e8858adede73637ed))

### Features

- **metrics** use async local storage for metrics ([#4663](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4663)) ([3886af3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3886af3a275020ddae8d67cc9c5efaa74464db9c))
- **event-handler** Add `includeRouter` support to AppSync GraphQL resolver ([#4457](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4457)) ([ada48bb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ada48bbc20b61454586bbd853ee330800b6000d2))
- **event-handler** added support for catch all route ([#4582](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4582)) ([19786bf](https://github.com/aws-powertools/powertools-lambda-typescript/commit/19786bf82019eaf29f35830c029f60f8c5e9573d))
- **event-handler** add streaming functionality ([#4586](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4586)) ([e321526](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e3215263e369acb581e113f08aa3893a170d0cb9))
- **event-handler** added `includeRouter` method to split routes ([#4573](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4573)) ([38b6e82](https://github.com/aws-powertools/powertools-lambda-typescript/commit/38b6e82a0d9f4f46bb5253ba5157487bbbb884df))

### Maintenance

- **tracer** bump aws-xray-sdk-core from 3.10.3 to 3.11.0 ([#4656](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4656)) ([f00f7ed](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f00f7edcfd27788f8909d62a1519b317ee465a48))


## [2.27.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.26.1...v2.27.0) (2025-09-24)

### Bug Fixes

- **batch** fixed the build issue with Batch processor due to missing dependencies ([#4498](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4498)) ([ef67b43](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ef67b43921f1d67b06b3257fb0f96c74e0d6dbae))
- **event-handler** fixed CORS behaviour not aligned with CORS spec   ([#4512](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4512)) ([dd368fa](https://github.com/aws-powertools/powertools-lambda-typescript/commit/dd368fa3eb08a86c2d5aad3cf9b832d7a8288486))
- **event-handler** run global middleware on all requests for REST API ([#4507](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4507)) ([49d5f8a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/49d5f8a4f36a5af26c573f7706347f34ec70689e))

### Improvements

- **event-handler** rename HttpErrorCodes to HttpStatusCodes ([#4543](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4543)) ([e53aa88](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e53aa8816325f21510706e3f9e62fb0a76692915))
- **event-handler** made error handler responses versatile ([#4536](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4536)) ([f08b366](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f08b366b79152d338ebefb5a25caacade6846919))
- **event-handler** changed path parameter in middleware and routehandler signature ([#4532](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4532)) ([278fca0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/278fca0491ce9cb955326523557c3ddf9d03dbc5))
- **event-handler** change the Middleware and RequestContext signatures ([#4530](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4530)) ([a05c074](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a05c07411629d1e23a9cb3fec8a78cf23bd8dd0c))

### Features

- **event-handler** implemented route prefixes in HTTP event handler ([#4523](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4523)) ([8913854](https://github.com/aws-powertools/powertools-lambda-typescript/commit/89138542cd9e195555299f401646ae94d0bb50ee))
- **event-handler** throw error when middleware does not await next() ([#4511](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4511)) ([b0b43e8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b0b43e862fb189941fe9db220580884e7707d541))
- **event-handler** add CORS middleware support ([#4477](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4477)) ([972cd1f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/972cd1f86b6ea01c93abef5e6cde7876360196f1))
- **event-handler** added compress middleware for the REST API event handler ([#4495](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4495)) ([320e0dc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/320e0dcaa07476de3b7d07209ef27379b9d4900a))


## [2.26.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.26.0...v2.26.1) (2025-09-15)

### Bug Fixes

- **batch** declare the @aws-lambda-powertools/commons dependency ([#4484](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4484)) ([8cfcccd](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8cfcccd6e94a6f0b25087ffbd8a4a2ec4bbf0e3d))


## [2.26.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.25.2...v2.26.0) (2025-09-11)

### Improvements

- **logger** update `getCodeLocation` regex to improve performance ([#4389](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4389)) ([801333d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/801333deff04b09d4adb88860c60f497295685d9))
- **batch** simplified the parser integration api with batch processor ([#4465](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4465)) ([96977ff](https://github.com/aws-powertools/powertools-lambda-typescript/commit/96977ff6b1330adcf82d9caa3b30454208d654e8))

### Bug Fixes

- **parser** updated the binaryValue and stringValue in the SqsMsgAttributeSchema to nullable  ([#4450](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4450)) ([cefcbdb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cefcbdbaec087ce1bfcee4294754dc173c0c473b))
- **event-handler** handle nullable fields in APIGatewayProxyEvent ([#4455](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4455)) ([200f47b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/200f47b0c9e3864b2732d93ca50dd65323b109fb))

### Features

- **parser** integrate parser with Batch Processing ([#4408](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4408)) ([0b6bbbb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0b6bbbb751caaa7a81e1c2aaf823892c54b9e9cb))
- **parser** implemented a helper function `Base64Encoded` to decode base64 encoded payloads ([#4413](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4413)) ([1554360](https://github.com/aws-powertools/powertools-lambda-typescript/commit/15543602ea8182b0a5972fc2acfb364da4ad97f3))
- **parser** add IPv6 support for sourceIp in API Gateway schemas ([#4398](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4398)) ([2a94c37](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2a94c3759a04057423db8f346c921166ada173d0))
- **event-handler** remove undefined from Router's resolve type signature ([#4463](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4463)) ([d36ef55](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d36ef5569de910e467f7c6d6b1d518112a998d40))
- **event-handler** implement mechanism to manipulate response in middleware ([#4439](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4439)) ([35a510d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/35a510d3f3191b479105238f5f956bfeeb519389))
- **event-handler** add route specific middleware registration and execution ([#4437](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4437)) ([e6ea674](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e6ea674b97953d0391573ea6536f9eb5f02f659b))
- **event-handler** add middleware registration and composition to rest handler ([#4428](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4428)) ([fc87eb3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fc87eb3f5c05a31002becf30e22928c8d7913a3f))
- **event-handler** add support for error handling in AppSync GraphQL ([#4317](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4317)) ([77a992f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/77a992ff39ed41da2c965bc86d65a326f4db21d6))
- **event-handler** add resolution logic to base router ([#4349](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4349)) ([f1ecc6d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f1ecc6da353ed1d4a1a943a4b75dc3e2b50d8e5e))

### Maintenance

- **event-handler** rename variables to reflect that options object is now a RequestContext ([#4460](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4460)) ([5b4ee1a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5b4ee1ac77c4ebf0af6181f56a47340173306673))
- **event-handler** expose rest handler functionality ([#4458](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4458)) ([23eddfd](https://github.com/aws-powertools/powertools-lambda-typescript/commit/23eddfdd2f3ec0824dccd080824628c63ed8308c))
- **event-handler** split Router tests into multiple files ([#4449](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4449)) ([91a1ec4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/91a1ec4c4765e814b67f669ed2ff77c674cc3155))
- **event-handler** rename BaseRouter class to Router ([#4448](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4448)) ([b043c28](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b043c28820b18e2d518153992f4f3243d476e208))


## [2.25.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.25.1...v2.25.2) (2025-08-26)

### Maintenance

- **commons** concatenate PT UA to AWS_SDK_UA_APP_ID when one is set ([#4374](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4374)) ([519cbfe](https://github.com/aws-powertools/powertools-lambda-typescript/commit/519cbfe99db110eceadb8d7814f0693dc751c6db))
- **parameters** fix SonarQube code quality issues and optimize imports ([#4359](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4359)) ([59a191d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/59a191d976148a2e36a5ad2b0352e82216eaf043))

### Improvements

- **logger** use vitest env helpers in unit tests ([#4360](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4360)) ([f9ea611](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f9ea6113cfb854d7b9136d5e44969467c8609efd))
- **logger** mark private members as readonly and fix code quality issues ([#4350](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4350)) ([5ac7712](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5ac77129f4ae8f5790b95f540abeeb2d91df7a9d))
- **metrics** emit warning when default dimensions are overwritten ([#4287](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4287)) ([4c1bcc3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4c1bcc3a521b9d4c65d9e00f1b4563336df15742))

### Features

- **event-handler** add function to convert Lambda proxy event to web response object ([#4343](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4343)) ([6277e0d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6277e0d0f4dbc2f9dfa0011dd16e52bb96ce3f59))
- **event-handler** pass event, context and request objects into handler ([#4329](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4329)) ([ea0e615](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ea0e61583cc2c06672dfb136c436c5a31764a0e6))


## [2.25.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.25.0...v2.25.1) (2025-08-14)

### Improvements

- **logger** resolve issue when no logger region is set ([#4319](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4319)) ([b74b3b4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b74b3b4d1102e8d33c677d2c73ddc355717c4cef))
- **idempotency** Prevent error when AWS_LAMBDA_FUNCTION_NAME is not passed in the Idempotency Persistence Layer ([#4327](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4327)) ([17845d0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/17845d0de45508388100aefdbe42d1e0d9a02522))

### Bug Fixes

- **tracer** pass args of decorated method as they are ([#4312](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4312)) ([7bd81ae](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7bd81aed4d259c909107a1d312bd722bc258f358))

### Features

- **event-handler** add decorator functionality for error handlers ([#4323](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4323)) ([562747a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/562747a4c415ea2225529e5e276269e87c7b08b9))
- **event-handler** add error handling functionality to BaseRouter ([#4316](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4316)) ([5aff398](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5aff3984359a5a4f4408a5d286d3c36976d454fa))


## [2.25.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.24.1...v2.25.0) (2025-08-12)

### Improvements

- **commons** fix code quality issues ([#4292](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4292)) ([5ee4198](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5ee419845f38754f57351be15c4d82ed912641dc))
- **jmespath** fix code quality issues ([#4286](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4286)) ([787633d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/787633deb573ecdccb8dd1610df68bc4e6e90949))
- **logger** replace EnvironmentVariablesService class with helper functions ([#4251](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4251)) ([b2fcd90](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b2fcd90834c417dec8c2d45743f2384df3541243))
- **tracer** fix code quality issues ([#4264](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4264)) ([081a514](https://github.com/aws-powertools/powertools-lambda-typescript/commit/081a514b6e1cb81513080352e5dbcadc89ac0574))
- **idempotency** fix code quality issues ([#4298](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4298)) ([1fc8604](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1fc86041f773bcaa1ea836b782d6b688d1e3636c))
- **batch** improve code quality in test handlers ([#4281](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4281)) ([75e233f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/75e233f340acb27a4d31babbdd1a6d81f974f279))
- **kafka** improve tests & error handling ([#4262](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4262)) ([dab0be1](https://github.com/aws-powertools/powertools-lambda-typescript/commit/dab0be1b5be166f972dcd2152968999dc212a0a7))

### Features

- **parser** make `parse` function available standalone ([#4300](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4300)) ([4998d6b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4998d6bffcb45710d96160dbb685145de3254f4a))
- **event-handler** add event handler registry ([#4307](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4307)) ([aaac429](https://github.com/aws-powertools/powertools-lambda-typescript/commit/aaac4295594bc4b9c241fcf7bd8589ebc8b68d68))
- **event-handler** add error classes for http errors ([#4299](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4299)) ([c1c3dd5](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c1c3dd50f5c335f2fd8a13cfd95340971d8840a1))
- **event-handler** implement route matching & resolution system for rest handler ([#4297](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4297)) ([b8ca368](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b8ca36841f710db062b726ca8d53876e2291e92d))
- **event-handler** add support for AppSync GraphQL batch resolvers ([#4218](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4218)) ([12ac2e4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/12ac2e40dfe63764f62670ea288e556f7302d2aa))

### Bug Fixes

- **parser** cognito schema `preferredRole` may be null ([#4259](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4259)) ([5ef5c85](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5ef5c85b1983617f64bce1410aeb9fd57859c04d))


## [2.24.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.24.0...v2.24.1) (2025-07-29)

### Bug Fixes

- **metrics** revert changes when raise warning with overridden default dimensions ([#4226](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4226)) ([c9d6aa0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c9d6aa09acc666d09ed13ebef331502f4119dacc))
- **metrics** emit warning when default dimensions are overwritten ([#4222](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4222)) ([a933a6a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a933a6af6135b79b855353bbaf265ab0a3be60da))
- **parser** set zod peer range to 4.x ([#4196](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4196)) ([7a65fcf](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7a65fcf9759ac1a1f072ef5442ee8b0767705a92))

### Improvements

- **metrics** replace EnvironmentVariablesService with cached #envConfig ([#4188](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4188)) ([919063b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/919063bc10f15b55f84c183208274836ae1d367e))
- **metrics** add runtime validations when adding dimensions ([#4181](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4181)) ([4226058](https://github.com/aws-powertools/powertools-lambda-typescript/commit/42260585eb84de373c6ae5daaf5d541dd5f78ec1))
- **parameters** replace EnvironmentVariablesService class with helper functions in Parameters ([#4168](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4168)) ([ce4e618](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ce4e6181ffed20153f3743707fdd31f68f392e0c))
- **event-handler** replace EnvironmentVariablesService class with helper functions in Event Handler ([#4225](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4225)) ([d17818e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d17818e1b8b17a8307e61966ab857f9c05c49670))

### Features

- **event-handler** add route management system for ApiGw event handler ([#4211](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4211)) ([c2cbb64](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c2cbb642ca3a4cc57ad0e80d9f1239e8f67d56e3))
- **event-handler** add base router class ([#3972](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3972)) ([3d4998c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3d4998cda6c1b8c1bea47d5c6a9fe760b6e957fb))


## [2.24.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.23.0...v2.24.0) (2025-07-15)

### Improvements

- **metrics** optimize `addDimensions` method to avoid O(n²) complexity ([#4156](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4156)) ([3982b4a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3982b4a6b25e82fa1b5001c73d238cf62eda1137))
- **tracer** replace class-based env access with functional helpers ([#4146](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4146)) ([51d9b98](https://github.com/aws-powertools/powertools-lambda-typescript/commit/51d9b988488aee01de337669dbfc68d0ab7af9dd))

### Bug Fixes

- **metrics** addDimensions() documentation and tests ([#3964](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3964)) ([a801636](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a80163614e4a0ef7106beaa5cf91161d50a09fea))
- **tracer** skip tracing CONNECT requests ([#4148](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4148)) ([a147c3b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a147c3b46ff975ed3e94722e21e79e65ae2bbc78))
- **parser** remove nullable from md5OfMessageAttributes in SqsRecordSchema ([#4165](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4165)) ([d6cbde0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d6cbde0fe977bb1ce011a80f31369e5f7161df08))

### Maintenance

- **batch** exclude deprecated code from coverage ([#4152](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4152)) ([30bbf5a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/30bbf5af3ae78fdb4b837ad9b4322a9e90f15f57))
- **parser** remove deprecated parser type ([#4154](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4154)) ([a59db36](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a59db36e7816d8587b91acf282582204ccc78845))

### Features

- **parser** support Standard Schema and upgrade to Zod v4 ([#4164](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4164)) ([67549f6](https://github.com/aws-powertools/powertools-lambda-typescript/commit/67549f61cd77e23a66e3338576efc96839833329))


# [2.23.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.22.0...v2.23.0) (2025-07-02)

### Bug Fixes

* **ci:** Partition workflows ([#4084](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4084)) ([40195dd](https://github.com/aws-powertools/powertools-lambda-typescript/commit/40195ddc36f343c3b7905b51f2b82842d05fce58))
* **logger:** reset keys on error in middleware ([#4122](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4122)) ([e310c50](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e310c50fe12463a5e3759ee1ecd61e0467fbc6a4))
* **logger:** set `hourCycle` to h23 when tz is not UTC ([#4102](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4102)) ([54b0863](https://github.com/aws-powertools/powertools-lambda-typescript/commit/54b08636474f11fefcb295cd04511d3f46be4382))

### Features

* **event-handler:** add single resolver functionality for AppSync GraphQL API ([#3999](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3999)) ([b91383f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b91383f6ec82cff9196ccc4e0c9e88d285eb567d))
* **event-handler:** expose event & context as object ([#4113](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4113)) ([7e74c9e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7e74c9e356d97372c4f1ee5ca83d16dfefea42f4))
* **event-handler:** support `onQuery` and `onMutation` handlers ([#4111](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4111)) ([263db2d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/263db2d74e558adb9b088174a5500de6c29488d0))

# [2.22.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.21.0...v2.22.0) (2025-06-20)

### Bug Fixes

* **event-handler:** fix decorated scope in appsync events ([#3974](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3974)) ([e539719](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e5397199133da265f593c5feed0178c0ebe1e7c2))

### Features

* **kafka:** add logic to handle delimited protobufs ([#4071](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4071)) ([db9ec0c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/db9ec0c4af668c002460f8dc9171c7d4bfc155b2))
* **kafka:** lazily deserialize key/value/headers ([#4068](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4068)) ([ef9bb52](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ef9bb5215a588f3d9a4e9ec9da7c0b307e3c4fa0))
* **kafka:** new kafka utility ([#4058](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4058)) ([006f27b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/006f27bd9909e2da548cff9dbdcc1944ba76dbd1))
* **layers:** add parameterised layer deployment and verification ([#4033](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4033)) ([2214ba7](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2214ba74301da31908b2fe717ec893a570efd6f7))

# [2.21.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.20.0...v2.21.0) (2025-06-03)

### Bug Fixes

* **parameters:** preserve original stack trace on transform failures … ([#3982](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3982)) ([583e3ae](https://github.com/aws-powertools/powertools-lambda-typescript/commit/583e3ae9a5095a1185b2bd9dff31e6f3f50ff577))

### Features

* **commons:** environment variable helpers ([#3945](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3945)) ([7cfcd85](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7cfcd8517a0578e248ead1e2e0261fe7ba405e14))
* **event-handler:** add Amazon Bedrock Agents Functions Resolver ([#3957](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3957)) ([720ddcb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/720ddcb974bd044fccd54d4cf5e46a1576f487a7))

# [2.20.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.19.1...v2.20.0) (2025-05-20)

### Features

* **idempotency:** support for Valkey- and Redis OSS-compatible cache  ([#3896](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3896)) ([3352b90](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3352b909cf06f435fe876adba8f2c9f6e5ba11b0))
* **parser:** add schemas for AppSync Events ([#3907](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3907)) ([2554800](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2554800b6905811e1fb9ca254196a67138e765bc))
* **parser:** add support for tumbling windows in Kinesis and DynamoDB events ([#3931](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3931)) ([0205a87](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0205a87f6f4c8d597e27684b224c3b3a37887987))

## [2.19.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.19.0...v2.19.1) (2025-05-05)

### Bug Fixes

* **event-handler:** ignore return type from onSubscribe handler ([#3888](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3888)) ([02b3cda](https://github.com/aws-powertools/powertools-lambda-typescript/commit/02b3cda9fd10c4e757dee321749d484c9ac542ee))

# [2.19.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.18.0...v2.19.0) (2025-04-24)

### Bug Fixes

* **logger:** warn customers when the ALC log level is less verbose than log buffer ([#3834](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3834)) ([04f64ce](https://github.com/aws-powertools/powertools-lambda-typescript/commit/04f64ce23716037d6684fd4f6859bb8df8743911))
* **logger:** warn only once on ALC log level mismatch ([#3816](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3816)) ([1e330b3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1e330b3f96f0ae9f18dd09e2856658b22dbfd930))
* **parser:** Make Kafka key property optional ([#3855](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3855)) ([68fa1eb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/68fa1eb66abf4ccdb2b4f3789862e2380b8340aa))

### Features

* **event-handler:** AppSync Events resolver ([#3858](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3858)) ([01f8a68](https://github.com/aws-powertools/powertools-lambda-typescript/commit/01f8a687a0c033cdc5d55c50bc7e6d0566f485cb))

# [2.18.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.17.0...v2.18.0) (2025-04-07)

### Features

* **parser:** add Cognito pre-signup trigger schema ([#3729](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3729)) ([4116f65](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4116f65dda099a38b780ce26e005ccea90abdd7b))
* **parser:** add schema support for API Gateway WebSocket events ([#3807](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3807)) ([663d328](https://github.com/aws-powertools/powertools-lambda-typescript/commit/663d32866cdbf1225260fbf1372e126c42a962e1))

# [2.17.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.16.0...v2.17.0) (2025-03-25)

### Bug Fixes

* **ci:** Remove --compatible-architectures from workflow ([#3752](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3752)) ([dafa496](https://github.com/aws-powertools/powertools-lambda-typescript/commit/dafa49602ea45227384b63bff4d3f39d69e982d8))
* **idempotency:** include sk in error msgs when using composite key ([#3709](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3709)) ([661f5ff](https://github.com/aws-powertools/powertools-lambda-typescript/commit/661f5ff7f3f3805e24f515892e98430dccebf979))
* **logger:** correctly refresh sample rate ([#3722](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3722)) ([2692ca4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2692ca4d1b15763936659b05e1830d998a4d2020))
* **parser:** ddb base schema + other exports ([#3741](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3741)) ([51a3410](https://github.com/aws-powertools/powertools-lambda-typescript/commit/51a3410be8502496362d5ed13a64fe55691604ba))

### Features

* **commons:** make utilities aware of provisioned concurrency ([#3724](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3724)) ([c28e45e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c28e45ecba315bac8fbc7744dbe21a3461747d44))
* **logger:** set correlation ID in logs ([#3726](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3726)) ([aa74fc8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/aa74fc8548ccb8cb313ffd1742184c66e8d6c22c))
* **metrics:** allow setting functionName via constructor parameter and environment variable ([#3696](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3696)) ([3176fa0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3176fa08e1886d5c86e7b327134cc988b82cf8d8))

# [2.16.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.15.0...v2.16.0) (2025-03-07)

### Bug Fixes

* **batch:** clear message group references after request ([#3674](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3674)) ([270115e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/270115e288a552bdb32083f04f23530725a86243))
* **ci:** Update layer balance scripts ([#3660](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3660)) ([aa14637](https://github.com/aws-powertools/powertools-lambda-typescript/commit/aa14637b0531b7a4a36d38158f684b68723c822e))
* **parser:** envelope sub-path exports regression ([#3667](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3667)) ([beac102](https://github.com/aws-powertools/powertools-lambda-typescript/commit/beac1021107f4c117a561829b3b9ab1f404a4e14))
* **parser:** update S3 Event Schema ([#3671](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3671)) ([c14c7b3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c14c7b3e7e1366379cd5062c91e09a62ddf7a42a))

### Features

* **logger:** Enable log buffering feature ([#3641](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3641)) ([8203016](https://github.com/aws-powertools/powertools-lambda-typescript/commit/82030167abe3797392b919db2b4a006ae47e0ef7))
* **logger:** flush buffer on uncaught error decorator ([#3676](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3676)) ([28db2e3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/28db2e3c34e5fe27cb894112bf5c248704b3d9ea))
* **logger:** Flush buffer on uncaught error in Middy middleware ([#3690](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3690)) ([23eebe4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/23eebe46bd4d07315545ecefa672d53d14ac9a72))
* **logger:** refresh sample rate calculation before each invocation ([#3672](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3672)) ([8c8d6b2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8c8d6b2ea4ccd473f56b05913169cc5995765562))
* **validation:** add [@validator](https://github.com/validator) decorator for JSON Schema validation ([#3679](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3679)) ([ae6b7cf](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ae6b7cf9dae3e1d233b9c51ca1e1dc04b26efa9a))
* **validation:** Add Middy.js middleware for JSON Schema validation ([#3694](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3694)) ([443202b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/443202bad2672ff26cc8237f417b8bf14bbd02d9))
* **validation:** implement validate function ([#3662](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3662)) ([f55127b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f55127b7f894b5c673e739da06cbaabe12d0d1ca))

# [2.15.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.14.0...v2.15.0) (2025-02-25)

### Bug Fixes

* **ci:** Add permissions to jobs ([#3586](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3586)) ([90c93ea](https://github.com/aws-powertools/powertools-lambda-typescript/commit/90c93eac603b9a496aac1aee8e010fbc983aabdc))
* **ci:** fix path for latest SSM param ([#3585](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3585)) ([e34952d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e34952dacf0b55219f57aaf32a5422bd2595d7a9))
* **logger:** handle illegal `null`/`undefined` as extra args ([#3614](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3614)) ([6f99073](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6f99073cf61d2e49b01d8f7dcc9b4edf36166ad9))

### Features

* **idempotency:** add support for custom key prefix ([#3532](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3532)) ([7be7a83](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7be7a83a07e86927221ba34ec1dbae7e73cf6e32))
* **logger:** add circular buffer ([#3593](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3593)) ([618cdee](https://github.com/aws-powertools/powertools-lambda-typescript/commit/618cdeefd8838bf291b5b9df73d765c30d2457df))
* **logger:** Add log buffer and flush method ([#3617](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3617)) ([6968ca8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6968ca87f55ef7574c7904e268ba0604d4b591b7))
* **logger:** Emit a warning on buffer flush ([#3639](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3639)) ([f471552](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f4715520322e768f4cc743388069f91d424b0ebd))
* **logger:** refresh sample rate calculation per invocation ([#3644](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3644)) ([1d66a2a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1d66a2a0d0af36d6c8aa86b0c559f8489fe9ef77))
* **parser:** provide sub-path exports ([#3598](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3598)) ([09f0aaa](https://github.com/aws-powertools/powertools-lambda-typescript/commit/09f0aaaf92233d326acd9e5fbd21a5c241cdbfe7))

# [2.14.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.13.1...v2.14.0) (2025-02-10)

### Bug Fixes

* **logger:** prevent overwriting standard keys ([#3553](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3553)) ([f0bdf3c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f0bdf3cdb1fe25ff7baea352215f41501ca6c5c2))
* **parser:** parse sqs record body field as JSON and S3Schema in S3SqsEventNoificationRecordSchema ([#3529](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3529)) ([bcd4b9f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bcd4b9f7864543b25c57143c2903ed68c16d3987))

### Features

* **ci:** Add advanced automation ([#3438](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3438)) ([4e9ff07](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4e9ff0717223f8305eda684608ce1435489b9749))
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

### Bug Fixes

* **tracer:** forward `X-Amzn-Trace-Id` header when instrumenting fetch ([#3470](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3470)) ([4eb3e2d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4eb3e2d4e0ccbfb0f99c215c61d2b9263ee10870))

### Features

* **parser:** `DynamoDBMarshalled` helper to parse DynamoDB data structure ([#3442](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3442)) ([e154e58](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e154e58986187d8210d18f6ca79d8b710d87d600))

# [2.12.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.11.0...v2.12.0) (2024-12-17)

### Bug Fixes

* **parser:** make SNS subject field nullish ([#3415](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3415)) ([0da9cea](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0da9ceaeccd088af09963690959871a2ca165729))

### Features

* **logger:** change selected method visibility to protected ([#3377](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3377)) ([93a19a5](https://github.com/aws-powertools/powertools-lambda-typescript/commit/93a19a5181b6875d57a589e17c620b7a4631c085))
* **metrics:** disable metrics with `POWERTOOLS_METRICS_DISABLED` ([#3351](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3351)) ([7e8578e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7e8578e630218c9a987754bf789895ab63c3547f))
* **metrics:** warn when overwriting dimension ([#3352](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3352)) ([12f3e44](https://github.com/aws-powertools/powertools-lambda-typescript/commit/12f3e448d8104b08518370a71db12646dededa4f))
* **parser:** Add appsync resolver event Zod schemas ([#3301](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3301)) ([318f34b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/318f34b40331df7665939f92370797feb7b22dd0))
* **parser:** add schema for DynamoDB - Kinesis Stream event ([#3328](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3328)) ([a8dfa74](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a8dfa74bff22dcde273f11295c1defcc904e98d3))

# [2.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.10.0...v2.11.0) (2024-11-20)

### Bug Fixes

* **metrics:** skip empty string dimension values ([#3319](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3319)) ([924d49d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/924d49dcac8cc999782db51e61d8e854b752cd5c))
* **parser:** add aws region to kinesis event ([#3260](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3260)) ([246f132](https://github.com/aws-powertools/powertools-lambda-typescript/commit/246f13253bdba1f6963cf53605b0ae10698f063e))
* **parser:** event type literal for selfManagedKafka ([#3325](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3325)) ([5350afe](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5350afed92d02b7b8d47f387705f70c59deeeb65))
* **parser:** fix cause errors nested structure ([#3250](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3250)) ([1ff97cb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1ff97cb758b2e44a76ce108d8e54c9335088abba))

### Features

* **batch:** Async Processing of Records for for SQS Fifo ([#3160](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3160)) ([e73b575](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e73b575b784b7a59ca8cde02d4ca51ec97789d19))
* **metrics:** ability to set custom timestamp with `setTimestamp` for metrics ([#3310](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3310)) ([0fb94c3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0fb94c38cbead6333ff4a17354c81ce73fe51afd))
* **metrics:** add ability to pass custom logger ([#3057](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3057)) ([a531b90](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a531b90031826970673eb8bfad78dee6edd0a359))

# [2.10.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.9.0...v2.10.0) (2024-10-22)

### Features

* **logger:** include enumerable properties in formatted errors ([#3195](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3195)) ([4b80d9f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4b80d9ff77a638d2290411764a1b9dc2dc9d8cbd))

# [2.9.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.8.0...v2.9.0) (2024-10-07)

### Features

* **batch:** sequential async processing of records for `BatchProcessor` ([#3109](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3109)) ([e31279a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e31279af90446050a7974fbe25c34758f64915f9))
* **idempotency:** ability to specify JMESPath custom functions ([#3150](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3150)) ([869b6fc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/869b6fced659ad820ffe79a0b905022061570974))
* **idempotency:** manipulate idempotent response via response hook ([#3071](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3071)) ([f7c1769](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f7c176901a36698f591d897c2abde54cf30c9ea9))

# [2.8.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.7.0...v2.8.0) (2024-09-16)

### Bug Fixes

* **idempotency:** include cause in idempotency persistence layer error ([#2916](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2916)) ([47f0161](https://github.com/aws-powertools/powertools-lambda-typescript/commit/47f016188e5d36611c10466a4755d1228a6e14e1))
* **tracer:** include request pathname in trace data ([#2955](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2955)) ([6864e53](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6864e53d73f49b15fd88ab35a4f6d22263d0c9fd))

### Features

* **logger:** introduce log key reordering functionality ([#2736](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2736)) ([9677258](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9677258f3c872400fca89b625760b7a45f923212))
* **logger:** introduce loglevel trace [#1589](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1589) ([#2902](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2902)) ([650252c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/650252c6863d95d53ed182888200db314a199b09))
* **parameters:** adds setParameter function to store SSM parameters ([#3020](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3020)) ([8fd5479](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8fd5479c6da2d60921df92fe7e5e72a0e03d5745))

# [2.7.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.6.0...v2.7.0) (2024-08-08)

### Bug Fixes

* **logger:** invalid time zone environment variables leads to error ([#2865](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2865)) ([d55465f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d55465f937390f4511e837033db0dab582cf4e14))

### Features

* **metrics:** add unit None for CloudWatch EMF Metrics ([#2904](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2904)) ([fa27cba](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fa27cba5ffdb9d123b25d206c189ad17eeb8b44b))
* **parser:** add helper function to handle JSON stringified fields ([#2901](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2901)) ([806b884](https://github.com/aws-powertools/powertools-lambda-typescript/commit/806b884f51684fa4654d357fafdf8ebeda4de01b))

# [2.6.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.5.0...v2.6.0) (2024-07-25)

### Features

* **logger:** introduce loglevel constant ([#2787](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2787)) ([e75f593](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e75f5933602342a45fbeaa7a459452387e43c492))
* **parser:** allow parser set event type of handler with middy ([#2786](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2786)) ([9973f09](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9973f09da260305ce8fd18780a9a474f3404ca1a))

# [2.5.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.4.0...v2.5.0) (2024-07-15)

### Bug Fixes

* **parser:** include error cause in ParseError ([#2774](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2774)) ([34d0b55](https://github.com/aws-powertools/powertools-lambda-typescript/commit/34d0b5500ca67a6df0703be66031d1aee61a09fa))

### Features

* **logger:** custom function for unserializable values (JSON replacer)  ([#2739](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2739)) ([fbc8688](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fbc86889f88203945a4201c6a6c403b3a257d54f))

# [2.4.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.3.0...v2.4.0) (2024-07-10)

### Bug Fixes

* **idempotency:** check error identity via names ([#2747](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2747)) ([55c3878](https://github.com/aws-powertools/powertools-lambda-typescript/commit/55c387816baee98829441526a0de001044d67344))

### Features

* **batch:** add option to not throw `FullBatchFailureError` when the entire batch fails ([#2711](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2711)) ([74198ef](https://github.com/aws-powertools/powertools-lambda-typescript/commit/74198ef1ec1d11267813d2f4b6dd5f4c5692f7d4))
* **internal:** support Middy.js 5.x ([#2748](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2748)) ([1d7ad61](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1d7ad61a569a4b1421dbe1754b0179f676cfede7))
* **layers:** deploy Lambda layers in `ap-south-2` and `me-central-1` ([#2675](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2675)) ([208c57a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/208c57a28eb7140bf4a2a93a4201a06fced049b9))
* **logger:** time zone aware timestamp in Logger ([#2710](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2710)) ([9fe4c75](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9fe4c754960a07aad008ff4ada63cf68aa9ba89a))
* **maintenance:** drop support for Node.js 16.x ([#2717](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2717)) ([e4eee73](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e4eee73770ffccead9212a566335ec256a31af7d))

# [2.3.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.2.0...v2.3.0) (2024-06-27)

### Bug Fixes

* **idempotency:** preserve scope of decorated class ([#2693](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2693)) ([22ec1f0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/22ec1f005ae334577a2ee878a454527ad16a56d9))
* **logger:** reset log level after sampling refresh ([#2673](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2673)) ([618faec](https://github.com/aws-powertools/powertools-lambda-typescript/commit/618faeca7a2fff1d8570bd46832da65129196220))

### Features

* **logger:** add `clearState()` method ([#2408](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2408)) ([f55e2d0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f55e2d019f8693ca79753eb56ba951b0fd33101b))
* **parser:** enhance API Gateway schemas ([#2665](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2665)) ([b3bc1f0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b3bc1f0a173233fdcf50f2573949b17a312813b4))

# [2.2.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.1.1...v2.2.0) (2024-06-13)

### Bug Fixes

* **idempotency:** deep sort payload during hashing ([#2570](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2570)) ([6765f35](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6765f35e98e2d8267d2672c12ba387a9af62a4b5))
* **parser:** handle API Gateway Test UI sourceIp ([#2531](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2531)) ([cd6c512](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cd6c512c3a3b799debdafabac1558c8d40c8dc93))

### Features

* **batch:** add option to continue processing other group IDs on failure in `SqsFifoPartialProcessor` ([#2590](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2590)) ([a615c24](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a615c24108c4653be4c62d8488092fc08a4a3cc3))

## [2.1.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.1.0...v2.1.1) (2024-05-14)

### Bug Fixes

* **parser:** lambda function url cognitoIdentity and principalOrgId nullable ([#2430](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2430)) ([3c3e393](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3c3e393df47d28a6bddb2a9d01cd6fefea3db15e))
* **parser:** set APIGatewayProxyEventSchema body and query string keys to be nullable ([#2465](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2465)) ([7ce5b3c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7ce5b3cff88b6eadeda1041b4eb076af2ebd848d))
* **parser:** set etag optional for delete object notifications ([#2429](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2429)) ([100e223](https://github.com/aws-powertools/powertools-lambda-typescript/commit/100e2238b45e224a369cc7a349f78cafda3f94b7))

# [2.1.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.0.4...v2.1.0) (2024-04-17)

### Bug Fixes

* **jmespath:** refactor custom function introspection to work with minification ([#2384](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2384)) ([21ecc4f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/21ecc4f736ccba85c276889163860a98613174cc))

### Features

* **idempotency:** add custom JMESPath functions ([#2364](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2364)) ([9721e7c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9721e7c01fc010944eb477bdbc24b9e06a5c4571))

## 2.0.4 (2024-04-10)

### Bug Fixes

**idempotency:** return correct value from in-memory cache ([#2309](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2309)) ([5b4c103](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b908aa1111d332fcf3638a77f24a545b85b4c103))
**logger:** buffer logs emitted during init ([#2269](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2269)) ([1439867](https://github.com/aws-powertools/powertools-lambda-typescript/commit/90d3b84b9297ba0d4755fd2608fd50dc91439867))

### Features

**tracer:** support tracing `fetch` requests ([#1619](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1619)) ([607548b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cc34400000f9dffe5190968f2af64e4ce607548b))
**jmespath** public release of JMESPAth utility ([#1645](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1645)) ([233ff9b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/671a34d34ac80d3c1a7860ee8a6b41804233ff9b))

### Minor Changes

**logger:** use template literal instead of `node:util` format ([#2283](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2283)) ([961ace1](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2383c1419d96bf980a044c7acbb4117b5961ace1))

## 2.0.3 (2024-03-15)

**feat(logger):** improve regex in stack trace parsing ([#2121](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2121)) ([ebe5eef](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ebe5eef3319fc95070c2c33c0ac64b8e42443b38))
**fix(idempotency):** transform private class fields ([#2230](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2230)) ([aa6e6e0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/aa6e6e0c25bbc93151cc5cddc584400575604f05))
**improv(commons):**: expand type utils functions ([#2191](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2191)) ([9208393](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9208393fe07d33cb35ea479b3c0866c8a7b91a21))
**feat(commons):** add fromBase64 helper function ([#2188](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2188)) ([133159b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/133159ba4cca41a61c14d62f9356bb89a7f0a08f))
**fix(layers):**: add createRequire banner in esm build ([#2231](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2231)) ([730bcc9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/730bcc93c027f4d60788badb6c5c01a09b3c70be))

## 2.0.2 (2024-03-05)

### Bug Fixes

* **tracer:** modify aws-xray-sdk-core import for js ([#2164](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2164)) ([29630b5](https://github.com/aws-powertools/powertools-lambda-typescript/commit/29630b5b68915ccca1324f3e7ce3e95b85a616be))

## 2.0.1 (2024-03-04)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [2.0.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.18.1...v2.0.0) (2024-03-04)

**Note:** Version bump only for package aws-lambda-powertools-typescript

## 1.18.1 (2024-02-20)

**Note:** Version bump only for package aws-lambda-powertools-typescript

## [1.18.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.17.0...v1.18.0) (2024-01-26)

### Features

**layers:** add `ca-west-1` region ([#1836](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1836)) ([55ff4df](https://github.com/aws-powertools/powertools-lambda-typescript/commit/55ff4df53773e949993c3f21718ea3d447c30f9e))

## [1.17.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.16.0...v1.17.0) (2023-11-24)

**maintenance:** drop support for Node.js 14 ([#1664](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1664)) ([e2a0923](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e2a09232f86167b5208be2daf892aa1ea433ce0f))

# [1.16.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.15.0...v1.16.0) (2023-11-16)

### Features

* **logger:** add support for `AWS_LAMBDA_LOG_LEVEL` and `POWERTOOLS_LOG_LEVEL` ([#1795](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1795)) ([e69abfb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e69abfb5f1b5d3bf993ac2fe66fae85a85af9905))

# [1.15.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.2...v1.15.0) (2023-11-14)

### Features

* **maintenance:** add support for nodejs20.x runtime ([#1790](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1790)) ([6b9b1bc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6b9b1bcb9baf4b3d8e0e5ec6709594aca09bb033))
* **metrics:** log directly to stdout ([#1786](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1786)) ([75dc5b1](https://github.com/aws-powertools/powertools-lambda-typescript/commit/75dc5b1e16944416a287628c50ec4a0cf82c3023))

## [1.14.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.1...v1.14.2) (2023-11-03)

### Bug Fixes

* **metrics:** deduplicate dimensions when serialising ([#1780](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1780)) ([8181b48](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8181b481ba96fa7a91959ff2d40bdedfe80b451b))

## [1.14.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.0...v1.14.1) (2023-10-31)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [1.14.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.13.1...v1.14.0) (2023-09-29)

### Features

* **idempotency:** add idempotency decorator ([#1723](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1723)) ([d138673](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d138673a33ff31f40b225dc046b2ff8258d0a97d))
* **layers:** add `arm64` to integration test matrix ([#1720](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1720)) ([61ad5ac](https://github.com/aws-powertools/powertools-lambda-typescript/commit/61ad5ac3bcf7742684aeec28553ec294696f3301))
* **tracer:** add try/catch logic to decorator and middleware close ([#1716](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1716)) ([be16b59](https://github.com/aws-powertools/powertools-lambda-typescript/commit/be16b599b8023f95572234fb222ea70aea5b3f17))

## [1.13.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.13.0...v1.13.1) (2023-09-21)

### Bug Fixes

* **maintenance:** remove upper peer dependency Middy ([#1705](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1705)) ([df21ec8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/df21ec8761b1be511c13c28fedd41bf0e2851061))

# [1.13.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.12.1...v1.13.0) (2023-09-18)

### Bug Fixes

* **batch:** Update processor to pass only context to handler ([#1637](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1637)) ([6fa09b2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6fa09b2638bf247fd595db51ac3d1aa1252d3379))
* **docs:** update versions.json jq query ([4e6f662](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4e6f662b244a941a911c1ed5973bef11d7610093))
* **parameters:** return type when options without transform is used ([#1671](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1671)) ([b2fe341](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b2fe34150a0d896f1755ca30cbe89175cdb66ff2))

### Features

* **batch:** rename AsyncBatchProcessor to default BatchProcessor ([#1683](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1683)) ([e253755](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e253755d09f50a75cde805168845f52d8b85af28))

## [1.12.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.12.0...v1.12.1) (2023-07-25)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [1.12.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.11.1...v1.12.0) (2023-07-25)

### Features

* **batch:** add batch processing utility ([#1625](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1625)) ([c4e6b19](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c4e6b192c3658cbcc3f458a579a0752153e3c201)), closes [#1588](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1588) [#1591](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1591) [#1593](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1593) [#1592](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1592) [#1594](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1594)
* **logger:** add cause to formatted error ([#1617](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1617)) ([6a14595](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6a145959249db6eeb89fdfe3ed4c6e30ab155f9c))

## [1.11.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.11.0...v1.11.1) (2023-07-11)

### Bug Fixes

* **docs:** fix alias in versions.json ([#1576](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1576)) ([7198cbc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7198cbca28962e07486b90ecb4f265cafe28bf73))
* **idempotency:** types, docs, and `makeIdempotent` function wrapper ([#1579](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1579)) ([bba1c01](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bba1c01a0b3f08e962568e1d0eb44d486829657b))

# [1.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.10.0...v1.11.0) (2023-06-29)

### Features

* **idempotency:** preserve original error when wrapping into `IdempotencyPersistenceLayerError` ([#1552](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1552)) ([866837d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/866837daf34563698709612351c45769e02daf16))

# [1.10.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.9.0...v1.10.0) (2023-06-23)

### Bug Fixes

* **ci:** change how versions and aliases are inserted into versions.json ([#1549](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1549)) ([9e1d19a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9e1d19a9bc89d31bef851a615860c3b01bd9d77f))
* **idempotency:** pass lambda context remaining time to save inprogress ([#1540](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1540)) ([d47c3ec](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d47c3ec64d926d49f3799f361d54a11627d16cc1))
* **idempotency:** record validation not using hash ([#1502](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1502)) ([f475bd0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f475bd097b64f009c329c023a2dd7c7e9371270a))
* **idempotency:** skip persistence for optional idempotency key ([#1507](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1507)) ([b9fcef6](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b9fcef66eb4bd9a7ad1eeac5f5db2cdbccc70c71))
* **metrics:** flush metrics when data points array reaches max size ([#1548](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1548)) ([24c247c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/24c247c39c0ac29774ac3fcf09902916f3936e1e))
* missing quotes ([67f5f14](https://github.com/aws-powertools/powertools-lambda-typescript/commit/67f5f14e612a56d94923aa3b33df7d2e6b46cc06))
* missing quotes ([349e612](https://github.com/aws-powertools/powertools-lambda-typescript/commit/349e612e1a46646ef05b11e0478094bf7f74a5cd))
* update reference in workflow ([#1518](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1518)) ([9c75f9a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9c75f9a8a0b2fc4b24bbd37fdb00620d06903283))

### Features

* **logger:** clear state when other middlewares return early ([#1544](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1544)) ([d5f3f13](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d5f3f13ccd7aae1bbc59431741e8aaf042dd2a73))
* **metrics:** publish metrics when other middlewares return early ([#1546](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1546)) ([58b0877](https://github.com/aws-powertools/powertools-lambda-typescript/commit/58b087713814f1c5f56a86aa815d04372e98ebd0))
* **parameters:** review types and exports ([#1528](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1528)) ([6f96711](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6f96711625e212898b1c227c651beba7e709c9d1))
* **tracer:** close & restore segments when other middlewares return ([#1545](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1545)) ([74ddb09](https://github.com/aws-powertools/powertools-lambda-typescript/commit/74ddb09a3107d9f45f34ccda1e691a9504578c2d))

# [1.9.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.8.0...v1.9.0) (2023-06-09)

### Features

* **commons:** add `cleanupPowertools` function ([#1473](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1473)) ([5bd0166](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5bd01665699ae2f026d845477e648d325f20a855))
* **idempotency:** `makeHandlerIdempotent` middy middleware ([#1474](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1474)) ([a558f10](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a558f100209978a075e98a8c8a3763c4145c8a94))
* **idempotency:** add package exports ([#1483](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1483)) ([faa9307](https://github.com/aws-powertools/powertools-lambda-typescript/commit/faa9307a4bd42e3acdab5dc68ddd57ab5c61964c))
* **idempotency:** idempotency middleware & types exports ([#1487](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1487)) ([d947db9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d947db9d2f99b7c4da0a3618e967db9e77728805))
* **idempotency:** implement IdempotencyHandler ([#1416](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1416)) ([f2ebf08](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f2ebf08607f5bb41a96f2b713973f4635d9d6f9d))
* **logger:** enhance log level handling ([#1476](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1476)) ([0021536](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0021536e35ba7046226155055f9ab6b5f988f71f))
* **parameters:** add adaptive types to SecretsProvider ([#1411](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1411)) ([5c6d527](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5c6d527b0ad983e893ba07f8a334b4085b6ae6a7))
* **tracer:** add isTraceSampled method ([#1435](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1435)) ([194bbd3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/194bbd366b726a477523225f446add054c20566e))

# [1.8.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.7.0...v1.8.0) (2023-04-07)

### Bug Fixes

* **parameters:** type import path in AppConfigProvider ([#1388](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1388)) ([40a1a24](https://github.com/aws-powertools/powertools-lambda-typescript/commit/40a1a24de50ee086f76ab9c78d5fc03e5e7945cf))

### Features

* **idempotency:** add local cache to `BasePersistenceLayer` ([#1396](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1396)) ([2013ff2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2013ff250afa3f1a26a7610694fe881b232b976f))
* **idempotency:** BasePersistenceLayer, DynamoDBPersistenceLayer and configs ([#1376](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1376)) ([f05cba8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f05cba8802551f160d630d3ef2b7e741f0de9158))
* **logger:** add `CRITICAL` log level ([#1399](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1399)) ([a248ff0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a248ff0a584bac5a97fe300f3addbb9c3a50b555))
* **metrics:** log warning on empty metrics ([#1397](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1397)) ([31ae936](https://github.com/aws-powertools/powertools-lambda-typescript/commit/31ae936831177f58edff43ce3850ed13c964fc87))
* **parameters:** ability to set `maxAge` and `decrypt` via environment variables ([#1384](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1384)) ([dcf6620](https://github.com/aws-powertools/powertools-lambda-typescript/commit/dcf6620f55004b69186cd69b0c42b1cdd9fd1ce4))
* **parameters:** add `clearCaches` function ([#1382](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1382)) ([ec49023](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ec49023c44c3873ba5396a45ee9b2a8ee031e84b))
* **parameters:** stronger types for SSM getParameter ([#1387](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1387)) ([9d53942](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9d53942fdd272213cf39c7fa87ffa78513dff37d))

# [1.7.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.6.0...v1.7.0) (2023-03-20)

### Bug Fixes

* **docs:** typo in layer arn ([bc5f7c9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bc5f7c99e02396223e726962432fc3856a68a29d))

### Features

* **logger:** add silent log level to suppress the emission of all logs ([#1347](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1347)) ([c82939e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c82939ebdb82ae596cbad07be397794ee4b69fe5))
* **metrics:** support high resolution metrics ([#1369](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1369)) ([79a321b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/79a321b199ef51a024dc25b83673baf2eb03de69))
* **parameters:** AppConfigProvider to return the last valid value when the API returns empty value on subsequent calls ([#1365](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1365)) ([97339d9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/97339d9336ec67568e9e7fd079b3cfe006da1bba))

# [1.6.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.5.1...v1.6.0) (2023-03-02)

### Bug Fixes

* **docs:** logger bringYourOwnFormatter snippet [#1253](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1253) ([#1254](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1254)) ([fdbba32](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fdbba32d8b3545730d242ac4fd1ef2d83cdbccce))
* hardcoded cdk version in `publish_layer.yaml` ([#1232](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1232)) ([63a3909](https://github.com/aws-powertools/powertools-lambda-typescript/commit/63a3909063637ca2306a718a10e35e54881f570e))
* **logger:** createChild not passing all parent's attributes ([#1267](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1267)) ([84ab4b9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/84ab4b911d17d687bdbe60ded31f1e2b6860feb3))
* **logger:** middleware stores initial persistent attributes correctly ([#1329](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1329)) ([6b32304](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6b3230489895dc1abdfc6ad56daeeb555fda529f))
* **parameters:** handle base64/binaries in transformer ([#1326](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1326)) ([bb50c04](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bb50c04f5b2e6a144295b453577a7ea1a15ac011))
* **parameters:** Tokenize attribute names in `DynamoDBProvider` ([#1239](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1239)) ([f3e5ed7](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f3e5ed70c7e5baa3f3aa15428e8d6cb56b096f26))

### Features

* **idempotency:** Add function wrapper and decorator ([#1262](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1262)) ([eacb1d9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/eacb1d9f59a82ad34234f51198ed215c41a64b41))
* **layers:** add new regions ([#1322](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1322)) ([618613b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/618613b9a69166553dd9ef8d5b92f89e1cdf79d0))
* **logger:** make loglevel types stricter ([#1313](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1313)) ([5af51d3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5af51d319dee68d7a7ba832721580d7a6e655249))
* **parameters:** add support for custom AWS SDK v3 clients for providers ([#1260](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1260)) ([3a8cfa0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3a8cfa0d6e5aaa5c2c36d97d7835dbf5287b7110))

## [1.5.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.5.0...v1.5.1) (2023-01-13)

### Bug Fixes

* **logger:** logger throws TypeError when log item has BigInt value ([#1201](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1201)) ([a09e4df](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a09e4dfbb2cef062c1178de3e3dbc2583aef7a91))
* **parameters:** types in BaseProvider + added getMultiple alias to SecretsProvider ([#1214](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1214)) ([32bd7e8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/32bd7e8694fa74a63993eded236af8d84c2dc752))

### Features

* **parameters:** AppConfigProvider ([#1200](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1200)) ([fecedb9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fecedb9e8446a008dca2927ba7aec16d54b34685))
* **parameters:** DynamoDBProvider support ([#1202](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1202)) ([db94850](https://github.com/aws-powertools/powertools-lambda-typescript/commit/db94850b536dc92fcd11ce2a5f68412bed9c1feb))
* **parameters:** SecretsProvider support ([#1206](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1206)) ([02516b7](https://github.com/aws-powertools/powertools-lambda-typescript/commit/02516b7315c3c6df7bed51768381313e7942b215))
* **parameters:** SSMProvider support ([#1187](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1187)) ([2e4bb76](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2e4bb76773222ecbe44ec22633445e06199fc8b1))

# [1.5.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.4.1...v1.5.0) (2022-11-25)

### Bug Fixes

* **logger:** merge child logger options correctly ([#1178](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1178)) ([cb91374](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cb9137436cc3a10d6c869506ddd07e35963ba8b2))

### Features

* **idempotency:** Add persistence layer and DynamoDB implementation ([#1110](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1110)) ([0a6676a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0a6676ac24abdadaaff2d95fc8d75d3a7137a00b))
* **logger:** disable logs while testing with `jest --silent` in dev env ([#1165](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1165)) ([6f0c307](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6f0c30728f31d60433b3afb6983c64110c28d27e))
* **logger:** pretty printing logs in local and non-prod environment ([#1141](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1141)) ([8d52660](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8d52660eb6b8324e284421c2484c45d9a0839346))
* **parameters:** added `BaseProvider` class ([#1168](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1168)) ([d717a26](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d717a26bba086be4c01f1458422662f8bfba09a9))

## [1.4.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.4.0...v1.4.1) (2022-11-09)

### Bug Fixes

* **metrics:** store service name in defaultDimensions to avoid clearing it ([#1146](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1146)) ([a979202](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a979202ae0563f8ce00dee98bbf15d0bcfcfd3cc))

# [1.4.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.3.0...v1.4.0) (2022-10-27)

### Bug Fixes

* **metrics:** metadata and dimensions not cleared on publish ([#1129](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1129)) ([b209c30](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b209c30df92da07875f204f7f211294feea729db))

### Features

* **all:** moved EnvService to commons + exposed getXrayTraceId in tracer ([#1123](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1123)) ([c8e3c15](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c8e3c15b64142ebe6f43835a5917ecba26293a32))

# [1.3.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.2.1...v1.3.0) (2022-10-17)

### Bug Fixes

* **all:** update version command to use lint-fix ([#1119](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1119)) ([6f14fb3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6f14fb3229882b1dd0c20d18c87a542993432da9))
* captureColdStartMetric and throwOnEmptyMetrics when set to false was interpreted as true ([#1090](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1090)) ([127aad4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/127aad4698412d72368c093812dd4034839119ca))
* captureMethod correctly detect method name when used with external decorators ([#1109](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1109)) ([a574406](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a574406134b65c17f56dfb3d3130aa237ece4160))
* **logger:** wait for decorated method return before clearing out state ([#1087](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1087)) ([133ed3c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/133ed3c31ce1d99eb8f427f54721896781438ef7))
* ts-node version for layer-publisher ([#1112](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1112)) ([ee243de](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ee243dea0b9268ed793df19f0b04e680f68e41a6))

### Features

* **idempotency:** create initial class structure for function idempotency ([#1086](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1086)) ([06fbaae](https://github.com/aws-powertools/powertools-lambda-typescript/commit/06fbaae4db3825557aa84d40372a53422e42840d))
* publish lib as Lambda Layer ([#1095](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1095)) ([83f6efb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/83f6efba1db32ba2dc8fff026e258b5de66783e0))
* **tracer:** specify subsegment name when capturing class method ([#1092](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1092)) ([d4174eb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d4174eb7a894215e2d37f306016429de3bde8029))

### Reverts

* Revert "chore(release): v1.3.0 [skip ci]" ([237b99f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/237b99f9f6eff5e6e26d779603cf13cd4422c156))

## [1.2.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.2.0...v1.2.1) (2022-08-25)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [1.2.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.1.1...v1.2.0) (2022-08-23)

### Bug Fixes

* **docs:** docs published with incorrect version number + api docs missing after release ([#1066](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1066)) ([8b8b25c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8b8b25c97d84f7a518a463e2a30406c31e44e587))

### Features

* **metrics:** increase maximum dimensions to 29 ([#1072](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1072)) ([7b9a027](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7b9a0278ccf801a521cab3f74372a4748231fd11))
* **tracer:** allow disabling result capture for decorators and middleware ([#1065](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1065)) ([c3b9a37](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c3b9a37b6d5885f1750da4f0b226a18734ff0c29))

## [1.1.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.1.0...v1.1.1) (2022-08-18)

### Bug Fixes

* **logger:** decorated class methods cannot access `this` ([#1060](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1060)) ([73990bb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/73990bbcbbd9d5a6d6f55f553e4fd8f038654fa9))
* **tracer:** decorated class methods cannot access `this` ([#1055](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1055)) ([107fa04](https://github.com/aws-powertools/powertools-lambda-typescript/commit/107fa04148ec86c8a0c0a29b5b2d35a62fe2b4e6))
* workflow concurrency + leftover needs ([#1054](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1054)) ([9ce180a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9ce180a3b70a86af5e6cc94f51ecf4a0b6a7a96e))

# [1.1.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.0.2...v1.1.0) (2022-08-12)

### Bug Fixes

* **layers:** release process + remove duplicate code ([#1052](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1052)) ([f653c06](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f653c065bd5586785e482d61d2738549d8ac9fd9))
* **logger:** fix clearstate bug when lambda handler throws ([#1045](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1045)) ([5ebd1cf](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5ebd1cf44a2a3b6d99923e5bb942af3327325241))
* wrong scope in captureMethod ([#1026](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1026)) ([1a06fed](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1a06fed74db02741c58bc05d8d5fce2e688d7879))

### Features

* **build:** publish lib as a Lambda Layer ([#884](https://github.com/aws-powertools/powertools-lambda-typescript/issues/884)) ([c3a20c6](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c3a20c61380a6b6944807f5abf12c9cafb254325)), closes [#1031](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1031)

## [1.0.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.0.1...v1.0.2) (2022-07-19)

**Note:** Version bump only for package aws-lambda-powertools-typescript

## [1.0.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.12.0-rc.1...v1.0.1) (2022-07-14)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [0.12.0-rc.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.12.0-rc.0...v0.12.0-rc.1) (2022-07-14)

### Reverts

* Revert "build: bump lerna (#1014)" (#1018) ([623e12d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/623e12de4c6c1dbc93d285e7d03426bff0802b38)), closes [#1014](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1014) [#1018](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1018)

# [0.12.0-rc.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.11.1-rc.0...v0.12.0-rc.0) (2022-07-14)

### Bug Fixes

* **logger:** POWERTOOLS_LOGGER_LOG_EVENT precedence is respected ([#1015](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1015)) ([1cbb4db](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1cbb4db4daf776e12f7dc2b383ac7fa561b7bada))
* **tracer:** capture method throws errors correctly ([#1016](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1016)) ([fb85238](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fb8523868e8d5e31c00a017ae1102ed31a0a4245))

### Features

* **tracer:** auto disable when running inside amplify mock ([#1010](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1010)) ([024d628](https://github.com/aws-powertools/powertools-lambda-typescript/commit/024d6286f9b9273becce825b5c6ca0db87d4c63a))

### Reverts

* Revert "chore(release): v0.12.0-rc.0 [skip ci]" ([9397f1d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9397f1d3624eb0bfbeb5e4c2702ae51e558a5b4a))
* Revert "chore(release): v0.12.0-rc.0 [skip ci]" (#1017) ([51c18da](https://github.com/aws-powertools/powertools-lambda-typescript/commit/51c18da20db434f8b12f320e5074e3e0a146046e)), closes [#1017](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1017)

## [0.11.1-rc.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.11.0...v0.11.1-rc.0) (2022-06-24)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [0.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.10.0...v0.11.0) (2022-06-23)

### Features

* **logger:** add clear state functionality ([#902](https://github.com/aws-powertools/powertools-lambda-typescript/issues/902)) ([fa1dacb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fa1dacb001503a0a607e0951499119a1a9c61545))

# [0.10.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.9.1...v0.10.0) (2022-06-02)

### Bug Fixes

* **commons:** rename tests subfolder to samples to avoid being deleted by tools such as node-prune ([#882](https://github.com/aws-powertools/powertools-lambda-typescript/issues/882)) ([74ef816](https://github.com/aws-powertools/powertools-lambda-typescript/commit/74ef816830eca897d59881b1d260a146a2c9a47c))

### Features

* **all:** nodejs16x support ([#877](https://github.com/aws-powertools/powertools-lambda-typescript/issues/877)) ([d2b13c9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d2b13c945adb1a74b7c5f76d45f28a6979ce6429))
* **logger:** add removeKeys functionality ([#901](https://github.com/aws-powertools/powertools-lambda-typescript/issues/901)) ([a0f72c2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a0f72c275270db33d382bff357f6054f552197e6))

## [0.9.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.9.0...v0.9.1) (2022-05-24)

### Bug Fixes

* **logger:** enable logging of arbitrary objects ([#883](https://github.com/aws-powertools/powertools-lambda-typescript/issues/883)) ([5d34854](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5d348543d3fbb48a98a9b2c34a1e8fa56b037adb))

# [0.9.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.8.1...v0.9.0) (2022-05-16)

### Bug Fixes

* added back fetch-depth: 0 ([#812](https://github.com/aws-powertools/powertools-lambda-typescript/issues/812)) ([494c742](https://github.com/aws-powertools/powertools-lambda-typescript/commit/494c742aefc9355ee431f433655ddd3fd7efebcf))
* **logger:** add xray_trace_id to every log ([#776](https://github.com/aws-powertools/powertools-lambda-typescript/issues/776)) ([11af21a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/11af21ae236140e85d1503d355074c9ec254d90b))
* reintroduce token while checking out ([#848](https://github.com/aws-powertools/powertools-lambda-typescript/issues/848)) ([cabef3e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cabef3e515c9074dc178efca76de7c72c70370e3))
* removed token from remaining actions ([#805](https://github.com/aws-powertools/powertools-lambda-typescript/issues/805)) ([4fd9ecb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4fd9ecbde412f640deaeb17a997aae8a9f5841c0))

### Features

* **examples:** added sam example to workflows ([#849](https://github.com/aws-powertools/powertools-lambda-typescript/issues/849)) ([93f1c7b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/93f1c7b55cb159dfcbbcb41149ccec7fd5db1660))

## [0.8.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.8.0...v0.8.1) (2022-04-14)

### Bug Fixes

* **logger:** change logging to use stdout ([#748](https://github.com/aws-powertools/powertools-lambda-typescript/issues/748)) ([0781a47](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0781a479a6ae3c794f94c72b59cd0920073159a2))

# [0.8.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.7.2...v0.8.0) (2022-04-08)

### Features

* added captureHTTPsRequest feature ([#677](https://github.com/aws-powertools/powertools-lambda-typescript/issues/677)) ([5a36723](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5a367233b3284c4b1c0c18caffd00e585afc9f55))

## [0.7.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.7.1...v0.7.2) (2022-04-01)

**Note:** Version bump only for package aws-lambda-powertools-typescript

## [0.7.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.7.0...v0.7.1) (2022-03-17)

### Bug Fixes

* **logger:** enable sequential invocation in e2e test ([#658](https://github.com/aws-powertools/powertools-lambda-typescript/issues/658)) ([800424b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/800424bc77223682ad6cdcc9f35080aff30ba91e))
* **logger:** fix handling of additional log keys ([#614](https://github.com/aws-powertools/powertools-lambda-typescript/issues/614)) ([8aab299](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8aab29900c5fac8eb625eb747acbc23ceac8f6ba))
* **tracer, metrics:** use polling instead of fixed wait in e2e tests ([#654](https://github.com/aws-powertools/powertools-lambda-typescript/issues/654)) ([6d4ab75](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6d4ab751bc98eb823d2a68b4973fa9f8405971a2))

# [0.7.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.6.0...v0.7.0) (2022-03-08)

### Features

* **logger:** adopted Utility class & updated unit tests ([#550](https://github.com/aws-powertools/powertools-lambda-typescript/issues/550)) ([48f3487](https://github.com/aws-powertools/powertools-lambda-typescript/commit/48f34870d5bc3a5affcb70c8927859c56da6c5ff))
* **metrics:** adopted Utility class ([#548](https://github.com/aws-powertools/powertools-lambda-typescript/issues/548)) ([672e6a8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/672e6a82a2c66f99153c63a53e9d31481afd897a))
* **tracer:** adopted Utility class & updated unit tests ([#549](https://github.com/aws-powertools/powertools-lambda-typescript/issues/549)) ([3769a69](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3769a694725cc2a3fe6fb5f90fb045f73ea32a7c))

# [0.6.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.5.1...v0.6.0) (2022-02-17)

### Bug Fixes

* **logger:** fix logger attribute merging ([#535](https://github.com/aws-powertools/powertools-lambda-typescript/issues/535)) ([8180be1](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8180be1ceb3f75bb7a35a7905cca867fb5eaa970))

### Features

* **commons:** centralize cold start heuristic ([#547](https://github.com/aws-powertools/powertools-lambda-typescript/issues/547)) ([4e4091f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4e4091f7b853c56a8dfd28829f09a066cc8e2ee7))
* **logger:** add e2e tests for logger ([#529](https://github.com/aws-powertools/powertools-lambda-typescript/issues/529)) ([e736b65](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e736b652c112b1c24c29eca8b1edfd87a79d1b2e))

## [0.5.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.5.0...v0.5.1) (2022-02-09)

### Bug Fixes

* **tracer:** properly return DynamoDB.DocumentClient ([#528](https://github.com/aws-powertools/powertools-lambda-typescript/issues/528)) ([3559e7b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3559e7b19339a4649f235fb4af41c6b182da3df1))

### Reverts

* Revert "build(deps-dev): bump aws-cdk from 1.139.0 to 1.143.0 (#532)" (#544) ([e96c9ba](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e96c9ba5bd4f738e5ed7c5850e06856a8c69bff1)), closes [#532](https://github.com/aws-powertools/powertools-lambda-typescript/issues/532) [#544](https://github.com/aws-powertools/powertools-lambda-typescript/issues/544)
* Revert "build(deps-dev): bump @aws-cdk/aws-lambda-nodejs from 1.139.0 to 1.143.0 (#531)" (#545) ([7dffbd8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7dffbd8708555fcc9817ea4373ccf71b0aea3c89)), closes [#531](https://github.com/aws-powertools/powertools-lambda-typescript/issues/531) [#545](https://github.com/aws-powertools/powertools-lambda-typescript/issues/545)

# [0.5.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.4.0...v0.5.0) (2022-01-26)

### Bug Fixes

* **examples:** fix errors in logger and metrics examples ([#509](https://github.com/aws-powertools/powertools-lambda-typescript/issues/509)) ([c19b47c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c19b47cb4cdb71e0ae404e9302226256d02fb7d5))
* **logger|metrics:** properly return decorated class ([#489](https://github.com/aws-powertools/powertools-lambda-typescript/issues/489)) ([014c5bd](https://github.com/aws-powertools/powertools-lambda-typescript/commit/014c5bd7d5c807064af8f04c16d297a8fe3bc0d9))

### Features

* Add codespaces/gitpod support ([#485](https://github.com/aws-powertools/powertools-lambda-typescript/issues/485)) ([ed6f258](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ed6f258d6f8025bcfa9db3ea3d6a05a1338802e3))
* **all:** make `@middy/core` optional ([#511](https://github.com/aws-powertools/powertools-lambda-typescript/issues/511)) ([1107f96](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1107f96e9b4c678d34ee36757366f150d99be4dc))
* **tracer:** add support for capturing DynamoDB DocumentClient ([#450](https://github.com/aws-powertools/powertools-lambda-typescript/issues/450)) ([621ae50](https://github.com/aws-powertools/powertools-lambda-typescript/commit/621ae50430e4459f90eaaa135eb0ed674b95e108))

# [0.4.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.3.3...v0.4.0) (2022-01-20)

### Features

* **logger:** JSDOCS support ([#491](https://github.com/aws-powertools/powertools-lambda-typescript/issues/491)) ([cd2c2d9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cd2c2d93a5822e26d3113a042be1dd0473aa6b2a))

## [0.3.3](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.3.2...v0.3.3) (2022-01-17)

### Bug Fixes

* lerna version not publishing all packages ([#480](https://github.com/aws-powertools/powertools-lambda-typescript/issues/480)) ([0cabc3f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0cabc3ff7b29fae8a01aeae56450d19737af3bba))

## [0.3.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.3.1...v0.3.2) (2022-01-17)

### Bug Fixes

* export LogFormatter + update docs ([#479](https://github.com/aws-powertools/powertools-lambda-typescript/issues/479)) ([7f91566](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7f91566d4ff34887914009e2424df7c39a96cd71))
* updated CDK examples to remove old references & improve comments ([#439](https://github.com/aws-powertools/powertools-lambda-typescript/issues/439)) ([4cdaaea](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4cdaaeaf7fbb24571b194c0e82338fbd216d2dcd))

## [0.3.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.3.0...v0.3.1) (2022-01-14)

### Bug Fixes

* **all:** fix latest release broken by change of npm pack result on common ([#470](https://github.com/aws-powertools/powertools-lambda-typescript/issues/470)) ([2c3df93](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2c3df9378ac191f6da6cb5f458f6227d6466cafa)), closes [#417](https://github.com/aws-powertools/powertools-lambda-typescript/issues/417)

# [0.3.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.2.0...v0.3.0) (2022-01-14)

### Bug Fixes

* **build:** Fix linting issue and add linting to the pre-push hook ([#440](https://github.com/aws-powertools/powertools-lambda-typescript/issues/440)) ([e7bc53c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e7bc53c38b2a906c6952a83c5262db521ea468fb))
* **build:** Update contributing.md and fix npm ci ([#417](https://github.com/aws-powertools/powertools-lambda-typescript/issues/417)) ([279ad98](https://github.com/aws-powertools/powertools-lambda-typescript/commit/279ad984f71d5b157a13cffeab52602f2c09c1f8)), closes [#415](https://github.com/aws-powertools/powertools-lambda-typescript/issues/415) [#415](https://github.com/aws-powertools/powertools-lambda-typescript/issues/415)
* **metrics:** Rename purgeStoredMetrics() function usage in CDK example ([#424](https://github.com/aws-powertools/powertools-lambda-typescript/issues/424)) ([02f0eae](https://github.com/aws-powertools/powertools-lambda-typescript/commit/02f0eae2c378bd5562facf032fb94a25c69f66df))
* **tracer:** avoid throwing errors in manual instrumentation when running outside of AWS Lambda ([#442](https://github.com/aws-powertools/powertools-lambda-typescript/issues/442)) ([fd02acb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fd02acbbe7de1cd0d1b00ae1cca68148a5114cbf))

### Features

* **all:** Update to examples use released version (0.2.0) ([#405](https://github.com/aws-powertools/powertools-lambda-typescript/issues/405)) ([d5e0620](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d5e0620473f31d0839c027a76a88dcdcb98c84de))

# 0.2.0 (2022-01-05)

### Features

* _tracer:_ beta release (#91 (<https://github.com/aws-powertools/powertools-lambda-python/issues/91>))
* _logger:_ beta release (#24 (<https://github.com/aws-powertools/powertools-lambda-python/issues/24>))
* _metrics:_ beta release (#25 (<https://github.com/aws-powertools/powertools-lambda-python/issues/25>))

### Contributions

* chore(ci): auto-label PR on semantic title (#403) by @heitorlessa
* fix: documentation generation on on-release.yml workflow (#368) by @ijemmy
* fix: Remove publishing doc on develop version and fix missing leading 0 in version (#356) by @ijemmy
* feat: generate new version of doc for each release (#355) by @ijemmy
* chore(cicd): cdk examples and e2e tests for metrics (#326) by @flochaz
* fix(cicd): skip ci on bump commit (#339) by @flochaz
* chore(cicd): fix publish (#336) by @flochaz
* chore(cicd): Add release workflow (#260) by @flochaz
* chore(commons): Create a common package (#314) by @flochaz
* feat: Auto publish docs to version "develop" (#269) by @ijemmy
* fix(metrics): publish metrics even if handler throw (#249) by @flochaz
* chore: fix linting (#247) by @flochaz
* chore(all): npm libraries bump and breaking changes fixes (#215) by @saragerion
* chore: Enable auto-merge for dependabot PRs (#169) by @dreamorosi
* feat: add metrics (#102) by @alan-churley
* chore: Add commit hooks for testing and linting (#149) by @bahrmichael
* chore: Removed assignees from issue templates (#146) by @dreamorosi
* chore: Disabled auto-assign-issues integration (#144) by @dreamorosi
* feat: Adding sample automation for PR (#121) by @alan-churley
* test(logger): add unit tests with most important scenarios and features (#52) by @saragerion
* chore: increase version of WS dependancy (#71) by @alan-churley
* chore: dependancies upgrade (#70) by @alan-churley
* build(github-actions): fix YAML of closed issues message (#23) by @saragerion
* improv: repository documentation, metadata, github actions, dot files (#17) by @saragerion
* refactor(logger): overall improvements - DX, examples, business logic (#16) by @saragerion
* chore: updating path for coverage (#12) by @alan-churley
* feat(logger): add context decorator functionality (#13) by @saragerion
* test(all): add mock Lambda events payloads generated by other AWS services (#10) by @saragerion
* feat(logger): basic logger logic (#9) by @saragerion
* revert: Remove CodeQL analysis (#2) by @alan-churley
* feat(metrics): rename method purgeStoredMetrics to publishStoredMetrics (#377) by @flochaz

* fix(metrics): use same naming for serviceName (#401) by @flochaz
* feat(commons): update types to have optional callback (#394) by @flochaz
* feat(metrics): logMetrics middleware (#338) by @saragerion
* chore(tracer): quality of life improvements (#337) by @dreamorosi
* feat(tracer): middy middleware (#324) by @dreamorosi
* feat(logger): middy middleware (#313) by @saragerion
* chore(ALL): fix packaging (#316) by @flochaz
* feat: add tracer (#107) by @dreamorosi
* feat(logger): documentation, examples, business logic changes (#293) by @saragerion
* feat(metric): bring feature parity between decorator and utility function (#291) by @flochaz
* docs(all): make docs more coherent (#387) by @dreamorosi
* docs(logger): improve mkdocs and examples of sample rate feature (#389) by @saragerion
* docs(all): clarifications & fixes (#370) by @dreamorosi
* chore(tracer): cdk examples + e2e tests (#347) by @dreamorosi
* docs(all): getting started section, beta release warning (#351) by @saragerion
* chore(docs): Tracer docs (#274) by @dreamorosi
* chore(docs): Add credits section to README (#305) by @dreamorosi
* chore(metrics): Add typeDoc (#285) by @flochaz
* feat(logger): documentation, examples, business logic changes (#293) by @saragerion
* chore(metrics): github page doc (#284) by @flochaz
* feat: generate api docs (#277) by @ijemmy
* docs: base documentation (#250) by @dreamorosi
* docs: updating readme and package.json to work with lerna (#11) by @alan-churley
* fix(metrics): Support multiple addMetric() call with the same metric name (#390) by @ijemmy
* fix(logger): display correct log level in cloudwatch (#386) by @saragerion
* fix(metrics): expose logMetrics middleware (#380) by @flochaz
* chore: change license (#117) by @dreamorosi
* chore: don't bump version for merge to main (#404) by @flochaz
* feat(ALL): Use optional callback LambdaInterface for decorator (#397) by @flochaz
* chore(ci): add release drafter workflow (#382) by @heitorlessa
* build(deps): bump e2e dependencies metrics (#371) by @dreamorosi
* build(deps-dev): bump @aws-cdk/aws-lambda from 1.136.0 to 1.137.0 (#340) by @dependabot
* chore(commons): Remove eslint from commons pkg (#352) by @dreamorosi
* build(deps-dev): bump @types/lodash from 4.14.177 to 4.14.178 (#335) by @dependabot
* build(deps-dev): bump @types/node from 16.11.11 to 17.0.0 (#325) by @dependabot
* build(deps-dev): bump @types/lodash from 4.14.177 to 4.14.178 (#318) by @dependabot
* build(deps-dev): bump ts-jest from 27.0.7 to 27.1.1 (#317) by @dependabot
* build(deps-dev): bump jest from 27.4.3 to 27.4.5 (#310) by @dependabot
* build(deps): bump @types/aws-lambda from 8.10.85 to 8.10.88 (#312) by @dependabot
* build(deps-dev): bump typescript from 4.5.2 to 4.5.4 (#311) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 5.5.0 to 5.7.0 (#308) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 5.5.0 to 5.7.0 (#309) by @dependabot
* build(deps): bump aws-xray-sdk-core from 3.3.3 to 3.3.4 (#307) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 5.5.0 to 5.6.0 (#297) by @dependabot
* build(deps): bump @types/aws-lambda from 8.10.85 to 8.10.87 (#299) by @dependabot
* build(deps-dev): bump jest from 27.4.3 to 27.4.4 (#300) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 5.5.0 to 5.6.0 (#298) by @dependabot
* build(deps-dev): bump ts-jest from 27.0.7 to 27.1.1 (#296) by @dependabot
* build(deps-dev): bump typescript from 4.5.2 to 4.5.3 (#287) by @dependabot
* build(deps-dev): bump jest from 27.4.3 to 27.4.4 (#288) by @dependabot
* build(deps-dev): bump @types/lodash from 4.14.177 to 4.14.178 (#283) by @dependabot
* build(deps): bump @types/aws-lambda from 8.10.85 to 8.10.86 (#272) by @dependabot
* build(deps-dev): bump ts-jest from 27.0.7 to 27.1.1 (#271) by @dependabot
* build(deps-dev): bump @types/node from 16.11.11 to 16.11.12 (#270) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 5.5.0 to 5.6.0 (#273) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 5.5.0 to 5.6.0 (#268) by @dependabot
* build(deps-dev): bump @types/node from 16.11.11 to 16.11.12 (#267) by @dependabot
* build(deps-dev): bump eslint from 8.3.0 to 8.4.1 (#266) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 5.5.0 to 5.6.0 (#265) by @dependabot
* build(deps-dev): bump ts-jest from 27.0.7 to 27.1.0 (#264) by @dependabot
* build(deps): bump @types/aws-lambda from 8.10.85 to 8.10.86 (#263) by @dependabot
* build(deps): bump romeovs/lcov-reporter-action from 0.2.21 to 0.3.1 (#261) by @dependabot
* build(deps-dev): bump @types/jest from 27.0.2 to 27.0.3 (#258) by @dependabot
* build(deps-dev): bump @types/node from 16.11.6 to 16.11.11 (#257) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.33.0 to 5.5.0 (#256) by @dependabot
* build(deps-dev): bump @types/lodash from 4.14.175 to 4.14.177 (#255) by @dependabot
* build(deps): bump @types/aws-lambda from 8.10.84 to 8.10.85 (#252) by @dependabot
* build(deps-dev): bump jest from 27.3.1 to 27.4.3 (#251) by @dependabot
* build(deps-dev): bump husky from 7.0.2 to 7.0.4 (#243) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.33.0 to 5.5.0 (#253) by @dependabot
* build(deps-dev): bump eslint from 8.1.0 to 8.3.0 (#254) by @dependabot
* build(deps-dev): bump typescript from 4.4.3 to 4.5.2 (#245) by @dependabot
* build(deps-dev): bump ts-node from 10.3.0 to 10.4.0 (#242) by @dependabot
* build(deps-dev): bump ts-jest from 27.0.5 to 27.0.7 (#234) by @dependabot
* build(deps-dev): bump @commitlint/cli from 13.2.1 to 15.0.0 (#244) by @dependabot
* build(deps-dev): bump jest from 27.2.5 to 27.3.1 (#235) by @dependabot
* build(deps-dev): bump eslint from 7.32.0 to 8.1.0 (#239) by @dependabot
* build(deps-dev): bump @types/node from 16.10.3 to 16.11.6 (#240) by @dependabot
* build(deps-dev): bump ts-node from 10.2.1 to 10.3.0 (#226) by @dependabot
* build(deps-dev): bump jest from 27.2.4 to 27.2.5 (#225) by @dependabot
* build(deps-dev): bump @types/aws-lambda from 8.10.83 to 8.10.84 (#223) by @dependabot
* build(deps-dev): bump @commitlint/cli from 13.2.0 to 13.2.1 (#222) by @dependabot
* build(deps-dev): bump jest from 27.2.2 to 27.2.4 (#217) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.32.0 to 4.33.0 (#219) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.32.0 to 4.33.0 (#220) by @dependabot
* build(deps-dev): bump @types/node from 16.10.1 to 16.10.3 (#221) by @dependabot
* build(deps-dev): bump jest from 27.0.6 to 27.2.2 (#212) by @dependabot
* build(deps-dev): bump ts-jest from 27.0.4 to 27.0.5 (#181) by @dependabot
* build(deps): bump actions/github-script from 4.1 to 5 (#211) by @dependabot
* build(deps-dev): bump typescript from 4.3.5 to 4.4.3 (#199) by @dependabot
* build(deps-dev): bump @types/node from 16.9.6 to 16.10.1 (#213) by @dependabot
* build(deps-dev): bump @types/lodash from 4.14.173 to 4.14.174 (#214) by @dependabot
* build(deps-dev): bump @types/node from 16.9.4 to 16.9.6 (#210) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.30.0 to 4.31.2 (#209) by @dependabot
* build(deps-dev): bump @types/jest from 27.0.1 to 27.0.2 (#208) by @dependabot
* build(deps-dev): bump @types/node from 16.9.2 to 16.9.4 (#205) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.31.1 to 4.31.2 (#206) by @dependabot
* build(deps-dev): bump @types/node from 16.9.1 to 16.9.2 (#204) by @dependabot
* build(deps-dev): bump @types/lodash from 4.14.172 to 4.14.173 (#203) by @dependabot
* build(deps-dev): bump @types/node from 16.7.2 to 16.9.1 (#202) by @dependabot
* build(deps-dev): bump husky from 7.0.1 to 7.0.2 (#191) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.29.2 to 4.31.1 (#200) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.29.2 to 4.30.0 (#194) by @dependabot
* build(deps-dev): bump @types/node from 16.6.2 to 16.7.2 (#190) by @dependabot
* build(deps): bump actions/github-script from 4.0.2 to 4.1 (#187) by @dependabot
* build(deps-dev): bump @types/aws-lambda from 8.10.82 to 8.10.83 (#186) by @dependabot
* build(deps): bump actions/github-script from 3.1.0 to 4.0.2 (#179) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.29.1 to 4.29.2 (#180) by @dependabot
* build(deps-dev): bump @types/node from 16.6.1 to 16.6.2 (#184) by @dependabot
* build(deps-dev): bump ts-node from 10.2.0 to 10.2.1 (#183) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.29.1 to 4.29.2 (#182) by @dependabot
* build(deps-dev): bump @types/jest from 27.0.0 to 27.0.1 (#177) by @dependabot
* build(deps-dev): bump @types/node from 16.6.0 to 16.6.1 (#176) by @dependabot
* build(deps-dev): bump @types/node from 16.4.13 to 16.6.0 (#174) by @dependabot
* build(deps-dev): bump @commitlint/cli from 12.1.4 to 13.1.0 (#172) by @dependabot
* build(deps-dev): bump @types/jest from 26.0.24 to 27.0.0 (#171) by @dependabot
* build(deps-dev): bump @types/aws-lambda from 8.10.81 to 8.10.82 (#170) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.29.0 to 4.29.1 (#167) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.29.0 to 4.29.1 (#166) by @dependabot
* improv: Use lodash.merge & lodash.clonedeed instead of full lodash in Logger (#159) by @dreamorosi
* build(deps-dev): bump ts-node from 10.1.0 to 10.2.0 (#164) by @dependabot
* build(deps-dev): bump @types/node from 16.4.10 to 16.4.13 (#162) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.28.5 to 4.29.0 (#156) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.5 to 4.29.0 (#157) by @dependabot
* build(deps-dev): bump @types/lodash from 4.14.171 to 4.14.172 (#158) by @dependabot
* build(deps-dev): bump eslint from 7.31.0 to 7.32.0 (#155) by @dependabot
* build(deps-dev): bump @types/node from 16.4.7 to 16.4.10 (#154) by @dependabot
* build(deps-dev): bump @types/node from 16.4.6 to 16.4.7 (#150) by @dependabot
* build(deps-dev): bump @types/node from 16.4.5 to 16.4.6 (#148) by @dependabot
* build(deps-dev): bump @types/node from 16.4.3 to 16.4.5 (#145) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.4 to 4.28.5 (#138) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.28.4 to 4.28.5 (#137) by @dependabot
* build(deps-dev): bump @types/aws-lambda from 8.10.80 to 8.10.81 (#135) by @dependabot
* build(deps-dev): bump @types/node from 16.4.1 to 16.4.3 (#134) by @dependabot
* build(deps-dev): bump @types/node from 16.4.0 to 16.4.1 (#132) by @dependabot
* build(deps-dev): bump @types/aws-lambda from 8.10.79 to 8.10.80 (#128) by @dependabot
* build(deps-dev): bump ts-jest from 27.0.3 to 27.0.4 (#127) by @dependabot
* build(deps-dev): bump @types/node from 16.3.3 to 16.4.0 (#124) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.3 to 4.28.4 (#122) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.28.3 to 4.28.4 (#123) by @dependabot
* build(deps-dev): bump eslint from 7.30.0 to 7.31.0 (#118) by @dependabot
* build(deps-dev): bump @types/node from 16.3.2 to 16.3.3 (#119) by @dependabot
* build(deps-dev): bump @types/aws-lambda from 8.10.78 to 8.10.79 (#114) by @dependabot
* build(deps-dev): bump @types/node from 16.0.0 to 16.3.2 (#113) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.2 to 4.28.3 (#112) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.28.2 to 4.28.3 (#111) by @dependabot
* build(deps-dev): bump ts-node from 10.0.0 to 10.1.0 (#110) by @dependabot
* build(deps-dev): bump @types/lodash from 4.14.170 to 4.14.171 (#105) by @dependabot
* build(deps-dev): bump @types/jest from 26.0.23 to 26.0.24 (#104) by @dependabot
* build(deps-dev): bump @types/aws-lambda from 8.10.77 to 8.10.78 (#103) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.1 to 4.28.2 (#100) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.28.1 to 4.28.2 (#101) by @dependabot
* build(deps-dev): bump @types/node from 15.14.0 to 16.0.0 (#98) by @dependabot
* build(deps-dev): bump eslint from 7.29.0 to 7.30.0 (#99) by @dependabot
* build(deps-dev): bump typescript from 4.3.4 to 4.3.5 (#97) by @dependabot
* build(deps-dev): bump @types/node from 15.12.3 to 15.14.0 (#96) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.27.0 to 4.28.1 (#94) by @dependabot
* build(deps-dev): bump eslint from 7.28.0 to 7.29.0 (#86) by @dependabot
* build(deps-dev): bump @types/node from 15.12.3 to 15.12.5 (#92) by @dependabot
* build(deps-dev): bump jest from 27.0.4 to 27.0.6 (#93) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.27.0 to 4.28.1 (#95) by @dependabot
* build(deps-dev): bump typescript from 4.3.2 to 4.3.4 (#84) by @dependabot
* build(deps-dev): bump @types/node from 15.12.2 to 15.12.3 (#85) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.26.1 to 4.27.0 (#81) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.26.1 to 4.27.0 (#82) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.26.0 to 4.26.1 (#80) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.26.0 to 4.26.1 (#78) by @dependabot
* build(deps-dev): bump @types/node from 15.12.1 to 15.12.2 (#79) by @dependabot
* build(deps-dev): bump jest from 26.6.3 to 27.0.4 (#73) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.25.0 to 4.26.0 (#69) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.25.0 to 4.26.0 (#68) by @dependabot
* build(deps-dev): bump typescript from 4.2.4 to 4.3.2 (#66) by @dependabot
* build(deps-dev): bump @types/node from 15.3.1 to 15.6.1 (#61) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.24.0 to 4.25.0 (#62) by @dependabot
* build(deps-dev): bump @types/lodash from 4.14.169 to 4.14.170 (#60) by @dependabot
* build(deps-dev): bump ts-node from 9.1.1 to 10.0.0 (#58) by @dependabot
* build(deps-dev): bump eslint from 7.26.0 to 7.27.0 (#57) by @dependabot
* build(deps-dev): bump @types/node from 15.3.0 to 15.3.1 (#56) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.23.0 to 4.24.0 (#55) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.23.0 to 4.24.0 (#54) by @dependabot
* build(deps-dev): bump @types/node from 15.0.3 to 15.3.0 (#53) by @dependabot
* build(deps-dev): bump @types/node from 14.14.37 to 15.0.3 (#50) by @dependabot
* build(deps-dev): bump lerna from 3.22.1 to 4.0.0 (#29) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.21.0 to 4.22.0 (#37) by @dependabot
* build(deps-dev): bump eslint from 7.23.0 to 7.24.0 (#35) by @dependabot
* build(deps): bump romeovs/lcov-reporter-action from v0.2.11 to v0.2.21 (#34) by @dependabot
* build(deps-dev): bump @commitlint/cli from 11.0.0 to 12.1.1 (#33) by @dependabot
* build(deps-dev): bump @types/aws-lambda from 8.10.72 to 8.10.75 (#32) by @dependabot
* build(deps-dev): bump @types/node from 14.14.20 to 14.14.37 (#31) by @dependabot
* build(deps-dev): bump husky from 4.3.7 to 6.0.0 (#30) by @dependabot
* build(deps-dev): bump typescript from 4.1.3 to 4.2.4 (#28) by @dependabot
* build(deps-dev): bump ts-jest from 26.4.4 to 26.5.4 (#27) by @dependabot
* build(deps-dev): bump eslint from 7.17.0 to 7.23.0 (#21) by @dependabot
* build(deps-dev): bump @types/jest from 26.0.20 to 26.0.22 (#22) by @dependabot
* build(deps-dev): bump @typescript-eslint/parser from 4.13.0 to 4.21.0 (#20) by @dependabot
* build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.13.0 to 4.21.0 (#18) by @dependabot
* build(deps-dev): bump @commitlint/config-conventional from 11.0.0 to 12.1.1 (#19) by @dependabot
* docs: updating readme and package.json to work with lerna (#11) by @alan-churley
* chore: lerna downstream dependancy security issues (#15) by @alan-churley
* build(deps): bump ini from 1.3.5 to 1.3.8 (#5) by @dependabot
* build(deps): bump ini from 1.3.5 to 1.3.8 in /packages/logging (#4) by @dependabot
* build(deps): bump ini from 1.3.5 to 1.3.8 in /docs (#3) by @dependabot

### Contributor List

@alan-churley, @bahrmichael, @dreamorosi, @flochaz, @heitorlessa, @ijemmy and @saragerion
