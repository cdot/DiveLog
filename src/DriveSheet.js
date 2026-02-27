/* global gapi, google */

/**
 * CloudStore implementation for uploading to Google Sheets
 */
import CloudStore from "./CloudStore.js";

import "https://apis.google.com/js/api.js";
//import "https://accounts.google.com/gsi/client";

const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const DISCOVERY_DOC = "https://sheets.googleapis.com/$discovery/rest?version=v4";
/**
 * Initialise the GAPI client
 */
let tokenClient;
async function initClient() {
  await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CloudStore.getKey(1),
    scope: SCOPES,
    callback: ''
  });
}

export default class DriveSheet extends CloudStore {

  constructor() {
    super();
    gapi.load("client", initClient);
  }

  /**
   * @private
   */
  authenticate() {
    return new Promise((resolve, reject) => {
      tokenClient.callback = resp => {
        if (resp.error) {
          console.debug("Authentication failed", resp.error);
          reject(resp);
        }
        else
          resolve(resp);
      };
      tokenClient.requestAccessToken();
    });
  }

  /**
   * @override
   */
  canUpload() {
    return CloudStore.getKey(1) && CloudStore.getKey(2);
  }

  /**
   * @override
   */
  upload(rows) {
    return this.authenticate()
    .then(() => gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: CloudStore.getKey(2),
      range: "Dives",
      valueInputOption: "RAW",
      resource: { values: rows }
    }));
  }
}

