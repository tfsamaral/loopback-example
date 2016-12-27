'use strict';

const debug = require('debug')('loopback:component:request:logger:logger');

module.exports = function requestLoggerMiddleware(options) {
  debug('Initializing logger middleware');

  return function logger(request, response, next) {

    let ignoreRequest = false;
    options.ignoredPaths.forEach(function (path) {
      if (request.originalUrl.match(path)) {
        ignoreRequest = true;
      }
    });

    if (ignoreRequest) {
      return next();
    }

    let app = request.app;
    let requestLog = app.models.requestLog;
    let startTime = new Date();

    response.on('finish', function () {
      let duration = (new Date() - startTime) / 1000;
      let remotingContext = request.remotingContext;

      let logEntry = {
        requestTime: startTime,
        requestMethod: request.method,
        requestUrl: request.originalUrl,
        requestBody: request.body,
        responseCode: response.statusCode,
        duration: duration.toFixed(4)
      };

      if (request.accessToken) {
        logEntry.userId = request.accessToken.userId;
      }

      if (remotingContext) {
        logEntry.responseBody = remotingContext.result;
      }
      requestLog.create(logEntry);
    });

    return next();
  };
};
