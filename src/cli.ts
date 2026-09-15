#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SimpleScriptError } from './errors.js';
import { runWithConsole, tokenize, parse } from './index.js';

function usage(): never {
  console.log(`SimpleScript — educational interpreter

Usage:
  npx tsx src/cli.ts <file.ss>
  npx tsx src/cli.ts --tokens <file.ss>
  npx tsx src/cli.ts --ast <file.ss>
  npx tsx src/cli.ts -e "let x = 1; print(x);"

Examples:
  npx tsx src/cli.ts examples/hello.ss
`);
  process.exit(1);
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  try {
    if (args[0] === '-e' || args[0] === '--eval') {
      const source = args[1];
      if (!source) usage();
      runWithConsole(source);
      return;
    }

    if (args[0] === '--tokens') {
      const file = args[1];
      if (!file) usage();
      const source = readFileSync(resolve(file), 'utf8');
      console.log(JSON.stringify(tokenize(source), null, 2));
      return;
    }

    if (args[0] === '--ast') {
      const file = args[1];
      if (!file) usage();
      const source = readFileSync(resolve(file), 'utf8');
      console.log(JSON.stringify(parse(source).ast, null, 2));
      return;
    }

    const file = args[0];
    const source = readFileSync(resolve(file), 'utf8');
    runWithConsole(source);
  } catch (err) {
    if (err instanceof SimpleScriptError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

main();
