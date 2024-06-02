const nameConversion = {
    "Drunkdeer A75 US": "A75 ANSI",
    "Drunkdeer A75 ISO": "A75 ISO",
    "Drunkdeer A75 Pro US": "A75 Pro",
    "Drunkdeer G65": "G65",
    "Drunkdeer G60": "G60",
}

const filters = [
    {
        vendorId: 0x352D, productId: 0x2383, usagePage: 0xFF00, usage: 0x00
    },
    {
        vendorId: 0x352D, productId: 0x2386, usagePage: 0xFF00, usage: 0x00
    },
    {
        vendorId: 0x352D, productId: 0x2382, usagePage: 0xFF00, usage: 0x00
    },
    {
        vendorId: 0x352D, productId: 0x2384, usagePage: 0xFF00, usage: 0x00
    },
    {
        vendorId: 0x05AC, productId: 0x024F, usagePage: 0xFF00, usage: 0x00
    }
]

let preRequestContainer;
let postRequestContainer;

let deviceNameContainer;
let currentFirmwareVersionContainer;
let latestFirmwareVersionContainer;
let statusContainer;
let updateCheckButton;
let downloadButton;

let nonChromiumWarningContainer;

let checkingUpdate = false;

document.addEventListener("DOMContentLoaded", async () => {
    preRequestContainer = document.getElementById("pre-request-content")
    postRequestContainer = document.getElementById("post-request-content");

    deviceNameContainer = document.getElementById("device-name");
    currentFirmwareVersionContainer = document.getElementById("current-version");
    latestFirmwareVersionContainer = document.getElementById("latest-version");
    statusContainer = document.getElementById("status");
    downloadButton = document.getElementById("download-link");
    guideButton = document.getElementById("guide-link");

    updateCheckButton = document.getElementById("update-btn");

    nonChromiumWarningContainer = document.getElementById("non-chromium-warning");

    if (window.chrome === undefined) {
        nonChromiumWarningContainer.hidden = false;
    } else {
        updateCheckButton.disabled = false;
    }
});

async function checkUpdate() {
    if (checkingUpdate === true)
        return;

    checkingUpdate = true;

    if (navigator.hid === undefined) {
        statusContainer.textContent = "Your browser does not support HID";
    } else {
        const devices = await navigator.hid.requestDevice({ filters });

        if (devices === null || devices.length === 0) {
            statusContainer.textContent = "No devices found";
            checkingUpdate = false;
            return;
        }

        currentFirmwareVersionContainer.parentElement.classList.add("hidden");
        latestFirmwareVersionContainer.parentElement.classList.add("hidden");

        downloadButton.parentElement.classList.add("disabled");
        downloadButton.href = null;

        guideButton.parentElement.classList.add("disabled");
        guideButton.href = null;

        // for now only support one device at a time
        const device = devices[0];

        let websiteName = nameConversion[device.productName];

        const keyboard = new DrunkdeerKeyboard(device.productName, websiteName, device, null);
        await keyboard.init();

        let firmwareEntry = await getFirmwareEntryFor(keyboard);

        deviceNameContainer.textContent = keyboard.name;

        if (firmwareEntry === null) {
            statusContainer.textContent = "No firmware entry found";
        } else {
            // show the current and latest firmware versions
            currentFirmwareVersionContainer.parentElement.classList.remove("hidden");
            latestFirmwareVersionContainer.parentElement.classList.remove("hidden");

            currentFirmwareVersionContainer.textContent = keyboard.formattedVersion();
            latestFirmwareVersionContainer.textContent = firmwareEntry.formattedVersion();
            downloadButton.href = firmwareEntry.link;
            guideButton.href = firmwareEntry.guide;

            // keyboard might not be ready yet
            while (keyboard.ready === false) {
                await new Promise(r => setTimeout(r, 100));
            }

            if (firmwareEntry.version > keyboard.firmwareVersion) {
                statusContainer.textContent = "New firmware available";
                downloadButton.parentElement.classList.remove("disabled");
                guideButton.parentElement.classList.remove("disabled");
            } else if (firmwareEntry.version === keyboard.firmwareVersion) {
                statusContainer.textContent = "Up to date";
            } else {
                statusContainer.textContent = "You are in the future (or you have an internal build)";
            }
        }
    }

    preRequestContainer.classList.add("hidden");
    postRequestContainer.classList.remove("hidden");

    checkingUpdate = false;
}

function downloadFirmware() {
    if (!downloadButton.classList.contains("disabled") && downloadButton.href !== null)
        downloadButton.click();
}

function openInstallationGuide() {
    if (!guideButton.classList.contains("disabled") && guideButton.href !== null)
        guideButton.click();
}