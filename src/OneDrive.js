/* global msal */

/**
 * UploadTarget implementation for uploading to Google Sheets, written
 * by Claude.ai and untested. Claude says:
 Setup:

 Register an Azure app at portal.azure.com, set the platform to
 Single-page application (SPA), and add your redirect URI. Grant
 the Files.ReadWrite delegated permission.
 Load MSAL from CDN:
html   <script src="https://alcdn.msauth.net/browser/3.27.0/js/msal-browser.min.js"></script>
 */
import UploadTarget from "./UploadTarget.js";

/**
 * Browser-compatible class for uploading rows of data to an Excel spreadsheet
 * stored in Microsoft OneDrive, via the Microsoft Graph API.
 *
 * Authentication is handled via the MSAL browser library.
 */

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const GRAPH_SCOPES = ["Files.ReadWrite", "User.Read"];
const SHEET_NAME = "Dives";

export default class OneDrive {

  constructor(name, components) {
    super(name, components);
    this.clientId = this.components[0]; // Azure app (client) ID.
    this.xlsx = this.components[1];
    const tenantId = "common"; // Azure tenant ID, or "common" / "organizations".
    const redirectUri = {}; // OAuth redirect URI. Defaults to window.location.origin.

    this._scopes = GRAPH_SCOPES;
    this._account = null;

    // Support both a pre-loaded global (CDN) and an ESM import of msal-browser
    const Msal = typeof msal !== "undefined" ? msal : window.msal;
    if (!Msal) {
      throw new Error("Microsoft OneDrive API not found. Are you offline?");
    }

    this._msal = new Msal.PublicClientApplication({
      auth: {
        clientId: this.clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: redirectUri ?? window.location.origin
      },
      cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
      },
    });
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  /**
   * Sign the user in using a popup window.
   * Stores the resulting account for subsequent token requests.
   *
   * @returns {Promise<object>} MSAL AccountInfo object
   */
  _signIn() {
    return this._msal.loginPopup({ scopes: this._scopes })
    .then(result => {
      this._account = result.account;
      return this._account;
    });
  }

  /**
   * Acquire a fresh access token silently (falling back to a popup if needed).
   *
   * @returns {Promise<string>} Bearer access token
   */
  _getAccessToken() {
    const accounts = this._msal.getAllAccounts();
    const account = this._account ?? accounts[0] ?? null;

    return this._msal.acquireTokenSilent({
      scopes: this._scopes,
      account
    })
    .then(result => {
      this._account = result.account;
      return result.accessToken;
    })
    .catch(() => {
      // Silent renewal failed — fall back to interactive popup
      return this._msal.acquireTokenPopup({ scopes: this._scopes })
      .then(result => {
        this._account = result.account;
        return result.accessToken;
      });
    });
  }

  // ─── Graph API ─────────────────────────────────────────────────────────────

  /**
   * Make an authenticated request to the Microsoft Graph API.
   *
   * @param {string}  method    HTTP method
   * @param {string}  endpoint  Graph path (e.g. "/me/drive/...")
   * @param {object}  [body]    Optional JSON body for PATCH / POST
   * @returns {Promise<object|null>}
   */
  _graphRequest(method, endpoint, body) {
    return this._getAccessToken()
    .then(token => fetch(`${GRAPH_BASE}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    }))
    .then(response => {
      if (!response.ok) {
        console.debug(`MSAL ${response.status} on ${method} ${endpoint}`);
        throw new Error(response.status);
      }

      return response.status === 204 ? null : response.json();
    });
  }

  /**
   * Get the used range of a worksheet to determine where existing data ends.
   *
   * @param {string} driveId
   * @param {string} itemId
   * @param {string} sheetName
   * @returns {Promise<object>} Range object (includes `rowCount`, `columnCount`, `address`)
   * @private
   */
  _getUsedRange(driveId, itemId, sheetName) {
    return this._graphRequest(
      "GET",
      `${this._worksheetBase(driveId, itemId)}/${encodeURIComponent(sheetName)}/usedRange`
    );
  }

  _worksheetBase(driveId, itemId) {
    const drive = driveId === "me" ? "me/drive" : `drives/${driveId}`;
    return `/${drive}/items/${encodeURIComponent(itemId)}/workbook/worksheets`;
  }

  /**
   * Write values to an explicit A1-notation range in a worksheet.
   *
   * @param {string}    driveId
   * @param {string}    itemId
   * @param {string}    sheetName
   * @param {string}    rangeAddress  e.g. "A1:C3"
   * @param {Array[][]} values        2D array of cell values
   * @returns {Promise<object>} Updated range object
   */
  _writeRange(driveId, itemId, sheetName, rangeAddress, values) {
    const sheet = encodeURIComponent(sheetName);
    const range = encodeURIComponent(rangeAddress);
    return this._graphRequest(
      "PATCH",
      `${this._worksheetBase(driveId, itemId)}/${sheet}/range(address='${range}')`,
      { values }
    );
  }

  /**
   * @override
   */
  canUpload() {
    return this.xlsx && this.clientId;
  }

  /**
   * Append rows of data to an Excel spreadsheet stored in OneDrive.
   * Automatically finds the first empty row and appends data there.
   *
   * @param {Array[][]} rows      - 2D array of row data to append.
   *                                e.g. [["Alice", 30], ["Bob", 25]]
   *
   * @returns {Promise<{ rowsWritten: number, startRow: number, endRow: number }>}
   */
  upload(pages) {
    const rows = [];
    // Break down pages into a list of rows
    pages.forEach(page => {
      const pageRows = page.flatten();
      rows.push(...pageRows);
    });

    //  * Convert a 1-based column index to an Excel column letter.
    // * e.g.  1 → "A",  26 → "Z",  27 → "AA"
    function columnLetter(n) {
      let result = "";
      while (n > 0) {
        const rem = (n - 1) % 26;
        result = String.fromCharCode(65 + rem) + result;
        n = Math.floor((n - 1) / 26);
      }
      return result;
    }

    const driveId = "me"; // Drive ID. Use "me" for the signed-in user's personal OneDrive.
    const itemId = this.xlsx; // OneDrive item ID of the .xlsx file

    // Find out how many rows are already used
    return this._signIn()
    .then(() => this._getUsedRange(driveId, itemId, SHEET_NAME))
    .then(usedRange => {
      const usedRowCount = usedRange?.rowCount ?? 0;
      let nextRow = usedRowCount + 1; // 1-based

      // Compute the A1-notation range
      const colCount   = Math.max(...rows.map(r => r.length));
      const startRow   = nextRow;
      const endRow     = nextRow + rows.length - 1;
      const rangeAddr  = `${columnLetter(1)}${startRow}:${columnLetter(colCount)}${endRow}`;

      return this._writeRange(driveId, itemId, SHEET_NAME, rangeAddr, rows)
      .then(() => rows.length);
    });
  }
}

