import UploadTarget from "./UploadTarget.js";

/**
 * UploadTarget implementation to send mail to a collating user.
 */
class MailTo extends UploadTarget {

  constructor(name, components) {
    super(name, components);
    // Receiving email
    this.email = components[0];
    this.tabulate = (components[1] === "tab");
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
    const b = encodeURIComponent(body.join("\n--------------------\n"));
    window.open(`mailto:${this.email}?subject=Dive%20Logs&body=${b}`,
               "popup");
    return Promise.resolve(pages.map(p => p.uid));
  }
}

export default MailTo;
