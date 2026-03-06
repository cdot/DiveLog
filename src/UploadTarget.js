/**
 * Key used to store targets in localStore
 */
const TARGETS = "DiveLog_UploadTargets";

/**
 * Upload target abstraction. Subclasses extend this to provide
 * specific functionality. This class maintains a list of known
 * targets (in localStorage) and static methods handle management
 * of that list and instantiation of target instances.
 */
export default class UploadTarget {

  /**
   * Get a list of known targets
   * @return {Map.<string,string>} a map from name to target key
   */
  static getTargets() {
    const stores = localStorage.getItem(TARGETS);
    if (stores)
      return JSON.parse(stores);
    else
      return {};
  }

  /**
   * Get a new instace of a known target, loading the class if needed.
   * @param {string} name the name of the target
   * @return {Promis<UploadTarget>} a promise that resolves to a new
   * instance of the target
   */
  static getTarget(name) {
    const key = UploadTarget.getTargets()[name];
    if (!key)
      throw new Error(`No such target ${name}`);
    const components = key.split("|");
    let storeClass = components.shift();
    return import(`./${storeClass}.js`)
    .then(ex => new (ex.default)(name, components));
  }

  /**
   * Modify or Add a target
   * @param {string} name the name of the target
   * @param {string} key the key for the target
   */
  static setTarget(name, key) {
    const keys = UploadTarget.getTargets();
    keys[name] = key;
    localStorage.setItem(TARGETS, JSON.stringify(keys));
  }

  /**
   * Remove a target
   * @param {string} name the name of the target
   */
  static removeTarget(name) {
    const keys = UploadTarget.getTargets();
    keys.delete(name);
    localStorage.setItem(TARGETS, JSON.stringify(keys));
  }

  /**
   * Construct an upload target.
   * @param {string} name unique name for this target
   * @param {string[]?} components optional key components. if this isn't
   * given, the store components will be loaded from localStorage.
   */
  constructor(name, components) {
    this.name = name;
    if (components) {
      this.components = components;
    } else {
      const data = UploadTarget.getTarget(name);
      if (data)
        this.components = data.split("|");
      else
        throw new Error(`No key given for target ${name}`);
    }
    UploadTarget.setTarget(this.name, this.components.join("|"));
    console.debug(`Target ${this.name} is type ${this.constructor.name}`);
  }

  /**
   * Test if the store can upload (all the information the store
   * requires is available from the key)
   * @return {boolean} true if the upload can proceed, false otherwise
   */
  canUpload() {
    return false;
  }

  /**
   * Upload row data to the cloud store
   * @param {Page[]} pages Pages to upload
   * @return {Promise<number[]>} Promise that resolves to an array of
   * the pages stored when the upload is complete.
   */
  upload(pages) {
    console.debug("Cannot upload");
    return Promise.reject("Incorrect upload key");
  }
}
