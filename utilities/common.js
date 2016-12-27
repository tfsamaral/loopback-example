'use strict';
const fs = require('fs');
const cfEnv = require('cfenv');
const crypto = require('crypto');
const appEnv = cfEnv.getAppEnv();
const shell = require('shelljs');
const objectId = require('mongodb').ObjectID;
const baseDate = new Date(2016, 1, 1);
const oneDayInSeconds = 86400000;
const FILENAME_PATTERN = '%MODEL%.%DATE%.%FILENAME%';

/**
 * Left pad a string
 * @param string
 * @param size
 * @param character
 * @returns {*}
 */
function leftPadString(string, size, character = ' ') {
  if (string.length >= size) {
    return string;
  }

  var paddingSize = size - string.length;
  var padding = '';
  for (var i = 0; i < paddingSize; i++) {
    padding += character;
  }
  return padding + string;
}

/**
 * Verify path existence, and create it on the fly
 * @param directory
 */
function checkDirectorySync(directory) {
  try {
    fs.statSync(directory);
  } catch (e) {
    shell.mkdir('-p', directory);
  }
}


function getApplicationUrl() {
  let baseUrl = app.get('baseUrl');
  baseUrl = baseUrl.replace(/\/$/, '');
  return baseUrl;
}

function assembleBrowserLink(id, hash, email) {
  email = encodeURIComponent(email);
  const baseUrl = getApplicationUrl();
  const url = `invoice/${id}?key=${hash}&email=${email}`;

  return `${baseUrl}/${url}`;
}

function assembleLoanBrowserLink(id, hash, email) {
  email = encodeURIComponent(email);
  const baseUrl = getApplicationUrl();
  const url = `loan/${id}?key=${hash}&email=${email}`;

  return `${baseUrl}/${url}`;
}

function assemblePrintLink(id, hash, email) {
  email = encodeURIComponent(email);
  const baseUrl = getApplicationUrl();
  const url = `invoice/${id}?key=${hash}&email=${email}`;

  return `${baseUrl}/${url}`;
}

function assemblePdfLink(id, hash, email) {
  email = encodeURIComponent(email);
  const baseUrl = getApplicationUrl();
  const url = `api/invoice/${id}/pdf?key=${hash}&email=${email}`;

  return `${baseUrl}/${url}`;
}

function assembleUserActivationLink(user) {
  const baseUrl = getApplicationUrl();
  const url = `account/activate?id=${user.id}&token=${user.confirmationToken}`;

  return `${baseUrl}/${url}`;
}

function generateObjectId(count) {
  const timestamp = Math.floor(baseDate.getTime() * count * 1000);
  return objectId.createFromTime(timestamp);
}

function createFile(name, content) {
  return fs.writeFileSync(name, content);
}

/*
 generates proper date according with
 given "TODAY" milestone and days given
 */
function generateDate(today, days) {
  return new Date(today.getTime() + days * oneDayInSeconds);
}

function generateFileName(model, filename) {
  let parts = filename.split('.');
  let extension = parts[parts.length - 1];

  // Remove extension from filename parts
  parts.pop();

  let newFilename = FILENAME_PATTERN
    .replace('%DATE%', (new Date()).getTime().toString())
    .replace('%FILENAME%', parts.join('.'));

  newFilename = model + '-' + crypto.createHash('md5').update(newFilename).digest('hex');
  return newFilename + '.' + extension;
}

module.exports = {
  leftPadString: leftPadString,
  checkDirectorySync: checkDirectorySync,
  createFile: createFile,
  generateFileName: generateFileName,
  getApplicationUrl: getApplicationUrl,
  assembleBrowserLink: assembleBrowserLink,
  assembleLoanBrowserLink: assembleLoanBrowserLink,
  assemblePrintLink: assemblePrintLink,
  assemblePdfLink: assemblePdfLink,
  generateObjectId: generateObjectId,
  generateDate: generateDate,
  assembleUserActivationLink: assembleUserActivationLink
};
