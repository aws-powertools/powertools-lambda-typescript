---
title: Typescript Settings
description: Configuration settings for using with TypeScript
---

<!-- markdownlint-disable MD043 -->

While you can use the toolkit with JavaScript, using TypeScript is recommended.

The toolkit is written in TypeScript with bundled type definitions. We officially support TypeScript 5.0+ and recommend using the latest version to benefit from all features and improvements.

## TypeScript Configuration

If you use class method decorators, you must set `experimentalDecorators: true` in your tsconfig.json. This is because we currently support only the legacy decorator syntax. Support for the new decorator syntax will come in our next major release.  

The following `tsconfig.json` file is a good place to start and includes the recommended settings along with some modern TypeScript features.

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
