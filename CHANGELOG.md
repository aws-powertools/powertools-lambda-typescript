# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 2.1.0 (2024-04-17)

### Bug Fixes

**jmespath** refactor custom function introspection to work with minification ([#2383](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2383)) ([21ecc4f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/21ecc4f736ccba85c276889163860a98613174cc))

### Features

**idempotency** add custom JMESPath functions ([#1298](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1298)) ([9721e7c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9721e7c01fc010944eb477bdbc24b9e06a5c4571))
**parser** release utility beta ([#2366](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2366)) ([8145bc1](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8145bc10d6e34098938771cbdcc9d4981e26cd2d))

### Minor Changes

**jmespath** rename jmespath parsing options type ([#2369](https://github.com/aws-powertools/powertools-lambda-typescript/issues/2369)) ([48bb9a7](https://github.com/aws-powertools/powertools-lambda-typescript/commit/48bb9a71f8be950bb25468be6495bb2d1e7f87e2))

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

- **logger:** add support for `AWS_LAMBDA_LOG_LEVEL` and `POWERTOOLS_LOG_LEVEL` ([#1795](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1795)) ([e69abfb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e69abfb5f1b5d3bf993ac2fe66fae85a85af9905))

# [1.15.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.2...v1.15.0) (2023-11-14)

### Features

- **maintenance:** add support for nodejs20.x runtime ([#1790](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1790)) ([6b9b1bc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6b9b1bcb9baf4b3d8e0e5ec6709594aca09bb033))
- **metrics:** log directly to stdout ([#1786](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1786)) ([75dc5b1](https://github.com/aws-powertools/powertools-lambda-typescript/commit/75dc5b1e16944416a287628c50ec4a0cf82c3023))

## [1.14.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.1...v1.14.2) (2023-11-03)

### Bug Fixes

- **metrics:** deduplicate dimensions when serialising ([#1780](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1780)) ([8181b48](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8181b481ba96fa7a91959ff2d40bdedfe80b451b))

## [1.14.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.14.0...v1.14.1) (2023-10-31)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [1.14.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.13.1...v1.14.0) (2023-09-29)

### Features

- **idempotency:** add idempotency decorator ([#1723](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1723)) ([d138673](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d138673a33ff31f40b225dc046b2ff8258d0a97d))
- **layers:** add `arm64` to integration test matrix ([#1720](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1720)) ([61ad5ac](https://github.com/aws-powertools/powertools-lambda-typescript/commit/61ad5ac3bcf7742684aeec28553ec294696f3301))
- **tracer:** add try/catch logic to decorator and middleware close ([#1716](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1716)) ([be16b59](https://github.com/aws-powertools/powertools-lambda-typescript/commit/be16b599b8023f95572234fb222ea70aea5b3f17))

## [1.13.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.13.0...v1.13.1) (2023-09-21)

### Bug Fixes

- **maintenance:** remove upper peer dependency Middy ([#1705](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1705)) ([df21ec8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/df21ec8761b1be511c13c28fedd41bf0e2851061))

# [1.13.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.12.1...v1.13.0) (2023-09-18)

### Bug Fixes

- **batch:** Update processor to pass only context to handler ([#1637](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1637)) ([6fa09b2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6fa09b2638bf247fd595db51ac3d1aa1252d3379))
- **docs:** update versions.json jq query ([4e6f662](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4e6f662b244a941a911c1ed5973bef11d7610093))
- **parameters:** return type when options without transform is used ([#1671](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1671)) ([b2fe341](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b2fe34150a0d896f1755ca30cbe89175cdb66ff2))

### Features

- **batch:** rename AsyncBatchProcessor to default BatchProcessor ([#1683](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1683)) ([e253755](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e253755d09f50a75cde805168845f52d8b85af28))

## [1.12.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.12.0...v1.12.1) (2023-07-25)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [1.12.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.11.1...v1.12.0) (2023-07-25)

### Features

- **batch:** add batch processing utility ([#1625](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1625)) ([c4e6b19](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c4e6b192c3658cbcc3f458a579a0752153e3c201)), closes [#1588](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1588) [#1591](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1591) [#1593](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1593) [#1592](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1592) [#1594](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1594)
- **logger:** add cause to formatted error ([#1617](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1617)) ([6a14595](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6a145959249db6eeb89fdfe3ed4c6e30ab155f9c))

## [1.11.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.11.0...v1.11.1) (2023-07-11)

### Bug Fixes

- **docs:** fix alias in versions.json ([#1576](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1576)) ([7198cbc](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7198cbca28962e07486b90ecb4f265cafe28bf73))
- **idempotency:** types, docs, and `makeIdempotent` function wrapper ([#1579](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1579)) ([bba1c01](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bba1c01a0b3f08e962568e1d0eb44d486829657b))

# [1.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.10.0...v1.11.0) (2023-06-29)

### Features

- **idempotency:** preserve original error when wrapping into `IdempotencyPersistenceLayerError` ([#1552](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1552)) ([866837d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/866837daf34563698709612351c45769e02daf16))

# [1.10.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.9.0...v1.10.0) (2023-06-23)

### Bug Fixes

- **ci:** change how versions and aliases are inserted into versions.json ([#1549](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1549)) ([9e1d19a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9e1d19a9bc89d31bef851a615860c3b01bd9d77f))
- **idempotency:** pass lambda context remaining time to save inprogress ([#1540](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1540)) ([d47c3ec](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d47c3ec64d926d49f3799f361d54a11627d16cc1))
- **idempotency:** record validation not using hash ([#1502](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1502)) ([f475bd0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f475bd097b64f009c329c023a2dd7c7e9371270a))
- **idempotency:** skip persistence for optional idempotency key ([#1507](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1507)) ([b9fcef6](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b9fcef66eb4bd9a7ad1eeac5f5db2cdbccc70c71))
- **metrics:** flush metrics when data points array reaches max size ([#1548](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1548)) ([24c247c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/24c247c39c0ac29774ac3fcf09902916f3936e1e))
- missing quotes ([67f5f14](https://github.com/aws-powertools/powertools-lambda-typescript/commit/67f5f14e612a56d94923aa3b33df7d2e6b46cc06))
- missing quotes ([349e612](https://github.com/aws-powertools/powertools-lambda-typescript/commit/349e612e1a46646ef05b11e0478094bf7f74a5cd))
- update reference in workflow ([#1518](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1518)) ([9c75f9a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9c75f9a8a0b2fc4b24bbd37fdb00620d06903283))

### Features

- **logger:** clear state when other middlewares return early ([#1544](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1544)) ([d5f3f13](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d5f3f13ccd7aae1bbc59431741e8aaf042dd2a73))
- **metrics:** publish metrics when other middlewares return early ([#1546](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1546)) ([58b0877](https://github.com/aws-powertools/powertools-lambda-typescript/commit/58b087713814f1c5f56a86aa815d04372e98ebd0))
- **parameters:** review types and exports ([#1528](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1528)) ([6f96711](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6f96711625e212898b1c227c651beba7e709c9d1))
- **tracer:** close & restore segments when other middlewares return ([#1545](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1545)) ([74ddb09](https://github.com/aws-powertools/powertools-lambda-typescript/commit/74ddb09a3107d9f45f34ccda1e691a9504578c2d))

# [1.9.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.8.0...v1.9.0) (2023-06-09)

### Features

- **commons:** add `cleanupPowertools` function ([#1473](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1473)) ([5bd0166](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5bd01665699ae2f026d845477e648d325f20a855))
- **idempotency:** `makeHandlerIdempotent` middy middleware ([#1474](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1474)) ([a558f10](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a558f100209978a075e98a8c8a3763c4145c8a94))
- **idempotency:** add package exports ([#1483](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1483)) ([faa9307](https://github.com/aws-powertools/powertools-lambda-typescript/commit/faa9307a4bd42e3acdab5dc68ddd57ab5c61964c))
- **idempotency:** idempotency middleware & types exports ([#1487](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1487)) ([d947db9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d947db9d2f99b7c4da0a3618e967db9e77728805))
- **idempotency:** implement IdempotencyHandler ([#1416](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1416)) ([f2ebf08](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f2ebf08607f5bb41a96f2b713973f4635d9d6f9d))
- **logger:** enhance log level handling ([#1476](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1476)) ([0021536](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0021536e35ba7046226155055f9ab6b5f988f71f))
- **parameters:** add adaptive types to SecretsProvider ([#1411](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1411)) ([5c6d527](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5c6d527b0ad983e893ba07f8a334b4085b6ae6a7))
- **tracer:** add isTraceSampled method ([#1435](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1435)) ([194bbd3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/194bbd366b726a477523225f446add054c20566e))

# [1.8.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.7.0...v1.8.0) (2023-04-07)

### Bug Fixes

- **parameters:** type import path in AppConfigProvider ([#1388](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1388)) ([40a1a24](https://github.com/aws-powertools/powertools-lambda-typescript/commit/40a1a24de50ee086f76ab9c78d5fc03e5e7945cf))

### Features

- **idempotency:** add local cache to `BasePersistenceLayer` ([#1396](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1396)) ([2013ff2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2013ff250afa3f1a26a7610694fe881b232b976f))
- **idempotency:** BasePersistenceLayer, DynamoDBPersistenceLayer and configs ([#1376](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1376)) ([f05cba8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f05cba8802551f160d630d3ef2b7e741f0de9158))
- **logger:** add `CRITICAL` log level ([#1399](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1399)) ([a248ff0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a248ff0a584bac5a97fe300f3addbb9c3a50b555))
- **metrics:** log warning on empty metrics ([#1397](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1397)) ([31ae936](https://github.com/aws-powertools/powertools-lambda-typescript/commit/31ae936831177f58edff43ce3850ed13c964fc87))
- **parameters:** ability to set `maxAge` and `decrypt` via environment variables ([#1384](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1384)) ([dcf6620](https://github.com/aws-powertools/powertools-lambda-typescript/commit/dcf6620f55004b69186cd69b0c42b1cdd9fd1ce4))
- **parameters:** add `clearCaches` function ([#1382](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1382)) ([ec49023](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ec49023c44c3873ba5396a45ee9b2a8ee031e84b))
- **parameters:** stronger types for SSM getParameter ([#1387](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1387)) ([9d53942](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9d53942fdd272213cf39c7fa87ffa78513dff37d))

# [1.7.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.6.0...v1.7.0) (2023-03-20)

### Bug Fixes

- **docs:** typo in layer arn ([bc5f7c9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bc5f7c99e02396223e726962432fc3856a68a29d))

### Features

- **logger:** add silent log level to suppress the emission of all logs ([#1347](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1347)) ([c82939e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c82939ebdb82ae596cbad07be397794ee4b69fe5))
- **metrics:** support high resolution metrics ([#1369](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1369)) ([79a321b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/79a321b199ef51a024dc25b83673baf2eb03de69))
- **parameters:** AppConfigProvider to return the last valid value when the API returns empty value on subsequent calls ([#1365](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1365)) ([97339d9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/97339d9336ec67568e9e7fd079b3cfe006da1bba))

# [1.6.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.5.1...v1.6.0) (2023-03-02)

### Bug Fixes

- **docs:** logger bringYourOwnFormatter snippet [#1253](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1253) ([#1254](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1254)) ([fdbba32](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fdbba32d8b3545730d242ac4fd1ef2d83cdbccce))
- hardcoded cdk version in `publish_layer.yaml` ([#1232](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1232)) ([63a3909](https://github.com/aws-powertools/powertools-lambda-typescript/commit/63a3909063637ca2306a718a10e35e54881f570e))
- **logger:** createChild not passing all parent's attributes ([#1267](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1267)) ([84ab4b9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/84ab4b911d17d687bdbe60ded31f1e2b6860feb3))
- **logger:** middleware stores initial persistent attributes correctly ([#1329](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1329)) ([6b32304](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6b3230489895dc1abdfc6ad56daeeb555fda529f))
- **parameters:** handle base64/binaries in transformer ([#1326](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1326)) ([bb50c04](https://github.com/aws-powertools/powertools-lambda-typescript/commit/bb50c04f5b2e6a144295b453577a7ea1a15ac011))
- **parameters:** Tokenize attribute names in `DynamoDBProvider` ([#1239](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1239)) ([f3e5ed7](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f3e5ed70c7e5baa3f3aa15428e8d6cb56b096f26))

### Features

- **idempotency:** Add function wrapper and decorator ([#1262](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1262)) ([eacb1d9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/eacb1d9f59a82ad34234f51198ed215c41a64b41))
- **layers:** add new regions ([#1322](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1322)) ([618613b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/618613b9a69166553dd9ef8d5b92f89e1cdf79d0))
- **logger:** make loglevel types stricter ([#1313](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1313)) ([5af51d3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5af51d319dee68d7a7ba832721580d7a6e655249))
- **parameters:** add support for custom AWS SDK v3 clients for providers ([#1260](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1260)) ([3a8cfa0](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3a8cfa0d6e5aaa5c2c36d97d7835dbf5287b7110))

## [1.5.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.5.0...v1.5.1) (2023-01-13)

### Bug Fixes

- **logger:** logger throws TypeError when log item has BigInt value ([#1201](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1201)) ([a09e4df](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a09e4dfbb2cef062c1178de3e3dbc2583aef7a91))
- **parameters:** types in BaseProvider + added getMultiple alias to SecretsProvider ([#1214](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1214)) ([32bd7e8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/32bd7e8694fa74a63993eded236af8d84c2dc752))

### Features

- **parameters:** AppConfigProvider ([#1200](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1200)) ([fecedb9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fecedb9e8446a008dca2927ba7aec16d54b34685))
- **parameters:** DynamoDBProvider support ([#1202](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1202)) ([db94850](https://github.com/aws-powertools/powertools-lambda-typescript/commit/db94850b536dc92fcd11ce2a5f68412bed9c1feb))
- **parameters:** SecretsProvider support ([#1206](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1206)) ([02516b7](https://github.com/aws-powertools/powertools-lambda-typescript/commit/02516b7315c3c6df7bed51768381313e7942b215))
- **parameters:** SSMProvider support ([#1187](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1187)) ([2e4bb76](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2e4bb76773222ecbe44ec22633445e06199fc8b1))

# [1.5.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.4.1...v1.5.0) (2022-11-25)

### Bug Fixes

- **logger:** merge child logger options correctly ([#1178](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1178)) ([cb91374](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cb9137436cc3a10d6c869506ddd07e35963ba8b2))

### Features

- **idempotency:** Add persistence layer and DynamoDB implementation ([#1110](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1110)) ([0a6676a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0a6676ac24abdadaaff2d95fc8d75d3a7137a00b))
- **logger:** disable logs while testing with `jest --silent` in dev env ([#1165](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1165)) ([6f0c307](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6f0c30728f31d60433b3afb6983c64110c28d27e))
- **logger:** pretty printing logs in local and non-prod environment ([#1141](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1141)) ([8d52660](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8d52660eb6b8324e284421c2484c45d9a0839346))
- **parameters:** added `BaseProvider` class ([#1168](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1168)) ([d717a26](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d717a26bba086be4c01f1458422662f8bfba09a9))

## [1.4.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.4.0...v1.4.1) (2022-11-09)

### Bug Fixes

- **metrics:** store service name in defaultDimensions to avoid clearing it ([#1146](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1146)) ([a979202](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a979202ae0563f8ce00dee98bbf15d0bcfcfd3cc))

# [1.4.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.3.0...v1.4.0) (2022-10-27)

### Bug Fixes

- **metrics:** metadata and dimensions not cleared on publish ([#1129](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1129)) ([b209c30](https://github.com/aws-powertools/powertools-lambda-typescript/commit/b209c30df92da07875f204f7f211294feea729db))

### Features

- **all:** moved EnvService to commons + exposed getXrayTraceId in tracer ([#1123](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1123)) ([c8e3c15](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c8e3c15b64142ebe6f43835a5917ecba26293a32))

# [1.3.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.2.1...v1.3.0) (2022-10-17)

### Bug Fixes

- **all:** update version command to use lint-fix ([#1119](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1119)) ([6f14fb3](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6f14fb3229882b1dd0c20d18c87a542993432da9))
- captureColdStartMetric and throwOnEmptyMetrics when set to false was interpreted as true ([#1090](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1090)) ([127aad4](https://github.com/aws-powertools/powertools-lambda-typescript/commit/127aad4698412d72368c093812dd4034839119ca))
- captureMethod correctly detect method name when used with external decorators ([#1109](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1109)) ([a574406](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a574406134b65c17f56dfb3d3130aa237ece4160))
- **logger:** wait for decorated method return before clearing out state ([#1087](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1087)) ([133ed3c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/133ed3c31ce1d99eb8f427f54721896781438ef7))
- ts-node version for layer-publisher ([#1112](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1112)) ([ee243de](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ee243dea0b9268ed793df19f0b04e680f68e41a6))

### Features

- **idempotency:** create initial class structure for function idempotency ([#1086](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1086)) ([06fbaae](https://github.com/aws-powertools/powertools-lambda-typescript/commit/06fbaae4db3825557aa84d40372a53422e42840d))
- publish lib as Lambda Layer ([#1095](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1095)) ([83f6efb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/83f6efba1db32ba2dc8fff026e258b5de66783e0))
- **tracer:** specify subsegment name when capturing class method ([#1092](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1092)) ([d4174eb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d4174eb7a894215e2d37f306016429de3bde8029))

### Reverts

- Revert "chore(release): v1.3.0 [skip ci]" ([237b99f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/237b99f9f6eff5e6e26d779603cf13cd4422c156))

## [1.2.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.2.0...v1.2.1) (2022-08-25)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [1.2.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.1.1...v1.2.0) (2022-08-23)

### Bug Fixes

- **docs:** docs published with incorrect version number + api docs missing after release ([#1066](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1066)) ([8b8b25c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8b8b25c97d84f7a518a463e2a30406c31e44e587))

### Features

- **metrics:** increase maximum dimensions to 29 ([#1072](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1072)) ([7b9a027](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7b9a0278ccf801a521cab3f74372a4748231fd11))
- **tracer:** allow disabling result capture for decorators and middleware ([#1065](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1065)) ([c3b9a37](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c3b9a37b6d5885f1750da4f0b226a18734ff0c29))

## [1.1.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.1.0...v1.1.1) (2022-08-18)

### Bug Fixes

- **logger:** decorated class methods cannot access `this` ([#1060](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1060)) ([73990bb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/73990bbcbbd9d5a6d6f55f553e4fd8f038654fa9))
- **tracer:** decorated class methods cannot access `this` ([#1055](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1055)) ([107fa04](https://github.com/aws-powertools/powertools-lambda-typescript/commit/107fa04148ec86c8a0c0a29b5b2d35a62fe2b4e6))
- workflow concurrency + leftover needs ([#1054](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1054)) ([9ce180a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9ce180a3b70a86af5e6cc94f51ecf4a0b6a7a96e))

# [1.1.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.0.2...v1.1.0) (2022-08-12)

### Bug Fixes

- **layers:** release process + remove duplicate code ([#1052](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1052)) ([f653c06](https://github.com/aws-powertools/powertools-lambda-typescript/commit/f653c065bd5586785e482d61d2738549d8ac9fd9))
- **logger:** fix clearstate bug when lambda handler throws ([#1045](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1045)) ([5ebd1cf](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5ebd1cf44a2a3b6d99923e5bb942af3327325241))
- wrong scope in captureMethod ([#1026](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1026)) ([1a06fed](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1a06fed74db02741c58bc05d8d5fce2e688d7879))

### Features

- **build:** publish lib as a Lambda Layer ([#884](https://github.com/aws-powertools/powertools-lambda-typescript/issues/884)) ([c3a20c6](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c3a20c61380a6b6944807f5abf12c9cafb254325)), closes [#1031](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1031)

## [1.0.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v1.0.1...v1.0.2) (2022-07-19)

**Note:** Version bump only for package aws-lambda-powertools-typescript

## [1.0.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.12.0-rc.1...v1.0.1) (2022-07-14)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [0.12.0-rc.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.12.0-rc.0...v0.12.0-rc.1) (2022-07-14)

### Reverts

- Revert "build: bump lerna (#1014)" (#1018) ([623e12d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/623e12de4c6c1dbc93d285e7d03426bff0802b38)), closes [#1014](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1014) [#1018](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1018)

# [0.12.0-rc.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.11.1-rc.0...v0.12.0-rc.0) (2022-07-14)

### Bug Fixes

- **logger:** POWERTOOLS_LOGGER_LOG_EVENT precedence is respected ([#1015](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1015)) ([1cbb4db](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1cbb4db4daf776e12f7dc2b383ac7fa561b7bada))
- **tracer:** capture method throws errors correctly ([#1016](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1016)) ([fb85238](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fb8523868e8d5e31c00a017ae1102ed31a0a4245))

### Features

- **tracer:** auto disable when running inside amplify mock ([#1010](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1010)) ([024d628](https://github.com/aws-powertools/powertools-lambda-typescript/commit/024d6286f9b9273becce825b5c6ca0db87d4c63a))

### Reverts

- Revert "chore(release): v0.12.0-rc.0 [skip ci]" ([9397f1d](https://github.com/aws-powertools/powertools-lambda-typescript/commit/9397f1d3624eb0bfbeb5e4c2702ae51e558a5b4a))
- Revert "chore(release): v0.12.0-rc.0 [skip ci]" (#1017) ([51c18da](https://github.com/aws-powertools/powertools-lambda-typescript/commit/51c18da20db434f8b12f320e5074e3e0a146046e)), closes [#1017](https://github.com/aws-powertools/powertools-lambda-typescript/issues/1017)

## [0.11.1-rc.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.11.0...v0.11.1-rc.0) (2022-06-24)

**Note:** Version bump only for package aws-lambda-powertools-typescript

# [0.11.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.10.0...v0.11.0) (2022-06-23)

### Features

- **logger:** add clear state functionality ([#902](https://github.com/aws-powertools/powertools-lambda-typescript/issues/902)) ([fa1dacb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fa1dacb001503a0a607e0951499119a1a9c61545))

# [0.10.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.9.1...v0.10.0) (2022-06-02)

### Bug Fixes

- **commons:** rename tests subfolder to samples to avoid being deleted by tools such as node-prune ([#882](https://github.com/aws-powertools/powertools-lambda-typescript/issues/882)) ([74ef816](https://github.com/aws-powertools/powertools-lambda-typescript/commit/74ef816830eca897d59881b1d260a146a2c9a47c))

### Features

- **all:** nodejs16x support ([#877](https://github.com/aws-powertools/powertools-lambda-typescript/issues/877)) ([d2b13c9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d2b13c945adb1a74b7c5f76d45f28a6979ce6429))
- **logger:** add removeKeys functionality ([#901](https://github.com/aws-powertools/powertools-lambda-typescript/issues/901)) ([a0f72c2](https://github.com/aws-powertools/powertools-lambda-typescript/commit/a0f72c275270db33d382bff357f6054f552197e6))

## [0.9.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.9.0...v0.9.1) (2022-05-24)

### Bug Fixes

- **logger:** enable logging of arbitrary objects ([#883](https://github.com/aws-powertools/powertools-lambda-typescript/issues/883)) ([5d34854](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5d348543d3fbb48a98a9b2c34a1e8fa56b037adb))

# [0.9.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.8.1...v0.9.0) (2022-05-16)

### Bug Fixes

- added back fetch-depth: 0 ([#812](https://github.com/aws-powertools/powertools-lambda-typescript/issues/812)) ([494c742](https://github.com/aws-powertools/powertools-lambda-typescript/commit/494c742aefc9355ee431f433655ddd3fd7efebcf))
- **logger:** add xray_trace_id to every log ([#776](https://github.com/aws-powertools/powertools-lambda-typescript/issues/776)) ([11af21a](https://github.com/aws-powertools/powertools-lambda-typescript/commit/11af21ae236140e85d1503d355074c9ec254d90b))
- reintroduce token while checking out ([#848](https://github.com/aws-powertools/powertools-lambda-typescript/issues/848)) ([cabef3e](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cabef3e515c9074dc178efca76de7c72c70370e3))
- removed token from remaining actions ([#805](https://github.com/aws-powertools/powertools-lambda-typescript/issues/805)) ([4fd9ecb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4fd9ecbde412f640deaeb17a997aae8a9f5841c0))

### Features

- **examples:** added sam example to workflows ([#849](https://github.com/aws-powertools/powertools-lambda-typescript/issues/849)) ([93f1c7b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/93f1c7b55cb159dfcbbcb41149ccec7fd5db1660))

## [0.8.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.8.0...v0.8.1) (2022-04-14)

### Bug Fixes

- **logger:** change logging to use stdout ([#748](https://github.com/aws-powertools/powertools-lambda-typescript/issues/748)) ([0781a47](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0781a479a6ae3c794f94c72b59cd0920073159a2))

# [0.8.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.7.2...v0.8.0) (2022-04-08)

### Features

- added captureHTTPsRequest feature ([#677](https://github.com/aws-powertools/powertools-lambda-typescript/issues/677)) ([5a36723](https://github.com/aws-powertools/powertools-lambda-typescript/commit/5a367233b3284c4b1c0c18caffd00e585afc9f55))

## [0.7.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.7.1...v0.7.2) (2022-04-01)

**Note:** Version bump only for package aws-lambda-powertools-typescript

## [0.7.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.7.0...v0.7.1) (2022-03-17)

### Bug Fixes

- **logger:** enable sequential invocation in e2e test ([#658](https://github.com/aws-powertools/powertools-lambda-typescript/issues/658)) ([800424b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/800424bc77223682ad6cdcc9f35080aff30ba91e))
- **logger:** fix handling of additional log keys ([#614](https://github.com/aws-powertools/powertools-lambda-typescript/issues/614)) ([8aab299](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8aab29900c5fac8eb625eb747acbc23ceac8f6ba))
- **tracer, metrics:** use polling instead of fixed wait in e2e tests ([#654](https://github.com/aws-powertools/powertools-lambda-typescript/issues/654)) ([6d4ab75](https://github.com/aws-powertools/powertools-lambda-typescript/commit/6d4ab751bc98eb823d2a68b4973fa9f8405971a2))

# [0.7.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.6.0...v0.7.0) (2022-03-08)

### Features

- **logger:** adopted Utility class & updated unit tests ([#550](https://github.com/aws-powertools/powertools-lambda-typescript/issues/550)) ([48f3487](https://github.com/aws-powertools/powertools-lambda-typescript/commit/48f34870d5bc3a5affcb70c8927859c56da6c5ff))
- **metrics:** adopted Utility class ([#548](https://github.com/aws-powertools/powertools-lambda-typescript/issues/548)) ([672e6a8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/672e6a82a2c66f99153c63a53e9d31481afd897a))
- **tracer:** adopted Utility class & updated unit tests ([#549](https://github.com/aws-powertools/powertools-lambda-typescript/issues/549)) ([3769a69](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3769a694725cc2a3fe6fb5f90fb045f73ea32a7c))

# [0.6.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.5.1...v0.6.0) (2022-02-17)

### Bug Fixes

- **logger:** fix logger attribute merging ([#535](https://github.com/aws-powertools/powertools-lambda-typescript/issues/535)) ([8180be1](https://github.com/aws-powertools/powertools-lambda-typescript/commit/8180be1ceb3f75bb7a35a7905cca867fb5eaa970))

### Features

- **commons:** centralize cold start heuristic ([#547](https://github.com/aws-powertools/powertools-lambda-typescript/issues/547)) ([4e4091f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4e4091f7b853c56a8dfd28829f09a066cc8e2ee7))
- **logger:** add e2e tests for logger ([#529](https://github.com/aws-powertools/powertools-lambda-typescript/issues/529)) ([e736b65](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e736b652c112b1c24c29eca8b1edfd87a79d1b2e))

## [0.5.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.5.0...v0.5.1) (2022-02-09)

### Bug Fixes

- **tracer:** properly return DynamoDB.DocumentClient ([#528](https://github.com/aws-powertools/powertools-lambda-typescript/issues/528)) ([3559e7b](https://github.com/aws-powertools/powertools-lambda-typescript/commit/3559e7b19339a4649f235fb4af41c6b182da3df1))

### Reverts

- Revert "build(deps-dev): bump aws-cdk from 1.139.0 to 1.143.0 (#532)" (#544) ([e96c9ba](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e96c9ba5bd4f738e5ed7c5850e06856a8c69bff1)), closes [#532](https://github.com/aws-powertools/powertools-lambda-typescript/issues/532) [#544](https://github.com/aws-powertools/powertools-lambda-typescript/issues/544)
- Revert "build(deps-dev): bump @aws-cdk/aws-lambda-nodejs from 1.139.0 to 1.143.0 (#531)" (#545) ([7dffbd8](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7dffbd8708555fcc9817ea4373ccf71b0aea3c89)), closes [#531](https://github.com/aws-powertools/powertools-lambda-typescript/issues/531) [#545](https://github.com/aws-powertools/powertools-lambda-typescript/issues/545)

# [0.5.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.4.0...v0.5.0) (2022-01-26)

### Bug Fixes

- **examples:** fix errors in logger and metrics examples ([#509](https://github.com/aws-powertools/powertools-lambda-typescript/issues/509)) ([c19b47c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/c19b47cb4cdb71e0ae404e9302226256d02fb7d5))
- **logger|metrics:** properly return decorated class ([#489](https://github.com/aws-powertools/powertools-lambda-typescript/issues/489)) ([014c5bd](https://github.com/aws-powertools/powertools-lambda-typescript/commit/014c5bd7d5c807064af8f04c16d297a8fe3bc0d9))

### Features

- Add codespaces/gitpod support ([#485](https://github.com/aws-powertools/powertools-lambda-typescript/issues/485)) ([ed6f258](https://github.com/aws-powertools/powertools-lambda-typescript/commit/ed6f258d6f8025bcfa9db3ea3d6a05a1338802e3))
- **all:** make `@middy/core` optional ([#511](https://github.com/aws-powertools/powertools-lambda-typescript/issues/511)) ([1107f96](https://github.com/aws-powertools/powertools-lambda-typescript/commit/1107f96e9b4c678d34ee36757366f150d99be4dc))
- **tracer:** add support for capturing DynamoDB DocumentClient ([#450](https://github.com/aws-powertools/powertools-lambda-typescript/issues/450)) ([621ae50](https://github.com/aws-powertools/powertools-lambda-typescript/commit/621ae50430e4459f90eaaa135eb0ed674b95e108))

# [0.4.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.3.3...v0.4.0) (2022-01-20)

### Features

- **logger:** JSDOCS support ([#491](https://github.com/aws-powertools/powertools-lambda-typescript/issues/491)) ([cd2c2d9](https://github.com/aws-powertools/powertools-lambda-typescript/commit/cd2c2d93a5822e26d3113a042be1dd0473aa6b2a))

## [0.3.3](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.3.2...v0.3.3) (2022-01-17)

### Bug Fixes

- lerna version not publishing all packages ([#480](https://github.com/aws-powertools/powertools-lambda-typescript/issues/480)) ([0cabc3f](https://github.com/aws-powertools/powertools-lambda-typescript/commit/0cabc3ff7b29fae8a01aeae56450d19737af3bba))

## [0.3.2](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.3.1...v0.3.2) (2022-01-17)

### Bug Fixes

- export LogFormatter + update docs ([#479](https://github.com/aws-powertools/powertools-lambda-typescript/issues/479)) ([7f91566](https://github.com/aws-powertools/powertools-lambda-typescript/commit/7f91566d4ff34887914009e2424df7c39a96cd71))
- updated CDK examples to remove old references & improve comments ([#439](https://github.com/aws-powertools/powertools-lambda-typescript/issues/439)) ([4cdaaea](https://github.com/aws-powertools/powertools-lambda-typescript/commit/4cdaaeaf7fbb24571b194c0e82338fbd216d2dcd))

## [0.3.1](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.3.0...v0.3.1) (2022-01-14)

### Bug Fixes

- **all:** fix latest release broken by change of npm pack result on common ([#470](https://github.com/aws-powertools/powertools-lambda-typescript/issues/470)) ([2c3df93](https://github.com/aws-powertools/powertools-lambda-typescript/commit/2c3df9378ac191f6da6cb5f458f6227d6466cafa)), closes [#417](https://github.com/aws-powertools/powertools-lambda-typescript/issues/417)

# [0.3.0](https://github.com/aws-powertools/powertools-lambda-typescript/compare/v0.2.0...v0.3.0) (2022-01-14)

### Bug Fixes

- **build:** Fix linting issue and add linting to the pre-push hook ([#440](https://github.com/aws-powertools/powertools-lambda-typescript/issues/440)) ([e7bc53c](https://github.com/aws-powertools/powertools-lambda-typescript/commit/e7bc53c38b2a906c6952a83c5262db521ea468fb))
- **build:** Update contributing.md and fix npm ci ([#417](https://github.com/aws-powertools/powertools-lambda-typescript/issues/417)) ([279ad98](https://github.com/aws-powertools/powertools-lambda-typescript/commit/279ad984f71d5b157a13cffeab52602f2c09c1f8)), closes [#415](https://github.com/aws-powertools/powertools-lambda-typescript/issues/415) [#415](https://github.com/aws-powertools/powertools-lambda-typescript/issues/415)
- **metrics:** Rename purgeStoredMetrics() function usage in CDK example ([#424](https://github.com/aws-powertools/powertools-lambda-typescript/issues/424)) ([02f0eae](https://github.com/aws-powertools/powertools-lambda-typescript/commit/02f0eae2c378bd5562facf032fb94a25c69f66df))
- **tracer:** avoid throwing errors in manual instrumentation when running outside of AWS Lambda ([#442](https://github.com/aws-powertools/powertools-lambda-typescript/issues/442)) ([fd02acb](https://github.com/aws-powertools/powertools-lambda-typescript/commit/fd02acbbe7de1cd0d1b00ae1cca68148a5114cbf))

### Features

- **all:** Update to examples use released version (0.2.0) ([#405](https://github.com/aws-powertools/powertools-lambda-typescript/issues/405)) ([d5e0620](https://github.com/aws-powertools/powertools-lambda-typescript/commit/d5e0620473f31d0839c027a76a88dcdcb98c84de))

# 0.2.0 (2022-01-05)

### Features

- _tracer:_ beta release (#91 (https://github.com/aws-powertools/powertools-lambda-python/issues/91))
- _logger:_ beta release (#24 (https://github.com/aws-powertools/powertools-lambda-python/issues/24))
- _metrics:_ beta release (#25 (https://github.com/aws-powertools/powertools-lambda-python/issues/25))

### Contributions

- chore(ci): auto-label PR on semantic title (#403) by @heitorlessa
- fix: documentation generation on on-release.yml workflow (#368) by @ijemmy
- fix: Remove publishing doc on develop version and fix missing leading 0 in version (#356) by @ijemmy
- feat: generate new version of doc for each release (#355) by @ijemmy
- chore(cicd): cdk examples and e2e tests for metrics (#326) by @flochaz
- fix(cicd): skip ci on bump commit (#339) by @flochaz
- chore(cicd): fix publish (#336) by @flochaz
- chore(cicd): Add release workflow (#260) by @flochaz
- chore(commons): Create a common package (#314) by @flochaz
- feat: Auto publish docs to version "develop" (#269) by @ijemmy
- fix(metrics): publish metrics even if handler throw (#249) by @flochaz
- chore: fix linting (#247) by @flochaz
- chore(all): npm libraries bump and breaking changes fixes (#215) by @saragerion
- chore: Enable auto-merge for dependabot PRs (#169) by @dreamorosi
- feat: add metrics (#102) by @alan-churley
- chore: Add commit hooks for testing and linting (#149) by @bahrmichael
- chore: Removed assignees from issue templates (#146) by @dreamorosi
- chore: Disabled auto-assign-issues integration (#144) by @dreamorosi
- feat: Adding sample automation for PR (#121) by @alan-churley
- test(logger): add unit tests with most important scenarios and features (#52) by @saragerion
- chore: increase version of WS dependancy (#71) by @alan-churley
- chore: dependancies upgrade (#70) by @alan-churley
- build(github-actions): fix YAML of closed issues message (#23) by @saragerion
- improv: repository documentation, metadata, github actions, dot files (#17) by @saragerion
- refactor(logger): overall improvements - DX, examples, business logic (#16) by @saragerion
- chore: updating path for coverage (#12) by @alan-churley
- feat(logger): add context decorator functionality (#13) by @saragerion
- test(all): add mock Lambda events payloads generated by other AWS services (#10) by @saragerion
- feat(logger): basic logger logic (#9) by @saragerion
- revert: Remove CodeQL analysis (#2) by @alan-churley
- feat(metrics): rename method purgeStoredMetrics to publishStoredMetrics (#377) by @flochaz

- fix(metrics): use same naming for serviceName (#401) by @flochaz
- feat(commons): update types to have optional callback (#394) by @flochaz
- feat(metrics): logMetrics middleware (#338) by @saragerion
- chore(tracer): quality of life improvements (#337) by @dreamorosi
- feat(tracer): middy middleware (#324) by @dreamorosi
- feat(logger): middy middleware (#313) by @saragerion
- chore(ALL): fix packaging (#316) by @flochaz
- feat: add tracer (#107) by @dreamorosi
- feat(logger): documentation, examples, business logic changes (#293) by @saragerion
- feat(metric): bring feature parity between decorator and utility function (#291) by @flochaz
- docs(all): make docs more coherent (#387) by @dreamorosi
- docs(logger): improve mkdocs and examples of sample rate feature (#389) by @saragerion
- docs(all): clarifications & fixes (#370) by @dreamorosi
- chore(tracer): cdk examples + e2e tests (#347) by @dreamorosi
- docs(all): getting started section, beta release warning (#351) by @saragerion
- chore(docs): Tracer docs (#274) by @dreamorosi
- chore(docs): Add credits section to README (#305) by @dreamorosi
- chore(metrics): Add typeDoc (#285) by @flochaz
- feat(logger): documentation, examples, business logic changes (#293) by @saragerion
- chore(metrics): github page doc (#284) by @flochaz
- feat: generate api docs (#277) by @ijemmy
- docs: base documentation (#250) by @dreamorosi
- docs: updating readme and package.json to work with lerna (#11) by @alan-churley
- fix(metrics): Support multiple addMetric() call with the same metric name (#390) by @ijemmy
- fix(logger): display correct log level in cloudwatch (#386) by @saragerion
- fix(metrics): expose logMetrics middleware (#380) by @flochaz
- chore: change license (#117) by @dreamorosi
- chore: don't bump version for merge to main (#404) by @flochaz
- feat(ALL): Use optional callback LambdaInterface for decorator (#397) by @flochaz
- chore(ci): add release drafter workflow (#382) by @heitorlessa
- build(deps): bump e2e dependencies metrics (#371) by @dreamorosi
- build(deps-dev): bump @aws-cdk/aws-lambda from 1.136.0 to 1.137.0 (#340) by @dependabot
- chore(commons): Remove eslint from commons pkg (#352) by @dreamorosi
- build(deps-dev): bump @types/lodash from 4.14.177 to 4.14.178 (#335) by @dependabot
- build(deps-dev): bump @types/node from 16.11.11 to 17.0.0 (#325) by @dependabot
- build(deps-dev): bump @types/lodash from 4.14.177 to 4.14.178 (#318) by @dependabot
- build(deps-dev): bump ts-jest from 27.0.7 to 27.1.1 (#317) by @dependabot
- build(deps-dev): bump jest from 27.4.3 to 27.4.5 (#310) by @dependabot
- build(deps): bump @types/aws-lambda from 8.10.85 to 8.10.88 (#312) by @dependabot
- build(deps-dev): bump typescript from 4.5.2 to 4.5.4 (#311) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 5.5.0 to 5.7.0 (#308) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 5.5.0 to 5.7.0 (#309) by @dependabot
- build(deps): bump aws-xray-sdk-core from 3.3.3 to 3.3.4 (#307) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 5.5.0 to 5.6.0 (#297) by @dependabot
- build(deps): bump @types/aws-lambda from 8.10.85 to 8.10.87 (#299) by @dependabot
- build(deps-dev): bump jest from 27.4.3 to 27.4.4 (#300) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 5.5.0 to 5.6.0 (#298) by @dependabot
- build(deps-dev): bump ts-jest from 27.0.7 to 27.1.1 (#296) by @dependabot
- build(deps-dev): bump typescript from 4.5.2 to 4.5.3 (#287) by @dependabot
- build(deps-dev): bump jest from 27.4.3 to 27.4.4 (#288) by @dependabot
- build(deps-dev): bump @types/lodash from 4.14.177 to 4.14.178 (#283) by @dependabot
- build(deps): bump @types/aws-lambda from 8.10.85 to 8.10.86 (#272) by @dependabot
- build(deps-dev): bump ts-jest from 27.0.7 to 27.1.1 (#271) by @dependabot
- build(deps-dev): bump @types/node from 16.11.11 to 16.11.12 (#270) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 5.5.0 to 5.6.0 (#273) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 5.5.0 to 5.6.0 (#268) by @dependabot
- build(deps-dev): bump @types/node from 16.11.11 to 16.11.12 (#267) by @dependabot
- build(deps-dev): bump eslint from 8.3.0 to 8.4.1 (#266) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 5.5.0 to 5.6.0 (#265) by @dependabot
- build(deps-dev): bump ts-jest from 27.0.7 to 27.1.0 (#264) by @dependabot
- build(deps): bump @types/aws-lambda from 8.10.85 to 8.10.86 (#263) by @dependabot
- build(deps): bump romeovs/lcov-reporter-action from 0.2.21 to 0.3.1 (#261) by @dependabot
- build(deps-dev): bump @types/jest from 27.0.2 to 27.0.3 (#258) by @dependabot
- build(deps-dev): bump @types/node from 16.11.6 to 16.11.11 (#257) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.33.0 to 5.5.0 (#256) by @dependabot
- build(deps-dev): bump @types/lodash from 4.14.175 to 4.14.177 (#255) by @dependabot
- build(deps): bump @types/aws-lambda from 8.10.84 to 8.10.85 (#252) by @dependabot
- build(deps-dev): bump jest from 27.3.1 to 27.4.3 (#251) by @dependabot
- build(deps-dev): bump husky from 7.0.2 to 7.0.4 (#243) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.33.0 to 5.5.0 (#253) by @dependabot
- build(deps-dev): bump eslint from 8.1.0 to 8.3.0 (#254) by @dependabot
- build(deps-dev): bump typescript from 4.4.3 to 4.5.2 (#245) by @dependabot
- build(deps-dev): bump ts-node from 10.3.0 to 10.4.0 (#242) by @dependabot
- build(deps-dev): bump ts-jest from 27.0.5 to 27.0.7 (#234) by @dependabot
- build(deps-dev): bump @commitlint/cli from 13.2.1 to 15.0.0 (#244) by @dependabot
- build(deps-dev): bump jest from 27.2.5 to 27.3.1 (#235) by @dependabot
- build(deps-dev): bump eslint from 7.32.0 to 8.1.0 (#239) by @dependabot
- build(deps-dev): bump @types/node from 16.10.3 to 16.11.6 (#240) by @dependabot
- build(deps-dev): bump ts-node from 10.2.1 to 10.3.0 (#226) by @dependabot
- build(deps-dev): bump jest from 27.2.4 to 27.2.5 (#225) by @dependabot
- build(deps-dev): bump @types/aws-lambda from 8.10.83 to 8.10.84 (#223) by @dependabot
- build(deps-dev): bump @commitlint/cli from 13.2.0 to 13.2.1 (#222) by @dependabot
- build(deps-dev): bump jest from 27.2.2 to 27.2.4 (#217) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.32.0 to 4.33.0 (#219) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.32.0 to 4.33.0 (#220) by @dependabot
- build(deps-dev): bump @types/node from 16.10.1 to 16.10.3 (#221) by @dependabot
- build(deps-dev): bump jest from 27.0.6 to 27.2.2 (#212) by @dependabot
- build(deps-dev): bump ts-jest from 27.0.4 to 27.0.5 (#181) by @dependabot
- build(deps): bump actions/github-script from 4.1 to 5 (#211) by @dependabot
- build(deps-dev): bump typescript from 4.3.5 to 4.4.3 (#199) by @dependabot
- build(deps-dev): bump @types/node from 16.9.6 to 16.10.1 (#213) by @dependabot
- build(deps-dev): bump @types/lodash from 4.14.173 to 4.14.174 (#214) by @dependabot
- build(deps-dev): bump @types/node from 16.9.4 to 16.9.6 (#210) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.30.0 to 4.31.2 (#209) by @dependabot
- build(deps-dev): bump @types/jest from 27.0.1 to 27.0.2 (#208) by @dependabot
- build(deps-dev): bump @types/node from 16.9.2 to 16.9.4 (#205) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.31.1 to 4.31.2 (#206) by @dependabot
- build(deps-dev): bump @types/node from 16.9.1 to 16.9.2 (#204) by @dependabot
- build(deps-dev): bump @types/lodash from 4.14.172 to 4.14.173 (#203) by @dependabot
- build(deps-dev): bump @types/node from 16.7.2 to 16.9.1 (#202) by @dependabot
- build(deps-dev): bump husky from 7.0.1 to 7.0.2 (#191) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.29.2 to 4.31.1 (#200) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.29.2 to 4.30.0 (#194) by @dependabot
- build(deps-dev): bump @types/node from 16.6.2 to 16.7.2 (#190) by @dependabot
- build(deps): bump actions/github-script from 4.0.2 to 4.1 (#187) by @dependabot
- build(deps-dev): bump @types/aws-lambda from 8.10.82 to 8.10.83 (#186) by @dependabot
- build(deps): bump actions/github-script from 3.1.0 to 4.0.2 (#179) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.29.1 to 4.29.2 (#180) by @dependabot
- build(deps-dev): bump @types/node from 16.6.1 to 16.6.2 (#184) by @dependabot
- build(deps-dev): bump ts-node from 10.2.0 to 10.2.1 (#183) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.29.1 to 4.29.2 (#182) by @dependabot
- build(deps-dev): bump @types/jest from 27.0.0 to 27.0.1 (#177) by @dependabot
- build(deps-dev): bump @types/node from 16.6.0 to 16.6.1 (#176) by @dependabot
- build(deps-dev): bump @types/node from 16.4.13 to 16.6.0 (#174) by @dependabot
- build(deps-dev): bump @commitlint/cli from 12.1.4 to 13.1.0 (#172) by @dependabot
- build(deps-dev): bump @types/jest from 26.0.24 to 27.0.0 (#171) by @dependabot
- build(deps-dev): bump @types/aws-lambda from 8.10.81 to 8.10.82 (#170) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.29.0 to 4.29.1 (#167) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.29.0 to 4.29.1 (#166) by @dependabot
- improv: Use lodash.merge & lodash.clonedeed instead of full lodash in Logger (#159) by @dreamorosi
- build(deps-dev): bump ts-node from 10.1.0 to 10.2.0 (#164) by @dependabot
- build(deps-dev): bump @types/node from 16.4.10 to 16.4.13 (#162) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.28.5 to 4.29.0 (#156) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.5 to 4.29.0 (#157) by @dependabot
- build(deps-dev): bump @types/lodash from 4.14.171 to 4.14.172 (#158) by @dependabot
- build(deps-dev): bump eslint from 7.31.0 to 7.32.0 (#155) by @dependabot
- build(deps-dev): bump @types/node from 16.4.7 to 16.4.10 (#154) by @dependabot
- build(deps-dev): bump @types/node from 16.4.6 to 16.4.7 (#150) by @dependabot
- build(deps-dev): bump @types/node from 16.4.5 to 16.4.6 (#148) by @dependabot
- build(deps-dev): bump @types/node from 16.4.3 to 16.4.5 (#145) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.4 to 4.28.5 (#138) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.28.4 to 4.28.5 (#137) by @dependabot
- build(deps-dev): bump @types/aws-lambda from 8.10.80 to 8.10.81 (#135) by @dependabot
- build(deps-dev): bump @types/node from 16.4.1 to 16.4.3 (#134) by @dependabot
- build(deps-dev): bump @types/node from 16.4.0 to 16.4.1 (#132) by @dependabot
- build(deps-dev): bump @types/aws-lambda from 8.10.79 to 8.10.80 (#128) by @dependabot
- build(deps-dev): bump ts-jest from 27.0.3 to 27.0.4 (#127) by @dependabot
- build(deps-dev): bump @types/node from 16.3.3 to 16.4.0 (#124) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.3 to 4.28.4 (#122) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.28.3 to 4.28.4 (#123) by @dependabot
- build(deps-dev): bump eslint from 7.30.0 to 7.31.0 (#118) by @dependabot
- build(deps-dev): bump @types/node from 16.3.2 to 16.3.3 (#119) by @dependabot
- build(deps-dev): bump @types/aws-lambda from 8.10.78 to 8.10.79 (#114) by @dependabot
- build(deps-dev): bump @types/node from 16.0.0 to 16.3.2 (#113) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.2 to 4.28.3 (#112) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.28.2 to 4.28.3 (#111) by @dependabot
- build(deps-dev): bump ts-node from 10.0.0 to 10.1.0 (#110) by @dependabot
- build(deps-dev): bump @types/lodash from 4.14.170 to 4.14.171 (#105) by @dependabot
- build(deps-dev): bump @types/jest from 26.0.23 to 26.0.24 (#104) by @dependabot
- build(deps-dev): bump @types/aws-lambda from 8.10.77 to 8.10.78 (#103) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.28.1 to 4.28.2 (#100) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.28.1 to 4.28.2 (#101) by @dependabot
- build(deps-dev): bump @types/node from 15.14.0 to 16.0.0 (#98) by @dependabot
- build(deps-dev): bump eslint from 7.29.0 to 7.30.0 (#99) by @dependabot
- build(deps-dev): bump typescript from 4.3.4 to 4.3.5 (#97) by @dependabot
- build(deps-dev): bump @types/node from 15.12.3 to 15.14.0 (#96) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.27.0 to 4.28.1 (#94) by @dependabot
- build(deps-dev): bump eslint from 7.28.0 to 7.29.0 (#86) by @dependabot
- build(deps-dev): bump @types/node from 15.12.3 to 15.12.5 (#92) by @dependabot
- build(deps-dev): bump jest from 27.0.4 to 27.0.6 (#93) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.27.0 to 4.28.1 (#95) by @dependabot
- build(deps-dev): bump typescript from 4.3.2 to 4.3.4 (#84) by @dependabot
- build(deps-dev): bump @types/node from 15.12.2 to 15.12.3 (#85) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.26.1 to 4.27.0 (#81) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.26.1 to 4.27.0 (#82) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.26.0 to 4.26.1 (#80) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.26.0 to 4.26.1 (#78) by @dependabot
- build(deps-dev): bump @types/node from 15.12.1 to 15.12.2 (#79) by @dependabot
- build(deps-dev): bump jest from 26.6.3 to 27.0.4 (#73) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.25.0 to 4.26.0 (#69) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.25.0 to 4.26.0 (#68) by @dependabot
- build(deps-dev): bump typescript from 4.2.4 to 4.3.2 (#66) by @dependabot
- build(deps-dev): bump @types/node from 15.3.1 to 15.6.1 (#61) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.24.0 to 4.25.0 (#62) by @dependabot
- build(deps-dev): bump @types/lodash from 4.14.169 to 4.14.170 (#60) by @dependabot
- build(deps-dev): bump ts-node from 9.1.1 to 10.0.0 (#58) by @dependabot
- build(deps-dev): bump eslint from 7.26.0 to 7.27.0 (#57) by @dependabot
- build(deps-dev): bump @types/node from 15.3.0 to 15.3.1 (#56) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.23.0 to 4.24.0 (#55) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.23.0 to 4.24.0 (#54) by @dependabot
- build(deps-dev): bump @types/node from 15.0.3 to 15.3.0 (#53) by @dependabot
- build(deps-dev): bump @types/node from 14.14.37 to 15.0.3 (#50) by @dependabot
- build(deps-dev): bump lerna from 3.22.1 to 4.0.0 (#29) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.21.0 to 4.22.0 (#37) by @dependabot
- build(deps-dev): bump eslint from 7.23.0 to 7.24.0 (#35) by @dependabot
- build(deps): bump romeovs/lcov-reporter-action from v0.2.11 to v0.2.21 (#34) by @dependabot
- build(deps-dev): bump @commitlint/cli from 11.0.0 to 12.1.1 (#33) by @dependabot
- build(deps-dev): bump @types/aws-lambda from 8.10.72 to 8.10.75 (#32) by @dependabot
- build(deps-dev): bump @types/node from 14.14.20 to 14.14.37 (#31) by @dependabot
- build(deps-dev): bump husky from 4.3.7 to 6.0.0 (#30) by @dependabot
- build(deps-dev): bump typescript from 4.1.3 to 4.2.4 (#28) by @dependabot
- build(deps-dev): bump ts-jest from 26.4.4 to 26.5.4 (#27) by @dependabot
- build(deps-dev): bump eslint from 7.17.0 to 7.23.0 (#21) by @dependabot
- build(deps-dev): bump @types/jest from 26.0.20 to 26.0.22 (#22) by @dependabot
- build(deps-dev): bump @typescript-eslint/parser from 4.13.0 to 4.21.0 (#20) by @dependabot
- build(deps-dev): bump @typescript-eslint/eslint-plugin from 4.13.0 to 4.21.0 (#18) by @dependabot
- build(deps-dev): bump @commitlint/config-conventional from 11.0.0 to 12.1.1 (#19) by @dependabot
- docs: updating readme and package.json to work with lerna (#11) by @alan-churley
- chore: lerna downstream dependancy security issues (#15) by @alan-churley
- build(deps): bump ini from 1.3.5 to 1.3.8 (#5) by @dependabot
- build(deps): bump ini from 1.3.5 to 1.3.8 in /packages/logging (#4) by @dependabot
- build(deps): bump ini from 1.3.5 to 1.3.8 in /docs (#3) by @dependabot

### Contributor List:

@alan-churley, @bahrmichael, @dreamorosi, @flochaz, @heitorlessa, @ijemmy and @saragerion
