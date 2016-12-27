'use strict';
const extendModel = require('../utilities/extend-model');

//TODO userId field generates random uuid for now until user API is developed

module.exports = (Review) => extendModel(Review);
