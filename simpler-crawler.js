/**
 * Created by paschalidi on 2/8/17.
 */

"use strict";
const URL = require('url-parse');
const Request = require("request-promise");
const Cheerio = require('cheerio');
const Readline = require('readline');
const fs = require('fs');

const logger = fs.createWriteStream('log.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
});

const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var CrawlingResults = function (page) {
  this.page = page;
  this.assets = [];
};

CrawlingResults.prototype.updateAssets = function (asset) {
  this.assets.push(asset)
};

CrawlingResults.prototype.writeInfoToStdout = function () {
  logger.write(JSON.stringify(this)); // again
};

CrawlingResults.prototype.writeErrorToStdout = function () {

};

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

  while (this.pagesVisited.includes(this.nextPage)) {
    this.nextPage = this.pagesToVisit.pop();
    console.log('*******')
  }
};

Crawler.prototype.setPageVisited = function () {
  if (!this.pagesVisited.includes(this.nextPage))
    this.pagesVisited.push(this.nextPage);
};

Crawler.prototype.updatePagesToVisit = function (aPage) {
  this.pagesToVisit.push(aPage);
};

function askInputFromUser() {
  rl.question('Please provide a url of theCrawler following form: https://www.example.com\n',
    function (keyboardInput) {
      if (isUrl(keyboardInput)) {
        crawlNextPage(new Crawler(keyboardInput));
        rl.close();
      }
      else {
        console.info("[!] Wrong input value.");
        askInputFromUser();
      }
    });
}

function crawlNextPage(theCrawler) {
  theCrawler.selectNextPage();

  if (theCrawler.nextPage)
    makeRequest(theCrawler);

  function makeRequest(theCrawler) {
    var options = {
      uri: theCrawler.nextPage,
      transform: function (body) {
        return Cheerio.load(body);
      }
    };
    var theCrawlingResult = new CrawlingResults(theCrawler.nextPage);

    console.log(theCrawler);
    console.log('VISITED    ----->', theCrawler.pagesVisited.length);
    console.log('STILL LEFT ----->', theCrawler.pagesToVisit.length);

    Request(options)
      .then(function ($) {
        theCrawler.setPageVisited();

        collectInternalLinks($, theCrawler, theCrawlingResult);
        collectInternalAssets($, theCrawler, theCrawlingResult);

        theCrawlingResult.writeInfoToStdout();

        if (theCrawler.pagesToVisit.length > 0)
          crawlNextPage(theCrawler)
      })
      .catch(function (error) {
        console.error("[!] Response error: ", error.name);
        console.log(theCrawler.nextPage);

        theCrawlingResult.writeErrorToStdout(error.name);

        if (theCrawler.pagesToVisit.length > 0)
          crawlNextPage(theCrawler)
      });
  }

  function collectInternalLinks($, theCrawler) {
    var relativeLinks = $("a[href^='/']");

    filterLinksAndUpdatePagesToVisit(relativeLinks, theCrawler, $);
  }

  function collectInternalAssets($, theCrawler, theCrawlingResult) {
    var relativeStylesheet = $("link[href^='/']");
    var relativeImages = $("img[src^='/']");
    var relativeJs = $("script[src^='/']");

    relativeStylesheet.each(function () {
      theCrawlingResult.updateAssets(theCrawler.baseUrl + $(this).attr('href'))
    });
    relativeImages.each(function () {
      theCrawlingResult.updateAssets(theCrawler.baseUrl + $(this).attr('src'))
    });
    relativeJs.each(function () {
      theCrawlingResult.updateAssets(theCrawler.baseUrl + $(this).attr('src'))
    });
  }

  function filterLinksAndUpdatePagesToVisit(links, theCrawler, $) {
    links.each(function () {
      var link = theCrawler.baseUrl + $(this).attr('href');
      if (!(theCrawler.pagesToVisit.includes(link))) {
        theCrawler.updatePagesToVisit(link);
      }
    });

  }

}

function isUrl(string) {
  var regexp = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
  return regexp.test(string);
}

askInputFromUser();





