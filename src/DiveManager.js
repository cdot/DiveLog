/* global gapi */
import Page from "./Page.js";
import Pages from "./Pages.js";
import { initClient } from "./Google.js";

Page.createRows(10);

const pages = new Pages();

gapi.load("client", initClient);

document.getElementById("uploadButton")
.addEventListener("click", () => pages.retryUploads());

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
