// ==UserScript==
// @name        Facebook last post scroller
// @namespace   https://github.com/soufianesakhi/facebook-last-post-scroller
// @author      Soufiane Sakhi
// @license		MIT licensed, Copyright (c) 2016 Soufiane Sakhi (https://opensource.org/licenses/MIT)
// @require     http://code.jquery.com/jquery.min.js
// @require     https://openuserjs.org/src/libs/soufianesakhi/node-creation-observer.min.js
// @include     https://www.facebook.com/?sk=h_chr
// @version     1.0.0
// @grant       GM_setValue
// @grant       GM_getValue
// ==/UserScript==

var storySelector = "[id^='hyperfeed_story_id']";
var storyLinkSelector = "div._5pcp > span > span > a._5pcq";
var lastPostButtonAppendSelector = "div._5pcp"
var blueBarId = "pagelet_bluebar";
var timestampAttribute = "data-timestamp";
var loadedStoryByPage = 10;

var lastPostIconLink = "https://cdn3.iconfinder.com/data/icons/watchify-v1-0-80px/80/arrow-down-80px-128.png";
var iconStyle = "vertical-align: middle; height: 20px; width: 20px; cursor: pointer;";

var lastPostSeparatorTitle = "End of new posts";
var scriptId = "FBLastPost";
var lastPostSeparatorId = scriptId + "Separator";
var lastPostURIKey = scriptId + "URI"
var lastPostTimestampKey = scriptId + "Timestamp"

var lastPostURI = GM_getValue(lastPostURIKey, "");
var lastPostTimestamp = GM_getValue(lastPostTimestampKey, 0);
var storyCount = 0;
var storyLoadObservers = [];
var loadedStories = [];
var checkedStories = [];
var previousScrollHeight;
var stopped = false;

$(document).ready(function() {
    NodeCreationObserver.onCreation(lastPostButtonAppendSelector, function(storyDetailsElement) {
        var storyElement = $(storyDetailsElement).closest(storySelector);
        var storyId = storyElement.attr('id');
        var lastPostIconId = getLastPostIconId(storyId);
        $(storyDetailsElement).append('<span id="' + lastPostIconId + '" > <abbr title="Set as last post"><img src="' + lastPostIconLink + '" style="' + iconStyle + '" /></abbr></span>');
        $("#" + lastPostIconId).click(function() {
            if (confirm("Set this post as the last ?")) {
                var storyElement = $(this).closest(storySelector);
                setLastPost(storyElement);
            }
        });
    });
    if (lastPostURI === "") {
        return;
    }
    NodeCreationObserver.onCreation(storySelector, function(element) {
        storyCount++;
        if (loadedStories.indexOf(element) == -1) {
            loadedStories.push(element);
        }
        if (storyCount % loadedStoryByPage == 0) {
            waitForStoriesToLoad(element.id, storyCount);
            return;
        }
        if (storyCount == 1) {
            searchForStory();
            setLastPost(element);
        } else if (storyCount == 2) {
            searchForStory();
            if (!stopped) {
                scrollToBottom();
                storyCount = 10;
            }
        }
    });
});

function setLastPost(storyElement) {
    var uri = getStoryURI(storyElement);
    var timestamp = getStoryTimestamp(storyElement);
    GM_setValue(lastPostURIKey, uri);
    GM_setValue(lastPostTimestampKey, timestamp);
}

function getLastPostIconId(storyId) {
    return scriptId + "-" + storyId;
}

function waitForStoriesToLoad(id, count) {
    var mutationObserver = new MutationObserver(function(elements, observer) {
        var loadedStories = storyCount - count;
        if (stopped) {
            observer.disconnect();
            return;
        }
        if (loadedStories > loadedStoryByPage - 1) {
            observer.disconnect();
            storyLoadObservers = removeFromArray(storyLoadObservers, observer);
            searchForStory();
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

function searchForStory() {
    loadedStories.forEach(function(element) {
        if (!stopped && checkedStories.indexOf(element) == -1) {
            var uri = getStoryURI(element);
            if (uri != null) {
                checkedStories.push(element);
                var ts = getStoryTimestamp(element);
                if (uri === lastPostURI) {
                    stopSearching(element.id);
                } else if (ts < lastPostTimestamp) {
                    stopSearching(element.id);
                    alert("The last post was not found (https://www.facebook.com" + uri + ")");
                }
            }
        }
    });
}

function getStoryTimestamp(storyElement) {
    return Number($(storyElement).attr(timestampAttribute))
}

function getStoryURI(storyElement) {
    var aLink = $(storyElement).find(storyLinkSelector);
    if (aLink != null) {
        return aLink.attr("href");
    }
    return null;
}

function stopSearching(id) {
    stopped = true;
    NodeCreationObserver.remove(storySelector);
    storyLoadObservers.forEach(function(observer) {
        observer.disconnect();
    });
    storyLoadObservers = [];
    prepareStory(id);
}

function prepareStory(id) {
    $("#" + id).before("<div id='" + lastPostSeparatorId + "' style='margin-bottom: 10px; text-align: center;'>" + lastPostSeparatorTitle + "</div>")
    var offsetHeight = document.getElementById(blueBarId).offsetHeight;
    var height = $("#" + lastPostSeparatorId).offset().top;
    window.scrollTo(0, height - offsetHeight);
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
