export class SourceLocation {
  constructor(
    public readonly line: number,
    public readonly column: number,
  ) {}

  toString(): string {
    return `line ${this.line}, column ${this.column}`;
  }
}

export class SimpleScriptError extends Error {
  constructor(
    message: string,
    public readonly location?: SourceLocation,
    public readonly phase: 'lex' | 'parse' | 'semantic' | 'runtime' = 'runtime',
  ) {
    const loc = location ? ` (${location})` : '';
    super(`[${phase}]${loc}: ${message}`);
    this.name = 'SimpleScriptError';
  }
}
