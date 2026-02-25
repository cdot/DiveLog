// gapi is provided by https://apis.google.com/js/api.js
/* global gapi, URLSearchParams */
import IDS from "../ids.js";
import Page from "./Page.js";
import Pages from "./Pages.js";
import { initClient } from "./Google.js";
import { D } from "./ED.js";

const params = new URLSearchParams(document.location.search);
const key = params.get("key");
window.CLIENT_ID = D(IDS[0], key);
window.SPREADSHEET_ID = D(IDS[1], key);

Page.createRows(10);

const pages = new Pages();

gapi.load("client", initClient);

document.getElementById("uploadButton")
.addEventListener("click", () => pages.retryUploads(key));

document.getElementById("addPageButton")
.addEventListener("click", () => pages.newPage());

for (const input of document.querySelectorAll("input,select,textarea"))
  input.addEventListener("change", () => {
    pages.updatePageFromUI();
  });

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('src/ServiceWorker.js');
}
