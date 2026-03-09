# DiveLog

Web app to capture dive logs offline, and upload them to the
cloud. The app looks as much as possible like a standard [BSAC](http://bsac.com) dive
log sheet and is written specifically for BSAC Dive
Managers who need to capture and submit dive logs to their Diving
Officer. It allows offline capture of dive logs, and upload once
internet is available again. Dive logs can be automatically sent to an
upload target, such as an online spreadsheet or an email address, so
that your Diving Officer can review and analyse the logs.

![empty dive log](images/filled.png)

Several common upload targets are supported by default, and it should
be fairly straightforward to add other services. Here's an example of
uploading to spreadsheet on Google Drive.

![google sheet](images/result.png)

The app can be used at
[https://cdot.github.io/DiveLog](https://cdot.github.io/DiveLog), or
you can clone your own copy and host it yourself. It should work in
any browser that supports HTML5. The app has no dependencies.

# Users

1. Visit the host website to [open the app](https://cdot.github.io/DiveLog) in your browser.
2. Enter your dives. You can enter as many as you like, they will be recorded locally.
5. When you have internet again, select your upload target and click "Upload" to upload your recorded dive logs. You can can add several different upload targets if you need to, depending on your what your club(s) use.

Upload targets are configured by a key that should be obtained from your
Diving Officer or sysadmin.

# System Administrators

The upload function is configured from an "upload key" that you give to users. This is a `|`-separated key string that may have many components, depending on the requirements of the store implementation. The first component is always the name of the upload target type, e.g. `DriveSheet` or `PostCSV` or `MailTo`. The remaining components differ for each different target type.

## DriveSheet

Append to a spreadsheet on Google Drive.

(Technobabble: Unfortunately Google makes this more clumsy than it
should be, due to the constraints of OAuth and CORS. We have to use
Cloudflare as a proxy.)

1. In the browser, log in to Google Drive as the user who is going to own the spreadsheet.
   - Create the spreadsheet. Select Extensions -> Apps Script and paste the content of [DriveSheet_AppScript.js](src/DriveSheet_AppScript.js)
   - Deploy - New deployment - Web App, Execute as Me, Anyone has access
   - Copy the appscript deployment ID e.g. `AKffhgkY4a1umthcAfpkHoaeksPWtAT-q4KBZa5SJVHKyXF-MYZfk8KeDqrn8CjJkMuFIteb` and keep it safe.
4. Log in to your [Cloudflare](https://cloudflare.com) account (Start for Free if necessary)
5. Create a "Hello World!" worker
6. Click "Edit code" and paste the content of `src/DriveSheet_CloudflareWorker.js`
7. Deploy the worker. Copy the cloudflare deployment ID  e.g. `sheet-proxy-d909.myusername.workers.dev`.
8. Make a key for sharing with your users in the format `DriveSheet|<cloudflare ID>|<appscript ID>` e.g.
```
DriveSheet|sheet-proxy-d909.myusername.workers.dev|AKffhgkY4a1umthcAfpkHoaeksPWtAT-q4KBZa5SJVHKyXF-MYZfk8KeDqrn8CjJkMuFIteb
```
By default the data will be uploaded to the first sheet in the spreadsheet where the App Script is deployed. You can optionally add a spreadsheet id and a sheet name to the key if you want to control this: `DriveSheet|<cloudflare ID>|<appscript ID>|<spreadsheet ID>|<sheet name>`. 

## MailTo

You can compose mail for sending the logs. The key format is
`MailTo|<mail recipient(s)>` where `<mail recipient(s)>` is a
comma-separated list of email addresses who will be sent the mail. The
rows in the log can either be formatted as comma-separated values
(CSV, the default) or as a fancy text table (add `|tab` to the end of
the key).

## PostCSV

If you have your own server you can POST to the server to upload CSV
data. The key format is `PostCSV|<endpoint URL>|<username>|<password>`
e.g. `PostCSV|https://my.server/uploadDiveLogs|myuser|secret`. The
repository includes a trivial node.js implementation of a suitable
server in [PostCSVServer.js](src/PostCSVServer.js).

### OneDrive

There is an untried implementation (written by ChatGPT) for uploading
to an Excel sheet on OneDrive. It might work, but you will probably
need a similar proxy approach as used for Google Drive to avoid issues
with OAuth.

# Developers

For more about development, see [DEVELOPING](DEVELOPING.md).

# About

DiveLog was created for use by member clubs of the British Sub-Aqua
Club (BSAC) by Crawford Currie. At time of writing the author is a
member of BSAC but is not affiliated in any other way.

If you like this application and find it useful, you can [buy me a coffee](https://ko-fi.com/crawfordcurrie).

DiveLog is distributed under the terms of the [GNU General Public License (GPL) version 3](https://www.gnu.org/licenses/gpl-3.0.en.html).
