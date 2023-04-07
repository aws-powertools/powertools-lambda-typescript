# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.8.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.7.0...v1.8.0) (2023-04-07)


### Bug Fixes

* **parameters:** type import path in AppConfigProvider ([#1388](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1388)) ([40a1a24](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/40a1a24de50ee086f76ab9c78d5fc03e5e7945cf))


### Features

* **parameters:** ability to set `maxAge` and `decrypt` via environment variables ([#1384](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1384)) ([dcf6620](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/dcf6620f55004b69186cd69b0c42b1cdd9fd1ce4))
* **parameters:** add `clearCaches` function ([#1382](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1382)) ([ec49023](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/ec49023c44c3873ba5396a45ee9b2a8ee031e84b))
* **parameters:** stronger types for SSM getParameter ([#1387](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1387)) ([9d53942](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/9d53942fdd272213cf39c7fa87ffa78513dff37d))





# [1.7.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.6.0...v1.7.0) (2023-03-20)


### Features

* **parameters:** AppConfigProvider to return the last valid value when the API returns empty value on subsequent calls ([#1365](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1365)) ([97339d9](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/97339d9336ec67568e9e7fd079b3cfe006da1bba))
