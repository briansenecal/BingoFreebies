export class FreebieManager {
    static saveFreebie(freebie, callback) {
        chrome.storage.local.get({ links: {} }, function (result) {
            let links = result.links;

            // Use the web link as the unique key
            links[freebie.web] = {
                section: freebie.section,
                source: freebie.source,
                linkType: freebie.linkType,
                web: freebie.web,
                general: freebie.general,
                VIP: freebie.VIP,
                expires: freebie.expires,
                cooldownHours: freebie.cooldownHours,
                lastClaimed: freebie.lastClaimed
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
}
