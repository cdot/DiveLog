/**
 * Store abstraction
 */
export default class CloudStore {

  static KEY_ID = "CloudStore_Key";

  constructor() {
    console.debug(`Store is ${this.constructor.name}`);
  }

  static setKey(key) {
    localStorage.setItem(CloudStore.KEY_ID, key);
  }

  static getKey(field) {
    const key = localStorage.getItem(CloudStore.KEY_ID);
    if (key && typeof field === "number") {
      const ids = key.split("|");
      return ids[field];
    }
    return key || "";
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
   * @return {Promise} Promise that resolves when the upload is complete
   * or is rejected if it fails.
   */
  upload(rows) {
    return Promise.reject("Incorrect upload key");
  }
}
