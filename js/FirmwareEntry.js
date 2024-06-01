class FirmwareEntry {
    constructor(name, version, link) {
        this.name = name;
        this.version = version;
        this.link = link;
    }

    formattedVersion() {
        return "V0.0" + this.version;
    }
}