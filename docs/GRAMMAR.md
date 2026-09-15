# Grammar — SimpleScript

EBNF-style grammar for the language implemented in this repository.

```ebnf
program        = { declaration } ;

declaration    = funDecl | varDecl | statement ;

funDecl        = "fun" IDENT "(" [ parameters ] ")" block ;
parameters      = IDENT { "," IDENT } ;
varDecl        = "let" IDENT "=" expression ";" ;

statement      = exprStmt
               | printStmt
               | ifStmt
               | whileStmt
               | returnStmt
               | block ;

exprStmt       = expression ";" ;
printStmt      = "print" "(" expression ")" ";" ;
ifStmt         = "if" "(" expression ")" statement [ "else" statement ] ;
whileStmt      = "while" "(" expression ")" statement ;
returnStmt     = "return" [ expression ] ";" ;
block          = "{" { declaration } "}" ;

expression     = assignment ;
assignment     = IDENT "=" assignment | logic_or ;
logic_or       = logic_and { "or" logic_and } ;
logic_and      = equality { "and" equality } ;
equality       = comparison { ( "==" | "!=" ) comparison } ;
comparison     = term { ( "<" | "<=" | ">" | ">=" ) term } ;
term           = factor { ( "+" | "-" ) factor } ;
factor         = unary { ( "*" | "/" | "%" ) unary } ;
unary          = ( "!" | "not" | "-" ) unary | call ;
call           = primary { "(" [ arguments ] ")" } ;
arguments      = expression { "," expression } ;
primary        = NUMBER | STRING | "true" | "false" | IDENT
               | "(" expression ")" ;
```

## Tokens

| Kind | Examples |
|------|----------|
| Keywords | `let` `print` `if` `else` `while` `fun` `return` `true` `false` `and` `or` `not` |
| Literals | `42` `3.14` `"text"` |
| Operators | `+ - * / % = == != < <= > >= !` |
| Delimiters | `( ) { } , ;` |
| Comment | `//` to end of line |

## Error phases

1. **lex** — unexpected character, unterminated string  
2. **parse** — missing `;`, bad structure  
3. **semantic** — undefined variable/function, wrong arity, duplicate declaration  
4. **runtime** — division by zero, type errors, infinite-loop guard  
