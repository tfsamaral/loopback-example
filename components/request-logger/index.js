'use strict';

// @TODO Implement unit testing

const _ = require('lodash');
const debug = require('debug')('loopback-component-lookatitude-logger');
const loopback = require('loopback');
const bodyParser = require('body-parser');
const loggerMiddleware = require('./lib/middleware/logger');
const baseModel = loopback.PersistedModel || loopback.DataModel;

let loggerComponent = {
  run: function (app, options) {
    debug('Initialized Component');

    this.initialize(app, options);

    let simpleModel = require('./models/request-log')(this.modelDefinition);

    let dataSource = app.dataSources[this.options.dataSource] ||
      app.dataSources[this.defaultOptions.dataSource];
    simpleModel.attachTo(dataSource);
    app.model(simpleModel);

    this.setupRolePermissions();
    this.initializeMiddleWare();
  },
  initialize: function (app, options) {
    options = options || {};
    this.options = _.defaults(options, this.defaultOptions);

    if (-1 === this.options.ignoredPaths.indexOf(this.options.path)) {
      this.options.ignoredPaths.push(this.options.path);
    }

    this.modelDefinition = this.loadModel('./models/request-log.json');
    this.modelDefinition.http = {path: this.options.path};
    this.app = app;
  },
  loadModel: function (jsonFile) {
    let modelDefinition = require(jsonFile);

    return baseModel.extend(
      modelDefinition.name,
      modelDefinition.properties,
      this.getSettings(modelDefinition)
    );
  },
  getSettings: function (def) {
    let settings = {};
    for (let s in def) {
      if (s === 'name' || s === 'properties') {
        continue;
      } else {
        settings[s] = def[s];
      }
    }
    return settings;
  },
  setupRolePermissions: function () {
    this.app.models.Role.registerResolver('logViewer',
      loggerComponent.logViewerResolver);
  },
  logViewerResolver: function (role, context, cb) {
    function reject() {
      process.nextTick(function () {
        cb(null, false);
      });
    }

    if (loggerComponent.modelDefinition.modelName !== context.modelName) {
      return reject();
    }

    let userId = context.accessToken.userId;
    if (!userId) {
      return reject();
    }


    let Role = loggerComponent.app.models.Role;
    let RoleMapping = loggerComponent.app.models.RoleMapping;
    let viewerRoles = loggerComponent.options.viewerRoles;
    Role.find({
      where: {'name': {inq: viewerRoles}}
    }).then(function (roles) {
      if (!roles) {
        reject();
      }

      let roleIds = roles.map(function (role) {
        return role.id;
      });

      RoleMapping.count({
        principalType: RoleMapping.USER,
        principalId: userId,
        roleId: {inq: roleIds}
      }).then(function (count) {
        cb(null, count > 0);
      }).catch(function (error) {
        console.error(error);
      });
    }).catch(function (error) {
      console.error(error);
    });
  },
  initializeMiddleWare: function () {
    //this.app.middleware('initial', bodyParser.json());

    this.app.middlewareFromConfig(
      loggerMiddleware,
      {
        phase: 'initial',
        params: {
          'ignoredPaths': this.options.ignoredPaths
        }
      }
    );
  },
  app: {},
  options: {},
  modelDefinition: {},
  defaultOptions: {
    'dataSource': 'db',
    'viewerRoles': [],
    'path': 'request-log',
    'ignoredPaths': []
  }
};

module.exports = function (app, options) {
  return loggerComponent.run(app, options);
};
