# Coding standards

All code in this project must conform to the following coding standards:
- OO ES6 Javascript
- No external dependencies
- Clear JSDoc documentation of all classes, methods, and parameters
- 2 space indentation
- CamelCase for class names, methods, and parameters
 
# UI

The UI is based on a standard BSAC dive log sheet, which should be
familiar to all dive managers and is repeatedly referenced in BSAC
training materials. It is defined in `index.html`.

# Architecture

Each dive log sheet is referred to as a `Page`. A Page contains
metadata such as the Site and Divemanager, and a 2D array of rows,
just like the BSAC dive log sheet.

A list of pages awaiting upload is stored in localStorage in the
browser.  This list is managed by a singleton instance of `Pages`,
which also provides UI support.

When log sheets are captured offline, they are stored in localStorage
in the browser until they need to be uploaded. Pages are uploaded
using an "UploadTarget", such as "DriveSheet" or "MailTo". These
upload targets handle the mechanics of actually uploading the Pages.

Uploads are configured using "keys". These are |-separated
strings. The first field of a key string is always the name of the
upload target, and the remaining fields are the configuration
information required for that target. The user can have as many upload
targets as they need e.g. if they dive with different clubs.

The [API documentation](doc/index.html) for all classes used can be generated
in a checkout using the `npm run doc` command.
