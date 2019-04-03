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
import getDescriptors from "object.getownpropertydescriptors";
import { getMutatedActions as getProxiedActions } from "./actions";
import { _state, _mutations, _getters, _proxy, _map, _store, _namespacedPath, _actions_register, _actions, _submodule, _module, _target } from "./symbols";
var VuexModule = /** @class */ (function () {
    function VuexModule() {
    }
    VuexModule.CreateSubModule = function (SubModule) {
        return {
            type: _submodule,
            store: SubModule,
        };
    };
    VuexModule.CreateProxy = function ($store, cls) {
        return createProxy($store, cls, _proxy);
    };
    VuexModule.ExtractVuexModule = function (cls) {
        return {
            namespaced: extractNameSpaced(cls),
            state: extractState(cls),
            mutations: cls.prototype[_mutations],
            actions: extractActions(cls),
            getters: cls.prototype[_getters],
            modules: cls.prototype[_module],
        };
    };
    return VuexModule;
}());
export { VuexModule };
function extractNameSpaced(cls) {
    var namespacedPath = cls.prototype[_namespacedPath] || "";
    return namespacedPath.length > 0 ? true : false;
}
function extractState(cls) {
    switch (cls.prototype[_target]) {
        case "core": return cls.prototype[_state];
        case "nuxt": return function () { return cls.prototype[_state]; };
        default: return cls.prototype[_state];
    }
}
function extractActions(cls) {
    var proxiedActions = getProxiedActions(cls);
    var rawActions = cls.prototype[_actions];
    var actions = __assign({}, proxiedActions, rawActions);
    //Update prototype with mutated actions.
    cls.prototype[_actions] = actions;
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
export function createProxy($store, cls, cachePath) {
    var rtn = {};
    var path = cls.prototype[_namespacedPath];
    var prototype = cls.prototype;
    if (prototype[cachePath] === undefined) { // Proxy has not been cached.
        Object.getOwnPropertyNames(prototype[_getters] || {}).map(function (name) {
            Object.defineProperty(rtn, name, {
                get: function () { return $store.getters[path + name]; }
            });
        });
        Object.getOwnPropertyNames(prototype[_state] || {}).map(function (name) {
            // If state has already been defined as a getter, do not redefine.
            if (rtn.hasOwnProperty(name))
                return;
            if (prototype[_submodule] && prototype[_submodule].hasOwnProperty(name)) {
                Object.defineProperty(rtn, name, {
                    value: prototype[_state][name],
                    writable: true,
                });
            }
            else {
                Object.defineProperty(rtn, name, {
                    get: function () { return getValueByPath($store.state, path + name); }
                });
            }
        });
        Object.getOwnPropertyNames(prototype[_mutations] || {}).map(function (name) {
            rtn[name] = function (payload) {
                $store.commit(path + name, payload);
            };
        });
        Object.getOwnPropertyNames(prototype[_actions] || {}).map(function (name) {
            rtn[name] = function (payload) {
                return $store.dispatch(path + name, payload);
            };
        });
        Object.getOwnPropertyNames(prototype[_submodule] || {}).map(function (name) {
            var vxmodule = cls.prototype[_submodule][name];
            vxmodule.prototype[_namespacedPath] = path + name + "/";
            rtn[name] = vxmodule.CreateProxy($store, vxmodule);
        });
        // Cache proxy.
        prototype[_proxy] = rtn;
    }
    else {
        // Use cached proxy.
        rtn = prototype[cachePath];
    }
    return rtn;
}
var defaultModuleOptions = {
    namespacedPath: "",
    target: "core",
};
export function Module(_a) {
    var _b = _a === void 0 ? defaultModuleOptions : _a, _c = _b.namespacedPath, namespacedPath = _c === void 0 ? "" : _c, _d = _b.target, target = _d === void 0 ? "core" : _d;
    return function (_module) {
        var targetInstance = new _module();
        var states = Object.getOwnPropertyNames(targetInstance);
        var stateObj = {};
        if (_module.prototype[_map] === undefined)
            _module.prototype[_map] = [];
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
            _module.prototype[_map].push({ value: stateField, type: "state" });
        }
        _module.prototype[_state] = stateObj;
        var fields = getDescriptors(_module.prototype);
        if (_module.prototype[_getters] === undefined)
            _module.prototype[_getters] = {};
        var _loop_1 = function (field) {
            var getterField = fields[field].get;
            if (getterField) {
                var func = function (state) {
                    return getterField.call(state);
                };
                _module.prototype[_getters][field] = func;
            }
        };
        for (var field in fields) {
            _loop_1(field);
        }
        _module.prototype[_namespacedPath] = namespacedPath;
        _module.prototype[_target] = target;
    };
}
function subModuleObjectIsFound(stateValue) {
    if (stateValue === null)
        return false;
    return (typeof stateValue === "object") && (stateValue.type === _submodule);
}
function handleSubModule(target, stateField, stateValue) {
    var _a, _b;
    if (target.prototype[_module] === undefined) {
        target.prototype[_module] = (_a = {},
            _a[stateField] = stateValue.store.ExtractVuexModule(stateValue.store),
            _a);
        target.prototype[_submodule] = (_b = {},
            _b[stateField] = stateValue.store,
            _b);
    }
    else {
        target.prototype[_module][stateField] = stateValue.store.ExtractVuexModule(stateValue.store);
        target.prototype[_submodule][stateField] = stateValue.store;
    }
}
//# sourceMappingURL=module.js.map