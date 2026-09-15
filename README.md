# SimpleScript

**Educational programming language** — lexer → parser → AST → semantic analysis → interpreter.

TypeScript · Node.js ≥ 18 · Vitest · GitHub Actions

---

## What it is

**SimpleScript** is a small language built to demonstrate **compiler / interpreter fundamentals**, not another web CRUD.

You write:

```simplescript
let x = 10;
let y = x + 20;
print(y);
```

The runtime:

1. **Tokenizes** the source  
2. **Parses** into an AST  
3. **Validates** names and function arity  
4. **Executes** with a tree-walk interpreter  

## Problem

Portfolio projects often show frameworks only. Recruiters rarely see evidence of:

- grammars and tokens  
- recursive-descent parsing  
- scoped environments  
- runtime error design  

## Solution

A complete, tested pipeline in TypeScript with:

| Stage | Module |
|-------|--------|
| Lexer | `src/lexer.ts` |
| Parser | `src/parser.ts` |
| AST | `src/ast.ts` |
| Semantic analysis | `src/semantic.ts` |
| Interpreter | `src/interpreter.ts` |
| CLI | `src/cli.ts` |

## Language features

- Variables (`let`) and assignment  
- Numbers, strings, booleans  
- Arithmetic and comparisons  
- `and` / `or` / `not`  
- `if` / `else`, `while`  
- Functions (`fun`) with `return` and closures  
- `print(...)`  
- `//` line comments  

## Quick start

```bash
git clone https://github.com/keny343/simplescript.git
cd simplescript
npm install
npm test
npx tsx src/cli.ts examples/hello.ss
```

Eval one-liner:

```bash
npx tsx src/cli.ts -e "let x = 10; let y = x + 20; print(y);"
```

Inspect tokens / AST:

```bash
npx tsx src/cli.ts --tokens examples/hello.ss
npx tsx src/cli.ts --ast examples/hello.ss
```

## Examples

| File | Demonstrates |
|------|----------------|
| [`examples/hello.ss`](./examples/hello.ss) | Variables + print |
| [`examples/factorial.ss`](./examples/factorial.ss) | `while` + `if` |
| [`examples/functions.ss`](./examples/functions.ss) | `fun` + `return` |
| [`examples/logic.ss`](./examples/logic.ss) | Boolean logic + strings |

## Playground (optional UI)

Browser demo of the same pipeline (editor + tokens / AST / output):

```bash
npm run playground
```

Opens Vite on `http://localhost:5173` using [`playground/`](./playground/) and the TypeScript runtime under `src/`.

## Documentation

- [`docs/GRAMMAR.md`](./docs/GRAMMAR.md) — EBNF, tokens, error phases  
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — pipeline design  
- [`docs/ERROR_MODEL.md`](./docs/ERROR_MODEL.md) — lex / parse / semantic / runtime errors  
- [`docs/EXAMPLES.md`](./docs/EXAMPLES.md) — sample programs and how to run them  

## Project layout

```text
simplescript/
├── src/           # lexer, parser, AST, semantic, interpreter, CLI
├── examples/      # .ss sample programs
├── playground/    # optional Vite UI over the same runtime
├── tests/         # Vitest suite
├── docs/          # grammar, architecture, errors, examples
└── .github/workflows/ci.yml
```

## Tests & CI

```bash
npm install
npm run typecheck
npm test
npm run build
```

CI runs `npm ci` → typecheck → tests on every push (Node 20).

## Challenges solved

- Precedence and associativity without a parser generator  
- Distinguishing parse errors from semantic / runtime errors  
- Scoped environments and function closures  
- Safe `while` with an iteration guard  

## Roadmap

- [ ] REPL mode  
- [ ] Better multi-error reporting (collect all semantic errors)  
- [ ] Bytecode VM backend (optional second execution path)  

## License

MIT
