import { promises as Fs } from "fs";
import { E, D } from "./src/ED.js";

const secret = process.argv[2];

Fs.readFile("ids.json")
.then(b => {
  const ids = JSON.parse(b.toString());
  let s = [], s2 = [];
  for (const k in ids) {
    const e = E(ids[k], secret);
    s.push(`"${e}"`);
    s2.push(k);
    //console.log(k, D(e,secret));
  }
  return `const IDS=[${s.join(",")}];\nexport default IDS`;
})
.then(s => Fs.writeFile("ids.js", s));
