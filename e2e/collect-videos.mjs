// Playwright buries each video in a per-test output directory. Pull them out
// into e2e/videos/<ticket>.webm so they can be browsed in ticket order.
import fs from "fs";
import path from "path";

const OUT = "e2e/.output";
const DEST = "e2e/videos";

if (!fs.existsSync(OUT)) {
  console.log("no run output — did the tests run?");
  process.exit(0);
}
fs.mkdirSync(DEST, { recursive: true });

const collected = [];
for (const dir of fs.readdirSync(OUT)) {
  const ticket = dir.match(/MC-\d{3}/)?.[0];
  const from = path.join(OUT, dir, "video.webm");
  if (!ticket || !fs.existsSync(from)) continue;

  // Playwright truncates and hashes long output dir names, so derive the file
  // name from the spec-file prefix rather than the whole directory.
  const name = dir.match(/^(MC-\d{3}-.+?)-MC-/)?.[1] ?? dir;
  const to = path.join(DEST, `${name}.webm`);
  fs.copyFileSync(from, to);
  collected.push({ ticket, file: path.basename(to), kb: Math.round(fs.statSync(to).size / 1024) });
}

collected.sort((a, b) => a.ticket.localeCompare(b.ticket));
if (!collected.length) {
  console.log("no videos found");
} else {
  console.log(`\n${collected.length} walkthrough(s) in ${DEST}/\n`);
  for (const c of collected) console.log(`  ${c.file.padEnd(46)} ${String(c.kb).padStart(6)} KB`);
}
