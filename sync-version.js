#!/usr/bin/env node

/**
 * Reads the latest version from CHANGELOG.md and updates package.json to match.
 *
 * Usage:
 *   node sync-version.js
 *   node sync-version.js --changelog path/to/CHANGELOG.md --package path/to/package.json
 */

// @
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);

function getArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] ?? null : null;
}

const changelogPath = path.resolve(getArg("--changelog") ?? "CHANGELOG.md");
const packagePath = path.resolve(getArg("--package") ?? "package.json");

if (!fs.existsSync(changelogPath)) {
  console.error(`❌  CHANGELOG not found: ${changelogPath}`);
  process.exit(1);
}

if (!fs.existsSync(packagePath)) {
  console.error(`❌  package.json not found: ${packagePath}`);
  process.exit(1);
}

const changelog = fs.readFileSync(changelogPath, "utf8");
const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));

const VERSION_PATTERN = /^##\s+\[(\d+\.\d+\.\d+)\]/m;
const match = changelog.match(VERSION_PATTERN);

if (!match) {
  console.error(
    "❌  Could not find a version entry in the changelog.\n" +
      "    Expected format:  ## [X.Y.Z] — YYYY-MM-DD"
  );
  process.exit(1);
}

const changelogVersion = match[1];
const currentVersion = pkg.version;

if (currentVersion === changelogVersion) {
// eslint-disable-next-line no-console
  console.log(`✅  package.json is already at version ${currentVersion}. Nothing to do.`);
  process.exit(0);
}

// eslint-disable-next-line no-console
console.log(`🔄  Updating version: ${currentVersion} → ${changelogVersion}`);

pkg.version = changelogVersion;

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + "\n", "utf8");

// eslint-disable-next-line no-console
console.log(`✅  package.json updated to ${changelogVersion}`);
