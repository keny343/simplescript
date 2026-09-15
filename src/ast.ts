import { Token } from './token.js';

export type BinaryOp =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'and'
  | 'or';

export type UnaryOp = '-' | '!' | 'not';

export interface NodeBase {
  line: number;
  column: number;
}

export type Expr =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | Variable
  | BinaryExpr
  | UnaryExpr
  | CallExpr
  | AssignExpr;

export interface NumberLiteral extends NodeBase {
  kind: 'NumberLiteral';
  value: number;
}

export interface StringLiteral extends NodeBase {
  kind: 'StringLiteral';
  value: string;
}

export interface BooleanLiteral extends NodeBase {
  kind: 'BooleanLiteral';
  value: boolean;
}

export interface Variable extends NodeBase {
  kind: 'Variable';
  name: string;
}

export interface BinaryExpr extends NodeBase {
  kind: 'BinaryExpr';
  left: Expr;
  op: BinaryOp;
  right: Expr;
}

export interface UnaryExpr extends NodeBase {
  kind: 'UnaryExpr';
  op: UnaryOp;
  operand: Expr;
}

export interface CallExpr extends NodeBase {
  kind: 'CallExpr';
  callee: string;
  args: Expr[];
}

export interface AssignExpr extends NodeBase {
  kind: 'AssignExpr';
  name: string;
  value: Expr;
}

export type Stmt =
  | LetStmt
  | PrintStmt
  | ExprStmt
  | BlockStmt
  | IfStmt
  | WhileStmt
  | FunStmt
  | ReturnStmt;

export interface LetStmt extends NodeBase {
  kind: 'LetStmt';
  name: string;
  initializer: Expr;
}

export interface PrintStmt extends NodeBase {
  kind: 'PrintStmt';
  expression: Expr;
}

export interface ExprStmt extends NodeBase {
  kind: 'ExprStmt';
  expression: Expr;
}

export interface BlockStmt extends NodeBase {
  kind: 'BlockStmt';
  statements: Stmt[];
}

export interface IfStmt extends NodeBase {
  kind: 'IfStmt';
  condition: Expr;
  thenBranch: Stmt;
  elseBranch: Stmt | null;
}

export interface WhileStmt extends NodeBase {
  kind: 'WhileStmt';
  condition: Expr;
  body: Stmt;
}

export interface FunStmt extends NodeBase {
  kind: 'FunStmt';
  name: string;
  params: string[];
  body: BlockStmt;
}

export interface ReturnStmt extends NodeBase {
  kind: 'ReturnStmt';
  value: Expr | null;
}

export interface Program {
  kind: 'Program';
  statements: Stmt[];
}

export function locFromToken(token: Token): NodeBase {
  return { line: token.line, column: token.column };
}
