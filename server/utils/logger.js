import tracer from 'tracer';

let logger;
let errorLogger;

if (process.env.NODE_ENV == 'production') {
  logger = tracer.dailyfile({
    root: 'logs',
    maxLogFiles: 365,
    allLogsFileName: 'log',
    level: 3,  // log(0), trace(1), debug(2), info(3), warn(4), error(5), fatal(6)
    format: ['{{timestamp}} <{{title}}> {{file}}:{{line}}({{method}}()) {{message}}'],
    dateformat: 'yyyy-mm-dd HH:MM:ss',
    inspectOpt: {
      depth: 5
    }
  });

  errorLogger = tracer.dailyfile({
    root: 'logs',
    maxLogFiles: 365,
    allLogsFileName: 'error',
    level: 5,  // error(5), fatal(6)
    format: ['{{timestamp}} <{{title}}> {{file}}:{{line}}({{method}}()) {{message}}'],
    dateformat: 'yyyy-mm-dd HH:MM:ss',
    inspectOpt: {
      depth: 5
    }
  });
} else {
  logger = tracer.colorConsole({
    level: 0,  // log(0), trace(1), debug(2), info(3), warn(4), error(5), fatal(6)
    format: ['{{timestamp}} <{{title}}> {{file}}:{{line}}({{method}}()) {{message}}'],
    dateformat: 'yyyy-mm-dd HH:MM:ss',
    inspectOpt: {
      depth: 10
    }
  });

  errorLogger = tracer.colorConsole({
    level: 5,  // error(5), fatal(6)
    format: ['{{timestamp}} <{{title}}> {{file}}:{{line}}({{method}}()) {{message}}'],
    dateformat: 'yyyy-mm-dd HH:MM:ss',
    inspectOpt: {
      depth: 10
    }
  });
}

export { errorLogger };

export default logger;
