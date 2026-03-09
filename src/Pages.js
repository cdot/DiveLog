import Page from "./Page.js";

const RUBBISH_ICON = "\u{1F5D1}";

/**
 * An array of page IDs
 */
class Pages {

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

    // Load pages from local storage.
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(Page.KEY_ROOT)) {
        const uid = parseInt(key.substring(Page.KEY_ROOT.length));
        this.addPage(new Page(uid));
      }
    }

    if (this.pages.length === 0)
      //  If there are no pages there, construct a new page from whatever
      // is in the UI
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
    console.debug(`Setting UI to page ${page.uid} ${page.shortText()}`);
    this.currentPageUID = page.uid;
    page.loadIntoUI();
    this.reloadList();
  }

  /**
   * Add a Page
   * @param {Page} page Page to add
   * @private
   */
  addPage(page) {
    console.debug(`Adding page ${page.uid}`);
    this.pages.unshift(page);
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
    console.debug(`Removing ${page.uid} ${this.pages.length}`);
    this.pages.splice(this.pages.indexOf(page), 1);
    page.removeFromLocal();
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
    const list = document.getElementById("pages");
    list.innerHTML = "";
    const self = this;
    let disableUpload = true;
    for (const page of this.pages) {
      const li = document.createElement("div");
      li.id = "P" + page.uid;
      li.classList.add("list-item");
      li.textContent = page.shortText();
      const deleteButton = document.createElement("button");
      deleteButton.textContent = RUBBISH_ICON;
      deleteButton.title = "Delete this page. Be careful, you cannot undo!";
      deleteButton.classList.add("trash-can");
      deleteButton.addEventListener("click", function() {
        const uid = parseInt(this.closest(".list-item").id.substring(1));
        const dead = self.getPageByUID(uid);
        if (window.confirm(`Delete?\n${dead.siteText()}`))
          self.removePage(dead);
      });
      
      li.append(deleteButton);
      li.addEventListener(
        "click", function() {
          const uid = parseInt(this.id.substring(1));
          self.setCurrentPage(uid);
        });
      li.title = "Click to edit";
      list.appendChild(li);
      if (page.isWorthUploading())
        disableUpload = false;
    }
    document.getElementById("uploadButton").disabled = disableUpload;
  }

  /**
   * Upload pending pages. Only pages that are considered worth
   * uploading (i.e. those with actual diver information) are uploaded.
   * @param {UploadTarget} target UploadTarget to upload to
   * @return {Promise} promise that resolves to undefined
   */
  upload(target) {
    const pages = this.pages.filter(p => p.isWorthUploading());

    if (pages.length === 0)
      return Promise.reject("Nothing worth uploading");

    return target.upload(pages)
    .then(saved => {
      for (const uid of saved)
        this.removePage(this.getPageByUID(uid));
      if (this.pages.length === 0)
        // Construct a new blank page, ignoring the UI
        this.addPage(new Page());
      this.setCurrentPage(this.pages[0]);
      alert("Uploads complete, thank you");
    })
    .catch(err => alert("Upload failed, check your target: " + err));
  }
}

export default Pages;
