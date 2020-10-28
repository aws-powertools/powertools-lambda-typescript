# AWS Lambda Powertools (Typescript)
![Tests](https://github.com/awslabs/aws-lambda-powertools-typescript/workflows/Test/badge.svg?branch=main)
## Testing
The repo uses JEST tests, these can be run using

`npm run test`

Which will also generate coverage reports, and fail if the coverage is below the threshold.

## Code Styling and Linting
### Linting
Linting standards adhear to [tslint:recommended](https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts).

Please ensure you run `npm run lint` before comiting to check for styling errors

### Formating

The repo is setup using  [Prettier](https://prettier.io/). This will automatically make syntactic changes to files to
align them with the style guides. Please run this before creating a PR, and commit the changes.

`npm run format`

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.

