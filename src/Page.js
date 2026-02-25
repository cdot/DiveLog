// Item preamble for local store
const LS_KEY_ROOT = "dive_page_";

// Ordered list of columns for each row in the UI
const COLUMNS = [
  { head: "Name", title: "Diver name" },
  { head: "Grade", title: "Diver qualification" },
  { head: "Led", title: "Was this diver leading the pair?", special: input => input.type = "checkbox" },
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
   * If a number, will load the page with that index from localStorage.
   * If null it will create a new, blank page from the UI.
   * If undefined, it will create a new blank page but will ignore the UI.
   */
  constructor(data) {
    if (typeof data === "number")
      data = JSON.parse(localStorage.getItem(`${LS_KEY_ROOT}${data}`));

    if (data === null) {
      // Construct a new page from data in the UI
      this.id = Date.now();
      document.getElementById("currentPage").textContent = this.id;
      this.updateFromUI();
    } else if (typeof data === "undefined") {
      this.id = Date.now();
      this.metadata = {
        site: "",
        date: this.id,
        manager: "",
        boat: "",
        weather: "",
        comments: ""
      };
      this.rows = [];
    } else if (data && typeof data === "object") {
      /**
       * The page unique ID
       * @member {number}
       */
      this.id = data.id;
      /**
       * Page meta-data e.g site, date etc
       * @member {object}
       */
      this.metadata = data.metadata;
      /**
       * Array of dive data.
       * @member {<number|string>[][]}
       */
      this.rows = data.rows;
    }
  }

  /**
   * Save the page to localStorage
   */
  saveToLocal() {
    localStorage.setItem(`${LS_KEY_ROOT}${this.id}`, JSON.stringify(this));
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

    this.id = parseInt(document.getElementById("currentPage").textContent);
    this.metadata = {
      site: document.getElementById("site").value,
      date: document.getElementById("date").value,
      manager: document.getElementById("manager").value,
      boat: document.getElementById("boat").value,
      weather: document.getElementById("weather").value,
      comments: document.getElementById("comments").value
    };
    this.rows = rows;

    this.saveToLocal();

    return this;
  }

  /**
   * Replace the page shown in the UI with this page.
   */
  loadIntoUI() {
    document.getElementById("currentPage").textContent = this.id;
    document.getElementById("site").value = this.metadata.site;
    document.getElementById("date").value = this.metadata.date;
    document.getElementById("manager").value = this.metadata.manager;
    document.getElementById("boat").value = this.metadata.boat;
    document.getElementById("weather").value = this.metadata.weather;
    document.getElementById("comments").value = this.metadata.comments;
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
   * Append the page to the spreadsheet in the cloud.
   */
  uploadToDrive() {
    const rows = [];
    rows.push([ this.id,
                  this.metadata.site,
                  this.metadata.date,
                  this.metadata.manager,
                  this.metadata.boat,
                  this.metadata.weather,
                  this.metadata.comments ]);
    for (const row of this.rows)
      rows.push([this.id, ...row]);
    return rows;
  }
}
