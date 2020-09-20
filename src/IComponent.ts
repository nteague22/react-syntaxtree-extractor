import { IModel, IProperty } from './IModel';

export interface IComponent {
    model: IModel;
    template: string;
    name: string;
    passedProperties: IProperty[];
    extentBegin: number;
    extentEnd: number; 
}

