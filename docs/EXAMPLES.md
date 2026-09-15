# Examples — SimpleScript

Sample programs live in [`examples/`](../examples/). Run any of them with:

```bash
npx tsx src/cli.ts examples/<file>.ss
```

Or open the visual playground:

```bash
npm run playground
```

## Catalog

| File | What it shows |
|------|----------------|
| [`hello.ss`](../examples/hello.ss) | `let`, arithmetic, `print` |
| [`factorial.ss`](../examples/factorial.ss) | `while`, `if` / `else`, mutation |
| [`functions.ss`](../examples/functions.ss) | `fun`, `return`, string concat, calls |
| [`logic.ss`](../examples/logic.ss) | `and` / `or` / `not`, comparisons, booleans |

## Minimal walkthrough

```simplescript
let x = 10;
let y = x + 20;
print(y);        // 30
```

Pipeline:

1. Lexer → tokens for keywords, identifiers, numbers, operators  
2. Parser → AST (`VarDecl`, `Assign` / expressions, `Print`)  
3. Semantic → `x` and `y` declared before use  
4. Interpreter → environment bindings, evaluate, print `30`

## Inspect intermediate forms

```bash
npx tsx src/cli.ts --tokens examples/hello.ss
npx tsx src/cli.ts --ast examples/hello.ss
```

Useful in interviews to show that the project is a real front-end to a compiler pipeline, not only a REPL wrapper.
