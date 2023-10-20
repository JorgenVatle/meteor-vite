//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package['modules-runtime'].meteorInstall;
var verifyErrors = Package['modules-runtime'].verifyErrors;

var require = meteorInstall({"node_modules":{"meteor":{"modules":{"client.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/client.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
require("./install-packages.js");
require("./stubs.js");
require("./process.js");
require("./reify.js");

exports.addStyles = require("./css").addStyles;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"css.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/css.js                                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var doc = document;
var head = doc.getElementsByTagName("head").item(0);

exports.addStyles = function (css) {
  var style = doc.createElement("style");

  style.setAttribute("type", "text/css");

  // https://msdn.microsoft.com/en-us/library/ms535871(v=vs.85).aspx
  var internetExplorerSheetObject =
    style.sheet || // Edge/IE11.
    style.styleSheet; // Older IEs.

  if (internetExplorerSheetObject) {
    internetExplorerSheetObject.cssText = css;
  } else {
    style.appendChild(doc.createTextNode(css));
  }

  return head.appendChild(style);
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"install-packages.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/install-packages.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function install(name, mainModule) {
  var meteorDir = {};

  // Given a package name <name>, install a stub module in the
  // /node_modules/meteor directory called <name>.js, so that
  // require.resolve("meteor/<name>") will always return
  // /node_modules/meteor/<name>.js instead of something like
  // /node_modules/meteor/<name>/index.js, in the rare but possible event
  // that the package contains a file called index.js (#6590).

  if (typeof mainModule === "string") {
    // Set up an alias from /node_modules/meteor/<package>.js to the main
    // module, e.g. meteor/<package>/index.js.
    meteorDir[name + ".js"] = mainModule;
  } else {
    // back compat with old Meteor packages
    meteorDir[name + ".js"] = function (r, e, module) {
      module.exports = Package[name];
    };
  }

  meteorInstall({
    node_modules: {
      meteor: meteorDir
    }
  });
}

// This file will be modified during computeJsOutputFilesMap to include
// install(<name>) calls for every Meteor package.

install("meteor");
install("meteor-base");
install("mobile-experience");
install("modules-runtime");
install("modules-runtime-hot");
install("modules", "meteor/modules/client.js");
install("modern-browsers");
install("babel-compiler");
install("es5-shim");
install("promise", "meteor/promise/client.js");
install("ecmascript-runtime-client", "meteor/ecmascript-runtime-client/modern.js");
install("hot-module-replacement");
install("react-fast-refresh");
install("ecmascript");
install("ecmascript-runtime");
install("babel-runtime");
install("fetch", "meteor/fetch/modern.js");
install("dynamic-import", "meteor/dynamic-import/client.js");
install("base64", "meteor/base64/base64.js");
install("ejson", "meteor/ejson/ejson.js");
install("diff-sequence", "meteor/diff-sequence/diff.js");
install("geojson-utils", "meteor/geojson-utils/main.js");
install("id-map", "meteor/id-map/id-map.js");
install("random", "meteor/random/main_client.js");
install("mongo-id", "meteor/mongo-id/id.js");
install("ordered-dict", "meteor/ordered-dict/ordered_dict.js");
install("tracker");
install("minimongo", "meteor/minimongo/minimongo_client.js");
install("check", "meteor/check/match.js");
install("retry", "meteor/retry/retry.js");
install("callback-hook", "meteor/callback-hook/hook.js");
install("ddp-common");
install("reload", "meteor/reload/reload.js");
install("socket-stream-client", "meteor/socket-stream-client/browser.js");
install("ddp-client", "meteor/ddp-client/client/client.js");
install("ddp");
install("ddp-server");
install("allow-deny");
install("mongo-dev-server");
install("logging", "meteor/logging/logging.js");
install("mongo");
install("minifier-css");
install("standard-minifier-css");
install("standard-minifier-js");
install("typescript");
install("shell-server");
install("static-html");
install("zodern:types");
install("webapp", "meteor/webapp/webapp_client.js");
install("jorgenvatle:vite-bundler", "meteor/jorgenvatle:vite-bundler/client.ts");
install("tmeasday:check-npm-versions", "meteor/tmeasday:check-npm-versions/check-npm-versions.ts");
install("reactive-dict", "meteor/reactive-dict/migration.js");
install("session", "meteor/session/session.js");
install("rdb:svelte-meteor-data", "meteor/rdb:svelte-meteor-data/index.js");
install("hot-code-push");
install("launch-screen");
install("autoupdate", "meteor/autoupdate/autoupdate_client.js");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"process.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/process.js                                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (! global.process) {
  try {
    // The application can run `npm install process` to provide its own
    // process stub; otherwise this module will provide a partial stub.
    global.process = require("process");
  } catch (missing) {
    global.process = {};
  }
}

var proc = global.process;

if (Meteor.isServer) {
  // Make require("process") work on the server in all versions of Node.
  meteorInstall({
    node_modules: {
      "process.js": function (r, e, module) {
        module.exports = proc;
      }
    }
  });
} else {
  proc.platform = "browser";
  proc.nextTick = proc.nextTick || Meteor._setImmediate;
}

if (typeof proc.env !== "object") {
  proc.env = {};
}

var hasOwn = Object.prototype.hasOwnProperty;
for (var key in meteorEnv) {
  if (hasOwn.call(meteorEnv, key)) {
    proc.env[key] = meteorEnv[key];
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reify.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/reify.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
require("@meteorjs/reify/lib/runtime").enable(
  module.constructor.prototype
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"stubs.js":function module(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/stubs.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var haveStubs = false;
try {
  require.resolve("meteor-node-stubs");
  haveStubs = true;
} catch (noStubs) {}

if (haveStubs) {
  // When meteor-node-stubs is installed in the application's root
  // node_modules directory, requiring it here installs aliases for stubs
  // for all Node built-in modules, such as fs, util, and http.
  require("meteor-node-stubs");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"@meteorjs":{"reify":{"lib":{"runtime":{"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/modules/node_modules/@meteorjs/reify/lib/runtime/index.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var utils = require("./utils.js");
var Entry = require("./entry.js");

// The exports.enable method can be used to enable the Reify runtime for
// specific module objects, or for Module.prototype (where implemented),
// to make the runtime available throughout the entire module system.
exports.enable = function (mod) {
  if (mod.link !== moduleLink) {
    mod.link = moduleLink;
    mod["export"] = moduleExport;
    mod.exportDefault = moduleExportDefault;
    mod.exportAs = moduleExportAs;
    mod.runSetters = runSetters;

    // Legacy shorthand for mod.exportAs("*").
    mod.makeNsSetter = moduleMakeNsSetter;

    return true;
  }

  return false;
};

// Calling module.link(id, setters) resolves the given ID using
// module.resolve(id), which should return a canonical absolute module
// identifier string (like require.resolve); then creates an Entry object
// for the child module and evaluates its code (if this is the first time
// it has been imported) by calling module.require(id). Finally, the
// provided setter functions will be called with values exported by the
// module, possibly multiple times when/if those exported values change.
// The module.link name is intended to evoke the "liveness" of the
// exported bindings, since we are subscribing to all future exports of
// the child module, not just taking a snapshot of its current exports.
function moduleLink(id, setters, key) {
  utils.setESModule(this.exports);
  Entry.getOrCreate(this.id, this);

  var absChildId = this.resolve(id);
  var childEntry = Entry.getOrCreate(absChildId);

  if (utils.isObject(setters)) {
    childEntry.addSetters(this, setters, key);
  }

  var exports = this.require(absChildId);

  if (childEntry.module === null) {
    childEntry.module = {
      id: absChildId,
      exports: exports
    };
  }

  childEntry.runSetters();
}

// Register getter functions for local variables in the scope of an export
// statement. Pass true as the second argument to indicate that the getter
// functions always return the same values.
function moduleExport(getters, constant) {
  utils.setESModule(this.exports);
  var entry = Entry.getOrCreate(this.id, this);
  entry.addGetters(getters, constant);
  if (this.loaded) {
    // If the module has already been evaluated, then we need to trigger
    // another round of entry.runSetters calls, which begins by calling
    // entry.runModuleGetters(module).
    entry.runSetters();
  }
}

// Register a getter function that always returns the given value.
function moduleExportDefault(value) {
  return this["export"]({
    "default": function () {
      return value;
    }
  }, true);
}

// Returns a function suitable for passing as a setter callback to
// module.link. If name is an identifier, calling the function will set
// the export of that name to the given value. If the name is "*", all
// properties of the value object will be exported by name, except for
// "default" (use "*+" instead of "*" to include it). Why the "default"
// property is skipped: https://github.com/tc39/ecma262/issues/948
function moduleExportAs(name) {
  var entry = this;
  var includeDefault = name === "*+";
  var setter = function (value) {
    if (name === "*" || name === "*+") {
      Object.keys(value).forEach(function (key) {
        if (includeDefault || key !== "default") {
          utils.copyKey(key, entry.exports, value);
        }
      });
    } else {
      entry.exports[name] = value;
    }
  };

  if (name !== '*+' && name !== "*") {
    setter.exportAs = name;
  }

  return setter;
}

// Platform-specific code should find a way to call this method whenever
// the module system is about to return module.exports from require. This
// might happen more than once per module, in case of dependency cycles,
// so we want Module.prototype.runSetters to run each time.
function runSetters(valueToPassThrough, names) {
  Entry.getOrCreate(this.id, this).runSetters(names, true);

  // Assignments to exported local variables get wrapped with calls to
  // module.runSetters, so module.runSetters returns the
  // valueToPassThrough parameter to allow the value of the original
  // expression to pass through. For example,
  //
  //   export var a = 1;
  //   console.log(a += 3);
  //
  // becomes
  //
  //   module.export("a", () => a);
  //   var a = 1;
  //   console.log(module.runSetters(a += 3));
  //
  // This ensures module.runSetters runs immediately after the assignment,
  // and does not interfere with the larger computation.
  return valueToPassThrough;
}

// Legacy helper that returns a function that takes a namespace object and
// copies the properties of the namespace to module.exports, excluding any
// "default" property (unless includeDefault is true), which is useful for
// implementing `export * from "module"`.
//
// Instead of using this helper like so:
//
//   module.link(id, { "*": module.makeNsSetter() });
//
// non-legacy code should simply use a string-valued setter:
//
//   module.link(id, { "*": "*" });
//
// or, to include the "default" property:
//
//   module.link(id, { "*": "*+" });
//
// This helper may be removed in a future version of Reify.
function moduleMakeNsSetter(includeDefault) {
  return this.exportAs(includeDefault ? "*+" : "*");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/modules/node_modules/@meteorjs/reify/lib/runtime/utils.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var useSetPrototypeOf = typeof Object.setPrototypeOf === "function";
var useSymbol = typeof Symbol === "function";

var esStrKey = "__esModule";
var esSymKey = useSymbol ? Symbol.for(esStrKey) : null;
var useToStringTag = useSymbol && typeof Symbol.toStringTag === "symbol";
var useGetOwnPropDesc =
  typeof Object.getOwnPropertyDescriptor === "function";
var hasOwn = Object.prototype.hasOwnProperty;

function copyKey(key, target, source) {
  if (useGetOwnPropDesc) {
    var desc = Object.getOwnPropertyDescriptor(source, key);
    desc.configurable = true; // Allow redefinition.
    Object.defineProperty(target, key, desc);
  } else {
    target[key] = source[key];
  }
}

exports.copyKey = copyKey;

// Returns obj[key] unless that property is defined by a getter function,
// in which case the getter function is returned.
exports.valueOrGetter = function (obj, key) {
  if (useGetOwnPropDesc && hasOwn.call(obj, key)) {
    var desc = Object.getOwnPropertyDescriptor(obj, key);
    if (typeof desc.get === "function") {
      return desc.get;
    }
  }

  return obj[key];
};

function getESModule(exported) {
  if (isObjectLike(exported)) {
    if (useSymbol && hasOwn.call(exported, esSymKey)) {
      return !! exported[esSymKey];
    }

    if (hasOwn.call(exported, esStrKey)) {
      return !! exported[esStrKey];
    }
  }

  return false;
}

exports.getESModule = getESModule;

function setESModule(exported) {
  if (isObjectLike(exported)) {
    if (useSymbol) {
      exported[esSymKey] = true;
    }

    if (! exported[esStrKey]) {
      // Other module runtime systems may set exported.__esModule such
      // that it can't be redefined, so we call Object.defineProperty only
      // when exported.__esModule is not already true.
      Object.defineProperty(exported, esStrKey, {
        configurable: true,
        enumerable: false,
        value: true,
        writable: true
      });
    }
  }
}

exports.setESModule = setESModule;

function isObject(value) {
  return typeof value === "object" && value !== null;
}

exports.isObject = isObject;

function isObjectLike(value) {
  var type = typeof value;
  return type === "function" || (type === "object" && value !== null);
}

exports.isObjectLike = isObjectLike;

exports.ensureObjectProperty = function (object, propertyName) {
  return hasOwn.call(object, propertyName)
    ? object[propertyName]
    : object[propertyName] = Object.create(null);
};

function createNamespace() {
  var namespace = Object.create(null);

  if (useToStringTag) {
    Object.defineProperty(namespace, Symbol.toStringTag, {
      value: "Module",
      configurable: false,
      enumerable: false,
      writable: false
    });
  }

  setESModule(namespace);

  return namespace;
}

exports.createNamespace = createNamespace;

function setPrototypeOf(object, proto) {
  if (useSetPrototypeOf) {
    Object.setPrototypeOf(object, proto);
  } else {
    object.__proto__ = proto;
  }
  return object;
}

exports.setPrototypeOf = setPrototypeOf;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"entry.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/modules/node_modules/@meteorjs/reify/lib/runtime/entry.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";

// This module should be compatible with PhantomJS v1, just like the other files
// in reify/lib/runtime. Node 4+ features like const/let and arrow functions are
// not acceptable here, and importing any npm packages should be contemplated
// with extreme skepticism.

var utils = require("./utils.js");

var GETTER_ERROR = {};
var NAN = {};
var UNDEFINED = {};
var hasOwn = Object.prototype.hasOwnProperty;
var keySalt = 0;

function Entry(id) {
  // The canonical absolute module ID of the module this Entry manages.
  this.id = id;

  // The Module object this Entry manages, unknown until module.export or
  // module.link is called for the first time.
  this.module = null;

  // The normalized namespace object that importers receive when they use
  // `import * as namespace from "..."` syntax.
  this.namespace = utils.createNamespace();

  // Getters for local variables exported from the managed module.
  this.getters = Object.create(null);

  // Setters for assigning to local variables in parent modules.
  this.setters = Object.create(null);

  // Map of setters added since the last broadcast (in the same shape as
  // entry.setters[name][key]), which should receive a broadcast the next time
  // entry.runSetters() is called, regardless of whether entry.snapshots[name]
  // has changed or not. Once called, setters are removed from this.newSetters,
  // but remain in this.setters.
  this.newSetters = Object.create(null);

  // Map from local names to snapshots of the corresponding local values, used
  // to determine when local values have changed and need to be re-broadcast.
  this.snapshots = Object.create(null);
}

var Ep = utils.setPrototypeOf(Entry.prototype, null);
var entryMap = Object.create(null);

Entry.getOrCreate = function (id, mod) {
  var entry = hasOwn.call(entryMap, id)
    ? entryMap[id]
    : entryMap[id] = new Entry(id);

  if (utils.isObject(mod) &&
      mod.id === entry.id) {
    entry.module = mod;
  }

  return entry;
};

function safeKeys(obj) {
  var keys = Object.keys(obj);
  var esModuleIndex = keys.indexOf("__esModule");
  if (esModuleIndex >= 0) {
    keys.splice(esModuleIndex, 1);
  }
  return keys;
}

Ep.addGetters = function (getters, constant) {
  var names = safeKeys(getters);
  var nameCount = names.length;
  constant = !! constant;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var getter = getters[name];

    if (typeof getter === "function" &&
        // Should this throw if this.getters[name] exists?
        ! (name in this.getters)) {
      this.getters[name] = getter;
      getter.constant = constant;
      getter.runCount = 0;
    }
  }
};

Ep.addSetters = function (parent, setters, key) {
  var names = safeKeys(setters);
  var nameCount = names.length;

  if (! nameCount) {
    return;
  }

  // If no key is provided, make a unique key. Otherwise, make sure the key is
  // distinct from keys provided by other parent modules.
  key = key === void 0
    ? makeUniqueKey()
    : parent.id + ":" + key;

  var entry = this;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var setter = normalizeSetterValue(parent, setters[name]);

    if (typeof setter === "function") {
      setter.parent = parent;
      // Store the setter as entry.setters[name][key], and also record it
      // temporarily in entry.newSetters, so we can be sure to run it when we
      // call entry.runSetters(names) below, even though entry.snapshots[name]
      // likely will not have changed for this name.
      utils.ensureObjectProperty(entry.setters, name)[key] = setter;
      utils.ensureObjectProperty(entry.newSetters, name)[key] = setter;
    }
  }

  entry.runSetters(names);
};

function normalizeSetterValue(module, setter) {
  if (typeof setter === "function") {
    return setter;
  }

  if (typeof setter === "string") {
    // If the value of the setter property is a string, the setter will
    // re-export the imported value using that string as the name of the
    // exported value. If the string is "*", all properties of the value
    // object will be re-exported as individual exports, except for the
    // "default" property (use "*+" instead of "*" to include it).
    return module.exportAs(setter);
  }

  if (Array.isArray(setter)) {
    switch (setter.length) {
    case 0: return null;
    case 1: return normalizeSetterValue(module, setter[0]);
    default:
      var setterFns = setter.map(function (elem) {
        return normalizeSetterValue(module, elem);
      });

      // Return a combined function that calls all of the nested setter
      // functions with the same value.
      return function (value) {
        setterFns.forEach(function (fn) {
          fn(value);
        });
      };
    }
  }

  return null;
}

Ep.runGetters = function (names) {
  // Before running getters, copy anything added to the exports object
  // over to the namespace. Values returned by getters take precedence
  // over these values, but we don't want to miss anything.
  syncExportsToNamespace(this, names);

  if (names === void 0 ||
      names.indexOf("*") >= 0) {
    names = Object.keys(this.getters);
  }

  var nameCount = names.length;

  for (var i = 0; i < nameCount; ++i) {
    var name = names[i];
    var value = runGetter(this, name);

    // If the getter is run without error, update both entry.namespace and
    // module.exports with the current value so that CommonJS require
    // calls remain consistent with module.watch.
    if (value !== GETTER_ERROR) {
      this.namespace[name] = value;
      this.module.exports[name] = value;
    }
  }
};

function syncExportsToNamespace(entry, names) {
  var setDefault = false;

  if (entry.module === null) return;
  var exports = entry.module.exports;

  if (! utils.getESModule(exports)) {
    // If the module entry is managing overrides module.exports, that
    // value should be exposed as the .default property of the namespace,
    // unless module.exports is marked as an ECMASCript module.
    entry.namespace.default = exports;
    setDefault = true;
  }

  if (! utils.isObjectLike(exports)) {
    return;
  }

  if (names === void 0 ||
      names.indexOf("*") >= 0) {
    names = Object.keys(exports);
  }

  names.forEach(function (key) {
    // Don't set any properties for which a getter function exists in
    // entry.getters, don't accidentally override entry.namespace.default,
    // and only copy own properties from entry.module.exports.
    if (! hasOwn.call(entry.getters, key) &&
        ! (setDefault && key === "default") &&
        hasOwn.call(exports, key)) {
      utils.copyKey(key, entry.namespace, exports);
    }
  });
}

// Called whenever module.exports might have changed, to trigger any
// setters associated with the newly exported values. The names parameter
// is optional; without it, all getters and setters will run.
// If the '*' setter needs to be run, but not the '*' getter (names includes
// all exports/getters that changed), the runNsSetter option can be enabled.
Ep.runSetters = function (names, runNsSetter) {
  // Make sure entry.namespace and module.exports are up to date before we
  // call getExportByName(entry, name).
  this.runGetters(names);

  if (runNsSetter && names !== void 0) {
    names.push('*');
  }

  // Lazily-initialized object mapping parent module identifiers to parent
  // module objects whose setters we might need to run.
  var parents;
  var parentNames;

  forEachSetter(this, names, function (setter, name, value) {
    if (parents === void 0) {
      parents = Object.create(null);
    }

    if (parentNames === void 0) {
      parentNames = Object.create(null);
    }

    var parentId = setter.parent.id;

    // When setters use the shorthand for re-exporting values, we know
    // which exports in the parent module were modified, and can do less work
    // when running the parent setters.
    // parentNames[parentId] is set to false if there are any setters that we do
    // not know which exports they modify
    if (setter.exportAs !== void 0 && parentNames[parentId] !== false) {
      parentNames[parentId] = parentNames[parentId] || [];
      parentNames[parentId].push(setter.exportAs);
    } else if (parentNames[parentId] !== false) {
      parentNames[parentId] = false;
    }

    parents[parentId] = setter.parent;

    // The param order for setters is `value` then `name` because the `name`
    // param is only used by namespace exports.
    setter(value, name);
  });

  if (! parents) {
    return;
  }

  // If any of the setters updated the module.exports of a parent module,
  // or updated local variables that are exported by that parent module,
  // then we must re-run any setters registered by that parent module.
  var parentIDs = Object.keys(parents);
  var parentIDCount = parentIDs.length;

  for (var i = 0; i < parentIDCount; ++i) {
    // What happens if parents[parentIDs[id]] === module, or if
    // longer cycles exist in the parent chain? Thanks to our snapshot
    // bookkeeping above, the runSetters broadcast will only proceed
    // as far as there are any actual changes to report.
    var parent = parents[parentIDs[i]];
    var parentEntry = entryMap[parent.id];
    if (parentEntry) {
      parentEntry.runSetters(
        parentNames[parentIDs[i]] || void 0,
        !!parentNames[parentIDs[i]]
      );
    }
  }
};

function createSnapshot(entry, name, newValue) {
  var newSnapshot = Object.create(null);
  var newKeys = [];

  if (name === "*") {
    safeKeys(newValue).forEach(function (keyOfValue) {
      // Evaluating value[key] is risky because the property might be
      // defined by a getter function that logs a deprecation warning (or
      // worse) when evaluated. For example, Node uses this trick to display
      // a deprecation warning whenever crypto.createCredentials is
      // accessed. Fortunately, when value[key] is defined by a getter
      // function, it's enough to check whether the getter function itself
      // has changed, since we are careful elsewhere to preserve getters
      // rather than prematurely evaluating them.
      newKeys.push(keyOfValue);
      newSnapshot[keyOfValue] = normalizeSnapshotValue(
        utils.valueOrGetter(newValue, keyOfValue)
      );
    });
  } else {
    newKeys.push(name);
    newSnapshot[name] = normalizeSnapshotValue(newValue);
  }

  var oldSnapshot = entry.snapshots[name];
  if (
    oldSnapshot &&
    newKeys.every(function (key) {
      return oldSnapshot[key] === newSnapshot[key]
    }) &&
    newKeys.length === Object.keys(oldSnapshot).length
  ) {
    return oldSnapshot;
  }

  return newSnapshot;
}

function normalizeSnapshotValue(value) {
  if (value === void 0) return UNDEFINED;
  if (value !== value && isNaN(value)) return NAN;
  return value;
}

// Obtain an array of keys in entry.setters[name] for which we need to run a
// setter function. If successful, entry.snapshot[name] will be updated and/or
// entry.newSetters[name] will be removed, so the returned keys will not be
// returned again until after the snapshot changes again. If the snapshot hasn't
// changed and there aren't any entry.newSetters[name] keys, this function
// returns undefined, to avoid allocating an empty array in the common case.
function consumeKeysGivenSnapshot(entry, name, snapshot) {
  if (entry.snapshots[name] !== snapshot) {
    entry.snapshots[name] = snapshot;
    // Since the keys of entry.newSetters[name] are a subset of those of
    // entry.setters[name], we can consume entry.newSetters[name] here too.
    delete entry.newSetters[name];
    return Object.keys(entry.setters[name]);
  }

  // If new setters have been added to entry.setters (and thus also to
  // entry.newSetters) since we last recorded entry.snapshots[name], we need to
  // run those setters (for the first time) in order to consider them up-to-date
  // with respect to entry.snapshots[name].
  var news = entry.newSetters[name];
  var newKeys = news && Object.keys(news);
  if (newKeys && newKeys.length) {
    // Consume the new keys so we don't consider them again.
    delete entry.newSetters[name];
    return newKeys;
  }
}

// Invoke the given callback once for every (setter, name, value) that needs to
// be called. Note that forEachSetter does not call any setters itself, only the
// given callback.
function forEachSetter(entry, names, callback) {
  if (names === void 0) {
    names = Object.keys(entry.setters);
  }

  names.forEach(function (name) {
    // Ignore setters asking for module.exports.__esModule.
    if (name === "__esModule") return;

    var settersByKey = entry.setters[name];
    if (!settersByKey) return;

    var getter = entry.getters[name];
    var alreadyCalledConstantGetter =
      typeof getter === "function" &&
      // Sometimes a getter function will throw because it's called
      // before the variable it's supposed to return has been
      // initialized, so we need to know that the getter function has
      // run to completion at least once.
      getter.runCount > 0 &&
      getter.constant;

    var value = getExportByName(entry, name);

    // Although we may have multiple setter functions with different keys in
    // settersByKey, we can compute a snapshot of value and check it against
    // entry.snapshots[name] before iterating over the individual setter
    // functions
    var snapshot = createSnapshot(entry, name, value);

    var keys = consumeKeysGivenSnapshot(entry, name, snapshot);
    if (keys === void 0) return;

    keys.forEach(function (key) {
      var setter = settersByKey[key];
      if (!setter) {
        return;
      }

      // Invoke the setter function with the updated value.
      callback(setter, name, value);

      if (alreadyCalledConstantGetter) {
        // If we happen to know this getter function has run successfully
        // (getter.runCount > 0), and will never return a different value
        // (getter.constant), then we can forget the corresponding setter,
        // because we've already reported that constant value. Note that we
        // can't forget the getter, because we need to remember the original
        // value in case anyone tampers with entry.module.exports[name].
        delete settersByKey[key];
      }
    });
  });
}

function getExportByName(entry, name) {
  if (name === "*") {
    return entry.namespace;
  }

  if (hasOwn.call(entry.namespace, name)) {
    return entry.namespace[name];
  }

  if (entry.module === null) return;
  var exports = entry.module.exports;

  if (name === "default" &&
      ! (utils.getESModule(exports) &&
         "default" in exports)) {
    return exports;
  }

  if (exports == null) {
    return;
  }

  return exports[name];
}

function makeUniqueKey() {
  return Math.random()
    .toString(36)
    // Add an incrementing salt to help track key ordering and also
    // absolutely guarantee we never return the same key twice.
    .replace("0.", ++keySalt + "$");
}

function runGetter(entry, name) {
  var getter = entry.getters[name];
  if (!getter) return GETTER_ERROR;
  try {
    var result = getter();
    ++getter.runCount;
    return result;
  } catch (e) {}
  return GETTER_ERROR;
}

module.exports = Entry;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
meteorInstall({"node_modules":{"svelte":{"internal":{"index.mjs":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/svelte/internal/index.mjs                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
!function (module1) {
  module1.export({
    HtmlTag: () => HtmlTag,
    HtmlTagHydration: () => HtmlTagHydration,
    ResizeObserverSingleton: () => ResizeObserverSingleton,
    SvelteComponent: () => SvelteComponent,
    SvelteComponentDev: () => SvelteComponentDev,
    SvelteComponentTyped: () => SvelteComponentTyped,
    SvelteElement: () => SvelteElement,
    action_destroyer: () => action_destroyer,
    add_attribute: () => add_attribute,
    add_classes: () => add_classes,
    add_flush_callback: () => add_flush_callback,
    add_iframe_resize_listener: () => add_iframe_resize_listener,
    add_location: () => add_location,
    add_render_callback: () => add_render_callback,
    add_styles: () => add_styles,
    add_transform: () => add_transform,
    afterUpdate: () => afterUpdate,
    append: () => append,
    append_dev: () => append_dev,
    append_empty_stylesheet: () => append_empty_stylesheet,
    append_hydration: () => append_hydration,
    append_hydration_dev: () => append_hydration_dev,
    append_styles: () => append_styles,
    assign: () => assign,
    attr: () => attr,
    attr_dev: () => attr_dev,
    attribute_to_object: () => attribute_to_object,
    beforeUpdate: () => beforeUpdate,
    bind: () => bind,
    binding_callbacks: () => binding_callbacks,
    blank_object: () => blank_object,
    bubble: () => bubble,
    check_outros: () => check_outros,
    children: () => children,
    claim_comment: () => claim_comment,
    claim_component: () => claim_component,
    claim_element: () => claim_element,
    claim_html_tag: () => claim_html_tag,
    claim_space: () => claim_space,
    claim_svg_element: () => claim_svg_element,
    claim_text: () => claim_text,
    clear_loops: () => clear_loops,
    comment: () => comment,
    component_subscribe: () => component_subscribe,
    compute_rest_props: () => compute_rest_props,
    compute_slots: () => compute_slots,
    construct_svelte_component: () => construct_svelte_component,
    construct_svelte_component_dev: () => construct_svelte_component_dev,
    contenteditable_truthy_values: () => contenteditable_truthy_values,
    createEventDispatcher: () => createEventDispatcher,
    create_animation: () => create_animation,
    create_bidirectional_transition: () => create_bidirectional_transition,
    create_component: () => create_component,
    create_in_transition: () => create_in_transition,
    create_out_transition: () => create_out_transition,
    create_slot: () => create_slot,
    create_ssr_component: () => create_ssr_component,
    current_component: () => current_component,
    custom_event: () => custom_event,
    dataset_dev: () => dataset_dev,
    debug: () => debug,
    destroy_block: () => destroy_block,
    destroy_component: () => destroy_component,
    destroy_each: () => destroy_each,
    detach: () => detach,
    detach_after_dev: () => detach_after_dev,
    detach_before_dev: () => detach_before_dev,
    detach_between_dev: () => detach_between_dev,
    detach_dev: () => detach_dev,
    dirty_components: () => dirty_components,
    dispatch_dev: () => dispatch_dev,
    each: () => each,
    element: () => element,
    element_is: () => element_is,
    empty: () => empty,
    end_hydrating: () => end_hydrating,
    escape: () => escape,
    escape_attribute_value: () => escape_attribute_value,
    escape_object: () => escape_object,
    exclude_internal_props: () => exclude_internal_props,
    fix_and_destroy_block: () => fix_and_destroy_block,
    fix_and_outro_and_destroy_block: () => fix_and_outro_and_destroy_block,
    fix_position: () => fix_position,
    flush: () => flush,
    flush_render_callbacks: () => flush_render_callbacks,
    getAllContexts: () => getAllContexts,
    getContext: () => getContext,
    get_all_dirty_from_scope: () => get_all_dirty_from_scope,
    get_binding_group_value: () => get_binding_group_value,
    get_current_component: () => get_current_component,
    get_custom_elements_slots: () => get_custom_elements_slots,
    get_root_for_style: () => get_root_for_style,
    get_slot_changes: () => get_slot_changes,
    get_spread_object: () => get_spread_object,
    get_spread_update: () => get_spread_update,
    get_store_value: () => get_store_value,
    globals: () => globals,
    group_outros: () => group_outros,
    handle_promise: () => handle_promise,
    hasContext: () => hasContext,
    has_prop: () => has_prop,
    head_selector: () => head_selector,
    identity: () => identity,
    init: () => init,
    init_binding_group: () => init_binding_group,
    init_binding_group_dynamic: () => init_binding_group_dynamic,
    insert: () => insert,
    insert_dev: () => insert_dev,
    insert_hydration: () => insert_hydration,
    insert_hydration_dev: () => insert_hydration_dev,
    intros: () => intros,
    invalid_attribute_name_character: () => invalid_attribute_name_character,
    is_client: () => is_client,
    is_crossorigin: () => is_crossorigin,
    is_empty: () => is_empty,
    is_function: () => is_function,
    is_promise: () => is_promise,
    is_void: () => is_void,
    listen: () => listen,
    listen_dev: () => listen_dev,
    loop: () => loop,
    loop_guard: () => loop_guard,
    merge_ssr_styles: () => merge_ssr_styles,
    missing_component: () => missing_component,
    mount_component: () => mount_component,
    noop: () => noop,
    not_equal: () => not_equal,
    now: () => now,
    null_to_empty: () => null_to_empty,
    object_without_properties: () => object_without_properties,
    onDestroy: () => onDestroy,
    onMount: () => onMount,
    once: () => once,
    outro_and_destroy_block: () => outro_and_destroy_block,
    prevent_default: () => prevent_default,
    prop_dev: () => prop_dev,
    query_selector_all: () => query_selector_all,
    raf: () => raf,
    resize_observer_border_box: () => resize_observer_border_box,
    resize_observer_content_box: () => resize_observer_content_box,
    resize_observer_device_pixel_content_box: () => resize_observer_device_pixel_content_box,
    run: () => run,
    run_all: () => run_all,
    safe_not_equal: () => safe_not_equal,
    schedule_update: () => schedule_update,
    select_multiple_value: () => select_multiple_value,
    select_option: () => select_option,
    select_options: () => select_options,
    select_value: () => select_value,
    self: () => self,
    setContext: () => setContext,
    set_attributes: () => set_attributes,
    set_current_component: () => set_current_component,
    set_custom_element_data: () => set_custom_element_data,
    set_custom_element_data_map: () => set_custom_element_data_map,
    set_data: () => set_data,
    set_data_contenteditable: () => set_data_contenteditable,
    set_data_contenteditable_dev: () => set_data_contenteditable_dev,
    set_data_dev: () => set_data_dev,
    set_data_maybe_contenteditable: () => set_data_maybe_contenteditable,
    set_data_maybe_contenteditable_dev: () => set_data_maybe_contenteditable_dev,
    set_dynamic_element_data: () => set_dynamic_element_data,
    set_input_type: () => set_input_type,
    set_input_value: () => set_input_value,
    set_now: () => set_now,
    set_raf: () => set_raf,
    set_store_value: () => set_store_value,
    set_style: () => set_style,
    set_svg_attributes: () => set_svg_attributes,
    space: () => space,
    split_css_unit: () => split_css_unit,
    spread: () => spread,
    src_url_equal: () => src_url_equal,
    start_hydrating: () => start_hydrating,
    stop_immediate_propagation: () => stop_immediate_propagation,
    stop_propagation: () => stop_propagation,
    subscribe: () => subscribe,
    svg_element: () => svg_element,
    text: () => text,
    tick: () => tick,
    time_ranges_to_array: () => time_ranges_to_array,
    to_number: () => to_number,
    toggle_class: () => toggle_class,
    transition_in: () => transition_in,
    transition_out: () => transition_out,
    trusted: () => trusted,
    update_await_block_branch: () => update_await_block_branch,
    update_keyed_each: () => update_keyed_each,
    update_slot: () => update_slot,
    update_slot_base: () => update_slot_base,
    validate_component: () => validate_component,
    validate_dynamic_element: () => validate_dynamic_element,
    validate_each_argument: () => validate_each_argument,
    validate_each_keys: () => validate_each_keys,
    validate_slots: () => validate_slots,
    validate_store: () => validate_store,
    validate_void_dynamic_element: () => validate_void_dynamic_element,
    xlink_attr: () => xlink_attr
  });
  ___INIT_METEOR_FAST_REFRESH(module);
  function noop() {}
  const identity = x => x;
  function assign(tar, src) {
    // @ts-ignore
    for (const k in src) tar[k] = src[k];
    return tar;
  }
  // Adapted from https://github.com/then/is-promise/blob/master/index.js
  // Distributed under MIT License https://github.com/then/is-promise/blob/master/LICENSE
  function is_promise(value) {
    return !!value && (typeof value === 'object' || typeof value === 'function') && typeof value.then === 'function';
  }
  function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
      loc: {
        file,
        line,
        column,
        char
      }
    };
  }
  function run(fn) {
    return fn();
  }
  function blank_object() {
    return Object.create(null);
  }
  function run_all(fns) {
    fns.forEach(run);
  }
  function is_function(thing) {
    return typeof thing === 'function';
  }
  function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || a && typeof a === 'object' || typeof a === 'function';
  }
  let src_url_equal_anchor;
  function src_url_equal(element_src, url) {
    if (!src_url_equal_anchor) {
      src_url_equal_anchor = document.createElement('a');
    }
    src_url_equal_anchor.href = url;
    return element_src === src_url_equal_anchor.href;
  }
  function not_equal(a, b) {
    return a != a ? b == b : a !== b;
  }
  function is_empty(obj) {
    return Object.keys(obj).length === 0;
  }
  function validate_store(store, name) {
    if (store != null && typeof store.subscribe !== 'function') {
      throw new Error("'".concat(name, "' is not a store with a 'subscribe' method"));
    }
  }
  function subscribe(store) {
    if (store == null) {
      return noop;
    }
    for (var _len = arguments.length, callbacks = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      callbacks[_key - 1] = arguments[_key];
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
  }
  function get_store_value(store) {
    let value;
    subscribe(store, _ => value = _)();
    return value;
  }
  function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
  }
  function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
      const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
      return definition[0](slot_ctx);
    }
  }
  function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
  }
  function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
      const lets = definition[2](fn(dirty));
      if ($$scope.dirty === undefined) {
        return lets;
      }
      if (typeof lets === 'object') {
        const merged = [];
        const len = Math.max($$scope.dirty.length, lets.length);
        for (let i = 0; i < len; i += 1) {
          merged[i] = $$scope.dirty[i] | lets[i];
        }
        return merged;
      }
      return $$scope.dirty | lets;
    }
    return $$scope.dirty;
  }
  function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
    if (slot_changes) {
      const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
      slot.p(slot_context, slot_changes);
    }
  }
  function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn);
  }
  function get_all_dirty_from_scope($$scope) {
    if ($$scope.ctx.length > 32) {
      const dirty = [];
      const length = $$scope.ctx.length / 32;
      for (let i = 0; i < length; i++) {
        dirty[i] = -1;
      }
      return dirty;
    }
    return -1;
  }
  function exclude_internal_props(props) {
    const result = {};
    for (const k in props) if (k[0] !== '$') result[k] = props[k];
    return result;
  }
  function compute_rest_props(props, keys) {
    const rest = {};
    keys = new Set(keys);
    for (const k in props) if (!keys.has(k) && k[0] !== '$') rest[k] = props[k];
    return rest;
  }
  function compute_slots(slots) {
    const result = {};
    for (const key in slots) {
      result[key] = true;
    }
    return result;
  }
  function once(fn) {
    let ran = false;
    return function () {
      if (ran) return;
      ran = true;
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      fn.call(this, ...args);
    };
  }
  function null_to_empty(value) {
    return value == null ? '' : value;
  }
  function set_store_value(store, ret, value) {
    store.set(value);
    return ret;
  }
  const has_prop = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
  function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
  }
  function split_css_unit(value) {
    const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
    return split ? [parseFloat(split[1]), split[2] || 'px'] : [value, 'px'];
  }
  const contenteditable_truthy_values = ['', true, 1, 'true', 'contenteditable'];
  const is_client = typeof window !== 'undefined';
  let now = is_client ? () => window.performance.now() : () => Date.now();
  let raf = is_client ? cb => requestAnimationFrame(cb) : noop;
  // used internally for testing
  function set_now(fn) {
    module1.runSetters(now = fn, ["now"]);
  }
  function set_raf(fn) {
    module1.runSetters(raf = fn, ["raf"]);
  }
  const tasks = new Set();
  function run_tasks(now) {
    tasks.forEach(task => {
      if (!task.c(now)) {
        tasks.delete(task);
        task.f();
      }
    });
    if (tasks.size !== 0) raf(run_tasks);
  }
  /**
   * For testing purposes only!
   */
  function clear_loops() {
    tasks.clear();
  }
  /**
   * Creates a new task that runs on each raf frame
   * until it returns a falsy value or is aborted
   */
  function loop(callback) {
    let task;
    if (tasks.size === 0) raf(run_tasks);
    return {
      promise: new Promise(fulfill => {
        tasks.add(task = {
          c: callback,
          f: fulfill
        });
      }),
      abort() {
        tasks.delete(task);
      }
    };
  }
  const globals = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : global;

  /**
   * Resize observer singleton.
   * One listener per element only!
   * https://groups.google.com/a/chromium.org/g/blink-dev/c/z6ienONUb5A/m/F5-VcUZtBAAJ
   */
  class ResizeObserverSingleton {
    constructor(options) {
      this.options = options;
      this._listeners = 'WeakMap' in globals ? new WeakMap() : undefined;
    }
    observe(element, listener) {
      this._listeners.set(element, listener);
      this._getObserver().observe(element, this.options);
      return () => {
        this._listeners.delete(element);
        this._observer.unobserve(element); // this line can probably be removed
      };
    }

    _getObserver() {
      var _a;
      return (_a = this._observer) !== null && _a !== void 0 ? _a : this._observer = new ResizeObserver(entries => {
        var _a;
        for (const entry of entries) {
          ResizeObserverSingleton.entries.set(entry.target, entry);
          (_a = this._listeners.get(entry.target)) === null || _a === void 0 ? void 0 : _a(entry);
        }
      });
    }
  }
  // Needs to be written like this to pass the tree-shake-test
  ResizeObserverSingleton.entries = 'WeakMap' in globals ? new WeakMap() : undefined;

  // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
  // at the end of hydration without touching the remaining nodes.
  let is_hydrating = false;
  function start_hydrating() {
    is_hydrating = true;
  }
  function end_hydrating() {
    is_hydrating = false;
  }
  function upper_bound(low, high, key, value) {
    // Return first index of value larger than input value in the range [low, high)
    while (low < high) {
      const mid = low + (high - low >> 1);
      if (key(mid) <= value) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }
    return low;
  }
  function init_hydrate(target) {
    if (target.hydrate_init) return;
    target.hydrate_init = true;
    // We know that all children have claim_order values since the unclaimed have been detached if target is not <head>
    let children = target.childNodes;
    // If target is <head>, there may be children without claim_order
    if (target.nodeName === 'HEAD') {
      const myChildren = [];
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.claim_order !== undefined) {
          myChildren.push(node);
        }
      }
      children = myChildren;
    }
    /*
    * Reorder claimed children optimally.
    * We can reorder claimed children optimally by finding the longest subsequence of
    * nodes that are already claimed in order and only moving the rest. The longest
    * subsequence of nodes that are claimed in order can be found by
    * computing the longest increasing subsequence of .claim_order values.
    *
    * This algorithm is optimal in generating the least amount of reorder operations
    * possible.
    *
    * Proof:
    * We know that, given a set of reordering operations, the nodes that do not move
    * always form an increasing subsequence, since they do not move among each other
    * meaning that they must be already ordered among each other. Thus, the maximal
    * set of nodes that do not move form a longest increasing subsequence.
    */
    // Compute longest increasing subsequence
    // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
    const m = new Int32Array(children.length + 1);
    // Predecessor indices + 1
    const p = new Int32Array(children.length);
    m[0] = -1;
    let longest = 0;
    for (let i = 0; i < children.length; i++) {
      const current = children[i].claim_order;
      // Find the largest subsequence length such that it ends in a value less than our current value
      // upper_bound returns first greater value, so we subtract one
      // with fast path for when we are on the current longest subsequence
      const seqLen = (longest > 0 && children[m[longest]].claim_order <= current ? longest + 1 : upper_bound(1, longest, idx => children[m[idx]].claim_order, current)) - 1;
      p[i] = m[seqLen] + 1;
      const newLen = seqLen + 1;
      // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
      m[newLen] = i;
      longest = Math.max(newLen, longest);
    }
    // The longest increasing subsequence of nodes (initially reversed)
    const lis = [];
    // The rest of the nodes, nodes that will be moved
    const toMove = [];
    let last = children.length - 1;
    for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
      lis.push(children[cur - 1]);
      for (; last >= cur; last--) {
        toMove.push(children[last]);
      }
      last--;
    }
    for (; last >= 0; last--) {
      toMove.push(children[last]);
    }
    lis.reverse();
    // We sort the nodes being moved to guarantee that their insertion order matches the claim order
    toMove.sort((a, b) => a.claim_order - b.claim_order);
    // Finally, we move the nodes
    for (let i = 0, j = 0; i < toMove.length; i++) {
      while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
        j++;
      }
      const anchor = j < lis.length ? lis[j] : null;
      target.insertBefore(toMove[i], anchor);
    }
  }
  function append(target, node) {
    target.appendChild(node);
  }
  function append_styles(target, style_sheet_id, styles) {
    const append_styles_to = get_root_for_style(target);
    if (!append_styles_to.getElementById(style_sheet_id)) {
      const style = element('style');
      style.id = style_sheet_id;
      style.textContent = styles;
      append_stylesheet(append_styles_to, style);
    }
  }
  function get_root_for_style(node) {
    if (!node) return document;
    const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
    if (root && root.host) {
      return root;
    }
    return node.ownerDocument;
  }
  function append_empty_stylesheet(node) {
    const style_element = element('style');
    append_stylesheet(get_root_for_style(node), style_element);
    return style_element.sheet;
  }
  function append_stylesheet(node, style) {
    append(node.head || node, style);
    return style.sheet;
  }
  function append_hydration(target, node) {
    if (is_hydrating) {
      init_hydrate(target);
      if (target.actual_end_child === undefined || target.actual_end_child !== null && target.actual_end_child.parentNode !== target) {
        target.actual_end_child = target.firstChild;
      }
      // Skip nodes of undefined ordering
      while (target.actual_end_child !== null && target.actual_end_child.claim_order === undefined) {
        target.actual_end_child = target.actual_end_child.nextSibling;
      }
      if (node !== target.actual_end_child) {
        // We only insert if the ordering of this node should be modified or the parent node is not target
        if (node.claim_order !== undefined || node.parentNode !== target) {
          target.insertBefore(node, target.actual_end_child);
        }
      } else {
        target.actual_end_child = node.nextSibling;
      }
    } else if (node.parentNode !== target || node.nextSibling !== null) {
      target.appendChild(node);
    }
  }
  function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
  }
  function insert_hydration(target, node, anchor) {
    if (is_hydrating && !anchor) {
      append_hydration(target, node);
    } else if (node.parentNode !== target || node.nextSibling != anchor) {
      target.insertBefore(node, anchor || null);
    }
  }
  function detach(node) {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }
  function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
      if (iterations[i]) iterations[i].d(detaching);
    }
  }
  function element(name) {
    return document.createElement(name);
  }
  function element_is(name, is) {
    return document.createElement(name, {
      is
    });
  }
  function object_without_properties(obj, exclude) {
    const target = {};
    for (const k in obj) {
      if (has_prop(obj, k)
      // @ts-ignore
      && exclude.indexOf(k) === -1) {
        // @ts-ignore
        target[k] = obj[k];
      }
    }
    return target;
  }
  function svg_element(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }
  function text(data) {
    return document.createTextNode(data);
  }
  function space() {
    return text(' ');
  }
  function empty() {
    return text('');
  }
  function comment(content) {
    return document.createComment(content);
  }
  function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
  }
  function prevent_default(fn) {
    return function (event) {
      event.preventDefault();
      // @ts-ignore
      return fn.call(this, event);
    };
  }
  function stop_propagation(fn) {
    return function (event) {
      event.stopPropagation();
      // @ts-ignore
      return fn.call(this, event);
    };
  }
  function stop_immediate_propagation(fn) {
    return function (event) {
      event.stopImmediatePropagation();
      // @ts-ignore
      return fn.call(this, event);
    };
  }
  function self(fn) {
    return function (event) {
      // @ts-ignore
      if (event.target === this) fn.call(this, event);
    };
  }
  function trusted(fn) {
    return function (event) {
      // @ts-ignore
      if (event.isTrusted) fn.call(this, event);
    };
  }
  function attr(node, attribute, value) {
    if (value == null) node.removeAttribute(attribute);else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
  }
  /**
   * List of attributes that should always be set through the attr method,
   * because updating them through the property setter doesn't work reliably.
   * In the example of `width`/`height`, the problem is that the setter only
   * accepts numeric values, but the attribute can also be set to a string like `50%`.
   * If this list becomes too big, rethink this approach.
   */
  const always_set_through_set_attribute = ['width', 'height'];
  function set_attributes(node, attributes) {
    // @ts-ignore
    const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
    for (const key in attributes) {
      if (attributes[key] == null) {
        node.removeAttribute(key);
      } else if (key === 'style') {
        node.style.cssText = attributes[key];
      } else if (key === '__value') {
        node.value = node[key] = attributes[key];
      } else if (descriptors[key] && descriptors[key].set && always_set_through_set_attribute.indexOf(key) === -1) {
        node[key] = attributes[key];
      } else {
        attr(node, key, attributes[key]);
      }
    }
  }
  function set_svg_attributes(node, attributes) {
    for (const key in attributes) {
      attr(node, key, attributes[key]);
    }
  }
  function set_custom_element_data_map(node, data_map) {
    Object.keys(data_map).forEach(key => {
      set_custom_element_data(node, key, data_map[key]);
    });
  }
  function set_custom_element_data(node, prop, value) {
    if (prop in node) {
      node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
    } else {
      attr(node, prop, value);
    }
  }
  function set_dynamic_element_data(tag) {
    return /-/.test(tag) ? set_custom_element_data_map : set_attributes;
  }
  function xlink_attr(node, attribute, value) {
    node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
  }
  function get_binding_group_value(group, __value, checked) {
    const value = new Set();
    for (let i = 0; i < group.length; i += 1) {
      if (group[i].checked) value.add(group[i].__value);
    }
    if (!checked) {
      value.delete(__value);
    }
    return Array.from(value);
  }
  function init_binding_group(group) {
    let _inputs;
    return {
      /* push */p() {
        for (var _len3 = arguments.length, inputs = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          inputs[_key3] = arguments[_key3];
        }
        _inputs = inputs;
        _inputs.forEach(input => group.push(input));
      },
      /* remove */r() {
        _inputs.forEach(input => group.splice(group.indexOf(input), 1));
      }
    };
  }
  function init_binding_group_dynamic(group, indexes) {
    let _group = get_binding_group(group);
    let _inputs;
    function get_binding_group(group) {
      for (let i = 0; i < indexes.length; i++) {
        group = group[indexes[i]] = group[indexes[i]] || [];
      }
      return group;
    }
    function push() {
      _inputs.forEach(input => _group.push(input));
    }
    function remove() {
      _inputs.forEach(input => _group.splice(_group.indexOf(input), 1));
    }
    return {
      /* update */u(new_indexes) {
        indexes = new_indexes;
        const new_group = get_binding_group(group);
        if (new_group !== _group) {
          remove();
          _group = new_group;
          push();
        }
      },
      /* push */p() {
        for (var _len4 = arguments.length, inputs = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          inputs[_key4] = arguments[_key4];
        }
        _inputs = inputs;
        push();
      },
      /* remove */r: remove
    };
  }
  function to_number(value) {
    return value === '' ? null : +value;
  }
  function time_ranges_to_array(ranges) {
    const array = [];
    for (let i = 0; i < ranges.length; i += 1) {
      array.push({
        start: ranges.start(i),
        end: ranges.end(i)
      });
    }
    return array;
  }
  function children(element) {
    return Array.from(element.childNodes);
  }
  function init_claim_info(nodes) {
    if (nodes.claim_info === undefined) {
      nodes.claim_info = {
        last_index: 0,
        total_claimed: 0
      };
    }
  }
  function claim_node(nodes, predicate, processNode, createNode) {
    let dontUpdateLastIndex = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    // Try to find nodes in an order such that we lengthen the longest increasing subsequence
    init_claim_info(nodes);
    const resultNode = (() => {
      // We first try to find an element after the previous one
      for (let i = nodes.claim_info.last_index; i < nodes.length; i++) {
        const node = nodes[i];
        if (predicate(node)) {
          const replacement = processNode(node);
          if (replacement === undefined) {
            nodes.splice(i, 1);
          } else {
            nodes[i] = replacement;
          }
          if (!dontUpdateLastIndex) {
            nodes.claim_info.last_index = i;
          }
          return node;
        }
      }
      // Otherwise, we try to find one before
      // We iterate in reverse so that we don't go too far back
      for (let i = nodes.claim_info.last_index - 1; i >= 0; i--) {
        const node = nodes[i];
        if (predicate(node)) {
          const replacement = processNode(node);
          if (replacement === undefined) {
            nodes.splice(i, 1);
          } else {
            nodes[i] = replacement;
          }
          if (!dontUpdateLastIndex) {
            nodes.claim_info.last_index = i;
          } else if (replacement === undefined) {
            // Since we spliced before the last_index, we decrease it
            nodes.claim_info.last_index--;
          }
          return node;
        }
      }
      // If we can't find any matching node, we create a new one
      return createNode();
    })();
    resultNode.claim_order = nodes.claim_info.total_claimed;
    nodes.claim_info.total_claimed += 1;
    return resultNode;
  }
  function claim_element_base(nodes, name, attributes, create_element) {
    return claim_node(nodes, node => node.nodeName === name, node => {
      const remove = [];
      for (let j = 0; j < node.attributes.length; j++) {
        const attribute = node.attributes[j];
        if (!attributes[attribute.name]) {
          remove.push(attribute.name);
        }
      }
      remove.forEach(v => node.removeAttribute(v));
      return undefined;
    }, () => create_element(name));
  }
  function claim_element(nodes, name, attributes) {
    return claim_element_base(nodes, name, attributes, element);
  }
  function claim_svg_element(nodes, name, attributes) {
    return claim_element_base(nodes, name, attributes, svg_element);
  }
  function claim_text(nodes, data) {
    return claim_node(nodes, node => node.nodeType === 3, node => {
      const dataStr = '' + data;
      if (node.data.startsWith(dataStr)) {
        if (node.data.length !== dataStr.length) {
          return node.splitText(dataStr.length);
        }
      } else {
        node.data = dataStr;
      }
    }, () => text(data), true // Text nodes should not update last index since it is likely not worth it to eliminate an increasing subsequence of actual elements
    );
  }

  function claim_space(nodes) {
    return claim_text(nodes, ' ');
  }
  function claim_comment(nodes, data) {
    return claim_node(nodes, node => node.nodeType === 8, node => {
      node.data = '' + data;
      return undefined;
    }, () => comment(data), true);
  }
  function find_comment(nodes, text, start) {
    for (let i = start; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.nodeType === 8 /* comment node */ && node.textContent.trim() === text) {
        return i;
      }
    }
    return nodes.length;
  }
  function claim_html_tag(nodes, is_svg) {
    // find html opening tag
    const start_index = find_comment(nodes, 'HTML_TAG_START', 0);
    const end_index = find_comment(nodes, 'HTML_TAG_END', start_index);
    if (start_index === end_index) {
      return new HtmlTagHydration(undefined, is_svg);
    }
    init_claim_info(nodes);
    const html_tag_nodes = nodes.splice(start_index, end_index - start_index + 1);
    detach(html_tag_nodes[0]);
    detach(html_tag_nodes[html_tag_nodes.length - 1]);
    const claimed_nodes = html_tag_nodes.slice(1, html_tag_nodes.length - 1);
    for (const n of claimed_nodes) {
      n.claim_order = nodes.claim_info.total_claimed;
      nodes.claim_info.total_claimed += 1;
    }
    return new HtmlTagHydration(claimed_nodes, is_svg);
  }
  function set_data(text, data) {
    data = '' + data;
    if (text.data === data) return;
    text.data = data;
  }
  function set_data_contenteditable(text, data) {
    data = '' + data;
    if (text.wholeText === data) return;
    text.data = data;
  }
  function set_data_maybe_contenteditable(text, data, attr_value) {
    if (~contenteditable_truthy_values.indexOf(attr_value)) {
      set_data_contenteditable(text, data);
    } else {
      set_data(text, data);
    }
  }
  function set_input_value(input, value) {
    input.value = value == null ? '' : value;
  }
  function set_input_type(input, type) {
    try {
      input.type = type;
    } catch (e) {
      // do nothing
    }
  }
  function set_style(node, key, value, important) {
    if (value == null) {
      node.style.removeProperty(key);
    } else {
      node.style.setProperty(key, value, important ? 'important' : '');
    }
  }
  function select_option(select, value, mounting) {
    for (let i = 0; i < select.options.length; i += 1) {
      const option = select.options[i];
      if (option.__value === value) {
        option.selected = true;
        return;
      }
    }
    if (!mounting || value !== undefined) {
      select.selectedIndex = -1; // no option should be selected
    }
  }

  function select_options(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
      const option = select.options[i];
      option.selected = ~value.indexOf(option.__value);
    }
  }
  function select_value(select) {
    const selected_option = select.querySelector(':checked');
    return selected_option && selected_option.__value;
  }
  function select_multiple_value(select) {
    return [].map.call(select.querySelectorAll(':checked'), option => option.__value);
  }
  // unfortunately this can't be a constant as that wouldn't be tree-shakeable
  // so we cache the result instead
  let crossorigin;
  function is_crossorigin() {
    if (crossorigin === undefined) {
      crossorigin = false;
      try {
        if (typeof window !== 'undefined' && window.parent) {
          void window.parent.document;
        }
      } catch (error) {
        crossorigin = true;
      }
    }
    return crossorigin;
  }
  function add_iframe_resize_listener(node, fn) {
    const computed_style = getComputedStyle(node);
    if (computed_style.position === 'static') {
      node.style.position = 'relative';
    }
    const iframe = element('iframe');
    iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' + 'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    const crossorigin = is_crossorigin();
    let unsubscribe;
    if (crossorigin) {
      iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
      unsubscribe = listen(window, 'message', event => {
        if (event.source === iframe.contentWindow) fn();
      });
    } else {
      iframe.src = 'about:blank';
      iframe.onload = () => {
        unsubscribe = listen(iframe.contentWindow, 'resize', fn);
        // make sure an initial resize event is fired _after_ the iframe is loaded (which is asynchronous)
        // see https://github.com/sveltejs/svelte/issues/4233
        fn();
      };
    }
    append(node, iframe);
    return () => {
      if (crossorigin) {
        unsubscribe();
      } else if (unsubscribe && iframe.contentWindow) {
        unsubscribe();
      }
      detach(iframe);
    };
  }
  const resize_observer_content_box = /* @__PURE__ */new ResizeObserverSingleton({
    box: 'content-box'
  });
  const resize_observer_border_box = /* @__PURE__ */new ResizeObserverSingleton({
    box: 'border-box'
  });
  const resize_observer_device_pixel_content_box = /* @__PURE__ */new ResizeObserverSingleton({
    box: 'device-pixel-content-box'
  });
  function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
  }
  function custom_event(type, detail) {
    let {
      bubbles = false,
      cancelable = false
    } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, bubbles, cancelable, detail);
    return e;
  }
  function query_selector_all(selector) {
    let parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.body;
    return Array.from(parent.querySelectorAll(selector));
  }
  function head_selector(nodeId, head) {
    const result = [];
    let started = 0;
    for (const node of head.childNodes) {
      if (node.nodeType === 8 /* comment node */) {
        const comment = node.textContent.trim();
        if (comment === "HEAD_".concat(nodeId, "_END")) {
          started -= 1;
          result.push(node);
        } else if (comment === "HEAD_".concat(nodeId, "_START")) {
          started += 1;
          result.push(node);
        }
      } else if (started > 0) {
        result.push(node);
      }
    }
    return result;
  }
  class HtmlTag {
    constructor() {
      let is_svg = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      this.is_svg = false;
      this.is_svg = is_svg;
      this.e = this.n = null;
    }
    c(html) {
      this.h(html);
    }
    m(html, target) {
      let anchor = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      if (!this.e) {
        if (this.is_svg) this.e = svg_element(target.nodeName);
        /** #7364  target for <template> may be provided as #document-fragment(11) */else this.e = element(target.nodeType === 11 ? 'TEMPLATE' : target.nodeName);
        this.t = target.tagName !== 'TEMPLATE' ? target : target.content;
        this.c(html);
      }
      this.i(anchor);
    }
    h(html) {
      this.e.innerHTML = html;
      this.n = Array.from(this.e.nodeName === 'TEMPLATE' ? this.e.content.childNodes : this.e.childNodes);
    }
    i(anchor) {
      for (let i = 0; i < this.n.length; i += 1) {
        insert(this.t, this.n[i], anchor);
      }
    }
    p(html) {
      this.d();
      this.h(html);
      this.i(this.a);
    }
    d() {
      this.n.forEach(detach);
    }
  }
  class HtmlTagHydration extends HtmlTag {
    constructor(claimed_nodes) {
      let is_svg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      super(is_svg);
      this.e = this.n = null;
      this.l = claimed_nodes;
    }
    c(html) {
      if (this.l) {
        this.n = this.l;
      } else {
        super.c(html);
      }
    }
    i(anchor) {
      for (let i = 0; i < this.n.length; i += 1) {
        insert_hydration(this.t, this.n[i], anchor);
      }
    }
  }
  function attribute_to_object(attributes) {
    const result = {};
    for (const attribute of attributes) {
      result[attribute.name] = attribute.value;
    }
    return result;
  }
  function get_custom_elements_slots(element) {
    const result = {};
    element.childNodes.forEach(node => {
      result[node.slot || 'default'] = true;
    });
    return result;
  }
  function construct_svelte_component(component, props) {
    return new component(props);
  }

  // we need to store the information for multiple documents because a Svelte application could also contain iframes
  // https://github.com/sveltejs/svelte/issues/3624
  const managed_styles = new Map();
  let active = 0;
  // https://github.com/darkskyapp/string-hash/blob/master/index.js
  function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--) hash = (hash << 5) - hash ^ str.charCodeAt(i);
    return hash >>> 0;
  }
  function create_style_information(doc, node) {
    const info = {
      stylesheet: append_empty_stylesheet(node),
      rules: {}
    };
    managed_styles.set(doc, info);
    return info;
  }
  function create_rule(node, a, b, duration, delay, ease, fn) {
    let uid = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : 0;
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
      const t = a + (b - a) * ease(p);
      keyframes += p * 100 + "%{".concat(fn(t, 1 - t), "}\n");
    }
    const rule = keyframes + "100% {".concat(fn(b, 1 - b), "}\n}");
    const name = "__svelte_".concat(hash(rule), "_").concat(uid);
    const doc = get_root_for_style(node);
    const {
      stylesheet,
      rules
    } = managed_styles.get(doc) || create_style_information(doc, node);
    if (!rules[name]) {
      rules[name] = true;
      stylesheet.insertRule("@keyframes ".concat(name, " ").concat(rule), stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = "".concat(animation ? "".concat(animation, ", ") : '').concat(name, " ").concat(duration, "ms linear ").concat(delay, "ms 1 both");
    active += 1;
    return name;
  }
  function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name ? anim => anim.indexOf(name) < 0 // remove specific animation
    : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );

    const deleted = previous.length - next.length;
    if (deleted) {
      node.style.animation = next.join(', ');
      active -= deleted;
      if (!active) clear_rules();
    }
  }
  function clear_rules() {
    raf(() => {
      if (active) return;
      managed_styles.forEach(info => {
        const {
          ownerNode
        } = info.stylesheet;
        // there is no ownerNode if it runs on jsdom.
        if (ownerNode) detach(ownerNode);
      });
      managed_styles.clear();
    });
  }
  function create_animation(node, from, fn, params) {
    if (!from) return noop;
    const to = node.getBoundingClientRect();
    if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom) return noop;
    const {
      delay = 0,
      duration = 300,
      easing = identity,
      // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
      start: start_time = now() + delay,
      // @ts-ignore todo:
      end = start_time + duration,
      tick = noop,
      css
    } = fn(node, {
      from,
      to
    }, params);
    let running = true;
    let started = false;
    let name;
    function start() {
      if (css) {
        name = create_rule(node, 0, 1, duration, delay, easing, css);
      }
      if (!delay) {
        started = true;
      }
    }
    function stop() {
      if (css) delete_rule(node, name);
      running = false;
    }
    loop(now => {
      if (!started && now >= start_time) {
        started = true;
      }
      if (started && now >= end) {
        tick(1, 0);
        stop();
      }
      if (!running) {
        return false;
      }
      if (started) {
        const p = now - start_time;
        const t = 0 + 1 * easing(p / duration);
        tick(t, 1 - t);
      }
      return true;
    });
    start();
    tick(0, 1);
    return stop;
  }
  function fix_position(node) {
    const style = getComputedStyle(node);
    if (style.position !== 'absolute' && style.position !== 'fixed') {
      const {
        width,
        height
      } = style;
      const a = node.getBoundingClientRect();
      node.style.position = 'absolute';
      node.style.width = width;
      node.style.height = height;
      add_transform(node, a);
    }
  }
  function add_transform(node, a) {
    const b = node.getBoundingClientRect();
    if (a.left !== b.left || a.top !== b.top) {
      const style = getComputedStyle(node);
      const transform = style.transform === 'none' ? '' : style.transform;
      node.style.transform = "".concat(transform, " translate(").concat(a.left - b.left, "px, ").concat(a.top - b.top, "px)");
    }
  }
  let current_component;
  function set_current_component(component) {
    module1.runSetters(current_component = component, ["current_component"]);
  }
  function get_current_component() {
    if (!current_component) throw new Error('Function called outside component initialization');
    return current_component;
  }
  /**
   * Schedules a callback to run immediately before the component is updated after any state change.
   *
   * The first time the callback runs will be before the initial `onMount`
   *
   * https://svelte.dev/docs#run-time-svelte-beforeupdate
   */
  function beforeUpdate(fn) {
    get_current_component().$$.before_update.push(fn);
  }
  /**
   * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
   * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
   * it can be called from an external module).
   *
   * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
   *
   * https://svelte.dev/docs#run-time-svelte-onmount
   */
  function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
  }
  /**
   * Schedules a callback to run immediately after the component has been updated.
   *
   * The first time the callback runs will be after the initial `onMount`
   */
  function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
  }
  /**
   * Schedules a callback to run immediately before the component is unmounted.
   *
   * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
   * only one that runs inside a server-side component.
   *
   * https://svelte.dev/docs#run-time-svelte-ondestroy
   */
  function onDestroy(fn) {
    get_current_component().$$.on_destroy.push(fn);
  }
  /**
   * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
   * Event dispatchers are functions that can take two arguments: `name` and `detail`.
   *
   * Component events created with `createEventDispatcher` create a
   * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
   * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
   * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
   * property and can contain any type of data.
   *
   * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
   */
  function createEventDispatcher() {
    const component = get_current_component();
    return function (type, detail) {
      let {
        cancelable = false
      } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      const callbacks = component.$$.callbacks[type];
      if (callbacks) {
        // TODO are there situations where events could be dispatched
        // in a server (non-DOM) environment?
        const event = custom_event(type, detail, {
          cancelable
        });
        callbacks.slice().forEach(fn => {
          fn.call(component, event);
        });
        return !event.defaultPrevented;
      }
      return true;
    };
  }
  /**
   * Associates an arbitrary `context` object with the current component and the specified `key`
   * and returns that object. The context is then available to children of the component
   * (including slotted content) with `getContext`.
   *
   * Like lifecycle functions, this must be called during component initialisation.
   *
   * https://svelte.dev/docs#run-time-svelte-setcontext
   */
  function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
    return context;
  }
  /**
   * Retrieves the context that belongs to the closest parent component with the specified `key`.
   * Must be called during component initialisation.
   *
   * https://svelte.dev/docs#run-time-svelte-getcontext
   */
  function getContext(key) {
    return get_current_component().$$.context.get(key);
  }
  /**
   * Retrieves the whole context map that belongs to the closest parent component.
   * Must be called during component initialisation. Useful, for example, if you
   * programmatically create a component and want to pass the existing context to it.
   *
   * https://svelte.dev/docs#run-time-svelte-getallcontexts
   */
  function getAllContexts() {
    return get_current_component().$$.context;
  }
  /**
   * Checks whether a given `key` has been set in the context of a parent component.
   * Must be called during component initialisation.
   *
   * https://svelte.dev/docs#run-time-svelte-hascontext
   */
  function hasContext(key) {
    return get_current_component().$$.context.has(key);
  }
  // TODO figure out if we still want to support
  // shorthand events, or if we want to implement
  // a real bubbling mechanism
  function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
      // @ts-ignore
      callbacks.slice().forEach(fn => fn.call(this, event));
    }
  }
  const dirty_components = [];
  const intros = {
    enabled: false
  };
  const binding_callbacks = [];
  let render_callbacks = [];
  const flush_callbacks = [];
  const resolved_promise = /* @__PURE__ */Promise.resolve();
  let update_scheduled = false;
  function schedule_update() {
    if (!update_scheduled) {
      update_scheduled = true;
      resolved_promise.then(flush);
    }
  }
  function tick() {
    schedule_update();
    return resolved_promise;
  }
  function add_render_callback(fn) {
    render_callbacks.push(fn);
  }
  function add_flush_callback(fn) {
    flush_callbacks.push(fn);
  }
  // flush() calls callbacks in this order:
  // 1. All beforeUpdate callbacks, in order: parents before children
  // 2. All bind:this callbacks, in reverse order: children before parents.
  // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
  //    for afterUpdates called during the initial onMount, which are called in
  //    reverse order: children before parents.
  // Since callbacks might update component values, which could trigger another
  // call to flush(), the following steps guard against this:
  // 1. During beforeUpdate, any updated components will be added to the
  //    dirty_components array and will cause a reentrant call to flush(). Because
  //    the flush index is kept outside the function, the reentrant call will pick
  //    up where the earlier call left off and go through all dirty components. The
  //    current_component value is saved and restored so that the reentrant call will
  //    not interfere with the "parent" flush() call.
  // 2. bind:this callbacks cannot trigger new flush() calls.
  // 3. During afterUpdate, any updated components will NOT have their afterUpdate
  //    callback called a second time; the seen_callbacks set, outside the flush()
  //    function, guarantees this behavior.
  const seen_callbacks = new Set();
  let flushidx = 0; // Do *not* move this inside the flush() function
  function flush() {
    // Do not reenter flush while dirty components are updated, as this can
    // result in an infinite loop. Instead, let the inner flush handle it.
    // Reentrancy is ok afterwards for bindings etc.
    if (flushidx !== 0) {
      return;
    }
    const saved_component = current_component;
    do {
      // first, call beforeUpdate functions
      // and update components
      try {
        while (flushidx < dirty_components.length) {
          const component = dirty_components[flushidx];
          flushidx++;
          set_current_component(component);
          update(component.$$);
        }
      } catch (e) {
        // reset dirty state to not end up in a deadlocked state and then rethrow
        dirty_components.length = 0;
        flushidx = 0;
        throw e;
      }
      set_current_component(null);
      dirty_components.length = 0;
      flushidx = 0;
      while (binding_callbacks.length) binding_callbacks.pop()();
      // then, once components are updated, call
      // afterUpdate functions. This may cause
      // subsequent updates...
      for (let i = 0; i < render_callbacks.length; i += 1) {
        const callback = render_callbacks[i];
        if (!seen_callbacks.has(callback)) {
          // ...so guard against infinite loops
          seen_callbacks.add(callback);
          callback();
        }
      }
      render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
      flush_callbacks.pop()();
    }
    update_scheduled = false;
    seen_callbacks.clear();
    set_current_component(saved_component);
  }
  function update($$) {
    if ($$.fragment !== null) {
      $$.update();
      run_all($$.before_update);
      const dirty = $$.dirty;
      $$.dirty = [-1];
      $$.fragment && $$.fragment.p($$.ctx, dirty);
      $$.after_update.forEach(add_render_callback);
    }
  }
  /**
   * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
   */
  function flush_render_callbacks(fns) {
    const filtered = [];
    const targets = [];
    render_callbacks.forEach(c => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
    targets.forEach(c => c());
    render_callbacks = filtered;
  }
  let promise;
  function wait() {
    if (!promise) {
      promise = Promise.resolve();
      promise.then(() => {
        promise = null;
      });
    }
    return promise;
  }
  function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event("".concat(direction ? 'intro' : 'outro').concat(kind)));
  }
  const outroing = new Set();
  let outros;
  function group_outros() {
    outros = {
      r: 0,
      c: [],
      p: outros // parent group
    };
  }

  function check_outros() {
    if (!outros.r) {
      run_all(outros.c);
    }
    outros = outros.p;
  }
  function transition_in(block, local) {
    if (block && block.i) {
      outroing.delete(block);
      block.i(local);
    }
  }
  function transition_out(block, local, detach, callback) {
    if (block && block.o) {
      if (outroing.has(block)) return;
      outroing.add(block);
      outros.c.push(() => {
        outroing.delete(block);
        if (callback) {
          if (detach) block.d(1);
          callback();
        }
      });
      block.o(local);
    } else if (callback) {
      callback();
    }
  }
  const null_transition = {
    duration: 0
  };
  function create_in_transition(node, fn, params) {
    const options = {
      direction: 'in'
    };
    let config = fn(node, params, options);
    let running = false;
    let animation_name;
    let task;
    let uid = 0;
    function cleanup() {
      if (animation_name) delete_rule(node, animation_name);
    }
    function go() {
      const {
        delay = 0,
        duration = 300,
        easing = identity,
        tick = noop,
        css
      } = config || null_transition;
      if (css) animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
      tick(0, 1);
      const start_time = now() + delay;
      const end_time = start_time + duration;
      if (task) task.abort();
      running = true;
      add_render_callback(() => dispatch(node, true, 'start'));
      task = loop(now => {
        if (running) {
          if (now >= end_time) {
            tick(1, 0);
            dispatch(node, true, 'end');
            cleanup();
            return running = false;
          }
          if (now >= start_time) {
            const t = easing((now - start_time) / duration);
            tick(t, 1 - t);
          }
        }
        return running;
      });
    }
    let started = false;
    return {
      start() {
        if (started) return;
        started = true;
        delete_rule(node);
        if (is_function(config)) {
          config = config(options);
          wait().then(go);
        } else {
          go();
        }
      },
      invalidate() {
        started = false;
      },
      end() {
        if (running) {
          cleanup();
          running = false;
        }
      }
    };
  }
  function create_out_transition(node, fn, params) {
    const options = {
      direction: 'out'
    };
    let config = fn(node, params, options);
    let running = true;
    let animation_name;
    const group = outros;
    group.r += 1;
    function go() {
      const {
        delay = 0,
        duration = 300,
        easing = identity,
        tick = noop,
        css
      } = config || null_transition;
      if (css) animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
      const start_time = now() + delay;
      const end_time = start_time + duration;
      add_render_callback(() => dispatch(node, false, 'start'));
      loop(now => {
        if (running) {
          if (now >= end_time) {
            tick(0, 1);
            dispatch(node, false, 'end');
            if (! --group.r) {
              // this will result in `end()` being called,
              // so we don't need to clean up here
              run_all(group.c);
            }
            return false;
          }
          if (now >= start_time) {
            const t = easing((now - start_time) / duration);
            tick(1 - t, t);
          }
        }
        return running;
      });
    }
    if (is_function(config)) {
      wait().then(() => {
        // @ts-ignore
        config = config(options);
        go();
      });
    } else {
      go();
    }
    return {
      end(reset) {
        if (reset && config.tick) {
          config.tick(1, 0);
        }
        if (running) {
          if (animation_name) delete_rule(node, animation_name);
          running = false;
        }
      }
    };
  }
  function create_bidirectional_transition(node, fn, params, intro) {
    const options = {
      direction: 'both'
    };
    let config = fn(node, params, options);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
      if (animation_name) delete_rule(node, animation_name);
    }
    function init(program, duration) {
      const d = program.b - t;
      duration *= Math.abs(d);
      return {
        a: t,
        b: program.b,
        d,
        duration,
        start: program.start,
        end: program.start + duration,
        group: program.group
      };
    }
    function go(b) {
      const {
        delay = 0,
        duration = 300,
        easing = identity,
        tick = noop,
        css
      } = config || null_transition;
      const program = {
        start: now() + delay,
        b
      };
      if (!b) {
        // @ts-ignore todo: improve typings
        program.group = outros;
        outros.r += 1;
      }
      if (running_program || pending_program) {
        pending_program = program;
      } else {
        // if this is an intro, and there's a delay, we need to do
        // an initial tick and/or apply CSS animation immediately
        if (css) {
          clear_animation();
          animation_name = create_rule(node, t, b, duration, delay, easing, css);
        }
        if (b) tick(0, 1);
        running_program = init(program, duration);
        add_render_callback(() => dispatch(node, b, 'start'));
        loop(now => {
          if (pending_program && now > pending_program.start) {
            running_program = init(pending_program, duration);
            pending_program = null;
            dispatch(node, running_program.b, 'start');
            if (css) {
              clear_animation();
              animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
            }
          }
          if (running_program) {
            if (now >= running_program.end) {
              tick(t = running_program.b, 1 - t);
              dispatch(node, running_program.b, 'end');
              if (!pending_program) {
                // we're done
                if (running_program.b) {
                  // intro — we can tidy up immediately
                  clear_animation();
                } else {
                  // outro — needs to be coordinated
                  if (! --running_program.group.r) run_all(running_program.group.c);
                }
              }
              running_program = null;
            } else if (now >= running_program.start) {
              const p = now - running_program.start;
              t = running_program.a + running_program.d * easing(p / running_program.duration);
              tick(t, 1 - t);
            }
          }
          return !!(running_program || pending_program);
        });
      }
    }
    return {
      run(b) {
        if (is_function(config)) {
          wait().then(() => {
            // @ts-ignore
            config = config(options);
            go(b);
          });
        } else {
          go(b);
        }
      },
      end() {
        clear_animation();
        running_program = pending_program = null;
      }
    };
  }
  function handle_promise(promise, info) {
    const token = info.token = {};
    function update(type, index, key, value) {
      if (info.token !== token) return;
      info.resolved = value;
      let child_ctx = info.ctx;
      if (key !== undefined) {
        child_ctx = child_ctx.slice();
        child_ctx[key] = value;
      }
      const block = type && (info.current = type)(child_ctx);
      let needs_flush = false;
      if (info.block) {
        if (info.blocks) {
          info.blocks.forEach((block, i) => {
            if (i !== index && block) {
              group_outros();
              transition_out(block, 1, 1, () => {
                if (info.blocks[i] === block) {
                  info.blocks[i] = null;
                }
              });
              check_outros();
            }
          });
        } else {
          info.block.d(1);
        }
        block.c();
        transition_in(block, 1);
        block.m(info.mount(), info.anchor);
        needs_flush = true;
      }
      info.block = block;
      if (info.blocks) info.blocks[index] = block;
      if (needs_flush) {
        flush();
      }
    }
    if (is_promise(promise)) {
      const current_component = get_current_component();
      promise.then(value => {
        set_current_component(current_component);
        update(info.then, 1, info.value, value);
        set_current_component(null);
      }, error => {
        set_current_component(current_component);
        update(info.catch, 2, info.error, error);
        set_current_component(null);
        if (!info.hasCatch) {
          throw error;
        }
      });
      // if we previously had a then/catch block, destroy it
      if (info.current !== info.pending) {
        update(info.pending, 0);
        return true;
      }
    } else {
      if (info.current !== info.then) {
        update(info.then, 1, info.value, promise);
        return true;
      }
      info.resolved = promise;
    }
  }
  function update_await_block_branch(info, ctx, dirty) {
    const child_ctx = ctx.slice();
    const {
      resolved
    } = info;
    if (info.current === info.then) {
      child_ctx[info.value] = resolved;
    }
    if (info.current === info.catch) {
      child_ctx[info.error] = resolved;
    }
    info.block.p(child_ctx, dirty);
  }
  function destroy_block(block, lookup) {
    block.d(1);
    lookup.delete(block.key);
  }
  function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
      lookup.delete(block.key);
    });
  }
  function fix_and_destroy_block(block, lookup) {
    block.f();
    destroy_block(block, lookup);
  }
  function fix_and_outro_and_destroy_block(block, lookup) {
    block.f();
    outro_and_destroy_block(block, lookup);
  }
  function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--) old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    const updates = [];
    i = n;
    while (i--) {
      const child_ctx = get_context(ctx, list, i);
      const key = get_key(child_ctx);
      let block = lookup.get(key);
      if (!block) {
        block = create_each_block(key, child_ctx);
        block.c();
      } else if (dynamic) {
        // defer updates until all the DOM shuffling is done
        updates.push(() => block.p(child_ctx, dirty));
      }
      new_lookup.set(key, new_blocks[i] = block);
      if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
      transition_in(block, 1);
      block.m(node, next);
      lookup.set(block.key, block);
      next = block.first;
      n--;
    }
    while (o && n) {
      const new_block = new_blocks[n - 1];
      const old_block = old_blocks[o - 1];
      const new_key = new_block.key;
      const old_key = old_block.key;
      if (new_block === old_block) {
        // do nothing
        next = new_block.first;
        o--;
        n--;
      } else if (!new_lookup.has(old_key)) {
        // remove old block
        destroy(old_block, lookup);
        o--;
      } else if (!lookup.has(new_key) || will_move.has(new_key)) {
        insert(new_block);
      } else if (did_move.has(old_key)) {
        o--;
      } else if (deltas.get(new_key) > deltas.get(old_key)) {
        did_move.add(new_key);
        insert(new_block);
      } else {
        will_move.add(old_key);
        o--;
      }
    }
    while (o--) {
      const old_block = old_blocks[o];
      if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
    }
    while (n) insert(new_blocks[n - 1]);
    run_all(updates);
    return new_blocks;
  }
  function validate_each_keys(ctx, list, get_context, get_key) {
    const keys = new Set();
    for (let i = 0; i < list.length; i++) {
      const key = get_key(get_context(ctx, list, i));
      if (keys.has(key)) {
        throw new Error('Cannot have duplicate keys in a keyed each');
      }
      keys.add(key);
    }
  }
  function get_spread_update(levels, updates) {
    const update = {};
    const to_null_out = {};
    const accounted_for = {
      $$scope: 1
    };
    let i = levels.length;
    while (i--) {
      const o = levels[i];
      const n = updates[i];
      if (n) {
        for (const key in o) {
          if (!(key in n)) to_null_out[key] = 1;
        }
        for (const key in n) {
          if (!accounted_for[key]) {
            update[key] = n[key];
            accounted_for[key] = 1;
          }
        }
        levels[i] = n;
      } else {
        for (const key in o) {
          accounted_for[key] = 1;
        }
      }
    }
    for (const key in to_null_out) {
      if (!(key in update)) update[key] = undefined;
    }
    return update;
  }
  function get_spread_object(spread_props) {
    return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
  }
  const _boolean_attributes = ['allowfullscreen', 'allowpaymentrequest', 'async', 'autofocus', 'autoplay', 'checked', 'controls', 'default', 'defer', 'disabled', 'formnovalidate', 'hidden', 'inert', 'ismap', 'loop', 'multiple', 'muted', 'nomodule', 'novalidate', 'open', 'playsinline', 'readonly', 'required', 'reversed', 'selected'];
  /**
   * List of HTML boolean attributes (e.g. `<input disabled>`).
   * Source: https://html.spec.whatwg.org/multipage/indices.html
   */
  const boolean_attributes = new Set([..._boolean_attributes]);

  /** regex of all html void element names */
  const void_element_names = /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;
  function is_void(name) {
    return void_element_names.test(name) || name.toLowerCase() === '!doctype';
  }
  const invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
  // https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
  // https://infra.spec.whatwg.org/#noncharacter
  function spread(args, attrs_to_add) {
    const attributes = Object.assign({}, ...args);
    if (attrs_to_add) {
      const classes_to_add = attrs_to_add.classes;
      const styles_to_add = attrs_to_add.styles;
      if (classes_to_add) {
        if (attributes.class == null) {
          attributes.class = classes_to_add;
        } else {
          attributes.class += ' ' + classes_to_add;
        }
      }
      if (styles_to_add) {
        if (attributes.style == null) {
          attributes.style = style_object_to_string(styles_to_add);
        } else {
          attributes.style = style_object_to_string(merge_ssr_styles(attributes.style, styles_to_add));
        }
      }
    }
    let str = '';
    Object.keys(attributes).forEach(name => {
      if (invalid_attribute_name_character.test(name)) return;
      const value = attributes[name];
      if (value === true) str += ' ' + name;else if (boolean_attributes.has(name.toLowerCase())) {
        if (value) str += ' ' + name;
      } else if (value != null) {
        str += " ".concat(name, "=\"").concat(value, "\"");
      }
    });
    return str;
  }
  function merge_ssr_styles(style_attribute, style_directive) {
    const style_object = {};
    for (const individual_style of style_attribute.split(';')) {
      const colon_index = individual_style.indexOf(':');
      const name = individual_style.slice(0, colon_index).trim();
      const value = individual_style.slice(colon_index + 1).trim();
      if (!name) continue;
      style_object[name] = value;
    }
    for (const name in style_directive) {
      const value = style_directive[name];
      if (value) {
        style_object[name] = value;
      } else {
        delete style_object[name];
      }
    }
    return style_object;
  }
  const ATTR_REGEX = /[&"]/g;
  const CONTENT_REGEX = /[&<]/g;
  /**
   * Note: this method is performance sensitive and has been optimized
   * https://github.com/sveltejs/svelte/pull/5701
   */
  function escape(value) {
    let is_attr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    const str = String(value);
    const pattern = is_attr ? ATTR_REGEX : CONTENT_REGEX;
    pattern.lastIndex = 0;
    let escaped = '';
    let last = 0;
    while (pattern.test(str)) {
      const i = pattern.lastIndex - 1;
      const ch = str[i];
      escaped += str.substring(last, i) + (ch === '&' ? '&amp;' : ch === '"' ? '&quot;' : '&lt;');
      last = i + 1;
    }
    return escaped + str.substring(last);
  }
  function escape_attribute_value(value) {
    // keep booleans, null, and undefined for the sake of `spread`
    const should_escape = typeof value === 'string' || value && typeof value === 'object';
    return should_escape ? escape(value, true) : value;
  }
  function escape_object(obj) {
    const result = {};
    for (const key in obj) {
      result[key] = escape_attribute_value(obj[key]);
    }
    return result;
  }
  function each(items, fn) {
    let str = '';
    for (let i = 0; i < items.length; i += 1) {
      str += fn(items[i], i);
    }
    return str;
  }
  const missing_component = {
    $$render: () => ''
  };
  function validate_component(component, name) {
    if (!component || !component.$$render) {
      if (name === 'svelte:component') name += ' this={...}';
      throw new Error("<".concat(name, "> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules. Otherwise you may need to fix a <").concat(name, ">."));
    }
    return component;
  }
  function debug(file, line, column, values) {
    console.log("{@debug} ".concat(file ? file + ' ' : '', "(").concat(line, ":").concat(column, ")")); // eslint-disable-line no-console
    console.log(values); // eslint-disable-line no-console
    return '';
  }
  let on_destroy;
  function create_ssr_component(fn) {
    function $$render(result, props, bindings, slots, context) {
      const parent_component = current_component;
      const $$ = {
        on_destroy,
        context: new Map(context || (parent_component ? parent_component.$$.context : [])),
        // these will be immediately discarded
        on_mount: [],
        before_update: [],
        after_update: [],
        callbacks: blank_object()
      };
      set_current_component({
        $$
      });
      const html = fn(result, props, bindings, slots);
      set_current_component(parent_component);
      return html;
    }
    return {
      render: function () {
        let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        let {
          $$slots = {},
          context = new Map()
        } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        on_destroy = [];
        const result = {
          title: '',
          head: '',
          css: new Set()
        };
        const html = $$render(result, props, {}, $$slots, context);
        run_all(on_destroy);
        return {
          html,
          css: {
            code: Array.from(result.css).map(css => css.code).join('\n'),
            map: null // TODO
          },

          head: result.title + result.head
        };
      },
      $$render
    };
  }
  function add_attribute(name, value, boolean) {
    if (value == null || boolean && !value) return '';
    const assignment = boolean && value === true ? '' : "=\"".concat(escape(value, true), "\"");
    return " ".concat(name).concat(assignment);
  }
  function add_classes(classes) {
    return classes ? " class=\"".concat(classes, "\"") : '';
  }
  function style_object_to_string(style_object) {
    return Object.keys(style_object).filter(key => style_object[key]).map(key => "".concat(key, ": ").concat(escape_attribute_value(style_object[key]), ";")).join(' ');
  }
  function add_styles(style_object) {
    const styles = style_object_to_string(style_object);
    return styles ? " style=\"".concat(styles, "\"") : '';
  }
  function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
      component.$$.bound[index] = callback;
      callback(component.$$.ctx[index]);
    }
  }
  function create_component(block) {
    block && block.c();
  }
  function claim_component(block, parent_nodes) {
    block && block.l(parent_nodes);
  }
  function mount_component(component, target, anchor, customElement) {
    const {
      fragment,
      after_update
    } = component.$$;
    fragment && fragment.m(target, anchor);
    if (!customElement) {
      // onMount happens before the initial afterUpdate
      add_render_callback(() => {
        const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
        // if the component was destroyed immediately
        // it will update the `$$.on_destroy` reference to `null`.
        // the destructured on_destroy may still reference to the old array
        if (component.$$.on_destroy) {
          component.$$.on_destroy.push(...new_on_destroy);
        } else {
          // Edge case - component was destroyed immediately,
          // most likely as a result of a binding initialising
          run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
      });
    }
    after_update.forEach(add_render_callback);
  }
  function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
      flush_render_callbacks($$.after_update);
      run_all($$.on_destroy);
      $$.fragment && $$.fragment.d(detaching);
      // TODO null out other refs, including component.$$ (but need to
      // preserve final state?)
      $$.on_destroy = $$.fragment = null;
      $$.ctx = [];
    }
  }
  function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
      dirty_components.push(component);
      schedule_update();
      component.$$.dirty.fill(0);
    }
    component.$$.dirty[i / 31 | 0] |= 1 << i % 31;
  }
  function init(component, options, instance, create_fragment, not_equal, props, append_styles) {
    let dirty = arguments.length > 7 && arguments[7] !== undefined ? arguments[7] : [-1];
    const parent_component = current_component;
    set_current_component(component);
    const $$ = component.$$ = {
      fragment: null,
      ctx: [],
      // state
      props,
      update: noop,
      not_equal,
      bound: blank_object(),
      // lifecycle
      on_mount: [],
      on_destroy: [],
      on_disconnect: [],
      before_update: [],
      after_update: [],
      context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
      // everything else
      callbacks: blank_object(),
      dirty,
      skip_bound: false,
      root: options.target || parent_component.$$.root
    };
    append_styles && append_styles($$.root);
    let ready = false;
    $$.ctx = instance ? instance(component, options.props || {}, function (i, ret) {
      const value = (arguments.length <= 2 ? 0 : arguments.length - 2) ? arguments.length <= 2 ? undefined : arguments[2] : ret;
      if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
        if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
        if (ready) make_dirty(component, i);
      }
      return ret;
    }) : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
      if (options.hydrate) {
        start_hydrating();
        const nodes = children(options.target);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        $$.fragment && $$.fragment.l(nodes);
        nodes.forEach(detach);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        $$.fragment && $$.fragment.c();
      }
      if (options.intro) transition_in(component.$$.fragment);
      mount_component(component, options.target, options.anchor, options.customElement);
      end_hydrating();
      flush();
    }
    set_current_component(parent_component);
  }
  let SvelteElement;
  if (typeof HTMLElement === 'function') {
    module1.runSetters(SvelteElement = class extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({
          mode: 'open'
        });
      }
      connectedCallback() {
        const {
          on_mount
        } = this.$$;
        this.$$.on_disconnect = on_mount.map(run).filter(is_function);
        // @ts-ignore todo: improve typings
        for (const key in this.$$.slotted) {
          // @ts-ignore todo: improve typings
          this.appendChild(this.$$.slotted[key]);
        }
      }
      attributeChangedCallback(attr, _oldValue, newValue) {
        this[attr] = newValue;
      }
      disconnectedCallback() {
        run_all(this.$$.on_disconnect);
      }
      $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
      }
      $on(type, callback) {
        // TODO should this delegate to addEventListener?
        if (!is_function(callback)) {
          return noop;
        }
        const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
        callbacks.push(callback);
        return () => {
          const index = callbacks.indexOf(callback);
          if (index !== -1) callbacks.splice(index, 1);
        };
      }
      $set($$props) {
        if (this.$$set && !is_empty($$props)) {
          this.$$.skip_bound = true;
          this.$$set($$props);
          this.$$.skip_bound = false;
        }
      }
    }, ["SvelteElement"]);
  }
  /**
   * Base class for Svelte components. Used when dev=false.
   */
  class SvelteComponent {
    $destroy() {
      destroy_component(this, 1);
      this.$destroy = noop;
    }
    $on(type, callback) {
      if (!is_function(callback)) {
        return noop;
      }
      const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
      callbacks.push(callback);
      return () => {
        const index = callbacks.indexOf(callback);
        if (index !== -1) callbacks.splice(index, 1);
      };
    }
    $set($$props) {
      if (this.$$set && !is_empty($$props)) {
        this.$$.skip_bound = true;
        this.$$set($$props);
        this.$$.skip_bound = false;
      }
    }
  }
  function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({
      version: '3.59.2'
    }, detail), {
      bubbles: true
    }));
  }
  function append_dev(target, node) {
    dispatch_dev('SvelteDOMInsert', {
      target,
      node
    });
    append(target, node);
  }
  function append_hydration_dev(target, node) {
    dispatch_dev('SvelteDOMInsert', {
      target,
      node
    });
    append_hydration(target, node);
  }
  function insert_dev(target, node, anchor) {
    dispatch_dev('SvelteDOMInsert', {
      target,
      node,
      anchor
    });
    insert(target, node, anchor);
  }
  function insert_hydration_dev(target, node, anchor) {
    dispatch_dev('SvelteDOMInsert', {
      target,
      node,
      anchor
    });
    insert_hydration(target, node, anchor);
  }
  function detach_dev(node) {
    dispatch_dev('SvelteDOMRemove', {
      node
    });
    detach(node);
  }
  function detach_between_dev(before, after) {
    while (before.nextSibling && before.nextSibling !== after) {
      detach_dev(before.nextSibling);
    }
  }
  function detach_before_dev(after) {
    while (after.previousSibling) {
      detach_dev(after.previousSibling);
    }
  }
  function detach_after_dev(before) {
    while (before.nextSibling) {
      detach_dev(before.nextSibling);
    }
  }
  function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
    const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default) modifiers.push('preventDefault');
    if (has_stop_propagation) modifiers.push('stopPropagation');
    if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
    dispatch_dev('SvelteDOMAddEventListener', {
      node,
      event,
      handler,
      modifiers
    });
    const dispose = listen(node, event, handler, options);
    return () => {
      dispatch_dev('SvelteDOMRemoveEventListener', {
        node,
        event,
        handler,
        modifiers
      });
      dispose();
    };
  }
  function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', {
      node,
      attribute
    });else dispatch_dev('SvelteDOMSetAttribute', {
      node,
      attribute,
      value
    });
  }
  function prop_dev(node, property, value) {
    node[property] = value;
    dispatch_dev('SvelteDOMSetProperty', {
      node,
      property,
      value
    });
  }
  function dataset_dev(node, property, value) {
    node.dataset[property] = value;
    dispatch_dev('SvelteDOMSetDataset', {
      node,
      property,
      value
    });
  }
  function set_data_dev(text, data) {
    data = '' + data;
    if (text.data === data) return;
    dispatch_dev('SvelteDOMSetData', {
      node: text,
      data
    });
    text.data = data;
  }
  function set_data_contenteditable_dev(text, data) {
    data = '' + data;
    if (text.wholeText === data) return;
    dispatch_dev('SvelteDOMSetData', {
      node: text,
      data
    });
    text.data = data;
  }
  function set_data_maybe_contenteditable_dev(text, data, attr_value) {
    if (~contenteditable_truthy_values.indexOf(attr_value)) {
      set_data_contenteditable_dev(text, data);
    } else {
      set_data_dev(text, data);
    }
  }
  function validate_each_argument(arg) {
    if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
      let msg = '{#each} only iterates over array-like objects.';
      if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
        msg += ' You can use a spread to convert this iterable into an array.';
      }
      throw new Error(msg);
    }
  }
  function validate_slots(name, slot, keys) {
    for (const slot_key of Object.keys(slot)) {
      if (!~keys.indexOf(slot_key)) {
        console.warn("<".concat(name, "> received an unexpected slot \"").concat(slot_key, "\"."));
      }
    }
  }
  function validate_dynamic_element(tag) {
    const is_string = typeof tag === 'string';
    if (tag && !is_string) {
      throw new Error('<svelte:element> expects "this" attribute to be a string.');
    }
  }
  function validate_void_dynamic_element(tag) {
    if (tag && is_void(tag)) {
      console.warn("<svelte:element this=\"".concat(tag, "\"> is self-closing and cannot have content."));
    }
  }
  function construct_svelte_component_dev(component, props) {
    const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
    try {
      const instance = new component(props);
      if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
        throw new Error(error_message);
      }
      return instance;
    } catch (err) {
      const {
        message
      } = err;
      if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
        throw new Error(error_message);
      } else {
        throw err;
      }
    }
  }
  /**
   * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
   */
  class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
      if (!options || !options.target && !options.$$inline) {
        throw new Error("'target' is a required option");
      }
      super();
    }
    $destroy() {
      super.$destroy();
      this.$destroy = () => {
        console.warn('Component was already destroyed'); // eslint-disable-line no-console
      };
    }

    $capture_state() {}
    $inject_state() {}
  }
  /**
   * Base class to create strongly typed Svelte components.
   * This only exists for typing purposes and should be used in `.d.ts` files.
   *
   * ### Example:
   *
   * You have component library on npm called `component-library`, from which
   * you export a component called `MyComponent`. For Svelte+TypeScript users,
   * you want to provide typings. Therefore you create a `index.d.ts`:
   * ```ts
   * import { SvelteComponentTyped } from "svelte";
   * export class MyComponent extends SvelteComponentTyped<{foo: string}> {}
   * ```
   * Typing this makes it possible for IDEs like VS Code with the Svelte extension
   * to provide intellisense and to use the component like this in a Svelte file
   * with TypeScript:
   * ```svelte
   * <script lang="ts">
   * 	import { MyComponent } from "component-library";
   * </script>
   * <MyComponent foo={'bar'} />
   * ```
   *
   * #### Why not make this part of `SvelteComponent(Dev)`?
   * Because
   * ```ts
   * class ASubclassOfSvelteComponent extends SvelteComponent<{foo: string}> {}
   * const component: typeof SvelteComponent = ASubclassOfSvelteComponent;
   * ```
   * will throw a type error, so we need to separate the more strictly typed class.
   */
  class SvelteComponentTyped extends SvelteComponentDev {
    constructor(options) {
      super(options);
    }
  }
  function loop_guard(timeout) {
    const start = Date.now();
    return () => {
      if (Date.now() - start > timeout) {
        throw new Error('Infinite loop detected');
      }
    };
  }
}.call(this, module);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/svelte/internal/package.json                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "module": "./index.mjs",
  "main": "./index"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/svelte/package.json                                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "author": {
    "name": "Rich Harris"
  },
  "bugs": {
    "url": "https://github.com/sveltejs/svelte/issues"
  },
  "bundleDependencies": false,
  "deprecated": false,
  "description": "Cybernetically enhanced web apps",
  "devDependencies": {
    "@ampproject/remapping": "^0.3.0",
    "@jridgewell/sourcemap-codec": "^1.4.15",
    "@rollup/plugin-commonjs": "^11.0.0",
    "@rollup/plugin-json": "^6.0.0",
    "@rollup/plugin-node-resolve": "^11.2.1",
    "@rollup/plugin-replace": "^5.0.2",
    "@rollup/plugin-sucrase": "^3.1.0",
    "@rollup/plugin-typescript": "^2.0.1",
    "@rollup/plugin-virtual": "^3.0.1",
    "@sveltejs/eslint-config": "github:sveltejs/eslint-config#v5.8.0",
    "@types/aria-query": "^5.0.1",
    "@types/mocha": "^7.0.0",
    "@types/node": "^8.10.53",
    "@typescript-eslint/eslint-plugin": "^5.29.0",
    "@typescript-eslint/parser": "^5.29.0",
    "acorn": "^8.8.1",
    "agadoo": "^3.0.0",
    "aria-query": "^5.1.3",
    "axobject-query": "^3.1.1",
    "code-red": "^1.0.0",
    "css-tree": "^2.3.1",
    "eslint": "^8.35.0",
    "eslint-plugin-import": "^2.27.0",
    "eslint-plugin-svelte3": "^4.0.0",
    "estree-walker": "^3.0.3",
    "is-reference": "^3.0.1",
    "jsdom": "^15.2.1",
    "kleur": "^4.1.5",
    "locate-character": "^2.0.5",
    "magic-string": "^0.30.0",
    "mocha": "^7.0.0",
    "periscopic": "^3.1.0",
    "puppeteer": "^2.0.0",
    "rollup": "^1.27.14",
    "source-map": "^0.7.4",
    "source-map-support": "^0.5.21",
    "tiny-glob": "^0.2.9",
    "tslib": "^2.5.0",
    "typescript": "^3.7.5",
    "util": "^0.12.5"
  },
  "engines": {
    "node": ">= 8"
  },
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "types": "./types/runtime/index.d.ts",
      "browser": {
        "import": "./index.mjs",
        "require": "./index.js"
      },
      "node": {
        "import": "./ssr.mjs",
        "require": "./ssr.js"
      },
      "import": "./index.mjs",
      "require": "./index.js"
    },
    "./compiler": {
      "types": "./types/compiler/index.d.ts",
      "import": "./compiler.mjs",
      "require": "./compiler.js"
    },
    "./action": {
      "types": "./types/runtime/action/index.d.ts"
    },
    "./animate": {
      "types": "./types/runtime/animate/index.d.ts",
      "import": "./animate/index.mjs",
      "require": "./animate/index.js"
    },
    "./easing": {
      "types": "./types/runtime/easing/index.d.ts",
      "import": "./easing/index.mjs",
      "require": "./easing/index.js"
    },
    "./internal": {
      "types": "./types/runtime/internal/index.d.ts",
      "import": "./internal/index.mjs",
      "require": "./internal/index.js"
    },
    "./motion": {
      "types": "./types/runtime/motion/index.d.ts",
      "import": "./motion/index.mjs",
      "require": "./motion/index.js"
    },
    "./register": {
      "require": "./register.js"
    },
    "./store": {
      "types": "./types/runtime/store/index.d.ts",
      "import": "./store/index.mjs",
      "require": "./store/index.js"
    },
    "./transition": {
      "types": "./types/runtime/transition/index.d.ts",
      "import": "./transition/index.mjs",
      "require": "./transition/index.js"
    },
    "./elements": {
      "types": "./elements/index.d.ts"
    },
    "./ssr": {
      "types": "./types/runtime/index.d.ts",
      "import": "./ssr.mjs",
      "require": "./ssr.js"
    }
  },
  "files": [
    "types",
    "compiler.*",
    "register.js",
    "index.*",
    "ssr.*",
    "internal",
    "store",
    "animate",
    "transition",
    "easing",
    "motion",
    "action",
    "elements",
    "README.md"
  ],
  "homepage": "https://svelte.dev",
  "keywords": [
    "UI",
    "framework",
    "templates",
    "templating"
  ],
  "license": "MIT",
  "main": "index",
  "module": "index.mjs",
  "name": "svelte",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/sveltejs/svelte.git"
  },
  "scripts": {
    "build": "rollup -c && npm run tsd",
    "dev": "rollup -cw",
    "lint": "eslint \"{src,test}/**/*.{ts,js}\" --cache",
    "posttest": "agadoo internal/index.mjs",
    "prepare": "node scripts/skip_in_ci.js npm run build",
    "prepublishOnly": "node check_publish_env.js && npm run lint && npm run build && npm test",
    "quicktest": "mocha --exit",
    "test": "npm run test:unit && npm run test:integration",
    "test:integration": "mocha --exit",
    "test:unit": "mocha --config .mocharc.unit.js --exit",
    "tsd": "node ./generate-type-definitions.js"
  },
  "types": "types/runtime/index.d.ts",
  "version": "3.59.2"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"meteor-node-stubs":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor-node-stubs/package.json                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "meteor-node-stubs",
  "version": "1.2.5",
  "main": "index.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor-node-stubs/index.js                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var map = require("./map.json");
var meteorAliases = {};

Object.keys(map).forEach(function (id) {
  if (typeof map[id] === "string") {
    var aliasParts = module.id.split("/");
    aliasParts.pop();
    aliasParts.push("node_modules", map[id]);
    exports[id] = meteorAliases[id + ".js"] = meteorAliases["node:" + id] =
      aliasParts.join("/");
  } else {
    exports[id] = map[id];
    meteorAliases[id + ".js"] = meteorAliases["node:" + id] = function(){};
  }
});

if (typeof meteorInstall === "function") {
  meteorInstall({
    // Install the aliases into a node_modules directory one level up from
    // the root directory, so that they do not clutter the namespace
    // available to apps and packages.
    "..": {
      node_modules: meteorAliases
    }
  });
}

// If Buffer is not defined globally, but the "buffer" built-in stub is
// installed and can be imported, use it to define global.Buffer so that
// modules like core-util-is/lib/util.js can refer to Buffer without
// crashing application startup.
if (typeof global.Buffer !== "function") {
  try {
    // Use (0, require)(...) to avoid registering a dependency on the
    // "buffer" stub, in case it is not otherwise bundled.
    global.Buffer = (0, require)("buffer").Buffer;
  } catch (ok) {
    // Failure to import "buffer" is fine as long as the Buffer global
    // variable is not used.
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"map.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor-node-stubs/map.json                                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "assert": "assert/",
  "buffer": "buffer/",
  "child_process": null,
  "cluster": null,
  "console": "console-browserify",
  "constants": "constants-browserify",
  "crypto": "../wrappers/crypto.js",
  "dgram": null,
  "dns": null,
  "domain": "domain-browser",
  "events": "events/",
  "fs": null,
  "http": "stream-http",
  "https": "https-browserify",
  "module": "../wrappers/module.js",
  "net": null,
  "os": "os-browserify/browser.js",
  "path": "path-browserify",
  "process": "process/browser.js",
  "punycode": "punycode/",
  "querystring": "querystring-es3/",
  "readline": null,
  "repl": null,
  "stream": "stream-browserify",
  "_stream_duplex": "readable-stream/lib/_stream_duplex.js",
  "_stream_passthrough": "readable-stream/lib/_stream_passthrough.js",
  "_stream_readable": "readable-stream/lib/_stream_readable.js",
  "_stream_transform": "readable-stream/lib/_stream_transform.js",
  "_stream_writable": "readable-stream/lib/_stream_writable.js",
  "string_decoder": "string_decoder/",
  "sys": "util/util.js",
  "timers": "timers-browserify",
  "tls": null,
  "tty": "tty-browserify",
  "url": "url/",
  "util": "util/util.js",
  "vm": "vm-browserify",
  "zlib": "browserify-zlib"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"deps":{"process.js":function module(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor-node-stubs/deps/process.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
require("process/browser.js");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"process":{"browser.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor-node-stubs/node_modules/process/browser.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"@babel":{"runtime":{"helpers":{"objectSpread2.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/objectSpread2.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var defineProperty = require("./defineProperty.js");
function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys(Object(source), !0).forEach(function (key) {
      defineProperty(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
module.exports = _objectSpread2, module.exports.__esModule = true, module.exports["default"] = module.exports;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"defineProperty.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/defineProperty.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var toPropertyKey = require("./toPropertyKey.js");
function _defineProperty(obj, key, value) {
  key = toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"toPropertyKey.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/toPropertyKey.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _typeof = require("./typeof.js")["default"];
var toPrimitive = require("./toPrimitive.js");
function _toPropertyKey(arg) {
  var key = toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}
module.exports = _toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"typeof.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/typeof.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function _typeof(obj) {
  "@babel/helpers - typeof";

  return (module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, module.exports.__esModule = true, module.exports["default"] = module.exports), _typeof(obj);
}
module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"toPrimitive.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/toPrimitive.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _typeof = require("./typeof.js")["default"];
function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
module.exports = _toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"objectWithoutProperties.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/objectWithoutProperties.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var objectWithoutPropertiesLoose = require("./objectWithoutPropertiesLoose.js");
function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}
module.exports = _objectWithoutProperties, module.exports.__esModule = true, module.exports["default"] = module.exports;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"objectWithoutPropertiesLoose.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/objectWithoutPropertiesLoose.js                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;
  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}
module.exports = _objectWithoutPropertiesLoose, module.exports.__esModule = true, module.exports["default"] = module.exports;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".html",
    ".d.ts",
    ".mjs",
    ".ts",
    ".d.ts.map",
    ".css"
  ]
});

var exports = require("/node_modules/meteor/modules/client.js");

/* Exports */
Package._define("modules", exports, {
  meteorInstall: meteorInstall
});

})();
