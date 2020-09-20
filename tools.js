const yargs = require("yargs");
const { parse } = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { promises } = require("fs");

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
    .command("components", "Get the component targets for extraction",
        {},
        (async (argv) => {

        }).catch(console.error))
        .showHelpOnFail(true);
