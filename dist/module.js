"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actions_1 = require("./actions");
var _1 = require(".");
var fetchStateFromClassInstance = function (obj) { return Object.getOwnPropertyNames(obj).filter(function (v) { return v === "__store__" ? false : true; }); };
var VuexModule = /** @class */ (function () {
    function VuexModule() {
    }
    VuexModule.CreatedProxy = function ($store, cls) {
        var rtn = {};
        var path = cls.prototype[_1._namespacedPath];
        var prototype = this.prototype;
        if (prototype[_1._proxy] === undefined) { // Proxy has not been cached.
            Object.getOwnPropertyNames(prototype[_1._getters] || {}).map(function (name) {
                Object.defineProperty(rtn, name, {
                    get: function () { return $store.getters[path + name]; }
                });
            });
            Object.getOwnPropertyNames(prototype[_1._mutations] || {}).map(function (name) {
                rtn[name] = function (payload) {
                    $store.commit(path + name, payload);
                };
            });
            prototype[_1._actions_register].map(function (reg) {
                rtn[reg.name] = function (payload) {
                    return $store.dispatch(path + reg.name, payload);
                };
            });
            // Cache proxy.
            prototype[_1._proxy] = rtn;
        }
        else {
            // Use cached proxy.
            rtn = prototype[_1._proxy];
        }
        return rtn;
    };
    VuexModule.ExtractVuexModule = function (cls) {
        var actions = actions_1.getActions(cls);
        var mod = {
            namespaced: cls.prototype[_1._namespacedPath].length > 0 ? true : false,
            state: cls.prototype[_1._state],
            mutations: cls.prototype[_1._mutations],
            actions: actions,
            getters: cls.prototype[_1._getters],
        };
        return mod;
    };
    return VuexModule;
}());
exports.VuexModule = VuexModule;
var defaultOptions = {
    namespacedPath: ""
};
function Module(options) {
    if (options === void 0) { options = defaultOptions; }
    return function (target) {
        var targetInstance = new target();
        var states = fetchStateFromClassInstance(targetInstance);
        var stateObj = {};
        if (target.prototype[_1._map] === undefined)
            target.prototype[_1._map] = [];
        for (var _i = 0, states_1 = states; _i < states_1.length; _i++) {
            var state = states_1[_i];
            // @ts-ignore
            stateObj[state] = targetInstance[state];
            target.prototype[_1._map].push({ value: state, type: "state" });
        }
        target.prototype[_1._state] = stateObj;
        var fields = Object.getOwnPropertyDescriptors(target.prototype);
        if (target.prototype[_1._getters] === undefined)
            target.prototype[_1._getters] = {};
        var _loop_1 = function (field) {
            var getterField = fields[field].get;
            if (getterField) {
                var func = function (state) {
                    return getterField.call(state);
                };
                target.prototype[_1._getters][field] = func;
            }
        };
        for (var field in fields) {
            _loop_1(field);
        }
        if (options) {
            target.prototype[_1._namespacedPath] = options.namespacedPath;
        }
    };
}
exports.Module = Module;
function createProxyProperty(cls, $this) {
    Object.getOwnPropertyNames(cls.prototype[_1._getters]).map(function (gettername) {
        $this.$store.getters[gettername];
    });
}
//# sourceMappingURL=module.js.map