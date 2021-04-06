module.exports = {
  env: {
    'browser': false,
    'es2020': true,
    'jest': true,
    'node': true,
  },
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['tests/resources/*'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/ban-ts-ignore': ['off'],
    '@typescript-eslint/camelcase': ['off'],
    '@typescript-eslint/explicit-function-return-type': [ 'error', { 'allowExpressions': true } ],
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/indent': [ 'error', 2, { 'SwitchCase': 1 } ],
    '@typescript-eslint/interface-name-prefix': ['off'],
    '@typescript-eslint/member-delimiter-style': [ 'error', { 'multiline': { 'delimiter': 'none' } } ],
    '@typescript-eslint/member-ordering': [ 'error', {
      'default': { 'memberTypes': [
        'signature',
        'public-field', // = ["public-static-field", "public-instance-field"]
        'protected-field', // = ["protected-static-field", "protected-instance-field"]
        'private-field', // = ["private-static-field", "private-instance-field"]
        'constructor',
        'public-method', // = ["public-static-method", "public-instance-method"]
        'protected-method', // = ["protected-static-method", "protected-instance-method"]
        'private-method' // = ["private-static-method", "private-instance-method"]
      ] ,
      'order': 'alphabetically' }
    } ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-inferrable-types': ['off'],
    '@typescript-eslint/no-unused-vars': [ 'error', { 'argsIgnorePattern': '^_' } ],
    '@typescript-eslint/no-use-before-define': ['off'],
    '@typescript-eslint/semi': [ 'error', 'always' ],
    'array-bracket-spacing': [ 'error', 'always', { 'singleValue': false } ],
    'arrow-body-style': [ 'error', 'as-needed' ],
    'computed-property-spacing': [ 'error', 'never' ],
    'func-style': [ 'warn', 'expression' ],
    'indent': [ 'error', 2, { 'SwitchCase': 1 } ],
    'keyword-spacing': 'error',
    'newline-before-return': 2,
    'no-console': 0,
    'no-multi-spaces': [ 'error', { 'ignoreEOLComments': false } ],
    'no-multiple-empty-lines': [ 'error', { 'max': 1, 'maxBOF': 0 } ],
    'no-throw-literal': 'error',
    'object-curly-spacing': [ 'error', 'always' ],
    'prefer-arrow-callback': 'error',
    'quotes': [ 'error', 'single', { 'allowTemplateLiterals': true } ],
    'semi': [ 'error', 'always' ],
    'sort-imports': [ 'error', {
      'allowSeparatedGroups': true,
      'ignoreCase': true,
      'ignoreDeclarationSort': false,
      'ignoreMemberSort': true,
      'memberSyntaxSortOrder': [ 'all', 'single', 'multiple', 'none' ]
    } ]
  }
};