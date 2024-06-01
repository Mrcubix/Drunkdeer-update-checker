const versionRegex = /_v(\d+)_/;

// ------------------------------ Main Function ------------------------------ //

/**
 * Get the latest firmware version for the given keyboard
 * @param {Keyboard} keyboard
 * @returns {Promise<FirmwareEntry>?} The latest firmware version or null if an error occurred
 */
async function getFirmwareEntryFor(keyboard) {
    if (keyboard === null)
        return null;

    let doc = await fetchFirmwareDownloadPage();

    if (doc === null) {
        console.log("error fetching page");
        return null;
    }

    let tables = doc.getElementsByClassName("pf-inner-table");

    if (tables.length === 0) {
        console.log("no tables found");
        return null;
    }

    // the anchor in question is the a in the 4th column of the row with _blank target
    let row = FindDeviceRow(tables[0], keyboard.websiteName);

    let nameColumn = row.children[0];
    let name = nameColumn.textContent.trim();

    let linkColumn = row.children[3];
    let anchor = linkColumn.querySelector("a[target='_blank']");

    if (anchor === null) {
        console.log("no anchor found");
        return null;
    }

    let link = anchor.href;
    // "https://cdn.shopify.com/s/files/1/0671/4694/0719/files/drunkdeer_A75_us_v0017_20240511.zip?v=1715764103" for example
    console.log(link);

    // get the filename from the link
    let filename = anchor.pathname.split("/").pop();

    // extract version hex with regex "_v(\d+)_"
    let version = filename.match(versionRegex)[1];

    // convert hex version to decimal
    console.log("Latest Firmware Version: V0.0" + parseInt(version, 16));

    return new FirmwareEntry(name, parseInt(version, 16), link);
}

// ------------------------------ Fetching Functions ------------------------------ //

/**
 * Fetch the firmware download page
 * @returns {Promise<Document>} The page as a document or null if an error occurred
 */
async function fetchFirmwareDownloadPage() {
    let text = null;

    try {
        let request = await fetch("https://drunkdeer.com/pages/drunkdeer-antler");
        text = await request.text();
    }
    catch (error) {
        console.log("error fetching page: " + error);
        return null;
    }

    return parsePage(text);
}

// ------------------------------ Parsing Functions ------------------------------ //

/**
 * Find the row in the table that contains the keyboard name
 * @param {HTMLTableElement} table
 * @param {string} keyboardName
 * @returns {HTMLTableRowElement} The row containing the keyboard name or null if not found
 */
function FindDeviceRow(table, keyboardName) {
    // table -> tbody -> trs
    const rows = table.firstElementChild.children;
    let result;
    let found = false;

    if (rows.length === 0) {
        console.log("no rows found");
        return;
    }

    let row = rows[0];

    while (found === false && row.nextElementSibling != null) {
        row = row.nextElementSibling;
        let cells = row.children;

        // row has no cells
        if (cells.length === 0)
            continue;

        // check the first cell of the row's span for the name of the device
        let cell = cells[0];
        let name = cell.textContent.trim();

        if (keyboardName.includes(name)) {
            found = true;
            result = row;
        }
    }

    return result;
}

// ------------------------------ Helper Functions ------------------------------ //    

/**
 * Parse the given text into a document
 * @param {string} text
 * @returns {Document}
 */
function parsePage(text) {
    let parser = new DOMParser();
    return parser.parseFromString(text, "text/html");
}