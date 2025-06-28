// content.js

(function extractLinks() {
  console.log("🔍 Content script running...");

  const matches = Array.from(document.body.innerHTML.matchAll(/https:\/\/play\.bingoblitz\.com\/[^\s"'<>]+/g));
  console.log(matches.map(m => m[0]));
  const realLinks = [...new Set(matches.map(m => m[0]))]
  .filter(link =>
  link &&
  link.includes("play.bingoblitz.com") &&
  link.includes("?incentive=")
);
  console.log("🧹 Unique links:", realLinks);
  chrome.storage.local.set({ links: realLinks });
})();
