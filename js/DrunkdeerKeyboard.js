class DrunkdeerKeyboard {
    name = "";
    websiteName = "";
    device = null;
    firmwareVersion = "";
    ready = false;
    #onReport = []

    constructor(name, websiteName,device, reportHandler = null) {
        this.name = name;

        if (websiteName === null || websiteName === "")
            throw new Error("Website name is null or empty");

        this.websiteName = websiteName;
        this.device = device;

        if (reportHandler !== null)
            this.#onReport.push(reportHandler);

        if (this.device === null) {
            throw new Error("Device is null");
        }

        // device is not null at this point, let's try to get the name from the device
        if (this.name === null || this.name === "")
            this.name = this.device.productName;
    }

    async init() {
        if (this.device.opened === false)
            await this.device.open();

        this.device.oninputreport = (report) => this.#onReportInternal(report);

        await this.#fetchFirmwareVersion();
    }

    // ------------------------------ Public Functions ------------------------------ //

    formattedVersion() {
        return "V0.0" + this.firmwareVersion;
    }

    addHandler(handler) {
        this.#onReport.push(handler);
    }

    removeHandler(handler) {
        this.#onReport = this.#onReport.filter(h => h !== handler);
    }

    // ------------------------------ Private Functions ------------------------------ //

    #buildIdentityPacket() {
        const pktData = new Uint8Array(63);
        pktData[0] = 0xa0;
        pktData[1] = 0x02;
        return pktData;
    }

    async #fetchFirmwareVersion() {
        return await this.device.sendReport(4, this.#buildIdentityPacket());
    }

    #onReportInternal(report) {
        if (report.data.getUint8(0) === 0xa0)
            this.#onIdentityReport(report.data);
        else
            this.#onReport.forEach(handler => handler(report.data));
    }

    #onIdentityReport(report) {
        const byte8 = report.getUint8(7);
        const byte9 = report.getUint8(8);

        const version = Number(byte9.toString() + byte8.toString())
        this.firmwareVersion = version;

        console.log("Current Firmware Version: V0.0" + version);

        this.ready = true;
    }
}