---
title: Feature Flags
description: Utility
---

<!-- markdownlint-disable MD043 --->

The Feature Flags utility evaluates flags against caller-supplied context. It supports local rules in the [Powertools for Python Flag Document format](https://docs.aws.amazon.com/powertools/python/latest/utilities/feature_flags/){target="_blank"} and AWS AppConfig multi-variant flags evaluated by the AppConfig Agent.
See [RFC discussion #5614](https://github.com/aws-powertools/powertools-lambda-typescript/discussions/5614){target="_blank"} and [feature request #3754](https://github.com/aws-powertools/powertools-lambda-typescript/issues/3754){target="_blank"} for the design and use cases.

## Key features

* Evaluate boolean or JSON-valued flags using request context, schedules, and numeric modulo ranges
* Retrieve several flags with one Store call and an independent fallback for each flag
* Validate results and fallbacks with caller-provided Standard Schema validators
* Use AppConfig freeform documents, Agent-selected variants, or your own Store

### When to use Feature Flags

Feature flags change application behavior without changing its code. A static flag has one value for every request. A dynamic flag uses rules to select a value for the current context, such as a customer's tier.

| Use case | Utility |
| --- | --- |
| Retrieve a static configuration value, with no rule evaluation | [Parameters](parameters.md), using `getAppConfig` or `getConfig` |
| Evaluate local rules against request context or the clock | Feature Flags with a freeform Flag Document |
| Let AppConfig select a variant and its attributes | Feature Flags with `appConfigVariantStore` |

## Getting started

### Installation

Install the packages for the Store you use. Parameters and JMESPath are optional peers, so the core evaluator does not require either one.

=== "Local or custom Store"

    ```bash
    npm install @aws-lambda-powertools/feature-flags
    ```

=== "AppConfig SDK"

    ```bash
    npm install @aws-lambda-powertools/feature-flags @aws-lambda-powertools/parameters @aws-sdk/client-appconfigdata
    ```

=== "AppConfig Agent"

    ```bash
    npm install @aws-lambda-powertools/feature-flags @aws-lambda-powertools/parameters
    ```

=== "JMESPath envelopes"

    ```bash
    npm install @aws-lambda-powertools/jmespath
    ```

The envelope tab adds JMESPath to your chosen AppConfig installation. Agent-only imports do not load the AppConfigData SDK client.

| Import path | Exports | Additional dependencies |
| --- | --- | --- |
| `@aws-lambda-powertools/feature-flags` | `FeatureFlags`, `ruleEngineStore`, errors, public types | None |
| `@aws-lambda-powertools/feature-flags/appconfig` | `appConfigStore` | Parameters and `@aws-sdk/client-appconfigdata` |
| `@aws-lambda-powertools/feature-flags/appconfig-agent` | `appConfigAgentStore`, `appConfigVariantStore`, `disabledVariant` | Parameters, no SDK client |
| `@aws-lambda-powertools/feature-flags/envelope` | `search` with Powertools JMESPath functions | JMESPath |
| `@aws-lambda-powertools/feature-flags/errors` | Error classes | None |
| `@aws-lambda-powertools/feature-flags/types` | Core API and Store types | None |

### IAM permissions and the AppConfig Agent

| Store | Required function role permissions | Required layer |
| --- | --- | --- |
| `appConfigStore` | `appconfig:StartConfigurationSession`, `appconfig:GetLatestConfiguration` | None |
| `appConfigAgentStore`, `appConfigVariantStore` | `appconfig:StartConfigurationSession`, `appconfig:GetLatestConfiguration` | AWS AppConfig Agent Lambda extension |

On the Agent path, the extension uses the function role to retrieve configuration. Attach the [AWS AppConfig Agent Lambda extension layer for your region and architecture](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions-versions.html){target="_blank"}.

!!! note "Multi-variant Agent version"
    `appConfigVariantStore` requires AppConfig Agent Lambda extension version `2.0.678` or later, the first release that supports multi-variant flags. Check the extension version in the layer you deploy.

???+ tip "Prefetch configuration"
    Set `AWS_APPCONFIG_EXTENSION_PREFETCH_LIST` to your configuration path, such as `/applications/my-app/environments/prod/configurations/features`, to reduce cold-start latency. See the [Agent configuration options](https://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-integration-lambda-extensions-config.html){target="_blank"}.

### Evaluating a single flag

Create a Store and pass it to `FeatureFlags`. The local Store below evaluates `checkout_v2` for premium customers. The `context` is optional; the utility does not read facts from the event or environment for you.

```typescript title="Evaluate a local rule" hl_lines="19 23-27"
--8<-- "examples/snippets/feature-flags/ruleEngineStore.ts"
```

1. This is the caller's fallback for a missing flag or an availability failure. It does not override the Flag Document's `default`.

`evaluate` requires a `default` fallback. It returns that fallback when the flag is missing or the Store is unavailable, never `undefined`. If the flag exists but no Rule matches, it returns the Flag Document's `default`, not the caller's fallback.

| Fallback without a schema | Result type | Runtime check on a found value |
| --- | --- | --- |
| Boolean | `boolean`, not a boolean literal type | Must be a boolean |
| Number | `number`, not a number literal type | Must be a number |
| String | `string`, not a string literal type | Must be a string |
| Object, array, or `null` | `JSONValue` | No structured type inferred from the fallback |

A primitive type mismatch throws `FlagValueTypeError`. Use a [schema](#validating-results-with-standard-schema) when you need a checked structured result type. Variant Stores instead require and return a full [Variant](#appconfig-multi-variant-flags).

### Evaluating several flags

Pass flag names and their fallbacks in `flags`. `evaluateMany` calls `Store.getMany` once and applies the fallback independently for each missing flag. Any configuration, operand, or result-validation error throws for the whole batch. It does not return partial results after an error.

```typescript title="Evaluate a batch with independent fallbacks" hl_lines="16-19"
--8<-- "examples/snippets/feature-flags/evaluateMany.ts"
```

### Getting enabled features

`getEnabledFeatures` calls `Store.getAll` once and returns enabled flag names in Store order. It omits missing flags and returns `[]` on an availability failure.

```typescript title="List enabled flag names" hl_lines="11-13"
--8<-- "examples/snippets/feature-flags/getEnabledFeatures.ts"
```

## Advanced

### Flag Document format

The local rule engine uses the Powertools for Python freeform JSON shape. Store it in an AppConfig **freeform** configuration profile, or return it from any asynchronous source. AppConfig's feature flag profiles use a different format and need the [Variant Store](#appconfig-multi-variant-flags).

```json title="Boolean and static flags" hl_lines="3-8 14"
--8<-- "examples/snippets/feature-flags/flagDocument.json"
```

| Field | Meaning |
| --- | --- |
| `default` | Required Flag Default when no Rule matches |
| `boolean_type` | Optional boolean, defaults to `true`. Set `false` for non-boolean `default` or `when_match` values |
| `rules` | Optional object keyed by Rule name. The first matching Rule wins |
| `when_match` | Required result of a matching Rule |
| `conditions` | Required non-empty array of Conditions within each Rule, joined with logical AND |
| `action`, `key`, `value` | Required Condition fields. `key` identifies a context fact or a fixed schedule key |

With `boolean_type: false`, a flag can return any JSON value, including arrays and objects.

```json title="A non-boolean flag" hl_lines="3 7"
--8<-- "examples/snippets/feature-flags/nonBooleanDocument.json"
```

### Actions

In this table, `a` is the context value at `key` and `b` is the Condition's `value`. Schedule Actions use the clock instead of context.

| Action | Meaning | Operand types |
| --- | --- | --- |
| `EQUALS` | `a` equals `b` using strict deep JSON equality | Any supported context value and JSON value |
| `NOT_EQUALS` | `a` does not equal `b` | Any supported context value and JSON value |
| `KEY_GREATER_THAN_VALUE` | `a > b` | Two numbers or two strings |
| `KEY_GREATER_THAN_OR_EQUAL_VALUE` | `a >= b` | Two numbers or two strings |
| `KEY_LESS_THAN_VALUE` | `a < b` | Two numbers or two strings |
| `KEY_LESS_THAN_OR_EQUAL_VALUE` | `a <= b` | Two numbers or two strings |
| `STARTSWITH` | `a` starts with `b` | Two strings |
| `ENDSWITH` | `a` ends with `b` | Two strings |
| `IN`, `KEY_IN_VALUE` | `a` is in `b` | `b` is an array, object, or string. See membership rules below |
| `NOT_IN`, `KEY_NOT_IN_VALUE` | `a` is not in `b` | Same as `IN` |
| `VALUE_IN_KEY` | `b` is in `a` | `a` is an array or string within the public context contract |
| `VALUE_NOT_IN_KEY` | `b` is not in `a` | Same as `VALUE_IN_KEY` |
| `ALL_IN_VALUE` | Every element of `a` is in `b` | Two arrays |
| `ANY_IN_VALUE` | At least one element of `a` is in `b` | Two arrays |
| `NONE_IN_VALUE` | No element of `a` is in `b` | Two arrays |
| `SCHEDULE_BETWEEN_TIME_RANGE` | Current time is within inclusive bounds | Key `CURRENT_TIME`; object with `START`, `END` in `HH:MM`, optional `TIMEZONE` |
| `SCHEDULE_BETWEEN_DATETIME_RANGE` | Current wall-clock datetime is within inclusive bounds | Key `CURRENT_DATETIME`; object with timezone-naive ISO8601 `START`, `END`, optional `TIMEZONE` |
| `SCHEDULE_BETWEEN_DAYS_OF_WEEK` | Current day is in `DAYS` | Key `CURRENT_DAY_OF_WEEK`; object with uppercase day-name array `DAYS`, optional `TIMEZONE` |
| `MODULO_RANGE` | Remainder of `a` divided by `BASE` is within inclusive bounds | Numeric `a`; object with integer `BASE`, `START`, `END` |

Membership follows Python's `in` semantics, with strict JSON equality:

| Container | Membership test | Needle types |
| --- | --- | --- |
| Array | Compare against each element | Any JSON value |
| Object | Check own keys, not values | Strings match keys. Numbers, booleans, and `null` do not match; arrays or objects throw |
| String | Check for a substring by Unicode code point | String only |

Objects can be Condition values, but not context values. For an empty context array, `ALL_IN_VALUE` and `NONE_IN_VALUE` match, while `ANY_IN_VALUE` does not.

### Evaluation semantics

Local contexts accept strings, numbers, booleans, and flat arrays of those values. Nested objects, nested arrays, `null`, and `undefined` throw `InvalidContextError`. The Variant Store has [stricter context restrictions](#variant-context).

| Rule | Behavior |
| --- | --- |
| Rule priority | Evaluate in document order; return the first matching Rule's `when_match` |
| Rule names | Reject empty names and array-index names such as `"10"`, because JavaScript would reorder them. Use names such as `rule_10` |
| Conditions | All Conditions must match. Evaluation short-circuits at the first non-match |
| Missing context key | Never matches, including negative Actions. Schedule Actions ignore caller context |
| Equality | Strict JSON comparison. Booleans never equal numbers; arrays compare in order; object key order does not matter |
| Strings | Order, prefixes, suffixes, and substrings use Unicode code points |
| Incompatible operands | Throw `ConditionEvaluationError`, identifying the flag, Rule, key, and Action without values |
| Local `enabled` | Use Python-style JSON truthiness: `false`, `0`, `""`, `null`, empty arrays, and empty objects are disabled |
| Variant `enabled` | Use the Agent response's explicit boolean field |

Non-empty arrays and objects are enabled, regardless of their contents. This differs from JavaScript's built-in truthiness for empty containers. `getEnabledFeatures` uses each Store result's `enabled` field, not its value's type.

### Time-based flags

Set the schedule Condition's fixed key and bounds in the document. `TIMEZONE` defaults to UTC and accepts named IANA zones, not fixed-offset strings. Day names run from `MONDAY` through `SUNDAY`.

=== "Flag Document"

    ```json title="Time, datetime, and day-of-week schedules" hl_lines="9-14 28-33 47-51"
    --8<-- "examples/snippets/feature-flags/scheduleDocument.json"
    ```

=== "Evaluation"

    ```typescript title="Evaluate a scheduled flag" hl_lines="8 12"
    --8<-- "examples/snippets/feature-flags/timeRange.ts"
    ```

| Schedule behavior | Result |
| --- | --- |
| Time bounds | Inclusive, including the entire start and end minutes |
| End time before start time | Range crosses midnight, such as `23:30` to `01:00` |
| Datetime bounds | Timezone-naive ISO8601 values. Set `TIMEZONE` separately; do not append `Z` or an offset |
| Daylight saving time | Compare wall-clock fields, matching Python. Both occurrences of a repeated fall-back time can match; spring-forward gaps do not become another time |
| Reversed datetime bounds | Valid document, but the Condition never matches |
| Clock | Read once per local Store call, after retrieval and validation, shared by all flags and Conditions in that call |

Use [`ruleEngineStore({ now })`](#injecting-a-clock) to test schedule boundaries without changing the system clock.

### Modulo ranges

`MODULO_RANGE` divides a numeric context value by `BASE` and compares the remainder with `START` and `END`. All three bounds must be integers and satisfy `0 <= START <= END <= BASE - 1`. The bounds are inclusive.

=== "Flag Document"

    ```json title="Select buckets 0 through 19" hl_lines="10-12"
    --8<-- "examples/snippets/feature-flags/moduloDocument.json"
    ```

=== "Evaluation"

    ```typescript title="Supply a numeric customer identifier" hl_lines="14"
    --8<-- "examples/snippets/feature-flags/moduloRange.ts"
    ```

The Action uses Python remainder semantics, not JavaScript `%` alone. With `BASE: 10`, `-1` has remainder `9`; fractional contexts also work. Boolean contexts throw `ConditionEvaluationError`, and boolean bounds fail document validation. This Action does not hash identifiers or reproduce AppConfig's traffic-splitting algorithm.

### Validating results with Standard Schema

Pass a [Standard Schema](https://standardschema.dev/){target="_blank"} validator in `schema` for `evaluate`, or a per-flag `schemas` map for `evaluateMany`. Install the validator library you choose. The utility does not bundle a validator.

```typescript title="Validate structured values and transform a date with Zod" hl_lines="19 25 29-33"
--8<-- "examples/snippets/feature-flags/standardSchema.ts"
```

The evaluator validates fallbacks before calling the Store. It returns the schema's validated output for both found values and fallbacks. A schema replaces the primitive type check and supplies the inferred result type. Transforms can return non-JSON values, such as `Date`.

Schemas must never produce `undefined`. TypeScript rejects such output types; runtime validation throws `FlagResultValidationError` if a validator still returns `undefined`. Validation issues also throw this error, whose message lists issue paths without validator messages or values.
If a validator throws, the error wraps the thrown value as its `cause`. Do not log the cause if it can contain sensitive values.

### Choosing a Store

| Store | Source format | Evaluation and retrieval cache |
| --- | --- | --- |
| `ruleEngineStore` | Python-format Flag Document from any async source | Local evaluation; source controls retrieval caching |
| `appConfigStore` | AppConfig freeform Flag Document | Local evaluation; Parameters caches retrieval |
| `appConfigAgentStore` | AppConfig freeform Flag Document | Local evaluation; Agent caches retrieval and polls |
| `appConfigVariantStore` | AppConfig feature flag profile | Agent evaluates, caches, and polls |
| Custom `Store` | Your implementation's results | Your implementation controls evaluation and retrieval |

#### Local rule engine

`ruleEngineStore({ source, now?, logger?, name? })` calls the asynchronous `source` on every Store call. The default Store name is `rule-engine`.

It validates the whole document and keeps the latest compiled snapshot. Unchanged serialized JSON content reuses validation, including a fresh equivalent object. Changed content or an in-place mutation triggers validation again. This is not a retrieval cache or a cache of evaluation results.
An invalid replacement document throws rather than serving the previous document. Returned structured values are copies, so callers cannot mutate the cached snapshot.

Empty documents and empty `rules` objects are valid. With a Store logger, validation warns about them once per new document content.

#### AppConfig freeform Stores

=== "AWS SDK"

    ```typescript title="Retrieve freeform flags with Parameters" hl_lines="2 9"
    --8<-- "examples/snippets/feature-flags/appConfigStore.ts"
    ```

=== "AppConfig Agent"

    ```typescript title="Retrieve freeform flags through the Agent" hl_lines="2 9"
    --8<-- "examples/snippets/feature-flags/appConfigAgentStore.ts"
    ```

| Option | SDK Store | Agent freeform Store | Description |
| --- | --- | --- | --- |
| `name` | Required | Required | Configuration profile name or ID |
| `environment` | Required | Required | Environment name or ID |
| `application` | Optional | Optional | Application name or ID; defaults to `POWERTOOLS_SERVICE_NAME` |
| `maxAge` | Optional | Not supported | Parameters retrieval cache duration in seconds. Default is `POWERTOOLS_PARAMETERS_MAX_AGE`, or 5 seconds |
| `awsSdkV3Client` | Optional | Not supported | Supply an AppConfigData client |
| `clientConfig` | Optional | Not supported | Configure a new SDK client. Ignored when `awsSdkV3Client` is supplied |
| `timeout` | Not supported | Optional | Agent request timeout in milliseconds, default `3000` |
| `envelope`, `envelopeSearchFn` | Optional pair | Optional pair | Select an embedded Flag Document |
| `logger` | Optional | Optional | Log local rule selection and document-validation warnings |

The SDK Store creates one Parameters `AppConfigProvider` per Store. Agent Stores always call the Agent's local endpoint and do not add a retrieval cache.

#### Envelopes

When a configuration contains other settings, provide `envelope` and `envelopeSearchFn` together to select its Flag Document. An incomplete pair throws `FeatureFlagsError` at Store construction. A selection of `null` or `undefined` throws `SchemaValidationError` instead of using a fallback.

=== "Store"

    ```typescript title="Select an embedded Flag Document" hl_lines="3 11-12"
    --8<-- "examples/snippets/feature-flags/envelope.ts"
    ```

=== "Configuration"

    ```json title="Configuration with embedded flags" hl_lines="4"
    --8<-- "examples/snippets/feature-flags/envelopeDocument.json"
    ```

The `search` helper from `/envelope` includes the [Powertools JMESPath functions](jmespath.md#built-in-jmespath-functions), such as `powertools_json`. You can supply your own search function instead. Envelopes apply to freeform Stores, not Agent-selected Variants.

#### Custom Stores

A custom Store is a plain object with `name`, `getMany`, and `getAll`. Import `Store` and `StoreResult` from the core or `/types` entry point. No base class is required.

```typescript title="An in-memory Store" hl_lines="7-25"
--8<-- "examples/snippets/feature-flags/customStore.ts"
```

Return `{ found: false }` for missing flags and `{ found: true, value, enabled }` for found flags. `getMany` receives the requested names and context; `getAll` receives context. Throw `StoreUnavailableError` for known availability failures so the evaluator can return fallbacks. Unexpected errors propagate.
A custom source passed to `ruleEngineStore` must use the same error contract; the local engine does not classify source errors.

### AppConfig multi-variant flags

`appConfigVariantStore` delegates rule evaluation to the Agent. It accepts `name`, `environment`, `application`, `timeout`, and `logger`, with the same retrieval defaults as the freeform Agent Store. It does not accept envelopes.

```typescript title="Evaluate Agent-selected Variants" hl_lines="3-4 20 23-24"
--8<-- "examples/snippets/feature-flags/variantStore.ts"
```

`FeatureFlags` infers `FeatureFlags<Variant>` from this Store. Every fallback must be a full Variant, not `false`; every result is a Variant. Schemas are not supported on Variant-backed instances.

| Variant field | Meaning |
| --- | --- |
| `enabled` | Explicit boolean returned by the Agent |
| `variant` | Agent's `_variant` name, or `default` for basic flags without `_variant` |
| `attributes` | Remaining response fields, excluding `enabled` and `_variant`. Values are strings, finite numbers, booleans, or flat arrays of those |

`disabledVariant()` returns `{ enabled: false, variant: 'default', attributes: {} }`. You can supply another valid Variant fallback. Basic flags retain their actual `enabled` field and attributes; missing attributes become `{}`.

For one requested flag in Lambda, the Store uses `?flag=` and normalizes the unwrapped response. An empty successful single-flag response or a structured `NoSuchFlag` error means that flag is missing. For batches with several flags and for `getEnabledFeatures`, the Store fetches the whole profile once.
This preserves independent fallbacks when a basic profile would reject a selective batch containing an unknown flag. A batch normalizes only requested flags, so an unrelated malformed flag does not fail the batch.

#### Variant context

| Context requirement | Supported values |
| --- | --- |
| Keys | Match `^[A-Za-z_][A-Za-z0-9_.-]*$` |
| Values | Strings, finite numbers, or booleans |
| Unsupported | Arrays, objects, `null`, `undefined`, and non-finite numbers |

Invalid context throws `InvalidContextError` before retrieval. The Store passes context through Parameters [`getConfig`'s `agentOptions`](parameters.md#feature-flags-and-multi-variant-context). Parameters JSON-quotes strings and escapes non-ASCII characters in the Agent `Context` header.
It preserves commas, quotes, whitespace, and newlines without percent-encoding values or permitting header injection. The freeform Agent Store evaluates context locally and does not inherit these Agent context restrictions.

### Failure contract

The evaluator catches `StoreUnavailableError`, not every exception. Built-in AppConfig Stores classify known transport availability failures into this error.

| Situation | `evaluate` / `evaluateMany` | `getEnabledFeatures` |
| --- | --- | --- |
| Missing flag | That flag's fallback | Omit the flag |
| Timeout, connection failure, throttling or HTTP 429, service unavailability or HTTP 5xx | Fallbacks; one evaluator warning if a logger is set | `[]`; one evaluator warning if a logger is set |
| Opaque Agent 5xx, including a hidden configuration failure | Same availability fallback | `[]` |
| Access denied or authentication failure, including HTTP 401/403 | Throw | Throw |
| Missing application, environment, or configuration profile, including HTTP 404 | Throw, not a missing-flag fallback | Throw |
| Malformed document or response, invalid envelope, invalid context, or schema failure | Throw | Throw when applicable |
| Incompatible Condition operands or unexpected custom-Store error | Throw for the whole call | Throw |

!!! note "Opaque Agent errors"
    The Agent can hide a configuration failure behind an opaque 500 response. The utility treats it as unavailability. It throws for identifiable misconfiguration, but cannot recover a cause the Agent does not expose.

```typescript title="Let availability fallbacks work and handle other errors" hl_lines="15-16 18-23"
--8<-- "examples/snippets/feature-flags/failureHandling.ts"
```

All utility errors extend `FeatureFlagsError`. Import them from the core or `/errors` entry point.

| Error | When it is thrown |
| --- | --- |
| `FeatureFlagsError` | Base error; also an incomplete envelope option pair |
| `StoreUnavailableError` | Known availability failure from a Store; the evaluator catches it and returns fallbacks |
| `SchemaValidationError` | Invalid Flag Document, invalid Variant response, or an envelope that selects no document |
| `ConditionEvaluationError` | Incompatible local Action operands |
| `InvalidContextError` | Unsupported context values, or invalid Variant context keys |
| `FlagValueTypeError` | Found value differs from its primitive fallback type, or an invalid Variant fallback |
| `FlagResultValidationError` | Standard Schema issues, a validator that throws, or an `undefined` schema output |

Parameters retrieval, transformation, and configuration errors that are not availability failures propagate unchanged. They do not necessarily extend `FeatureFlagsError`. Search-function errors also propagate.

### Logging

Pass an optional `logger` to `FeatureFlags`. For each completed call, the evaluator emits one `debug` entry with the outcome, such as `found`, `partial`, or `fallback`. A call that returns any fallbacks emits one `warn` entry with `reason: 'missing'` or `reason: 'unavailable'`. Several missing flags in a batch still produce one evaluator warning.

```typescript title="Log call outcomes without flag values" hl_lines="7-12"
--8<-- "examples/snippets/feature-flags/logging.ts"
```

Store loggers are separate. A local Store logger emits per-flag debug entries for Rule or Flag Default selection, plus validation warnings for empty documents or empty `rules`. A Variant Store logger emits selected variant names. Passing the same logger to both the evaluator and the Store produces both sets of entries.

The utility does not log context values, Condition operands, fallbacks, flag values, or attributes. No logger means no utility output. Avoid logging raw error causes, which can contain validator details or transport response bodies.

### Differences from Powertools for Python

The local rule engine's conformance baseline is Powertools for Python **3.36.0**. These differences apply to local evaluation, not AppConfig's evaluator.

| Behavior | TypeScript | Python 3.36.0 |
| --- | --- | --- |
| Boolean/number equality and membership | Strict types; `true` is not `1` | Booleans can equal numbers |
| Incompatible Action operands | Throw `ConditionEvaluationError` | Warn and return a non-match |
| Array-index Rule names, such as `"10"` | Reject to preserve Rule order | Preserve their written order |
| Non-object `rules`, such as `[]`, `null`, or `false` | Reject | Falsy values can behave as absent rules |
| Boolean modulo context or bounds | Reject | Booleans can act as integers |
| `TIMEZONE` | Named IANA zones only | Can accept dateutil defaults or offset forms |
| Date-only datetime bound ending in `Z` | Reject during validation | Can pass validation before failing to parse during evaluation |

Missing-key non-matches, inclusive schedules, midnight rollover, and Python-style truthiness agree with the baseline. The local Store reads the clock once per call so all Conditions and flags agree on the instant; this is a consistency guarantee, not a different time comparison rule.

## Testing your code

### Using an in-memory Store

Supply a custom Store to test application behavior without AWS calls. Control its `value`, `enabled`, and missing-flag results independently of rule evaluation.

=== "handler.test.ts"

    ```typescript title="Test a batch and its missing-flag fallback" hl_lines="8 11-13 16"
    --8<-- "examples/snippets/feature-flags/testingYourCodeStore.ts"
    ```

=== "Store and handler"

    ```typescript title="Use an in-memory Store in application code" hl_lines="7-25"
    --8<-- "examples/snippets/feature-flags/customStore.ts"
    ```

### Testing local rules

Use `ruleEngineStore` with an inline document to exercise the real rule engine without mocking retrieval.

```typescript title="Test matching and non-matching contexts" hl_lines="15-28 33-35"
--8<-- "examples/snippets/feature-flags/testingYourCodeRuleEngine.ts"
```

### Injecting a clock

Supply `now: () => Date` to `ruleEngineStore`. All schedule Conditions in the Store call share this instant, so tests do not need fake global timers.

```typescript title="Test a schedule endpoint with a fixed clock" hl_lines="14"
--8<-- "examples/snippets/feature-flags/testingYourCodeClock.ts"
```

### Testing AppConfig Agent Stores

Outside Lambda, or with `POWERTOOLS_DEV` enabled, Agent Stores make no HTTP request. Set `POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE` to a JSON string containing the **whole profile**. A freeform Store expects a Flag Document; a Variant Store expects flag-keyed Agent results, even for a single flag.

=== "handler.test.ts"

    ```typescript title="Test normalized Variants in local mode" hl_lines="6-10 13 18"
    --8<-- "examples/snippets/feature-flags/testingYourCodeAgent.ts"
    ```

=== "handler.ts"

    ```typescript title="Handler using the Variant Store" hl_lines="15-34"
    --8<-- "examples/snippets/feature-flags/variantStore.ts"
    ```

=== "Local profile"

    ```json title="Whole-profile Agent response fixture" hl_lines="2-3"
    --8<-- "examples/snippets/feature-flags/variantProfile.json"
    ```

Local mode validates Variant context but does not evaluate AppConfig's rules against it. Supply the Agent results you want to test. Freeform Stores still evaluate local rules. Without a local profile value, both Agent Stores throw a Parameters `ParameterNotFoundError`, because the configuration is missing, rather than returning flag fallbacks.
