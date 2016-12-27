'use strict';

let multer = require('multer');

module.exports = function (server) {
  console.log('BOOT ROUTER');

  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/', server.loopback.status());
  server.use(router);
};
