function logCookie(c) {
    console.log(c);
}

function logError(e) {
    console.error(e);
}

function logTab(tab) {
    console.log("Found: " + tab.url);
}

function getActiveTab() {
    return browser.tabs.query({currentWindow: true, active: true});
}

function listener(activeInfo) {
    var tabId = activeInfo.tabId;
    var windowId = activeInfo.windowId;
    var gettingInfo = browser.tabs.get(tabId);
    gettingInfo.then((tab) => {
        console.log("[activeTab: " + tab.url + "]");
    });
}

browser.tabs.onActivated.addListener(listener)
