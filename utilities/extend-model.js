'use strict';
const fs = require('fs');
const path = require('path');

let extendModel = {
  extend: (Model) => {
    let filename = extendModel.assembleFilename(Model.modelName);

    extendModel.availableExtensions.forEach((extensionType) => {
      extendModel.apply(extensionType, filename, Model);
    });

    return Model;
  },
  apply: (extensionType, filename, Model) => {
    let fullPath = extendModel.assembleFullPath(extensionType, filename);

    if (fs.existsSync(fullPath)) {
      require(fullPath)(Model);
    }
  },
  assembleFilename: (modelName) => {
    let parts = modelName.split(/(?=[A-Z])/);

    parts = parts.map((word) => word.toLowerCase());
    return parts.join('-') + '.js';
  },
  assembleFullPath: (extensionType, filename) => {
    let extensionPath = path.join(__dirname, '..', extensionType);

    return (`${extensionPath}/${filename}`);
  },
  availableExtensions: ['hooks', 'remote_methods', 'validators']
};

module.exports = extendModel.extend;
