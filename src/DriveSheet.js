import UploadTarget from "./UploadTarget.js";

/**
 * UploadTarget implementation for uploading to Google Sheets. This avoids
 * the need for client information by indirecting via CloudFlare and Appscript.
 */
export default class DriveSheet extends UploadTarget {

  /**
   * @override
   */
  constructor(name, components) {
    super(name, components);
    // Cloudflare deployment ID
    this.cloudflareID = this.components[0];
    // App Script deployment ID
    this.appscriptID = this.components[1];
    // Optional spreadsheet ID
    this.spreadsheetID = this.components[2];
    // Optional sheet name in spreadsheet
    this.sheetName = this.components[4];
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
  upload(pages) {
    const rows = [];
    // Break down pages into a list of rows
    pages.forEach(page => {
      const pageRows = page.flatten();
      rows.push(...pageRows);
    });

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
      // Appscript sets the error field if there was an issue
      if (result.error)
        throw new Error(result.error);
      // otherwise it returns a list of the unique uids of the rows
      // that were saved
      return [...new Set(result)]; // uniquify
    });
  }
}

