/**
 * Created by paschalidi on 2/8/17.
 */

"use strict";
const Crawler = require('./Crawler.js');
const CrawlingResults = require('./CrawlingResults.js');

const Request = require("request-promise");
const Cheerio = require('cheerio');
const Readline = require('readline');

const rl = Readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askInputFromUser() {
  rl.question('Please provide a url of the following form: https://www.someUrl.com\n',
    function (keyboardInput) {
      var candidateUrl = keyboardInput;

      Request(candidateUrl)
        .then(function () {
          crawlNextPage(new Crawler(candidateUrl));
          rl.close();
        })
        .catch(function () {
          console.info("[!] Wrong input value.");
          askInputFromUser();
        });
    });

  function crawlNextPage(theCrawler) {
    theCrawler.selectNextPage();

    if (theCrawler.nextPage) {
      messageToConsole(theCrawler);
      makeRequest(theCrawler);
    }

    function makeRequest(theCrawler) {
      var options = {
        uri: theCrawler.nextPage, transform: function (body) {
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
          console.error("[!]", theCrawler.nextPage);

          theCrawler.setPageVisited();
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

        theCrawler.updatePagesToVisit(link);
      });
    }

    function messageToConsole(theCrawler) {
      console.log('-------------------------------------------');
      console.log('Now Crawls page :', theCrawler.nextPage);
      console.log('[info] Left to visit ' + theCrawler.pagesToVisit.length + ' pages.');
    }
  }
}

module.exports.askInputFromUser = askInputFromUser;
