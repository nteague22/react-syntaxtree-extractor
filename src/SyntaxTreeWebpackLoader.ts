import { getRemainingRequest } from 'loader-utils';
import webpack from 'webpack';
import { buildAst, JsCodeType, walkTree } from "./SyntaxTreeBuilder";
export default async function (this: webpack.loader.LoaderContext, source: string | Buffer) {
    const callback = this.async();
    const fileName = this.resourcePath.replace(this.resourceQuery, '');
    let content = '';
    if (source instanceof Buffer) {
        content = source.toString("utf8")
    } else {
        content = source;
    }
    let ast = buildAst(content, "module");
    walkTree(ast, {
        allowInlineExpressions: true,
        languageTypeMapping: {
            string: [/^[A-Za-z]+$/],
            decimal: [/^\-?[0-9]*\.[0-9]+$/],
            int: [/^[0-9]+$/],
            DateTime: "Date",
            bool: "boolean"
        },
        rootNameTransformation: (name: string) => name.replace(/^([a-z])/, "$1".toUpperCase()),
        declarationTemplate: "public [type] [name] { get; set; }",
        propertyNameTransformation: (name: string) => name.replace(/^([a-z])/, "$1".toUpperCase())
    },
        {
            useNestedComponents: true,
            nestedComponentTemplate: "@{Html.RenderPartial([template], [model]);}"
        });
    callback(null, source);
    return;
}