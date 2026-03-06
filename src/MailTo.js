import UploadTarget from "./UploadTarget.js";

/**
 * UploadTarget implementation to send mail to a collating user.
 */
export default class MailTo extends UploadTarget {

  constructor(name, components) {
    super(name, components);
    // Receiving email
    this.email = this.components[0];
    this.tabulate = (this.components[1] === "tab");
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
