import Modal from "./Modal.js";
//import UploadTarget from "./UploadTarget.js";

/**
 * Key used to store targets in localStore
 * @private
 */
const KEY_ROOT = "DiveLog_target";

/**
 * A singleton of this class maintains a list of known targets (in
 * localStorage), and provides UI methods for management of that list,
 * using modals defined in `index.html`.
 */
class UploadTargets {

  /**
   */
  constructor() {
    const self = this;

    document.getElementById("addTargetButton")
    .addEventListener("click", () => {
      document.getElementById("targetNameInput").value = "";
      document.getElementById("targetKeyInput").value = "";
      new Modal("targetModal").open();
    });

    document.getElementById("editTargetButton")
    .addEventListener("click", () => self.editTarget());

    document.getElementById("uploadTargetSelect")
    .addEventListener("change", function() {
      self.enableTargetButtons(!this.value);
    });
    
    document.getElementById("commitTargetButton")
    .addEventListener("click", () => self.commitTarget());
  }

  /**
   * Get a new instance of a known target, loading the class if needed.
   * @param {string} name the name of the target
   * @return {Promise<UploadTarget>} a promise that resolves to a new
   * instance of the selected target
   * @private
   */
  instantiate(name) {
    const key = localStorage.getItem(`${KEY_ROOT}${name}`);
    if (!key)
      throw new Error(`No such target ${name}`);
    const components = key.split("|");
    let storeClass = components.shift();
    return import(`./${storeClass}.js`)
    .then(ex => new (ex.default)(name, components));
  }

  /**
   * Modify or Add a target.
   * @param {string} name the name of the target
   * @param {string} key the key for the target
   */
  setTarget(name, key) {
    if (!name)
      return;
    localStorage.setItem(`${KEY_ROOT}${name}`, key);
  }

  /**
   * Remove a target
   * @param {string} name the name of the target
   */
  removeTarget(name) {
    delete localStorage[`${KEY_ROOT}${name}`];
  }

  /**
   * @param {boolean} bad If true buttons are disabled
   * @private
   */
  enableTargetButtons(bad) {
    document.getElementById("publishButton").disabled = bad;
    document.getElementById("editTargetButton").disabled = bad;
  }

  /**
   * Fill the target select with known targets
   * @private
   */
  populateTargetPicker() {
    const targets = document.getElementById("uploadTargetSelect");
    targets.innerHTML = "";
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(KEY_ROOT)) {
        const name = key.substring(KEY_ROOT.length);
        const option = document.createElement("option");
        option.textContent = name;
        targets.append(option);
      }
    }
    this.enableTargetButtons(!targets.value);
    return targets;
  }

  /**
   * Promise to select an upload target
   * @return {Promise<UploadTarget>} Promise that returns the selected target
   */
  selectUploadTarget() {
    // Load cloud stores into modal
    const select = this.populateTargetPicker();
    const modal = new Modal("uploadModal").open();
    return new Promise(
      (resolve, reject) => {
        const publish = document.getElementById("publishButton");
        publish.addEventListener("click", () => {
          modal.close();
          this.instantiate(select.value)
          .then(ut => resolve(ut))
          .catch(e => reject(e));
        }, { once: true });
      });
  }

  /**
   * Populate the target modal with the selected target for editing.
   * @return {Modal} the target modal
   * @private
   */
  editTarget() {
    const name = document.getElementById("uploadTargetSelect").value;
    document.getElementById("originalTargetNameInput").value = name;
    document.getElementById("targetNameInput").value = name;
    const key = localStorage.getItem(`${KEY_ROOT}${name}`);
    document.getElementById("targetKeyInput").value = key;
    return new Modal("targetModal").open();
  }

  /**
   * Set the target currently in the modal
   * @private
   */
  commitTarget() {
    const ntn = document.getElementById("targetNameInput").value;
    const ntk = document.getElementById("targetKeyInput").value;
    const otn = document.getElementById("originalTargetNameInput").value;
    if (!ntn || ntn !== otn)
      this.removeTarget(otn);
    this.setTarget(ntn, ntk);
    new Modal("targetModal").close();
    this.populateTargetPicker();
    new Modal("uploadModal").open();
  }
}

export default UploadTargets;
