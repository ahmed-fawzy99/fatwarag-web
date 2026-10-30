#!/usr/bin/env node
/**
 * Adds a fresh ASK_LINK_KEY to web/.env.local (or the file given as the first argument) without ever printing it.
 * The value is "<keyId>:<32 random bytes, base64url>". If the file already defines ASK_LINK_KEY nothing is changed:
 * to rotate, put a new entry first and keep the old ones after it, comma-separated (e.g. "k2:…,k1:…").
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const file = resolve(process.argv[2] ?? new URL("../.env.local", import.meta.url).pathname);
const keyId = process.argv[3] ?? "k1";

// Only the variable names are checked; no value is read out or shown.
const defined = existsSync(file) && /^\s*ASK_LINK_KEY\s*=/m.test(readFileSync(file, "utf8"));
if (defined) {
  console.log(`ASK_LINK_KEY is already set in ${file}; nothing changed.`);
  process.exit(0);
}

const needsNewline = existsSync(file) && !readFileSync(file, "utf8").endsWith("\n") && readFileSync(file, "utf8").length > 0;
appendFileSync(file, `${needsNewline ? "\n" : ""}ASK_LINK_KEY=${keyId}:${randomBytes(32).toString("base64url")}\n`, { mode: 0o600 });
console.log(`Added ASK_LINK_KEY (${keyId}) to ${file}.`);
