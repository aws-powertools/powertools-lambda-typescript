# Change Log

## [2.28.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.28.0...v2.28.1) (2025-10-23)

**Note:** Version bump only for this package

## [2.28.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.27.0...v2.28.0) (2025-10-21)

### Improvements

- ended response stream when body is null ([#4651](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4651)) ([a37a317](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a37a3173023439ee67cc328753cb2d292dc3854f))
- rename ServiceError class to HttpError ([#4610](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4610)) ([33f7334](https://github.com/aws-powertools/powertools-lambda-typescript/commit/33f733471a54d528514e7bebcd863edc4e3781a9))

### Bug Fixes

- allow http handlers to return duplex streams ([#4629](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4629)) ([f46ae7c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f46ae7c4b73a428b3a9aeb7e8858adede73637ed))

### Features

- Add `includeRouter` support to AppSync GraphQL resolver ([#4457](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4457)) ([ada48bb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ada48bbc20b61454586bbd853ee330800b6000d2))
- added support for catch all route ([#4582](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4582)) ([19786bf](https://github.com/aws-powertools/powertools-lambda-typescript/commit/19786bf82019eaf29f35830c029f60f8c5e9573d))
- add streaming functionality ([#4586](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4586)) ([e321526](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e3215263e369acb581e113f08aa3893a170d0cb9))
- added `includeRouter` method to split routes ([#4573](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4573)) ([38b6e82](https://github.com/aws-powertools/powertools-lambda-typescript/commit/38b6e82a0d9f4f46bb5253ba5157487bbbb884df))
## [2.27.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.26.1...v2.27.0) (2025-09-24)

### Improvements

- rename HttpErrorCodes to HttpStatusCodes ([#4543](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4543)) ([e53aa88](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e53aa8816325f21510706e3f9e62fb0a76692915))
- made error handler responses versatile ([#4536](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4536)) ([f08b366](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f08b366b79152d338ebefb5a25caacade6846919))
- changed path parameter in middleware and routehandler signature ([#4532](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4532)) ([278fca0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/278fca0491ce9cb955326523557c3ddf9d03dbc5))
- change the Middleware and RequestContext signatures ([#4530](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4530)) ([a05c074](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a05c07411629d1e23a9cb3fec8a78cf23bd8dd0c))

### Bug Fixes

- fixed CORS behaviour not aligned with CORS spec   ([#4512](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4512)) ([dd368fa](https://github.com/aws-powertools/powertools-lambda-typescript/commit/dd368fa3eb08a86c2d5aad3cf9b832d7a8288486))
- run global middleware on all requests for REST API ([#4507](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4507)) ([49d5f8a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/49d5f8a4f36a5af26c573f7706347f34ec70689e))

### Features

- implemented route prefixes in HTTP event handler ([#4523](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4523)) ([8913854](https://github.com/aws-powertools/powertools-lambda-typescript/commit/89138542cd9e195555299f401646ae94d0bb50ee))
- throw error when middleware does not await next() ([#4511](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4511)) ([b0b43e8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b0b43e862fb189941fe9db220580884e7707d541))
- add CORS middleware support ([#4477](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4477)) ([972cd1f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/972cd1f86b6ea01c93abef5e6cde7876360196f1))
- added compress middleware for the REST API event handler ([#4495](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4495)) ([320e0dc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/320e0dcaa07476de3b7d07209ef27379b9d4900a))
## [2.26.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.26.0...v2.26.1) (2025-09-15)

**Note:** Version bump only for this package

## [2.26.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.25.2...v2.26.0) (2025-09-11)

### Features

- remove undefined from Router's resolve type signature ([#4463](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4463)) ([d36ef55](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d36ef5569de910e467f7c6d6b1d518112a998d40))
- implement mechanism to manipulate response in middleware ([#4439](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4439)) ([35a510d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/35a510d3f3191b479105238f5f956bfeeb519389))
- add route specific middleware registration and execution ([#4437](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4437)) ([e6ea674](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e6ea674b97953d0391573ea6536f9eb5f02f659b))
- add middleware registration and composition to rest handler ([#4428](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4428)) ([fc87eb3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fc87eb3f5c05a31002becf30e22928c8d7913a3f))
- add support for error handling in AppSync GraphQL ([#4317](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4317)) ([77a992f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/77a992ff39ed41da2c965bc86d65a326f4db21d6))
- add resolution logic to base router ([#4349](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4349)) ([f1ecc6d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f1ecc6da353ed1d4a1a943a4b75dc3e2b50d8e5e))

### Maintenance

- rename variables to reflect that options object is now a RequestContext ([#4460](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4460)) ([5b4ee1a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5b4ee1ac77c4ebf0af6181f56a47340173306673))
- expose rest handler functionality ([#4458](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4458)) ([23eddfd](https://github.com/aws-powertools/powertools-lambda-typescript/commit/23eddfdd2f3ec0824dccd080824628c63ed8308c))
- split Router tests into multiple files ([#4449](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4449)) ([91a1ec4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/91a1ec4c4765e814b67f669ed2ff77c674cc3155))
- rename BaseRouter class to Router ([#4448](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4448)) ([b043c28](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b043c28820b18e2d518153992f4f3243d476e208))

### Bug Fixes

- handle nullable fields in APIGatewayProxyEvent ([#4455](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4455)) ([200f47b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/200f47b0c9e3864b2732d93ca50dd65323b109fb))
## [2.25.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.25.1...v2.25.2) (2025-08-26)

### Features

- add function to convert Lambda proxy event to web response object ([#4343](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4343)) ([6277e0d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6277e0d0f4dbc2f9dfa0011dd16e52bb96ce3f59))

### Bug Fixes

- pass event, context and request objects into handler ([#4329](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4329)) ([ea0e615](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ea0e61583cc2c06672dfb136c436c5a31764a0e6))
## [2.25.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.25.0...v2.25.1) (2025-08-14)

### Features

- add decorator functionality for error handlers ([#4323](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4323)) ([562747a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/562747a4c415ea2225529e5e276269e87c7b08b9))
- add error handling functionality to BaseRouter ([#4316](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4316)) ([5aff398](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5aff3984359a5a4f4408a5d286d3c36976d454fa))
## [2.25.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.24.1...v2.25.0) (2025-08-12)

### Features

- add event handler registry ([#4307](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4307)) ([aaac429](https://github.com/aws-powertools/powertools-lambda-typescript/commit/aaac4295594bc4b9c241fcf7bd8589ebc8b68d68))
- add error classes for http errors ([#4299](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4299)) ([c1c3dd5](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c1c3dd50f5c335f2fd8a13cfd95340971d8840a1))
- implement route matching & resolution system for rest handler ([#4297](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4297)) ([b8ca368](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b8ca36841f710db062b726ca8d53876e2291e92d))
- add support for AppSync GraphQL batch resolvers ([#4218](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4218)) ([12ac2e4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/12ac2e40dfe63764f62670ea288e556f7302d2aa))
## [2.24.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.24.0...v2.24.1) (2025-07-29)

### Improvements

- replace EnvironmentVariablesService class with helper functions in Event Handler ([#4225](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4225)) ([d17818e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d17818e1b8b17a8307e61966ab857f9c05c49670))

### Features

- add route management system for ApiGw event handler ([#4211](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4211)) ([c2cbb64](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c2cbb642ca3a4cc57ad0e80d9f1239e8f67d56e3))
- add base router class ([#3972](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3972)) ([3d4998c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3d4998cda6c1b8c1bea47d5c6a9fe760b6e957fb))
## [2.24.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.23.0...v2.24.0) (2025-07-15)

**Note:** Version bump only for this package

# [2.23.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.22.0...v2.23.0) (2025-07-02)

### Features

* **event-handler:** add single resolver functionality for AppSync GraphQL API ([#3999](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3999)) ([b91383f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b91383f6ec82cff9196ccc4e0c9e88d285eb567d))
* **event-handler:** expose event & context as object ([#4113](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4113)) ([7e74c9e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7e74c9e356d97372c4f1ee5ca83d16dfefea42f4))
* **event-handler:** support `onQuery` and `onMutation` handlers ([#4111](https://github.com/aws-powertools/powertools-lambda-typescript/issues/4111)) ([263db2d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/263db2d74e558adb9b088174a5500de6c29488d0))

# [2.22.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.21.0...v2.22.0) (2025-06-20)

### Bug Fixes

* **event-handler:** fix decorated scope in appsync events ([#3974](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3974)) ([e539719](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e5397199133da265f593c5feed0178c0ebe1e7c2))

# [2.21.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.20.0...v2.21.0) (2025-06-03)

### Features

* **event-handler:** add Amazon Bedrock Agents Functions Resolver ([#3957](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3957)) ([720ddcb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/720ddcb974bd044fccd54d4cf5e46a1576f487a7))

# [2.20.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.19.1...v2.20.0) (2025-05-20)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

## [2.19.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.19.0...v2.19.1) (2025-05-05)

### Bug Fixes

* **event-handler:** ignore return type from onSubscribe handler ([#3888](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3888)) ([02b3cda](https://github.com/aws-powertools/powertools-lambda-typescript/commit/02b3cda9fd10c4e757dee321749d484c9ac542ee))

# [2.19.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.18.0...v2.19.0) (2025-04-24)

### Features

* **event-handler:** AppSync Events resolver ([#3858](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3858)) ([01f8a68](https://github.com/aws-powertools/powertools-lambda-typescript/commit/01f8a687a0c033cdc5d55c50bc7e6d0566f485cb))

# [2.18.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.17.0...v2.18.0) (2025-04-07)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.17.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.16.0...v2.17.0) (2025-03-25)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.16.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.15.0...v2.16.0) (2025-03-07)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.15.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.14.0...v2.15.0) (2025-02-25)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.14.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.13.1...v2.14.0) (2025-02-10)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

## [2.13.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.13.0...v2.13.1) (2025-01-28)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.13.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.12.0...v2.13.0) (2025-01-14)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.12.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.11.0...v2.12.0) (2024-12-17)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.10.0...v2.11.0) (2024-11-20)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.10.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.9.0...v2.10.0) (2024-10-22)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.9.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.8.0...v2.9.0) (2024-10-07)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.8.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.7.0...v2.8.0) (2024-09-16)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler

# [2.7.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.6.0...v2.7.0) (2024-08-08)

**Note:** Version bump only for package @aws-lambda-powertools/event-handler
