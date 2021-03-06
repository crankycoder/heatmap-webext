var MESSAGE_PORT;

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
        // create a unique ID based on tabId, windowId and
        // createTime
        var tabId = tab.id;
        var windowId = tab.windowId;
        var createTimeMs = Date.now();

        this.browserModel.addNewTab(tab, createTimsMs);
    }

    /*
     * Invoked when a tab is attached to a window.  Note that this will
     * change the tab's windowId
     */
    this.tabsOnAttachedListener = (tabId, attachInfo) => {
        var newWindowId = attachInfo.newWindowId;
        var newIndex = attachInfo.newPosition;
        var gettingInfo = browser.tabs.get(tabId);
        gettingInfo.then((tab) => {
            console.log("[attachedTab newWindowId: "+newWindowId+" newIndex: "+newIndex+" tabId:"+tabId+" url:" + tab.url + "]");
             
            this.browserModel.updateTabIdentityNewWindowId(tab, newWindowId);
        });
    }


    this.tabsOnActivatedListener = (activeInfo) => {
        var tabId = activeInfo.tabId;
        var windowId = activeInfo.windowId;
        var gettingInfo = browser.tabs.get(tabId);

        gettingInfo.then((tab) => {
            // TODO: update the tab information using 
            this.browserModel.updateTab(tab);
        });
    }

}

var BrowserModel = function() {

    this.tabs = {};
    this._listeners = new BrowserEventListener(this);

    this.getListener = () => {
        return this._listeners;
    }

    /*
     * Dump the attributes of tabs.Tab into a JSON compatible
     * structure.
     *
     * All attribute names are taken from the tabs.Tab specification
     */
    this.updateTabJson = (tab, createTimeMs) => {
        var tabIdentity = this._computeTabIdentity(tab);
        var tabData = {};
        if (this.tabs[tabIdentity]) {
            tabData = this.tabs[tabIdentity];
        }
        tabData.active = tab.active;
        tabData.audible = tab.audible;
        tabData.cookieStoreId = tab.cookieStoreId;
        tabData.favIconUrl = tab.favIconUrl;
        tabData.height = tab.height;
        tabData.highlighted = tab.highlighted;
        tabData.id = tab.id;
        tabData.incognito = tab.incognito;
        tabData.index = tab.index;
        // skip mutedInfo
        tabData.openerTabId = tab.openerTabId;
        tabData.pinned = tab.pinned;
        tabData.selected = tab.selected;
        tabData.sessionId = tab.sessionId;
        tabData.status = tab.status;
        tabData.title = tab.title;
        tabData.url = tab.url;
        tabData.width = tab.width;
        tabData.windowId = tab.windowId;

        // Set a createTimeMs if URL exists
        if (tabData.url && !tabData.createTimeMs) {
            // TODO: this isn't working properly for the !createTimeMs
            // check
            tabData.createTimeMs = Date.now();
            console.log("Set createTimeMs for : " + tabData.url);
        }
        this.tabs[tabIdentity] = tabData;
    }

    this.updateTab = (tab) => {
        // TODO: we probably want to keep a journal of all tab
        // information by making a copy so that we can serialize to
        // disk
        this.updateTabJson(tab);
    }

    /*
     * A tab's identity within the BrowserModel is :
     * (createWindowId, tabId)
     */
    this._computeTabIdentity = (tab) => {
        var tabId = tab.id;
        var windowId = tab.windowId;

        var tabIdentity = windowId.toFixed(0);
        tabIdentity += "|";
        tabIdentity += tabId.toFixed(0);
        return tabIdentity;
    }

    /*
     * Find the old tabIdentity in this.tabs.keys()
     */
    this.updateTabIdentityNewWindowId = (tab, newWindowId) => {
        for (tabIdent of Object.keys(this.tabs)) {
            var identParts = tabIdent.split("|");
            var tmpTabId = parseInt(identParts[1]);
            if (tmpTabId === tab.id) {
                // Move the tab over to the new identity
                var newTabIdent = newWindowId.toFixed(0);
                newTabIdent += "|";
                newTabIdent += tmpTabId.toFixed(0);

                console.log("Moving from ["+tabIdent+"] to ["+newTabIdent+"]");
                this.tabs[newTabIdent] = this.tabs[tabIdent];

                // remove the old key
                delete this.tabs[tabIdent];
                console.log("===========");
                for (tmpIdent of Object.keys(this.tabs)) {
                    console.log("TabIdent: " + tmpIdent);
                }
                console.log("===========");
                break;
            }
        }
    }

    this.addNewTab = (tab, createTimeMs) => {
        this.updateTabJson(tab, createTimeMs);
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
}

/*
 * portConnected is invoked on initial connection of a port from the
 * content script to the background script
 */
function portConnected(p) {
    MESSAGE_PORT = p;
    // TODO: iterate over each tab and getOrSet tab identifiers within
    // the DOM of each tab.

    function getOrSetTabs(tabs) {
        for (tab of tabs) {
            // Communicate with the DOM of the tab to getOrSet the tabID
            // tab.url requires the `tabs` permission
            // console.log(tab.url);
        }
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var querying = browser.tabs.query({});
    querying.then(getOrSetTabs, onError);

    MESSAGE_PORT.onMessage.addListener(function(m) {
        console.log("In background script, received message from content script")
        console.log("TabIdentity received: ["+m.url+"]["+m.page_ident+"]");
        /*
         * TODO: run a check against the BrowserModel to make sure that this
         * tabident is registered with the heatmap
         */
    });

    // TODO: Send messages to communicate with a tab by including the tabident in the
    // payload body
    //    MESSAGE_PORT.postMessage({tabident: "background-script-tabident"});

}


function registerListeners(fx) {
    /*
     * We direclty wire in listeners in the BrowserEventListener
     */
    // Listeners that are properly wired up
    browser.tabs.onCreated.addListener(fx.getListener().tabsOnCreatedListener);
    browser.tabs.onActivated.addListener(fx.getListener().tabsOnActivatedListener);

    // Now connect the port between the background-script and the
    // content-script
    browser.runtime.onConnect.addListener(portConnected);

    browser.browserAction.onClicked.addListener(function() {
        MESSAGE_PORT.postMessage({greeting: "they clicked the button!"});
    });

    // listeners below this line are not properly wired in
    // ---------------------------------------------------

    browser.tabs.onAttached.addListener(fx.getListener().tabsOnAttachedListener);
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
}


var fx = new BrowserModel();

function main() {
    registerListeners(fx);
}

// Kick off the background script
main();
