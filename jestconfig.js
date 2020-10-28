module.exports = {
    "transform": {
        "^.+\\.ts?$": "ts-jest"
    },
    "moduleFileExtensions": ["ts", "tsx", "js", "jsx", "json", "node"],
    "collectCoverageFrom": [
        "**/src/**/*.ts",
        "!**/node_modules/**"
    ],
    "testPathIgnorePatterns": [
        "node_modules"
    ],
    "testEnvironment": "node",
    "coverageThreshold": {
        "global": {
            "lines": 90,
            "statements": 90
        }
    },
    "coverageReporters": [
        "json-summary",
        "text",
        "lcov"]
}