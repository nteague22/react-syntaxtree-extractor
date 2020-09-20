
export interface IModel {
    name: string;
    properties: Record<string, IProperty>;
    needsProps: boolean;
}

export interface IProperty {
    name: string;
    type: string;
    isComplexType: boolean;
    isArray: boolean;
}

export class StringProperty implements IProperty {
    type: string = "string";
    isComplexType: boolean = false;
    isArray: boolean = false;
    constructor(public name: string){}
}

export class IntProperty implements IProperty {
    type: string = "int";
    isComplexType: boolean = false;
    isArray: boolean = false;
    constructor(public name: string){}
}

export class DateTimeProperty implements IProperty {
    type: string = "datetime";
    isComplexType: boolean = false;
    isArray: boolean = false;
    constructor(public name: string){}

}

export class DecimalProperty implements IProperty {
    type: string = "decimal";
    isComplexType: boolean = false;
    isArray: boolean = false;
    constructor(public name: string) {

    }
}

export class BooleanProperty implements IProperty {
    type: string = "boolean";
    isComplexType: boolean = false;
    isArray: boolean = false;
    constructor(public name: string) {
        
    }
}

export class ModelProperty implements IProperty {
    type: string = "model";
    isComplexType: boolean = true;
    isArray: boolean = false;

    constructor(public name: string, public typeName: string) {}
}

export class ArrayProperty<T extends IProperty> implements IProperty {

    constructor(public name: string, property: T){
        if (property.isArray) {
            throw new Error("Currently arrays of arrays are not implemented");
        }
        this.type = property.type + "[]";
    }
    type: string;
    isComplexType: boolean = true;
    isArray: boolean = true;
}