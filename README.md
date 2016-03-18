# Facebook last post scroller

## Usage

When this script is enabled, the page will automatically scroll to the last viewed or marked story after clicking the "Scroll to last post" button.

By default, the last viewed story will be saved during each page refresh.

Another story can be marked as the last viewed story by clicking in the down arrow near the timestamp area of the story.

## Installation

This script relies on the user scripts extensions like Greasemonkey or Tampermonkey.

After installing the appropriate user scripts extension, the script will be installed after opening it in the navigator (the extension will ask you to confirm).

### Firefox

The [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) extension should be installed.

###  Google Chrome

The [Tampermonkey](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo?hl=en) extension should be installed.

## Implementation

Uses the [NodeCreationObserverJS](https://github.com/soufianesakhi/node-creation-observer-js) library.
