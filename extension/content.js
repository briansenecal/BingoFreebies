// content.js
console.log("✅ content.js loaded");
if (typeof Freebie === "undefined") {
  window.Freebie = class {
    constructor(section, source, linkType, web, general, VIP, expires, cooldownHours, lastClaimed) {
      this.section = section;
      this.source = source;
      this.linkType = linkType;
      this.web = web;
      this.general = general;
      this.VIP = VIP;
      this.expires = expires;
      this.cooldownHours = cooldownHours;
      this.lastClaimed = null;
    }

    get status() {
      if (!this.expires) return "Active";
      const now = new Date();
      const expiresDate = new Date(this.expires);
      const diff = expiresDate - now;
      const fourHours = 4 * 60 * 60 * 1000;
      if (diff > 0 && diff <= fourHours) return "Expiring Soon";
      if (diff <= 0) return "Expired";
      return "Active";
    }

    markClaimed() {
      this.lastClaimed = new Date().toISOString();
    }
  };

  window.FreebieManager = class {
    static saveFreebie(freebie, callback) {
      chrome.storage.local.get({ links: {} }, function (result) {
        let links = result.links;
        links[freebie.web] = {
          section: freebie.section,
          source: freebie.source,
          linkType: freebie.linkType,
          web: freebie.web,
          general: freebie.general,
          VIP: freebie.VIP,
          expires: freebie.expires,
          cooldownHours: freebie.cooldownHours,
          lastClaimed: freebie.lastClaimed,
        };
        chrome.storage.local.set({ links: links }, function () {
          if (callback) callback();
          console.log("Freebie saved:", freebie.web);
        });
      });
    }

    static getAllFreebies(callback) {
      chrome.storage.local.get({ links: {} }, function (result) {
        let freebies = [];
        for (let key in result.links) {
          let data = result.links[key];
          let freebie = new Freebie(
            data.section,
            data.source,
            data.linkType,
            data.web,
            data.general,
            data.VIP,
            data.expires,
            data.cooldownHours,
            data.lastClaimed
          );
          freebies.push(freebie);
        }
        callback(freebies);
      });
    }

    static clearAllFreebies(callback) {
      chrome.storage.local.set({ links: {} }, function () {
        if (callback) callback();
        console.log("All freebies cleared.");
      });
    }
  };
}


window.parseLinks = window.parseLinks || (() => {
  var collecting = false;
  var collectedHTML = [];
  var elements = document.querySelectorAll("*");

  var fullHTML = document.documentElement.outerHTML;
  var startPos = fullHTML.indexOf("# TODAY’S FREEBIES");
  var endPos = fullHTML.indexOf("#DailyCredits", startPos);
  var linkSection = fullHTML.substring(startPos, endPos);
  var sections = linkSection.split("#");

  // Array to hold each section with its freebies
  var sectionsFreebies = [];

  sections.forEach((sectionString) => {
    sectionString = sectionString.trim();
    if (sectionString.length === 0) return; // skip empty

    // Optional: get the first line as section name
    var firstLineBreak = sectionString.search(/\r?\n/);
    var sectionName =
      firstLineBreak !== -1
        ? sectionString.substring(0, firstLineBreak).trim()
        : sectionString.trim();

    // Split the rest into freebies
    var freebieArray = sectionString.split("____________");

    // Trim each freebie
    freebieArray = freebieArray
      .map((freebie) => freebie.trim())
      .filter((freebie) => freebie.length > 0);

    // Push structured object
    sectionsFreebies.push({
      section: sectionName,
      freebies: freebieArray,
    });
  });

  // ✅ MOVED INSIDE: Process each section and its freebies
  sectionsFreebies.forEach((sectionObj) => {
    var sectionName = sectionObj.section;
    sectionObj.freebies.forEach((freebieText) => {
      // Extract the source, web, general, VIP, expires, and cooldownHours
      //Use regex to remove all <span tags
      freebieText = freebieText.replace(/<span[^>]*>.*?<\/span>/gs, "");
      // Split the freebie text into lines

      var source = null;
      var linkType = null;
      var web = null;
      var general = null;
      var VIP = null;
      var expires = null;
      var cooldownHours = null;
      var expiresDateUTC = null;
      var isExpired = false;

      var lines = freebieText.split("\n");
      lines.forEach((line) => {
        line = line.trim();
        if (line.length === 0) return; // skip empty lines

        switch (true) {
          case /^[1-9]/.test(line):
            const linkTypeMatch = line.match(/\*\*\s*(.*?)\s*\*\*/);
            if (line.includes("Source")) {
              const sourceMatch = line.match(/Source:\s*(.*?)\s*,/i);
              if (sourceMatch) {
                source = sourceMatch[1].trim();
              }
              // ✅ FIXED REGEX HERE
              const expiresMatch = line.match(/Expires\s*(.*?\bUTC)\b/i);
              // Extract 'expires' from the line
              if (expiresMatch) {
                const expiresText = expiresMatch[1].trim();
                expires = parseExpiresUTC(expiresText, sectionName);
              }
            }
            break;
          case /^[GWV]/.test(line):
            const webMatch = line.match(/\[\[(https?:\/\/[^\s\]]+)\]/i);
            if (line.search(/^G/i) !== -1) {
              general = webMatch[1];
            }
            if (line.search(/^V/i) !== -1) {
              VIP = webMatch[1];
            }
            if (line.search(/^W/i) !== -1) {
              web = webMatch[1];
            }
            break;
          case /^\*/.test(line):
            source = "24 Hour Freebie";
            const now = new Date();
            const expiresDateUTC = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            expires = expiresDateUTC.toISOString();
            cooldownHours = 24;
            break;
        }
      });

      // Create a Freebie instance
      var freebie = new Freebie(
        sectionName,
        source,
        linkType,
        web,
        general,
        VIP,
        expires,
        cooldownHours,
        null
      );
      console.log("🔍 Saving freebie with web =", web);

      // Save the freebie using FreebieManager
      FreebieManager.saveFreebie(freebie);
    });
  });
});

function parseExpiresUTC(expiresText, currentSection) {
  const now = new Date();
  let expiresDateUTC = null;
  let isExpired = false;
  console.log("📦 expiresText =", expiresText, "| type:", typeof expiresText);
  const expiresNormalized = expiresText.toLowerCase();

  if (expiresNormalized.includes("midnight")) {
    // Always compute as today at 23:59 UTC
    expiresDateUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        0
      )
    );

    if (
      currentSection.includes("YESTERDAY") ||
      currentSection.includes("OLDER")
    ) {
      // Expired since yesterday's or older's midnight has passed
      isExpired = true;
    } else {
      isExpired = now >= expiresDateUTC;
    }
  } else if (expiresNormalized.includes("tomorrow")) {
    const utcTimeMatch = expiresNormalized.match(/(\d{1,2})\s*(am|pm)\s*utc/);
    let hourUTC = 23,
      minuteUTC = 59;
    if (utcTimeMatch) {
      hourUTC = parseInt(utcTimeMatch[1]);
      const period = utcTimeMatch[2];
      if (period === "pm" && hourUTC !== 12) hourUTC += 12;
      if (period === "am" && hourUTC === 12) hourUTC = 0;
      minuteUTC = 0;
    }
    // Tomorrow's date
    expiresDateUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        hourUTC,
        minuteUTC,
        0
      )
    );


  } else if (
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/.test(
      expiresNormalized
    )
  ) {
    const weekdayMatch = expiresNormalized.match(
      /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/
    );
    const timeMatch = expiresNormalized.match(/(\d{1,2})\s*(am|pm)\s*utc/);

    if (weekdayMatch) {
      const dayName = weekdayMatch[1];
      const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const targetDay = daysOfWeek.indexOf(dayName);
      let daysUntilTarget = (targetDay - now.getUTCDay() + 7) % 7;
      if (daysUntilTarget === 0) daysUntilTarget = 7; // next occurrence

      let hourUTC = 23,
        minuteUTC = 59;
      if (timeMatch) {
        hourUTC = parseInt(timeMatch[1]);
        const period = timeMatch[2];
        if (period === "pm" && hourUTC !== 12) hourUTC += 12;
        if (period === "am" && hourUTC === 12) hourUTC = 0;
        minuteUTC = 0;
      }

      expiresDateUTC = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + daysUntilTarget,
          hourUTC,
          minuteUTC,
          0
        )
      );
    }
  } else {
    // Attempt dd mmm yyyy
    const dateMatch = expiresNormalized.match(
      /(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i
    );
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const monthStr = dateMatch[2].toLower();
      const year = parseInt(dateMatch[3]);

      const months = {
        jan: 0,
        feb: 1,
        mar: 2,
        apr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        aug: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dec: 11,
      };

      const month = months[monthStr];
      expiresDateUTC = new Date(Date.UTC(year, month, day, 23, 59, 0));
    }
  }

  return expiresDateUTC.toISOString();
}

parseLinks();
