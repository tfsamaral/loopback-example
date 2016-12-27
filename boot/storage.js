'use strict'

const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const server = require('../server');
const utils = require('../utilities/common');

let storageSetup = {
  run: function (app) {
    //check if storage has bucket
    if (app.dataSources.storage.settings.bucket) {
      storageSetup.bucket = app.dataSources.storage.settings.bucket;
    } else {
      storageSetup.bucket = 'storage';
    }

    this.initializeDataFolder();
    this.createTempFolder();
    this.setupFileNames(app);
    this.initializeMulter(app);
  },
  initializeDataFolder: function () {
    let dataPath = path.join(__dirname, '../../.data/storage');
    utils.checkDirectorySync(dataPath);
  },
  createTempFolder: function () {
    let tempPath = path.join(__dirname, '../../.data/temp');
    utils.checkDirectorySync(tempPath);
  },
  initializeMulter: function (app) {
    let storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../.data/temp'));
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      }
    });

    app.use(multer({storage: storage}).any());
    // app.use(multer({dest: path.join(__dirname, '../../.data/temp')}).single('image'));
  },
  /*setupFileNames: function (app) {
   const FILENAME_PATTERN = '%MODEL%.%DATE%.%FILENAME%';
   app.dataSources.storage.connector.getFilename = function (file, req, res) {

   let modelName = req.remotingContext.methodString.split('.')[0].toLowerCase();
   let modelCode = storageSetup.assembleModelCodeName(req.params, modelName);
   let originalFilename = file.name;
   let parts = originalFilename.split('.');
   let extension = parts[parts.length - 1];

   // Remove extension from filename parts
   parts.pop();

   let newFilename = FILENAME_PATTERN
   //.replace('%MODEL%', modelCode)
   .replace('%DATE%', (new Date()).getTime().toString())
   .replace('%FILENAME%', parts.join('.'));

   newFilename = modelCode + '-' + crypto.createHash('md5').update(newFilename).digest('hex');
   return newFilename + '.' + extension;
   };
   },*/
  setupFileNames: function (app) {
    app.dataSources.storage.connector.getFilename = function (file, req, res) {

      let modelName = req.remotingContext.methodString.split('.')[0].toLowerCase();
      let modelCode = storageSetup.assembleModelCodeName(req.params, modelName);

      return utils.generateFileName(modelCode, file.name);
    };
  },
  assembleModelCodeName: function (modelInstance, type) {
    const CONTAINER_NAME_TEMPLATE = '%SUFFIX%_%INSTANCE_ID%';
    let suffix = storageSetup.defaultSuffix;

    storageSetup.modelList.some((modelInfo) => {
      if (type === modelInfo.modelName.toLowerCase()) {
        suffix = modelInfo.suffix;
        return true;
      }
    });

    return CONTAINER_NAME_TEMPLATE
      .replace('%INSTANCE_ID%', modelInstance.id)
      .replace('%SUFFIX%', suffix);
  },
  storageContainerModel: {},
  modelList: [
    // Add your storage covered models below
    {modelName: 'Product', suffix: 'p'},
    {modelName: 'Category', suffix: 'c'}
  ],
  defaultSuffix: 'global'
};

module.exports = function (server) {
  console.log('BOOT STORAGE');
  storageSetup.run(server);
};
