import CloudStore from "./CloudStore.js";

/**
 * CloudStore implementation for appending CSV data
 */
export default class PostCSV extends CloudStore {

  /**
   * @override
   */
  canUpload() {
    return CloudStore.getKey(1); // URL
  }

  /**
   * @override
   */
  upload(rows) {
    if (rows.length === 0)
      return Promise.reject("Nothing to upload");
    let csv = "";
    for (const r of rows)
      csv += r.map(f => {
        if (typeof f === "string" && /[",\n]/)
          return `"${f.replace(/"/g, '""')}"`;
        return f;
      }).join(",") + "\n";
    console.debug("Uploading", csv);

    let url = CloudStore.getKey(1);
    const m = /([^:\/]+:[^:\/]*)@/.exec(url);
    const headers = new Headers();
    headers.set("Content-type", "text/csv; charset=UTF-8");
    if (m) {
      headers.set("Authorization", `Basic ${btoa(m[1])}`);
      url = url.replace(m[0], "");
    }
    return fetch(url, {
      method: "POST",
      body: csv,
      headers: headers
    })
    .then(async response => {
      if (!response.ok)
        throw new Error(response.status);
    });
  }
}
