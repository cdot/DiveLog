import CloudStore from "./CloudStore.js";

/**
 * CloudStore implementation to send mail to a collating user.
 */
export default class MailTo extends CloudStore {

  constructor() {
    super();
    // Receiving email
    this.email = CloudStore.getKey(1);
    this.tabulate = (CloudStore.getKey(2) === "tab");
  }

  /**
   * @override
   */
  canUpload() {
    return this.email;
  }

  /**
   * @override
   */
  upload(pages) {
    const body = [];
    for (const page of pages)
      body.push(page.fullText(this.tabulate));
    const b = encodeURIComponent(body.join("\n"));
    window.open(`mailto:${this.email}?subject=Dive%20Logs&body=${b}`,
               "popup");
    return Promise.resolve(pages.map(p => p.uid));
  }
}
