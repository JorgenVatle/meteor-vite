import { parseMeteorPackage } from '@/plugin/meteor/parser/Parser';
import Path from 'path';
import { describe, it } from 'vitest';

describe('Client modules bundle', () => {
    it('can resolve npm packages', async () => {
        const filePath = Path.join(__dirname, '../__mocks/meteor-bundle/meteor-v2/example.react.modules.js.bundle');
        const meteorPackage = await parseMeteorPackage({ filePath });
        
        
        // traverse(parse('\n' +
        //     'if (process.env.NODE_ENV === \'production\') {\n' +
        //     '  module.exports = require(\'./cjs/react.production.min.js\');\n' +
        //     '} else {\n' +
        //     '  module.exports = require(\'./cjs/react.development.js\');\n' +
        //     '}\n'), {
        //     enter(node) {
        //         if (isAssignmentExpression(node)) {
        //             console.log(generate(node))
        //         }
        //         // console.log(node);
        //     }
        // })
      
        meteorPackage.result.node_modules?.forEach((e) => console.log(e.modules));
    })
})