/**
 * Server that only accepts POST requests and appends request body
 * to a local CSV file.
  */
import { promises as Fs } from "fs";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
import Path from "path";
const __dirname = Path.dirname(__filename);

import Cors from "cors";
import Express from "express";
import BasicAuth from "express-basic-auth";
import bodyParser from "body-parser";
import HTTP from "http";
import HTTPS from "https";
import Getopt from "posix-getopt";

const DISTRIBUTION = Path.normalize(Path.join(__dirname, "..", ".."));

const DESCRIPTION = [
  "DESCRIPTION\nServer giving GET/POST access to static files and database, and AJAX requests for reading sensors attached to host Raspberry Pi.",
  "", "OPTIONS",
  "\t-h, --help - Show this help",
  `\t-p, --port=ARG - port to listen on (default 80))`,
  "\t-f, --file - .csv file to append post data to",
  "\t-u, --user - user and password for basic auth e.g. `brain:freeze` for user `brain` password `freeze`",
  "\tYou can give s many --user options as you want.",
  "", "\tThe server supports the following routes:",
  "\tPOST /uploadCSV - POST csv data to append to file"
].join("\n");

const go_parser = new Getopt.BasicParser(
  "p:(port)h(help)f:(file)u:(user)", process.argv);

let port = 80, csvFile = "dives.csv", users = [];
let option;
while ((option = go_parser.getopt())) {
  switch (option.option) {

  case "h": console.log(DESCRIPTION); process.exit();
  case "p": port = option.optarg; break;
  case "u": {
    const up = option.optarg.split(":");
    users[up[0]] = up[1];
    break;
  }
  case 'f': csvFile = true; break;
  default: throw Error(`Unknown option -${option.option}\n${DESCRIPTION}`);
  }
}

const server = new Express();

server.use(Cors());

if (Object.keys(users).length > 0) {
  console.debug("BasicAuth enabled");
  server.use(BasicAuth({
    users: users,
    challenge: true,
    realm: "Dive Club Resources"
  }));
}

server.use(bodyParser.text({ type: '*/*' }));
server.post("/upload", (req, res) => {
  const data = req.body;
  console.debug("Upload", typeof data, data);
  return Fs.readFile(csvFile)
  .then(old => Fs.writeFile(csvFile, old.toString() + data))
  .catch(e => {
    console.debug(e);
    return Fs.writeFile(csvFile, data);
  })
  .then(() => res.status(200).send("Uploaded"))
  .catch(e => {
    console.debug("POST failed", e);
    res.status(400).send("POST failed");
  });
});

HTTP.Server(server).listen(port);

