# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.1.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.0.2...v1.1.0) (2022-08-12)


### Bug Fixes

* **layers:** release process + remove duplicate code ([#1052](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1052)) ([f653c06](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/f653c065bd5586785e482d61d2738549d8ac9fd9))
* **logger:** fix clearstate bug when lambda handler throws ([#1045](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1045)) ([5ebd1cf](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/5ebd1cf44a2a3b6d99923e5bb942af3327325241))
* wrong scope in captureMethod ([#1026](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1026)) ([1a06fed](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/1a06fed74db02741c58bc05d8d5fce2e688d7879))


### Features

* **build:** publish lib as a Lambda Layer ([#884](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/884)) ([c3a20c6](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/c3a20c61380a6b6944807f5abf12c9cafb254325)), closes [#1031](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1031)





## [1.0.2](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v1.0.1...v1.0.2) (2022-07-19)

**Note:** Version bump only for package aws-lambda-powertools-typescript





## [1.0.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.12.0-rc.1...v1.0.1) (2022-07-14)

**Note:** Version bump only for package aws-lambda-powertools-typescript





# [0.12.0-rc.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.12.0-rc.0...v0.12.0-rc.1) (2022-07-14)


### Reverts

* Revert "build: bump lerna (#1014)" (#1018) ([623e12d](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/623e12de4c6c1dbc93d285e7d03426bff0802b38)), closes [#1014](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1014) [#1018](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1018)





# [0.12.0-rc.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.11.1-rc.0...v0.12.0-rc.0) (2022-07-14)


### Bug Fixes

* **logger:** POWERTOOLS_LOGGER_LOG_EVENT precedence is respected ([#1015](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1015)) ([1cbb4db](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/1cbb4db4daf776e12f7dc2b383ac7fa561b7bada))
* **tracer:** capture method throws errors correctly ([#1016](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1016)) ([fb85238](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/fb8523868e8d5e31c00a017ae1102ed31a0a4245))


### Features

* **tracer:** auto disable when running inside amplify mock ([#1010](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1010)) ([024d628](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/024d6286f9b9273becce825b5c6ca0db87d4c63a))


### Reverts

* Revert "chore(release): v0.12.0-rc.0 [skip ci]" ([9397f1d](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/9397f1d3624eb0bfbeb5e4c2702ae51e558a5b4a))
* Revert "chore(release): v0.12.0-rc.0 [skip ci]" (#1017) ([51c18da](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/51c18da20db434f8b12f320e5074e3e0a146046e)), closes [#1017](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/1017)





## [0.11.1-rc.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.11.0...v0.11.1-rc.0) (2022-06-24)

**Note:** Version bump only for package aws-lambda-powertools-typescript





# [0.11.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.10.0...v0.11.0) (2022-06-23)


### Features

* **logger:** add clear state functionality ([#902](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/902)) ([fa1dacb](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/fa1dacb001503a0a607e0951499119a1a9c61545))





# [0.10.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.9.1...v0.10.0) (2022-06-02)


### Bug Fixes

* **commons:** rename tests subfolder to samples to avoid being deleted by tools such as node-prune ([#882](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/882)) ([74ef816](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/74ef816830eca897d59881b1d260a146a2c9a47c))


### Features

* **all:** nodejs16x support ([#877](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/877)) ([d2b13c9](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/d2b13c945adb1a74b7c5f76d45f28a6979ce6429))
* **logger:** add removeKeys functionality ([#901](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/901)) ([a0f72c2](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/a0f72c275270db33d382bff357f6054f552197e6))





## [0.9.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.9.0...v0.9.1) (2022-05-24)


### Bug Fixes

* **logger:** enable logging of arbitrary objects ([#883](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/883)) ([5d34854](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/5d348543d3fbb48a98a9b2c34a1e8fa56b037adb))





# [0.9.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.8.1...v0.9.0) (2022-05-16)


### Bug Fixes

* added back fetch-depth: 0 ([#812](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/812)) ([494c742](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/494c742aefc9355ee431f433655ddd3fd7efebcf))
* **logger:** add xray_trace_id to every log ([#776](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/776)) ([11af21a](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/11af21ae236140e85d1503d355074c9ec254d90b))
* reintroduce token while checking out ([#848](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/848)) ([cabef3e](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/cabef3e515c9074dc178efca76de7c72c70370e3))
* removed token from remaining actions ([#805](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/805)) ([4fd9ecb](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/4fd9ecbde412f640deaeb17a997aae8a9f5841c0))


### Features

* **examples:** added sam example to workflows ([#849](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/849)) ([93f1c7b](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/93f1c7b55cb159dfcbbcb41149ccec7fd5db1660))





## [0.8.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.8.0...v0.8.1) (2022-04-14)


### Bug Fixes

* **logger:** change logging to use stdout ([#748](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/748)) ([0781a47](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/0781a479a6ae3c794f94c72b59cd0920073159a2))





# [0.8.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.7.2...v0.8.0) (2022-04-08)


### Features

* added captureHTTPsRequest feature ([#677](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/677)) ([5a36723](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/5a367233b3284c4b1c0c18caffd00e585afc9f55))





## [0.7.2](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.7.1...v0.7.2) (2022-04-01)

**Note:** Version bump only for package aws-lambda-powertools-typescript





## [0.7.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.7.0...v0.7.1) (2022-03-17)


### Bug Fixes

* **logger:** enable sequential invocation in e2e test ([#658](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/658)) ([800424b](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/800424bc77223682ad6cdcc9f35080aff30ba91e))
* **logger:** fix handling of additional log keys ([#614](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/614)) ([8aab299](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/8aab29900c5fac8eb625eb747acbc23ceac8f6ba))
* **tracer, metrics:** use polling instead of fixed wait in e2e tests ([#654](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/654)) ([6d4ab75](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/6d4ab751bc98eb823d2a68b4973fa9f8405971a2))





# [0.7.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.6.0...v0.7.0) (2022-03-08)


### Features

* **logger:** adopted Utility class & updated unit tests ([#550](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/550)) ([48f3487](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/48f34870d5bc3a5affcb70c8927859c56da6c5ff))
* **metrics:** adopted Utility class ([#548](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/548)) ([672e6a8](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/672e6a82a2c66f99153c63a53e9d31481afd897a))
* **tracer:** adopted Utility class & updated unit tests ([#549](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/549)) ([3769a69](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/3769a694725cc2a3fe6fb5f90fb045f73ea32a7c))





# [0.6.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.5.1...v0.6.0) (2022-02-17)


### Bug Fixes

* **logger:** fix logger attribute merging ([#535](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/535)) ([8180be1](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/8180be1ceb3f75bb7a35a7905cca867fb5eaa970))


### Features

* **commons:** centralize cold start heuristic ([#547](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/547)) ([4e4091f](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/4e4091f7b853c56a8dfd28829f09a066cc8e2ee7))
* **logger:** add e2e tests for logger ([#529](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/529)) ([e736b65](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/e736b652c112b1c24c29eca8b1edfd87a79d1b2e))





## [0.5.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.5.0...v0.5.1) (2022-02-09)


### Bug Fixes

* **tracer:** properly return DynamoDB.DocumentClient ([#528](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/528)) ([3559e7b](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/3559e7b19339a4649f235fb4af41c6b182da3df1))


### Reverts

* Revert "build(deps-dev): bump aws-cdk from 1.139.0 to 1.143.0 (#532)" (#544) ([e96c9ba](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/e96c9ba5bd4f738e5ed7c5850e06856a8c69bff1)), closes [#532](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/532) [#544](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/544)
* Revert "build(deps-dev): bump @aws-cdk/aws-lambda-nodejs from 1.139.0 to 1.143.0 (#531)" (#545) ([7dffbd8](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/7dffbd8708555fcc9817ea4373ccf71b0aea3c89)), closes [#531](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/531) [#545](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/545)





# [0.5.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.4.0...v0.5.0) (2022-01-26)


### Bug Fixes

* **examples:** fix errors in logger and metrics examples ([#509](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/509)) ([c19b47c](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/c19b47cb4cdb71e0ae404e9302226256d02fb7d5))
* **logger|metrics:** properly return decorated class ([#489](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/489)) ([014c5bd](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/014c5bd7d5c807064af8f04c16d297a8fe3bc0d9))


### Features

* Add codespaces/gitpod support ([#485](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/485)) ([ed6f258](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/ed6f258d6f8025bcfa9db3ea3d6a05a1338802e3))
* **all:** make `@middy/core` optional ([#511](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/511)) ([1107f96](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/1107f96e9b4c678d34ee36757366f150d99be4dc))
* **tracer:** add support for capturing DynamoDB DocumentClient ([#450](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/450)) ([621ae50](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/621ae50430e4459f90eaaa135eb0ed674b95e108))





# [0.4.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.3.3...v0.4.0) (2022-01-20)


### Features

* **logger:** JSDOCS support ([#491](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/491)) ([cd2c2d9](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/cd2c2d93a5822e26d3113a042be1dd0473aa6b2a))





## [0.3.3](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.3.2...v0.3.3) (2022-01-17)


### Bug Fixes

* lerna version not publishing all packages ([#480](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/480)) ([0cabc3f](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/0cabc3ff7b29fae8a01aeae56450d19737af3bba))





## [0.3.2](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.3.1...v0.3.2) (2022-01-17)


### Bug Fixes

* export LogFormatter + update docs ([#479](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/479)) ([7f91566](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/7f91566d4ff34887914009e2424df7c39a96cd71))
* updated CDK examples to remove old references & improve comments ([#439](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/439)) ([4cdaaea](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/4cdaaeaf7fbb24571b194c0e82338fbd216d2dcd))





## [0.3.1](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.3.0...v0.3.1) (2022-01-14)


### Bug Fixes

* **all:** fix latest release broken by change of npm pack result on common ([#470](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/470)) ([2c3df93](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/2c3df9378ac191f6da6cb5f458f6227d6466cafa)), closes [#417](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/417)





# [0.3.0](https://github.com/awslabs/aws-lambda-powertools-typescript/compare/v0.2.0...v0.3.0) (2022-01-14)


### Bug Fixes

* **build:** Fix linting issue and add linting to the pre-push hook ([#440](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/440)) ([e7bc53c](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/e7bc53c38b2a906c6952a83c5262db521ea468fb))
* **build:** Update contributing.md and fix npm ci ([#417](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/417)) ([279ad98](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/279ad984f71d5b157a13cffeab52602f2c09c1f8)), closes [#415](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/415) [#415](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/415)
* **metrics:** Rename purgeStoredMetrics() function usage in CDK example ([#424](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/424)) ([02f0eae](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/02f0eae2c378bd5562facf032fb94a25c69f66df))
* **tracer:** avoid throwing errors in manual instrumentation when running outside of AWS Lambda  ([#442](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/442)) ([fd02acb](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/fd02acbbe7de1cd0d1b00ae1cca68148a5114cbf))


### Features

* **all:** Update to examples use released version (0.2.0) ([#405](https://github.com/awslabs/aws-lambda-powertools-typescript/issues/405)) ([d5e0620](https://github.com/awslabs/aws-lambda-powertools-typescript/commit/d5e0620473f31d0839c027a76a88dcdcb98c84de))





# 0.2.0 (2022-01-05)

### Features

* *tracer:* beta release (#91 (https://github.com/awslabs/aws-lambda-powertools-python/issues/91))
* *logger:* beta release (#24 (https://github.com/awslabs/aws-lambda-powertools-python/issues/24))
* *metrics:* beta release (#25 (https://github.com/awslabs/aws-lambda-powertools-python/issues/25))

### Contributions

* chore(ci): auto-label PR on semantic title (#403) by @heitorlessa
* fix: documentation generation on on-release.yml workflow (#368) by @ijemmy
* fix: Remove publishing doc on develop version and fix missing leading 0 in version (#356) by @ijemmy
* feat: generate new version of doc for each release (#355) by @ijemmy
* chore(cicd): cdk examples and e2e tests for metrics  (#326) by @flochaz
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
* docs(all): clarifications & fixes  (#370) by @dreamorosi
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

### Contributor List:

@alan-churley, @bahrmichael, @dreamorosi, @flochaz, @heitorlessa, @ijemmy and @saragerion
