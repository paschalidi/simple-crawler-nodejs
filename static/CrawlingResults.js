/**
 *
 * Created by paschalidi on 2/12/17.
 */

"use strict";
const fs = require('fs');

const logger = fs.createWriteStream('./log.json', {
  flags: 'w+'
});

var CrawlingResults = function (page) {
  this.page = page;
  this.assets = [];
};

CrawlingResults.prototype.updateAssets = function (asset) {
  this.assets.push(asset)
};

CrawlingResults.prototype.writeInfoToStdout = function () {
  logger.write(JSON.stringify(this));
};

module.exports = CrawlingResults;