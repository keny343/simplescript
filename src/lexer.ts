import { KEYWORDS, Token, TokenType } from './token.js';
import { SimpleScriptError, SourceLocation } from './errors.js';

export class Lexer {
  private readonly source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private startColumn = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    this.tokens = [];
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.startColumn = this.column;
      this.scanToken();
    }
    this.tokens.push({
      type: TokenType.EOF,
      lexeme: '',
      literal: null,
      line: this.line,
      column: this.column,
    });
    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();
    switch (c) {
      case '(':
        this.addToken(TokenType.LPAREN);
        break;
      case ')':
        this.addToken(TokenType.RPAREN);
        break;
      case '{':
        this.addToken(TokenType.LBRACE);
        break;
      case '}':
        this.addToken(TokenType.RBRACE);
        break;
      case ',':
        this.addToken(TokenType.COMMA);
        break;
      case ';':
        this.addToken(TokenType.SEMICOLON);
        break;
      case '+':
        this.addToken(TokenType.PLUS);
        break;
      case '-':
        this.addToken(TokenType.MINUS);
        break;
      case '*':
        this.addToken(TokenType.STAR);
        break;
      case '%':
        this.addToken(TokenType.PERCENT);
        break;
      case '/':
        if (this.match('/')) {
          while (this.peek() !== '\n' && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case '=':
        this.addToken(this.match('=') ? TokenType.EQEQ : TokenType.EQ);
        break;
      case '!':
        this.addToken(this.match('=') ? TokenType.BANGEQ : TokenType.BANG);
        break;
      case '<':
        this.addToken(this.match('=') ? TokenType.LTE : TokenType.LT);
        break;
      case '>':
        this.addToken(this.match('=') ? TokenType.GTE : TokenType.GT);
        break;
      case '"':
        this.string();
        break;
      case ' ':
      case '\r':
      case '\t':
        break;
      case '\n':
        this.line += 1;
        this.column = 1;
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          throw new SimpleScriptError(
            `Unexpected character '${c}'`,
            new SourceLocation(this.line, this.startColumn),
            'lex',
          );
        }
    }
  }

  private string(): void {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line += 1;
        this.column = 1;
      }
      this.advance();
    }
    if (this.isAtEnd()) {
      throw new SimpleScriptError(
        'Unterminated string',
        new SourceLocation(this.line, this.startColumn),
        'lex',
      );
    }
    this.advance(); // closing "
    const value = this.source.slice(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    while (this.isDigit(this.peek())) this.advance();
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) this.advance();
    }
    const text = this.source.slice(this.start, this.current);
    this.addToken(TokenType.NUMBER, Number(text));
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance();
    const text = this.source.slice(this.start, this.current);
    const type = KEYWORDS[text] ?? TokenType.IDENT;
    let literal: unknown = null;
    if (type === TokenType.TRUE) literal = true;
    if (type === TokenType.FALSE) literal = false;
    this.addToken(type, literal);
  }

  private addToken(type: TokenType, literal: unknown = null): void {
    const lexeme = this.source.slice(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      literal,
      line: this.line,
      column: this.startColumn,
    });
  }

  private advance(): string {
    const c = this.source.charAt(this.current);
    this.current += 1;
    this.column += 1;
    return c;
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.source.charAt(this.current) !== expected) return false;
    this.current += 1;
    this.column += 1;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source.charAt(this.current + 1);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private isDigit(c: string): boolean {
    return c >= '0' && c <= '9';
  }

  private isAlpha(c: string): boolean {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }
}
