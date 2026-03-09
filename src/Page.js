// Ordered list of columns for each row in the UI
const COLUMNS = [
  { head: "Name",
    title: "Diver name",
    special: input => {
      input.setAttribute("autocapitalize", "words");
      input.addEventListener("focus", () => input.classList.add("expanded"));
      input.addEventListener("blur", () => input.classList.remove("expanded"));
    }
  },
  { head: "Grade", title: "Diver qualification", width: "3em" },
  { head: "Led", title: "Was this diver leading the buddy pair?",
    special: input => input.type = "checkbox"
  },
  { head: "CTC", title: "Current Tissue Code",
    width: "3em",
    type: "select",
    special: select => {
      for (const op of "ABCDEF".split("")) {
        const opEl = document.createElement("option");
        opEl.textContent = op;
        select.appendChild(opEl);
      }
    }
  },
  { head: "Cylinders", title: "What cylinders were used" },
  { head: "Gas in", title: "Bar", special: input => input.type = "number", width: "4em" },
  { head: "Time in", special: input => input.type = "time" },
  { head: "Time out", special: input => input.type = "time" },
  { head: "Gas out", title: "Bar", special: input => input.type = "number", width: "4em" },
  { head: "Max depth", title: "metres", special: input => input.type = "number" , width: "5em" },
  { head: "Dive time", title: "minutes", special: input => input.type = "number", width: "5em" }
];

const TIME_IN_COL = COLUMNS.findIndex(c => c.head === "Time in");
const TIME_OUT_COL = COLUMNS.findIndex(c => c.head === "Time out");
const DIVE_TIME_COL = COLUMNS.findIndex(c => c.head === "Dive time");

function tabulate(data){
  const rows = data.map(r => r.map(v => v == null ? "" : String(v)));
  const cols = Math.max(...rows.map(r => r.length));

  // column widths
  const w = Array.from({length: cols}, (_,i) =>
    Math.max(...rows.map(r => (r[i] || "").length))
  );

  // detect numeric columns
  const num = Array.from({length: cols}, (_,i) =>
    data.every(r => r[i] === undefined || typeof r[i] === "number")
  );

  const pad = (c,i) =>
    num[i] ? c.padStart(w[i]) : c.padEnd(w[i]);

  const makeRow = r =>
    "| " + Array.from({length: cols}, (_,i) =>
      pad(r[i] || "", i)
    ).join(" | ") + " |";

  const border =
    "+-" + w.map(x => "-".repeat(x)).join("-+-") + "-+";

  const out = [];
  out.push(border);
  rows.forEach(r => {
    out.push(makeRow(r));
    out.push(border);
  });

  return out.join("\n");
}

/**
 * A Page is a capture of dive data for a site, or day, or dive.
 */
class Page {

  // Item preamble for local store
  static KEY_ROOT = "DiveLog_page";

  /**
   * Construct a new Page object
   * @param {object?} data if an object, will populate from that.
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
      data = JSON.parse(localStorage.getItem(`${Page.KEY_ROOT}${data}`));
    }

    if (data && typeof data === "object") {
      console.debug(`Construct from data`);
      // Construct a page from a data structure that may be another page
      this.uid = data.uid || Date.now();
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
     * @member {object[][]}
     */
    this.rows = [];
  }

  /**
   * Save the page to localStorage
   */
  saveToLocal() {
    localStorage.setItem(`${Page.KEY_ROOT}${this.uid}`, JSON.stringify(this));
  }

  /**
   * Remove the page from localStorage
   */
  removeFromLocal() {
    localStorage.removeItem(`${Page.KEY_ROOT}${this.uid}`);
  }

  /**
   * Create table rows in the UI. This is only called once, during
   * HTML creation.
   * @param {number} num number of table rows to create
   */
  static createHTMLTable(num = 10) {
    const thr = document.querySelector("#diveTable thead tr");
    for (const col of COLUMNS) {
      const cell = document.createElement("th");
      cell.textContent = col.head;
      if (col.width)
        cell.style.width = col.width;
      thr.appendChild(cell);
    }

    const tbody = document.querySelector("#diveTable tbody");
    for (let rowi = 0; rowi < num; rowi++) {
      const row = document.createElement("tr");
      for (const col of COLUMNS) {
        const cell = document.createElement("td");
        const input = document.createElement(col.type || "input");
        if (typeof col.special === "function")
          col.special(input, row);
        input.placeholder = col.head;
        if (col.title)
          input.title = col.title;
        if (col.width)
          cell.style.width = col.width;
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
   * Prepare flat data rows for the page for adding to a spreadsheet.
   * @return {object[][]} array of rows. Each row carries all the site details.
   */
  flatten() {
    return this.rows.map(row =>
      [ this.uid, this.date, this.site,
        ...row,
        this.manager, this.boat, this.weather, this.comments ]);
  }

  /**
   * Construct a simple string description for the page list
   */
  shortText() {
    return `${this.site || "? "}:${this.date}`;
  }

  /**
   * Construct a full string description of the site
   * @return {string} the site description
   */
  siteText() {
    const descr = [];
    descr.push(`Site: ${this.site}`);
    descr.push(`Date: ${this.date}`);
    descr.push(`Dive Manager: ${this.manager}`);
    if (this.boat)
      descr.push(`Boat: ${this.boat}`);
    if (this.weather)
      descr.push(`Weather: ${this.weather}`);
    if (this.comments)
      descr.push(`Comments: ${this.comments}`);
    return descr.join("\n");
  }

  /**
   * Construct a full string description e.g. for email
   * @param {boolean} tab if true, tabulate the rows
   * @return {string} the page description
   */
  fullText(tab) {
    const descr = [ this.siteText() ];
    if (tab)
      // Tabulate columns assuming monospace font
      descr.push(tabulate([COLUMNS.map(c => c.head), ...this.rows]));
    else {
      // Generate columns in CSV format.
      descr.push(COLUMNS.map(c => c.head).join(","));
      for (const row of this.rows)
        descr.push(row.join(","));
    }
    return descr.join("\n");
  }
}

export default Page;
