# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.1.0 (2024-04-17)

### Features

**idempotency** add custom JMESPath functions ([#1298](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1298)) ([9721e7c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9721e7c01fc010944eb477bdbc24b9e06a5c4571))

## 2.0.4 (2024-04-10)

### Bug Fixes

**idempotency:** return correct value from in-memory cache ([#2309](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2309)) ([5b4c103](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b908aa1111d332fcf3638a77f24a545b85b4c103))

## 2.0.3 (2024-03-15)

**fix:** transform private class fields ([#2230](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2230)) ([aa6e6e0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/aa6e6e0c25bbc93151cc5cddc584400575604f05))

## 2.0.2 (2024-03-05)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency





## 2.0.1 (2024-03-04)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency





# [2.0.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.18.1...v2.0.0) (2024-03-04)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency





## 1.18.1 (2024-02-20)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency





## [1.18.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.17.0...v1.18.0) (2024-01-26)

### Features

- **idempotency:** leverage new DynamoDB failed conditional writes ([#1779](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1779)) ([1917ec6](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1917ec6b48df17de3126a1b8b1d008295e60f4ef))

## [1.17.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.16.0...v1.17.0) (2023-11-24)

**maintenance:** drop support for Node.js 14 ([#1664](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1664)) ([e2a0923](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e2a09232f86167b5208be2daf892aa1ea433ce0f))

# [1.16.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.15.0...v1.16.0) (2023-11-16)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency

# [1.15.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.2...v1.15.0) (2023-11-14)

### Features

- **maintenance:** add support for nodejs20.x runtime ([#1790](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1790)) ([6b9b1bc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6b9b1bcb9baf4b3d8e0e5ec6709594aca09bb033))

## [1.14.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.1...v1.14.2) (2023-11-03)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency

## [1.14.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.0...v1.14.1) (2023-10-31)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency

# [1.14.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.13.1...v1.14.0) (2023-09-29)

### Features

- **idempotency:** add idempotency decorator ([#1723](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1723)) ([d138673](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d138673a33ff31f40b225dc046b2ff8258d0a97d))
- **layers:** add `arm64` to integration test matrix ([#1720](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1720)) ([61ad5ac](https://github.com/aws-powertools/powertools-lambda-typescript/commit/61ad5ac3bcf7742684aeec28553ec294696f3301))

## [1.13.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.13.0...v1.13.1) (2023-09-21)

### Bug Fixes

- **maintenance:** remove upper peer dependency Middy ([#1705](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1705)) ([df21ec8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/df21ec8761b1be511c13c28fedd41bf0e2851061))

# [1.13.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.12.1...v1.13.0) (2023-09-18)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency

## [1.12.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.12.0...v1.12.1) (2023-07-25)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency

# [1.12.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.11.1...v1.12.0) (2023-07-25)

**Note:** Version bump only for package @aws-lambda-powertools/idempotency

## [1.11.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.11.0...v1.11.1) (2023-07-11)

### Bug Fixes

- **idempotency:** types, docs, and `makeIdempotent` function wrapper ([#1579](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1579)) ([bba1c01](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bba1c01a0b3f08e962568e1d0eb44d486829657b))

# [1.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.10.0...v1.11.0) (2023-06-29)

### Features

- **idempotency:** preserve original error when wrapping into `IdempotencyPersistenceLayerError` ([#1552](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1552)) ([866837d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/866837daf34563698709612351c45769e02daf16))

# [1.10.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.9.0...v1.10.0) (2023-06-23)

### Bug Fixes

- **idempotency:** pass lambda context remaining time to save inprogress ([#1540](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1540)) ([d47c3ec](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d47c3ec64d926d49f3799f361d54a11627d16cc1))
- **idempotency:** record validation not using hash ([#1502](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1502)) ([f475bd0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f475bd097b64f009c329c023a2dd7c7e9371270a))
- **idempotency:** skip persistence for optional idempotency key ([#1507](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1507)) ([b9fcef6](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b9fcef66eb4bd9a7ad1eeac5f5db2cdbccc70c71))
