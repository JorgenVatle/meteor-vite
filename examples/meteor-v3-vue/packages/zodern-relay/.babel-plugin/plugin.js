const { createHash } = require('crypto');
const path = require('path');

// If has a MemberExpression, returns the first call expression in its callee
// Otherwise, returns the call expression
function getFirstCallExpr(call) {
  if (call.node.callee.type !== 'MemberExpression') {
    return call;
  }


  if (
    call.node.callee.object.type !== 'CallExpression'
  ) {
    return;
  }

  return call.get('callee.object');
}

module.exports = function (api) {
  let t = api.types;

  let caller;
  api.caller(function (c) {
    caller = c;
  });

  function createExport(exportName, callee, name, stub) {
    let args = [
      t.StringLiteral(name)
    ];

    if (stub) {
      if (stub.type === 'ObjectMethod') {
        stub = t.FunctionExpression(
          null,
          stub.node.params || [],
          stub.node.body,
          stub.node.generator,
          stub.node.async
        )
      } else if (stub.type === 'ObjectProperty') {
        stub = stub.node.value;
      }
      args.push(stub);
    }

    const declaration = t.CallExpression(
      t.Identifier(callee),
      args
    );

    if (exportName === null) {
      return t.ExportDefaultDeclaration(
        declaration
      );
    }

    return t.ExportNamedDeclaration(
      t.VariableDeclaration(
        'const',
        [t.VariableDeclarator(
          t.Identifier(exportName),
          declaration
        )]
      )
    )
  }

  function getOrAddName(args, { exportName, filePath, isPub }) {
    if (args[0].type !== 'ObjectExpression') {
      return;
    }

    let obj = args[0];
    let nameProperty = obj.properties.find((property) => {
      if (property.key.type !== 'Identifier') {
        return false;
      }

      if (property.key.name !== 'name') {
        return false;
      }

      return property.value.type === 'StringLiteral';
    });

    if (nameProperty) {
      return nameProperty.value.value;
    }

    let fileHash = 'M' + createHash('sha256')
      .update(filePath)
      .digest('hex')
      .substring(0, 5);

    let name = exportName;

    if (name === null) {
      let baseName = path.basename(filePath);
      let lastDotIndex = baseName.lastIndexOf('.');
      name = baseName.substring(0, lastDotIndex);
    } else if (isPub && name.startsWith('subscribe')) {
      name = exportName.substring('subscribe'.length);

      if (name[0] !== name[0].toLowerCase()) {
        name = `${name[0].toLowerCase()}${name.substring(1)}`
      }
    }

    name += fileHash;

    obj.properties.push(t.ObjectProperty(
      t.Identifier('name'),
      t.StringLiteral(name)
    ));

    return name;
  }

  // TODO: args should be a path instead of node
  function findStubPropertyIndex(args) {
    let obj = args[0];
    let stubPropIndex = obj.properties.findIndex((property) => {
      if (property.key.type !== 'Identifier') {
        return false;
      }

      if (property.key.name !== 'stub') {
        return false;
      }

      return true;
    });
    let stub = obj.properties[stubPropIndex];

    if (!stub) {
      return -1;
    }

    if (
       stub.type === 'ObjectMethod' ||
      stub.value.type === 'FunctionExpression' ||
      stub.value.type === 'ArrowFunctionExpression'
    ) {
      return stubPropIndex;
    }


    if (stub.value.type !== 'BooleanLiteral') {
      return -1;
    }

    if (stub.value.value !== true) {
      return -1;
    }

    // stub is set to true - use the run function
    return obj.properties.findIndex((property) => {
      if (property.key.type !== 'Identifier') {
        return false;
      }

      if (property.key.name !== 'run') {
        return false;
      }

      return true;
    });
  }

  let canHaveMethods = false;
  let canHavePublications = false;
  let createMethodName = null;
  let createPublicationName = null;
  let methods = [];
  let publications = [];
  let isServer = false;
  let filePath = ''
  let imports = Object.create(null);

  return {
    visitor: {
      Program: {
        enter(_, state) {
          createMethodName = null;
          createPublicationName = null;
          methods = [];
          publications = [];

          let relPath = path
            .relative(state.cwd, state.filename)
            .split(path.sep)
            .join(path.posix.sep);
          filePath = relPath;

          canHaveMethods = relPath.includes('/methods/') || relPath.startsWith('methods/');
          canHavePublications = relPath.includes('/publications/') || relPath.startsWith('publications/');

          isServer = caller.arch.startsWith('os.');

          if (!canHaveMethods && !canHavePublications) {
            return;
          }
        },
        exit(path) {
          if (isServer || !canHaveMethods && !canHavePublications) {
            return;
          }

          if (methods.length === 0 && publications.length === 0) {
            path.node.body = [];
            return;
          }

          let body = [];

          let importSpecifiers = [];
          if (methods.length > 0) {
            importSpecifiers.push(
              t.ImportSpecifier(t.Identifier('_createClientMethod'), t.Identifier('_createClientMethod'))
            );
          }
          if (publications.length > 0) {
            importSpecifiers.push(
              t.ImportSpecifier(t.Identifier('_createClientPublication'), t.Identifier('_createClientPublication'))
            )
          }

          let importDecl = t.ImportDeclaration(
            importSpecifiers,
            t.StringLiteral('meteor/zodern:relay/client'),
          );

          body.push(importDecl);

          methods.forEach(method => {
            if (method.stub) {
              let stubBody = method.stub.get('body').node ?
                method.stub.get('body') : method.stub.get('value.body');
              stubBody.traverse({
                ReferencedIdentifier(subPath) {
                  if (stubBody.scope.hasOwnBinding(subPath.node.name)) {
                    return;
                  }

                  if (subPath.node.name in imports) {
                    let importDesc = imports[subPath.node.name];

                    let specifier;
                    if (importDesc.type === 'ImportDefaultSpecifier') {
                      specifier = t.ImportDefaultSpecifier(t.Identifier(subPath.node.name));
                    } else if (importDesc.type === 'ImportNamespaceSpecifier') {
                      specifier = t.ImportNamespaceSpecifier(t.Identifier(subPath.node.name));
                    } else {
                      specifier = t.ImportSpecifier(
                        t.Identifier(importDesc.importName),
                        t.Identifier(subPath.node.name)
                      );
                    }

                    // TODO: we should preserve the original order of the imports
                    body.push(t.ImportDeclaration(
                      [ specifier ],
                      t.StringLiteral(importDesc.source)
                    ));
                  }
                }
              });
            }

            body.push(
              createExport(method.export, '_createClientMethod', method.name, method.stub)
            );
          });

          publications.forEach(publication => {
            body.push(
              createExport(publication.export, '_createClientPublication', publication.name)
            );
          });

          path.node.body = body;

          return;
        },
      },
      ImportDeclaration(path) {
        path.node.specifiers.forEach(specifier => {
          let type = specifier.type;
          let hasImportName = type !== 'ImportDefaultSpecifier' &&
            type !== 'ImportNamespaceSpecifier'
          imports[specifier.local.name] = {
            type,
            importName: hasImportName ?
              specifier.imported.name :
              null,
            source: path.node.source.value
          };

          if (!hasImportName) {
            return;
          }

          if (canHaveMethods && specifier.imported.name === 'createMethod') {
            createMethodName = specifier.local.name;
          }
          if (canHavePublications && specifier.imported.name === 'createPublication') {
            createPublicationName = specifier.local.name;
          }
        });
      },
      ExportDefaultDeclaration(path) {
        if (path.node.declaration.type !== 'CallExpression') {
          return;
        }

        let call = getFirstCallExpr(path.get('declaration'));

        if (!call) {
          return;
        }

        if (
          call.node.callee.name === createMethodName
        ) {
          let name = getOrAddName(call.node.arguments, {
            exportName: null,
            filePath,
            isPub: false
          });
          if (name === undefined) {
            throw new Error('Unable to find name for createMethod');
          }
          let stubPropIndex = findStubPropertyIndex(call.node.arguments);
          let stub;
          if (stubPropIndex > -1) {
            stub = call.get(`arguments.0.properties.${stubPropIndex}`);
          }

          methods.push({
            name: name,
            export: null,
            stub
          });
        }

        if (
          call.node.callee.name === createPublicationName
        ) {
          let name = getOrAddName(call.node.arguments, {
            exportName: null,
            filePath,
            isPub: true
          });
          if (name === undefined) {
            throw new Error('Unable to find name for createMethod');
          }

          publications.push({
            name: name,
            export: null
          });
        }
      },
      ExportNamedDeclaration(path) {
        let declaration = path.get('declaration');

        if (
          // null when the code is something like "export { h };"
          !declaration.node ||
          declaration.isFunctionDeclaration()
        ) {
          return;
        }

        if (declaration.type == 'ClassDeclaration') {
          return;
        }

        if (declaration.type !== 'VariableDeclaration') {
          throw new Error(`export declarations of type ${declaration.type} are not supported`);
        }

        declaration.get('declarations').forEach(vDeclaration => {
          if (!vDeclaration.isVariableDeclarator()) {
            throw new Error(`Unsupported declaration type in VariableDeclaration: ${vDeclaration.node.type}`);
          }

          if (!vDeclaration.get('init').isCallExpression()) {
            return;
          }

          let call = getFirstCallExpr(vDeclaration.get('init'));

          if (!call) {
            return;
          }

          if (
            call.node.callee.name === createMethodName
          ) {
            let name = getOrAddName(call.node.arguments, {
              exportName: vDeclaration.node.id.name,
              filePath,
              isPub: false
            });
            if (name === undefined) {
              throw new Error('Unable to find name for createMethod');
            }
            let stubPropIndex = findStubPropertyIndex(call.node.arguments);
            let stub;
            if (stubPropIndex > -1) {
              stub = call.get(`arguments.0.properties.${stubPropIndex}`);
            }
            methods.push({
              name: name,
              export: vDeclaration.node.id.name,
              stub
            });
          }

          if (
            call.node.callee.name === createPublicationName
          ) {
            let name = getOrAddName(call.node.arguments, {
              exportName: vDeclaration.node.id.name,
              filePath,
              isPub: true
            });
            if (name === undefined) {
              throw new Error('Unable to find name for createMethod');
            }

            publications.push({
              name: name,
              export: vDeclaration.node.id.name
            });
          }
        })
      }
    }
  };
}
