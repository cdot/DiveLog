# UI

The UI is based on a standard BSAC dive log sheet, which should be
familiar to all dive managers and is repeatedly referenced in BSAC
training materials.

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

The API documentation for all classes used can be generated using the
`npm run doc` command, which creates a folder called `doc`.
