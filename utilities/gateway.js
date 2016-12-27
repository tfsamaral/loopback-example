'use strict';

const server = require('../server');
const request = require('request');
const async = require('async');
const modelConfig = require('./../model-config.json');
const appEnv = require('cfenv').getAppEnv();

let gateway = {
  url: '',
  apiUrl: '',
  init: function (app) {
    delete modelConfig._meta;

    if (appEnv.isLocal) {
      gateway.url = 'http://localhost:3000/register';
    } else {
      //TODO if in production
    }

    gateway.apiUrl = app.get('url') + 'api/';

    return {register: gateway.registerAPI};
  },
  registerAPI: () => {
    let services = gateway.assembleModels();
    // let apiUrl = app.get('url') + 'api/';

    if (services && services.length > 0) {
      let apiData = {name: 'catalog', url: gateway.apiUrl, services: services, versions: []};

      request.post({url: gateway.url, body: apiData, json: true}, (err, result, status) => {
        if (err) console.log(err);
        console.log('Catalog API registered with gateway!');
      })
    } else {
      console.log('No service registered on the gateway!');
    }
  },
  assembleModels: () => {
    let services = [];

    Object.keys(modelConfig).forEach((model) => {
      let modelName = model;
      let modelOpts = modelConfig[modelName];

      if (modelOpts.exposeService)
        services.push(modelName.toLowerCase());
    });

    return services;
  }
};

module.exports = (app) => gateway.init(app);

