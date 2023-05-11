module.exports = {
  env: {
    browser: false,
    es2020: true,
    jest: true,
    node: true,
  },
  ignorePatterns: ['coverage', 'lib'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'prettier'],
  settings: {
    'import/resolver': {
      node: {},
      typescript: {
        project: './tsconfig.json',
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowExpressions: true },
    ], // Enforce return type definitions for functions
    '@typescript-eslint/explicit-member-accessibility': 'error', // Enforce explicit accessibility modifiers on class properties and methods (public, private, protected)
    '@typescript-eslint/member-ordering': [
      // Standardize the order of class members
      'error',
      {
        default: {
          memberTypes: [
            'signature',
            'public-field',
            'protected-field',
            'private-field',
            'constructor',
            'public-method',
            'protected-method',
            'private-method',
          ],
          order: 'alphabetically',
        },
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error', // Disallow usage of the any type
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Disallow unused variables, except for variables starting with an underscore
    '@typescript-eslint/no-use-before-define': ['off'], // Check if this rule is needed
    'no-unused-vars': 'off', // Disable eslint core rule, since it's replaced by @typescript-eslint/no-unused-vars
    // Rules from eslint core https://eslint.org/docs/latest/rules/
    'array-bracket-spacing': ['error', 'never'], // Disallow spaces inside of array brackets
    'computed-property-spacing': ['error', 'never'], // Disallow spaces inside of computed properties
    'func-style': ['warn', 'expression'], // Enforce function expressions instead of function declarations
    'keyword-spacing': 'error', // Enforce spaces after keywords and before parenthesis, e.g. if (condition) instead of if(condition)
    'padding-line-between-statements': [
      // Require an empty line before return statements
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
    ],
    'no-console': 0, // Allow console.log statements
    'no-multi-spaces': ['error', { ignoreEOLComments: false }], // Disallow multiple spaces except for comments
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0, maxEOF: 0 }], // Enforce no empty line at the beginning & end of files and max 1 empty line between consecutive statements
    'no-throw-literal': 'error', // Disallow throwing literals as exceptions, e.g. throw 'error' instead of throw new Error('error')
    'object-curly-spacing': ['error', 'always'], // Enforce spaces inside of curly braces in objects
    'prefer-arrow-callback': 'error', // Enforce arrow functions instead of anonymous functions for callbacks
    quotes: ['error', 'single', { allowTemplateLiterals: true }], // Enforce single quotes except for template strings
    semi: ['error', 'always'], // Require semicolons instead of ASI (automatic semicolon insertion) at the end of statements
  },
};
