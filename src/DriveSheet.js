/**
 * CloudStore implementation for uploading to Google Sheets. This avoids
 * the need for client information by indirecting via CloudFlare and Appscript.
 */
import CloudStore from "./CloudStore.js";

export default class DriveSheet extends CloudStore {

  constructor() {
    super();
    // Cloudflare deployment ID
    this.cloudflareID = CloudStore.getKey(1);
    // App Script deployment ID
    this.appscriptID = CloudStore.getKey(2);
    // Optional spreadsheet ID
    this.spreadsheetID = CloudStore.getKey(3);
    // Optional sheet name in spreadsheet
    this.sheetName = CloudStore.getKey(4);
  }

  /**
   * @override
   */
  canUpload() {
    // Need at least the deployment IDs for the Cloudflare worker
    // and the Appscript
    return this.cloudflareID && this.appscriptID;
  }

  /**
   * @override
   */
  upload(rows) {
    return fetch(
      `https://${this.cloudflareID}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          appscriptID: this.appscriptID,
          spreadsheetID: this.spreadsheetID,
          sheetName: this.sheetName,
          rows: rows
        })
      })
    .then(response => {
      // The response should be a list of IDs that were uploaded.
      console.debug("Received response", response);
      return response.json();
    })
    .then(result => {
      if (result.error)
        throw new Error(result.error);
      return [...new Set(result)];
    });
  }
}

