export enum TokenType {
  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENT = 'IDENT',

  // Keywords
  LET = 'LET',
  PRINT = 'PRINT',
  IF = 'IF',
  ELSE = 'ELSE',
  WHILE = 'WHILE',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  FUN = 'FUN',
  RETURN = 'RETURN',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',

  // Operators
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  STAR = 'STAR',
  SLASH = 'SLASH',
  PERCENT = 'PERCENT',
  EQ = 'EQ',
  EQEQ = 'EQEQ',
  BANG = 'BANG',
  BANGEQ = 'BANGEQ',
  LT = 'LT',
  LTE = 'LTE',
  GT = 'GT',
  GTE = 'GTE',

  // Delimiters
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  COMMA = 'COMMA',
  SEMICOLON = 'SEMICOLON',

  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal: unknown;
  line: number;
  column: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  let: TokenType.LET,
  print: TokenType.PRINT,
  if: TokenType.IF,
  else: TokenType.ELSE,
  while: TokenType.WHILE,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  fun: TokenType.FUN,
  return: TokenType.RETURN,
  and: TokenType.AND,
  or: TokenType.OR,
  not: TokenType.NOT,
};
