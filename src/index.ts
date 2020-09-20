import { buildAst, walkTree, extractComponentBounds } from "./SyntaxTreeBuilder";
import { JSXElement, VariableDeclarator, Identifier } from "@babel/types";
import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";

export default {
    buildAst,
    walkTree,
    extractComponentBounds
}