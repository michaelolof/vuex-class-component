var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { getMutatedActions as getProxiedActions } from "./actions";
import { _state, _mutations, _getters, _proxy, _map, _store, _namespacedPath, _actions_register, _actions, _submodule, _module } from "./symbols";
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
        var proxiedActions = getProxiedActions(cls);
        var rawActions = cls.prototype[_actions];
        var actions = __assign({}, proxiedActions, rawActions);
        //Update prototype with mutated actions.
        cls.prototype[_actions] = actions;
        var mod = {
            namespaced: cls.prototype[_namespacedPath].length > 0 ? true : false,
            state: cls.prototype[_state],
            mutations: cls.prototype[_mutations],
            actions: actions,
            getters: cls.prototype[_getters],
            modules: cls.prototype[_module],
        };
        return mod;
    };
    return VuexModule;
}());
export { VuexModule };
export function createProxy($store, cls, cachePath) {
    var rtn = {};
    var path = cls.prototype[_namespacedPath];
    var prototype = cls.prototype;
    if (prototype[cachePath] === undefined) { // Proxy has not been cached.
        Object.getOwnPropertyNames(prototype[_state] || {}).map(function (name) {
            Object.defineProperty(rtn, name, {
                value: prototype[_state][name],
                writable: true,
            });
        });
        Object.getOwnPropertyNames(prototype[_getters] || {}).map(function (name) {
            Object.defineProperty(rtn, name, {
                get: function () { return $store.getters[path + name]; }
            });
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
        Object.getOwnPropertyNames(cls.prototype[_submodule] || {}).map(function (name) {
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
var defaultOptions = {
    namespacedPath: ""
};
export function Module(options) {
    if (options === void 0) { options = defaultOptions; }
    return function (target) {
        var targetInstance = new target();
        var states = Object.getOwnPropertyNames(targetInstance);
        var stateObj = {};
        if (target.prototype[_map] === undefined)
            target.prototype[_map] = [];
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
            target.prototype[_map].push({ value: stateField, type: "state" });
        }
        target.prototype[_state] = stateObj;
        var fields = Object.getOwnPropertyDescriptors(target.prototype);
        if (target.prototype[_getters] === undefined)
            target.prototype[_getters] = {};
        var _loop_1 = function (field) {
            var getterField = fields[field].get;
            if (getterField) {
                var func = function (state) {
                    return getterField.call(state);
                };
                target.prototype[_getters][field] = func;
            }
        };
        for (var field in fields) {
            _loop_1(field);
        }
        if (options)
            target.prototype[_namespacedPath] = options.namespacedPath;
    };
}
function subModuleObjectIsFound(stateValue) {
    if (stateValue === null)
        return false;
    return (typeof stateValue === "object") && (stateValue.type === _submodule);
}
function handleSubModule(target, stateField, stateValue) {
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
    var _a, _b;
}
//# sourceMappingURL=module.js.map