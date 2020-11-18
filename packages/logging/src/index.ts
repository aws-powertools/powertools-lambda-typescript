enum LogLevel {
    DEBUG = 1,
    INFO = 2,
    WARNING = 3,
    ERROR = 4,
    CRITICAL = 5
}

interface LoggerConfig {
    LogLevel?: LogLevel;
}

class Logger {
    private CURRENT_LOG_LEVEL: LogLevel = LogLevel.INFO;

    constructor(config?: LoggerConfig) {
        config = config || {};
        this.setInitialLogLevel(config);
    }
    private setInitialLogLevel(config: LoggerConfig) {

        if (config.LogLevel) {
            this.CURRENT_LOG_LEVEL = config.LogLevel;
            return;
        }
        if (process.env.LOG_LEVEL) {
            const environmentVariableLevel = process.env.LOG_LEVEL;
            if (environmentVariableLevel in LogLevel) {
                this.CURRENT_LOG_LEVEL = LogLevel[environmentVariableLevel as keyof typeof LogLevel];
                return;
            }
            this.Warn(`LOG_LEVEL environment value was not valid, 
            Received ${environmentVariableLevel} and expected one of ${Object.keys(LogLevel).join(', ')}`);
        }
    }
    getCurrentLogLevel() {
        return this.CURRENT_LOG_LEVEL;
    }
    public Warn(message?: string) {
        //ToDo - change once logging has been established
    }
}

export {
    Logger,
    LogLevel
};



