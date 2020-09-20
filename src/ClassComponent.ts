import { ClassDeclaration } from "@babel/types";
import { IComponent } from './IComponent';
import { IModel, IProperty } from './IModel';
export class ClassComponent implements IComponent {

    constructor(node: ClassDeclaration) {
        this.name = node.id.name;
        this.extentBegin = node.start;
        this.extentEnd = node.end;
        this.model = new ClassComponentModel(node.id.name + "Model");
    }
    model: IModel;
    template: string;
    name: string;
    passedProperties: IProperty[];
    extentBegin: number;
    extentEnd: number;
}

export class ClassComponentModel implements IModel {
    properties: Record<string, IProperty>;
    needsProps: boolean;

    constructor(public name: string) {}
}