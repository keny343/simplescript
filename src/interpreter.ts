import { Expr, Program, Stmt } from './ast.js';
import { SimpleScriptError, SourceLocation } from './errors.js';

export type Value = number | string | boolean | null | SsFunction;

export interface SsFunction {
  __ssFunction: true;
  name: string;
  params: string[];
  body: Stmt;
  closure: Environment;
}

export function isSsFunction(v: Value): v is SsFunction {
  return typeof v === 'object' && v !== null && (v as SsFunction).__ssFunction === true;
}

export class Environment {
  private readonly values = new Map<string, Value>();

  constructor(private readonly enclosing: Environment | null = null) {}

  define(name: string, value: Value): void {
    this.values.set(name, value);
  }

  get(name: string, line: number, column: number): Value {
    if (this.values.has(name)) return this.values.get(name)!;
    if (this.enclosing) return this.enclosing.get(name, line, column);
    throw new SimpleScriptError(
      `Undefined variable '${name}'`,
      new SourceLocation(line, column),
      'runtime',
    );
  }

  assign(name: string, value: Value, line: number, column: number): void {
    if (this.values.has(name)) {
      this.values.set(name, value);
      return;
    }
    if (this.enclosing) {
      this.enclosing.assign(name, value, line, column);
      return;
    }
    throw new SimpleScriptError(
      `Undefined variable '${name}'`,
      new SourceLocation(line, column),
      'runtime',
    );
  }
}

class ReturnSignal {
  constructor(public readonly value: Value) {}
}

export interface RunResult {
  output: string[];
  value: Value;
}

export class Interpreter {
  private globals = new Environment();
  private environment = this.globals;
  private output: string[] = [];

  constructor(private readonly printFn: (line: string) => void = (l) => console.log(l)) {}

  run(program: Program): RunResult {
    this.output = [];
    this.globals = new Environment();
    this.environment = this.globals;
    let last: Value = null;

    for (const stmt of program.statements) {
      last = this.execute(stmt);
    }

    return { output: this.output, value: last };
  }

  private execute(stmt: Stmt): Value {
    switch (stmt.kind) {
      case 'LetStmt': {
        const value = this.evaluate(stmt.initializer);
        this.environment.define(stmt.name, value);
        return value;
      }
      case 'PrintStmt': {
        const value = this.evaluate(stmt.expression);
        const text = this.stringify(value);
        this.output.push(text);
        this.printFn(text);
        return value;
      }
      case 'ExprStmt':
        return this.evaluate(stmt.expression);
      case 'BlockStmt':
        return this.executeBlock(stmt.statements, new Environment(this.environment));
      case 'IfStmt': {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
          return this.execute(stmt.thenBranch);
        }
        if (stmt.elseBranch) return this.execute(stmt.elseBranch);
        return null;
      }
      case 'WhileStmt': {
        let last: Value = null;
        let guard = 0;
        while (this.isTruthy(this.evaluate(stmt.condition))) {
          last = this.execute(stmt.body);
          guard += 1;
          if (guard > 1_000_000) {
            throw new SimpleScriptError(
              'Infinite loop guard triggered',
              new SourceLocation(stmt.line, stmt.column),
              'runtime',
            );
          }
        }
        return last;
      }
      case 'FunStmt': {
        const fn: SsFunction = {
          __ssFunction: true,
          name: stmt.name,
          params: stmt.params,
          body: stmt.body,
          closure: this.environment,
        };
        this.environment.define(stmt.name, fn);
        return fn;
      }
      case 'ReturnStmt': {
        const value = stmt.value ? this.evaluate(stmt.value) : null;
        throw new ReturnSignal(value);
      }
    }
  }

  private executeBlock(statements: Stmt[], env: Environment): Value {
    const previous = this.environment;
    let last: Value = null;
    try {
      this.environment = env;
      for (const s of statements) {
        last = this.execute(s);
      }
    } finally {
      this.environment = previous;
    }
    return last;
  }

  private evaluate(expr: Expr): Value {
    switch (expr.kind) {
      case 'NumberLiteral':
        return expr.value;
      case 'StringLiteral':
        return expr.value;
      case 'BooleanLiteral':
        return expr.value;
      case 'Variable':
        return this.environment.get(expr.name, expr.line, expr.column);
      case 'AssignExpr': {
        const value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value, expr.line, expr.column);
        return value;
      }
      case 'UnaryExpr': {
        const right = this.evaluate(expr.operand);
        switch (expr.op) {
          case '-':
            this.checkNumber(right, expr.line, expr.column, 'Operand must be a number');
            return -(right as number);
          case '!':
          case 'not':
            return !this.isTruthy(right);
        }
        break;
      }
      case 'BinaryExpr': {
        if (expr.op === 'and') {
          const left = this.evaluate(expr.left);
          if (!this.isTruthy(left)) return left;
          return this.evaluate(expr.right);
        }
        if (expr.op === 'or') {
          const left = this.evaluate(expr.left);
          if (this.isTruthy(left)) return left;
          return this.evaluate(expr.right);
        }

        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.op) {
          case '+':
            if (typeof left === 'number' && typeof right === 'number') return left + right;
            if (typeof left === 'string' || typeof right === 'string') {
              return `${this.stringify(left)}${this.stringify(right)}`;
            }
            throw new SimpleScriptError(
              "Operands must be two numbers or involve a string",
              new SourceLocation(expr.line, expr.column),
              'runtime',
            );
          case '-':
            this.checkNumbers(left, right, expr.line, expr.column);
            return (left as number) - (right as number);
          case '*':
            this.checkNumbers(left, right, expr.line, expr.column);
            return (left as number) * (right as number);
          case '/':
            this.checkNumbers(left, right, expr.line, expr.column);
            if ((right as number) === 0) {
              throw new SimpleScriptError(
                'Division by zero',
                new SourceLocation(expr.line, expr.column),
                'runtime',
              );
            }
            return (left as number) / (right as number);
          case '%':
            this.checkNumbers(left, right, expr.line, expr.column);
            return (left as number) % (right as number);
          case '==':
            return left === right;
          case '!=':
            return left !== right;
          case '<':
            this.checkNumbers(left, right, expr.line, expr.column);
            return (left as number) < (right as number);
          case '<=':
            this.checkNumbers(left, right, expr.line, expr.column);
            return (left as number) <= (right as number);
          case '>':
            this.checkNumbers(left, right, expr.line, expr.column);
            return (left as number) > (right as number);
          case '>=':
            this.checkNumbers(left, right, expr.line, expr.column);
            return (left as number) >= (right as number);
        }
        break;
      }
      case 'CallExpr': {
        const callee = this.environment.get(expr.callee, expr.line, expr.column);
        if (!isSsFunction(callee)) {
          throw new SimpleScriptError(
            `'${expr.callee}' is not a function`,
            new SourceLocation(expr.line, expr.column),
            'runtime',
          );
        }
        if (expr.args.length !== callee.params.length) {
          throw new SimpleScriptError(
            `Expected ${callee.params.length} argument(s) but got ${expr.args.length}`,
            new SourceLocation(expr.line, expr.column),
            'runtime',
          );
        }
        const args = expr.args.map((a) => this.evaluate(a));
        return this.callFunction(callee, args);
      }
    }
    return null;
  }

  private callFunction(fn: SsFunction, args: Value[]): Value {
    const env = new Environment(fn.closure);
    for (let i = 0; i < fn.params.length; i += 1) {
      env.define(fn.params[i], args[i]);
    }
    try {
      this.executeBlock((fn.body as { statements: Stmt[] }).statements, env);
      return null;
    } catch (e) {
      if (e instanceof ReturnSignal) return e.value;
      throw e;
    }
  }

  private isTruthy(value: Value): boolean {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

  private stringify(value: Value): string {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (isSsFunction(value)) return `<fun ${value.name}>`;
    return String(value);
  }

  private checkNumber(v: Value, line: number, column: number, msg: string): void {
    if (typeof v !== 'number') {
      throw new SimpleScriptError(msg, new SourceLocation(line, column), 'runtime');
    }
  }

  private checkNumbers(a: Value, b: Value, line: number, column: number): void {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new SimpleScriptError(
        'Operands must be numbers',
        new SourceLocation(line, column),
        'runtime',
      );
    }
  }
}
