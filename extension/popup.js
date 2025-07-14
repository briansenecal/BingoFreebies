// popup.js

let bingoLinks = [];

document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        files: ["content.js"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "❌ Injection failed:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log("✅ Injection succeeded.");
        }
      }
    );
  });
});

document.getElementById("claimBtn").addEventListener("click", () => {
  if (bingoLinks.length === 0) {
    alert("No links to open!");
    return;
  }

  bingoLinks.forEach((link) => {
    chrome.tabs.create({ url: link, active: false });
  });
});
