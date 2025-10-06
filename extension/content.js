(() => {
  //listener delete when working
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      console.log("[BF] storage changed:", Object.keys(changes));
    }
  });
  // Run only in the top page, not iframes
  if (window.top !== window) {
    console.debug("BF: skipping subframe", location.href);
    return;
  }
  console.log("🚀 BingoFreebies content.js injected on", location.href);
  // content.js
  if (typeof window.Freebie === "undefined") {
    window.Freebie = class {
      constructor(
        section,
        contents,
        source,
        web,
        general,
        VIP,
        expires,
        cooldownHours,
        lastClaimed
      ) {
        this.section = section;
        this.contents = contents;
        this.source = source;
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
            contents: freebie.contents,
            source: freebie.source,
            web: freebie.web,
            general: freebie.general,
            VIP: freebie.VIP,
            expires: freebie.expires,
            cooldownHours: freebie.cooldownHours,
            lastClaimed: freebie.lastClaimed,
          };

          for (const [k, v] of Object.entries(links)) {
            try {
              JSON.stringify(v);
            } catch (e) {
              console.error("🚨 non-serializable value at key", k, v, e);
            }
          }

          try {
            chrome.storage.local.set({ links: links }, function () {
              if (chrome.runtime?.lastError) {
                console.error("set error:", chrome.runtime.lastError);
              } else {
                console.log("set success");
              }
              if (callback) callback();
              console.log("Freebie saved:", freebie.web);
            });
          } catch (e) {
            console.error("caught:", e);
          }
        });
      }

      static getAllFreebies(callback) {
        chrome.storage.local.get({ links: {} }, function (result) {
          let freebies = [];
          for (let key in result.links) {
            let data = result.links[key];
            let freebie = new Freebie(
              data.section,
              data.contents,
              data.source,
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

  window.parseLinks =
    window.parseLinks ||
    (() => {
      var collecting = false;
      var collectedHTML = [];
      var elements = document.querySelectorAll("*");
      startTitle = "All Active Freebie Links";
      var fullHTML = document.documentElement.outerHTML;
      fullHTML = fullHTML.replace(/<span.*?span>/gs, "");
      var startPos = fullHTML.indexOf(startTitle);
      startPos += startTitle.length;
      var endPos = fullHTML.indexOf("#DailyCredits", startPos);
      var linkSection = fullHTML.substring(startPos, endPos);
      linkSection = linkSection.replace(/\*/g, "");
      var sections = linkSection.split("# ");

      // Array to hold each section with its freebies
      var sectionsFreebies = [];

      sections.forEach((sectionString) => {
        sectionString = sectionString.trim();
        if (sectionString.length === 0) return; // skip empty

        // Optional: get the first line as section name
        var firstLineBreak = sectionString.search(/\r?\n/);
        var sectionName = "";
        if (firstLineBreak !== -1) {
          sectionName = sectionString.substring(0, firstLineBreak).trim();
          sectionString = sectionString
            .substring(firstLineBreak, sectionString.length)
            .trim();
        } else {
          sectionName = sectionString.trim();
        }

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
          //freebieText = freebieText.replace(/<span[^>]*>.*?<\/span>/gs, "");
          // Split the freebie text into lines

          var source = null;
          var contents = null;
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
              case /^\d{1,2}\./.test(line):
                contents = line.replace(/^\d{1,2}\.\s*/, "").trim();
                break;
              case line.includes("Source"):
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
              case /^\d-/.test(line):
                source = "24 Hour Freebie";
                const now = new Date();
                const expiresDateUTC = new Date(
                  now.getTime() + 24 * 60 * 60 * 1000
                );

                expires = expiresDateUTC.toISOString();
                cooldownHours = 24;
                break;
            }
          });

          // Create a Freebie instance
          var freebie = new Freebie(
            sectionName,
            contents,
            source,
            web,
            general,
            VIP,
            expires,
            cooldownHours,
            null
          );
          // Send the first viable link to the backend once per run
          if (!window.BF_sentOnce) {
            const linkToSend = freebie.web;
            if (linkToSend) {
              chrome.runtime.sendMessage(
                {
                  type: "BF_SEND_LINK",
                  link: linkToSend,
                },
                (resp) => console.log("[BF] sent to backend:", linkToSend, resp)
              );
              window.BF_sentOnce = true;
            }
          }

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
    return expiresDateUTC ? expiresDateUTC.toISOString() : null;
  }

  parseLinks();
  // temporary console hook
  window.BF = window.BF || {};
  window.BF.saveFreebie = FreebieManager.saveFreebie.bind(FreebieManager);
})();
