const yargs = require("yargs");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { promises } = require("fs");
const { walkTree } = require("./src/SyntaxTreeBuilder");
const { buildAst } = require("./src/index").default;

yargs
    .command("ancestry", "Shows ancestry of react elements in a file", {
        inFile: {
            alias: "in",
            type: "string",
            demandOption: true
        },
        outFile: {
            alias: "out",
            type: "string",
            demandOption: false
        }
    },
        (async (argv) => {
            const content = await promises.readFile(argv.inFile, { encoding: "utf8" });
            const ast = parse(content, { sourceType: "unambiguous", plugins: ["asyncGenerators", "jsx", "typescript"] });

            if (!ast) {
                console.error("The file did not parse correctly");
            }

            traverse(ast, {
                JSXElement: /** @param {import("@babel/traverse").NodePath<import("@babel/types").JSXElement>} path */function (path) {
                    console.log(`For Component ${path.node.openingElement.name.name}`);
                    console.log(`Extent: ${path.node.start} to ${path.node.end}`);
                    console.log(path.getAncestry().map(a => a.node.type));
                }
            });
        }).catch(console.error))
    .command("build", "build a component file and model file",
        {
            target: {
                alias: 'src',
                type: 'string',
                description: "The target file to read the JSX components from",
                demandOption: true
            },
            outPath: {
                alias: 'o',
                type: 'string',
                default: './',
                description: "The output path to create the template and model file"
            }
        },
        async (argv) => {
            const input = await promises.readFile(argv.target, { encoding: "utf8" });
            const ast = buildAst(input, "unambiguous");
            const results = walkTree(ast, {
                allowInlineExpressions: true,
                rootNameTransformation: (name) => name,
                propertyNameTransformation: (name) => name
            }, {
                useNestedComponents: true,
                nestedComponentTemplate: '@{Html.RenderPartial("[template]", [model]);}'
            }, argv.outPath);

            Object.keys(results.components).forEach(tgt => {
                // get the component files
                // build the model files
            });
        })
        .showHelpOnFail(true);
