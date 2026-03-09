import Page from "./Page.js";
import Pages from "./Pages.js";
import UploadTargets from "./UploadTargets.js";
import Modal from "./Modal.js";

// Initialise UI
Page.createHTMLTable(10);

// Construct pages local DB and UI support
const pages = new Pages();

// Construct upload targets interface
const uploadTargets = new UploadTargets();

document.getElementById("addPageButton")
.addEventListener("click", () => pages.newPage());

document.getElementById("uploadButton")
.addEventListener(
  "click",
  () => uploadTargets.selectUploadTarget()
  .then(store => {
    new Modal("busyModal").open();
    return pages.upload(store);
  })
  .catch(e => alert("Upload error: " + e))
  .finally(() => new Modal("busyModal").close()));

document.querySelectorAll("#main input,select,textarea")
.forEach(input =>
  input.addEventListener("change", () => pages.updatePageFromUI()));

document.getElementById("aboutLink")
.addEventListener("click", () => new Modal("aboutModal").open());

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('src/ServiceWorker.js');
}
