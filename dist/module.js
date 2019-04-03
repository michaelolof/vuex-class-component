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
        // @ts-ignore
        return {
            type: symbols_1._submodule,
            store: SubModule,
        };
    };
    VuexModule.CreateProxy = function ($store, cls) {
        return createProxy($store, cls, symbols_1._proxy);
    };
    VuexModule.ExtractVuexModule = function (cls, target) {
        if (target === void 0) { target = "core"; }
        return {
            namespaced: cls.prototype[symbols_1._namespacedPath].length > 0 ? true : false,
            state: extractState(cls, target),
            mutations: cls.prototype[symbols_1._mutations],
            actions: extractActions(cls),
            getters: cls.prototype[symbols_1._getters],
            modules: cls.prototype[symbols_1._module],
        };
    };
    return VuexModule;
}());
exports.VuexModule = VuexModule;
function extractState(cls, target) {
    if (target === void 0) { target = "core"; }
    switch (target) {
        case "core": return cls.prototype[symbols_1._state];
        case "nuxt": return function () { return cls.prototype[symbols_1._state]; };
        default: return cls.prototype[symbols_1._state];
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
function createProxy($store, cls, cachePath) {
    var rtn = {};
    var path = cls.prototype[symbols_1._namespacedPath];
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
        Object.getOwnPropertyNames(cls.prototype[symbols_1._submodule] || {}).map(function (name) {
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
var defaultOptions = {
    namespacedPath: ""
};
function Module(options) {
    if (options === void 0) { options = defaultOptions; }
    return function (target) {
        var targetInstance = new target();
        var states = Object.getOwnPropertyNames(targetInstance);
        var stateObj = {};
        if (target.prototype[symbols_1._map] === undefined)
            target.prototype[symbols_1._map] = [];
        for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
            var stateField = states_1[_i];
            // @ts-ignore
            var stateValue = targetInstance[stateField];
            if (stateValue === undefined)
                continue;
            if (subModuleObjectIsFound(stateValue)) {
                handleSubModule(target, stateField, stateValue);
                continue;
            }
            stateObj[stateField] = stateValue;
            target.prototype[symbols_1._map].push({ value: stateField, type: "state" });
        }
        target.prototype[symbols_1._state] = stateObj;
        var fields = object_getownpropertydescriptors_1.default(target.prototype);
        if (target.prototype[symbols_1._getters] === undefined)
            target.prototype[symbols_1._getters] = {};
        var _loop_1 = function (field) {
            var getterField = fields[field].get;
            if (getterField) {
                var func = function (state) {
                    return getterField.call(state);
                };
                target.prototype[symbols_1._getters][field] = func;
            }
        };
        for (var field in fields) {
            _loop_1(field);
        }
        if (options)
            target.prototype[symbols_1._namespacedPath] = options.namespacedPath;
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