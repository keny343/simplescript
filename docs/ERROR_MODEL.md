# Error model — SimpleScript

Errors are first-class in the pipeline. Each failure carries a **phase** and, when available, a **source location**.

## Type

```ts
class SimpleScriptError extends Error {
  location?: SourceLocation; // line + column
  phase: 'lex' | 'parse' | 'semantic' | 'runtime';
}
```

Message format:

```text
[phase] (line L, column C): human-readable message
```

Implemented in [`src/errors.ts`](../src/errors.ts).

## Phases

| Phase | When it fires | Typical causes |
|-------|---------------|----------------|
| `lex` | Character stream → tokens | Unexpected character, unterminated string |
| `parse` | Tokens → AST | Missing `;`, unexpected token, bad structure |
| `semantic` | Validated names / arity before run | Undefined variable or function, wrong arity, duplicate `let` / `fun` |
| `runtime` | Tree-walk execution | Division by zero, type mismatch, `while` iteration guard |

## Design rules

1. **Fail early** — semantic analysis runs before the interpreter so many name errors never become runtime surprises.
2. **One error at a time** — the current implementation throws on the first failure (clear for demos and CLI). Collecting multiple semantic errors is on the roadmap.
3. **Location when possible** — lexer and parser attach line/column; some runtime errors may omit location if the node has no span.
4. **Safe loops** — `while` stops after 1e6 iterations and reports a runtime error instead of hanging the process.

## Examples

```text
[lex] (line 1, column 5): Unexpected character '#'
[parse] (line 2, column 10): Expected ';' after expression
[semantic] (line 3, column 1): Undefined variable 'x'
[runtime]: Division by zero
```

## CLI behaviour

The CLI catches `SimpleScriptError`, prints the message to stderr, and exits with a non-zero status. Successful runs print interpreter `print(...)` output to stdout.
