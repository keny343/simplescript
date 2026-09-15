import { Expr, FunStmt, Program, Stmt } from './ast.js';
import { SimpleScriptError, SourceLocation } from './errors.js';

/**
 * Lightweight semantic pass:
 * - variables must be declared before use (within known scopes)
 * - function arity is checked when the callee is a known fun declaration
 * - duplicate declarations in the same scope are rejected
 */
export class SemanticAnalyzer {
  private scopes: Array<Map<string, 'var' | 'fun'>> = [new Map()];
  private functions = new Map<string, number>();
  private errors: SimpleScriptError[] = [];

  analyze(program: Program): void {
    this.errors = [];
    this.scopes = [new Map()];
    this.functions.clear();

    // First pass: register top-level functions for forward references
    for (const stmt of program.statements) {
      if (stmt.kind === 'FunStmt') {
        this.declareFun(stmt);
      }
    }

    for (const stmt of program.statements) {
      this.statement(stmt);
    }

    if (this.errors.length > 0) {
      throw this.errors[0];
    }
  }

  private declareFun(stmt: FunStmt): void {
    if (this.functions.has(stmt.name) || this.scopes[0].has(stmt.name)) {
      this.fail(`Duplicate declaration of '${stmt.name}'`, stmt.line, stmt.column);
      return;
    }
    this.functions.set(stmt.name, stmt.params.length);
    this.scopes[0].set(stmt.name, 'fun');
  }

  private statement(stmt: Stmt): void {
    switch (stmt.kind) {
      case 'LetStmt':
        this.expression(stmt.initializer);
        this.declare(stmt.name, 'var', stmt.line, stmt.column);
        break;
      case 'PrintStmt':
        this.expression(stmt.expression);
        break;
      case 'ExprStmt':
        this.expression(stmt.expression);
        break;
      case 'BlockStmt':
        this.beginScope();
        for (const s of stmt.statements) this.statement(s);
        this.endScope();
        break;
      case 'IfStmt':
        this.expression(stmt.condition);
        this.statement(stmt.thenBranch);
        if (stmt.elseBranch) this.statement(stmt.elseBranch);
        break;
      case 'WhileStmt':
        this.expression(stmt.condition);
        this.statement(stmt.body);
        break;
      case 'FunStmt':
        // already registered at top-level; nested funs also register locally
        if (!this.functions.has(stmt.name) || this.scopes.length > 1) {
          if (this.scopes.length > 1) {
            this.declare(stmt.name, 'fun', stmt.line, stmt.column);
            this.functions.set(stmt.name, stmt.params.length);
          }
        }
        this.beginScope();
        for (const p of stmt.params) {
          this.declare(p, 'var', stmt.line, stmt.column);
        }
        for (const s of stmt.body.statements) this.statement(s);
        this.endScope();
        break;
      case 'ReturnStmt':
        if (stmt.value) this.expression(stmt.value);
        break;
    }
  }

  private expression(expr: Expr): void {
    switch (expr.kind) {
      case 'NumberLiteral':
      case 'StringLiteral':
      case 'BooleanLiteral':
        break;
      case 'Variable':
        if (!this.resolve(expr.name)) {
          this.fail(`Undefined variable '${expr.name}'`, expr.line, expr.column);
        }
        break;
      case 'AssignExpr':
        if (!this.resolve(expr.name)) {
          this.fail(`Undefined variable '${expr.name}'`, expr.line, expr.column);
        }
        this.expression(expr.value);
        break;
      case 'BinaryExpr':
        this.expression(expr.left);
        this.expression(expr.right);
        break;
      case 'UnaryExpr':
        this.expression(expr.operand);
        break;
      case 'CallExpr': {
        const arity = this.functions.get(expr.callee);
        if (arity === undefined && !this.resolve(expr.callee)) {
          this.fail(`Undefined function '${expr.callee}'`, expr.line, expr.column);
        } else if (arity !== undefined && arity !== expr.args.length) {
          this.fail(
            `Function '${expr.callee}' expects ${arity} argument(s), got ${expr.args.length}`,
            expr.line,
            expr.column,
          );
        }
        for (const a of expr.args) this.expression(a);
        break;
      }
    }
  }

  private declare(name: string, kind: 'var' | 'fun', line: number, column: number): void {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope.has(name)) {
      this.fail(`Duplicate declaration of '${name}' in this scope`, line, column);
      return;
    }
    scope.set(name, kind);
  }

  private resolve(name: string): boolean {
    for (let i = this.scopes.length - 1; i >= 0; i -= 1) {
      if (this.scopes[i].has(name)) return true;
    }
    return this.functions.has(name);
  }

  private beginScope(): void {
    this.scopes.push(new Map());
  }

  private endScope(): void {
    this.scopes.pop();
  }

  private fail(message: string, line: number, column: number): void {
    this.errors.push(
      new SimpleScriptError(message, new SourceLocation(line, column), 'semantic'),
    );
  }
}
