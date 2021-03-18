"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegacyVuexModule = exports.Module = void 0;
var module_1 = require("./module");
var proxy_1 = require("./proxy");
var submodule_1 = require("./submodule");
var utils_1 = require("./utils");
var defaultModuleOptions = {
    namespacedPath: "",
    target: "core",
};
var VuexModule = /** @class */ (function () {
    function VuexModule() {
    }
    return VuexModule;
}());
function Module(_a) {
    var _b = _a === void 0 ? defaultModuleOptions : _a, _c = _b.namespacedPath, namespacedPath = _c === void 0 ? "" : _c, _d = _b.target, target = _d === void 0 ? "core" : _d;
    return function (module) {
        var VuexClass = module;
        VuexClass.prototype.__options__ = {
            namespaced: namespacedPath,
            target: target === "nuxt" ? target : undefined,
        };
        var mod = module_1.createModule({
            target: VuexClass.prototype.__options__ && VuexClass.prototype.__options__.target,
            namespaced: VuexClass.prototype.__options__ && VuexClass.prototype.__options__.namespaced,
            strict: true,
        });
        // Add all fields in mod prototype without replacing
        for (var field in mod.prototype) {
            //@ts-ignore
            if (VuexClass.prototype[field])
                continue;
            //@ts-ignore
            VuexClass.prototype[field] = mod.prototype[field];
        }
    };
}
exports.Module = Module;
var LegacyVuexModule = /** @class */ (function () {
    function LegacyVuexModule() {
    }
    LegacyVuexModule.ExtractVuexModule = function (cls) {
        var VuexClass = cls;
        var vxmodule = module_1.extractVuexModule(VuexClass);
        var path = utils_1.getClassPath(VuexClass.prototype.__namespacedPath__) || utils_1.toCamelCase(VuexClass.name);
        return vxmodule[path];
    };
    LegacyVuexModule.CreateProxy = function ($store, cls) {
        return proxy_1.createProxy($store, cls);
    };
    LegacyVuexModule.CreateSubModule = function (cls) {
        return submodule_1.createSubModule(cls);
    };
    LegacyVuexModule.ClearProxyCache = function (cls) {
        return proxy_1.clearProxyCache(cls);
    };
    return LegacyVuexModule;
}());
exports.LegacyVuexModule = LegacyVuexModule;
//# sourceMappingURL=module.legacy.js.map