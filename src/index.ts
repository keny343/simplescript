import { Program } from './ast.js';
import { Interpreter, RunResult } from './interpreter.js';
import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { SemanticAnalyzer } from './semantic.js';
import { Token } from './token.js';

export interface PipelineResult extends RunResult {
  tokens: Token[];
  ast: Program;
}

export interface RunOptions {
  /** Skip semantic analysis (not recommended). */
  skipSemantic?: boolean;
  print?: (line: string) => void;
}

export function tokenize(source: string): Token[] {
  return new Lexer(source).tokenize();
}

export function parse(source: string): { tokens: Token[]; ast: Program } {
  const tokens = tokenize(source);
  const ast = new Parser(tokens).parse();
  return { tokens, ast };
}

export function run(source: string, options: RunOptions = {}): PipelineResult {
  const { tokens, ast } = parse(source);
  if (!options.skipSemantic) {
    new SemanticAnalyzer().analyze(ast);
  }
  const interpreter = new Interpreter(options.print ?? (() => undefined));
  const result = interpreter.run(ast);
  return { tokens, ast, ...result };
}

export function runWithConsole(source: string): PipelineResult {
  return run(source, { print: (line) => console.log(line) });
}
