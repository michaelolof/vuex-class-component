import { createModule, extractVuexModule } from "./module";
import { createProxy, clearProxyCache } from './proxy';
import { createSubModule } from './submodule';
import { getClassPath, toCamelCase } from "./utils";
var defaultModuleOptions = {
    namespacedPath: "",
    target: "core",
};
var VuexModule = /** @class */ (function () {
    function VuexModule() {
    }
    return VuexModule;
}());
export function Module(_a) {
    var _b = _a === void 0 ? defaultModuleOptions : _a, _c = _b.namespacedPath, namespacedPath = _c === void 0 ? "" : _c, _d = _b.target, target = _d === void 0 ? "core" : _d;
    return function (module) {
        var VuexClass = module;
        VuexClass.prototype.__options__ = {
            namespaced: namespacedPath,
            target: target === "nuxt" ? target : undefined,
        };
        var mod = createModule({
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
var LegacyVuexModule = /** @class */ (function () {
    function LegacyVuexModule() {
    }
    LegacyVuexModule.ExtractVuexModule = function (cls) {
        var VuexClass = cls;
        var vxmodule = extractVuexModule(VuexClass);
        var path = getClassPath(VuexClass.prototype.__namespacedPath__) || toCamelCase(VuexClass.name);
        return vxmodule[path];
    };
    LegacyVuexModule.CreateProxy = function ($store, cls) {
        return createProxy($store, cls);
    };
    LegacyVuexModule.CreateSubModule = function (cls) {
        return createSubModule(cls);
    };
    LegacyVuexModule.ClearProxyCache = function (cls) {
        return clearProxyCache(cls);
    };
    return LegacyVuexModule;
}());
export { LegacyVuexModule };
//# sourceMappingURL=module.legacy.js.map