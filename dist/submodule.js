"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSubModule = exports.extractVuexSubModule = exports.isFieldASubModule = void 0;
var module_1 = require("./module");
var utils_1 = require("./utils");
function isFieldASubModule(instance, field) {
    return (instance[field] != null &&
        typeof instance[field] === "object" &&
        instance[field]["__submodule_type__"] === "submodule");
}
exports.isFieldASubModule = isFieldASubModule;
function extractVuexSubModule(instance, field) {
    var subModuleClass = instance[field]["__submodule_class__"];
    var extract = module_1.extractVuexModule(subModuleClass);
    var path = utils_1.getClassPath(subModuleClass.prototype.__namespacedPath__) || utils_1.toCamelCase(subModuleClass.name);
    return extract[path];
}
exports.extractVuexSubModule = extractVuexSubModule;
function createSubModule(Cls) {
    var sub = {
        __submodule_type__: "submodule",
        __submodule_class__: Cls,
    };
    //@ts-ignore
    return sub;
}
exports.createSubModule = createSubModule;
//# sourceMappingURL=submodule.js.map