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

function activatedListener(activeInfo) {
    var tabId = activeInfo.tabId;
    var windowId = activeInfo.windowId;
    var gettingInfo = browser.tabs.get(tabId);
    gettingInfo.then((tab) => {
        console.log("[activeTab index: "+tab.index +" tabId: "+tabId+" url:" + tab.url + "]");
    });
}

function attachedListener(tabId, attachInfo) {
    var windowId = attachInfo.newWindowId;
    var newIndex = attachInfo.newWindowId;
    var gettingInfo = browser.tabs.get(tabId);
    gettingInfo.then((tab) => {
        console.log("[attachedTab windowId: "+windowId+" newIndex: "+newIndex+" oldTabId:"+tabId+" url:" + tab.url + "]");
    });
}

// This is probably not useful, as headers are not ready yet.  For
// that, you need to use onBeforeSendHeaders
function onBeforeRequestListener(details) {
    // console.log("onBeforeRequest: " + JSON.stringify(details));
};

// This is where the magic happens.  All headers have been set
// including (hopefully) the referrer
function onBeforeSendHeadersListener(details) {
    var headers = details.requestHeaders;
    console.log("onBeforeSendHeaders URL: " + details.url);
    console.log("onBeforeSendHeaders headers: " + JSON.stringify(headers));
}

// Redirects are mostly useful when disambiguating URL shortener links
function onBeforeRedirectListener(details) {
    console.log("onBeforeRedirect: " + JSON.stringify(details));
};


function onResponseStartedListener(details) {
    // Not sure if want to track sub_frame and media types,
    // var media_types = ["main_frame", "sub_frame", "media"];
    var media_types = ["main_frame"];
    if (media_types.indexOf(details.type) > -1) {
        console.log("onResponseStarted: " + JSON.stringify(details));
    }
};

// This is triggered when different browser *windows* are activated.
// It's important to track this as the onActivated event handler is
// not triggered.  We should probably just delegate
function onFocusChangesListener(windowId) {
    console.log("focusChanged windowId: " + windowId);
}

browser.tabs.onActivated.addListener(activatedListener);
browser.tabs.onAttached.addListener(attachedListener);

browser.webRequest.onBeforeRequest.addListener(onBeforeRequestListener, {urls: ["<all_urls>"]});
browser.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeadersListener, 
                                                   {urls: ["<all_urls>"]}, 
                                                   ["requestHeaders"]);
browser.webRequest.onBeforeRedirect.addListener(onBeforeRedirectListener, {urls: ["<all_urls>"]});
browser.webRequest.onResponseStarted.addListener(onResponseStartedListener, {urls: ["<all_urls>"]});

browser.windows.onFocusChanged.addListener(onFocusChangesListener);
