'use strict';
const async = require('async');
const crypto = require('crypto');
const loopback = require('loopback');

function registerRemoteMethods(Category) {
  let methodsDefinition = require('./category.json');

  methodsDefinition.forEach(method => {
    Category.remoteMethod(method.handler, method.options);
  });
}

module.exports = (Category) => {

  registerRemoteMethods(Category);

  Category.uploadImage = (req, res, id, callback) => {
    let StorageItem = Category.app.models.StorageItem;
    let modelCode = 'c_' + id;
    let modelId = id;
    let model = 'Category';

    async.parallel({
      item: asyncCallback => {
        console.log("Async Item");

        StorageItem.upload('image', modelCode, modelId,
          model, req, res, asyncCallback);
      },
      category: asyncCallback => {
        console.log("Async Category");

        Category.findById(id, asyncCallback);
      }
    }, (error, result) => {
      if (error) {
        console.log(error);
        return callback(error);
      }

      let item = result.item;
      let category = result.category;
      category.updateAttribute('image', item.url, (error, logoResult) => {
        if (error) {
          return callback(error);
        }

        return callback(null, logoResult);
      });
    });
  };

};
