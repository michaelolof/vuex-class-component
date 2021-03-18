"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refineNamespacedPath = exports.getClassPath = exports.toCamelCase = void 0;
function toCamelCase(str) {
    return str[0].toLocaleLowerCase() + str.substring(1);
}
exports.toCamelCase = toCamelCase;
function getClassPath(path) {
    if (!path) {
        return '';
    }
    var arr = path.split("/");
    return arr[arr.length - 1];
}
exports.getClassPath = getClassPath;
function refineNamespacedPath(path) {
    var rtn = path.split("/").filter(function (str) { return str.trim().length > 0; }).join("/").trim();
    if (rtn.length > 0)
        return rtn + "/";
    else
        return rtn;
}
exports.refineNamespacedPath = refineNamespacedPath;
//# sourceMappingURL=utils.js.map