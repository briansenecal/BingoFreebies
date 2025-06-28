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
        // After injection, read from storage
        chrome.storage.local.get("links", ({ links }) => {
          console.log("Restored links:", links);
          if (links && Array.isArray(links)) {
            document.getElementById("status").textContent = `${links.length} links found.`;
            // Add rendering here if needed
          } else {
            document.getElementById("status").textContent = "No links found.";
          }
        });
      }
    );
  });
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
