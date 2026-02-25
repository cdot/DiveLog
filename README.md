# DiveLog
Web app to capture dive log information and upload it to a spreadsheet on Google Drive

# Setup
First step is to set up a Google project. You can get help from ChatGPT on how to do that.

Then you'll have to create a file in the distribution called `ids.json` as follows:
```
{
    "CLIENT_ID": "<your google project client id>",
    "SPREADSHEET_ID": "<your spreadsheet id>"
}
```
the run `node build_ids.js <key>` where `<key>` is your unique key. When the app
is run, the key has to be provided in URL: `https://site/DiveLog?key=<key>`.
