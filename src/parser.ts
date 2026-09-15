import {
  AssignExpr,
  BinaryExpr,
  BlockStmt,
  BooleanLiteral,
  CallExpr,
  Expr,
  FunStmt,
  IfStmt,
  LetStmt,
  locFromToken,
  NumberLiteral,
  PrintStmt,
  Program,
  ReturnStmt,
  Stmt,
  StringLiteral,
  UnaryExpr,
  Variable,
  WhileStmt,
  ExprStmt,
  BinaryOp,
  UnaryOp,
} from './ast.js';
import { SimpleScriptError, SourceLocation } from './errors.js';
import { Token, TokenType } from './token.js';

export class Parser {
  private current = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): Program {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }
    return { kind: 'Program', statements };
  }

  private declaration(): Stmt {
    if (this.match(TokenType.FUN)) return this.funDeclaration();
    if (this.match(TokenType.LET)) return this.letDeclaration();
    return this.statement();
  }

  private funDeclaration(): FunStmt {
    const nameTok = this.consume(TokenType.IDENT, "Expected function name after 'fun'");
    this.consume(TokenType.LPAREN, "Expected '(' after function name");
    const params: string[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        const p = this.consume(TokenType.IDENT, 'Expected parameter name');
        params.push(p.lexeme);
      } while (this.match(TokenType.COMMA));
    }
    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    this.consume(TokenType.LBRACE, "Expected '{' before function body");
    const body = this.block();
    return {
      kind: 'FunStmt',
      name: nameTok.lexeme,
      params,
      body,
      ...locFromToken(nameTok),
    };
  }

  private letDeclaration(): LetStmt {
    const name = this.consume(TokenType.IDENT, "Expected variable name after 'let'");
    this.consume(TokenType.EQ, "Expected '=' after variable name");
    const initializer = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration");
    return {
      kind: 'LetStmt',
      name: name.lexeme,
      initializer,
      ...locFromToken(name),
    };
  }

  private statement(): Stmt {
    if (this.match(TokenType.PRINT)) return this.printStatement();
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();
    if (this.match(TokenType.LBRACE)) return this.block();
    return this.expressionStatement();
  }

  private printStatement(): PrintStmt {
    const tok = this.previous();
    this.consume(TokenType.LPAREN, "Expected '(' after 'print'");
    const expression = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after print expression");
    this.consume(TokenType.SEMICOLON, "Expected ';' after print statement");
    return { kind: 'PrintStmt', expression, ...locFromToken(tok) };
  }

  private ifStatement(): IfStmt {
    const tok = this.previous();
    this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
    const condition = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after if condition");
    const thenBranch = this.statement();
    let elseBranch: Stmt | null = null;
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }
    return { kind: 'IfStmt', condition, thenBranch, elseBranch, ...locFromToken(tok) };
  }

  private whileStatement(): WhileStmt {
    const tok = this.previous();
    this.consume(TokenType.LPAREN, "Expected '(' after 'while'");
    const condition = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after while condition");
    const body = this.statement();
    return { kind: 'WhileStmt', condition, body, ...locFromToken(tok) };
  }

  private returnStatement(): ReturnStmt {
    const tok = this.previous();
    let value: Expr | null = null;
    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after return");
    return { kind: 'ReturnStmt', value, ...locFromToken(tok) };
  }

  private block(): BlockStmt {
    const tok = this.previous();
    const statements: Stmt[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      statements.push(this.declaration());
    }
    this.consume(TokenType.RBRACE, "Expected '}' after block");
    return { kind: 'BlockStmt', statements, ...locFromToken(tok) };
  }

  private expressionStatement(): ExprStmt {
    const expression = this.expression();
    const tok = this.tokens[Math.max(0, this.current - 1)];
    this.consume(TokenType.SEMICOLON, "Expected ';' after expression");
    return { kind: 'ExprStmt', expression, line: tok.line, column: tok.column };
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    const expr = this.or();
    if (this.match(TokenType.EQ)) {
      const equals = this.previous();
      const value = this.assignment();
      if (expr.kind === 'Variable') {
        return {
          kind: 'AssignExpr',
          name: expr.name,
          value,
          line: equals.line,
          column: equals.column,
        } satisfies AssignExpr;
      }
      throw this.error(equals, 'Invalid assignment target');
    }
    return expr;
  }

  private or(): Expr {
    let expr = this.and();
    while (this.match(TokenType.OR)) {
      const opTok = this.previous();
      const right = this.and();
      expr = this.binary(expr, 'or', right, opTok);
    }
    return expr;
  }

  private and(): Expr {
    let expr = this.equality();
    while (this.match(TokenType.AND)) {
      const opTok = this.previous();
      const right = this.equality();
      expr = this.binary(expr, 'and', right, opTok);
    }
    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();
    while (this.match(TokenType.EQEQ, TokenType.BANGEQ)) {
      const opTok = this.previous();
      const op: BinaryOp = opTok.type === TokenType.EQEQ ? '==' : '!=';
      const right = this.comparison();
      expr = this.binary(expr, op, right, opTok);
    }
    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();
    while (this.match(TokenType.LT, TokenType.LTE, TokenType.GT, TokenType.GTE)) {
      const opTok = this.previous();
      const map: Record<string, BinaryOp> = {
        [TokenType.LT]: '<',
        [TokenType.LTE]: '<=',
        [TokenType.GT]: '>',
        [TokenType.GTE]: '>=',
      };
      const right = this.term();
      expr = this.binary(expr, map[opTok.type], right, opTok);
    }
    return expr;
  }

  private term(): Expr {
    let expr = this.factor();
    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const opTok = this.previous();
      const op: BinaryOp = opTok.type === TokenType.PLUS ? '+' : '-';
      const right = this.factor();
      expr = this.binary(expr, op, right, opTok);
    }
    return expr;
  }

  private factor(): Expr {
    let expr = this.unary();
    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const opTok = this.previous();
      const map: Record<string, BinaryOp> = {
        [TokenType.STAR]: '*',
        [TokenType.SLASH]: '/',
        [TokenType.PERCENT]: '%',
      };
      const right = this.unary();
      expr = this.binary(expr, map[opTok.type], right, opTok);
    }
    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.BANG, TokenType.NOT, TokenType.MINUS)) {
      const opTok = this.previous();
      const op: UnaryOp =
        opTok.type === TokenType.MINUS ? '-' : opTok.type === TokenType.NOT ? 'not' : '!';
      const operand = this.unary();
      return {
        kind: 'UnaryExpr',
        op,
        operand,
        ...locFromToken(opTok),
      } satisfies UnaryExpr;
    }
    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();
    while (this.match(TokenType.LPAREN)) {
      if (expr.kind !== 'Variable') {
        throw this.error(this.previous(), 'Can only call named functions');
      }
      const args: Expr[] = [];
      if (!this.check(TokenType.RPAREN)) {
        do {
          args.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      const paren = this.consume(TokenType.RPAREN, "Expected ')' after arguments");
      expr = {
        kind: 'CallExpr',
        callee: expr.name,
        args,
        line: paren.line,
        column: paren.column,
      } satisfies CallExpr;
    }
    return expr;
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) {
      const t = this.previous();
      return { kind: 'BooleanLiteral', value: false, ...locFromToken(t) } satisfies BooleanLiteral;
    }
    if (this.match(TokenType.TRUE)) {
      const t = this.previous();
      return { kind: 'BooleanLiteral', value: true, ...locFromToken(t) } satisfies BooleanLiteral;
    }
    if (this.match(TokenType.NUMBER)) {
      const t = this.previous();
      return {
        kind: 'NumberLiteral',
        value: t.literal as number,
        ...locFromToken(t),
      } satisfies NumberLiteral;
    }
    if (this.match(TokenType.STRING)) {
      const t = this.previous();
      return {
        kind: 'StringLiteral',
        value: t.literal as string,
        ...locFromToken(t),
      } satisfies StringLiteral;
    }
    if (this.match(TokenType.IDENT)) {
      const t = this.previous();
      return { kind: 'Variable', name: t.lexeme, ...locFromToken(t) } satisfies Variable;
    }
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }
    throw this.error(this.peek(), 'Expected expression');
  }

  private binary(left: Expr, op: BinaryOp, right: Expr, opTok: Token): BinaryExpr {
    return {
      kind: 'BinaryExpr',
      left,
      op,
      right,
      line: opTok.line,
      column: opTok.column,
    };
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current += 1;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): SimpleScriptError {
    return new SimpleScriptError(
      message,
      new SourceLocation(token.line, token.column),
      'parse',
    );
  }
}
