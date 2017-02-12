/**
 * Created by paschalidi on 2/8/17.
 */

"use strict";
const Crawler = require('./static/Crawler.js');
const CrawlingResults = require('./static/CrawlingResults.js');

const Request = require("request-promise");
const Cheerio = require('cheerio');
const Readline = require('readline');

const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
    messageToConsole(theCrawler);
    var options = {
      uri: theCrawler.nextPage,
      transform: function (body) {
        return Cheerio.load(body);
      }
    };
    var theCrawlingResult = new CrawlingResults(theCrawler.nextPage);

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

        theCrawlingResult.updateAssets(error.name);
        theCrawlingResult.writeInfoToStdout();

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

  function messageToConsole(theCrawler) {
    console.log('-------------------------------------------');
    console.log('Now Visiting page :', theCrawler.nextPage);
    console.log('-------------------------------------------');
    console.log('[info] Already visited ' + theCrawler.pagesVisited.length + ' pages.');
    console.log('[info] Left to visit ' + theCrawler.pagesToVisit.length + ' pages.');
  }
}

function isUrl(string) {
  var regexp = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
  return regexp.test(string);
}

askInputFromUser();