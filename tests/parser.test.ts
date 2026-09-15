import { describe, expect, it } from 'vitest';
import { Parser } from '../src/parser.js';
import { Lexer } from '../src/lexer.js';
import { SimpleScriptError } from '../src/errors.js';

function parse(src: string) {
  return new Parser(new Lexer(src).tokenize()).parse();
}

describe('Parser', () => {
  it('builds an AST for let + print', () => {
    const ast = parse('let x = 10; let y = x + 20; print(y);');
    expect(ast.statements).toHaveLength(3);
    expect(ast.statements[0].kind).toBe('LetStmt');
    expect(ast.statements[2].kind).toBe('PrintStmt');
  });

  it('parses if/else and while', () => {
    const ast = parse('if (1 < 2) { print(1); } else { print(0); } while (false) { print(9); }');
    expect(ast.statements[0].kind).toBe('IfStmt');
    expect(ast.statements[1].kind).toBe('WhileStmt');
  });

  it('parses functions', () => {
    const ast = parse('fun add(a, b) { return a + b; }');
    expect(ast.statements[0].kind).toBe('FunStmt');
  });

  it('fails on missing semicolon', () => {
    expect(() => parse('let x = 1')).toThrow(SimpleScriptError);
  });
});
