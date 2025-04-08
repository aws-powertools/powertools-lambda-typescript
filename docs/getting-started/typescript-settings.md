---
title: Typescript Settings
description: Configuration settings for using Powertools with TypeScript
---

<!-- markdownlint-disable MD043 -->

While you can use the toolkit with JavaScript, using TypeScript is recommended.

The toolkit is written in TypeScript, and the type definitions are included in the package. This means you can take advantage of TypeScript's static typing and other features when using it.

We officially support TypeScript 5.0 and later, and our development is done using the latest version of TypeScript. We recommend using the latest version of TypeScript to take advantage of the latest features and improvements.

## TypeScript Configuration

The toolkit should work with most TypeScript configurations. The only requirement is that `experimentalDecorators` is set to `true` if you are using class method decorators. This is because we only support the legacy decorator proposal for now. We will support the new decorator proposal in the next major version of Powertools for AWS Lambda (TypeScript).

If you are looking for a starting point, the following `tsconfig.json` file is a good place to start. It includes the recommended settings along with some modern TypeScript features.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": [
      "es2022"
    ],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false
  },
  "exclude": [
    "node_modules"
  ]
}
```
