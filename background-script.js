var portFromContentScript;

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
    console.log("CRYPTO api: " + crypto);
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

/* 
 * BrowserModel maintains the state of the running browser engine.
 *
 * We are interested in being able to determine the following
 * attributes of the browser:
 *
 *  - number and identity of open browser windows
 *  - number and identity of open tabs per browser window
 *  - determining which window and which tab is currently active
 *
 * Each (window, tab, window-create-time, tab-create-time) tuple
 * uniquely identifies a tab.  This hash value unique to the lifespan
 * of the tab.  This is to work around the fact that tab-id values and
 * window-id values are reused.
 *
 * We do not
 *
 */
var BrowserEventListener = function(browserModel) {
    this.browserModel = browserModel;

    this.tabsOnCreatedListener = (tab) => {
        console.log("tabsOnCreatedListener invoked");
        // TODO: create a unique ID based on tabId, windowId and
        // createTime
        var tabId = tab.id;
        var windowId = tab.windowId;
        var createTimeMs = Date.now();

        var tabIdentity = createTimeMs.toFixed(1) + "_" + windowId.toFixed(1) + "_" + tabId.toFixed(1);

        this.browserModel.addNewTab(tabIdentity, tab);
    }
}

var BrowserModel = function() {

    this.tabs = {};
    this._listeners = new BrowserEventListener(this);

    this.getListener = () => {
        return this._listeners;
    }

    this.addNewTab = (tabIdentity, tab) => {
        this.tabs[tabIdentity] = tab;
        console.log("added a new tab with identity: [" + tabIdentity + "]");
    }

    /*
     * The BrowserModel only changes state using discrete commands.
     *
     * Valid model mutator commands
     *
     * msgClass |       msgCmd    |       msgPayload
     * -----------------------------------------------------------
     * window   |  create         |  {window: 'window-id', 'create_time': time_ms_epoch}
     * window   |  activate       |  {window: 'window-id'}
     * window   |  destroy        |  {window: 'window-id'}
     * window   |  currentActive  |  {window: 'window-id'}
     
     * tab      |  create         |  {window: 'window-id', tab: 'tab-id', 'create_time': time_ms_epoch}
     * tab      |  activate       |  {window_id, tab: 'tab-id'}
     * tab      |  destroy        |  {window_id, tab: 'tab-id'}
     * tab      |  currentActive  |  {window_id, tab: 'tab-id'}
     * tab      |  urlChange      |  {tab_id, old_url, new_url}
     *
     */

    /* Query commands
     *
     * status   |  tab            |  (tab_hash) -> {create_time, tab_duration, current_session, {tab_data} }
     * status   |  all            |  [{create_time, tab_duration, current_session}, ...]
     *
     */

    this.listenEvent = (msgClass, msgCmd, msgPayload) => {
        // TODO: dispatch incoming events to mutate the internal state
        // of this object
    }
}

/*
 * portConnected is invoked on initial connection of a port from the
 * content script to the background script
 */
function portConnected(p) {
  portFromContentScript = p;
  portFromContentScript.postMessage({greeting: "hi there content script!"});
  portFromContentScript.onMessage.addListener(function(m) {
    console.log("In background script, received message from content script")
    console.log(m.greeting);
  });
}


function registerListeners(fx) {
    // Listeners that are properly wired up
    browser.tabs.onCreated.addListener(fx.getListener().tabsOnCreatedListener);

    // listeners below this line are not properly wired in
    // ---------------------------------------------------

//    browser.tabs.onActivated.addListener(activatedListener);
//    browser.tabs.onAttached.addListener(attachedListener);
//
//    browser.webRequest.onBeforeRequest.addListener(onBeforeRequestListener, {urls: ["<all_urls>"]});
//    browser.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeadersListener, 
//                                                       {urls: ["<all_urls>"]}, 
//                                                       ["requestHeaders"]);
//    browser.webRequest.onBeforeRedirect.addListener(onBeforeRedirectListener, {urls: ["<all_urls>"]});
//    browser.webRequest.onResponseStarted.addListener(onResponseStartedListener, {urls: ["<all_urls>"]});
//
//    browser.windows.onFocusChanged.addListener(onFocusChangesListener);
//
//    // Now connect the port between the background-script and the
//    // content-script
//    browser.runtime.onConnect.addListener(portConnected);
//
//    browser.browserAction.onClicked.addListener(function() {
//      portFromContentScript.postMessage({greeting: "they clicked the button!"});
//    });
}


var fx = new BrowserModel();

function main() {
    registerListeners(fx);
}

// Kick off the background script
main();
