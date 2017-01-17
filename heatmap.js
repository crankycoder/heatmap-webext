/*
 * This script is injected into *every* page.
 * We probably want to add Jose crypto here as we can't get access to
 * the crypto APIs otherwise.
 */
document.body.style.border = "5px dotted red";


var myPort = browser.runtime.connect({name:"port-from-cs"});

// Send init message to the background script
myPort.postMessage({greeting: "hello from content script"});

myPort.onMessage.addListener(function(m) {
    console.log("In content script, received message from background script: ");
    console.log(m.greeting);
});

document.body.addEventListener("click", function() {
    myPort.postMessage({greeting: "they clicked the page!"});
});
