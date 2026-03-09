import UploadTarget from "./UploadTarget.js";

/**
 * UploadTarget implementation for appending CSV data
 */
class PostCSV extends UploadTarget {

  constructor(name, components) {
    super(name, components);
    this.url = components[0];
  }

  /**
   * @override
   */
  canUpload() {
    return this.url; // URL
  }

  /**
   * @override
   */
  upload(pages) {

    function loadAuthCache() {
      const auths = localStorage.getItem("DiveLog_a");
      if (auths)
        return JSON.parse(auths);
      return {};
    }

    function saveAuthCache(cache) {
      localStorage.setItem("DiveLog_a", JSON.stringify(cache));
    }

    /**
     * Prompt for authentication information.
     * @param {string} url URL we want auth for
     * @param {string?} any previously encountered error
     * @return {Promise<undefined>} promise that resolves to undefined
     * @private
     */
    function prompt(url, err) {
      return new Promise((resolve, reject) => {
        fetch("./src/PostCSVLogin.html")
        .then(response => response.text())
        .then(html => {
          const container = document.createElement("div");
          container.innerHTML = html;
          document.body.appendChild(container);

          const loginBtn = document.getElementById("loginBtn");
          const cancelBtn = document.getElementById("cancelBtn");
          const errorBox = document.getElementById("loginError");
          errorBox.textContent = err;
          loginBtn.addEventListener("click", () => {
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            const cache = loadAuthCache();
            cache[url] = `${username}:${password}`;
            saveAuthCache(cache);

            container.remove();
            resolve();
          });

          cancelBtn.addEventListener("click", () => {
            container.remove();
            reject("Upload cancelled");
          });
        });
      });
    }

    /**
     * `fetch()` extended to support basic authentication
     */
    function fetchWithAuth(url, options) {
      const cache = loadAuthCache();
      if (cache[url])
        options.headers.set("Authorization", `Basic ${btoa(cache[url])}`);

      return fetch(url, options)
      .then(response => {
        if (!response.ok) {
          if (response.status === 401) {
            return prompt(url, `${response.status}: ${response.statusText}`)
            .then(() => fetchWithAuth(url, options));
          }
          throw new Error(response.status);
        }
        return true;
      });
    }

    const rows = [];
    // Break down pages into a list of rows
    pages.forEach(page => {
      const pageRows = page.flatten();
      rows.push(...pageRows);
    });

    let csv = "";
    for (const r of rows)
      csv += r.map(f => {
        if (typeof f === "string" && /[",\n]/)
          return `"${f.replace(/"/g, '""')}"`;
        return f;
      }).join(",") + "\n";
    console.debug("Uploading", csv);

    const headers = new Headers();
    headers.set("Content-type", "text/csv; charset=UTF-8");
    return fetchWithAuth(this.url, {
      method: "POST",
      body: csv,
      headers: headers
    })
    .then(() => pages.map(p => p.uid));
  }
}

export default PostCSV;
