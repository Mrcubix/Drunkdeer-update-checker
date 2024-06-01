class FirmwareEntry {
    constructor(name, version, link, guide) {
        this.name = name;
        this.version = version;
        this.link = link;
        this.guide = guide;
    }

    formattedVersion() {
        return "V0.0" + this.version;
    }
}