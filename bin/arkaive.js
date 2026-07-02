#!/usr/bin/env node
import chalk from "chalk";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json");

const args = process.argv.slice(2);

// Handle help
// if (args.includes("--help") || args.includes("-h")) {
//   console.log(`
// ${chalk.bold.green("arkaive")} ")} ${chalk.yellow(`v${version}`)}

// ${chalk.cyan("Usage:")}

// ${chalk.cyan("Options:")}
//   ${chalk.yellow("--help, -h")}       Show this help message
//   ${chalk.yellow("--version, -v")}    Show version number

// ${chalk.cyan("Arguments:")}
//   ${chalk.yellow("d / e")}          Action: decrypt or encrypt
//   ${chalk.yellow("<file>")}           Path to the save file
//   ${chalk.yellow("<output|'self'>")}  Output path or "self" to overwrite

// ${chalk.cyan("Examples:")}
//  ${chalk.green("hkse d user1.dat self")}
//  ${chalk.green("hkse e user1.dat user1_encrypted.dat")}
// `);
//   process.exit(0);
// }

// Handle version
if (args.includes("--version") || args.includes("-v") || args.includes("--v")) {
  console.log(chalk.yellow(`arkaive version ${version}`));
  process.exit(0);
}

// Require at least 3 args (action, file, output)
if (args.length < 3) {
  console.log(chalk.red(`Usage: hkse <d|e> <file> <output|"self">`));
  process.exit(1);
}

// const [action, file, outputArg] = args;
// const outputPath = outputArg === "self" ? null : outputArg;

// try {
//   if (action === "d" || action === "e") {
//     console.log(chalk.blue(`Processing ${file}...`));
//     pathCrypt(file, outputPath, action);
//     console.log(chalk.green(`✅ Done!`));
//   } else {
//     throw new Error("Action must be 'd' or 'e'");
//   }
// } catch (err) {
//   console.error(chalk.red(err.message));
//   process.exit(1);
// }
