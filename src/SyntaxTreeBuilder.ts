import { parse } from "@babel/parser";
import {
    File,
    Node,
    ArrowFunctionExpression,
    FunctionDeclaration,
    JSXExpressionContainer,
    Identifier,
    MemberExpression,
    ClassDeclaration,
    ClassMethod,
    ArrayPattern,
    AssignmentPattern,
    ObjectPattern,
    ObjectProperty,
    TSParameterProperty,
    RestElement,
    VariableDeclarator,
    JSXElement,
    JSXAttribute,
    JSXOpeningElement,
    JSXOpeningFragment,
    TypeParameterInstantiation,
    JSXSpreadAttribute,
    JSXIdentifier
} from "@babel/types";
import traverse, { NodePath, VisitNodeFunction } from "@babel/traverse";
import path from 'path';
import { IModelExtractRules } from './IModelExtractRules';
import { ITemplateExtractRules } from './ITemplateExtractRules';
import { IComponent } from './IComponent';
import { FunctionalComponent, FunctionalModel } from './FunctionalComponent';
import { ClassComponent } from './ClassComponent';
import { isFunctionDeclaration, JsxOpeningElement } from 'typescript';
import { string } from 'yargs';
import { IModel } from './IModel';

export type JsCodeType = "script" | "module" | "unambiguous";
export type ContainerNode = FunctionDeclaration | ArrowFunctionExpression | ClassDeclaration;
export type PropertyBlock = ObjectPattern | Identifier[];
export type FunctionParams = (ArrayPattern | AssignmentPattern | Identifier | RestElement | ObjectPattern | TSParameterProperty)[];
export interface IModelProperty {
    name: string;
    type: string;
    repr(template: string): string;
}

export type ComponentBounds = {
    type: "ClassDeclaration" | "FunctionDeclaration" | "ArrowFunctionExpression",
    name: string,
    loc: {
        start: number,
        end: number
    },
    params: Record<string, IModelProperty>,
    hasChildren: boolean
}

/**
 * Consumes the given content and produces the AST File root level
 */
export function buildAst(content: string, codeType: JsCodeType) {
    return parse(content, { sourceType: codeType });
}

export const extractComponentBounds = (path: NodePath<JSXElement>): ComponentBounds => {
    const rootComponent = path.findParent(p => p.isFunctionDeclaration() || p.isArrowFunctionExpression() || p.isClassDeclaration());
    if (rootComponent) {
        const parentNode = rootComponent.node;
        let paramSet = getParams(parentNode as ContainerNode);
        // So this is the component we have walked up to, switch on type and assign applicable range bounds to the map
        switch (parentNode.type) {
            case "FunctionDeclaration":
                return {
                    type: "FunctionDeclaration",
                    name: parentNode.id.name,
                    loc: {
                        start: parentNode.start,
                        end: parentNode.end
                    },
                    ...paramSet
                };

            case "ArrowFunctionExpression":
                // arrow functions will shape as ArrowFn > BlockStatement > VariableDeclarator || ArrowFn > VariableDeclarator -- which has the name and extent
                let def = path.findParent(p => p.isVariableDeclarator()) as NodePath<VariableDeclarator>;
                let { name } = (<Identifier>def.node.id);

                return {
                    type: "ArrowFunctionExpression",
                    name,
                    loc: {
                        start: parentNode.start,
                        end: parentNode.end
                    },
                    ...paramSet
                };

            case "ClassDeclaration":
                name = parentNode.id.name;
                if (name && ((parentNode.superClass as MemberExpression).property as Identifier || parentNode.superClass as Identifier).name === "Component") {
                    return {
                        type: "ClassDeclaration",
                        name,
                        loc: {
                            start: parentNode.start,
                            end: parentNode.end
                        },
                        ...paramSet
                    };
                }
                return null;

            default:
                return null;
        }
    }
}

export const getParams = (container: ContainerNode) => {
    let hasChildren = false;
    let parameterSet: Record<string, IModelProperty> = {};
    let nodeParams: FunctionParams = [];
    switch (container.type) {
        case "FunctionDeclaration":
        case "ArrowFunctionExpression":
            nodeParams = container.params;
            break;

        case "ClassDeclaration":
            const cstrctor: ClassMethod = container.body.body.find(ctr => ctr.type === "ClassMethod" && ctr.kind === "constructor") as ClassMethod;
            nodeParams = cstrctor.params;
            break;
    }

    for (let pr of nodeParams) {
        switch (pr.type) {
            case "ObjectPattern":
                for (let prop of pr.properties.filter(p => p.type === "ObjectProperty")) {
                    let ident = (<ObjectProperty>prop).key as Identifier;
                    if (!(ident.name === "children")) {
                        parameterSet[ident.name] = null;
                    } else {
                        hasChildren = hasChildren || true;
                    }
                }
                break;
            case "Identifier":
                if (pr.name !== "children") {
                    parameterSet[pr.name];
                }
                hasChildren = !hasChildren && pr.name === "children";
                break;
        }
    }
    return {
        params: parameterSet,
        hasChildren
    };
}

export class ValueProperty implements IModelProperty {
    constructor(public name: string, public value: string) {

    }
    type: string = "string";
    repr(template: string): string {
        return template && template.replaceAll('{0}', this.value) || '';
    }

}

export function getCurrentComponent(reference: Node, found: Map<string, ComponentBounds>) {
    for (let [key, value] of found) {
        if (value.loc.start <= reference.start && value.loc.end >= reference.end) {
            return value;
        }
    }
    return null;
}

export function walkTree(ast: File, modelRules: IModelExtractRules, templateRules: ITemplateExtractRules, outPath: string) {
    let currentComponent: ComponentBounds = null;
    let componentsFound = new Map<string, ComponentBounds>();
    traverse(ast, {
        JSXElement: (path: NodePath<JSXElement>) => {
            // If this is a new item, add the bounds to the tracked set
            let component = extractComponentBounds(path);
            if (component) {
                // always set to increment components with multiple jsx blocks
                componentsFound.set(component.name, component);
            }
        },
        JSXOpeningElement: (path: NodePath<JSXOpeningElement>) => {
            currentComponent = getCurrentComponent(path.node, componentsFound);
            // Need to at this point use the above logic, and just recurse the tree, fetching the item in bounds of the nodepath, so there is only one run through the tree

            // process the attributes
            for (let compAttr of path.node.attributes) {
                switch (compAttr.type) {
                    case "JSXAttribute":
                        if (compAttr.name.type === "JSXIdentifier") {

                            let attrName = compAttr.name.name;
                            let val = compAttr.value;
                            let name: string = "";
                            switch (val.type) {
                                case "JSXExpressionContainer":
                                    name = (val.expression as Identifier).name;
                                    if (!Object.keys(currentComponent.params).some(n => n === name)) {
                                        throw new Error("Undefined property");
                                    }
                                    break;

                                case "StringLiteral":
                                    if (!currentComponent.params[name]) {
                                        currentComponent.params[name] = new ValueProperty(name, val.value);
                                    }
                            }
                        }
                        break;

                    default:
                        break;
                }
            }
        }
    });

    let models: Record<string, IModel> = {};
    let components: Record<string, ComponentBounds> = {};
    let templates: Record<string, string> = {};
    for (let [key, value] of componentsFound) {
        components[key] = value;
        let targetName = modelRules.rootNameTransformation(key);
        templates[key] = path.resolve(outPath, targetName + templateRules.fileExtension);
        let model = new FunctionalModel(value.name);
        Object.keys(value.params).forEach(pr => {
            let newName = modelRules.propertyNameTransformation(value.params[pr].name);
            let newType = modelRules.languageTypeMapping[value.params[pr].type];
            modelRules.declarationTemplate.replace('[name]', newName).replace('[type]', newType)
            model.properties[newName] = {
                name: newName,
                type: newType,
                isComplexType: /string|int|datetime|decimal|bool/.test(newType) === false,
                isArray: value.params[pr].type.endsWith("[]")
            }
        });
    }

    return {
        components,
        models,
        templates
    };
}

// TemplateElement are for interpolated strings, they contain:
// expressions for the interpolated items which are Literals
// quasis for the strings around the expressions, which are each TemplateElement > values: [raw, cooked], the attr tail denotes the end.
// anything in a {...} is a JSXExpressionContainer