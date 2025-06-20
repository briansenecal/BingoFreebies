// popup.js

let bingoLinks = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.links && Array.isArray(message.links)) {
    bingoLinks = message.links;
    document.getElementById("status").textContent = `${bingoLinks.length} links found.`;
  }
});

document.getElementById("claimBtn").addEventListener("click", () => {
  if (bingoLinks.length === 0) {
    alert("No links to open!");
    return;
  }

  bingoLinks.forEach(link => {
    chrome.tabs.create({ url: link, active: false });
  });
});
