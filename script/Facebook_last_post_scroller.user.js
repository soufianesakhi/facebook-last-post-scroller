// ==UserScript==
// @name        Facebook last post scroller
// @namespace   https://github.com/soufianesakhi/facebook-last-post-scroller
// @description Automatically scroll to the last viewed or marked Facebook story
// @author      soufianesakhi
// @license     MIT licensed, Copyright (c) 2016-2017 Soufiane Sakhi (https://opensource.org/licenses/MIT)
// @homepage    https://github.com/soufianesakhi/facebook-last-post-scroller
// @supportURL  https://github.com/soufianesakhi/facebook-last-post-scroller/issues
// @updateURL   https://github.com/soufianesakhi/facebook-last-post-scroller/raw/master/script/Facebook_last_post_scroller.user.js
// @downloadURL https://github.com/soufianesakhi/facebook-last-post-scroller/raw/master/script/Facebook_last_post_scroller.user.js
// @icon        https://cdn3.iconfinder.com/data/icons/watchify-v1-0-80px/80/arrow-down-80px-128.png
// @require     http://code.jquery.com/jquery.min.js
// @require     https://greasyfork.org/scripts/19857-node-creation-observer/code/node-creation-observer.js?version=174436
// @include     https://www.facebook.com/*
// @include     https://web.facebook.com/*
// @version     1.2.3
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

/// <reference path="../typings/index.d.ts" />

var storySelector = "[id^='hyperfeed_story_id']";
var subStorySelector = ".userContentWrapper";
var scrollerBtnPredecessorSelector = "#pagelet_composer";
var storyLinkSelector = "div._5pcp > span > span > a._5pcq";
var lastPostButtonAppendSelector = "div._5pcp";
var blueBarId = "pagelet_bluebar";
var timestampAttribute = "data-timestamp";
var loadedStoryByPage = 10;
var fbUrlPatterns = [
    new RegExp("https?:\/\/(web|www)\.facebook\.com\/\\?sk\=h_chr", "i"),
    new RegExp("https?:\/\/(web|www)\.facebook\.com\/?$", "i"),
    new RegExp("https?:\/\/(web|www)\.facebook\.com\/\\?ref\=logo", "i")];

var lastPostIconLink = "https://cdn3.iconfinder.com/data/icons/watchify-v1-0-80px/80/arrow-down-80px-128.png";
var iconStyle = "vertical-align: middle; height: 20px; width: 20px; cursor: pointer;";

var lastPostSeparatorTitle = "End of new posts";
var scriptId = "FBLastPost";
var menuId = "FBLastPostMenu";
var lastPostSeparatorId = scriptId + "Separator";
var lastPostURIKey = scriptId + "URI";
var lastPostTimestampKey = scriptId + "Timestamp";
var lastPostScrollerId = getId("Scroller");
var reverseSortLoaderId = getId("ReverseSortLoader");

var lastPostURI = GM_getValue(lastPostURIKey, null);
var lastPostTimestamp = GM_getValue(lastPostTimestampKey, 0);
var storyCount = 0;

/** @type {MutationObserver[]} */
var storyLoadObservers = [];
/** @type {Element[]} */
var loadedStories = [];
/** @type {Element[]} */
var checkedStories = [];
/** @type {Number} */
var previousScrollHeight;
var stopped = false;
var isMostRecentMode = false;
var isHome = false;
var currentURL = null;

$(document).ready(function () {
    initLastPostButtonObserver();
    initButtons();
});

function initLastPostButtonObserver() {
    NodeCreationObserver.onCreation(lastPostButtonAppendSelector, function (storyDetailsElement) {
        checkURLChange();
        if (!isHomeMostRecent()) {
            return;
        }
        var storyElement = $(storyDetailsElement).closest(storySelector);
        var storyId = storyElement.attr('id');
        var lastPostIconId = getId(storyId);
        $(storyDetailsElement).append('<span id="' + lastPostIconId + '" > <abbr title="Set as last post"><img src="' + lastPostIconLink + '" style="' + iconStyle + '" /></abbr></span>');
        $("#" + lastPostIconId).click(function () {
            if (confirm("Set this post as the last ?")) {
                var storyElement = $(this).closest(storySelector);
                setLastPost(storyElement);
            }
        });
    });
}

function getButton(id, title) {
    return '<button id="' + id
        + '" type="submit" style="margin-left: 2%; cursor: pointer;"><img src="'
        + lastPostIconLink + '" style="' + iconStyle + '" />' + title
        + '</button>';
}

function getMenu(children) {
    return '<div id="' + menuId + '" style="text-align: center;" >' + children + '</div>';
}

function initButtons() {
    NodeCreationObserver.onCreation(scrollerBtnPredecessorSelector, function (predecessor) {
        checkURLChange();
        if (!isHomeMostRecent()) {
            return;
        }
        var children = getButton(lastPostScrollerId, "Scroll to last post");
        children += getButton(reverseSortLoaderId, "Load last post and revese sort stories");
        $(predecessor).after(getMenu(children));
        $("#" + lastPostScrollerId).click(startLoading);
        $("#" + reverseSortLoaderId).click(startLoading);
    });
}

/**
 * @param {JQueryEventObject} eventObject 
 */
function startLoading(eventObject) {
    var reverseSort = eventObject.target.id === reverseSortLoaderId;
    $("#" + menuId).hide();
    NodeCreationObserver.onCreation(storySelector, function (element) {
        if (stopped) {
            return;
        }
        storyCount++;
        if (loadedStories.indexOf(element) == -1) {
            loadedStories.push(element);
        }
        if (storyCount % loadedStoryByPage == 0) {
            waitForStoriesToLoad(element.id, storyCount, reverseSort);
            return;
        }
        if (storyCount == 1) {
            if (lastPostURI == null) {
                NodeCreationObserver.remove(storySelector);
                stopped = true;
                return;
            }
            searchForStory(reverseSort);
        } else if (storyCount == 2) {
            searchForStory(reverseSort);
            scrollToBottom();
            storyCount = 10;
        }
    });
}

function checkURLChange() {
    var url = document.URL;
    if (url !== currentURL) {
        currentURL = url;
        isHome = matchesFBHomeURL();
        if (isHome) {
            checkMostRecentMode();
        }
    }
}

function isHomeMostRecent() {
    return isHome && isMostRecentMode;
}

function checkMostRecentMode() {
    var element = $("#stream_pagelet a[href^='/?sk=h_nor']");
    var elementExist = element.length == 1;
    isMostRecentMode = elementExist && element.is(':visible');
}

function matchesFBHomeURL() {
    var isHome = false;
    fbUrlPatterns.forEach(function (pattern) {
        if (pattern.test(currentURL)) {
            isHome = true;
        }
    });
    return isHome;
}

function setLastPost(storyElement) {
    var uri = getStoryURI(storyElement);
    var timestamp = getStoryTimestamp(storyElement);
    GM_setValue(lastPostURIKey, uri);
    GM_setValue(lastPostTimestampKey, timestamp);
    console.log("Setting last post: " + uri + " (timestamp: " + timestamp + ")");
}

function getId(elementId) {
    return scriptId + "-" + elementId;
}

/**
 * @param {string} id 
 * @param {number} count 
 * @param {boolean} reverseSort 
 */
function waitForStoriesToLoad(id, count, reverseSort) {
    var mutationObserver = new MutationObserver(function (elements, observer) {
        var loadedStories = storyCount - count;
        if (stopped) {
            observer.disconnect();
            return;
        }
        if (loadedStories > loadedStoryByPage - 1) {
            observer.disconnect();
            storyLoadObservers = removeFromArray(storyLoadObservers, observer);
            searchForStory(reverseSort);
        } else {
            scrollToBottom();
        }
    });
    storyLoadObservers.push(mutationObserver);
    mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

/**
 * @param {boolean} reverseSort 
 */
function searchForStory(reverseSort) {
    loadedStories.forEach(function (element) {
        if (!stopped && checkedStories.indexOf(element) == -1) {
            var uri = getStoryURI(element);
            if (uri != null) {
                checkedStories.push(element);
                var ts = getStoryTimestamp(element);
                if (uri === lastPostURI) {
                    stopSearching(element.id, reverseSort);
                } else if (ts < lastPostTimestamp && notSuggestedStory(element)) {
                    stopSearching(element.id, reverseSort);
                    console.log("The last post was not found: " + lastPostURI);
                    console.log("Stopped at the timestamp: " + ts);
                }
            }
        }
    });
}

function notSuggestedStory(storyElement) {
    if ($(storyElement).find("img[alt=explore]").length > 0) {
        return false;
    }
    var div = $(storyElement).find("._5g-l");
    return div.length == 0 || div.find(".profileLink").length > 0;
}

function getStoryTimestamp(storyElement) {
    return Number($(storyElement).attr(timestampAttribute));
}

function getStoryURI(storyElement) {
    var aLink = $(storyElement).find(storyLinkSelector);
    if (aLink != null) {
        return aLink.attr("href");
    }
    return null;
}

/**
 * @param {string} id 
 * @param {boolean} reverseSort 
 */
function stopSearching(id, reverseSort) {
    setLastPost(checkedStories[0]);
    stopped = true;
    NodeCreationObserver.remove(storySelector);
    storyLoadObservers.forEach(function (observer) {
        observer.disconnect();
    });
    storyLoadObservers = [];
    $("#" + id).before("<div id='" + lastPostSeparatorId + "' style='margin-bottom: 10px; text-align: center;'>" + lastPostSeparatorTitle + "</div>");
    if (reverseSort) {
        window.scrollTo(0, 0);
        var timestamps = [];
        var parent = $(checkedStories[0]).parent();
        for (var i = 1; i < checkedStories.length - 1; i++) {
            timestamps.push(getStoryTimestamp(checkedStories[i]));
            $(checkedStories[i]).detach().prependTo(parent);
        }
    } else {
        var offsetHeight = document.getElementById(blueBarId).offsetHeight;
        var height = $("#" + lastPostSeparatorId).offset().top;
        var y = height - offsetHeight;
        window.scrollTo(0, y > 0 ? y : 0);
    }
}

function removeFromArray(array, element) {
    var index = array.indexOf(element);
    if (index > -1) {
        return array.splice(index, 1);
    }
    return array;
}

function scrollToBottom() {
    var currentScrollHeight = document.body.scrollHeight;
    if (previousScrollHeight !== currentScrollHeight) {
        previousScrollHeight = currentScrollHeight;
        window.scrollTo(0, currentScrollHeight);
    }
}
