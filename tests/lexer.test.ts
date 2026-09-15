import { describe, expect, it } from 'vitest';
import { Lexer } from '../src/lexer.js';
import { TokenType } from '../src/token.js';
import { SimpleScriptError } from '../src/errors.js';

describe('Lexer', () => {
  it('tokenizes the hello example', () => {
    const tokens = new Lexer('let x = 10; print(x);').tokenize();
    const types = tokens.map((t) => t.type);
    expect(types).toEqual([
      TokenType.LET,
      TokenType.IDENT,
      TokenType.EQ,
      TokenType.NUMBER,
      TokenType.SEMICOLON,
      TokenType.PRINT,
      TokenType.LPAREN,
      TokenType.IDENT,
      TokenType.RPAREN,
      TokenType.SEMICOLON,
      TokenType.EOF,
    ]);
    expect(tokens[3].literal).toBe(10);
  });

  it('handles strings and comments', () => {
    const tokens = new Lexer('print("hi"); // comment\n').tokenize();
    expect(tokens[2].type).toBe(TokenType.STRING);
    expect(tokens[2].literal).toBe('hi');
  });

  it('rejects unexpected characters', () => {
    expect(() => new Lexer('let x = 1 @ 2;').tokenize()).toThrow(SimpleScriptError);
  });
});
