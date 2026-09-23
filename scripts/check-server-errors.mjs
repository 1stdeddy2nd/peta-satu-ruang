#!/usr/bin/env node
// A spec asserts on the UI, which can look correct while the server 500s
// behind it — that is how a KML upload lost every feature for several sprints
// while the suite reported green.
import { readFileSync } from "node:fs";

const PATTERNS = [
  /\[WebServer\] Error\b/,
  /PrismaClientKnownRequestError/,
  /\[WebServer\].*Raw query failed/,
];

const file = process.argv[2];
const lines = readFileSync(file, "utf8").split("\n");
const hits = lines.filter((l) => PATTERNS.some((p) => p.test(l)));

if (hits.length === 0) process.exit(0);

console.error(`\n${hits.length} server error line(s) during the run:\n`);
for (const line of hits.slice(0, 10)) console.error(`  ${line.trim()}`);
if (hits.length > 10) console.error(`  … and ${hits.length - 10} more`);
console.error(`\nFull output: ${file}`);
process.exit(1);
