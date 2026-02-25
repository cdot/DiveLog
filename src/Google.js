/* global gapi, google */
/**
 * Requires https://apis.google.com/js/api.js and
 * https://accounts.google.com/gsi/client
 */
import { CLIENT_ID } from "../setup.js";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
const DISCOVERY_DOC = "https://sheets.googleapis.com/$discovery/rest?version=v4";

/**
 * Initialise the GAPI client
 */
let tokenClient;
async function initClient() {
  await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: ''
  });
}

/**
 * Authenticate with Google
 */
function authenticate() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = resp => {
      if (resp.error) reject(resp);
      else resolve(resp);
    };
    tokenClient.requestAccessToken();
  });
}

export { initClient, authenticate }
