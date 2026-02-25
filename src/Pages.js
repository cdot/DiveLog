/* global gapi */
import { SPREADSHEET_ID } from "../setup.js";
import Page from "./Page.js";
import { authenticate } from "./Google.js";

const LS_KEY = "dive_pages";

/**
 * An array of page IDs
 */
export default class Pages {

  constructor() {
    /**
     * List of pages
     * @member {Page[]}
     */
    this.pages = [];

    // Load pages from local storage. If there are no pages there,
    // construct a new, blank, page.
    const known = localStorage.getItem(LS_KEY);
    if (known && known.length > 0) {
      const indexes = JSON.parse(known);
      for (const i of indexes)
        this.addPage(new Page(i));
    } else
      // Construct a page from whatever is in the UI
      this.addPage(new Page(null));

    this.pages[0].loadIntoUI();
    this.reloadList();
  }

  /**
   * Get the ID of the page currently loaded in the UI
   * @return {number} the id of the currently loaded page
   */
  getUIPageId() {
    return parseInt(document.getElementById("currentPage").textContent);
  }
  
  /**
   * Get the page currently loaded into the UI
   * @return {Page}
   */
  getUIPage() {
    return this.getPageById(this.getUIPageId());
  }

  saveToLocal() {
    const page_ids = this.pages.map(p => p.id);
    localStorage.setItem(LS_KEY, JSON.stringify(page_ids));
  }

  /**
   * Add a Page
   * @param {Page} page Page to add
   */
  addPage(page) {
    this.pages.push(page);
    this.saveToLocal();
  }

  newPage() {
    const page = new Page();
    this.addPage(page);
    page.loadIntoUI();
    this.reloadList();
  }

  /**
   * Remove a Page
   * @param {Page} page Page to remove
   */
  removePage(page) {
    this.pages.splice(this.pages.indexOf(page), 1);
    this.saveToLocal();
    localStorage.removeItem(`page_${page.id}`);
  }

  /**
   * Get a Page by id
   * @param {number} id ID of page to find
   */
  getPageById(id)  {
    const found = this.pages.find(p => p.id === id);
    return found;
  }

  /**
   * Update the page currently shown in the UI
   */
  updatePageFromUI() {
    const page = this.getUIPage();
    page.updateFromUI();
    page.saveToLocal();
    console.debug(`Page ${page.id} saved in cache`);
    this.reloadList();
  }

  /**
   * Load current pages list into the UI
   */
  reloadList() {
    const element = document.getElementById("pages");
    element.innerHTML = "";
    const self = this;
    for (const page of this.pages) {
      const div = document.createElement("div");
      div.id = `P${page.id}`;
      div.classList.add("list-item");
      div.textContent = `${page.metadata.site}: ${page.metadata.date}`;
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "\u{1F5D1}";
      deleteButton.title = "Delete";
      deleteButton.classList.add("trash-can");
      div.append(deleteButton);
      div.addEventListener(
        "click", function() {
          self.getPageById(parseInt(this.id.substring(1)))
          .loadIntoUI();
        });
      div.title = "Click to edit";
      element.appendChild(div);
    }
  }

  retryUploads() {
    if (!this.pages.length)
      return alert("Nothing to upload.");

    const rows = [];
    for (const page of this.pages) {
      const pageRows = page.prepareUpload();
      rows.push(...pageRows);
    }

    return authenticate()
    .then(() => gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Dives",
      valueInputOption: "RAW",
      resource: { values: rows }
    }))
    .then(() => {
      for (const page of this.pages)
        this.removePage(page);
      if (this.pages.length === 0)
        // Construct a blank page
        this.addPage(new Page());
      this.pages[0].loadIntoUI();
      this.reloadList();
      alert("Uploads complete, thank you");
    })
    .catch(err => alert(`Upload failed ` + err));
  }
}
