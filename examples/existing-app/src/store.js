import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = new URL("../notes.json", import.meta.url);

export function load() {
  return existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : [];
}

export function save(notes) {
  writeFileSync(FILE, JSON.stringify(notes, null, 2));
}
