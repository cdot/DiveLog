import Page from "./Page.js";
import Pages from "./Pages.js";
import UploadTarget from "./UploadTarget.js";

function openDialog(dlg) {
  if (typeof dlg === "string")
    dlg = document.getElementById(dlg);
  dlg.classList.add("active");
  return dlg;
}

function closeDialog(dlg) {
  if (typeof dlg === "string")
    dlg = document.getElementById(dlg);
  dlg.classList.remove("active");
  return dlg;
}

function populateTargetPicker() {
  const publish = document.getElementById("publishButton");
  publish.classList.add("hidden");
  const targets = document.getElementById("uploadTargets");
  targets.innerHTML = "";
  const tgts = UploadTarget.getTargets();
  for (const name of Object.keys(tgts)) {
    const option = document.createElement("option");
    option.textContent = name;
    targets.append(option);
  }
  if (targets.value)
    publish.classList.remove("hidden");
  else
    publish.classList.add("hidden");
  return targets;
}

function selectUploadTarget() {
  // Load cloud stores into dialog
  const select = populateTargetPicker();
  const dialog = openDialog("uploadDialog");
  return new Promise(
    (resolve, reject) => {
      const publish = document.getElementById("publishButton");
      publish.addEventListener("click", () => {
        closeDialog(dialog);
        UploadTarget.getTarget(select.value)
        .then(ut => resolve(ut))
        .catch(e => reject(e));
      }, { once: true });
    });
}

function commitNewTarget() {
  UploadTarget.setTarget(document.getElementById("newTargetName").value,
                         document.getElementById("newTargetKey").value);
  closeDialog("newTargetDialog");
  populateTargetPicker();
  openDialog("uploadDialog");
}

let pages;

// Initialise UI
Page.createHTMLTable(10);

document.getElementById("addPageButton")
.addEventListener("click", () => pages.newPage());

document.getElementById("uploadButton")
.addEventListener(
  "click",
  () => selectUploadTarget()
  .then(store => pages.upload(store))
  .catch(e => alert("Upload error: " + e)));

document.getElementById("addNewTarget")
.addEventListener("click", () => {
  openDialog("newTargetDialog");
});

document.getElementById("uploadTargets")
.addEventListener("change", function() {
  const publish = document.getElementById("publishButton");
  if (this.value)
    publish.classList.remove("hidden");
  else 
    publish.classList.add("hidden");
});

document.getElementById("commitNewTarget")
.addEventListener("click", () => commitNewTarget());

document.querySelectorAll(".modal-close")
.forEach(button => button.addEventListener("click", function() {
  const dlg = this.closest(".modal-overlay");
  closeDialog(dlg);
}));

document.querySelectorAll("#main input,select,textarea")
.forEach(input =>
  input.addEventListener("change", () => pages.updatePageFromUI()));

document.getElementById("about")
.addEventListener("click", () => openDialog("aboutDialog"));

// Create local DB
pages = new Pages();

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('src/ServiceWorker.js');
}
