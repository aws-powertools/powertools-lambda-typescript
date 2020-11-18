import {Logger, LogLevel} from '../../src';

describe('Logger Class', () => {
    test('Should return a valid instance', () => {
        const logger = new Logger();
    });
    describe('Instantiation Log levels', () => {
        afterEach(() => {
            delete process.env.LOG_LEVEL;
        })
        test('Should default to INFO if no level passed', () =>{
            const logger = new Logger();
            expect(logger.getCurrentLogLevel()).toBe(LogLevel.INFO);
        })
        test('Log level passed in constructor should be maintained', () => {
            const loggerDEBUG = new Logger({LogLevel: LogLevel.DEBUG});
            expect(loggerDEBUG.getCurrentLogLevel()).toBe(LogLevel.DEBUG);
            const loggerWARN = new Logger({LogLevel: LogLevel.WARNING});
            expect(loggerWARN.getCurrentLogLevel()).toBe(LogLevel.WARNING);
            const loggerCRITICAL = new Logger({LogLevel: 5});
            expect(loggerCRITICAL.getCurrentLogLevel()).toBe(LogLevel.CRITICAL);
        })
        test('Log level passed as ENV var should be set', () => {
            process.env.LOG_LEVEL = "ERROR";
            const logger = new Logger();
            expect(logger.getCurrentLogLevel()).toBe(LogLevel.ERROR);
        })
        test('Log level passed in constructor should override environment variable', () => {
            process.env.LOG_LEVEL = "ERROR";
            const logger = new Logger({LogLevel: LogLevel.CRITICAL});
            expect(logger.getCurrentLogLevel()).toBe(LogLevel.CRITICAL);
            process.env.LOG_LEVEL = "DEBUG";
            const loggerDEBUG = new Logger();
            expect(loggerDEBUG.getCurrentLogLevel()).toBe(LogLevel.DEBUG);
        })
        test('Invalid ENV param should throw warning, and set log level to INFO', () => {
            process.env.LOG_LEVEL = "ALERT";
            const logger = new Logger();
            expect(logger.getCurrentLogLevel()).toBe(LogLevel.INFO);
        })
    })
});

