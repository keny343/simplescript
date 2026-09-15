# Architecture — SimpleScript

```text
Source (.ss)
    │
    ▼
 Lexer  →  Token[]
    │
    ▼
 Parser (recursive descent)  →  AST
    │
    ▼
 Semantic Analyzer  →  validated AST
    │
    ▼
 Interpreter (tree-walk)  →  stdout / values
```

## Pipeline modules

| Module | Responsibility |
|--------|----------------|
| `src/token.ts` | Token types + keyword table |
| `src/lexer.ts` | Character stream → tokens |
| `src/ast.ts` | Typed AST node definitions |
| `src/parser.ts` | Pratt-style precedence via recursive descent |
| `src/semantic.ts` | Scope rules, arity checks |
| `src/interpreter.ts` | Environments, functions, evaluation |
| `src/index.ts` | Public `run()` API |
| `src/cli.ts` | File / eval / dump tokens / dump AST |

## Design choices

- **Tree-walk interpreter** instead of bytecode — clearer for learning and portfolio review.
- **Separate semantic pass** so undefined names fail before execution.
- **Closures** via environment chaining when defining `fun`.
- **Infinite-loop guard** on `while` (1e6 iterations) for safety in demos.

## Surfaces

| Surface | Entry |
|---------|--------|
| Library API | `src/index.ts` → `run()` / `tokenize` / `parse` |
| CLI | `src/cli.ts` (`npx tsx src/cli.ts …`) |
| Playground | `npm run playground` → Vite app in `playground/` |

All three share the same modules; the playground is a thin UI, not a second language implementation.

## Error model

See [`ERROR_MODEL.md`](./ERROR_MODEL.md). Failures are typed by pipeline phase (`lex` | `parse` | `semantic` | `runtime`).

## Inspired by

Classic textbook pipeline (Dragon Book / Crafting Interpreters), implemented as a small, documented TypeScript project — not a framework CRUD.
