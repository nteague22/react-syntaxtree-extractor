import { FunctionDeclaration, ObjectPattern, Identifier, Literal } from "@babel/types";
import { IModel, IProperty, StringProperty, DecimalProperty, IntProperty, BooleanProperty, DateTimeProperty, ArrayProperty, ModelProperty } from './IModel';
import { IComponent } from './IComponent';
import { NodePath } from '@babel/traverse';

export class FunctionalComponent implements IComponent {
    model: IModel;
    template: string;
    name: string;
    passedProperties: IProperty[];
    constructor(path: NodePath<FunctionDeclaration>) {
        const node = path.node;
        this.model = null;
        this.name = node.id.name;
        this.extentBegin = node.start;
        this.extentEnd = node.end;
        if (node.params.length === 1 && node.params[0].type === "ObjectPattern") {
            for (let pr of (<ObjectPattern>node.params[0]).properties) {
                let newProp: IProperty = null;
                switch (pr.type) {
                    case "ObjectProperty":
                        let param = pr.key as Identifier;
                        let pvalue = pr.value as Literal;
                        newProp = this.getLiteralPropertyType(pvalue, param.name);

                        if (!newProp) {
                            switch (pr.value.type) {
                                case "ArrayExpression":
                                    let innerProp = this.getLiteralPropertyType(pr.value.elements[0] as Literal, param.name);
                                    newProp = new ArrayProperty(param.name, innerProp);
                                    break;

                                case "ObjectExpression":
                                    newProp = new ModelProperty(param.name, "FunctionalParameterViewModel");
                                    break;

                                default:
                                    break;

                            }
                        }
                        break;

                        case "RestElement":
                            break;
                }
                if (newProp) {
                    this.passedProperties.push(newProp);
                }
            }
        }
    }
    extentBegin: number;
    extentEnd: number;

    getLiteralPropertyType(prop: Literal, name: string) {
        switch (prop.type) {
            case "DecimalLiteral":
                return new DecimalProperty(name);


            case "NumericLiteral":
                return new IntProperty(name);


            case "StringLiteral":
                if (Date.parse(prop.value)) {
                    return new DateTimeProperty(name);

                }
                return new StringProperty(name);


            case "BooleanLiteral":
                return new BooleanProperty(name);

            default:
                return null;
        }
    }
}

export class FunctionalModel implements IModel {
    properties: Record<string, IProperty>;
    needsProps: boolean;
    constructor(public name: string) {
        this.properties = {};
    }
}