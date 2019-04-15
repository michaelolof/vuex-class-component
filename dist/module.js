"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var object_getownpropertydescriptors_1 = __importDefault(require("object.getownpropertydescriptors"));
var actions_1 = require("./actions");
var symbols_1 = require("./symbols");
var VuexModule = /** @class */ (function () {
    function VuexModule() {
    }
    VuexModule.CreateSubModule = function (SubModule) {
        return {
            type: symbols_1._submodule,
            store: SubModule,
        };
    };
    VuexModule.CreateProxy = function ($store, cls) {
        return createProxy($store, cls, cls.prototype[symbols_1._namespacedPath], symbols_1._proxy);
    };
    VuexModule.ClearProxyCache = function (cls) {
        var prototype = cls.prototype;
        delete prototype[symbols_1._proxy];
        delete prototype[symbols_1._contextProxy];
        Object.getOwnPropertyNames(prototype[symbols_1._submodule] || {}).map(function (name) {
            var vxmodule = cls.prototype[symbols_1._submodule][name];
            vxmodule.ClearProxyCache(vxmodule);
        });
    };
    VuexModule.ExtractVuexModule = function (cls) {
        return {
            namespaced: extractNameSpaced(cls),
            state: extractState(cls),
            mutations: cls.prototype[symbols_1._mutations],
            actions: extractActions(cls),
            getters: cls.prototype[symbols_1._getters],
            modules: cls.prototype[symbols_1._module],
        };
    };
    return VuexModule;
}());
exports.VuexModule = VuexModule;
function extractNameSpaced(cls) {
    var namespacedPath = cls.prototype[symbols_1._namespacedPath] || "";
    return namespacedPath.length > 0 ? true : false;
}
function extractState(cls) {
    switch (cls.prototype[symbols_1._target]) {
        case "core": return __assign({}, cls.prototype[symbols_1._state]);
        case "nuxt": return function () { return (__assign({}, cls.prototype[symbols_1._state])); };
        default: return __assign({}, cls.prototype[symbols_1._state]);
    }
}
function extractActions(cls) {
    var proxiedActions = actions_1.getMutatedActions(cls);
    var rawActions = cls.prototype[symbols_1._actions];
    var actions = __assign({}, proxiedActions, rawActions);
    //Update prototype with mutated actions.
    cls.prototype[symbols_1._actions] = actions;
    return actions;
}
function getValueByPath(object, path) {
    var pathArray = path.split('/');
    var value = object;
    for (var _i = 0, pathArray_1 = pathArray; _i < pathArray_1.length; _i++) {
        var part = pathArray_1[_i];
        value = value[part];
    }
    return value;
}
function createProxy($store, cls, namespacedPath, cachePath) {
    var rtn = {};
    var path = namespacedPath;
    var prototype = cls.prototype;
    if (prototype[cachePath] === undefined) { // Proxy has not been cached.
        Object.getOwnPropertyNames(prototype[symbols_1._getters] || {}).map(function (name) {
            Object.defineProperty(rtn, name, {
                get: function () { return $store.getters[path + name]; }
            });
        });
        Object.getOwnPropertyNames(prototype[symbols_1._state] || {}).map(function (name) {
            // If state has already been defined as a getter, do not redefine.
            if (rtn.hasOwnProperty(name))
                return;
            if (prototype[symbols_1._submodule] && prototype[symbols_1._submodule].hasOwnProperty(name)) {
                Object.defineProperty(rtn, name, {
                    value: prototype[symbols_1._state][name],
                    writable: true,
                });
            }
            else {
                Object.defineProperty(rtn, name, {
                    get: function () { return getValueByPath($store.state, path + name); }
                });
            }
        });
        Object.getOwnPropertyNames(prototype[symbols_1._mutations] || {}).map(function (name) {
            rtn[name] = function (payload) {
                $store.commit(path + name, payload);
            };
        });
        Object.getOwnPropertyNames(prototype[symbols_1._actions] || {}).map(function (name) {
            rtn[name] = function (payload) {
                return $store.dispatch(path + name, payload);
            };
        });
        Object.getOwnPropertyNames(prototype[symbols_1._submodule] || {}).map(function (name) {
            var vxmodule = cls.prototype[symbols_1._submodule][name];
            vxmodule.prototype[symbols_1._namespacedPath] = path + name + "/";
            rtn[name] = vxmodule.CreateProxy($store, vxmodule);
        });
        // Cache proxy.
        prototype[symbols_1._proxy] = rtn;
    }
    else {
        // Use cached proxy.
        rtn = prototype[cachePath];
    }
    return rtn;
}
exports.createProxy = createProxy;
var defaultModuleOptions = {
    namespacedPath: "",
    target: "core",
};
function Module(_a) {
    var _b = _a === void 0 ? defaultModuleOptions : _a, _c = _b.namespacedPath, namespacedPath = _c === void 0 ? "" : _c, _d = _b.target, target = _d === void 0 ? "core" : _d;
    return function (_module) {
        var targetInstance = new _module();
        var states = Object.getOwnPropertyNames(targetInstance);
        var stateObj = {};
        if (_module.prototype[symbols_1._map] === undefined)
            _module.prototype[symbols_1._map] = [];
        for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
            var stateField = states_1[_i];
            var stateValue = targetInstance[stateField];
            if (stateValue === undefined)
                continue;
            if (subModuleObjectIsFound(stateValue)) {
                handleSubModule(_module, stateField, stateValue);
                continue;
            }
            stateObj[stateField] = stateValue;
            _module.prototype[symbols_1._map].push({ value: stateField, type: "state" });
        }
        _module.prototype[symbols_1._state] = stateObj;
        var fields = object_getownpropertydescriptors_1.default(_module.prototype);
        if (_module.prototype[symbols_1._getters] === undefined)
            _module.prototype[symbols_1._getters] = {};
        var _loop_1 = function (field) {
            var getterField = fields[field].get;
            if (getterField) {
                var func = function (state) {
                    return getterField.call(state);
                };
                _module.prototype[symbols_1._getters][field] = func;
            }
        };
        for (var field in fields) {
            _loop_1(field);
        }
        _module.prototype[symbols_1._namespacedPath] = namespacedPath;
        _module.prototype[symbols_1._target] = target;
    };
}
exports.Module = Module;
function subModuleObjectIsFound(stateValue) {
    if (stateValue === null)
        return false;
    return (typeof stateValue === "object") && (stateValue.type === symbols_1._submodule);
}
function handleSubModule(target, stateField, stateValue) {
    var _a, _b;
    if (target.prototype[symbols_1._module] === undefined) {
        target.prototype[symbols_1._module] = (_a = {},
            _a[stateField] = stateValue.store.ExtractVuexModule(stateValue.store),
            _a);
        target.prototype[symbols_1._submodule] = (_b = {},
            _b[stateField] = stateValue.store,
            _b);
    }
    else {
        target.prototype[symbols_1._module][stateField] = stateValue.store.ExtractVuexModule(stateValue.store);
        target.prototype[symbols_1._submodule][stateField] = stateValue.store;
    }
}
//# sourceMappingURL=module.js.map