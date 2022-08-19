# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [1.2.11](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.10...v1.2.11) (2022-08-19)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.10](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.9...v1.2.10) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.9](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.8...v1.2.9) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.8](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.7...v1.2.8) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.7](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.6...v1.2.7) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.6](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.5...v1.2.6) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.5](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.4...v1.2.5) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.4](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.3...v1.2.4) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.3](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.2...v1.2.3) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.2](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.1...v1.2.2) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.2.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.2.0...v1.2.1) (2022-08-18)

**Note:** Version bump only for package @aws-lambda-powertools/logger





# 1.2.0 (2022-08-18)


### Bug Fixes

* **all:** fix latest release broken by change of npm pack result on common ([#470](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/470)) ([2c3df93](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/2c3df9378ac191f6da6cb5f458f6227d6466cafa)), closes [#417](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/417)
* **build:** Update contributing.md and fix npm ci ([#417](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/417)) ([279ad98](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/279ad984f71d5b157a13cffeab52602f2c09c1f8)), closes [#415](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/415) [#415](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/415)
* **examples:** fix errors in logger and metrics examples ([#509](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/509)) ([c19b47c](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/c19b47cb4cdb71e0ae404e9302226256d02fb7d5))
* export LogFormatter + update docs ([#479](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/479)) ([7f91566](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/7f91566d4ff34887914009e2424df7c39a96cd71))
* hosted-git-info bump in logger ([fb2a365](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/fb2a365cc73ae60d6e32d46361265a5ee8f5cad1))
* **logger|metrics:** properly return decorated class ([#489](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/489)) ([014c5bd](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/014c5bd7d5c807064af8f04c16d297a8fe3bc0d9))
* **logger:** add xray_trace_id to every log ([#776](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/776)) ([11af21a](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/11af21ae236140e85d1503d355074c9ec254d90b))
* **logger:** change logging to use stdout ([#748](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/748)) ([0781a47](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/0781a479a6ae3c794f94c72b59cd0920073159a2))
* **logger:** correct log level in cloudwatch ([#386](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/386)) ([23ee7f4](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/23ee7f4fd612dfaa8e5c084a2294721ad78ed759))
* **logger:** decorated class methods cannot access `this` ([#1060](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1060)) ([73990bb](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/73990bbcbbd9d5a6d6f55f553e4fd8f038654fa9))
* **logger:** enable logging of arbitrary objects ([#883](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/883)) ([5d34854](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/5d348543d3fbb48a98a9b2c34a1e8fa56b037adb))
* **logger:** enable sequential invocation in e2e test ([#658](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/658)) ([800424b](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/800424bc77223682ad6cdcc9f35080aff30ba91e))
* **logger:** fix clearstate bug when lambda handler throws ([#1045](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1045)) ([5ebd1cf](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/5ebd1cf44a2a3b6d99923e5bb942af3327325241))
* **logger:** fix handling of additional log keys ([#614](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/614)) ([8aab299](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/8aab29900c5fac8eb625eb747acbc23ceac8f6ba))
* **logger:** fix logger attribute merging ([#535](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/535)) ([8180be1](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/8180be1ceb3f75bb7a35a7905cca867fb5eaa970))
* **logger:** jest set to next version as workaround for vulnerability ([0f423bf](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/0f423bf7479a28829e81fabc6c58ed4e76dcfda4))
* **logger:** POWERTOOLS_LOGGER_LOG_EVENT precedence is respected ([#1015](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1015)) ([1cbb4db](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/1cbb4db4daf776e12f7dc2b383ac7fa561b7bada))
* **metrics:** use same naming for serviceName ([#401](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/401)) ([43c7945](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/43c7945a6a5f539fdbce8f2fb80abb6dcc31556e))
* upgrade of dependencies, npm-shrinkwrap for packages/logger ([c120c64](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/c120c64670ac3ed86438267c0a9c9fc72a3f7ebe))
* version bumb for commitlint/cli ([0e1f6be](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/0e1f6be2786779ca43c3fcac6cb9e96431ca585d))


### Features

* add metrics ([#102](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/102)) ([cf22210](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/cf22210ebb519cf0a625a2bdc92d2bcea7b4a59d))
* add tracer ([#107](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/107)) ([f92279f](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/f92279f723f89943ad4f192165d547607d4c32b8)), closes [#304](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/304)
* **all:** make `@middy/core` optional ([#511](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/511)) ([1107f96](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/1107f96e9b4c678d34ee36757366f150d99be4dc))
* **all:** nodejs16x support ([#877](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/877)) ([d2b13c9](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/d2b13c945adb1a74b7c5f76d45f28a6979ce6429))
* **all:** Update to examples use released version (0.2.0) ([#405](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/405)) ([d5e0620](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/d5e0620473f31d0839c027a76a88dcdcb98c84de))
* **ALL:** Use optional callback LambdaInterface for decorator ([#397](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/397)) ([6413215](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/641321547d65acffa999a283f11333cfc2b1ebf9))
* **logger:** add clear state functionality ([#902](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/902)) ([fa1dacb](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/fa1dacb001503a0a607e0951499119a1a9c61545))
* **logger:** add context decorator functionality ([#13](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/13)) ([369e4d1](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/369e4d1595776f4c563b1e9eb803897677df041f))
* **logger:** add e2e tests for logger ([#529](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/529)) ([e736b65](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/e736b652c112b1c24c29eca8b1edfd87a79d1b2e))
* **logger:** add removeKeys functionality ([#901](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/901)) ([a0f72c2](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/a0f72c275270db33d382bff357f6054f552197e6))
* **logger:** adopted Utility class & updated unit tests ([#550](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/550)) ([48f3487](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/48f34870d5bc3a5affcb70c8927859c56da6c5ff))
* **logger:** basic logger logic ([#9](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/9)) ([5f867ea](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/5f867ea8dc43bd315a27d051993625fa699d514a)), closes [#10](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/10)
* **logger:** edit mkdocs, small updates to logic and test for feature parity ([#293](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/293)) ([87cf8e6](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/87cf8e6e3f15982498531fb14ba10a75f4890cb4))
* **logger:** JSDOCS support ([#491](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/491)) ([cd2c2d9](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/cd2c2d93a5822e26d3113a042be1dd0473aa6b2a))
* **logger:** middy middleware ([#313](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/313)) ([1b92a1e](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/1b92a1e3694482283643f47a9bd2a34301647726))


### Reverts

* Revert "chore(release): v0.12.0-rc.0 [skip ci]" ([9397f1d](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/9397f1d3624eb0bfbeb5e4c2702ae51e558a5b4a))
* Revert "chore(release): v0.12.0-rc.0 [skip ci]" (#1017) ([51c18da](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/51c18da20db434f8b12f320e5074e3e0a146046e)), closes [#1017](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1017)





## [1.1.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.1.0...v1.1.1) (2022-08-18)


### Bug Fixes

* **logger:** decorated class methods cannot access `this` ([#1060](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1060)) ([73990bb](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/73990bbcbbd9d5a6d6f55f553e4fd8f038654fa9))





# [1.1.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.0.2...v1.1.0) (2022-08-12)


### Bug Fixes

* **logger:** fix clearstate bug when lambda handler throws ([#1045](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1045)) ([5ebd1cf](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/5ebd1cf44a2a3b6d99923e5bb942af3327325241))





## [1.0.2](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.0.1...v1.0.2) (2022-07-19)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [1.0.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.12.0-rc.1...v1.0.1) (2022-07-14)

**Note:** Version bump only for package @aws-lambda-powertools/logger





# [0.12.0-rc.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.12.0-rc.0...v0.12.0-rc.1) (2022-07-14)

**Note:** Version bump only for package @aws-lambda-powertools/logger





# [0.12.0-rc.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.11.1-rc.0...v0.12.0-rc.0) (2022-07-14)


### Bug Fixes

* **logger:** POWERTOOLS_LOGGER_LOG_EVENT precedence is respected ([#1015](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1015)) ([1cbb4db](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/1cbb4db4daf776e12f7dc2b383ac7fa561b7bada))


### Reverts

* Revert "chore(release): v0.12.0-rc.0 [skip ci]" ([9397f1d](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/9397f1d3624eb0bfbeb5e4c2702ae51e558a5b4a))
* Revert "chore(release): v0.12.0-rc.0 [skip ci]" (#1017) ([51c18da](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/51c18da20db434f8b12f320e5074e3e0a146046e)), closes [#1017](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1017)





## [0.11.1-rc.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.11.0...v0.11.1-rc.0) (2022-06-24)

**Note:** Version bump only for package @aws-lambda-powertools/logger





# [0.11.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.10.0...v0.11.0) (2022-06-23)


### Features

* **logger:** add clear state functionality ([#902](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/902)) ([fa1dacb](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/fa1dacb001503a0a607e0951499119a1a9c61545))





# [0.10.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.9.1...v0.10.0) (2022-06-02)


### Features

* **all:** nodejs16x support ([#877](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/877)) ([d2b13c9](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/d2b13c945adb1a74b7c5f76d45f28a6979ce6429))
* **logger:** add removeKeys functionality ([#901](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/901)) ([a0f72c2](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/a0f72c275270db33d382bff357f6054f552197e6))





## [0.9.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.9.0...v0.9.1) (2022-05-24)


### Bug Fixes

* **logger:** enable logging of arbitrary objects ([#883](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/883)) ([5d34854](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/5d348543d3fbb48a98a9b2c34a1e8fa56b037adb))





# [0.9.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.8.1...v0.9.0) (2022-05-16)


### Bug Fixes

* **logger:** add xray_trace_id to every log ([#776](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/776)) ([11af21a](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/11af21ae236140e85d1503d355074c9ec254d90b))





## [0.8.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.8.0...v0.8.1) (2022-04-14)


### Bug Fixes

* **logger:** change logging to use stdout ([#748](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/748)) ([0781a47](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/0781a479a6ae3c794f94c72b59cd0920073159a2))





# [0.8.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.7.2...v0.8.0) (2022-04-08)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [0.7.2](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.7.1...v0.7.2) (2022-04-01)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [0.7.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.7.0...v0.7.1) (2022-03-17)


### Bug Fixes

* **logger:** enable sequential invocation in e2e test ([#658](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/658)) ([800424b](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/800424bc77223682ad6cdcc9f35080aff30ba91e))
* **logger:** fix handling of additional log keys ([#614](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/614)) ([8aab299](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/8aab29900c5fac8eb625eb747acbc23ceac8f6ba))





# [0.7.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.6.0...v0.7.0) (2022-03-08)


### Features

* **logger:** adopted Utility class & updated unit tests ([#550](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/550)) ([48f3487](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/48f34870d5bc3a5affcb70c8927859c56da6c5ff))





# [0.6.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.5.1...v0.6.0) (2022-02-17)


### Bug Fixes

* **logger:** fix logger attribute merging ([#535](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/535)) ([8180be1](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/8180be1ceb3f75bb7a35a7905cca867fb5eaa970))


### Features

* **logger:** add e2e tests for logger ([#529](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/529)) ([e736b65](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/e736b652c112b1c24c29eca8b1edfd87a79d1b2e))





## [0.5.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.5.0...v0.5.1) (2022-02-09)

**Note:** Version bump only for package @aws-lambda-powertools/logger





# [0.5.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.4.0...v0.5.0) (2022-01-26)


### Bug Fixes

* **examples:** fix errors in logger and metrics examples ([#509](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/509)) ([c19b47c](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/c19b47cb4cdb71e0ae404e9302226256d02fb7d5))
* **logger|metrics:** properly return decorated class ([#489](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/489)) ([014c5bd](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/014c5bd7d5c807064af8f04c16d297a8fe3bc0d9))


### Features

* **all:** make `@middy/core` optional ([#511](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/511)) ([1107f96](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/1107f96e9b4c678d34ee36757366f150d99be4dc))





# [0.4.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.3.3...v0.4.0) (2022-01-20)


### Features

* **logger:** JSDOCS support ([#491](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/491)) ([cd2c2d9](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/cd2c2d93a5822e26d3113a042be1dd0473aa6b2a))





## [0.3.3](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.3.2...v0.3.3) (2022-01-17)

**Note:** Version bump only for package @aws-lambda-powertools/logger





## [0.3.2](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.3.1...v0.3.2) (2022-01-17)


### Bug Fixes

* export LogFormatter + update docs ([#479](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/479)) ([7f91566](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/7f91566d4ff34887914009e2424df7c39a96cd71))





## [0.3.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.3.0...v0.3.1) (2022-01-14)


### Bug Fixes

* **all:** fix latest release broken by change of npm pack result on common ([#470](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/470)) ([2c3df93](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/2c3df9378ac191f6da6cb5f458f6227d6466cafa)), closes [#417](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/417)





# [0.3.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.2.0...v0.3.0) (2022-01-14)


### Bug Fixes

* **build:** Update contributing.md and fix npm ci ([#417](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/417)) ([279ad98](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/279ad984f71d5b157a13cffeab52602f2c09c1f8)), closes [#415](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/415) [#415](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/415)


### Features

* **all:** Update to examples use released version (0.2.0) ([#405](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/405)) ([d5e0620](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/d5e0620473f31d0839c027a76a88dcdcb98c84de))





# 0.2.0 (2022-01-05)

### Features

* *logger:* beta release (#24 (https://github.com/awslabs/aws-lambda-powertools-python/issues/24))

### Contributor List:

@alan-churley, @bahrmichael, @dreamorosi, @flochaz, @heitorlessa, @ijemmy and @saragerion
