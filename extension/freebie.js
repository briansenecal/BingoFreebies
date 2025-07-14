export class Freebie{
    constructor(section, source, linkType, web, general, VIP, expires, cooldownHours, lastClaimed) {
        this.section = section;
        this.source = source;
        this.linkType = this.type;
        this.web = web;
        this.general = general;
        this.VIP = VIP;
        this.expires = expires;
        this.cooldownHours = cooldownHours;
        this.lastClaimed = null;
        }

        get status() 
        {
            if (!this.expires) return "Active";

            const now = new Date();
            const expiresDate = new Date(this.expires);
            const diff = expiresDate - now; // milliseconds

            const fourHours = 4 * 60 * 60 * 1000;

            if (diff > 0 && diff <= fourHours) return "Expiring Soon";
            if (diff <= 0) return "Expired";
            return "Active";
        }
        markClaimed() {
            this.lastClaimed = new Date().toISOString();
        }
    }