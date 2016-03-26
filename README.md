# Facebook last post scroller

## Usage

When this script is enabled, the page will automatically scroll to the last viewed or marked story after clicking the "Scroll to last post" button.

The script only works when the homepage is set to view most recent stories instead of top stories.

By default, the last viewed story will be saved during each page refresh. 

The first story is considered the last story unless you mark another story by clicking in the down arrow button near the timestamp area of the story.

## Installation

This script relies on the user scripts extensions like Greasemonkey or Tampermonkey.

After installing the appropriate user scripts extension, the script will be installed after opening it in the navigator (the extension will ask you to confirm).

### Firefox

The [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) extension should be installed.

###  Google Chrome

The [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) extension should be installed.

## Implementation

Uses the [NodeCreationObserverJS](https://github.com/soufianesakhi/node-creation-observer-js) library.
