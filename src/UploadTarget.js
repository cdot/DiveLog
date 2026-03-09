/**
 * Upload target abstraction. Subclasses extend this to provide
 * specific functionality.
 */
class UploadTarget {

  /**
   * Construct an upload target.
   * @param {string} name unique name for this target
   * @param {string[]?} components optional key components. if this isn't
   * given, the store components will be loaded from localStorage.
   */
  constructor(name, components) {
    console.debug(`Target ${name} is type ${this.constructor.name}`,
                  components.join(" | "));
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
    console.debug("Cannot upload", pages.length);
    return Promise.reject("Incorrect upload key");
  }
}

export default UploadTarget;
