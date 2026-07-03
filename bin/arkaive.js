#!/usr/bin/env node
import chalk from "chalk";
import { tag, search, list, untag, removeFile } from "../lib/core.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const args = process.argv.slice(2);
const [action, first, second] = args;

// helpers
const exit = (msg, code = 1) => {
  console.log(chalk.red(msg));
  process.exit(code);
};

try {
  if (!action) exit("No action provided");

  // HELP
  if (action === "--help" || action === "-h") {
    console.log(`
arkaive v${version}

Usage:
  arkaive tag <file> <tags>
  arkaive search <query>
  arkaive list <files|tags>
  arkaive untag <file> <tags>
  arkaive remove <file>
`);
    process.exit(0);
  }

  // VERSION
  if (action === "--version" || action === "-v") {
    console.log(`arkaive v${version}`);
    process.exit(0);
  }

  // TAG
  if (action === "tag" || action === "t") {
    if (!first || !second) exit("Usage: tag <file> <tags>");
    tag({ file: first, tags: second.split(",") });
    console.log(chalk.green("Tagged"));
  }

  // SEARCH
  else if (action === "search" || action === "s") {
    if (!first) exit("Usage: search <query>");
    const result = search(first);
    console.table(result);
  }

  // LIST
  else if (action === "list" || action === "l") {
    if (!first) exit("Usage: list <tags|files|tag_file>");
    const result = first === "tag_file" ? list(first, second) : list(first);
    console.table(result);
  }
  // UNTAG
  else if (action === "untag") {
    if (!first || !second) exit("Usage: untag <file> <tags>");
    untag({ file: first, tags: second.split(",") });
    console.log(chalk.green("Untagged"));
  }

  // REMOVE FILE
  else if (action === "remove") {
    if (!first) exit("Usage: remove <file>");
    removeFile(first);
    console.log(chalk.green("Removed"));
  } else {
    exit(`Unknown action: ${action}`);
  }
} catch (err) {
  exit(err.message);
}
