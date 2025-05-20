# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [2.20.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.19.1...v2.20.0) (2025-05-20)

**Note:** Version bump only for package code-snippets





## [2.19.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.19.0...v2.19.1) (2025-05-05)

**Note:** Version bump only for package code-snippets





# [2.19.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.18.0...v2.19.0) (2025-04-24)


### Features

* **event-handler:** AppSync Events resolver ([#3858](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3858)) ([01f8a68](https://github.com/aws-powertools/powertools-lambda-typescript/commit/01f8a687a0c033cdc5d55c50bc7e6d0566f485cb))





# [2.18.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.17.0...v2.18.0) (2025-04-07)

**Note:** Version bump only for package code-snippets





# [2.17.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.16.0...v2.17.0) (2025-03-25)


### Bug Fixes

* **logger:** correctly refresh sample rate ([#3722](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3722)) ([2692ca4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2692ca4d1b15763936659b05e1830d998a4d2020))
* **parser:** ddb base schema + other exports ([#3741](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3741)) ([51a3410](https://github.com/aws-powertools/powertools-lambda-typescript/commit/51a3410be8502496362d5ed13a64fe55691604ba))


### Features

* **logger:** set correlation ID in logs ([#3726](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3726)) ([aa74fc8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/aa74fc8548ccb8cb313ffd1742184c66e8d6c22c))
* **metrics:** allow setting functionName via constructor parameter and environment variable ([#3696](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3696)) ([3176fa0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3176fa08e1886d5c86e7b327134cc988b82cf8d8))





# [2.16.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.15.0...v2.16.0) (2025-03-07)


### Features

* **logger:** refresh sample rate calculation before each invocation ([#3672](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3672)) ([8c8d6b2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8c8d6b2ea4ccd473f56b05913169cc5995765562))





# [2.15.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.14.0...v2.15.0) (2025-02-25)


### Features

* **logger:** refresh sample rate calculation per invocation ([#3644](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3644)) ([1d66a2a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1d66a2a0d0af36d6c8aa86b0c559f8489fe9ef77))





# [2.14.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.13.1...v2.14.0) (2025-02-10)

**Note:** Version bump only for package code-snippets





## [2.13.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.13.0...v2.13.1) (2025-01-28)

**Note:** Version bump only for package code-snippets





# [2.13.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.12.0...v2.13.0) (2025-01-14)


### Features

* **parser:** `DynamoDBMarshalled` helper to parse DynamoDB data structure ([#3442](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3442)) ([e154e58](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e154e58986187d8210d18f6ca79d8b710d87d600))





# [2.12.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.11.0...v2.12.0) (2024-12-17)

**Note:** Version bump only for package code-snippets





# [2.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.10.0...v2.11.0) (2024-11-20)


### Features

* **batch:** Async Processing of Records for for SQS Fifo ([#3160](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3160)) ([e73b575](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e73b575b784b7a59ca8cde02d4ca51ec97789d19))
* **metrics:** ability to set custom timestamp with `setTimestamp` for metrics ([#3310](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3310)) ([0fb94c3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0fb94c38cbead6333ff4a17354c81ce73fe51afd))





# [2.10.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.9.0...v2.10.0) (2024-10-22)

**Note:** Version bump only for package code-snippets





# [2.9.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.8.0...v2.9.0) (2024-10-07)


### Features

* **batch:** sequential async processing of records for `BatchProcessor` ([#3109](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3109)) ([e31279a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e31279af90446050a7974fbe25c34758f64915f9))
* **idempotency:** ability to specify JMESPath custom functions ([#3150](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3150)) ([869b6fc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/869b6fced659ad820ffe79a0b905022061570974))
* **idempotency:** manipulate idempotent response via response hook ([#3071](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3071)) ([f7c1769](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f7c176901a36698f591d897c2abde54cf30c9ea9))





# [2.8.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.7.0...v2.8.0) (2024-09-16)


### Features

* **logger:** introduce log key reordering functionality ([#2736](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2736)) ([9677258](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9677258f3c872400fca89b625760b7a45f923212))
* **parameters:** adds setParameter function to store SSM parameters ([#3020](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3020)) ([8fd5479](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8fd5479c6da2d60921df92fe7e5e72a0e03d5745))





# [2.7.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.6.0...v2.7.0) (2024-08-08)


### Features

* **parser:** add helper function to handle JSON stringified fields ([#2901](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2901)) ([806b884](https://github.com/aws-powertools/powertools-lambda-typescript/commit/806b884f51684fa4654d357fafdf8ebeda4de01b))





# [2.6.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.5.0...v2.6.0) (2024-07-25)

**Note:** Version bump only for package code-snippets





# [2.5.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.4.0...v2.5.0) (2024-07-15)


### Features

* **logger:** custom function for unserializable values (JSON replacer)  ([#2739](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2739)) ([fbc8688](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fbc86889f88203945a4201c6a6c403b3a257d54f))





# [2.4.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.3.0...v2.4.0) (2024-07-10)


### Features

* **batch:** add option to not throw `FullBatchFailureError` when the entire batch fails ([#2711](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2711)) ([74198ef](https://github.com/aws-powertools/powertools-lambda-typescript/commit/74198ef1ec1d11267813d2f4b6dd5f4c5692f7d4))
* **logger:** time zone aware timestamp in Logger ([#2710](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2710)) ([9fe4c75](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9fe4c754960a07aad008ff4ada63cf68aa9ba89a))





# [2.3.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.2.0...v2.3.0) (2024-06-27)

**Note:** Version bump only for package code-snippets





# [2.2.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.1.1...v2.2.0) (2024-06-13)


### Features

* **batch:** add option to continue processing other group IDs on failure in `SqsFifoPartialProcessor` ([#2590](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2590)) ([a615c24](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a615c24108c4653be4c62d8488092fc08a4a3cc3))





## [2.1.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.1.0...v2.1.1) (2024-05-14)

**Note:** Version bump only for package code-snippets





# [2.1.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v2.0.4...v2.1.0) (2024-04-17)


### Features

* **idempotency:** add custom JMESPath functions ([#2364](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2364)) ([9721e7c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9721e7c01fc010944eb477bdbc24b9e06a5c4571))





## 2.0.4 (2024-04-10)

**Note:** Version bump only for package docs





## 2.0.3 (2024-03-15)

**Note:** Version bump only for package docs





## 2.0.2 (2024-03-05)

**Note:** Version bump only for package docs





## 2.0.1 (2024-03-04)

**Note:** Version bump only for package docs





# [2.0.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.18.1...v2.0.0) (2024-03-04)

**Note:** Version bump only for package docs
