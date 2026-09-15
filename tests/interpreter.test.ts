import { describe, expect, it } from 'vitest';
import { run } from '../src/index.js';
import { SimpleScriptError } from '../src/errors.js';

describe('Semantic + Interpreter', () => {
  it('runs the portfolio example', () => {
    const result = run(`
      let x = 10;
      let y = x + 20;
      print(y);
    `);
    expect(result.output).toEqual(['30']);
  });

  it('computes factorial with while', () => {
    const result = run(`
      let n = 5;
      let fact = 1;
      while (n > 0) {
        fact = fact * n;
        n = n - 1;
      }
      print(fact);
    `);
    expect(result.output).toEqual(['120']);
  });

  it('calls user functions', () => {
    const result = run(`
      fun add(a, b) {
        return a + b;
      }
      print(add(2, 3));
    `);
    expect(result.output).toEqual(['5']);
  });

  it('rejects undefined variables at semantic stage', () => {
    expect(() => run('print(missing);')).toThrow(SimpleScriptError);
  });

  it('rejects wrong arity', () => {
    expect(() =>
      run(`
        fun f(a) { return a; }
        print(f(1, 2));
      `),
    ).toThrow(SimpleScriptError);
  });

  it('divides and guards division by zero', () => {
    expect(run('print(10 / 2);').output).toEqual(['5']);
    expect(() => run('print(1 / 0);')).toThrow(/Division by zero/);
  });

  it('supports string concatenation and logic', () => {
    const result = run(`
      print("a" + "b");
      if (true and not false) { print("ok"); }
    `);
    expect(result.output).toEqual(['ab', 'ok']);
  });
});
