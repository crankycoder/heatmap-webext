/*
 * This script is injected into *every* page.
 * We probably want to add Jose crypto here as we can't get access to
 * the crypto APIs otherwise.
 */
document.body.style.border = "5px dotted red";

function mozilla_heatmap_guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

/*
 */
function inject_meta_tabident() {
    // check if the tag already exists, if it does - short circuit
    // and return the content
    var tabident_nodes = document.getElementsById('mozilla-heatmap-tabident');
    if (tabident_nodes.length > 0) {
        return tabident_nodes[0].content;
    }

    var meta = document.createElement('meta');
    meta.name = "mozilla-heatmap-tabident";
    meta.id = "mozilla-heatmap-tabident";
    meta.content = mozilla_heatmap_guid();
    // TODO: there may not e a head tag
    document.getElementsByTagName('head')[0].appendChild(meta);
    return meta.content;
}


var myPort = browser.runtime.connect({name:"port-from-cs"});

function main() {
    inject_meta_tabident();

    // Send init message to the background script
    myPort.postMessage({greeting: "hello from content script"});

    myPort.onMessage.addListener(function(m) {
        console.log("In content script, received message from background script: ");
        console.log(m.greeting);

    });

    document.body.addEventListener("click", function() {
        myPort.postMessage({greeting: "they clicked the page!"});
    });
}

main();
