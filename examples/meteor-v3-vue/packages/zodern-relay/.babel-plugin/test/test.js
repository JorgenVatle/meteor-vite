const assert = require('assert');
const path = require('path');

const transform = (str, filename = '/methods/index.js', arch = 'web.browser') => {
  return require('@babel/core').transform(str, {
    plugins: ['./plugin.js'],
    caller: {
      name: 'meteor',
      arch
    },
    filename
  }).code;
};

describe('Plugin', () => {
  it('should make file empty on client', () => {
    const code = 'const example = "Hello";';
    assert.equal(transform(code), '');
  });

  it('should ignore various types of exports', () => {
    const code = `
      export const a = true;
      export let b = true;
      export var c = true;
      export function d () {

      }

      export class A {}

      let h = true;
      export { h };
    `;
    assert.equal(transform(code), '');
  });

  describe('methods', () => {
    it('should leave code as is on the server', () => {
      const code = `
import { createMethod } from 'meteor/zodern:relay';
export default createMethod({
  name: 'myMethod'
});
      `;
      assert.equal(transform(code, '/methods/index.js', 'os.osx.x86_64'), code.trim());
    });
    it('should add missing names on the server', () => {
      const code = `
import { createMethod } from 'meteor/zodern:relay';
export const createProject = createMethod({
});
export default createMethod({
  
});
      `;
      const expected = `
import { createMethod } from 'meteor/zodern:relay';
export const createProject = createMethod({
  name: "createProjectM000bd"
});
export default createMethod({
  name: "projectsM000bd"
});
      `;
      assert.equal(transform(code, '/methods/projects.js', 'os.osx.x86_64'), expected.trim());
    });

    it('should add missing names on the client', () => {
      const code = `
import { createMethod } from 'meteor/zodern:relay';
export const createProject = createMethod({
});
export default createMethod({
  
});
      `;
      const expected = `
import { _createClientMethod } from "meteor/zodern:relay/client";
export const createProject = _createClientMethod("createProjectM000bd");
export default _createClientMethod("projectsM000bd");
      `;
      assert.equal(transform(code, '/methods/projects.js'), expected.trim());
    });

    it('should work in top level methods folders', () => {
      const code = `
import { createMethod } from 'meteor/zodern:relay';
export const createProject = createMethod({
});
export default createMethod({
  
});
      `;
      const expected = `
import { _createClientMethod } from "meteor/zodern:relay/client";
export const createProject = _createClientMethod("createProjectM169f1");
export default _createClientMethod("projectsM169f1");
      `;
      assert.equal(transform(code, path.resolve(__dirname, '../methods/projects.js')), expected.trim());
    });

    it('should handle default exports', () => {
      const code = `
        import { createMethod } from 'meteor/zodern:relay';
        export default createMethod({
          name: 'myMethod'
        });
      `;
      assert.equal(transform(code), `
import { _createClientMethod } from "meteor/zodern:relay/client";
export default _createClientMethod("myMethod");
      `.trim());
    });

    it('should handle named exports', () => {
      const code = `
        import { createMethod } from 'meteor/zodern:relay';
        export const myMethod = createMethod({ name: 'myMethod' });
      `;
      assert.equal(transform(code), `
import { _createClientMethod } from "meteor/zodern:relay/client";
export const myMethod = _createClientMethod("myMethod");
      `.trim());
    });

    it('should handle pipelines', () => {
      const code = `
        import { createMethod } from 'meteor/zodern:relay';
        export const myMethod = createMethod({ name: 'myMethod' })
          .pipeline(() => 5, (i) => i + 10);

        export default createMethod({ name: 'method2' }).pipeline(() => 5);
      `

      assert.equal(transform(code), `
import { _createClientMethod } from "meteor/zodern:relay/client";
export const myMethod = _createClientMethod("myMethod");
export default _createClientMethod("method2");
      `.trim());
    });

    it('should handle exporting member expressions', () => {
      const code = `
        import { createMethod } from 'meteor/zodern:relay';
        export const schema = z.number();
        export default z.string();
      `

      assert.equal(transform(code), '');
    });

    describe('stubs', () => {
      it('should use run function as stub', () => {
        const code = `
        import assert from 'assert';
        import * as n from './namespace';
        import { createMethod } from 'meteor/zodern:relay';
        import { generate } from '../generate';

        export const myMethod = createMethod({
          name: 'myMethod',
          stub: true,
          run(b) {
            generate();
            let a = 10;
            return 5 + a;
          }
        });

        export default createMethod({
          name: 'myMethod',
          stub: true,
          run: (b) => {
            generate();
            assert.equals(10, 10);
          }
        });
      `

        assert.equal(transform(code), `
        import { _createClientMethod } from "meteor/zodern:relay/client";
import { generate } from "../generate";
export const myMethod = _createClientMethod("myMethod", function (b) {
  generate();
  let a = 10;
  return 5 + a;
});
import { generate } from "../generate";
import assert from "assert";
export default _createClientMethod("myMethod", b => {
  generate();
  assert.equals(10, 10);
});
      `.trim());
      });

      it('should use stub function as stub', () => {
        const code = `
        import assert from 'assert';
        import { createMethod } from 'meteor/zodern:relay';
        import { generate } from '../generate';
        import * as n from './namespace';

        export const myMethod = createMethod({
          name: 'myMethod',
          stub(b) {
            n.b();
            generate();
            let a = 10;
            return 5 + a;
          },
          run() {}
        });

        export default createMethod({
          name: 'myMethod',
          stub: (b) => {
            generate();
            assert.equals(10, 10);
          },
          run() {}
        });
      `

        assert.equal(transform(code), `
        import { _createClientMethod } from "meteor/zodern:relay/client";
import * as n from "./namespace";
import { generate } from "../generate";
export const myMethod = _createClientMethod("myMethod", function (b) {
  n.b();
  generate();
  let a = 10;
  return 5 + a;
});
import { generate } from "../generate";
import assert from "assert";
export default _createClientMethod("myMethod", b => {
  generate();
  assert.equals(10, 10);
});
      `.trim());
      });
    });
  });

  describe('subscriptions', () => {
    it('should handle default exports', () => {
      const code = `
        import { createPublication } from 'meteor/zodern:relay';
        export default createPublication({ name: 'myPublication' });
      `;
      assert.equal(transform(code, '/publications/index.js'), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export default _createClientPublication("myPublication");
      `.trim());
    });

    it('should handle publications folder in the app root', () => {
      const code = `
        import { createPublication } from 'meteor/zodern:relay';
        export const myPublication = createPublication({ name: 'myPublication' });
      `;
      assert.equal(transform(code, path.resolve(__dirname, '../publications/index.js')), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export const myPublication = _createClientPublication("myPublication");
      `.trim());
    });
    it('should handle named exports', () => {
      const code = `
        import { createPublication } from 'meteor/zodern:relay';
        export const myPublication = createPublication({ name: 'myPublication' });
      `;
      assert.equal(transform(code, '/publications/index.js'), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export const myPublication = _createClientPublication("myPublication");
      `.trim());
    });

    it('should handle pipelines', () => {
      const code = `
        import { createPublication } from 'meteor/zodern:relay';
        export const sub1 = createPublication({ name: 'pub1' })
          .pipeline(() => []);

        export default createPublication({ name: 'pub2' }).pipeline(() => []);
      `

      assert.equal(transform(code, '/publications/index.js'), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export const sub1 = _createClientPublication("pub1");
export default _createClientPublication("pub2");
      `.trim());
    });

    it('should add missing names', () => {
      const code = `
        import { createPublication } from 'meteor/zodern:relay';
        export const subscribeProjects = createPublication({ })
          .pipeline(() => []);

        export default createPublication({ });
      `

      assert.equal(transform(code, '/publications/index.js'), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export const subscribeProjects = _createClientPublication("projectsM2962a");
export default _createClientPublication("indexM2962a");
      `.trim());
    });
  });

  describe('wrongFolder', () => {
    it('should handle unsupported export types', () => {
      const code = `
        export function a() {};
      `

      transform(code, '/index.js');
    })
    it('should leave methods as is outside of methods folder', () => {
      const code = `
import { createMethod } from 'meteor/zodern:relay';
export default createMethod({
  name: 'myMethod'
});
      `;
      assert.equal(transform(code, '/index.js'), code.trim());
    });
    it('should leave publications as is outside of publications folder', () => {
      const code = `
import { createPublication } from 'meteor/zodern:relay';
export default createPublication({
  name: 'myMethod'
});
      `;
      assert.equal(transform(code, '/index.js'), code.trim());
    });

    it('should ignore publications in methods folder', () => {
      const code = `
import { createPublication, createMethod } from 'meteor/zodern:relay';
export default createPublication({
  name: 'myPublication'
});
export const a = createMethod({
  name: 'other-method'
});
      `;
      assert.equal(transform(code, '/methods/index.js'), `
import { _createClientMethod } from "meteor/zodern:relay/client";
export const a = _createClientMethod("other-method");
`.trim());
    })

    it('should ignore methods in publications folder', () => {
      const code = `
import { createPublication, createMethod } from 'meteor/zodern:relay';
export default createPublication({
  name: 'myPub'
});
export const a = createMethod({
  name: 'other-method'
});
      `;
      assert.equal(transform(code, '/publications/index.js'), `
import { _createClientPublication } from "meteor/zodern:relay/client";
export default _createClientPublication("myPub");
`.trim());
    })
  });
});
