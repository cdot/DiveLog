# DiveLog
Web app to capture dive log information and upload it to a spreadsheet on Google Drive

# Setup
First step is to set up a Google project. You can get help from ChatGPT on how to do that. Then you'll have to create a file in the distribution called `setup.js` as follows:
```
// MUST NOT BE CHECKED IN
const CLIENT_ID = "9456454643274-jhtaki6574nhdfnwwrvhgg5dqfn4chr9.apps.googleusercontent.com";
const SPREADSHEET_ID = "456of0aa4-7iTQKZvwNNsoefpf435jlkwf435klrpi7Y";

export { CLIENT_ID, SPREADSHEET_ID };
```
where `CLIENT_ID` is your Google client ID, and `SPREADSHEET_ID` is the ID of your spreadsheet.
