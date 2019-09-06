import { extractVuexModule } from "./module";
import { toCamelCase, getClassPath } from "./utils";
export function isFieldASubModule(instance, field) {
    return (instance[field] != null &&
        typeof instance[field] === "object" &&
        instance[field]["__submodule_type__"] === "submodule");
}
export function extractVuexSubModule(instance, field) {
    var subModuleClass = instance[field]["__submodule_class__"];
    var extract = extractVuexModule(subModuleClass);
    var path = getClassPath(subModuleClass.prototype.__namespacedPath__) || toCamelCase(subModuleClass.name);
    return extract[path];
}
export function createSubModule(Cls) {
    var sub = {
        __submodule_type__: "submodule",
        __submodule_class__: Cls,
    };
    //@ts-ignore
    return sub;
}
//# sourceMappingURL=submodule.js.map