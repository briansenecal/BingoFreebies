// content.js

(function extractLinks() {
  console.log("🔍 Content script running...");

  const anchors = Array.from(document.querySelectorAll("a"));

  const realLinks = anchors
    .map(a => {
      try {
        const href = a.href;
        const url = new URL(href);

        if (url.hostname === "l.facebook.com") {
          const redirectTarget = new URLSearchParams(url.search).get("u");
          if (redirectTarget) {
            return decodeURIComponent(redirectTarget);
          }
        } else {
          return href;
        }
      } catch (err) {
        console.warn("Skipping malformed URL:", a.href);
        return null;
      }
    })
    .filter(link =>
      link &&
      (link.includes("play.bingoblitz.com")
    ));

  console.log("📤 Sending extracted links to popup:", realLinks);

  chrome.runtime.sendMessage({ links: realLinks });
})();
