/**
 * Created by paschalidi on 2/12/17.
 */

"use strict";
const URL = require('url-parse');

var Crawler = function (input) {
  this.theUrl = input;
  this.baseProperties = new URL(input);
  this.baseUrl = this.baseProperties.protocol + "//" + this.baseProperties.hostname;

  this.pagesVisited = [];
  this.pagesToVisit = [];

  this.pagesToVisit.push(this.theUrl);
};

Crawler.prototype.selectNextPage = function () {
  this.nextPage = this.pagesToVisit.pop() || [];

  while (this.pagesVisited.includes(this.nextPage))
    this.nextPage = this.pagesToVisit.pop();
};

Crawler.prototype.setPageVisited = function () {
  if (!this.pagesVisited.includes(this.nextPage))
    this.pagesVisited.push(this.nextPage);
};

Crawler.prototype.updatePagesToVisit = function (aPage) {
  this.pagesToVisit.push(aPage);
};

module.exports = Crawler;
