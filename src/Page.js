// Item preamble for local store
const LS_KEY_ROOT = "dive_page_";

// Ordered list of columns for each row in the UI
const COLUMNS = [
  { head: "Name", title: "Diver name",
    special: input => {
      input.addEventListener("focus", () => input.classList.add("expanded"));
      input.addEventListener("blur", () => input.classList.remove("expanded"));
    }
  },
  { head: "Grade", title: "Diver qualification" },
  { head: "Led", title: "Was this diver leading the pair?",
    special: input => input.type = "checkbox"
  },
  { head: "CTC", title: "Current Tissue Code", type: "select",
    special: select => {
      for (const op of "ABCDEF".split("")) {
        const opEl = document.createElement("option");
        opEl.textContent = op;
        select.appendChild(opEl);
      }
    }
  },
  { head: "Cylinders", title: "What cylinders were used" },
  { head: "Gas in", title: "Bar", special: input => input.type = "number" },
  { head: "Time in", special: input => input.type = "time" },
  { head: "Time out", special: input => input.type = "time" },
  { head: "Gas out", title: "Bar", special: input => input.type = "number" },
  { head: "Max depth", title: "metres", special: input => input.type = "number" },
  { head: "Dive time", title: "minutes", special: input => input.type = "number" }
];

const TIME_IN_COL = COLUMNS.findIndex(c => c.head === "Time in");
const TIME_OUT_COL = COLUMNS.findIndex(c => c.head === "Time out");
const DIVE_TIME_COL = COLUMNS.findIndex(c => c.head === "Dive time");

/**
 * A Page is a capture of dive data for a site, or day, or dive.
 */
export default class Page {

  /**
   * Construct a new Page object
   * @param {<number|object>?} data if an object, will populate from that.
   * If a number, will load the page with that id from localStorage.
   * If null it will create a new, blank page from the UI.
   * If undefined, it will create a new blank page but will ignore the UI.
   */
  constructor(data) {

    if (data === null) {
      console.debug("Construct from UI");
      // Construct a new page from data in the UI
      this.uid = Date.now();
      this.updateFromUI();
      return;
    }

    if (typeof data === "number") {
      // Load an existing page from localStorage
      console.debug(`Construct from localStorage ${data}`);
      data = JSON.parse(localStorage.getItem(`${LS_KEY_ROOT}${data}`));
    }

    if (data && typeof data === "object") {
      console.debug(`Construct from data`);
      // Construct a page from a data structure that may be another page
      this.uid = Date.now();
      this.date = data.date;
      this.site = data.site;
      this.manager = data.manager;
      this.boat = data.boat;
      this.weather = data.weather;
      this.comments = data.comments;
      this.rows = data.rows;
      return;
    }

    // Otherwise create a new, blank, page
    console.debug(`Construct blank`);

    /**
     * This is a number in ms, and is used to uniquely
     * identify the page.
     * @member {number}
     */
    this.uid = Date.now();

    /**
     * Date of dive(s). YYYY-MM-DD formatted date string.
     * @member {string}
     */
    this.date = new Date(this.uid).toISOString().replace(/T.*$/, "");

    /**
     * Dive site
     * @member {string}
     */
    this.site = "";

    /**
     * Dive Manager
     * @member {string}
     */
    this.manager = "";

    /**
     * Boat, if there was one
     * @member {string}
     */
    this.boat = "";

    /**
     * Description of weather
     * @member {string}
     */
    this.weather = "";

    /**
     * DM's comments
     * @member {string}
     */
    this.comments = "";

    /**
     * Rows in the table
     * @member {<string|number|boolean>[][]}
     */
    this.rows = [];
  }

  /**
   * Save the page to localStorage
   */
  saveToLocal() {
    localStorage.setItem(`${LS_KEY_ROOT}${this.uid}`, JSON.stringify(this));
  }

  /**
   * Create table rows in the UI. This is only called once, during
   * HTML creation.
   * @param {number} num number of page rows to create
   */
  static createRows(num = 10) {
    const thr = document.querySelector("#diveTable thead tr");
    for (const col of COLUMNS) {
      const th = document.createElement("th");
      th.textContent = col.head;
      thr.appendChild(th);
    }

    const tbody = document.querySelector("#diveTable tbody");
    for (let i = 0; i < num; i++) {
      const row = document.createElement("tr");
      for (const col of COLUMNS) {
        const cell = document.createElement("td");
        const input = document.createElement(col.type || "input");
        if (typeof col.special === "function")
          col.special(input, row);
        if (col.title)
          input.title = col.title;
        input.classList.add("datum");
        cell.appendChild(input);
        row.appendChild(cell);
      }
      tbody.appendChild(row);
    }
  }

  /**
   * Fill the page object with data from the UI
   * return {Page} this
   */
  updateFromUI() {
    const rows = [];

    function calculateDiveTime(row) {
      const timeIn = row.cells[TIME_IN_COL].querySelector(".datum").value;
      const timeOut = row.cells[TIME_OUT_COL].querySelector(".datum").value;

      if (timeIn && timeOut) {
        const start = new Date(`1970-01-01T${timeIn}`);
        const end = new Date(`1970-01-01T${timeOut}`);
        let diff = (end - start) / 60000;
        if (diff < 0) diff += 1440;
        const dt = row.cells[DIVE_TIME_COL].querySelector(".datum");
        dt.value = diff;
      }
    }

    document.querySelectorAll("#diveTable tbody tr")
    .forEach(tr => {
      calculateDiveTime(tr);
      const rowData = [];
      tr.querySelectorAll(".datum")
      .forEach(input => {
        if (input.type === "checkbox") {
          rowData.push(input.checked);
        } else {
          rowData.push(input.value);
        }
      });
      if (rowData[0] !== "") // Is there a diver name?
        rows.push(rowData);
    });

    // Make sure there's a date in the UI
    if (!document.getElementById("date").value) {
      document.getElementById("date").value =
      new Date(this.uid).toISOString().replace(/T.*$/, "");
    }

    this.date = document.getElementById("date").value;
    this.site = document.getElementById("site").value;
    this.manager = document.getElementById("manager").value;
    this.boat = document.getElementById("boat").value;
    this.weather = document.getElementById("weather").value;
    this.comments = document.getElementById("comments").value;
    this.rows = rows;

    this.saveToLocal();

    return this;
  }

  /**
   * Replace the page shown in the UI with this page.
   */
  loadIntoUI() {
    document.getElementById("date").value = this.date;
    document.getElementById("site").value = this.site;
    document.getElementById("manager").value = this.manager;
    document.getElementById("boat").value = this.boat;
    document.getElementById("weather").value = this.weather;
    document.getElementById("comments").value = this.comments;
    let inputs = document.querySelectorAll("#diveTable .datum");
    let i = 0;
    for (const r of this.rows) {
      for (let c = 0; c < r.length; c++)
          inputs[i++].value = r[c];
    }
    while (i < inputs.length)
      inputs[i++].value = "";
  }

  /**
   * Check if the page is worth uploading. There has to be at least one
   * row.
   * @return {boolean} true if it's worth it
   */
  isWorthUploading() {
    return this.rows.length > 0;
  }

  /**
   * Prepare flat data row for the page for adding to a spreadsheet.
   * @return {<string|boolean|number|Date>[][]} array of rows
   */
  prepareUpload() {
    return this.rows.map(row =>
      [ this.date, this.site,
        ...row,
        this.manager, this.boat, this.weather, this.comments ]);
  }

  /**
   * Construct a simple string for the Upload section
   */
  toString() {
    return `${this.site || "?"}:${this.date}`;
  }
}
