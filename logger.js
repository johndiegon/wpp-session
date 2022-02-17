const SimpleNodeLogger = require('simple-node-logger');

const manager = new SimpleNodeLogger();
manager.createConsoleAppender();
manager.createRollingFileAppender({
    logDirectory: 'logs',
    fileNamePattern: 'log-socket-<DATE>.log',
    dateFormat: 'DD.MM.YYYY',
    timestampFormat: 'DD-MM-YYYY HH:mm:ss.SSS'
});
const logger = manager.createLogger();

exports.logger = logger;