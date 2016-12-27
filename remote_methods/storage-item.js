'use strict';

const fs = require('fs');

function disableRemoteMethods(storageItem) {
  let methodList = [
    {name: 'create', isStatic: true},
    {name: 'count', isStatic: true},
    {name: 'exists', isStatic: true},
    {name: '__count__accessTokens', isStatic: false},
    {name: '__create__accessTokens', isStatic: false},
    {name: '__delete__accessTokens', isStatic: false},
    {name: '__destroyById__accessTokens', isStatic: false},
    {name: '__findById__accessTokens', isStatic: false},
    {name: '__get__accessTokens', isStatic: false},
    {name: '__updateById__accessTokens', isStatic: false},
  ];

  methodList.forEach(method => {
    storageItem.disableRemoteMethod(method.name, method.isStatic);
  });
}

function registerRemoteMethods(storageItem) {
  let methodsDefinition = require('./storage-item.json');

  methodsDefinition.forEach(method => {
    storageItem.remoteMethod(method.handler, method.options);
  });
}

module.exports = (StorageItem) => {

  StorageItem.assembleUrl = (container, filename) => {
    return '/api/container/' + container + '/download/' + filename;
  };

  StorageItem.upload = (itemType, item, itemId, modelType,
                        req, res, callback) => {

    let bucket = StorageItem.app.dataSources.storage.settings.bucket;
    let StorageContainer = StorageItem.app.models.StorageContainer;

    StorageContainer.upload(req, res,
      {
        container: bucket
      },
      (error, uploadResult) => {
        if (error) {
          return callback(error);
        }

        if (!uploadResult.files.hasOwnProperty(itemType)) {
          let msg = 'Missing file';
          let error = new Error(msg);
          error.statusCode = error.status = 404;
          return callback(error);
        }

        let item = uploadResult.files[itemType][0];

        StorageItem.create({
          name: item.originalFilename,
          storageName: item.name,
          size: item.size,
          fileType: item.type,
          itemType: itemType,
          url: StorageItem.assembleUrl(bucket, item.name),
          containerId: bucket,
          modelType: modelType
        }, callback);
      });
  };

  StorageItem.uploadStream = (itemType, item, itemId, modelType,
                              path, filename, callback) => {

    let bucket = StorageItem.app.dataSources.storage.settings.bucket;
    let StorageContainer = StorageItem.app.models.StorageContainer;

    let stream = StorageContainer.uploadStream(bucket,
      filename);

    fs.createReadStream(path).pipe(stream);

    stream.on('error', (err) => {
      return callback(err);
    });

    stream.on('success', () => {
      let file = fs.statSync(path);

      //delete temp file
      fs.unlinkSync(path);

      StorageItem.create({
        name: filename,
        storageName: filename,
        size: file.size,
        fileType: '',
        itemType: itemType,
        url: StorageItem.assembleUrl(bucket, filename),
        containerId: bucket,
        modelType: modelType
      }, callback);
    });
  };

  StorageItem.uploadTemp = (itemType, req, res, callback) => {
    let StorageContainer = StorageItem.app.models.StorageContainer;

    StorageContainer.upload(req, res,
      {container: 'temp'},
      (error, uploadResult) => {
        if (error) {
          return callback(error);
        }

        if (!uploadResult.files.hasOwnProperty(itemType)) {
          let msg = 'Missing file';
          let error = new Error(msg);
          error.statusCode = error.status = 404;
          return callback(error);
        }

        let item = uploadResult.files[itemType][0];

        //TODO change this to something better! deletes temp file after 15min
        setTimeout(() => {
          let path = './.data/storage/temp/' + item.name;
          fs.unlink(path, function (err) {
            if (err) console.log('ERROR ' + err);
            console.log('successfully deleted ' + path);
          });
        }, 900000);

        callback(null, item);
      });
  };

};
