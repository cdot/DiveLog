import Page from "./Page.js";

const LS_KEY = "dive_pages";

/**
 * An array of page IDs
 */
export default class Pages {

  constructor() {
    /**
     * Catalogue of pages. Most recent is pages[0].
     * @member {Page[]}
     * @private
     */
    this.pages = [];

    /**
     * UID of the page currently loaded into the UI
     * @member {number}
     * @private
     */
    this.currentPageUID = undefined;

    // Load pages from local storage. If there are no pages there,
    // construct a new, blank, page.
    const known = localStorage.getItem(LS_KEY);
    if (known && known.length > 0) {
      const uids = JSON.parse(known);
      for (const i of uids)
        this.addPage(new Page(i));
    } else
      // Construct a page from whatever is in the UI
      this.addPage(new Page(null));

    this.setCurrentPage(this.pages[0]);
  }

  /**
   * Get the page currently loaded into the UI
   * @return {Page}
   */
  getCurrentPage() {
    return this.getPageByUID(this.currentPageUID);
  }

  /**
   * Set the current page in the UI.
   * @param {number|Page} page the page to load, either a UID or the
   * actual page.
   */
  setCurrentPage(page) {
    if (typeof page === "number")
      page = this.getPageByUID(page);
    this.currentPageUID = page.uid;
    page.loadIntoUI();
    this.reloadList();
  }

  /**
   * Save the list of page UIDs to localStorage
   * @private
   */
  saveToLocal() {
    const uids = this.pages.map(p => p.uid);
    console.debug("Saving pages", uids);
    localStorage.setItem(LS_KEY, JSON.stringify(uids));
  }

  /**
   * Add a Page
   * @param {Page} page Page to add
   * @private
   */
  addPage(page) {
    this.pages.unshift(page);
    this.saveToLocal();
  }

  /**
   * Construct a Page and load it into the UI. The page will be
   * blank; the UI content will be cleared.
   * @return {Page} the page that was created
   */
  newPage() {
    const page = new Page();
    this.addPage(page);
    this.setCurrentPage(page);
    return page;
  }

  /**
   * Remove a Page
   * @param {Page} page Page to remove
   * @private
   */
  removePage(page) {
    this.pages.splice(this.pages.indexOf(page), 1);
    this.saveToLocal();
    localStorage.removeItem(`page_${page.uid}`);
  }

  /**
   * Get a Page by UID
   * @param {number} uid UID for page to find
   * @private
   */
  getPageByUID(uid)  {
    const found = this.pages.find(p => p.uid === uid);
    return found;
  }

  /**
   * Update the page currently shown in the UI
   */
  updatePageFromUI() {
    const page = this.getCurrentPage();
    page.updateFromUI();
    this.reloadList();
    console.debug(`Page ${page.uid} saved in cache`);
  }

  /**
   * Load current pages list into the UI
   * @private
   */
  reloadList() {
    const element = document.getElementById("pages");
    element.innerHTML = "";
    const self = this;
    let disableUpload = true;
    for (const page of this.pages) {
      const div = document.createElement("div");
      div.id = `P${page.uid}`;
      div.classList.add("list-item");
      div.textContent = page.toString();
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "\u{1F5D1}";
      deleteButton.title = "Delete";
      deleteButton.classList.add("trash-can");
      div.append(deleteButton);
      div.addEventListener(
        "click", function() {
          const uid = parseInt(this.id.substring(1));
          self.setCurrentPage(uid);
        });
      div.title = "Click to edit";
      element.appendChild(div);
      if (page.isWorthUploading())
        disableUpload = false;
    }
    document.getElementById("uploadButton").disabled = disableUpload;
  }

  /**
   * Upload pending pages to a spreadsheet on drive
   * @param {CloudStore} store CloudStore to upload to
   * @return {Promise} promise that resolves to undefined
   */
  upload(store) {
    const rows = [];
    for (const page of this.pages) {
      if (page.isWorthUploading()) {
        const pageRows = page.prepareUpload();
        rows.push(...pageRows);
      }
    }

    if (rows.length === 0)
      return Promise.reject("Nothing worth uploading");

    return store.upload(rows)
    .then(() => {
      for (const page of this.pages)
        this.removePage(page);
      if (this.pages.length === 0)
        // Construct a new blank page, ignoring the UI
        this.addPage(new Page());
      this.setCurrentPage(this.pages[0]);
      alert("Uploads complete, thank you");
    })
    .catch(err => alert("Upload failed: " + err));
  }
}
