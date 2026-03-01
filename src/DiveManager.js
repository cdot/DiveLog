import Page from "./Page.js";
import Pages from "./Pages.js";
import CloudStore from "./CloudStore.js";

function settings() {
  const main = document.getElementById("main");
  const settings = document.getElementById("settings");
  main.classList.add("hidden");
  settings.classList.remove("hidden");

  const key = document.getElementById("key");
  key.value = CloudStore.getKey();
  document.getElementById("settingsDoneButton").addEventListener(
    "click", () => {
      CloudStore.setKey(key.value);
      window.location.reload();
    });
}

let cloudStore, pages;

// Initialise UI
Page.createHTMLTable(10);
document.getElementById("addPageButton")
.addEventListener("click", () => pages.newPage());
document.getElementById("gearButton")
.addEventListener("click", settings);
document.getElementById("uploadButton")
.addEventListener("click", () => pages.upload(cloudStore));
for (const input of document.querySelectorAll("input,select,textarea")) {
  input.addEventListener("change", () => pages.updatePageFromUI());
}

// Create local DB
pages = new Pages();

// Create cloud store
const k = CloudStore.getKey();
if (!k || k === "")
  document.getElementById("uploadButton").disabled = true;

let storeClass = CloudStore.getKey(0) || "CloudStore";
import(`./${storeClass}.js`)
.then(storeClass => {
  cloudStore = new (storeClass.default)();
})
.catch(e => {
  document.getElementById("uploadButton").disabled = true;
  alert(`Could not load store module '${storeClass}' - check your upload key!`);
});

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('src/ServiceWorker.js');
}
