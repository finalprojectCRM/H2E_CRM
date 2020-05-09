const { format, transports } = require('winston');
const { combine, timestamp, printf,metadata } = format;
const winston = require('winston'); // for transports.Console
const config = require('config');
const expressWinston = require('express-winston');
const {obj2Props} = require("./index");
const isHumanReadable = config.logging.humanReadable;

// App main logger.
const jsonFormater = printf(({ level, message, timestamp, metadata }) => {
    const meta = metadata.meta || metadata;
    return JSON.stringify({ timestamp, loglevel:level, message, ...meta});
});

const humanReadableFormater = printf(({ level, message, timestamp, metadata }) => {
    const meta = metadata.meta || metadata;
    return `${timestamp} ${level} ${message} ${obj2Props(meta,",")}`;
});
const mainLogger = winston.loggers.add("mainLogger",{
    defaultMeta:{component: config.server.name},
    format: combine(
        format.splat(),
        metadata(),
        timestamp(),
        isHumanReadable?format.colorize():format.uncolorize(),
        isHumanReadable?humanReadableFormater:jsonFormater
    ),
    transports: [new transports.Console()],
    level:config.logging.level,
    silent:config.logging.silent
});


const expressFormat = printf(({ level, timestamp, metadata }) => {
    const meta = metadata.meta;
    const keyValues = {
        httpCode: meta.res.statusCode,
        duration: meta.responseTime,
        httpMethod: meta.req.method,
        url: meta.req.url,
        FCID: meta.FCID,
        bytes:meta.contentLength,
        contentType:meta.contentType,
        action: "API_RESPONSE",
        port:meta.port
    };
    return JSON.stringify({ timestamp, loglevel:level, ...keyValues, component: config.server.name});
});

// Express logger.
const expressLoggerConf = {
    transports: [
        new winston.transports.Console()
    ],

    format: combine(
        format.splat(),
        metadata(),
        timestamp(),
        expressFormat
    ),

    statusLevels:true,
    meta: true,

    ignoredRoutes: [config.server.api.root + config.server.api.manageRoot + config.server.api.manageHealth,
        config.server.api.root + config.server.api.manageRoot + config.server.api.manageAlive,
        config.server.api.root + config.server.api.manageRoot + config.server.api.manageMetrics],
    dynamicMeta: function(req, res) {
        return {
            contentLength :res.getHeader('Content-Length'),
            contentType :res.getHeader('Content-Type'),
            FCID:req.FCID,
            port:req.socket.localPort
        };
    }
};
if (isHumanReadable) {
    expressLoggerConf.msg="HTTP Response {{res.statusCode}} {{res.responseTime}}ms {{req.method}} {{req.url}} FCID={{req.FCID}}";
    delete expressLoggerConf.format;
    expressLoggerConf.colorize=true;
    expressLoggerConf.meta=false;
    expressLoggerConf.winstonInstance=mainLogger;
}

const expressLogger = expressWinston.logger(expressLoggerConf);

exports.mainLogger = mainLogger;
exports.expressLogger = expressLogger;
