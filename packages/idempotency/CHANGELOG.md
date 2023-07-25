# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
