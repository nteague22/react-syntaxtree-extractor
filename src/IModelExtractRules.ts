/**
 * Decisions on how to handle bound data for AOT rendering
 */
export interface IModelExtractRules {
    declarationTemplate?: string;
    languageTypeMapping?: Record<string, string>;
    rootNameTransformation?: (name: string) => string;
    propertyNameTransformation?: (name: string) => string;
    allowInlineExpressions?: boolean;
}

/*
    A component that has a literal attr -> value is : JSXAttribute.value<JSXExpressionContainer>.expression<Literal>.value
    name is JSXAttribute.name<JSXIdentifier>.name; the JSXAttribute>JSXIdentifier hierarchy should be a property on the resulting model
    unless the reserved <key>
*/
